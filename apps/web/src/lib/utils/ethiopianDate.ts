import { getCalendarFormat, getTimeFormat } from './timeFormat';

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AMHARIC_WEEKDAYS_LONG = ['እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];
export const AMHARIC_WEEKDAYS_SHORT = ['እሁ', 'ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'ዓርብ', 'ቅዳ'];

export const ETHIOPIAN_MONTHS: Record<number, { am: string; en: string }> = {
  1: { am: 'መስከረም', en: 'Mesker' },
  2: { am: 'ጥቅምት', en: 'Tikimt' },
  3: { am: 'ህዳር', en: 'Hidar' },
  4: { am: 'ታህሳስ', en: 'Tahsas' },
  5: { am: 'ጥር', en: 'Tir' },
  6: { am: 'የካቲት', en: 'Yekatit' },
  7: { am: 'መጋቢት', en: 'Megabit' },
  8: { am: 'ሚያዝያ', en: 'Miazia' },
  9: { am: 'ግንቦት', en: 'Ginbot' },
  10: { am: 'ሰኔ', en: 'Sene' },
  11: { am: 'ሐምሌ', en: 'Hamle' },
  12: { am: 'ነሐሴ', en: 'Nehase' },
  13: { am: 'ጳጉሜ', en: 'Pagume' },
};

export interface EthiopianDate {
  year: number;
  month: number;
  day: number;
  monthName: { am: string; en: string };
}

function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function isEthiopianLeapYear(ethYear: number): boolean {
  return ethYear % 4 === 3;
}

function daysInEthiopianMonth(ethMonth: number, ethYear: number): number {
  if (ethMonth === 13) return isEthiopianLeapYear(ethYear) ? 6 : 5;
  return 30;
}

function ethiopianNewYearGregorian(ethYear: number): Date {
  const gregYear = ethYear + 7;
  const day = isGregorianLeapYear(gregYear) ? 12 : 11;
  return new Date(gregYear, 8, day);
}

export function gregorianToEthiopian(date: Date): EthiopianDate {
  if (isNaN(date.getTime())) {
    return { year: NaN, month: 1, day: 1, monthName: ETHIOPIAN_MONTHS[1] };
  }
  const gYear = date.getFullYear();
  const gMonth = date.getMonth();
  const gDay = date.getDate();
  const newYearDay = isGregorianLeapYear(gYear) ? 12 : 11;

  let ethYear: number;
  let newYear: Date;

  if (gMonth < 8 || (gMonth === 8 && gDay < newYearDay)) {
    ethYear = gYear - 8;
    const prevGregYear = gYear - 1;
    const prevDay = isGregorianLeapYear(prevGregYear) ? 12 : 11;
    newYear = new Date(prevGregYear, 8, prevDay);
  } else {
    ethYear = gYear - 7;
    newYear = new Date(gYear, 8, newYearDay);
  }

  const diffDays = Math.floor((date.getTime() - newYear.getTime()) / 86400000);
  let month = 1;
  let day = diffDays + 1;

  while (month <= 13) {
    const dim = daysInEthiopianMonth(month, ethYear);
    if (day <= dim) break;
    day -= dim;
    month++;
  }

  return { year: ethYear, month, day, monthName: ETHIOPIAN_MONTHS[month] };
}

export function ethiopianDateToGregorian(ethYear: number, ethMonth: number, ethDay: number): Date {
  const newYear = ethiopianNewYearGregorian(ethYear);
  let daysToAdd = ethDay - 1;
  for (let m = 1; m < ethMonth; m++) {
    daysToAdd += daysInEthiopianMonth(m, ethYear);
  }
  const result = new Date(newYear);
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

export function formatEthiopianCalendarDate(
  date: Date,
  format: 'full' | 'medium' | 'short' | 'weekday-short' | 'weekday-full' | 'month-day' | 'year-first' = 'medium',
): string {
  const eth = gregorianToEthiopian(date);
  const { am, en } = eth.monthName;
  const dow = date.getDay();
  const wdLong = AMHARIC_WEEKDAYS_LONG[dow];
  const wdShort = AMHARIC_WEEKDAYS_SHORT[dow];

  switch (format) {
    case 'full':
      return `${wdLong}, ${am} ${eth.day}, ${eth.year}`;
    case 'medium':
      return `${am} ${eth.day}, ${eth.year}`;
    case 'short':
      return `${en} ${eth.day}, ${eth.year}`;
    case 'weekday-short':
      return `${wdShort}, ${am} ${eth.day}`;
    case 'weekday-full':
      return `${wdLong}, ${am} ${eth.day}`;
    case 'month-day':
      return `${am} ${eth.day}`;
    case 'year-first':
      return `${eth.year} ${am} ${eth.day}`;
    default:
      return `${am} ${eth.day}, ${eth.year}`;
  }
}

export function formatEthiopianDayLabel(date: Date): string {
  const dow = date.getDay();
  return AMHARIC_WEEKDAYS_SHORT[dow];
}

export function formatEthiopianMonthYear(date: Date): string {
  const eth = gregorianToEthiopian(date);
  return `${eth.monthName.am} ${eth.year}`;
}

function resolveCalendar(calendar?: 'gregorian' | 'ethiopian'): 'gregorian' | 'ethiopian' {
  if (calendar) return calendar;
  if (typeof window !== 'undefined' && getCalendarFormat() === 'ethiopian') return 'ethiopian';
  return 'gregorian';
}

export function formatDate(
  date: Date,
  format: 'full' | 'medium' | 'short' | 'weekday-short' | 'weekday-full' | 'month-day' = 'medium',
  calendar?: 'gregorian' | 'ethiopian',
): string {
  if (resolveCalendar(calendar) === 'ethiopian') {
    return formatEthiopianCalendarDate(date, format);
  }
  switch (format) {
    case 'full':
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    case 'medium':
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    case 'short':
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    case 'weekday-short':
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    case 'weekday-full':
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    case 'month-day':
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    default:
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}

export function formatTime(date: Date): string {
  const isEthiopian = typeof window !== 'undefined' && getTimeFormat() === 'ethiopian';
  if (isEthiopian) return formatEthiopianLocalTime(date);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatEthiopianLocalTime(date: Date): string {
  const ethHour = ((date.getHours() + 6) % 12) || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = date.getHours() >= 6 && date.getHours() < 18 ? 'ቀን' : 'ሌሊት';
  return `${ethHour}:${minutes} ${period}`;
}

export function formatDateTime(date: Date): string {
  const isEthiopianTime = typeof window !== 'undefined' && getTimeFormat() === 'ethiopian';
  if (isEthiopianTime) return formatEthiopianLocalDateTime(date);
  return date.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatEthiopianLocalDateTime(date: Date): string {
  const datePart = formatEthiopianCalendarDate(date, 'medium');
  return `${datePart}, ${formatEthiopianLocalTime(date)}`;
}

export function formatWeekRange(days: Date[]): string {
  if (days.length === 0) return '';
  const start = formatDate(days[0], 'month-day');
  const end = days.length > 1 ? formatDate(days[days.length - 1], 'medium') : formatDate(days[0], 'medium');
  if (days.length === 1) return end;
  return `${start} – ${end}`;
}

export function formatDateShort(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayLabel(): string {
  return formatDate(new Date(), 'medium');
}

export function formatNum(n: number): string {
  return n.toLocaleString('en-US');
}