'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchDoctorScheduleSlots, fetchDoctorAppointments } from '@/lib/store/slices/appointmentSlice';
import { MedText } from '@/components/ui/med-text';
import { MedButton } from '@/components/ui/med-button';
import { Clock, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { gregorianToEthiopian, formatEthiopianCalendarDate, formatEthiopianMonthYear, formatEthiopianDayLabel, ETHIOPIAN_MONTHS, AMHARIC_WEEKDAYS_SHORT } from '@/lib/utils/ethiopianDate';

function getMonday(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - ((day + 6) % 7));
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0];
}

const GREG_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ETH_DAY_LABELS = ['ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'ዓርብ', 'ቅዳ', 'እሁ'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);
const HOUR_HEIGHT = 64;
const START_HOUR = 8;

function timeToMinutes(dateStr: string) {
  const d = new Date(dateStr);
  return d.getHours() * 60 + d.getMinutes();
}

function formatHour(h: number) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

const APPT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: 'bg-[#FEF3C7]', border: 'border-[#F59E0B]', text: 'text-[#92400E]' },
  accepted: { bg: 'bg-[#ECFDF3]', border: 'border-[#027A48]', text: 'text-[#027A48]' },
  completed: { bg: 'bg-[#EFF6FF]', border: 'border-[#2563EB]', text: 'text-[#2563EB]' },
  declined: { bg: 'bg-[#FEF3F2]', border: 'border-[#B42318]', text: 'text-[#B42318]' },
  cancelled: { bg: 'bg-[#F3F4F6]', border: 'border-[#5A6B80]', text: 'text-[#5A6B80]' },
};

type CalendarType = 'gregorian' | 'ethiopian';

function getDateLabel(d: Date, cal: CalendarType) {
  return cal === 'ethiopian' ? formatEthiopianCalendarDate(d, 'month-day') : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function getMonthYearLabel(d: Date, cal: CalendarType) {
  return cal === 'ethiopian' ? formatEthiopianMonthYear(d) : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getDayLabel(d: Date, cal: CalendarType, idx: number) {
  return cal === 'ethiopian' ? ETH_DAY_LABELS[idx] : GREG_DAY_LABELS[idx];
}

function getDateNumber(d: Date) {
  return d.getDate();
}

export default function DoctorSchedulePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { doctorSchedules, appointments, loadingSchedules } = useAppSelector((s) => s.appointment);
  const { token } = useAppSelector((s) => s.auth);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [mounted, setMounted] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: Date; hour: number } | null>(null);
  const [calendarType, setCalendarType] = useState<CalendarType>('gregorian');
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('calendar_type') as CalendarType | null;
    if (saved === 'ethiopian' || saved === 'gregorian') setCalendarType(saved);
    setMounted(true);
  }, []);

  const toggleCalendar = () => {
    const next = calendarType === 'gregorian' ? 'ethiopian' : 'gregorian';
    setCalendarType(next);
    localStorage.setItem('calendar_type', next);
  };

  const doctorId = (user as any)?.doctorProfile?.id;

  useEffect(() => {
    if (doctorId && token) {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      dispatch(fetchDoctorScheduleSlots({ doctorId, from: toISO(weekStart), to: toISO(end) }));
      dispatch(fetchDoctorAppointments({}));
    }
  }, [doctorId, weekStart, dispatch, token]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const goToday = () => setWeekStart(getMonday(new Date()));

  const getScheduleForDay = useCallback((date: Date) => {
    return doctorSchedules.filter((s) => s.date?.split('T')[0] === toISO(date));
  }, [doctorSchedules]);

  const getAppointmentsForDay = useCallback((date: Date) => {
    return appointments.filter((a) => sameDay(new Date(a.dateTime), date));
  }, [appointments]);

  const today = new Date();
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const isCurrentWeek = useMemo(() => sameDay(weekStart, getMonday(today)), [weekStart]);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (mounted && gridRef.current && isCurrentWeek) {
      const scrollTarget = Math.max(0, ((nowMinutes / 60 - START_HOUR) * HOUR_HEIGHT) - 100);
      gridRef.current.scrollTop = scrollTarget;
    }
  }, [mounted, isCurrentWeek]);

  const handleSlotClick = (day: Date, hour: number) => {
    setSelectedSlot({ day, hour });
  };

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 110px)' }}>
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={goToday}
            className="px-3 py-1.5 text-[13px] font-medium border border-border rounded-lg hover:bg-foreground/5 transition-colors">
            Today
          </button>
          <div className="flex items-center gap-1">
            <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-foreground/5 transition-colors text-text-secondary">
              <ChevronLeft size={18} />
            </button>
            <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-foreground/5 transition-colors text-text-secondary">
              <ChevronRight size={18} />
            </button>
          </div>
          <MedText variant="body" className="text-[16px] font-semibold">
            {getMonthYearLabel(weekStart, calendarType)}
          </MedText>
        </div>

        <div className="flex items-center gap-3">
          <MedText variant="metadata" className="text-[11px] text-muted hidden sm:block">{timezone}</MedText>

          {/* Calendar Switch */}
          <button
            onClick={toggleCalendar}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg hover:bg-foreground/5 transition-colors"
          >
            <span className={`text-[12px] font-medium ${calendarType === 'gregorian' ? 'text-primary' : 'text-muted'}`}>
              {calendarType === 'gregorian' ? '🇬🇧' : '🇪🇹'}
            </span>
            <span className="text-[12px] font-medium text-text-secondary">
              {calendarType === 'gregorian' ? 'English' : 'አማርኛ'}
            </span>
          </button>
        </div>
      </div>

      {/* Calendar */}
      {mounted ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Day Headers */}
          <div className="flex border-b border-border bg-surface shrink-0">
            <div className="w-16 shrink-0" />
            {weekDays.map((d, i) => {
              const isToday = sameDay(d, today);
              return (
                <div key={i} className={`flex-1 flex flex-col items-center py-2 border-l border-border/50 ${isToday ? 'bg-primary/5' : ''}`}>
                  <MedText variant="metadata" className="text-[10px] text-muted font-medium uppercase tracking-wider">
                    {getDayLabel(d, calendarType, i)}
                  </MedText>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold mt-0.5 transition-all ${
                    isToday ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-text'
                  }`}>
                    {getDateNumber(d)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div ref={gridRef} className="flex-1 overflow-auto">
            <div className="flex relative">
              {/* Time Labels */}
              <div className="w-16 shrink-0">
                {HOURS.map((h) => (
                  <div key={h} style={{ height: HOUR_HEIGHT }} className="relative border-b border-border/30">
                    <span className="absolute -top-2.5 right-2 text-[10px] text-muted font-medium bg-background px-1">
                      {formatHour(h)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              <div className="flex-1 grid grid-cols-7">
                {weekDays.map((d, dayIdx) => {
                  const isToday = sameDay(d, today);
                  const daySchedules = getScheduleForDay(d);
                  const dayAppointments = getAppointmentsForDay(d);

                  return (
                    <div key={dayIdx} className="relative border-l border-border/50">
                      {/* Hour cells */}
                      {HOURS.map((h) => {
                        const isAvailable = daySchedules.some((s) => {
                          const sStart = timeToMinutes(s.startTime);
                          const sEnd = timeToMinutes(s.endTime);
                          return h * 60 >= sStart && h * 60 < sEnd;
                        });
                        return (
                          <div
                            key={h}
                            style={{ height: HOUR_HEIGHT }}
                            className={`border-b border-border/30 transition-colors ${
                              isAvailable ? 'cursor-pointer hover:bg-primary/10' : 'hover:bg-foreground/3'
                            }`}
                            onClick={() => handleSlotClick(d, h)}
                          />
                        );
                      })}

                      {/* Now Line */}
                      {isToday && (
                        <div
                          className="absolute left-0 right-0 z-30 pointer-events-none"
                          style={{ top: ((nowMinutes / 60 - START_HOUR) * HOUR_HEIGHT) }}
                        >
                          <div className="flex items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-error -ml-1.5 shrink-0" />
                            <div className="flex-1 h-[2px] bg-error" />
                          </div>
                        </div>
                      )}

                      {/* Schedule Blocks */}
                      {daySchedules.map((s) => {
                        const startMin = timeToMinutes(s.startTime);
                        const endMin = timeToMinutes(s.endTime);
                        const dur = endMin - startMin;
                        const top = ((startMin / 60 - START_HOUR) * HOUR_HEIGHT);
                        const height = Math.max((dur / 60) * HOUR_HEIGHT, 24);
                        return (
                          <div
                            key={`sched-${s.id}`}
                            className="absolute left-0.5 right-0.5 rounded-[6px] bg-primary/10 border border-primary/25 px-1.5 py-1 overflow-hidden z-10 hover:bg-primary/20 transition-colors cursor-default"
                            style={{ top, height }}
                          >
                            <div className="text-[10px] font-semibold text-primary truncate flex items-center gap-1">
                              <Clock size={9} />
                              {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {height > 36 && s.clinicRoom && (
                              <div className="text-[9px] text-primary/60 truncate mt-0.5 flex items-center gap-0.5">
                                <MapPin size={8} />{s.clinicRoom}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Appointment Events */}
                      {dayAppointments.map((a) => {
                        const startMin = timeToMinutes(a.dateTime);
                        const top = ((startMin / 60 - START_HOUR) * HOUR_HEIGHT);
                        const colors = APPT_COLORS[a.status] || APPT_COLORS.pending;
                        return (
                          <div
                            key={`appt-${a.id}`}
                            className={`absolute left-0.5 right-0.5 rounded-[6px] ${colors.bg} border ${colors.border} px-1.5 py-1 overflow-hidden z-20 hover:brightness-95 transition-all cursor-pointer shadow-sm`}
                            style={{ top, height: 52 }}
                          >
                            <div className={`text-[10px] font-semibold ${colors.text} truncate flex items-center gap-1`}>
                              <User size={9} />
                              {a.patient?.patientProfile?.fullName || 'Patient'}
                            </div>
                            <div className={`text-[9px] ${colors.text} opacity-70 truncate mt-0.5`}>
                              {new Date(a.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {a.reason && (
                              <div className={`text-[8px] ${colors.text} opacity-50 truncate mt-0.5`}>{a.reason}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Slot Detail Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedSlot(null)}>
          <div className="bg-surface rounded-t-[20px] sm:rounded-[20px] w-full max-w-sm p-5 animate-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
            <MedText variant="h2" as="h3" className="mb-1">
              {getDateLabel(selectedSlot.day, calendarType)}
            </MedText>
            <MedText variant="metadata" className="text-muted mb-4">{formatHour(selectedSlot.hour)} – {formatHour(selectedSlot.hour + 1)}</MedText>

            {(() => {
              const hourStart = selectedSlot.hour * 60;
              const hourEnd = hourStart + 60;
              const dayAppts = getAppointmentsForDay(selectedSlot.day).filter((a) => {
                const m = timeToMinutes(a.dateTime);
                return m >= hourStart && m < hourEnd;
              });
              const dayScheds = getScheduleForDay(selectedSlot.day).filter((s) => {
                const sMin = timeToMinutes(s.startTime);
                const eMin = timeToMinutes(s.endTime);
                return sMin < hourEnd && eMin > hourStart;
              });
              return (
                <div className="space-y-3">
                  {dayScheds.length > 0 && (
                    <div>
                      <MedText variant="metadata" className="text-[11px] text-muted uppercase mb-2">Available Slot</MedText>
                      {dayScheds.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-[10px] bg-primary/10 border border-primary/20">
                          <Clock size={14} className="text-primary" />
                          <div>
                            <MedText variant="body" className="text-[13px] font-medium text-primary">
                              {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </MedText>
                            {s.clinicRoom && <MedText variant="metadata" className="text-primary/60">{s.clinicRoom}</MedText>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {dayAppts.length > 0 && (
                    <div>
                      <MedText variant="metadata" className="text-[11px] text-muted uppercase mb-2">Appointments</MedText>
                      {dayAppts.map((a) => {
                        const colors = APPT_COLORS[a.status] || APPT_COLORS.pending;
                        return (
                          <div key={a.id} className={`flex items-center gap-2 p-2.5 rounded-[10px] ${colors.bg} border ${colors.border} mb-2`}>
                            <User size={14} className={colors.text} />
                            <div className="flex-1 min-w-0">
                              <MedText variant="body" className={`text-[13px] font-medium ${colors.text} truncate`}>
                                {a.patient?.patientProfile?.fullName || 'Patient'}
                              </MedText>
                              <MedText variant="metadata" className={`${colors.text} opacity-70`}>
                                {new Date(a.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {a.status}
                              </MedText>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {dayScheds.length === 0 && dayAppts.length === 0 && (
                    <MedText variant="body" className="text-muted text-center py-4">No slots or appointments at this time</MedText>
                  )}
                </div>
              );
            })()}

            <div className="mt-4">
              <MedButton title="Close" onPress={() => setSelectedSlot(null)} type="outline" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
