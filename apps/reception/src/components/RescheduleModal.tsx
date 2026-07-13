import { useState, useEffect, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { fetchSchedules } from '../store/slices/scheduleSlice';
import { Clock, Loader2, X } from 'lucide-react';
import { formatTime } from '../utils/ethiopianDate';
import './Modal.css';
import { EthiopianDateHint } from './EthiopianDateHint';

interface RescheduleModalProps {
  open: boolean;
  patientName: string;
  doctorId?: number;
  onClose: () => void;
  onConfirm: (dateTime: string) => Promise<void>;
}

interface SlotOption {
  id: number;
  startTime: string;
  endTime: string;
  maxPatients: number;
  _count: { bookings: number };
}

function toLocalDatetime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function RescheduleModal({ open, patientName, doctorId, onClose, onConfirm }: RescheduleModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [datetime, setDatetime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return toLocalDatetime(now.toISOString());
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Slot-based reschedule state (when doctorId is provided)
  const [date, setDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const { schedules, loadingSchedules } = useSelector((s: RootState) => s.schedules);
  const slots: SlotOption[] = (schedules || []).flatMap(
    (sched: any) => sched.slots || []
  ).sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  useEffect(() => {
    if (!open) {
      setDate('');
      setSelectedSlotId(null);
    }
  }, [open]);

  useEffect(() => {
    if (doctorId && date) {
      dispatch(fetchSchedules({ doctorId: doctorId.toString(), date }));
    }
  }, [doctorId, date, dispatch]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (doctorId) {
      if (!date || !selectedSlotId) return;
      const selected = slots.find((s) => s.id === selectedSlotId);
      if (!selected) return;
      setSaving(true);
      setError('');
      try {
        await onConfirm(selected.startTime);
        onClose();
      } catch (err) {
        const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to reschedule';
        setError(message);
      } finally {
        setSaving(false);
      }
    } else {
      if (!datetime) return;
      setSaving(true);
      setError('');
      try {
        await onConfirm(new Date(datetime).toISOString());
        onClose();
      } catch (err) {
        const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to reschedule';
        setError(message);
      } finally {
        setSaving(false);
      }
    }
  };

  const canSubmit = doctorId ? (!!date && !!selectedSlotId) : !!datetime;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-container ${doctorId ? 'max-w-md' : 'max-w-sm'} animate-fade`}>
        <div className="modal-header">
          <h3 className="modal-title">Reschedule Appointment</h3>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p className="modal-text">
            Select a new date and time for <strong>{patientName}</strong>'s appointment.
          </p>

          {error && (
            <div className="modal-error">
              {error}
            </div>
          )}

          {doctorId ? (
            <>
              <div className="modal-form-group">
                <label className="modal-label">
                  New Date
                  <span className="modal-required">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setSelectedSlotId(null); }}
                  className="modal-input"
                  required
                />
                <EthiopianDateHint isoDate={date} />
              </div>

              {date && (
                <div className="modal-form-group">
                  <label className="modal-label">
                    <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Available Slots
                    {selectedSlotId && <span style={{ fontSize: 12, color: '#027A48', marginLeft: 8 }}>✓ Slot selected</span>}
                  </label>
                  {loadingSchedules ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, padding: '8px 0' }}>
                      <Loader2 size={14} className="spin" /> Loading slots...
                    </div>
                  ) : slots.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#B54708', padding: '8px 12px', background: '#FFFAEB', borderRadius: 'var(--radius-sm)' }}>
                      No available slots for this doctor on this date.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {slots.map((slot) => {
                        const filled = slot._count.bookings;
                        const max = slot.maxPatients;
                        const isFull = filled >= max;
                        const isSelected = selectedSlotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => setSelectedSlotId(slot.id)}
                            title={isFull ? 'This slot is full' : `${filled}/${max} booked — click to select`}
                            style={{
                              padding: '8px 14px', borderRadius: '8px', cursor: isFull ? 'not-allowed' : 'pointer',
                              border: `1px solid ${isSelected ? '#3B82F6' : isFull ? '#FECDCA' : 'var(--border)'}`,
                              background: isSelected ? '#EFF6FF' : isFull ? '#FEF3F2' : '#FFF',
                              color: isFull ? 'var(--text-secondary)' : 'var(--text-primary)',
                              fontWeight: isSelected ? 600 : 400,
                              fontSize: 13,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                              opacity: isFull ? 0.6 : 1,
                            }}
                          >
                            <span>{formatTime(new Date(slot.startTime))} – {formatTime(new Date(slot.endTime))}</span>
                            <span style={{ fontSize: 11, color: isFull ? '#DC2626' : 'var(--text-secondary)' }}>
                              {isFull ? 'FULL' : `${max - filled} spot${max - filled !== 1 ? 's' : ''} left`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="modal-form-group">
              <label className="modal-label">
                New Date & Time
                <span className="modal-required">*</span>
              </label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="modal-input"
              />
              <EthiopianDateHint isoDate={datetime.split('T')[0]} />
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="modal-btn modal-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="modal-btn modal-btn-confirm"
            >
              {saving ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
