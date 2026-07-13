import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X, Loader2 } from 'lucide-react';
import type { AppDispatch, RootState } from '../store';
import { searchPatients, createPatient, fetchEquipmentAvailability, type PatientInfo, type HospitalEquipment } from '../store/slices/equipmentSlice';
import './Modal.css';
import { EthiopianDateHint } from './EthiopianDateHint';

interface Props {
  open: boolean;
  equipment: HospitalEquipment[];
  onClose: () => void;
  onConfirm: (data: { patientId: number; equipmentId: number; dateTime: string; notes?: string }) => Promise<void>;
}

export default function CreateEquipmentBookingModal({ open, equipment, onClose, onConfirm }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { patientSearchResults, patientSearchLoading, availableSlots, loadingSlots, slotError } = useSelector((state: RootState) => state.equipment);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // New patient creation
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('+251');
  const [newPatientGender, setNewPatientGender] = useState('');
  const [creatingPatient, setCreatingPatient] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedPatient(null);
      setSelectedEquipmentId('');
      setDate(new Date().toISOString().slice(0, 10));
      setSelectedSlot(null);
      setNotes('');
      setError('');
      setShowNewPatient(false);
      setNewPatientName('');
      setNewPatientPhone('+251');
      setNewPatientGender('');
    }
  }, [open]);

  useEffect(() => {
    if (selectedEquipmentId && date) {
      dispatch(fetchEquipmentAvailability({ equipmentId: selectedEquipmentId as number, date }));
    }
  }, [selectedEquipmentId, date, dispatch]);

  const handleCreatePatient = async () => {
    if (!newPatientName.trim() || !newPatientPhone.trim()) return;
    setCreatingPatient(true);
    try {
      const result = await dispatch(createPatient({
        phone: newPatientPhone.trim(),
        fullName: newPatientName.trim(),
        gender: newPatientGender || undefined,
      })).unwrap();
      setSelectedPatient(result);
      setShowNewPatient(false);
      setNewPatientName('');
      setNewPatientPhone('+251');
      setNewPatientGender('');
    } catch (err: any) {
      setError(err || 'Failed to create patient');
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleSearch = useCallback(() => {
    if (searchQuery.trim().length < 2) return;
    dispatch(searchPatients(searchQuery.trim()));
  }, [searchQuery, dispatch]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(handleSearch, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const selectedEquipment = equipment.find((e) => e.id === selectedEquipmentId);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedEquipmentId || !date || !selectedSlot) return;
    setSaving(true);
    setError('');

    try {
      await onConfirm({
        patientId: selectedPatient.id,
        equipmentId: selectedEquipmentId as number,
        dateTime: `${date}T${selectedSlot}:00+03:00`,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err || 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container max-w-md animate-fade">
        <div className="modal-header">
          <h3 className="modal-title">Create Equipment Booking</h3>
          <button onClick={onClose} className="modal-close-btn"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          {/* Patient Search */}
          <div className="modal-form-group">
            <label className="modal-label">Patient</label>
            {selectedPatient ? (
              <div className="modal-patient-badge">
                <div className="modal-patient-badge-info">
                  <span className="modal-patient-badge-name">{selectedPatient.patientProfile?.fullName || 'Unknown'}</span>
                  <span className="modal-patient-badge-phone">{selectedPatient.phone}</span>
                </div>
                <button type="button" onClick={() => { setSelectedPatient(null); setSearchQuery(''); }} className="modal-patient-clear-btn">
                  <X size={16} />
                </button>
              </div>
            ) : !showNewPatient ? (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input className="modal-input" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or phone..." style={{ flex: 1 }} />
                  <button type="button" onClick={handleSearch} disabled={searchQuery.trim().length < 2}
                    style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {patientSearchLoading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                  </button>
                </div>
                {patientSearchResults.length > 0 && (
                  <div className="modal-results-dropdown">
                    {patientSearchResults.map((p) => (
                      <button key={p.id} type="button" className="modal-result-btn" onClick={() => setSelectedPatient(p)}>
                        <div style={{ fontWeight: 500 }}>{p.patientProfile?.fullName || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => setShowNewPatient(true)}
                  style={{ marginTop: '8px', fontSize: '13px', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
                  + New patient
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input className="modal-input" type="text" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} placeholder="Full name" />
                <input className="modal-input" type="text" value={newPatientPhone} onChange={(e) => setNewPatientPhone(e.target.value)} placeholder="+251..." />
                <select className="modal-select" value={newPatientGender} onChange={(e) => setNewPatientGender(e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button type="button" onClick={() => setShowNewPatient(false)}
                    className="modal-btn modal-btn-cancel" style={{ flex: 1, fontSize: '13px', padding: '8px' }}>Back</button>
                  <button type="button" onClick={handleCreatePatient} disabled={creatingPatient || !newPatientName.trim() || !newPatientPhone.trim()}
                    className="modal-btn modal-btn-confirm" style={{ flex: 1, fontSize: '13px', padding: '8px' }}>
                    {creatingPatient ? 'Creating...' : 'Create & Select'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Equipment */}
          <div className="modal-form-group">
            <label className="modal-label">Equipment</label>
            <select className="modal-select" value={selectedEquipmentId} onChange={(e) => { setSelectedEquipmentId(e.target.value ? Number(e.target.value) : ''); setSelectedSlot(null); }}>
              <option value="">Select equipment...</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} {eq.price ? `(${eq.price} ETB)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="modal-form-group">
            <label className="modal-label">Date</label>
            <input className="modal-input" type="date" value={date} onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }} />
            <EthiopianDateHint isoDate={date} />
          </div>

          {/* Available Slots */}
          {selectedEquipmentId && date && (
            <div className="modal-form-group">
              <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Available Slots
                {loadingSlots && <Loader2 size={12} className="spin" />}
              </label>
              {slotError && <div style={{ fontSize: '12px', color: 'var(--status-error)', marginBottom: '4px' }}>{slotError}</div>}
              {!loadingSlots && availableSlots.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No available slots for this date
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {availableSlots.map((slot, i) => {
                    const start = slot.start.slice(0, 5);
                    const isSelected = selectedSlot === start;
                    const isBooked = slot.booked === true;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isBooked}
                        onClick={() => !isBooked && setSelectedSlot(start)}
                        style={{
                          padding: '6px 12px', fontSize: '12px', fontWeight: 500,
                          border: isBooked
                            ? '1px dashed var(--border)'
                            : isSelected
                              ? '2px solid var(--accent-primary)'
                              : '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          background: isBooked
                            ? 'transparent'
                            : isSelected
                              ? 'var(--accent-primary)'
                              : 'var(--surface)',
                          color: isBooked
                            ? 'var(--text-secondary)'
                            : isSelected
                              ? '#fff'
                              : 'var(--text-primary)',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          opacity: isBooked ? 0.5 : 1,
                          textDecoration: isBooked ? 'line-through' : 'none',
                        }}
                      >
                        {slot.label || start}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="modal-form-group">
            <label className="modal-label">Notes <span className="modal-optional">optional</span></label>
            <textarea className="modal-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any notes..." />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="modal-btn modal-btn-cancel">Cancel</button>
            <button type="submit" disabled={saving || !selectedPatient || !selectedEquipmentId || !date || !selectedSlot}
              className="modal-btn modal-btn-confirm">
              {saving ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
