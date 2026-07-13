import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, Loader2, ChevronDown, ChevronUp, Users, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { fetchSchedules, createSchedule, updateSchedule, deleteSchedule, fetchScheduleDoctors, type Schedule } from '../store/slices/scheduleSlice';
import ScheduleModal from '../components/ScheduleModal';
import { showToast } from '../components/Toast';
import { formatDate, formatTime, formatWeekRange } from '../utils/ethiopianDate';
import { EthiopianDateHint } from '../components/EthiopianDateHint';


interface ScheduleForm {
  doctorId: number | '';
  date: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  repeatWeeks?: number;
  daysOfWeek?: number[];
  repeatEndDate?: string;
  clinicRoom: string;
  notes: string;
  isActive: boolean;
}

function toDateInput(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

function toTimeInput(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getWeekDays(refDate: Date) {
  const start = new Date(refDate);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}



function isToday(d: Date) {
  return d.toDateString() === new Date().toDateString();
}

function SchedulesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { schedules, loadingSchedules: loading, error, doctors: hospitalDoctors } = useSelector((state: RootState) => state.schedules);
  const [searchParams, setSearchParams] = useSearchParams();

  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState<number | ''>(
    () => { const d = searchParams.get('doctorId'); return d ? Number(d) : ''; }
  );

  // Sync doctorFilter to URL so "View Schedule" link keeps working
  useEffect(() => {
    const next: Record<string, string> = {};
    if (doctorFilter) next.doctorId = String(doctorFilter);
    setSearchParams(next, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorFilter]);

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [calendarType, setCalendarType] = useState<'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [preselectedDate, setPreselectedDate] = useState<string>('');
  const [preselectedStartTime, setPreselectedStartTime] = useState<string>('');
  const [preselectedEndTime, setPreselectedEndTime] = useState<string>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const mounted = useRef(true);

  const categories = [...new Set(hospitalDoctors.map((d) => d.specialization).filter(Boolean))].sort();
  const filteredDoctors = categoryFilter
    ? hospitalDoctors.filter((d) => d.specialization === categoryFilter)
    : hospitalDoctors;

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (categoryFilter && s.doctor.specialization !== categoryFilter) return false;
      if (doctorFilter && s.doctorId !== doctorFilter) return false;
      return true;
    });
  }, [schedules, categoryFilter, doctorFilter]);

  const weekDays = useMemo(() => {
    if (viewMode === 'calendar' && calendarType === 'day') {
      return [currentDate];
    }
    return getWeekDays(currentDate);
  }, [currentDate, viewMode, calendarType]);

  const loadSchedules = async () => {
    const params: Record<string, string> = {};
    if (doctorFilter) params.doctorId = String(doctorFilter);
    
    if (viewMode === 'list') {
      if (dateFilter) params.date = dateFilter;
    } else {
      if (calendarType === 'day') {
        const d = new Date(currentDate);
        params.from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).toISOString();
        params.to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
      } else {
        params.from = weekDays[0].toISOString();
        params.to = new Date(weekDays[weekDays.length - 1].getFullYear(), weekDays[weekDays.length - 1].getMonth(), weekDays[weekDays.length - 1].getDate(), 23, 59, 59).toISOString();
      }
    }

    dispatch(fetchSchedules(params));
  };

  useEffect(() => {
    mounted.current = true;
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, doctorFilter, viewMode, calendarType, currentDate]);

  useEffect(() => {
    mounted.current = true;
    dispatch(fetchScheduleDoctors());
    return () => { mounted.current = false; };
  }, [dispatch]);

  const initialMount = useRef(true);
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    setDoctorFilter('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  useEffect(() => {
    if (dateFilter) {
      setCurrentDate(new Date(dateFilter));
      setCalendarType('day');
    }
  }, [dateFilter]);

  const handleCreate = async (form: ScheduleForm) => {
    const payload: Record<string, unknown> = {
      doctorId: form.doctorId,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      slotDuration: form.slotDuration,
      clinicRoom: form.clinicRoom || undefined,
      notes: form.notes || undefined,
      isActive: form.isActive,
    };
    if ('repeatWeeks' in form && form.repeatWeeks && form.repeatWeeks > 1) {
      payload.repeatWeeks = form.repeatWeeks;
    }
    if ('daysOfWeek' in form && form.daysOfWeek && form.daysOfWeek.length > 0) {
      payload.daysOfWeek = form.daysOfWeek;
      payload.repeatEndDate = form.repeatEndDate;
    }
    
    await dispatch(createSchedule(payload as any)).unwrap();
    
    await loadSchedules();
    const isRecurring = !!payload.daysOfWeek || !!payload.repeatWeeks;
    showToast({ type: 'success', message: isRecurring ? 'Recurring schedule created!' : 'Schedule created!' });
  };

  const handleUpdate = async (form: ScheduleForm) => {
    if (!editing) return;
    const payload: Record<string, unknown> = {};
    if (form.doctorId !== editing.doctorId) payload.doctorId = form.doctorId;
    if (form.date !== toDateInput(editing.date)) payload.date = form.date;
    const newStart = toTimeInput(editing.startTime) !== form.startTime ? form.startTime : null;
    const newEnd = toTimeInput(editing.endTime) !== form.endTime ? form.endTime : null;
    if (newStart) payload.startTime = new Date(`${form.date}T${form.startTime}`).toISOString();
    if (newEnd) payload.endTime = new Date(`${form.date}T${form.endTime}`).toISOString();
    if (form.slotDuration !== editing.slotDuration) payload.slotDuration = form.slotDuration;
    if (form.clinicRoom !== (editing.clinicRoom || '')) payload.clinicRoom = form.clinicRoom || undefined;
    if (form.notes !== (editing.notes || '')) payload.notes = form.notes || undefined;
    if (form.isActive !== editing.isActive) payload.isActive = form.isActive;

    if (Object.keys(payload).length === 0) return;
    await dispatch(updateSchedule({ id: editing.id, payload })).unwrap();
    await loadSchedules();
    showToast({ type: 'success', message: 'Schedule updated.' });
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await dispatch(deleteSchedule(id)).unwrap();
      await loadSchedules();
      showToast({ type: 'success', message: 'Schedule deleted.' });
    } catch (err) {
      showToast({ type: 'error', message: typeof err === 'string' ? err : 'Failed to delete schedule' });
    } finally {
      setDeletingId(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setPreselectedDate('');
    setPreselectedStartTime('');
    setPreselectedEndTime('');
    setModalOpen(true);
  };

  const openEdit = (schedule: Schedule) => {
    setEditing(schedule);
    setPreselectedDate('');
    setPreselectedStartTime('');
    setPreselectedEndTime('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditing(null);
    setPreselectedDate('');
    setPreselectedStartTime('');
    setPreselectedEndTime('');
  };

  const renderCalendar = () => {
    const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 to 22:00

    const handlePrev = () => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - (calendarType === 'week' ? 7 : 1));
      setCurrentDate(d);
    };

    const handleNext = () => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + (calendarType === 'week' ? 7 : 1));
      setCurrentDate(d);
    };

    const handleToday = () => {
      setCurrentDate(new Date());
      setCalendarType('day');
    };

    const DOCTOR_COLORS = [
      '#3B82F6', '#059669', '#D97706', '#DC2626', '#7C3AED',
      '#0891B2', '#65A30D', '#BE185D', '#1D4ED8', '#B45309',
    ];
    const doctorColorMap: Record<number, string> = {};
    hospitalDoctors.forEach((d, i) => {
      doctorColorMap[d.id] = DOCTOR_COLORS[i % DOCTOR_COLORS.length];
    });

    const openCreateWithDateTime = (day: Date, hour: number) => {
      const yyyy = day.getFullYear();
      const mm = String(day.getMonth() + 1).padStart(2, '0');
      const dd = String(day.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const hourStr = String(hour).padStart(2, '0') + ':00';
      const endHourStr = String(hour + 1).padStart(2, '0') + ':00';
      
      setPreselectedDate(dateStr);
      setPreselectedStartTime(hourStr);
      setPreselectedEndTime(endHourStr);
      setEditing(null);
      setModalOpen(true);
    };

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCalendarType('day')}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: calendarType === 'day' ? '#EFF6FF' : '#FFF', color: calendarType === 'day' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              Day
            </button>
            <button
              onClick={() => setCalendarType('week')}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: calendarType === 'week' ? '#EFF6FF' : '#FFF', color: calendarType === 'week' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              Week
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={handlePrev}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontWeight: 600, fontSize: 16, minWidth: '220px', textAlign: 'center' }}>
              {calendarType === 'week' ? formatWeekRange(weekDays) : formatDate(currentDate, 'full')}
            </span>
            <button
              onClick={handleNext}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={handleToday}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#FFF', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}
            >
              Today
            </button>
          </div>
          <div style={{ width: 120 }}></div>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `60px repeat(${weekDays.length}, 1fr)`, minWidth: calendarType === 'week' ? 700 : 'auto', borderBottom: '2px solid var(--border)' }}>
            <div style={{ padding: '10px 8px', fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'center' }}></div>
            {weekDays.map((d, i) => (
              <div
                key={i}
                onClick={() => {
                  if (calendarType === 'week') {
                    setCurrentDate(d);
                    setCalendarType('day');
                  }
                }}
                style={{
                  padding: '10px 4px', textAlign: 'center', fontWeight: isToday(d) ? 700 : 500,
                  fontSize: 13, color: isToday(d) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: isToday(d) ? '#EFF6FF' : 'transparent',
                  cursor: calendarType === 'week' ? 'pointer' : 'default',
                  borderRight: i < weekDays.length - 1 ? '1px solid #F1F5F9' : 'none',
                }}
              >
                <div>{formatDate(d, 'weekday-short')}</div>
                <div style={{ fontSize: 18 }}>{d.getDate()}</div>
              </div>
            ))}
          </div>

          <div style={{ minWidth: calendarType === 'week' ? 700 : 'auto', display: 'flex' }}>
            {/* Hour Labels on Left */}
            <div style={{ width: 60, flexShrink: 0, borderRight: '1px solid #F1F5F9' }}>
              {HOURS.map((hour) => {
                const timeLabel = formatTime(new Date(2024, 0, 1, hour, 0));
                return (
                  <div
                    key={hour}
                    style={{
                      height: 60,
                      padding: '4px 8px',
                      fontSize: 11,
                      color: '#94A3B8',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      borderBottom: '1px solid #F1F5F9',
                    }}
                  >
                    {timeLabel}
                  </div>
                );
              })}
            </div>

            {/* Day Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weekDays.length}, 1fr)`, flexGrow: 1 }}>
              {weekDays.map((day, dayIdx) => {
                const daySchedules = filteredSchedules.filter((s) => {
                  const dayUTC = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
                  const sDateUTC = s.date.slice(0, 10);
                  return sDateUTC === dayUTC;
                });

                return (
                  <div
                    key={dayIdx}
                    style={{
                      position: 'relative',
                      height: HOURS.length * 60,
                      borderRight: dayIdx < weekDays.length - 1 ? '1px solid #F1F5F9' : 'none',
                    }}
                  >
                    {/* Background Grid Cells */}
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        onClick={() => openCreateWithDateTime(day, hour)}
                        style={{
                          height: 60,
                          background: isToday(day) ? '#FAFAFE' : 'transparent',
                          borderBottom: '1px solid #F1F5F9',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isToday(day) ? '#FAFAFE' : 'transparent'; }}
                      />
                    ))}

                    {/* Absolutely Positioned Schedule Cards */}
                    {daySchedules.map((s) => {
                      const sStart = new Date(s.startTime);
                      const sEnd = new Date(s.endTime);
                      
                      const startHour = sStart.getHours() + sStart.getMinutes() / 60;
                      const endHour = sEnd.getHours() + sEnd.getMinutes() / 60;
                      
                      const top = Math.max(0, (startHour - 6) * 60);
                      const height = Math.max(30, (endHour - startHour) * 60);
                      
                      const docColor = doctorColorMap[s.doctorId] || '#3B82F6';
                      const totalCapacity = s.slots?.reduce((sum, sl) => sum + sl.maxPatients, 0) || 0;
                      const totalBooked = s.slots?.reduce((sum, sl) => sum + sl._count.bookings, 0) || 0;

                      return (
                        <div
                          key={s.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(s);
                          }}
                          title={`${s.doctor.fullName} (${s.doctor.specialization}) — ${formatTime(new Date(s.startTime))} to ${formatTime(new Date(s.endTime))}\n${totalBooked}/${totalCapacity} slots filled`}
                          style={{
                            position: 'absolute',
                            top: top + 4,
                            left: 4,
                            right: 4,
                            height: height - 8,
                            padding: '6px 8px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            lineHeight: 1.3,
                            background: s.isActive ? '#ECFDF3' : '#F2F4F7',
                            color: s.isActive ? '#027A48' : '#667085',
                            borderLeft: `3px solid ${docColor}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            zIndex: 10,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                              {s.doctor.fullName}
                            </div>
                            <div style={{ fontSize: '10px', opacity: 0.9, marginTop: 1 }}>
                              {formatTime(new Date(s.startTime))} – {formatTime(new Date(s.endTime))}
                            </div>
                          </div>
                          {totalCapacity > 0 && (
                            <div style={{ fontSize: '9px', opacity: 0.8, marginTop: 2 }}>
                              {totalBooked}/{totalCapacity} booked
                            </div>
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
    );
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 600 }}>Schedules</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '2px' }}>
            View and manage daily appointment schedules for all doctors.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--surface)' }}>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '8px 12px', fontSize: '13px', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: viewMode === 'calendar' ? '#F1F5F9' : 'transparent',
                color: viewMode === 'calendar' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
            >
              <CalendarIcon size={16} />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '8px 12px', fontSize: '13px', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: viewMode === 'list' ? '#F1F5F9' : 'transparent',
                color: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderLeft: '1px solid var(--border)',
              }}
            >
              <List size={16} />
              List
            </button>
          </div>

          <button
            onClick={openCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', fontSize: '14px', fontWeight: 600,
              border: 'none', borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            New Schedule
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
        {viewMode === 'list' && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '8px 12px', fontSize: '14px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text-primary)',
              }}
            />
            <EthiopianDateHint isoDate={dateFilter} />
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '8px 12px', fontSize: '14px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text-primary)', minWidth: '160px',
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Doctor</label>
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value ? Number(e.target.value) : '')}
            style={{
              padding: '8px 12px', fontSize: '14px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text-primary)', minWidth: '180px',
            }}
          >
            <option value="">All Doctors</option>
            {filteredDoctors.map((d) => (
              <option key={d.id} value={d.id}>{d.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEF3F2', color: 'var(--status-error)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '14px', border: '1px solid #FECDCA', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-secondary)', gap: '8px' }}>
          <Loader2 size={20} className="spin" />
          Loading schedules...
        </div>
      ) : viewMode === 'calendar' ? (
        renderCalendar()
      ) : filteredSchedules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>No schedules found</p>
          <p style={{ fontSize: '14px' }}>
            {dateFilter ? 'Try selecting a different date.' : 'Create a new schedule to get started.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSchedules.map((schedule) => {
            const isExpanded = expandedId === schedule.id;
            const totalCapacity = schedule.slots?.reduce((s, sl) => s + sl.maxPatients, 0) || 0;
            const totalBooked = schedule.slots?.reduce((s, sl) => s + sl._count.bookings, 0) || 0;
            return (
              <div key={schedule.id}>
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: isExpanded ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : schedule.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>
                        {schedule.doctor.fullName}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', background: '#F9F7F2', padding: '2px 8px', borderRadius: '4px' }}>
                        {schedule.doctor.specialization}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span>{formatDate(new Date(schedule.date), 'full')}</span>
                      <span>{formatTime(new Date(schedule.startTime))} – {formatTime(new Date(schedule.endTime))}</span>
                      <span>{schedule.slotDuration} min slots</span>
                      {schedule.clinicRoom && <span>· {schedule.clinicRoom}</span>}
                      {schedule.hospital?.name && <span style={{ fontWeight: 500, color: '#0369A1' }}>@{schedule.hospital.name}</span>}
                      {totalCapacity > 0 && (
                        <span style={{ color: totalBooked >= totalCapacity ? 'var(--status-error)' : 'var(--status-success)', fontWeight: 500 }}>
                          {totalBooked}/{totalCapacity} slots filled
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                    <span
                      style={{
                        fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                        background: schedule.isActive ? '#ECFDF3' : '#F2F4F7',
                        color: schedule.isActive ? 'var(--status-success)' : 'var(--text-secondary)',
                      }}
                    >
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => openEdit(schedule)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px' }}
                      title="Edit schedule"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      disabled={deletingId === schedule.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-error)', padding: '6px', opacity: deletingId === schedule.id ? 0.5 : 1 }}
                      title="Delete schedule"
                    >
                      <Trash2 size={16} />
                    </button>
                    {isExpanded ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                  </div>
                </div>

                {isExpanded && schedule.slots && (
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid var(--border)',
                      borderTop: 'none',
                      borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                      padding: '16px 20px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    {schedule.slots.map((slot) => {
                      const filled = slot._count.bookings;
                      const max = slot.maxPatients;
                      const isFull = filled >= max;
                      return (
                        <div
                          key={slot.id}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: `1px solid ${isFull ? '#FECDCA' : '#E2E8F0'}`,
                            background: isFull ? '#FEF3F2' : '#FFF',
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {formatTime(new Date(slot.startTime))} – {formatTime(new Date(slot.endTime))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: isFull ? 'var(--status-error)' : 'var(--text-secondary)' }}>
                            <Users size={12} />
                            <span>{filled}/{max} booked</span>
                          </div>
                          {isFull && (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-error)' }}>FULL</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <ScheduleModal
          key={editing ? `edit-${editing.id}` : 'create'}
          open={modalOpen}
          onClose={handleModalClose}
          onSave={editing ? handleUpdate : handleCreate}
          onDelete={editing ? () => handleDelete(editing.id) : undefined}
          doctors={hospitalDoctors}
          initial={
            editing
              ? {
                  doctorId: editing.doctorId,
                  date: toDateInput(editing.date),
                  startTime: toTimeInput(editing.startTime),
                  endTime: toTimeInput(editing.endTime),
                  slotDuration: editing.slotDuration,
                  clinicRoom: editing.clinicRoom || '',
                  notes: editing.notes || '',
                  isActive: editing.isActive,
                }
              : preselectedDate
                ? {
                    doctorId: doctorFilter ? Number(doctorFilter) : '',
                    date: preselectedDate,
                    startTime: preselectedStartTime || '09:00',
                    endTime: preselectedEndTime || '17:00',
                    slotDuration: 30,
                    clinicRoom: '',
                    notes: '',
                    isActive: true,
                  }
                : undefined
          }
        />
      )}
    </div>
  );
}

export default SchedulesPage;
