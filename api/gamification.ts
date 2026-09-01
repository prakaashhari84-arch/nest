import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;
function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export const POINT_AWARDS: Record<string, { amount: number; label: string }> = {
  word_scramble_correct: { amount: 20, label: 'Word Scramble Solved' },
  memory_match_complete: { amount: 20, label: 'Memory Game Won' },
  story_chapter_complete: { amount: 15, label: 'Story Chapter Read' },
  mood_checkin: { amount: 10, label: 'Daily Mood Check-In' },
  places_checkin: { amount: 10, label: 'Your Places Check-In' },
  daily_prompt_reflection: { amount: 10, label: 'Daily Thought Shared' },
  first_onboarding: { amount: 100, label: 'Explorer Welcome Bonus' },
};

export const BADGES_CATALOG = [
  { id: 'badge_first_story', key: 'first_story', name: 'First Story', description: 'Completed your first cosmic adventure chapter.', iconKey: 'book-open', iconEmoji: '📖', category: 'story' },
  { id: 'badge_quiz_pro', key: 'quiz_pro', name: 'Quiz Pro', description: 'Solved a daily word puzzle or memory challenge.', iconKey: 'trophy', iconEmoji: '🎯', category: 'games' },
  { id: 'badge_7_day', key: 'seven_day_streak', name: '7-Day Champion', description: 'Kept a 7-day daily check-in streak alive!', iconKey: 'flame', iconEmoji: '⚡', category: 'streak', milestoneStreak: 7 },
  { id: 'badge_14_day', key: 'fourteen_day_streak', name: 'Two-Week Star', description: 'Reached an epic 14-day streak of daily check-ins.', iconKey: 'sparkles', iconEmoji: '🌟', category: 'streak', milestoneStreak: 14 },
  { id: 'badge_30_day', key: 'thirty_day_streak', name: '30-Day Master', description: 'Master of consistency! A full month of checking in.', iconKey: 'crown', iconEmoji: '👑', category: 'streak', milestoneStreak: 30 },
  { id: 'badge_bookworm', key: 'bookworm', name: 'Bookworm', description: 'Completed 3 or more adventure story chapters.', iconKey: 'library', iconEmoji: '📚', category: 'story' },
  { id: 'badge_places', key: 'place_explorer', name: 'Place Explorer', description: 'Checked in on how your everyday places feel.', iconKey: 'map-pin', iconEmoji: '📍', category: 'places' },
  { id: 'badge_mindful', key: 'mindful_friend', name: 'Mindful Friend', description: 'Shared 5 or more daily mood reflections.', iconKey: 'heart', iconEmoji: '💛', category: 'reflection' },
];

export const COSMETICS_CATALOG = [
  { id: 'cosmetic_crown', name: 'Starlight Crown', costPoints: 40, category: 'accessory', iconEmoji: '👑', themeValue: 'crown', description: 'A glowing golden tiara to crown your companion.' },
  { id: 'cosmetic_cosmic_aura', name: 'Cosmic Aura', costPoints: 60, category: 'aura', iconEmoji: '🌌', themeValue: 'cosmic_aura', description: 'A deep nebula glow that softly shimmers around your mascot.' },
  { id: 'cosmetic_cozy_scarf', name: 'Cozy Knit Scarf', costPoints: 50, category: 'accessory', iconEmoji: '🧣', themeValue: 'scarf', description: 'A soft autumn scarf keeping your companion warm.' },
  { id: 'cosmetic_superhero_cape', name: 'Courage Cape', costPoints: 75, category: 'accessory', iconEmoji: '🦸', themeValue: 'cape', description: 'A heroic cape that flutters with confidence.' },
  { id: 'cosmetic_astro_helmet', name: 'Astro Explorer Helmet', costPoints: 100, category: 'accessory', iconEmoji: '🧑‍🚀', themeValue: 'astro', description: 'High-tech galactic explorer gear for space adventures.' },
];

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const prisma = getPrisma();

  // GET /api/gamification?childId=...
  if (req.method === 'GET') {
    try {
      const childId = (req.query?.childId as string) || 'user_child_01';

      let balance = 0;
      let ledgerEntries: any[] = [];
      let streakRecord: any = null;
      let earnedBadges: any[] = [];
      let purchases: any[] = [];

      if (prisma) {
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

      return res.status(200).json({
        success: true,
        data: {
          childId,
          pointsBalance: balance,
          streakRecord: streakRecord || {
            childId,
            currentStreak: 7,
            longestStreak: 14,
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
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to retrieve gamification state',
      });
    }
  }

  // POST /api/gamification
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { childId, action, reasonKey, cosmeticItemId } = body;

      if (!childId) {
        return res.status(400).json({ success: false, error: 'childId is required' });
      }

      if (action === 'AWARD_POINTS') {
        const awardRule = POINT_AWARDS[reasonKey as string];
        if (!awardRule) {
          return res.status(400).json({
            success: false,
            error: `Invalid point award reason: ${reasonKey}`,
          });
        }

        const pointsToAward = awardRule.amount;
        let totalBalance = pointsToAward;

        if (prisma) {
          try {
            await prisma.pointsLedger.create({
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

        return res.status(200).json({
          success: true,
          data: {
            awarded: pointsToAward,
            reason: awardRule.label,
            newBalance: totalBalance,
          },
        });
      }

      if (action === 'PURCHASE_COSMETIC') {
        const item = COSMETICS_CATALOG.find((c) => c.id === cosmeticItemId);
        if (!item) {
          return res.status(404).json({
            success: false,
            error: 'Item not found in cosmetic catalog',
          });
        }

        if (prisma) {
          try {
            const agg = await prisma.pointsLedger.aggregate({
              where: { childId },
              _sum: { amount: true },
            });
            const balance = agg._sum.amount ?? 0;

            if (balance < item.costPoints) {
              return res.status(400).json({
                success: false,
                error: `Insufficient points. Required: ${item.costPoints}, Available: ${balance}`,
              });
            }

            await prisma.pointsLedger.create({
              data: {
                childId,
                amount: -item.costPoints,
                reason: `cosmetic_purchase:${item.name}`,
              },
            });

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

            return res.status(200).json({
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

        return res.status(200).json({
          success: true,
          data: {
            itemPurchased: item,
            newBalance: 0,
          },
        });
      }

      return res.status(400).json({ success: false, error: 'Unknown action' });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error?.message || 'Server error',
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
