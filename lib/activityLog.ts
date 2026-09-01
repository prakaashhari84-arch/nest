/**
 * Activity Log Model & Storage for TEN_TO_FOURTEEN
 * - Non-clinical companion running recap
 * - Stored as ActivityLogEntry
 * - Rendered to the child as "Here's what we talked about this week"
 */

export interface ActivityLogEntry {
  id: string;
  childId: string;
  topicSummary: string; // One line summary of what was shared
  category: 'school' | 'friendship' | 'emotions' | 'hobbies' | 'family' | 'curiosity' | 'general';
  tags: string[];
  emoji: string;
  sentimentVibe?: 'positive' | 'reflective' | 'challenging' | 'creative';
  createdAt: string;
}

const ACTIVITY_LOG_STORAGE_PREFIX = 'nest_activity_log_';

export const SEED_ACTIVITY_LOGS: Record<string, ActivityLogEntry[]> = {
  default: [
    {
      id: 'log_seed_1',
      childId: 'c1',
      topicSummary: 'Reflected on navigating group project dynamics in science class.',
      category: 'school',
      tags: ['Teamwork', 'Science'],
      emoji: '🔬',
      sentimentVibe: 'reflective',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'log_seed_2',
      childId: 'c1',
      topicSummary: 'Talked about unwinding with music and sketching after a busy day.',
      category: 'hobbies',
      tags: ['Art', 'Downtime'],
      emoji: '🎨',
      sentimentVibe: 'positive',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'log_seed_3',
      childId: 'c1',
      topicSummary: 'Discussed setting boundaries when friends tease during lunch break.',
      category: 'friendship',
      tags: ['Boundaries', 'Confidence'],
      emoji: '🛡️',
      sentimentVibe: 'challenging',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 'log_seed_4',
      childId: 'c1',
      topicSummary: 'Shared excitement about trying out a new robotics club challenge.',
      category: 'curiosity',
      tags: ['Robotics', 'Goals'],
      emoji: '🤖',
      sentimentVibe: 'creative',
      createdAt: new Date().toISOString(),
    },
  ],
};

/**
 * Retrieve activity log entries for a child (sorted newest first)
 */
export function getActivityLogs(childId: string): ActivityLogEntry[] {
  if (typeof window === 'undefined') return SEED_ACTIVITY_LOGS.default;
  try {
    const raw = localStorage.getItem(`${ACTIVITY_LOG_STORAGE_PREFIX}${childId}`);
    if (!raw) {
      // Seed with initial realistic entries
      const seeded = SEED_ACTIVITY_LOGS.default.map((entry) => ({
        ...entry,
        childId,
      }));
      localStorage.setItem(`${ACTIVITY_LOG_STORAGE_PREFIX}${childId}`, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as ActivityLogEntry[];
    return parsed.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error('Failed to get activity logs:', err);
    return SEED_ACTIVITY_LOGS.default;
  }
}

/**
 * Record a new activity log entry
 */
export function recordActivityLog(
  entry: Omit<ActivityLogEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): ActivityLogEntry {
  const currentLogs = getActivityLogs(entry.childId);
  const newEntry: ActivityLogEntry = {
    id: entry.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    childId: entry.childId,
    topicSummary: entry.topicSummary,
    category: entry.category || 'general',
    tags: entry.tags || [],
    emoji: entry.emoji || '💬',
    sentimentVibe: entry.sentimentVibe || 'reflective',
    createdAt: entry.createdAt || new Date().toISOString(),
  };

  const updated = [newEntry, ...currentLogs];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${ACTIVITY_LOG_STORAGE_PREFIX}${entry.childId}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save activity log:', err);
    }
  }
  return newEntry;
}

/**
 * Helper to extract or generate a short 1-line recap from a child's message
 */
export function deriveLogSummary(message: string): {
  summary: string;
  category: ActivityLogEntry['category'];
  emoji: string;
  tags: string[];
} {
  const lower = message.toLowerCase();

  if (lower.includes('school') || lower.includes('class') || lower.includes('test') || lower.includes('grade') || lower.includes('math') || lower.includes('science')) {
    return {
      summary: `Discussed thoughts and experiences around school activities.`,
      category: 'school',
      emoji: '📚',
      tags: ['School', 'Learning'],
    };
  }

  if (lower.includes('friend') || lower.includes('lunch') || lower.includes('group') || lower.includes('bully') || lower.includes('tease') || lower.includes('drama')) {
    return {
      summary: `Talked through social situations and friendships.`,
      category: 'friendship',
      emoji: '🤝',
      tags: ['Friendships', 'Connection'],
    };
  }

  if (lower.includes('tired') || lower.includes('stressed') || lower.includes('overwhelmed') || lower.includes('sad') || lower.includes('angry') || lower.includes('anxious')) {
    return {
      summary: `Checked in on processing heavy emotions and finding calm.`,
      category: 'emotions',
      emoji: '💭',
      tags: ['Emotional Balance', 'Reset'],
    };
  }

  if (lower.includes('game') || lower.includes('music') || lower.includes('draw') || lower.includes('hobby') || lower.includes('read') || lower.includes('sport')) {
    return {
      summary: `Shared favorite interests, creative hobbies, and free-time passions.`,
      category: 'hobbies',
      emoji: '🎮',
      tags: ['Creativity', 'Interests'],
    };
  }

  return {
    summary: `Reflected on today's moments and thoughts with ${message.length > 30 ? message.slice(0, 30) + '...' : message}.`,
    category: 'general',
    emoji: '✨',
    tags: ['Daily Reflection'],
  };
}
