import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

interface AppointmentNotesModalProps {
  open: boolean;
  patientName: string;
  initialNotes: string;
  onClose: () => void;
  onConfirm: (notes: string | null) => Promise<void>;
}

export default function AppointmentNotesModal({ open, patientName, initialNotes, onClose, onConfirm }: AppointmentNotesModalProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onConfirm(notes || null);
      onClose();
    } catch (err) {
      const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to update';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container max-w-md animate-fade">
        <div className="modal-header">
          <h3 className="modal-title">Edit Notes</h3>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p className="modal-text">
            Update notes for <strong>{patientName}</strong>'s appointment.
          </p>

          {error && (
            <div className="modal-error">
              {error}
            </div>
          )}

          <div className="modal-form-group">
            <label className="modal-label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Additional notes about this appointment"
              className="modal-textarea"
            />
          </div>

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
              disabled={saving}
              className="modal-btn modal-btn-confirm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
