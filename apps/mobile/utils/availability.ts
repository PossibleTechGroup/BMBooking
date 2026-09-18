export function computeAvailability(schedules: any[]): {
  isAvailable: boolean;
  nextAvailableSlot: string | null;
} {
  const now = new Date();
  const candidates: any[] = [];
  for (const s of schedules || []) {
    if (s.isActive === false) continue;
    for (const slot of s.slots || []) {
      if (new Date(slot.startTime) <= now) continue;
      const booked = slot._count?.bookings ?? 0;
      const max = slot.maxPatients ?? 1;
      if (booked < max) candidates.push(slot);
    }
  }
  candidates.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const next = candidates[0] || null;
  return {
    isAvailable: !!next,
    nextAvailableSlot: next ? next.startTime : null,
  };
}