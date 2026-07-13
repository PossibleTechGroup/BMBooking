import { Clock, Loader2 } from 'lucide-react';
import { type SlotOption, fmtSlotTime } from './useCreateAppointment';

interface ScheduleSlotPickerProps {
  doctorId: number | '';
  date: string;
  slotId: number | null;
  slots: SlotOption[];
  loadingSlots: boolean;
  selectSlot: (slot: SlotOption) => void;
}

export default function ScheduleSlotPicker({
  doctorId, date, slotId, slots, loadingSlots, selectSlot,
}: ScheduleSlotPickerProps) {
  if (!doctorId || !date) return null;

  return (
    <div>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
        <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Available Slots
        {slotId && <span style={{ fontSize: 12, color: 'var(--status-success)', marginLeft: 8 }}>✓ Slot selected</span>}
      </label>
      {loadingSlots ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, padding: '8px 0' }}>
          <Loader2 size={14} className="spin" /> Loading slots...
        </div>
      ) : slots.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--status-error)', padding: '8px 12px', background: '#FEF3F2', borderRadius: 'var(--radius-sm)' }}>
          No available slots for this doctor on this date. Create a schedule first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {slots.map((slot) => {
            const filled = slot._count.bookings;
            const max = slot.maxPatients;
            const isFull = filled >= max;
            const isSelected = slotId === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                disabled={isFull}
                onClick={() => selectSlot(slot)}
                title={isFull ? 'This slot is full' : `${filled}/${max} booked — click to select`}
                style={{
                  padding: '8px 14px', borderRadius: '8px', cursor: isFull ? 'not-allowed' : 'pointer',
                  border: `1px solid ${isSelected ? 'var(--accent-primary)' : isFull ? '#FECDCA' : 'var(--border)'}`,
                  background: isSelected ? '#EFF6FF' : isFull ? '#FEF3F2' : '#FFF',
                  color: isFull ? 'var(--text-secondary)' : 'var(--text-primary)',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: 13,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  opacity: isFull ? 0.6 : 1,
                }}
              >
                <span>{fmtSlotTime(slot.startTime)} – {fmtSlotTime(slot.endTime)}</span>
                <span style={{ fontSize: 11, color: isFull ? 'var(--status-error)' : 'var(--text-secondary)' }}>
                  {isFull ? 'FULL' : `${max - filled} spot${max - filled !== 1 ? 's' : ''} left`}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
