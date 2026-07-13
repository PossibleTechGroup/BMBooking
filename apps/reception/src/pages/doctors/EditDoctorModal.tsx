import type { FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Doctor } from '../../store/slices/doctorsSlice';
import { styles } from './styles';

interface EditDoctorModalProps {
  doctor: Doctor;
  form: { fullName: string; specialization: string; licenseNumber: string; experienceYears: string; bio: string };
  setForm: React.Dispatch<React.SetStateAction<typeof EditDoctorModalProps.prototype.form>>;
  error: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}

export default function EditDoctorModal({ doctor, form, setForm, error, saving, onClose, onSubmit }: EditDoctorModalProps) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Edit Doctor</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>
        {error && <div style={styles.errorMsg}>{error}</div>}
        <form onSubmit={onSubmit}>
          <label style={styles.label}>Full Name</label>
          <input style={styles.input} value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} required />

          <label style={styles.label}>Specialization</label>
          <input style={styles.input} value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))} />

          <label style={styles.label}>License Number</label>
          <input style={styles.input} value={form.licenseNumber} onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))} />

          <label style={styles.label}>Experience (years)</label>
          <input style={styles.input} type="number" value={form.experienceYears} onChange={(e) => setForm((p) => ({ ...p, experienceYears: e.target.value }))} />

          <label style={styles.label}>Bio</label>
          <textarea style={styles.textarea} value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer', background: '#FFF' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', background: 'var(--accent-primary)', color: '#FFF', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
