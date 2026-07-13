import { useState, useEffect, useRef } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import { formatTime } from '../../utils/ethiopianDate';
import client from '../../api/client';
import { EthiopianDateHint } from '../EthiopianDateHint';
import type { Appointment } from '../../pages/AppointmentsPage';

interface SlotData {
  id: number;
  startTime: string;
  endTime: string;
  maxPatients: number;
  _count: { bookings: number };
}

interface ReorderViewProps {
  appointments: Appointment[];
  doctorFilter: number | '';
  setDoctorFilter: (v: number | '') => void;
  reorderDate: string;
  onDateChange: (date: string) => void;
  allDoctors: { id: number; fullName: string; specialization: string }[];
  onApply: (orderedSlots: (number | null)[]) => Promise<void>;
}

export default function ReorderView({ appointments, doctorFilter, setDoctorFilter, reorderDate, onDateChange, allDoctors, onApply }: ReorderViewProps) {
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [orderedSlots, setOrderedSlots] = useState<(number | null)[]>([]);
  const [originalOrdered, setOriginalOrdered] = useState<(number | null)[]>([]);
  const [applying, setApplying] = useState(false);
  const dragItem = useRef<number | null>(null);

  const appointmentBySlot = new Map<number, Appointment>();
  for (const a of appointments) {
    if (a.doctorId === doctorFilter && a.slot?.id && ['pending', 'accepted'].includes(a.status)) {
      appointmentBySlot.set(a.slot.id, a);
    }
  }

  useEffect(() => {
    if (!doctorFilter || !reorderDate) {
      setSlots([]);
      setOrderedSlots([]);
      setOriginalOrdered([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);

    client.get('/receptionist/schedules', { params: { doctorId: doctorFilter, date: reorderDate } })
      .then((res) => {
        if (cancelled) return;
        const schedules: { slots: SlotData[] }[] = res.data.data || [];
        const allSlots: SlotData[] = [];
        for (const s of schedules) {
          allSlots.push(...(s.slots || []));
        }
        allSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        setSlots(allSlots);

        const initial: (number | null)[] = allSlots.map((slot) => {
          const apt = appointmentBySlot.get(slot.id);
          return apt ? apt.id : null;
        });
        setOrderedSlots(initial);
        setOriginalOrdered(initial);
        setLoadingSlots(false);
      })
      .catch(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => { cancelled = true; };
  }, [doctorFilter, reorderDate]);

  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
  };
  const handleDrop = (targetIdx: number) => {
    const fromIdx = dragItem.current;
    if (fromIdx === null || fromIdx === targetIdx) return;

    const newOrder = [...orderedSlots];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(targetIdx, 0, moved);
    setOrderedSlots(newOrder);

    dragItem.current = null;
  };
  const handleDragEnd = () => {
    dragItem.current = null;
  };

  const isDirty = orderedSlots.some((id, i) => id !== originalOrdered[i]);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Doctor</label>
        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value ? Number(e.target.value) : '')}
          style={{
            padding: '8px 12px',
            border: '1px solid #D0CEC6',
            borderRadius: 8,
            fontSize: 14,
            background: '#FFF',
            minWidth: 200,
          }}
        >
          <option value="">Select a doctor</option>
          {allDoctors.map((d) => (
            <option key={d.id} value={d.id}>{d.fullName} ({d.specialization})</option>
          ))}
        </select>
        <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Date</label>
        <input
          type="date"
          value={reorderDate}
          onChange={(e) => onDateChange(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #D0CEC6',
            borderRadius: 8,
            fontSize: 14,
            background: '#FFF',
          }}
        />
        <EthiopianDateHint isoDate={reorderDate} />
      </div>

      {loadingSlots && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading slots...</div>
      )}

      {!loadingSlots && doctorFilter && slots.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', background: '#FAF9F5', borderRadius: 12 }}>
          No schedule slots found for this doctor and date
        </div>
      )}

      {!loadingSlots && doctorFilter && slots.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {slots.map((slot, idx) => {
              const apptId = orderedSlots[idx];
              const isAppointment = apptId !== null;
              const apt = isAppointment ? appointments.find((a) => a.id === apptId) : null;
              const isDragging = dragItem.current === idx;

              return (
                <div
                  key={slot.id}
                  draggable={isAppointment}
                  onDragStart={() => isAppointment && handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: isDragging ? '#F0EFE8' : isAppointment ? '#FFF' : '#F9F8F4',
                    border: isAppointment
                      ? '1px solid #D0CEC6'
                      : '1px dashed #D5D2C8',
                    borderRadius: 10,
                    cursor: isAppointment ? 'grab' : 'default',
                    transition: 'background 0.15s, box-shadow 0.15s',
                    boxShadow: isDragging ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    opacity: isDragging ? 0.6 : 1,
                    userSelect: 'none',
                  }}
                >
                  {isAppointment ? (
                    <GripVertical size={18} color="#B0ADA5" />
                  ) : (
                    <div style={{ width: 18 }} />
                  )}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: isAppointment ? 'var(--text-secondary)' : '#B0ADA5',
                      minWidth: 70,
                    }}>
                      {formatTime(new Date(slot.startTime))}
                    </span>
                    {isAppointment && apt ? (
                      <>
                        <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
                          {apt.patient.patientProfile?.fullName || 'Unknown'}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '2px 10px',
                            borderRadius: 20,
                            background: apt.status === 'accepted' ? '#ECFDF3' : '#FFFAEB',
                            color: apt.status === 'accepted' ? '#027A48' : '#B54708',
                            textTransform: 'capitalize',
                          }}
                        >
                          {apt.status}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: '#B0ADA5', fontStyle: 'italic' }}>
                        <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        Empty slot — drop an appointment here
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            position: 'sticky',
            bottom: 0,
            marginTop: 24,
            padding: '16px 24px',
            background: '#FFF',
            borderTop: '1px solid #E8E5DD',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
          }}>
            <button
              onClick={() => setOrderedSlots([...originalOrdered])}
              disabled={!isDirty}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: '1px solid #D0CEC6',
                background: '#FFF',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: 14,
                cursor: isDirty ? 'pointer' : 'not-allowed',
                opacity: isDirty ? 1 : 0.5,
              }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setApplying(true);
                try {
                  await onApply(orderedSlots);
                } finally {
                  setApplying(false);
                }
              }}
              disabled={!isDirty || applying}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: isDirty ? 'var(--accent-primary)' : '#D0CEC6',
                color: '#FFF',
                fontWeight: 600,
                fontSize: 14,
                cursor: isDirty && !applying ? 'pointer' : 'not-allowed',
                opacity: applying ? 0.7 : 1,
              }}
            >
              {applying ? 'Applying...' : 'Apply Changes'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
