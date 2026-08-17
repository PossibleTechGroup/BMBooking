import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Doctor } from '../../store/slices/doctorsSlice';
import { styles } from './styles';

interface RejectDoctorModalProps {
  doctor: Doctor;
  saving: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function RejectDoctorModal({ doctor, saving, onClose, onConfirm }: RejectDoctorModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, width: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Reject Doctor</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ color: '#475569', marginBottom: '16px' }}>
          Reject <strong>{doctor.fullName}</strong>'s request to join your hospital. The doctor will see the reason you provide.
        </p>
        <label style={styles.label}>Rejection Reason *</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. License could not be verified. Please provide your valid license document."
          style={styles.textarea}
          rows={4}
        />
        <div style={styles.modalActions}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer', background: '#FFF' }}>Cancel</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={saving || !reason.trim()}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: (saving || !reason.trim()) ? 'not-allowed' : 'pointer', background: 'var(--status-error)', color: '#FFF', opacity: (saving || !reason.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
