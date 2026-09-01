/**
 * Care Team Messaging Layer (Prompt 11 & 13 & 14)
 * 
 * Threaded messaging between Clinician and Linked Parent(s) for a given Child.
 * Supports embedded video players directly in the chat bubbles (`attachedVideoUrl`, `attachedSubmissionId`).
 */

export interface CareTeamMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'CLINICIAN' | 'PARENT';
  recipientId: string;
  childId: string;
  content: string;
  attachedSubmissionId?: string;
  attachedSubmissionTitle?: string;
  attachedVideoUrl?: string;
  createdAt: string;
}

const MESSAGES_STORAGE_PREFIX = 'nest_care_team_messages_v2_';

const DEFAULT_SEEDED_MESSAGES: Record<string, CareTeamMessage[]> = {
  user_child_01: [
    {
      id: 'msg_seed_1',
      senderId: 'clinician_01',
      senderName: 'Dr. Marcus Vance, MD',
      senderRole: 'CLINICIAN',
      recipientId: 'parent_01',
      childId: 'user_child_01',
      content: 'Hi Sarah! I reviewed Leo’s check-ins from this past week. He had a couple of lower energy moments around Tuesday afternoon, but rebounded nicely with Pip on Thursday.',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'msg_seed_2',
      senderId: 'parent_01',
      senderName: 'Sarah Martinez (Parent)',
      senderRole: 'PARENT',
      recipientId: 'clinician_01',
      childId: 'user_child_01',
      content: 'Thank you for flagging that, Dr. Vance! He was feeling a little anxious about a group presentation at school, but we practiced deep belly breaths together before bed.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'msg_seed_3',
      senderId: 'clinician_01',
      senderName: 'Dr. Marcus Vance, MD',
      senderRole: 'CLINICIAN',
      recipientId: 'parent_01',
      childId: 'user_child_01',
      content: 'That is wonderful to hear. I assigned the new /s/ and /z/ target sound goal for home practice. Whenever you have a chance, record a quick 15-second session with him.',
      createdAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 2).toISOString(),
    },
    {
      id: 'msg_seed_video_1',
      senderId: 'parent_01',
      senderName: 'Sarah Martinez (Parent)',
      senderRole: 'PARENT',
      recipientId: 'clinician_01',
      childId: 'user_child_01',
      content: '📹 We just recorded Leo’s speech practice session! Here is the video recording for your review:',
      attachedSubmissionId: 'sub_seed_leo_1_1',
      attachedSubmissionTitle: 'Produce /s/ and /z/ sounds in conversation (15s Session)',
      attachedVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ],
  user_child_02: [
    {
      id: 'msg_seed_maya_1',
      senderId: 'clinician_01',
      senderName: 'Dr. Marcus Vance, MD',
      senderRole: 'CLINICIAN',
      recipientId: 'parent_01',
      childId: 'user_child_02',
      content: 'Hello Sarah! Maya has been doing great with Nova on her weekly reflection logs. Her creative hobbies like sketching seem to be a really great emotional reset for her.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
};

export function getCareTeamMessages(childId: string): CareTeamMessage[] {
  if (typeof window === 'undefined') return DEFAULT_SEEDED_MESSAGES[childId] || [];
  try {
    const raw = localStorage.getItem(`${MESSAGES_STORAGE_PREFIX}${childId}`);
    if (!raw) {
      const seeded = DEFAULT_SEEDED_MESSAGES[childId] || [];
      localStorage.setItem(`${MESSAGES_STORAGE_PREFIX}${childId}`, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as CareTeamMessage[];
  } catch (err) {
    console.error('Failed to get care team messages:', err);
    return [];
  }
}

export function sendCareTeamMessage(params: {
  senderId: string;
  senderName: string;
  senderRole: 'CLINICIAN' | 'PARENT';
  recipientId?: string;
  childId: string;
  content: string;
  attachedSubmissionId?: string;
  attachedSubmissionTitle?: string;
  attachedVideoUrl?: string;
}): CareTeamMessage {
  const current = getCareTeamMessages(params.childId);
  const now = new Date().toISOString();

  const newMessage: CareTeamMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole,
    recipientId: params.recipientId || (params.senderRole === 'CLINICIAN' ? 'parent_01' : 'clinician_01'),
    childId: params.childId,
    content: params.content.trim(),
    attachedSubmissionId: params.attachedSubmissionId,
    attachedSubmissionTitle: params.attachedSubmissionTitle,
    attachedVideoUrl: params.attachedVideoUrl,
    createdAt: now,
  };

  const updated = [...current, newMessage];
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${MESSAGES_STORAGE_PREFIX}${params.childId}`, JSON.stringify(updated));
  }

  return newMessage;
}
