import { X } from 'lucide-react';
import { useCreateAppointment } from './useCreateAppointment';
import PatientSearchSection from './PatientSearchSection';
import ScheduleSlotPicker from './ScheduleSlotPicker';
import { EthiopianDateHint } from '../../EthiopianDateHint';

interface CreateAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function CreateAppointmentModal({ open, onClose, onConfirm }: CreateAppointmentModalProps) {
  const {
    mode, setMode,
    patientQuery,
    patientResults,
    selectedPatient, setSelectedPatient,
    searching,
    showResults,
    searchRef,
    doctors,
    doctorId, setDoctorId,
    date, setDate,
    reason, setReason,
    slots,
    slotId,
    loadingSlots,
    saving,
    error, setError,
    registerForm, setRegisterForm,
    registerSaving,
    handleSearch,
    selectPatient,
    handleRegisterPatient,
    selectSlot,
    handleSubmit,
  } = useCreateAppointment({ open, onClose, onConfirm });

  if (!open) return null;

  const today = new Date();
  const minDate = today.toISOString().slice(0, 10);

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
          width: '100%', maxWidth: '520px', boxShadow: 'var(--shadow-lg)',
          maxHeight: '90vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600 }}>
            New Appointment
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: '#FEF3F2', color: 'var(--status-error)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '14px', border: '1px solid #FECDCA' }}>
              {error}
            </div>
          )}

          {/* Patient Search Section */}
          <PatientSearchSection
            mode={mode}
            setMode={setMode}
            patientQuery={patientQuery}
            patientResults={patientResults}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
            searching={searching}
            showResults={showResults}
            searchRef={searchRef}
            registerForm={registerForm}
            setRegisterForm={setRegisterForm}
            registerSaving={registerSaving}
            handleSearch={handleSearch}
            selectPatient={selectPatient}
            handleRegisterPatient={handleRegisterPatient}
            setError={setError}
          />

          {/* Doctor Select */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Doctor <span style={{ color: 'var(--status-error)' }}>*</span>
            </label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : '')}
              required
              style={{
                width: '100%', padding: '10px 14px', fontSize: '15px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)',
              }}
            >
              <option value="">Select a doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.fullName} ({d.specialization})</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Date <span style={{ color: 'var(--status-error)' }}>*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={minDate}
              required
              style={{
                width: '100%', padding: '10px 14px', fontSize: '15px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)',
              }}
            />
            <EthiopianDateHint isoDate={date} />
          </div>

          {/* Schedule Slot Picker */}
          <ScheduleSlotPicker
            doctorId={doctorId}
            date={date}
            slotId={slotId}
            slots={slots}
            loadingSlots={loadingSlots}
            selectSlot={selectSlot}
          />

          {/* Reason */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', fontSize: '15px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)',
                resize: 'vertical',
              }}
              placeholder="Optional reason for visit"
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
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
              disabled={saving || !selectedPatient || !doctorId || !date || !slotId}
              style={{
                padding: '10px 18px', fontSize: '14px', fontWeight: 600,
                border: 'none', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer',
                opacity: (saving || !selectedPatient || !doctorId || !date || !slotId) ? 0.6 : 1,
              }}
            >
              {saving ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
