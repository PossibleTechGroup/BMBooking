import { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';
import type { OperatingHours, DaySchedule } from '../../store/slices/equipmentSlice';
import '../Modal.css';

export interface EditEquipmentData {
  price: number | null;
  duration: number;
  operatingHours: OperatingHours;
}

interface Props {
  open: boolean;
  name: string;
  currentPrice: number | null;
  currentDuration: number;
  currentHours: OperatingHours | null;
  onClose: () => void;
  onSave: (data: EditEquipmentData) => Promise<void>;
}

const DAYS: (keyof OperatingHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const WEEKDAYS = DAYS.slice(0, 5);
const WEEKEND = DAYS.slice(5);

const defaultDay: DaySchedule = { start: '08:00', end: '17:00', enabled: true, duration: 30 };
const weekendDay: DaySchedule = { start: '08:00', end: '13:00', enabled: true, duration: 30 };
const WEEKEND_DAYS = new Set(['saturday', 'sunday']);

function normalizeDay(raw: any, day: string): DaySchedule {
  if (!raw) return WEEKEND_DAYS.has(day) ? { ...weekendDay } : { ...defaultDay };
  return {
    start: raw.start || raw.open || '08:00',
    end: raw.end || raw.close || (WEEKEND_DAYS.has(day) ? '13:00' : '17:00'),
    enabled: raw.enabled ?? true,
    duration: raw.duration ? Number(raw.duration) : 30,
  };
}

function buildInitial(current: OperatingHours | null): OperatingHours {
  const hours: OperatingHours = {} as OperatingHours;
  for (const day of DAYS) {
    hours[day] = normalizeDay(current?.[day], day);
  }
  return hours;
}

const toggleStyle: React.CSSProperties = {
  position: 'relative',
  width: '40px',
  height: '22px',
  borderRadius: '11px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.2s',
  flexShrink: 0,
  padding: 0,
};

const toggleKnob: React.CSSProperties = {
  position: 'absolute',
  top: '2px',
  left: '2px',
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  background: '#fff',
  transition: 'transform 0.2s',
  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
};

function DayRow({ day, enabled, start, end, duration, onToggle, onUpdate }: {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
  duration: number;
  onToggle: () => void;
  onUpdate: (patch: Partial<DaySchedule>) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 14px', borderRadius: '10px',
      background: enabled ? 'var(--surface)' : '#f3f4f6',
      opacity: enabled ? 1 : 0.55,
      transition: 'opacity 0.2s, background 0.2s',
      border: '1px solid',
      borderColor: enabled ? 'var(--border)' : '#e5e7eb',
    }}>
      <button
        type="button"
        onClick={onToggle}
        style={{ ...toggleStyle, background: enabled ? '#059669' : '#d1d5db' }}
        aria-label={enabled ? 'In service' : 'Out of service'}
      >
        <div style={{ ...toggleKnob, transform: enabled ? 'translateX(18px)' : 'translateX(0)' }} />
      </button>

      <span style={{
        minWidth: '82px', fontWeight: 600, fontSize: '14px',
        textTransform: 'capitalize',
        color: enabled ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}>
        {day}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
        <input
          type="time"
          value={start}
          onChange={(e) => onUpdate({ start: e.target.value })}
          disabled={!enabled}
          style={{
            width: '95px', padding: '6px 8px', border: '1px solid var(--border)',
            borderRadius: '6px', fontSize: '13px',
            background: enabled ? '#fff' : '#e5e7eb',
            color: enabled ? 'var(--text-primary)' : '#9ca3af',
            cursor: enabled ? 'text' : 'not-allowed',
          }}
        />
        <span style={{
          color: enabled ? 'var(--text-secondary)' : '#9ca3af',
          fontSize: '12px', fontWeight: 500,
        }}>–</span>
        <input
          type="time"
          value={end}
          onChange={(e) => onUpdate({ end: e.target.value })}
          disabled={!enabled}
          style={{
            width: '95px', padding: '6px 8px', border: '1px solid var(--border)',
            borderRadius: '6px', fontSize: '13px',
            background: enabled ? '#fff' : '#e5e7eb',
            color: enabled ? 'var(--text-primary)' : '#9ca3af',
            cursor: enabled ? 'text' : 'not-allowed',
          }}
        />

        <div style={{
          display: 'flex', alignItems: 'center', gap: '2px',
          marginLeft: '4px', flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={() => onUpdate({ duration: Math.max(5, duration - 5) })}
            disabled={!enabled}
            style={{
              width: '24px', height: '24px', borderRadius: '4px',
              border: '1px solid var(--border)', background: enabled ? '#FFF' : '#e5e7eb',
              cursor: enabled ? 'pointer' : 'not-allowed',
              fontSize: '14px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: enabled ? 'var(--text-primary)' : '#9ca3af',
              padding: 0,
            }}
          >
            –
          </button>
          <input
            type="number"
            min={5}
            max={240}
            step={5}
            value={duration}
            onChange={(e) => onUpdate({ duration: Math.max(5, Math.min(240, Number(e.target.value) || 5)) })}
            disabled={!enabled}
            style={{
              width: '42px', padding: '4px 2px',
              border: '1px solid var(--border)', borderRadius: '4px',
              fontSize: '12px', fontWeight: 600, textAlign: 'center',
              background: enabled ? '#FFF' : '#e5e7eb',
              color: enabled ? 'var(--text-primary)' : '#9ca3af',
              cursor: enabled ? 'text' : 'not-allowed',
            }}
          />
          <button
            type="button"
            onClick={() => onUpdate({ duration: Math.min(240, duration + 5) })}
            disabled={!enabled}
            style={{
              width: '24px', height: '24px', borderRadius: '4px',
              border: '1px solid var(--border)', background: enabled ? '#FFF' : '#e5e7eb',
              cursor: enabled ? 'pointer' : 'not-allowed',
              fontSize: '14px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: enabled ? 'var(--text-primary)' : '#9ca3af',
              padding: 0,
            }}
          >
            +
          </button>
        </div>

        {!enabled && (
          <span style={{
            fontSize: '11px', fontWeight: 600, color: '#9ca3af',
            textTransform: 'uppercase', letterSpacing: '0.3px',
            whiteSpace: 'nowrap',
          }}>
            Closed
          </span>
        )}
      </div>
    </div>
  );
}

export default function EditEquipmentModal({ open, name, currentPrice, currentDuration, currentHours, onClose, onSave }: Props) {
  const [price, setPrice] = useState<string>(
    currentPrice != null ? String(currentPrice) : ''
  );
  const [duration, setDuration] = useState(currentDuration);
  const [hours, setHours] = useState<OperatingHours>(() => buildInitial(currentHours));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPrice(currentPrice != null ? String(currentPrice) : '');
      setDuration(currentDuration);
      setHours(buildInitial(currentHours));
    }
  }, [open, currentPrice, currentDuration, currentHours]);

  const updateDay = (day: keyof OperatingHours, patch: Partial<DaySchedule>) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const toggleDay = (day: keyof OperatingHours) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const trimmed = price.trim();
      const priceVal = trimmed === '' ? null : Number(trimmed);
      await onSave({
        price: priceVal !== null && !isNaN(priceVal) ? priceVal : null,
        duration,
        operatingHours: hours,
      });
      onClose();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container max-w-lg animate-fade">
        <div className="modal-header">
          <h3 className="modal-title"><Settings size={18} /> Edit Equipment — {name}</h3>
          <button onClick={onClose} className="modal-close-btn"><X size={20} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {/* Fee & Duration row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Fee (ETB)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Free"
                  style={{
                    flex: 1, padding: '8px 10px', fontSize: '14px',
                    border: '1px solid var(--border)', borderRadius: '6px',
                    outline: 'none', background: 'var(--surface)',
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>ETB</span>
              </div>
            </div>
            <div style={{ flex: '0 0 140px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Default Duration
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setDuration(d => Math.max(5, d - 5))}
                  style={{
                    width: '32px', height: '34px', borderRadius: '4px',
                    border: '1px solid var(--border)', background: '#FFF',
                    cursor: 'pointer', fontSize: '16px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  –
                </button>
                <input
                  type="number"
                  min={5}
                  max={240}
                  step={5}
                  value={duration}
                  onChange={(e) => setDuration(Math.max(5, Math.min(240, Number(e.target.value) || 5)))}
                  style={{
                    width: '54px', padding: '6px 2px',
                    border: '1px solid var(--border)', borderRadius: '4px',
                    fontSize: '14px', fontWeight: 600, textAlign: 'center',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setDuration(d => Math.min(240, d + 5))}
                  style={{
                    width: '32px', height: '34px', borderRadius: '4px',
                    border: '1px solid var(--border)', background: '#FFF',
                    cursor: 'pointer', fontSize: '16px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Weekdays */}
          <div>
            <h4 style={{
              margin: '0 0 8px 0', fontSize: '12px', fontWeight: 700,
              color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Operating Hours — Weekdays
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {WEEKDAYS.map(day => (
                <DayRow
                  key={day}
                  day={day}
                  enabled={hours[day].enabled}
                  start={hours[day].start}
                  end={hours[day].end}
                  duration={hours[day].duration ?? duration}
                  onToggle={() => toggleDay(day)}
                  onUpdate={(patch) => updateDay(day, patch)}
                />
              ))}
            </div>
          </div>

          {/* Weekend */}
          <div>
            <h4 style={{
              margin: '0 0 8px 0', fontSize: '12px', fontWeight: 700,
              color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Operating Hours — Weekend
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {WEEKEND.map(day => (
                <DayRow
                  key={day}
                  day={day}
                  enabled={hours[day].enabled}
                  start={hours[day].start}
                  end={hours[day].end}
                  duration={hours[day].duration ?? duration}
                  onToggle={() => toggleDay(day)}
                  onUpdate={(patch) => updateDay(day, patch)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onClose} className="modal-btn modal-btn-cancel">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="modal-btn modal-btn-confirm">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}