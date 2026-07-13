import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarStyles } from '../../pages/AppointmentsPage.styles';
import { statusColors } from './AppointmentsListView';
import { formatWeekRange, formatTime, WEEKDAYS_SHORT } from '../../utils/ethiopianDate';

function isToday(d: Date) {
  return d.toDateString() === new Date().toDateString();
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm

interface AppointmentsCalendarViewProps {
  loading: boolean;
  filtered: any[];
  weekDays: Date[];
  calendarDate: Date;
  setCalendarDate: (d: Date) => void;
  calendarAppointments: any[];
  doctorFilter: string | number;
  doctorColorMap: Record<number, string>;
  setDetailTarget: (a: any) => void;
}

export default function AppointmentsCalendarView({
  loading, filtered, weekDays, calendarDate, setCalendarDate,
  calendarAppointments, doctorFilter, doctorColorMap, setDetailTarget
}: AppointmentsCalendarViewProps) {
  return (
    <div>
      {/* Week navigation */}
      <div style={calendarStyles.navContainer}>
        <button
          onClick={() => {
            const d = new Date(calendarDate);
            d.setDate(d.getDate() - 7);
            setCalendarDate(d);
          }}
          style={calendarStyles.navBtn}
        >
          <ChevronLeft size={18} />
        </button>
        <span style={calendarStyles.navLabel}>{formatWeekRange(weekDays)}</span>
        <button
          onClick={() => {
            const d = new Date(calendarDate);
            d.setDate(d.getDate() + 7);
            setCalendarDate(d);
          }}
          style={calendarStyles.navBtn}
        >
          <ChevronRight size={18} />
        </button>
        <button onClick={() => setCalendarDate(new Date())} style={calendarStyles.todayBtn}>
          Today
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-secondary)', gap: '8px' }}>
          <Loader2 size={20} className="spin" />
          Loading calendar...
        </div>
      ) : (
        <div style={calendarStyles.calendarContainer}>
          {/* Header row — day names */}
          <div style={calendarStyles.headerRow}>
            <div style={calendarStyles.headerCell}></div>
            {weekDays.map((d, i) => {
              const today = isToday(d);
              return (
                <div key={i} style={{
                  ...calendarStyles.headerCell,
                  fontWeight: today ? 700 : 500,
                  color: today ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: today ? '#EFF6FF' : 'transparent',
                  borderRadius: today ? '8px 8px 0 0' : undefined,
                }}>
                  <div>{WEEKDAYS_SHORT[d.getDay()]}</div>
                  <div style={{
                    ...calendarStyles.headerDate,
                    color: today ? 'var(--accent-primary)' : 'var(--text-primary)',
                  }}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div style={{ minWidth: 700 }}>
            {HOURS.map((hour) => {
              const timeLabel = formatTime(new Date(new Date().setHours(hour, 0, 0, 0)));
              return (
                <div key={hour} style={calendarStyles.timeRow}>
                  <div style={calendarStyles.timeLabelCell}>{timeLabel}</div>
                  {weekDays.map((day, dayIdx) => {
                    const dayStart = new Date(day);
                    dayStart.setHours(hour, 0, 0, 0);
                    const dayEnd = new Date(day);
                    dayEnd.setHours(hour, 59, 59, 999);

                    const cellAppts = calendarAppointments[dayIdx]?.appointments.filter((a: any) => {
                      const t = new Date(a.dateTime);
                      return t >= dayStart && t <= dayEnd;
                    }) || [];

                    const today = isToday(day);

                    return (
                      <div key={dayIdx} style={{
                        ...calendarStyles.dayCell,
                        borderRight: dayIdx < 6 ? '1px solid #F1F5F9' : 'none',
                        background: today ? '#FAFCFF' : 'transparent',
                      }}>
                        {cellAppts.map((a: any) => {
                          const c = statusColors[a.status] || statusColors.pending;
                          const docColor = doctorColorMap[a.doctorId] || '#3B82F6';
                          const patientName = a.patient?.patientProfile?.fullName || 'Unknown';
                          const firstName = patientName.split(' ')[0];
                          return (
                            <div
                              key={a.id}
                              title={`${patientName} — ${formatTime(new Date(a.dateTime))} — Dr. ${a.doctor?.fullName || '?'}`}
                              style={{
                                ...calendarStyles.eventCard,
                                background: c.bg,
                                color: c.text,
                                borderLeft: `3px solid ${docColor}`,
                              }}
                              onClick={() => setDetailTarget(a)}
                            >
                              <span style={{ fontWeight: 700 }}>{firstName}</span> {formatTime(new Date(a.dateTime))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p style={calendarStyles.emptyMessage}>
          No appointments this week{doctorFilter ? ' for the selected doctor' : ''}.
        </p>
      )}
    </div>
  );
}
