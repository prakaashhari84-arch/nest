import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  POINT_AWARDS,
  BADGES_CATALOG,
  COSMETICS_CATALOG,
} from '@/lib/gamification';

/**
 * GET /api/gamification?childId=...
 * Returns calculated balance (sum of PointsLedger), StreakRecord, ChildBadges, Purchases.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('childId') || 'user_child_01';

    // 1. Calculate dynamic points balance from ledger
    let balance = 0;
    let ledgerEntries: any[] = [];
    let streakRecord: any = null;
    let earnedBadges: any[] = [];
    let purchases: any[] = [];

    if (prisma?.pointsLedger) {
      try {
        const ledgerAgg = await prisma.pointsLedger.aggregate({
          where: { childId },
          _sum: { amount: true },
        });
        balance = ledgerAgg._sum.amount ?? 0;

        ledgerEntries = await prisma.pointsLedger.findMany({
          where: { childId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        streakRecord = await prisma.streakRecord.findUnique({
          where: { childId },
        });

        earnedBadges = await prisma.childBadge.findMany({
          where: { childId },
          include: { badge: true },
        });

        purchases = await prisma.childCosmeticPurchase.findMany({
          where: { childId },
          include: { cosmeticItem: true },
        });
      } catch (dbErr) {
        console.warn('Prisma query fallback in /api/gamification:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        childId,
        pointsBalance: balance,
        streakRecord: streakRecord || {
          childId,
          currentStreak: 3,
          longestStreak: 5,
          lastActiveDate: new Date().toISOString(),
        },
        ledger: ledgerEntries,
        badgesCatalog: BADGES_CATALOG,
        earnedBadges,
        cosmeticsCatalog: COSMETICS_CATALOG,
        purchases,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve gamification state' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gamification
 * Server-side point awarding and streak updating (Never trust arbitrary client points)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { childId, action, reasonKey, cosmeticItemId } = body;

    if (!childId) {
      return NextResponse.json(
        { success: false, error: 'childId is required' },
        { status: 400 }
      );
    }

    // ACTION: AWARD POINTS
    if (action === 'AWARD_POINTS') {
      const awardRule = POINT_AWARDS[reasonKey as string];
      if (!awardRule) {
        return NextResponse.json(
          { success: false, error: `Invalid point award reason: ${reasonKey}` },
          { status: 400 }
        );
      }

      const pointsToAward = awardRule.amount;

      // 1. Insert into PointsLedger
      let newEntry: any = null;
      let totalBalance = pointsToAward;

      if (prisma?.pointsLedger) {
        try {
          newEntry = await prisma.pointsLedger.create({
            data: {
              childId,
              amount: pointsToAward,
              reason: reasonKey,
            },
          });

          const agg = await prisma.pointsLedger.aggregate({
            where: { childId },
            _sum: { amount: true },
          });
          totalBalance = agg._sum.amount ?? pointsToAward;

          // 2. Update StreakRecord server-side
          const existingStreak = await prisma.streakRecord.findUnique({
            where: { childId },
          });

          const todayStr = new Date().toISOString().split('T')[0];
          let updatedStreak = existingStreak?.currentStreak || 1;
          let longestStreak = existingStreak?.longestStreak || 1;

          if (existingStreak && existingStreak.lastActiveDate) {
            const lastDate = new Date(existingStreak.lastActiveDate).toISOString().split('T')[0];
            if (lastDate !== todayStr) {
              const diffDays = Math.round(
                (new Date(todayStr).getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24)
              );
              if (diffDays === 1) {
                updatedStreak += 1;
              } else if (diffDays > 1) {
                updatedStreak = 1;
              }
              longestStreak = Math.max(longestStreak, updatedStreak);

              await prisma.streakRecord.update({
                where: { childId },
                data: {
                  currentStreak: updatedStreak,
                  longestStreak,
                  lastActiveDate: new Date(),
                },
              });
            }
          } else {
            await prisma.streakRecord.upsert({
              where: { childId },
              create: {
                childId,
                currentStreak: 1,
                longestStreak: 1,
                lastActiveDate: new Date(),
              },
              update: {
                currentStreak: 1,
                lastActiveDate: new Date(),
              },
            });
          }
        } catch (dbErr) {
          console.warn('Prisma DB error in award points:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          awarded: pointsToAward,
          reason: awardRule.label,
          newBalance: totalBalance,
        },
      });
    }

    // ACTION: PURCHASE COSMETIC
    if (action === 'PURCHASE_COSMETIC') {
      const item = COSMETICS_CATALOG.find((c) => c.id === cosmeticItemId);
      if (!item) {
        return NextResponse.json(
          { success: false, error: 'Item not found in cosmetic catalog' },
          { status: 404 }
        );
      }

      if (prisma?.pointsLedger) {
        try {
          const agg = await prisma.pointsLedger.aggregate({
            where: { childId },
            _sum: { amount: true },
          });
          const balance = agg._sum.amount ?? 0;

          if (balance < item.costPoints) {
            return NextResponse.json(
              {
                success: false,
                error: `Insufficient points. Required: ${item.costPoints}, Available: ${balance}`,
              },
              { status: 400 }
            );
          }

          // Insert negative PointsLedger entry
          await prisma.pointsLedger.create({
            data: {
              childId,
              amount: -item.costPoints,
              reason: `cosmetic_purchase:${item.name}`,
            },
          });

          // Insert ChildCosmeticPurchase record
          await prisma.childCosmeticPurchase.create({
            data: {
              childId,
              cosmeticItemId: item.id,
            },
          });

          const newAgg = await prisma.pointsLedger.aggregate({
            where: { childId },
            _sum: { amount: true },
          });

          return NextResponse.json({
            success: true,
            data: {
              itemPurchased: item,
              newBalance: newAgg._sum.amount ?? 0,
            },
          });
        } catch (dbErr) {
          console.warn('Prisma error in purchase:', dbErr);
        }
      }
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
