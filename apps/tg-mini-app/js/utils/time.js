const TimeUtils = (() => {
  let timeFormat = localStorage.getItem('timeFormat') || 'western';
  let calendarFormat = localStorage.getItem('calendarFormat') || 'gregorian';

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

  function ethiopianNewYearGregorian(ethYear) {
    const gregYear = ethYear + 7;
    const day = isGregorianLeapYear(gregYear) ? 12 : 11;
    return new Date(gregYear, 8, day);
  }

  function gregorianToEthiopian(date) {
    const d = new Date(date);
    const gYear = d.getFullYear();
    const gMonth = d.getMonth();
    const gDay = d.getDate();
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

    const diffDays = Math.floor((d.getTime() - newYear.getTime()) / 86400000);
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

  function ethiopianDateToGregorian(ethYear, ethMonth, ethDay) {
    const newYear = ethiopianNewYearGregorian(ethYear);
    let daysToAdd = ethDay - 1;
    for (let m = 1; m < ethMonth; m++) {
      daysToAdd += daysInEthiopianMonth(m, ethYear);
    }
    const result = new Date(newYear);
    result.setDate(result.getDate() + daysToAdd);
    return result;
  }

  function formatEthiopianCalendarDate(date, format = 'medium') {
    const eth = gregorianToEthiopian(date);
    const am = eth.monthName.am;
    switch (format) {
      case 'medium':
        return `${am} ${eth.day}, ${eth.year}`;
      case 'year-first':
        return `${eth.year} ${am} ${eth.day}`;
      default:
        return `${am} ${eth.day}, ${eth.year}`;
    }
  }

  function setFormat(format) {
    timeFormat = format;
    localStorage.setItem('timeFormat', format);
  }

  function getFormat() {
    return timeFormat;
  }

  function setCalendarFormat(format) {
    calendarFormat = format;
    localStorage.setItem('calendarFormat', format);
  }

  function getCalendarFormat() {
    return calendarFormat;
  }

  function formatWesternTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function formatEthiopianLocalTime(date) {
    const d = new Date(date);
    const ethHour = ((d.getHours() + 6) % 12) || 12;
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const period = (d.getHours() >= 6 && d.getHours() < 18) ? 'ቀን' : 'ሌሊት';
    return `${ethHour}:${minutes} ${period}`;
  }

  function formatEthiopianLocalDateTime(date) {
    const d = new Date(date);
    const datePart = formatEthiopianCalendarDate(d, 'medium');
    return `${datePart}, ${formatEthiopianLocalTime(date)}`;
  }

  function formatTime(date) {
    return timeFormat === 'ethiopian' ? formatEthiopianLocalTime(date) : formatWesternTime(date);
  }

  function formatDate(date) {
    const d = new Date(date);
    if (calendarFormat === 'ethiopian') return formatEthiopianCalendarDate(d, 'medium');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return {
    setFormat,
    getFormat,
    setCalendarFormat,
    getCalendarFormat,
    gregorianToEthiopian,
    ethiopianDateToGregorian,
    formatEthiopianCalendarDate,
    formatWesternTime,
    formatEthiopianLocalTime,
    formatEthiopianLocalDateTime,
    formatTime,
    formatDate,
  };
})();
