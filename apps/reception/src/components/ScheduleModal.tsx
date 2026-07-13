import { useState, useRef, useEffect, type FormEvent } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { showToast } from './Toast';
import client from '../api/client';
import { EthiopianDateHint } from './EthiopianDateHint';

interface DoctorOption {
  id: number;
  fullName: string;
  specialization: string;
  clinicName?: string | null;
  hospital?: { name: string } | null;
}

type RepeatType = 'once' | 'weekly';

interface ScheduleForm {
  doctorId: number | '';
  date: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  repeatWeeks: number;
  daysOfWeek?: number[];
  repeatEndDate?: string;
  clinicRoom: string;
  notes: string;
  isActive: boolean;
}

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ScheduleForm) => Promise<void>;
  onDelete?: () => Promise<void>;
  doctors: DoctorOption[];
  initial?: ScheduleForm;
}

function defaultForm(): ScheduleForm {
  return {
    doctorId: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    repeatWeeks: 1,
    clinicRoom: '',
    notes: '',
    isActive: true,
  };
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleModal({ open, onClose, onSave, onDelete, doctors, initial }: ScheduleModalProps) {
  const [form, setForm] = useState<ScheduleForm>(() => initial ? { ...initial } : defaultForm());
  const [repeatType, setRepeatType] = useState<RepeatType>('once');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [repeatEndDate, setRepeatEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 10);
    return d.toISOString().slice(0, 10);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Doctor search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DoctorOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync form when editing a different schedule
  const keyRef = useRef(initial?.doctorId);
  if (initial?.doctorId !== keyRef.current) {
    keyRef.current = initial?.doctorId;
    setForm(initial ? { ...initial } : defaultForm());
  }

  // Click outside to close search results
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const update = <K extends keyof ScheduleForm>(field: K, value: ScheduleForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (q.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await client.get('/receptionist/doctors/search', { params: { q: q.trim(), limit: 10 } });
        setSearchResults(res.data.data || []);
        setShowResults(true);
      } catch (err) {
        console.error('Doctor search failed', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 120);
  };

  const selectSearchResult = (doctor: DoctorOption) => {
    update('doctorId', doctor.id);
    setSearchQuery(doctor.fullName);
    setShowResults(false);
  };

  const selectedDoctorName = form.doctorId
    ? doctors.find(d => d.id === form.doctorId)?.fullName || searchQuery
    : '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.doctorId || !form.startTime || !form.endTime) {
      setError('Doctor, start time, and end time are required');
      showToast({ type: 'error', message: 'Doctor, start time, and end time are required' });
      return;
    }
    if (repeatType === 'weekly' && selectedDays.length === 0) {
      setError('Select at least one day of the week');
      showToast({ type: 'error', message: 'Select at least one day of the week' });
      return;
    }
    if (repeatType === 'weekly' && new Date(repeatEndDate) <= new Date(form.date)) {
      setError('End date must be after the start date');
      showToast({ type: 'error', message: 'End date must be after the start date' });
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        ...form,
        repeatWeeks: 1,
      };
      if (repeatType === 'weekly') {
        payload.daysOfWeek = selectedDays;
        payload.repeatEndDate = repeatEndDate;
        delete payload.repeatWeeks;
      }
      await onSave(payload as ScheduleForm);
      onClose();
    } catch (err) {
      let message = 'Failed to save schedule';
      if (typeof err === 'string') message = err;
      else if (err instanceof Error) message = err.message;
      if (message && (message.toLowerCase().includes('double booking') || message.toLowerCase().includes('already has a schedule'))) {
        showToast({ type: 'error', message: message || 'Double booking! This doctor is already booked.', duration: 5000 });
        setError(message || 'This doctor is already booked for this time.');
      } else {
        showToast({ type: 'error', message: message || 'Failed to save schedule', duration: 5000 });
        setError(message || 'Failed to save schedule');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="animate-fade"
        style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600 }}>
            {initial ? 'Edit Schedule' : 'New Schedule'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ background: '#FEF3F2', color: 'var(--status-error)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '14px', border: '1px solid #FECDCA' }}>
              {error}
            </div>
          )}

          {/* Doctor selector */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Doctor <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>— pick from your hospital or search all doctors</span>
            </label>

            {/* Search all doctors */}
            <div ref={searchRef} style={{ position: 'relative', marginBottom: 8 }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search all doctors by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px 10px 38px', fontSize: '14px',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)', color: 'var(--text-primary)',
                  }}
                />
                {searching && <Loader2 size={16} className="spin" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />}
              </div>

              {showResults && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
                  maxHeight: 240, overflowY: 'auto', marginTop: 4,
                }}>
                  {searchResults.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => selectSearchResult(doc)}
                      style={{
                        width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid #F1F5F9',
                        background: '#FFF', cursor: 'pointer', textAlign: 'left', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#FFF'}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{doc.fullName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {doc.specialization || 'General'}
                          {doc.hospital?.name ? ` · ${doc.hospital.name}` : doc.clinicName ? ` · ${doc.clinicName}` : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>Select</span>
                    </button>
                  ))}
                </div>
              )}
              {showResults && searchResults.length === 0 && searchQuery.trim().length >= 2 && !searching && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
                  padding: '14px', marginTop: 4, textAlign: 'center',
                  fontSize: 13, color: 'var(--text-secondary)',
                }}>
                  No doctors found for "{searchQuery}"
                </div>
              )}
            </div>

            {/* Existing hospital doctor select */}
            <select
              value={form.doctorId}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) as ScheduleForm['doctorId'] : '';
                update('doctorId', val);
                const doc = doctors.find(d => d.id === val);
                if (doc) setSearchQuery(doc.fullName);
              }}
              style={{
                width: '100%', padding: '10px 14px', fontSize: '15px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)',
              }}
            >
              <option value="">Hospital doctors</option>
              {Object.entries(
                doctors.reduce<Record<string, DoctorOption[]>>((acc, d) => {
                  const spec = d.specialization || 'Other';
                  if (!acc[spec]) acc[spec] = [];
                  acc[spec].push(d);
                  return acc;
                }, {})
              ).map(([spec, docs]) => (
                <optgroup key={spec} label={spec}>
                  {docs.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {form.doctorId && !doctors.some(d => d.id === form.doctorId) && (
              <div style={{ fontSize: 12, color: '#0369A1', marginTop: 4 }}>
                Selected from global search: <strong>{selectedDoctorName}</strong>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 14px', fontSize: '15px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)',
              }}
            />
            <EthiopianDateHint isoDate={form.date} />
          </div>

          {!initial && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>Repeat</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRepeatType('once')}
                  style={{
                    flex: 1, padding: '10px 16px', fontSize: '13px', fontWeight: 600,
                    border: `2px solid ${repeatType === 'once' ? 'var(--accent-primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    background: repeatType === 'once' ? '#EFF6FF' : '#FFF',
                    color: repeatType === 'once' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  One time
                </button>
                <button
                  type="button"
                  onClick={() => setRepeatType('weekly')}
                  style={{
                    flex: 1, padding: '10px 16px', fontSize: '13px', fontWeight: 600,
                    border: `2px solid ${repeatType === 'weekly' ? 'var(--accent-primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    background: repeatType === 'weekly' ? '#EFF6FF' : '#FFF',
                    color: repeatType === 'weekly' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Repeat
                </button>
              </div>

              {repeatType === 'weekly' && (
                <>
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>Repeat on</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {DAY_LABELS.map((label, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDay(i)}
                          style={{
                            flex: 1, padding: '8px 4px', fontSize: '12px', fontWeight: 600,
                            border: `2px solid ${selectedDays.includes(i) ? 'var(--accent-primary)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-sm)',
                            background: selectedDays.includes(i) ? '#EFF6FF' : '#FFF',
                            color: selectedDays.includes(i) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>Until</label>
                    <input
                      type="date"
                      value={repeatEndDate}
                      onChange={(e) => setRepeatEndDate(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', fontSize: '15px',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface)', color: 'var(--text-primary)',
                      }}
                    />
                    <EthiopianDateHint isoDate={repeatEndDate} />
                  </div>
                </>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 14px', fontSize: '15px',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface)', color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => update('endTime', e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 14px', fontSize: '15px',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface)', color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>Slot Duration (minutes)</label>
            <input
              type="number"
              min={5}
              max={120}
              step={5}
              value={form.slotDuration}
              onChange={(e) => update('slotDuration', Math.max(5, Number(e.target.value)))}
              style={{
                width: '100%', padding: '10px 14px', fontSize: '15px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>Clinic Room</label>
            <input
              type="text"
              value={form.clinicRoom}
              onChange={(e) => update('clinicRoom', e.target.value)}
              placeholder="e.g. Room 204"
              style={{
                width: '100%', padding: '10px 14px', fontSize: '15px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              placeholder="Optional notes about this schedule"
              style={{
                width: '100%', padding: '10px 14px', fontSize: '15px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)', resize: 'vertical',
                fontFamily: 'var(--font-main)',
              }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update('isActive', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
            />
            Active schedule
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '8px' }}>
            {initial && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this schedule?')) {
                    setSaving(true);
                    try { await onDelete(); onClose(); }
                    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete schedule'); }
                    finally { setSaving(false); }
                  }
                }}
                style={{
                  padding: '10px 18px', fontSize: '14px', fontWeight: 600,
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  background: 'var(--status-error)', color: '#fff', cursor: 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                Delete
              </button>
            )}
            <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 18px', fontSize: '14px', fontWeight: 500,
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface)', color: 'var(--text-primary)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 18px', fontSize: '14px', fontWeight: 600,
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving...' : initial ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
