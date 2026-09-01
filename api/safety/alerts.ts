import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;
function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export const SEED_ALERTS = [
  {
    id: 'alert_live_01',
    childId: 'child_profile_leo',
    severity: 'MILD',
    category: 'sensory_overload_and_loud_environment',
    summary: 'Child noted noise sensitivity during cafeteria hours on Tuesday, which resolved positively during evening quiet time.',
    suggestedStarters: [
      '“How was lunch at school today? Was it loud or nice and calm?”',
      '“Would you like to pick out cozy earplugs or quiet corner spots with your teacher?”',
    ],
    status: 'OPEN',
    reviewedByHuman: false,
    suspectedAbuserIsParent: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'alert_live_02',
    childId: 'child_profile_leo',
    severity: 'MILD',
    category: 'presentation_hesitancy',
    summary: 'Mild pre-presentation hesitance noted last week; practiced belly breathing with caregiver.',
    suggestedStarters: [
      '“You did awesome taking deep belly breaths before bed!”',
    ],
    status: 'RESOLVED',
    reviewedByHuman: true,
    reviewedByUserId: 'clinician_01',
    reviewNotes: 'Verified at weekly check-in; deep breathing technique reinforced with Pip.',
    suspectedAbuserIsParent: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
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

  // GET /api/safety/alerts?childId=...&role=...
  if (req.method === 'GET') {
    try {
      const childId = (req.query?.childId as string) || undefined;
      const role = ((req.query?.role as string) as 'PARENT' | 'CLINICIAN') || 'CLINICIAN';

      let alerts: any[] = [];
      if (prisma) {
        try {
          const whereClause: any = {};
          if (childId) whereClause.childId = childId;
          if (role === 'PARENT') {
            whereClause.suspectedAbuserIsParent = false;
          }
          alerts = await prisma.patternAlert.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
          });
        } catch (err) {
          console.warn('Prisma error in /api/safety/alerts:', err);
        }
      }

      if (!alerts || alerts.length === 0) {
        alerts = SEED_ALERTS.filter((a) => {
          if (childId && a.childId !== childId) return false;
          if (role === 'PARENT' && a.suspectedAbuserIsParent) return false;
          return true;
        });
      }

      return res.status(200).json({ success: true, alerts });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to fetch pattern alerts',
      });
    }
  }

  // POST /api/safety/alerts
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { action, alertId, reviewerUserId, reviewNotes } = body;

      if (action === 'MARK_REVIEWED') {
        if (!alertId || !reviewerUserId) {
          return res.status(400).json({
            success: false,
            error: 'alertId and reviewerUserId are required',
          });
        }

        if (prisma) {
          try {
            const updated = await prisma.patternAlert.update({
              where: { id: alertId },
              data: {
                reviewedByHuman: true,
                reviewedByUserId: reviewerUserId,
                reviewedAt: new Date(),
                reviewNotes: reviewNotes || 'Reviewed by clinician.',
                status: 'RESOLVED',
              },
            });
            return res.status(200).json({ success: true, alert: updated });
          } catch (err) {
            console.warn('Prisma update error in /api/safety/alerts:', err);
          }
        }

        const match = SEED_ALERTS.find((a) => a.id === alertId);
        if (match) {
          match.reviewedByHuman = true;
          match.reviewedByUserId = reviewerUserId;
          match.reviewNotes = reviewNotes || 'Reviewed.';
          match.status = 'RESOLVED';
          return res.status(200).json({ success: true, alert: match });
        }

        return res.status(404).json({ success: false, error: 'Alert not found' });
      }

      return res.status(400).json({ success: false, error: 'Invalid action' });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to process safety action',
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
