/** Local calendar day as YYYY-MM-DD (avoids UTC drift from toISOString). */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Calendar day for a schedule row (stored as UTC midnight for that day). */
export function scheduleDayKey(isoDate: string): string {
  return new Date(isoDate).toISOString().split("T")[0];
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return toLocalDateString(a) === toLocalDateString(b);
}

export function startOfWeek(d: Date): Date {
  const start = new Date(d);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

export function endOfWeek(d: Date): Date {
  const end = startOfWeek(d);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
