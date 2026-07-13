import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Edit3, XCircle, Loader2, Clock, ChevronUp, User, Phone, Stethoscope, CreditCard, DollarSign, Hash, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import client from '../../api/client';
import '../Modal.css';
import { formatDate, formatTime, formatDateTime, formatDateShort, formatNum } from '../../utils/ethiopianDate';
import { getPaymentTypeLabel } from '../../utils/paymentType';
import { EthiopianDateHint } from '../EthiopianDateHint';

interface AppointmentDetailModalProps {
  appointment: any | null;
  open: boolean;
  onClose: () => void;
  onApprove?: (id: number) => Promise<void>;
  onReschedule: (id: number, dateTime: string) => Promise<void>;
  onCancel: (id: number) => Promise<void>;
  onEditNotes: (a: any) => void;
  onScheduleFollowUp?: (id: number, dateTime: string) => Promise<void>;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#FFFAEB', text: '#B54708' },
  accepted:  { bg: '#ECFDF3', text: '#027A48' },
  declined:  { bg: '#FEF3F2', text: '#D92D20' },
  completed: { bg: '#EFF8FF', text: '#175CD3' },
  cancelled: { bg: '#F2F4F7', text: '#667085' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', accepted: 'Accepted', declined: 'Declined',
  completed: 'Completed', cancelled: 'Cancelled',
};

function fmtCurrency(amount: number) {
  return `${formatNum(amount || 0)} ETB`;
}

export default function AppointmentDetailModal({
  appointment, open, onClose, onApprove, onReschedule, onCancel, onEditNotes, onScheduleFollowUp,
}: AppointmentDetailModalProps) {
  const [view, setView] = useState<'detail' | 'reschedule' | 'follow-up'>('detail');
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');

  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

  const a = appointment;

  useEffect(() => {
    if (open && a) {
      setView('detail');
      setCancelConfirm(false);
      setError('');
      setSelectedDate('');
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }, [open, a]);

  const fetchSlots = useCallback(async (doctorId: number, date: string) => {
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot(null);
    try {
      const res = await client.get('/receptionist/schedules', {
        params: { doctorId, date },
      });
      const schedules = res.data.data || [];
      const slots: any[] = [];
      for (const sched of schedules) {
        for (const slot of sched.slots || []) {
          slots.push({ ...slot, scheduleId: sched.id, doctorId: sched.doctorId });
        }
      }
      slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setAvailableSlots(slots);
    } catch {
      setError('Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if ((view === 'reschedule' || view === 'follow-up') && a && selectedDate) {
      fetchSlots(a.doctorId, selectedDate);
    }
  }, [view, a, selectedDate, fetchSlots]);

  const handleRescheduleSubmit = async () => {
    if (!a || !selectedSlot) return;
    setSaving(true);
    setError('');
    try {
      await onReschedule(a.id, selectedSlot.startTime);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to reschedule');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!a) return;
    setSaving(true);
    setError('');
    try {
      await onCancel(a.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAction = async () => {
    if (!a || !onApprove) return;
    setApproving(true);
    setError('');
    try {
      await onApprove(a.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!a || !selectedSlot || !onScheduleFollowUp) return;
    setSaving(true);
    setError('');
    try {
      await onScheduleFollowUp(a.id, selectedSlot.startTime);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to schedule follow-up');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !a) return null;

  const colors = STATUS_COLORS[a.status] || STATUS_COLORS.pending;
  const patientName = a.patient?.patientProfile?.fullName || 'Unknown';
  const paymentLabel = getPaymentTypeLabel(a.paymentMethod);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container max-w-lg animate-fade">
        <div className="modal-header">
          <h3 className="modal-title">
            {view === 'detail' ? 'Appointment Details' : view === 'reschedule' ? 'Reschedule Appointment' : 'Schedule Follow-Up'}
          </h3>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          {view === 'detail' ? (
            <>
              {/* Status badge */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  background: colors.bg, color: colors.text,
                }}>
                  {STATUS_LABELS[a.status] || a.status}
                </span>
                {a.isPaid && (
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: '#ECFDF3', color: '#027A48' }}>
                    ✓ Paid
                  </span>
                )}
              </div>

              {/* Patient info */}
              <DetailRow icon={<User size={16} />} label="Patient" value={patientName} />
              {a.patient?.phone && <DetailRow icon={<Phone size={16} />} label="Phone" value={a.patient.phone} />}
              <DetailRow icon={<Stethoscope size={16} />} label="Doctor" value={`Dr. ${a.doctor?.fullName || '?'} (${a.doctor?.specialization || '?'})`} />
              <DetailRow icon={<Calendar size={16} />} label="Date & Time" value={formatDateTime(new Date(a.dateTime))} />
              <DetailRow icon={<DollarSign size={16} />} label="Fee" value={fmtCurrency(Number(a.fee))} />
              {paymentLabel && <DetailRow icon={<CreditCard size={16} />} label="Payment Method" value={paymentLabel} />}
              {a.confirmationCode && <DetailRow icon={<Hash size={16} />} label="Confirmation Code" value={a.confirmationCode} />}

              {a.reason && <DetailRow icon={<FileText size={16} />} label="Reason" value={a.reason} />}
              {a.issueCategory && <DetailRow icon={<AlertCircle size={16} />} label="Issue Category" value={a.issueCategory} />}
              {a.notes && <DetailRow icon={<Edit3 size={16} />} label="Notes" value={a.notes} />}
              {a.declineReason && (
                <div style={{ background: '#FEF3F2', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#D92D20', marginTop: 4 }}>
                  <strong>Decline reason:</strong> {a.declineReason}
                </div>
              )}

              {a.attachments && a.attachments.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={14} /> Referral Attachments ({a.attachments.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {a.attachments.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'block', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={url} alt={`Referral ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                {a.status === 'pending' && onApprove && (
                  <button
                    onClick={handleApproveAction}
                    disabled={approving}
                    style={{ ...btnBase, background: '#027A48', color: '#fff', opacity: approving ? 0.6 : 1 }}
                  >
                    <CheckCircle size={14} />
                    {approving ? 'Approving...' : 'Approve'}
                  </button>
                )}
                {(a.status === 'pending' || a.status === 'accepted') && (
                  <>
                    <button
                      onClick={() => setView('reschedule')}
                      style={{ ...btnBase, background: '#F2F4F7', color: 'var(--accent-primary)' }}
                    >
                      <Calendar size={14} /> Reschedule
                    </button>
                    {!cancelConfirm ? (
                      <button
                        onClick={() => setCancelConfirm(true)}
                        style={{ ...btnBase, background: '#FEF3F2', color: '#D92D20' }}
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#D92D20', fontWeight: 500 }}>Cancel this appointment?</span>
                        <button
                          onClick={handleCancelAppointment}
                          disabled={saving}
                          style={{ ...btnBase, background: '#D92D20', color: '#fff' }}
                        >
                          {saving ? 'Cancelling...' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setCancelConfirm(false)}
                          style={{ ...btnBase, background: '#F2F4F7', color: '#667085' }}
                        >
                          No
                        </button>
                      </div>
                    )}
                  </>
                )}
                <button
                  onClick={() => { onEditNotes(a); onClose(); }}
                  style={{ ...btnBase, background: '#F2F4F7', color: 'var(--accent-primary)' }}
                >
                  <Edit3 size={14} /> Edit Notes
                </button>
                {a.status === 'completed' && onScheduleFollowUp && (
                  <button
                    onClick={() => setView('follow-up')}
                    style={{ ...btnBase, background: '#EFF8FF', color: '#175CD3' }}
                  >
                    <Calendar size={14} /> Schedule Follow-Up
                  </button>
                )}
                {a.parentAppointmentId && (
                  <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#F0F0FF', color: '#5A5AD8' }}>
                    Follow-up
                  </span>
                )}
              </div>
            </>
          ) : view === 'reschedule' ? (
            <>
              {/* Back to detail */}
              <button
                onClick={() => setView('detail')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
              >
                <ChevronUp size={16} /> Back to details
              </button>

              <p className="modal-text">
                Select a new date and time for <strong>{patientName}</strong>'s appointment with <strong>Dr. {a.doctor?.fullName}</strong>.
              </p>

              {/* Date picker */}
              <div className="modal-form-group">
                <label className="modal-label">
                  New Date <span className="modal-required">*</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={formatDateShort(new Date())}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="modal-input"
                />
                <EthiopianDateHint isoDate={selectedDate} />
              </div>

              {/* Available slots */}
              {selectedDate && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Available Slots
                    {selectedSlot && <span style={{ fontSize: 12, color: '#027A48', marginLeft: 8 }}>✓ Slot selected</span>}
                  </label>
                  {loadingSlots ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, padding: '8px 0' }}>
                      <Loader2 size={14} className="spin" /> Loading slots...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#D92D20', padding: '8px 12px', background: '#FEF3F2', borderRadius: 8 }}>
                      No available slots for this doctor on this date.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {availableSlots.map((slot: any) => {
                        const filled = slot._count?.bookings || 0;
                        const max = slot.maxPatients || 1;
                        const isFull = filled >= max;
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => setSelectedSlot(slot)}
                            title={isFull ? 'This slot is full' : `${filled}/${max} booked`}
                            style={{
                              padding: '8px 14px', borderRadius: 8, cursor: isFull ? 'not-allowed' : 'pointer',
                              border: `1px solid ${isSelected ? 'var(--accent-primary)' : isFull ? '#FECDCA' : 'var(--border)'}`,
                              background: isSelected ? '#EFF6FF' : isFull ? '#FEF3F2' : '#FFF',
                              color: isFull ? 'var(--text-secondary)' : 'var(--text-primary)',
                              fontWeight: isSelected ? 600 : 400,
                              fontSize: 13,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                              opacity: isFull ? 0.6 : 1,
                            }}
                          >
                            <span>{formatTime(new Date(slot.startTime))} – {formatTime(new Date(slot.endTime))}</span>
                            <span style={{ fontSize: 11, color: isFull ? '#D92D20' : 'var(--text-secondary)' }}>
                              {isFull ? 'FULL' : `${max - filled} spot${max - filled !== 1 ? 's' : ''} left`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="modal-footer">
                <button onClick={() => { setView('detail'); setCancelConfirm(false); }} className="modal-btn modal-btn-cancel">
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleSubmit}
                  disabled={saving || !selectedSlot}
                  className="modal-btn modal-btn-confirm"
                >
                  {saving ? 'Rescheduling...' : 'Reschedule'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Follow-up view */}
              <button
                onClick={() => setView('detail')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
              >
                <ChevronUp size={16} /> Back to details
              </button>

              <p className="modal-text">
                Schedule a follow-up for <strong>{patientName}</strong> with <strong>Dr. {a.doctor?.fullName}</strong>.
              </p>

              {/* Date picker */}
              <div className="modal-form-group">
                <label className="modal-label">
                  New Date <span className="modal-required">*</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={formatDateShort(new Date())}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                  className="modal-input"
                />
                <EthiopianDateHint isoDate={selectedDate} />
              </div>

              {/* Available slots */}
              {selectedDate && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Available Slots
                    {selectedSlot && <span style={{ fontSize: 12, color: '#027A48', marginLeft: 8 }}>✓ Slot selected</span>}
                  </label>
                  {loadingSlots ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, padding: '8px 0' }}>
                      <Loader2 size={14} className="spin" /> Loading slots...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#D92D20', padding: '8px 12px', background: '#FEF3F2', borderRadius: 8 }}>
                      No available slots for this doctor on this date.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {availableSlots.map((slot: any) => {
                        const filled = slot._count?.bookings || 0;
                        const max = slot.maxPatients || 1;
                        const isFull = filled >= max;
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => setSelectedSlot(slot)}
                            title={isFull ? 'This slot is full' : `${filled}/${max} booked`}
                            style={{
                              padding: '8px 14px', borderRadius: 8, cursor: isFull ? 'not-allowed' : 'pointer',
                              border: `1px solid ${isSelected ? 'var(--accent-primary)' : isFull ? '#FECDCA' : 'var(--border)'}`,
                              background: isSelected ? '#EFF6FF' : isFull ? '#FEF3F2' : '#FFF',
                              color: isFull ? 'var(--text-secondary)' : 'var(--text-primary)',
                              fontWeight: isSelected ? 600 : 400,
                              fontSize: 13,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                              opacity: isFull ? 0.6 : 1,
                            }}
                          >
                            <span>{formatTime(new Date(slot.startTime))} – {formatTime(new Date(slot.endTime))}</span>
                            <span style={{ fontSize: 11, color: isFull ? '#D92D20' : 'var(--text-secondary)' }}>
                              {isFull ? 'FULL' : `${max - filled} spot${max - filled !== 1 ? 's' : ''} left`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="modal-footer">
                <button onClick={() => { setView('detail'); setSelectedDate(''); setSelectedSlot(null); }} className="modal-btn modal-btn-cancel">
                  Cancel
                </button>
                <button
                  onClick={handleFollowUpSubmit}
                  disabled={saving || !selectedSlot}
                  className="modal-btn modal-btn-confirm"
                >
                  {saving ? 'Scheduling...' : 'Schedule Follow-Up'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0' }}>
      <div style={{ color: 'var(--text-secondary)', marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--text-primary)', marginTop: 1 }}>{value}</div>
      </div>
    </div>
  );
}

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 8, border: 'none',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  transition: 'opacity 0.2s',
};
