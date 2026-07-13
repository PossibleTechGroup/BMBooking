const ETHIOPIAN_MONTHS = {
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

function isGregorianLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function isEthiopianLeapYear(ethYear) {
  return ethYear % 4 === 3;
}

function daysInEthiopianMonth(ethMonth, ethYear) {
  if (ethMonth === 13) return isEthiopianLeapYear(ethYear) ? 6 : 5;
  return 30;
}

/**
 * Converts a Gregorian Date to Ethiopian calendar fields.
 * @param {Date} date
 * @returns {{ year: number, month: number, day: number, monthName: { am: string, en: string } }}
 */
function gregorianToEthiopian(date) {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth();
  const gDay = date.getDate();
  const newYearDay = isGregorianLeapYear(gYear) ? 12 : 11;

  let ethYear;
  let newYear;

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

/**
 * Formats an Ethiopian date as "Meskerem 5, 2017" (month in Amharic).
 * @param {Date} date
 * @returns {string}
 */
function formatEthiopianDatePart(date) {
  const eth = gregorianToEthiopian(date);
  return `${eth.monthName.am} ${eth.day}, ${eth.year}`;
}

function formatEthiopianDate(date) {
  return new Date(date)
    .toLocaleString('en-US', {
      timeZone: 'Africa/Nairobi',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
}

function getEthiopiaHoursMinutes(date) {
  const d = new Date(date);
  const totalMinutes = ((d.getUTCHours() * 60 + d.getUTCMinutes()) + 180) % 1440;
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

function formatEthiopianLocalTime(date) {
  const { hours, minutes } = getEthiopiaHoursMinutes(date);
  const ethHour = ((hours + 6) % 12) || 12;
  const period = (hours >= 6 && hours < 18) ? 'ቀን' : 'ሌሊት';
  return `${ethHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatEthiopianLocalDateTime(date) {
  const d = new Date(date);
  const datePart = d.toLocaleString('en-US', {
    timeZone: 'Africa/Nairobi',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return `${datePart}, ${formatEthiopianLocalTime(date)}`;
}

function formatWesternTime(date) {
  const { hours, minutes } = getEthiopiaHoursMinutes(date);
  const h12 = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${h12}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

function formatEthiopianLocalTimeDual(date) {
  return `${formatEthiopianLocalTime(date)} {${formatWesternTime(date)}}`;
}

/**
 * Returns a dual-format date-time string: Ethiopian first, Gregorian in braces.
 * e.g. "ሰኔ 9, 2017 {June 16, 2025}, 9:00 ቀን {3:00 PM}"
 */
function formatEthiopianLocalDateTimeDual(date) {
  const d = new Date(date);
  const gregDatePart = d.toLocaleString('en-US', {
    timeZone: 'Africa/Nairobi',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const ethDatePart = formatEthiopianDatePart(d);
  return `${ethDatePart} {${gregDatePart}}, ${formatEthiopianLocalTimeDual(date)}`;
}

module.exports = {
  gregorianToEthiopian,
  formatEthiopianDate,
  formatEthiopianLocalTime,
  formatEthiopianLocalDateTime,
  formatWesternTime,
  formatEthiopianLocalTimeDual,
  formatEthiopianLocalDateTimeDual,
};
