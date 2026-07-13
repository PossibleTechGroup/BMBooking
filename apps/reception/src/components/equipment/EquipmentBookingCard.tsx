import { CheckCircle, Calendar, Edit3, XCircle } from 'lucide-react';
import { bookingCardStyles, btnStyles } from '../../pages/EquipmentPage.styles';
import type { EquipmentBooking } from '../../store/slices/equipmentSlice';
import { formatDateTime } from '../../utils/ethiopianDate';


const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: '#ECFDF3', text: '#027A48' },
  completed: { bg: '#EFF8FF', text: '#175CD3' },
  cancelled: { bg: '#F2F4F7', text: '#667085' },
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface Props {
  booking: EquipmentBooking;
  completingId: number | null;
  cancellingId: number | null;
  onComplete: (b: EquipmentBooking) => void;
  onCancel: (b: EquipmentBooking) => void;
  onReschedule: (b: EquipmentBooking) => void;
  onNotes: (b: EquipmentBooking) => void;
}

export default function EquipmentBookingCard({ booking: b, completingId, cancellingId, onComplete, onCancel, onReschedule, onNotes }: Props) {
  const colors = STATUS_COLORS[b.status] || STATUS_COLORS.confirmed;
  const patientName = b.patient.patientProfile?.fullName || 'Unknown';

  return (
    <div style={bookingCardStyles.card}>
      <div style={bookingCardStyles.headerRow}>
        <div style={bookingCardStyles.infoCol}>
          <div style={bookingCardStyles.titleRow}>
            <span style={bookingCardStyles.patientName}>{patientName}</span>
            <span style={bookingCardStyles.equipName}>→ {b.equipment.name}</span>
            <span style={bookingCardStyles.categoryBadge}>{b.equipment.category}</span>
            {!b.equipment.isOperational && (
              <span style={bookingCardStyles.maintBadge}>Maintenance</span>
            )}
          </div>
          <div style={bookingCardStyles.detailsRow}>
            <span>{formatDateTime(new Date(b.dateTime))}</span>
            {b.notes && <span>· {b.notes}</span>}
          </div>
          {b.status === 'cancelled' && b.declineReason && (
            <div style={bookingCardStyles.declineReason}>Reason: {b.declineReason}</div>
          )}
        </div>
        <div style={bookingCardStyles.statusCol}>
          <span style={{ ...bookingCardStyles.statusBadge, background: colors.bg, color: colors.text }}>
            {STATUS_LABELS[b.status]}
          </span>
        </div>
      </div>

      {b.status === 'confirmed' && (
        <div style={bookingCardStyles.actionRow}>
          <button onClick={() => onComplete(b)} disabled={completingId === b.id}
            style={{ ...btnStyles.base, ...btnStyles.complete, opacity: completingId === b.id ? 0.6 : 1 }}>
            <CheckCircle size={14} />
            {completingId === b.id ? 'Completing...' : 'Complete'}
          </button>
          <button onClick={() => onCancel(b)} disabled={cancellingId === b.id}
            style={{ ...btnStyles.base, ...btnStyles.cancelDanger, opacity: cancellingId === b.id ? 0.6 : 1 }}>
            <XCircle size={14} />
            {cancellingId === b.id ? 'Cancelling...' : 'Cancel'}
          </button>
          <button onClick={() => onReschedule(b)} style={{ ...btnStyles.base, ...btnStyles.reschedule }}>
            <Calendar size={14} />
            Reschedule
          </button>
          <button onClick={() => onNotes(b)} style={{ ...btnStyles.base, ...btnStyles.notes }}>
            <Edit3 size={14} />
            Notes
          </button>
        </div>
      )}
    </div>
  );
}
