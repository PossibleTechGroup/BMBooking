import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';

interface DenyModalProps {
  open: boolean;
  patientName: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export default function DenyModal({ open, patientName, onClose, onConfirm }: DenyModalProps) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) return;
    setSaving(true);
    setError('');
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err) {
      const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to decline appointment';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="animate-fade"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '440px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600 }}>
            Decline Appointment
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Provide a reason for declining <strong>{patientName}</strong>'s appointment request. The patient will be notified.
          </p>

          {error && (
            <div style={{ background: '#FEF3F2', color: 'var(--status-error)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '14px', border: '1px solid #FECDCA' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Reason
              <span style={{ color: 'var(--status-error)', marginLeft: '2px' }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Explain why this appointment is being declined..."
              style={{
                width: '100%', padding: '10px 14px', fontSize: '15px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)', resize: 'vertical',
                fontFamily: 'var(--font-main)',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: reason.trim().length >= 3 ? 'var(--status-success)' : 'var(--text-secondary)' }}>
                {reason.trim().length} / 3 min
              </span>
            </div>
          </div>

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
              disabled={saving || reason.trim().length < 3}
              style={{
                padding: '10px 18px', fontSize: '14px', fontWeight: 600,
                border: 'none', borderRadius: 'var(--radius-sm)',
                background: 'var(--status-error)', color: '#fff', cursor: 'pointer',
                opacity: (saving || reason.trim().length < 3) ? 0.6 : 1,
              }}
            >
              {saving ? 'Declining...' : 'Decline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
