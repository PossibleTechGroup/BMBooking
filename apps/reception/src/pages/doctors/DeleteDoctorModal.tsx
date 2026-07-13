import { X, Loader2 } from 'lucide-react';
import type { Doctor } from '../../store/slices/doctorsSlice';
import { styles } from './styles';

interface DeleteDoctorModalProps {
  doctor: Doctor;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteDoctorModal({ doctor, saving, onClose, onConfirm }: DeleteDoctorModalProps) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, width: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Remove Doctor</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ color: '#475569', marginBottom: '24px' }}>
          Are you sure you want to remove <strong>{doctor.fullName}</strong> from your hospital?
          They will be unassigned and won't appear in schedules.
        </p>
        <div style={styles.modalActions}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer', background: '#FFF' }}>Cancel</button>
          <button onClick={onConfirm} disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', background: 'var(--status-error)', color: '#FFF', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}
