import { Loader2 } from 'lucide-react';
import { pageStyles } from '../../pages/EquipmentPage.styles';
import EquipmentBookingCard from './EquipmentBookingCard';
import type { EquipmentBooking } from '../../store/slices/equipmentSlice';

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface Props {
  bookings: EquipmentBooking[];
  loading: boolean;
  statusFilter: string;
  completingId: number | null;
  cancellingId: number | null;
  onComplete: (b: EquipmentBooking) => void;
  onCancel: (b: EquipmentBooking) => void;
  onReschedule: (b: EquipmentBooking) => void;
  onNotes: (b: EquipmentBooking) => void;
}

export default function EquipmentBookingList({ bookings, loading, statusFilter, completingId, cancellingId, onComplete, onCancel, onReschedule, onNotes }: Props) {
  if (loading) {
    return (
      <div style={pageStyles.loadingContainer}>
        <Loader2 size={20} className="spin" />
        Loading bookings...
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div style={pageStyles.emptyState}>
        <p style={pageStyles.emptyTitle}>
          No {statusFilter !== 'all' ? STATUS_LABELS[statusFilter]?.toLowerCase() : ''} bookings
        </p>
        <p style={pageStyles.emptySubtitle}>
          Try changing the filters above.
        </p>
      </div>
    );
  }

  return (
    <div style={pageStyles.listContainer}>
      {bookings.map((b) => (
        <EquipmentBookingCard
          key={b.id}
          booking={b}
          completingId={completingId}
          cancellingId={cancellingId}
          onComplete={onComplete}
          onCancel={onCancel}
          onReschedule={onReschedule}
          onNotes={onNotes}
        />
      ))}
    </div>
  );
}
