import { useState, useEffect, useCallback } from 'react';

const TIME_STORAGE_KEY = 'timeFormat';
const CALENDAR_STORAGE_KEY = 'calendarFormat';

export function getTimeFormat(): string {
  return localStorage.getItem(TIME_STORAGE_KEY) || 'western';
}

export function getCalendarFormat(): string {
  return localStorage.getItem(CALENDAR_STORAGE_KEY) || 'gregorian';
}

export function setTimeFormat(format: string): void {
  localStorage.setItem(TIME_STORAGE_KEY, format);
  window.dispatchEvent(new CustomEvent('timeFormatChanged', { detail: format }));
}

export function setCalendarFormat(format: string): void {
  localStorage.setItem(CALENDAR_STORAGE_KEY, format);
  window.dispatchEvent(new CustomEvent('calendarFormatChanged', { detail: format }));
}

export function useTimeFormat(): {
  format: string;
  isEthiopian: boolean;
  toggle: () => void;
  calendarFormat: string;
  isEthiopianCalendar: boolean;
  toggleCalendar: () => void;
} {
  const [format, setFormat] = useState(getTimeFormat);
  const [calendarFormat, setCalendarFormatState] = useState(getCalendarFormat);

  useEffect(() => {
    const onTimeChange = (e: Event) => setFormat((e as CustomEvent).detail);
    const onCalendarChange = (e: Event) => setCalendarFormatState((e as CustomEvent).detail);
    window.addEventListener('timeFormatChanged', onTimeChange);
    window.addEventListener('calendarFormatChanged', onCalendarChange);
    return () => {
      window.removeEventListener('timeFormatChanged', onTimeChange);
      window.removeEventListener('calendarFormatChanged', onCalendarChange);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = format === 'western' ? 'ethiopian' : 'western';
    setTimeFormat(next);
  }, [format]);

  const toggleCalendar = useCallback(() => {
    const next = calendarFormat === 'gregorian' ? 'ethiopian' : 'gregorian';
    setCalendarFormat(next);
  }, [calendarFormat]);

  return {
    format,
    isEthiopian: format === 'ethiopian',
    toggle,
    calendarFormat,
    isEthiopianCalendar: calendarFormat === 'ethiopian',
    toggleCalendar,
  };
}
