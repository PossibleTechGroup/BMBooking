'use client';

import { useState, useEffect, useCallback } from 'react';

const TIME_STORAGE_KEY = 'timeFormat';
const CALENDAR_STORAGE_KEY = 'calendarFormat';

function safeGet(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(key) || fallback;
}

export function getTimeFormat(): string {
  return safeGet(TIME_STORAGE_KEY, 'western');
}

export function getCalendarFormat(): string {
  return safeGet(CALENDAR_STORAGE_KEY, 'gregorian');
}

export function setTimeFormat(format: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TIME_STORAGE_KEY, format);
  window.dispatchEvent(new CustomEvent('timeFormatChanged', { detail: format }));
}

export function setCalendarFormat(format: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CALENDAR_STORAGE_KEY, format);
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
  const [format, setFormat] = useState<string>('western');
  const [calendarFormat, setCalendarFormatState] = useState<string>('gregorian');

  useEffect(() => {
    const storedFormat = safeGet(TIME_STORAGE_KEY, 'western');
    if (storedFormat !== format) setFormat(storedFormat);
    const storedCalendarFormat = safeGet(CALENDAR_STORAGE_KEY, 'gregorian');
    if (storedCalendarFormat !== calendarFormat) setCalendarFormatState(storedCalendarFormat);

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