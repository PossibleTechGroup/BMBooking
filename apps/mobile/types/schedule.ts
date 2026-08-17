export type ScheduleEntry = {
  id: string;
  day?: string;
  date?: string;
  startTime: string;
  endTime: string;
  hospitalId: number | null;
  hospitalName: string | null;
  isRecurring: boolean;
  slotDuration?: number;
};

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function hasOverlap(entries: ScheduleEntry[]): boolean {
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      const sameDayOrDate = a.isRecurring && b.isRecurring
        ? a.day === b.day
        : !a.isRecurring && !b.isRecurring
        ? a.date === b.date
        : false;
      if (!sameDayOrDate) continue;
      if (timeToMinutes(a.startTime) < timeToMinutes(b.endTime) && timeToMinutes(b.startTime) < timeToMinutes(a.endTime)) {
        return true;
      }
    }
  }
  return false;
}

// Returns 24h HH:MM for internal data interchange (ScheduleEntry.startTime/endTime).
// For 12h AM/PM display, use formatDisplayTime().
export function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function formatDisplayTime(time: string, isEthiopian?: boolean): string {
  const [h, m] = time.split(":").map(Number);
  if (isEthiopian) {
    const ethHour = ((h + 6) % 12) || 12;
    const period = (h >= 6 && h < 18) ? 'ቀን' : 'ሌሊት';
    return `${ethHour}:${m.toString().padStart(2, "0")} ${period}`;
  }
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

import { formatDate } from '../utils/ethiopianDate';

export function formatDateDisplay(date: Date): string {
  return formatDate(date, 'medium');
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDayColor(day: string): string {
  const colors: Record<string, string> = {
    Monday: "#4F46E5", Tuesday: "#7C3AED", Wednesday: "#2563EB",
    Thursday: "#0891B2", Friday: "#059669", Saturday: "#D97706", Sunday: "#DC2626",
  };
  return colors[day] || "#1565C0";
}
