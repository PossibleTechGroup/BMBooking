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

export const AMHARIC_WEEKDAYS_SHORT = ['እሁ', 'ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'ዓርብ', 'ቅዳ'];
export const AMHARIC_WEEKDAYS_LONG = ['እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];

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

export interface EthiopianDate {
  year: number;
  month: number;
  day: number;
  monthName: { am: string; en: string };
}

export function gregorianToEthiopian(date: Date): EthiopianDate {
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

export function formatEthiopianCalendarDate(date: Date, format: 'full' | 'medium' | 'short' | 'weekday-short' | 'month-day' = 'medium'): string {
  const eth = gregorianToEthiopian(date);
  const { am, en } = eth.monthName;
  const dow = date.getDay();
  const wdLong = AMHARIC_WEEKDAYS_LONG[dow];
  const wdShort = AMHARIC_WEEKDAYS_SHORT[dow];

  switch (format) {
    case 'full': return `${wdLong}, ${am} ${eth.day}, ${eth.year}`;
    case 'medium': return `${am} ${eth.day}, ${eth.year}`;
    case 'short': return `${en} ${eth.day}, ${eth.year}`;
    case 'weekday-short': return `${wdShort}, ${am} ${eth.day}`;
    case 'month-day': return `${am} ${eth.day}`;
    default: return `${am} ${eth.day}, ${eth.year}`;
  }
}

export function formatEthiopianDayLabel(date: Date): string {
  const eth = gregorianToEthiopian(date);
  const dow = date.getDay();
  return AMHARIC_WEEKDAYS_SHORT[dow];
}

export function formatEthiopianMonthYear(date: Date): string {
  const eth = gregorianToEthiopian(date);
  return `${eth.monthName.am} ${eth.year}`;
}
