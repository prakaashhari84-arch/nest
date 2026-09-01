/**
 * Monthly 1-on-1 Clinical Scheduling Engine (Prompt 11)
 * 
 * Manages AvailabilitySlot records created by clinicians and booked by parents
 * for children who do not have an existing offline clinician of record.
 */

export interface AvailabilitySlot {
  id: string;
  clinicianId: string;
  clinicianName: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  bookedByParentId?: string;
  bookedForChildId?: string;
  bookedForChildName?: string;
  bookedAt?: string;
  notes?: string;
  createdAt: string;
}

const SLOTS_STORAGE_KEY = 'nest_availability_slots_';

function getNextDate(daysAhead: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const DEFAULT_SEEDED_SLOTS: AvailabilitySlot[] = [
  {
    id: 'slot_seed_1',
    clinicianId: 'clinician_01',
    clinicianName: 'Dr. Marcus Vance, MD',
    startTime: getNextDate(2, 10, 0).toISOString(),
    endTime: getNextDate(2, 10, 45).toISOString(),
    isBooked: false,
    notes: 'Monthly 1-on-1 Clinical Check-in (45 min via Telehealth)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_seed_2',
    clinicianId: 'clinician_01',
    clinicianName: 'Dr. Marcus Vance, MD',
    startTime: getNextDate(3, 14, 30).toISOString(),
    endTime: getNextDate(3, 15, 15).toISOString(),
    isBooked: false,
    notes: 'Monthly 1-on-1 Clinical Check-in (45 min via Telehealth)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_seed_3',
    clinicianId: 'clinician_01',
    clinicianName: 'Dr. Marcus Vance, MD',
    startTime: getNextDate(5, 11, 0).toISOString(),
    endTime: getNextDate(5, 11, 45).toISOString(),
    isBooked: true,
    bookedByParentId: 'parent_01',
    bookedForChildId: 'user_child_01',
    bookedForChildName: 'Leo Martinez',
    bookedAt: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Confirmed: Monthly Child Wellness & Routine Progress Review',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_seed_4',
    clinicianId: 'clinician_01',
    clinicianName: 'Dr. Marcus Vance, MD',
    startTime: getNextDate(7, 16, 0).toISOString(),
    endTime: getNextDate(7, 16, 45).toISOString(),
    isBooked: false,
    notes: 'Monthly 1-on-1 Clinical Check-in (45 min via Telehealth)',
    createdAt: new Date().toISOString(),
  },
];

export function getAvailabilitySlots(clinicianId: string = 'clinician_01'): AvailabilitySlot[] {
  if (typeof window === 'undefined') return DEFAULT_SEEDED_SLOTS;
  try {
    const raw = localStorage.getItem(SLOTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(DEFAULT_SEEDED_SLOTS));
      return DEFAULT_SEEDED_SLOTS;
    }
    const slots = JSON.parse(raw) as AvailabilitySlot[];
    return slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  } catch (err) {
    console.error('Failed to load availability slots:', err);
    return DEFAULT_SEEDED_SLOTS;
  }
}

function saveSlots(slots: AvailabilitySlot[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(slots));
  }
}

export function createAvailabilitySlot(params: {
  clinicianId: string;
  clinicianName: string;
  startTime: string;
  endTime: string;
  notes?: string;
}): AvailabilitySlot {
  const allSlots = getAvailabilitySlots(params.clinicianId);
  const newSlot: AvailabilitySlot = {
    id: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    clinicianId: params.clinicianId,
    clinicianName: params.clinicianName,
    startTime: params.startTime,
    endTime: params.endTime,
    isBooked: false,
    notes: params.notes || 'Monthly 1-on-1 Clinical Check-in (45 min)',
    createdAt: new Date().toISOString(),
  };

  const updated = [...allSlots, newSlot];
  saveSlots(updated);
  return newSlot;
}

export function bookAvailabilitySlot(params: {
  slotId: string;
  parentId: string;
  childId: string;
  childName: string;
  notes?: string;
}): AvailabilitySlot | null {
  const allSlots = getAvailabilitySlots();
  const index = allSlots.findIndex((s) => s.id === params.slotId);
  if (index === -1) return null;

  const updatedSlot: AvailabilitySlot = {
    ...allSlots[index],
    isBooked: true,
    bookedByParentId: params.parentId,
    bookedForChildId: params.childId,
    bookedForChildName: params.childName,
    bookedAt: new Date().toISOString(),
    notes: params.notes || allSlots[index].notes,
  };

  allSlots[index] = updatedSlot;
  saveSlots(allSlots);
  return updatedSlot;
}

export function cancelSlotBooking(slotId: string): AvailabilitySlot | null {
  const allSlots = getAvailabilitySlots();
  const index = allSlots.findIndex((s) => s.id === slotId);
  if (index === -1) return null;

  const updatedSlot: AvailabilitySlot = {
    ...allSlots[index],
    isBooked: false,
    bookedByParentId: undefined,
    bookedForChildId: undefined,
    bookedForChildName: undefined,
    bookedAt: undefined,
  };

  allSlots[index] = updatedSlot;
  saveSlots(allSlots);
  return updatedSlot;
}
