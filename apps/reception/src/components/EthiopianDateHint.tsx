import { Calendar } from 'lucide-react';
import { useTimeFormat } from '../utils/timeFormat';
import { formatEthiopianCalendarDate } from '../utils/ethiopianDate';

interface EthiopianDateHintProps {
  isoDate: string;
  style?: React.CSSProperties;
}

export function EthiopianDateHint({ isoDate, style }: EthiopianDateHintProps) {
  const { isEthiopianCalendar } = useTimeFormat();
  if (!isEthiopianCalendar || !isoDate) return null;

  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
        fontSize: 14,
        color: 'var(--text-secondary)',
        ...style,
      }}
    >
      <Calendar size={14} color="#7C3AED" />
      {formatEthiopianCalendarDate(date, 'medium')}
    </div>
  );
}
