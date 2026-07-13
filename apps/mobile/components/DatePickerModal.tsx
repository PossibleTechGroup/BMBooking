import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Modal, View, Pressable, ScrollView, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { MedText } from './medconnect/MedText';
import {
  ETHIOPIAN_MONTHS,
  gregorianToEthiopian,
  ethiopianDateToGregorian,
} from '../utils/ethiopianDate';

const DAY_NAMES_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CALENDAR_ROWS = 6;
const CALENDAR_COLS = 7;
const ETH_MONTH_COUNT = 13;

function isEthiopianLeapYear(ethYear: number): boolean {
  return ethYear % 4 === 3;
}

function getDaysInGregorianMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getDaysInEthiopianMonth(ethMonth: number, ethYear: number): number {
  if (ethMonth === 13) return isEthiopianLeapYear(ethYear) ? 6 : 5;
  return 30;
}

function getFirstDayOfGregorianMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function clampGregorianDay(year: number, month: number, day: number): number {
  return Math.min(day, getDaysInGregorianMonth(year, month));
}

function clampEthiopianDay(ethYear: number, ethMonth: number, day: number): number {
  return Math.min(day, getDaysInEthiopianMonth(ethMonth, ethYear));
}

interface DatePickerModalProps {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
  calendar?: 'gregorian' | 'ethiopian';
}

export default function DatePickerModal({
  visible,
  value,
  onConfirm,
  onCancel,
  minimumDate,
  maximumDate,
  calendar = 'gregorian',
}: DatePickerModalProps) {
  const isEthiopian = calendar === 'ethiopian';
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const initialEth = gregorianToEthiopian(value);
  const [selectedYear, setSelectedYear] = useState(isEthiopian ? initialEth.year : value.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(isEthiopian ? initialEth.month : value.getMonth());
  const [selectedDay, setSelectedDay] = useState(isEthiopian ? initialEth.day : value.getDate());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const yearScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      if (isEthiopian) {
        const eth = gregorianToEthiopian(value);
        setSelectedYear(eth.year);
        setSelectedMonth(eth.month);
        setSelectedDay(eth.day);
      } else {
        setSelectedYear(value.getFullYear());
        setSelectedMonth(value.getMonth());
        setSelectedDay(value.getDate());
      }
      setShowYearPicker(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, value, isEthiopian]);

  const minYear = useMemo(() => {
    if (minimumDate) {
      return isEthiopian ? gregorianToEthiopian(minimumDate).year : minimumDate.getFullYear();
    }
    return selectedYear - 100;
  }, [minimumDate, isEthiopian, selectedYear]);

  const maxYear = useMemo(() => {
    if (maximumDate) {
      return isEthiopian ? gregorianToEthiopian(maximumDate).year : maximumDate.getFullYear();
    }
    return selectedYear + 100;
  }, [maximumDate, isEthiopian, selectedYear]);

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      arr.push(y);
    }
    return arr;
  }, [minYear, maxYear]);

  useEffect(() => {
    if (showYearPicker && yearScrollRef.current) {
      setTimeout(() => {
        yearScrollRef.current?.scrollTo({
          y: (years.indexOf(selectedYear) + 1) * 56 - 150,
          animated: true,
        });
      }, 100);
    }
  }, [showYearPicker, years, selectedYear]);

  const daysInMonth = isEthiopian
    ? getDaysInEthiopianMonth(selectedMonth, selectedYear)
    : getDaysInGregorianMonth(selectedYear, selectedMonth);

  const firstDay = isEthiopian ? 0 : getFirstDayOfGregorianMonth(selectedYear, selectedMonth);

  const selectedGregorianDate = useCallback((): Date => {
    if (isEthiopian) {
      return ethiopianDateToGregorian(selectedYear, selectedMonth, selectedDay);
    }
    return new Date(selectedYear, selectedMonth, selectedDay);
  }, [isEthiopian, selectedYear, selectedMonth, selectedDay]);

  const isDayDisabled = useCallback((day: number): boolean => {
    const d = isEthiopian
      ? ethiopianDateToGregorian(selectedYear, selectedMonth, day)
      : new Date(selectedYear, selectedMonth, day);
    if (minimumDate && d.getTime() < minimumDate.getTime()) return true;
    if (maximumDate && d.getTime() > maximumDate.getTime()) return true;
    return false;
  }, [isEthiopian, selectedYear, selectedMonth, minimumDate, maximumDate]);

  const isPrevMonthDisabled = (): boolean => {
    if (!minimumDate) return false;
    if (isEthiopian) {
      const prevMonth = selectedMonth === 1 ? 13 : selectedMonth - 1;
      const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      const d = ethiopianDateToGregorian(prevYear, prevMonth, getDaysInEthiopianMonth(prevMonth, prevYear));
      return d.getTime() < minimumDate.getTime();
    }
    const prev = new Date(selectedYear, selectedMonth - 1, 1);
    return prev.getTime() < minimumDate.getTime();
  };

  const isNextMonthDisabled = (): boolean => {
    if (!maximumDate) return false;
    if (isEthiopian) {
      const nextMonth = selectedMonth === 13 ? 1 : selectedMonth + 1;
      const nextYear = selectedMonth === 13 ? selectedYear + 1 : selectedYear;
      const d = ethiopianDateToGregorian(nextYear, nextMonth, 1);
      return d.getTime() > maximumDate.getTime();
    }
    const nextMonthFirst = new Date(selectedYear, selectedMonth + 1, 1);
    return nextMonthFirst.getTime() > maximumDate.getTime();
  };

  const changeMonth = (delta: number) => {
    if (isEthiopian) {
      let newMonth = selectedMonth + delta;
      let newYear = selectedYear;
      if (newMonth < 1) {
        newMonth = ETH_MONTH_COUNT;
        newYear -= 1;
      } else if (newMonth > ETH_MONTH_COUNT) {
        newMonth = 1;
        newYear += 1;
      }
      setSelectedYear(newYear);
      setSelectedMonth(newMonth);
      setSelectedDay(prev => clampEthiopianDay(newYear, newMonth, prev));
      return;
    }
    const newDate = new Date(selectedYear, selectedMonth + delta, 1);
    const newYear = newDate.getFullYear();
    const newMonth = newDate.getMonth();
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    setSelectedDay(prev => clampGregorianDay(newYear, newMonth, prev));
  };

  const todayRef = useRef(new Date());
  useEffect(() => { todayRef.current = new Date(); }, []);

  const isToday = useCallback((day: number) => {
    const t = todayRef.current;
    if (isEthiopian) {
      const ethToday = gregorianToEthiopian(t);
      return ethToday.year === selectedYear && ethToday.month === selectedMonth && ethToday.day === day;
    }
    return t.getFullYear() === selectedYear && t.getMonth() === selectedMonth && t.getDate() === day;
  }, [isEthiopian, selectedYear, selectedMonth]);

  const handleConfirm = () => {
    onConfirm(selectedGregorianDate());
  };

  const monthLabel = isEthiopian
    ? ETHIOPIAN_MONTHS[selectedMonth]?.am ?? ''
    : MONTH_NAMES[selectedMonth];

  const calendarDays: (number | null)[] = useMemo(() => {
    const totalCells = CALENDAR_ROWS * CALENDAR_COLS;
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    while (days.length < totalCells) {
      days.push(null);
    }
    return days;
  }, [firstDay, daysInMonth]);

  const weekRows: (number | null)[][] = useMemo(() => {
    const rows: (number | null)[][] = [];
    for (let i = 0; i < calendarDays.length; i += CALENDAR_COLS) {
      rows.push(calendarDays.slice(i, i + CALENDAR_COLS));
    }
    return rows;
  }, [calendarDays]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: theme.surface, shadowColor: '#000' },
          ]}
        >
          {showYearPicker ? (
            <>
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Pressable onPress={() => setShowYearPicker(false)} hitSlop={12}>
                  <Ionicons name="chevron-back" size={22} color={theme.text} />
                </Pressable>
                <MedText variant="h2" style={{ fontSize: 18 }}>Select Year</MedText>
                <View style={{ width: 22 }} />
              </View>
              <ScrollView
                ref={yearScrollRef}
                style={styles.yearList}
                contentContainerStyle={{ paddingVertical: 8 }}
                showsVerticalScrollIndicator={false}
              >
                {years.map(year => (
                  <Pressable
                    key={year}
                    onPress={() => {
                      setSelectedYear(year);
                      setSelectedDay(prev =>
                        isEthiopian
                          ? clampEthiopianDay(year, selectedMonth, prev)
                          : clampGregorianDay(year, selectedMonth, prev),
                      );
                      setShowYearPicker(false);
                    }}
                    style={[
                      styles.yearItem,
                      {
                        backgroundColor: year === selectedYear ? theme.primary + '12' : 'transparent',
                      },
                    ]}
                  >
                    <MedText
                      variant="body"
                      style={{
                        fontWeight: year === selectedYear ? '700' : '400',
                        color: year === selectedYear ? theme.primary : theme.text,
                        fontSize: year === selectedYear ? 18 : 16,
                      }}
                    >
                      {year}
                    </MedText>
                    {year === selectedYear && (
                      <Ionicons name="checkmark" size={18} color={theme.primary} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Pressable onPress={onCancel} hitSlop={12}>
                  <Ionicons name="close" size={22} color={theme.muted} />
                </Pressable>
                <Pressable onPress={() => setShowYearPicker(true)} style={styles.yearSelector}>
                  <MedText variant="h2" style={{ fontSize: 17 }}>{selectedYear}</MedText>
                  <Ionicons name="chevron-down" size={14} color={theme.text} style={{ marginTop: 2 }} />
                </Pressable>
                <Pressable onPress={handleConfirm} hitSlop={12}>
                  <MedText variant="body" style={{ color: theme.primary, fontWeight: '600', fontSize: 15 }}>
                    Done
                  </MedText>
                </Pressable>
              </View>

              <View style={styles.monthNav}>
                <Pressable onPress={() => changeMonth(-1)} disabled={isPrevMonthDisabled()} hitSlop={12} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={20} color={isPrevMonthDisabled() ? theme.border : theme.text} />
                </Pressable>
                <MedText variant="body" style={{ fontWeight: '600', fontSize: 15 }}>
                  {monthLabel}
                </MedText>
                <Pressable onPress={() => changeMonth(1)} disabled={isNextMonthDisabled()} hitSlop={12} style={styles.navBtn}>
                  <Ionicons name="chevron-forward" size={20} color={isNextMonthDisabled() ? theme.border : theme.text} />
                </Pressable>
              </View>

              {!isEthiopian && (
                <View style={styles.weekdayRow}>
                  {DAY_NAMES_SHORT.map(name => (
                    <View key={name} style={styles.weekdayCell}>
                      <MedText variant="metadata" style={{ color: theme.muted, fontSize: 12, fontWeight: '600' }}>
                        {name}
                      </MedText>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.daysGrid}>
                {weekRows.map((row, rowIdx) => (
                  <View key={rowIdx} style={styles.weekRow}>
                    {row.map((day, colIdx) => {
                      if (day === null) {
                        return <View key={`e-${rowIdx}-${colIdx}`} style={styles.dayCell} />;
                      }
                      const disabled = isDayDisabled(day);
                      const selected = day === selectedDay;
                      const today = isToday(day);
                      return (
                        <Pressable
                          key={`d-${day}`}
                          onPress={() => !disabled && setSelectedDay(day)}
                          style={[
                            styles.dayCell,
                            selected && { backgroundColor: theme.primary },
                            today && !selected && { borderWidth: 1.5, borderColor: theme.primary },
                          ]}
                        >
                          <MedText
                            variant="body"
                            style={{
                              fontSize: 15,
                              fontWeight: selected || today ? '600' : '400',
                              color: disabled ? theme.border : selected ? '#FFF' : theme.text,
                            }}
                          >
                            {day}
                          </MedText>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>

              <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <Pressable
                  onPress={onCancel}
                  style={[styles.footerBtn, { backgroundColor: theme.background }]}
                >
                  <MedText variant="body" style={{ color: theme.text, fontWeight: '500' }}>Cancel</MedText>
                </Pressable>
                <Pressable
                  onPress={handleConfirm}
                  style={[styles.footerBtn, { backgroundColor: theme.primary }]}
                >
                  <MedText variant="body" style={{ color: '#FFF', fontWeight: '600' }}>Confirm</MedText>
                </Pressable>
              </View>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
    minHeight: 480,
    elevation: 24,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  navBtn: {
    padding: 6,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  daysGrid: {
    paddingHorizontal: 16,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
    margin: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 8,
  },
  footerBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  yearList: {
    height: 380,
  },
  yearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 10,
    marginVertical: 2,
  },
});
