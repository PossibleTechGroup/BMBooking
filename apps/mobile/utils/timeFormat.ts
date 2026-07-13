import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';
import { DeviceEventEmitter } from 'react-native';

const TIME_STORAGE_KEY = 'timeFormat';
const CALENDAR_STORAGE_KEY = 'calendarFormat';
const TIME_EVENT_NAME = 'timeFormatChanged';
const CALENDAR_EVENT_NAME = 'calendarFormatChanged';

let cachedTimeFormat = 'western';
let cachedCalendarFormat = 'gregorian';

export async function loadTimeFormat(): Promise<string> {
  try {
    cachedTimeFormat = await storage.getItem(TIME_STORAGE_KEY) || 'western';
  } catch {
    cachedTimeFormat = 'western';
  }
  return cachedTimeFormat;
}

export async function loadCalendarFormat(): Promise<string> {
  try {
    cachedCalendarFormat = await storage.getItem(CALENDAR_STORAGE_KEY) || 'gregorian';
  } catch {
    cachedCalendarFormat = 'gregorian';
  }
  return cachedCalendarFormat;
}

export function getTimeFormat(): string {
  return cachedTimeFormat;
}

export function getCalendarFormat(): string {
  return cachedCalendarFormat;
}

export async function setTimeFormat(format: string): Promise<void> {
  cachedTimeFormat = format;
  try {
    await storage.setItem(TIME_STORAGE_KEY, format);
  } catch (e) {}
  DeviceEventEmitter.emit(TIME_EVENT_NAME, format);
}

export async function setCalendarFormat(format: string): Promise<void> {
  cachedCalendarFormat = format;
  try {
    await storage.setItem(CALENDAR_STORAGE_KEY, format);
  } catch (e) {}
  DeviceEventEmitter.emit(CALENDAR_EVENT_NAME, format);
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
    const timeSub = DeviceEventEmitter.addListener(TIME_EVENT_NAME, (f: string) => setFormat(f));
    const calendarSub = DeviceEventEmitter.addListener(CALENDAR_EVENT_NAME, (f: string) => setCalendarFormatState(f));
    return () => {
      timeSub.remove();
      calendarSub.remove();
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
