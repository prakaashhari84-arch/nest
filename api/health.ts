import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;
function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export default async function handler(req: any, res: any) {
  try {
    let dbStatus = 'untested';
    let dbError = null;

    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
      } catch (err: any) {
        dbStatus = 'error';
        dbError = err?.message || 'Database query failed';
      }
    } else {
      dbStatus = 'no_database_url_configured';
    }

    return res.status(200).json({
      status: 'ok',
      service: 'nest-api',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
      database: {
        status: dbStatus,
        error: dbError,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      message: err?.message || 'Internal Server Error',
    });
  }
}
