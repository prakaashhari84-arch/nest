/**
 * Home Therapy Activities Engine (Prompt 12)
 * 
 * Manages therapeutic goals assigned by clinicians and practiced by children at home with parents.
 * Provides the data model and workflows for Goal Assignment, Parent Delivery, and Video Submission hooks.
 */

export type ActivityStatus = 'ASSIGNED' | 'SUBMITTED' | 'REVIEWED';

export interface TherapyActivity {
  id: string;
  clinicianId: string;
  clinicianName: string;
  childId: string;
  title: string;
  instructions: string;
  targetSkill: string;
  assignedAt: string;
  dueBy?: string;
  status: ActivityStatus;
  submissionCount?: number;
  lastSubmittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const THERAPY_STORAGE_KEY = 'nest_therapy_activities_';

export const TARGET_SKILL_PRESETS = [
  'Speech & Articulation',
  'Social Turn-Taking & Pragmatics',
  'Emotional Recognition & Labeling',
  'Executive Functioning & Sequencing',
  'Sensory Grounding & Regulation',
  'Bedtime De-escalation & Calming',
  'Assertiveness & Boundary Setting',
];

const DEFAULT_SEEDED_ACTIVITIES: Record<string, TherapyActivity[]> = {
  user_child_01: [
    {
      id: 'act_seed_leo_1',
      clinicianId: 'clinician_01',
      clinicianName: 'Dr. Marcus Vance, MD',
      childId: 'user_child_01',
      title: 'Produce /s/ and /z/ sounds in conversation',
      targetSkill: 'Speech & Articulation',
      instructions:
        'Practice during 5–10 minutes of conversational storytelling. Have Leo tell a short story about his favorite animal while paying close attention to tongue placement behind front teeth on words like "sun", "space", "stars", and "breeze". Praise clear sounds gently without interrupting flow.',
      assignedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      dueBy: new Date(Date.now() + 86400000 * 4).toISOString(),
      status: 'ASSIGNED',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'act_seed_leo_2',
      clinicianId: 'clinician_01',
      clinicianName: 'Dr. Marcus Vance, MD',
      childId: 'user_child_01',
      title: 'Take turns during a structured board game',
      targetSkill: 'Social Turn-Taking & Pragmatics',
      instructions:
        'Play a quick 2-player board or card game (such as Uno, Connect 4, or matching memory cards). Encourage verbalizing turn-taking transitions clearly ("My turn", "Your turn, Dad!"). Record 1–2 minutes of the middle of the game.',
      assignedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      dueBy: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'ASSIGNED',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'act_seed_leo_3',
      clinicianId: 'clinician_01',
      clinicianName: 'Dr. Marcus Vance, MD',
      childId: 'user_child_01',
      title: 'Identify 3 emotion faces in bedtime storybook',
      targetSkill: 'Emotional Recognition & Labeling',
      instructions:
        'During evening reading, pause at 3 character illustrations showing different feelings (e.g. surprised, worried, proud). Ask Leo: "Look at their eyebrows and smile—what feeling is their body showing?"',
      assignedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      dueBy: new Date(Date.now() - 86400000 * 1).toISOString(),
      status: 'REVIEWED',
      submissionCount: 1,
      lastSubmittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
  user_child_02: [
    {
      id: 'act_seed_maya_1',
      clinicianId: 'clinician_01',
      clinicianName: 'Dr. Marcus Vance, MD',
      childId: 'user_child_02',
      title: 'Active listening & reflective recap during dinner conversation',
      targetSkill: 'Social Turn-Taking & Pragmatics',
      instructions:
        'Practice a 5-minute family debrief where Maya summarizes what someone else shared about their day before responding with her own perspective.',
      assignedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      dueBy: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: 'ASSIGNED',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
};

export function getTherapyActivities(childId?: string): TherapyActivity[] {
  if (typeof window === 'undefined') {
    if (childId) return DEFAULT_SEEDED_ACTIVITIES[childId] || [];
    return Object.values(DEFAULT_SEEDED_ACTIVITIES).flat();
  }
  try {
    const raw = localStorage.getItem(THERAPY_STORAGE_KEY);
    if (!raw) {
      const allSeeded = Object.values(DEFAULT_SEEDED_ACTIVITIES).flat();
      localStorage.setItem(THERAPY_STORAGE_KEY, JSON.stringify(allSeeded));
      return childId ? allSeeded.filter((a) => a.childId === childId) : allSeeded;
    }
    const parsed = JSON.parse(raw) as TherapyActivity[];
    return childId ? parsed.filter((a) => a.childId === childId) : parsed;
  } catch (err) {
    console.error('Failed to load therapy activities:', err);
    return [];
  }
}

function saveTherapyActivities(activities: TherapyActivity[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THERAPY_STORAGE_KEY, JSON.stringify(activities));
  }
}

export function assignTherapyActivity(params: {
  clinicianId: string;
  clinicianName: string;
  childId: string;
  title: string;
  instructions: string;
  targetSkill: string;
  dueBy?: string;
}): TherapyActivity {
  const allActivities = getTherapyActivities();
  const now = new Date().toISOString();

  const newActivity: TherapyActivity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    clinicianId: params.clinicianId,
    clinicianName: params.clinicianName,
    childId: params.childId,
    title: params.title.trim(),
    instructions: params.instructions.trim(),
    targetSkill: params.targetSkill.trim() || 'General Development',
    assignedAt: now,
    dueBy: params.dueBy ? new Date(params.dueBy).toISOString() : undefined,
    status: 'ASSIGNED',
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newActivity, ...allActivities];
  saveTherapyActivities(updated);

  // Trigger care team notification log for parent
  try {
    import('./careTeamMessages').then(({ sendCareTeamMessage }) => {
      sendCareTeamMessage({
        senderId: params.clinicianId,
        senderName: params.clinicianName,
        senderRole: 'CLINICIAN',
        childId: params.childId,
        content: `📋 Assigned new therapeutic goal: "${params.title}". View instructions in your Home Therapy tab.`,
      });
    });
  } catch (err) {
    console.warn('Failed to dispatch care team notification for assigned activity:', err);
  }

  return newActivity;
}

export function updateTherapyActivityStatus(
  activityId: string,
  status: ActivityStatus
): TherapyActivity | null {
  const allActivities = getTherapyActivities();
  const index = allActivities.findIndex((a) => a.id === activityId);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const updated: TherapyActivity = {
    ...allActivities[index],
    status,
    updatedAt: now,
    lastSubmittedAt: status === 'SUBMITTED' ? now : allActivities[index].lastSubmittedAt,
    submissionCount:
      status === 'SUBMITTED'
        ? (allActivities[index].submissionCount || 0) + 1
        : allActivities[index].submissionCount,
  };

  allActivities[index] = updated;
  saveTherapyActivities(allActivities);
  return updated;
}
