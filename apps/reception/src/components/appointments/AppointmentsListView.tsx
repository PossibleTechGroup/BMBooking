import { Loader2, CheckCircle, XCircle, Calendar, Edit3 } from 'lucide-react';
import { listStyles } from '../../pages/AppointmentsPage.styles';
import { formatDateTime, formatNum } from '../../utils/ethiopianDate';
import { getPaymentTypeLabel } from '../../utils/paymentType';


export const statusColors: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#FFFAEB', text: '#B54708' },
  accepted:  { bg: '#ECFDF3', text: '#027A48' },
  declined:  { bg: '#FEF3F2', text: '#D92D20' },
  completed: { bg: '#EFF8FF', text: '#175CD3' },
  cancelled: { bg: '#F2F4F7', text: '#5A6B80' },
};

export const statusLabels: Record<string, string> = {
  pending:   'Pending',
  accepted:  'Accepted',
  declined:  'Declined',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function fmtCurrency(amount: number) {
  return `${formatNum(amount)} ETB`;
}

interface AppointmentsListViewProps {
  loading: boolean;
  filtered: any[];
  statusFilter: string;
  approvingId: number | null;
  cancellingId: number | null;
  handleApprove: (a: any) => void;
  setDenyTarget: (a: any) => void;
  handleCancel: (a: any) => void;
  setRescheduleTarget: (a: any) => void;
  setNotesTarget: (a: any) => void;
  setDetailTarget: (a: any) => void;
}

export default function AppointmentsListView({
  loading, filtered, statusFilter, approvingId, cancellingId,
  handleApprove, setDenyTarget, handleCancel, setRescheduleTarget, setNotesTarget, setDetailTarget,
}: AppointmentsListViewProps) {
  if (loading) {
    return (
      <div style={listStyles.loading}>
        <Loader2 size={20} className="spin" />
        Loading appointments...
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div style={listStyles.emptyState}>
        <p style={listStyles.emptyTitle}>
          No {statusFilter !== 'all' ? statusLabels[statusFilter]?.toLowerCase() : ''} appointments
        </p>
        <p style={listStyles.emptySubtitle}>
          {statusFilter === 'pending' ? 'All pending requests have been reviewed.' : 'Try changing the filters above.'}
        </p>
      </div>
    );
  }

  return (
    <div style={listStyles.listContainer}>
      {filtered.map((a) => {
        const colors = statusColors[a.status] || statusColors.pending;
        const patientName = a.patient?.patientProfile?.fullName || 'Unknown';
        const paymentLabel = getPaymentTypeLabel(a.paymentMethod);
        const paymentColor = a.paymentMethod === 'card'
          ? { bg: '#EFF6FF', text: '#1D4ED8' }
          : a.paymentMethod === 'full'
            ? { bg: '#ECFDF3', text: '#027A48' }
            : { bg: '#FFFAEB', text: '#B54708' };

        return (
            <div key={a.id} style={{ ...listStyles.card, cursor: 'pointer' }} onClick={() => setDetailTarget(a)}>
            {/* Top row: info + status badge */}
            <div style={listStyles.cardHeader}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={listStyles.cardTitleRow}>
                  <span style={listStyles.patientName}>{patientName}</span>
                  <span style={listStyles.doctorName}>→ Dr. {a.doctor?.fullName}</span>
                  <span style={listStyles.specialization}>{a.doctor?.specialization}</span>
                </div>
                <div style={listStyles.cardDetailsRow}>
                  <span>{formatDateTime(new Date(a.dateTime))}</span>
                  <span>·</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmtCurrency(Number(a.fee))}</span>
                  {paymentLabel && (
                    <span style={{ ...listStyles.paymentBadge, background: paymentColor.bg, color: paymentColor.text }}>
                      {paymentLabel}
                    </span>
                  )}
                  {a.isPaid && <span style={listStyles.paidText}>✓ Paid</span>}
                  {a.confirmationCode && (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 500 }}>
                      {a.confirmationCode}
                    </span>
                  )}
                </div>
                {a.reason && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Reason: {a.reason}
                  </div>
                )}
                {a.status === 'declined' && a.declineReason && (
                  <div style={listStyles.declineReason}>
                    Decline reason: {a.declineReason}
                  </div>
                )}
              </div>
              <div style={listStyles.statusBadgeContainer}>
                <span style={{ ...listStyles.statusBadge, background: colors.bg, color: colors.text }}>
                  {statusLabels[a.status]}
                </span>
                {a.parentAppointmentId && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#F0F0FF', color: '#5A5AD8', fontWeight: 600, marginTop: 4, display: 'inline-block' }}>
                    Follow-up
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons for pending */}
            {a.status === 'pending' && (
              <div style={listStyles.actionButtonsRow}>
                <button onClick={(e) => { e.stopPropagation(); handleApprove(a); }} disabled={approvingId === a.id}
                  style={{ ...listStyles.btnBase, background: '#027A48', color: '#fff', opacity: approvingId === a.id ? 0.6 : 1 }}>
                  <CheckCircle size={14} />
                  {approvingId === a.id ? 'Approving...' : 'Approve'}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDenyTarget(a); }} style={{ ...listStyles.btnBase, background: '#D92D20', color: '#fff' }}>
                  <XCircle size={14} /> Decline
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleCancel(a); }} disabled={cancellingId === a.id}
                  style={{ ...listStyles.btnBase, background: '#F2F4F7', color: '#5A6B80', opacity: cancellingId === a.id ? 0.6 : 1 }}>
                  <XCircle size={14} />
                  {cancellingId === a.id ? 'Cancelling...' : 'Cancel'}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setRescheduleTarget(a); }} style={{ ...listStyles.btnBase, background: '#F2F4F7', color: 'var(--accent-primary)' }}>
                  <Calendar size={14} /> Reschedule
                </button>
                <button onClick={(e) => { e.stopPropagation(); setNotesTarget(a); }} style={{ ...listStyles.btnBase, background: '#F2F4F7', color: 'var(--accent-primary)' }}>
                  <Edit3 size={14} /> Notes
                </button>
              </div>
            )}

            {/* Action buttons for accepted */}
            {a.status === 'accepted' && (
              <div style={listStyles.actionButtonsRow}>
                <button onClick={(e) => { e.stopPropagation(); handleCancel(a); }} disabled={cancellingId === a.id}
                  style={{ ...listStyles.btnBase, background: '#FEF3F2', color: '#D92D20', opacity: cancellingId === a.id ? 0.6 : 1 }}>
                  <XCircle size={14} />
                  {cancellingId === a.id ? 'Cancelling...' : 'Cancel'}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setRescheduleTarget(a); }} style={{ ...listStyles.btnBase, background: '#F2F4F7', color: 'var(--accent-primary)' }}>
                  <Calendar size={14} /> Reschedule
                </button>
                <button onClick={(e) => { e.stopPropagation(); setNotesTarget(a); }} style={{ ...listStyles.btnBase, background: '#F2F4F7', color: 'var(--accent-primary)' }}>
                  <Edit3 size={14} /> Notes
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
