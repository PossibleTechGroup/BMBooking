import { useState, useRef, type FormEvent } from 'react';
import { X, Upload } from 'lucide-react';
import type { OperatingHours, DaySchedule } from '../store/slices/equipmentSlice';
import './Modal.css';

export interface AddEquipmentForm {
  name: string;
  category: string;
  duration: number;
  price: number | null;
  description: string;
  photo: File | null;
  operatingHours: OperatingHours | null;
}

const DAYS: (keyof OperatingHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const WEEKDAYS = DAYS.slice(0, 5);
const WEEKEND = DAYS.slice(5);

const defaultDay: DaySchedule = { start: '08:00', end: '17:00', enabled: true, duration: 30 };
const weekendDay: DaySchedule = { start: '08:00', end: '13:00', enabled: true, duration: 30 };

function buildDefaultHours(): OperatingHours {
  const hours = {} as OperatingHours;
  for (const day of WEEKDAYS) hours[day] = { ...defaultDay };
  for (const day of WEEKEND) hours[day] = { ...weekendDay };
  return hours;
}

interface AddEquipmentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: AddEquipmentForm) => Promise<void>;
}

const CATEGORIES = [
  { value: 'MRI', label: 'MRI' },
  { value: 'CT_SCAN', label: 'CT Scan' },
  { value: 'DIALYSIS', label: 'Dialysis' },
  { value: 'ULTRASOUND', label: 'Ultrasound' },
  { value: 'XRAY', label: 'X-Ray' },
  { value: 'VENTILATOR', label: 'Ventilator' },
  { value: 'ECG', label: 'ECG' },
  { value: 'MAMMOGRAPHY', label: 'Mammography' },
  { value: 'DEFIBRILLATOR', label: 'Defibrillator' },
  { value: 'OTHER', label: 'Other' },
];

function DayRow({ day, enabled, start, end, duration, onToggle, onUpdate, toggleStyle, toggleKnob }: {
  day: string; enabled: boolean; start: string; end: string; duration: number;
  onToggle: () => void; onUpdate: (patch: Partial<DaySchedule>) => void;
  toggleStyle: React.CSSProperties; toggleKnob: React.CSSProperties;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 10px', borderRadius: '8px',
      background: enabled ? 'var(--surface)' : '#f3f4f6',
      opacity: enabled ? 1 : 0.55, border: '1px solid',
      borderColor: enabled ? 'var(--border)' : '#e5e7eb',
    }}>
      <button type="button" onClick={onToggle}
        style={{ ...toggleStyle, background: enabled ? '#059669' : '#d1d5db' }}
        aria-label={enabled ? 'In service' : 'Out of service'}
      >
        <div style={{ ...toggleKnob, transform: enabled ? 'translateX(18px)' : 'translateX(0)' }} />
      </button>
      <span style={{ minWidth: '72px', fontWeight: 600, fontSize: '13px', textTransform: 'capitalize',
        color: enabled ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
        {day}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'flex-end' }}>
        <input type="time" value={start} onChange={(e) => onUpdate({ start: e.target.value })} disabled={!enabled}
          style={{ width: '90px', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '12px' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>–</span>
        <input type="time" value={end} onChange={(e) => onUpdate({ end: e.target.value })} disabled={!enabled}
          style={{ width: '90px', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1px', marginLeft: '2px' }}>
          <button type="button" onClick={() => onUpdate({ duration: Math.max(5, duration - 5) })} disabled={!enabled}
            style={{ width: '22px', height: '22px', borderRadius: '3px', border: '1px solid var(--border)',
              background: enabled ? '#FFF' : '#e5e7eb', cursor: enabled ? 'pointer' : 'not-allowed',
              fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            –
          </button>
          <input type="number" min={5} max={240} step={5} value={duration}
            onChange={(e) => onUpdate({ duration: Math.max(5, Math.min(240, Number(e.target.value) || 5)) })} disabled={!enabled}
            style={{ width: '38px', padding: '3px 1px', border: '1px solid var(--border)', borderRadius: '3px',
              fontSize: '11px', fontWeight: 600, textAlign: 'center' }} />
          <button type="button" onClick={() => onUpdate({ duration: Math.min(240, duration + 5) })} disabled={!enabled}
            style={{ width: '22px', height: '22px', borderRadius: '3px', border: '1px solid var(--border)',
              background: enabled ? '#FFF' : '#e5e7eb', cursor: enabled ? 'pointer' : 'not-allowed',
              fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            +
          </button>
        </div>
        {!enabled && <span style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Closed</span>}
      </div>
    </div>
  );
}

export default function AddEquipmentModal({ open, onClose, onConfirm }: AddEquipmentModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('30');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [hours, setHours] = useState<OperatingHours>(buildDefaultHours());
  const fileRef = useRef<HTMLInputElement>(null);

  const updateDay = (day: keyof OperatingHours, patch: Partial<DaySchedule>) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const toggleDay = (day: keyof OperatingHours) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const toggleStyle: React.CSSProperties = {
    position: 'relative', width: '40px', height: '22px', borderRadius: '11px',
    border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0, padding: 0,
  };
  const toggleKnob: React.CSSProperties = {
    position: 'absolute', top: '2px', left: '2px', width: '18px', height: '18px',
    borderRadius: '50%', background: '#fff', transition: 'transform 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
  };

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onConfirm({
        name: name.trim(),
        category: category.trim(),
        duration: parseInt(duration) || 30,
        price: price ? parseFloat(price) : null,
        description: description.trim(),
        photo,
        operatingHours: hoursExpanded ? hours : null,
      });
      setName('');
      setCategory('');
      setDuration('30');
      setPrice('');
      setDescription('');
      setPhoto(null);
      setPhotoPreview(null);
      setHoursExpanded(false);
      setHours(buildDefaultHours());
      onClose();
    } catch (err) {
      const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to add equipment';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container max-w-lg animate-fade">
        <div className="modal-header">
          <h3 className="modal-title">Add Equipment</h3>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <div className="modal-form-group">
            <label className="modal-label">Name <span className="modal-required">*</span></label>
            <input className="modal-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MRI Scanner" />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Category <span className="modal-required">*</span></label>
            <select className="modal-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category...</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Price (ETB)</label>
            <input className="modal-input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} min={0} step="0.01" placeholder="e.g. 500" />
          </div>

          <div className="modal-form-group">
            <div
              onClick={() => setHoursExpanded(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
            >
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {hoursExpanded ? '▼' : '▶'}
              </span>
              <label className="modal-label" style={{ margin: 0, cursor: 'pointer' }}>
                Operating Hours
              </label>
              {!hoursExpanded && (
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>(optional)</span>
              )}
            </div>
            {hoursExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {WEEKDAYS.map(day => (
                  <DayRow key={day} day={day} enabled={hours[day].enabled}
                    start={hours[day].start} end={hours[day].end} duration={hours[day].duration ?? 30}
                    onToggle={() => toggleDay(day)} onUpdate={(patch) => updateDay(day, patch)}
                    toggleStyle={toggleStyle} toggleKnob={toggleKnob}
                  />
                ))}
                <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                {WEEKEND.map(day => (
                  <DayRow key={day} day={day} enabled={hours[day].enabled}
                    start={hours[day].start} end={hours[day].end} duration={hours[day].duration ?? 30}
                    onToggle={() => toggleDay(day)} onUpdate={(patch) => updateDay(day, patch)}
                    toggleStyle={toggleStyle} toggleKnob={toggleKnob}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Description</label>
            <textarea className="modal-textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional description" />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Photo</label>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={handleFileChange} style={{ display: 'none' }} />
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '14px',
              }}
            >
              <Upload size={16} />
              {photo ? photo.name : 'Click to upload photo (JPEG/PNG)'}
            </div>
            {photoPreview && (
              <img src={photoPreview} alt="Preview" style={{ marginTop: '8px', width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="modal-btn modal-btn-cancel">Cancel</button>
            <button type="submit" disabled={saving || !name.trim() || !category.trim()} className="modal-btn modal-btn-confirm">
              {saving ? 'Adding...' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
