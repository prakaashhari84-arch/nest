import { NextRequest, NextResponse } from 'next/server';
import {
  getPatternAlerts,
  markAlertReviewed,
  evaluatePatterns,
} from '@/lib/safetyPatterns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId') || undefined;
    const role = (searchParams.get('role') as 'PARENT' | 'CLINICIAN') || 'CLINICIAN';

    const alerts = getPatternAlerts(childId, role);
    return NextResponse.json({ success: true, alerts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch pattern alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertId, reviewerUserId, reviewNotes, childId, triggerSeverity, triggerText, forceCategory } = body;

    if (action === 'MARK_REVIEWED') {
      if (!alertId || !reviewerUserId) {
        return NextResponse.json(
          { success: false, error: 'alertId and reviewerUserId are required' },
          { status: 400 }
        );
      }
      const updated = markAlertReviewed(alertId, reviewerUserId, reviewNotes);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Alert not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, alert: updated });
    }

    if (action === 'EVALUATE') {
      if (!childId) {
        return NextResponse.json(
          { success: false, error: 'childId is required' },
          { status: 400 }
        );
      }
      const result = await evaluatePatterns(childId, {
        triggerSeverity,
        triggerText,
        forceCategory,
      });
      return NextResponse.json({ success: true, alert: result });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action specified' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process safety action' },
      { status: 500 }
    );
  }
}
