'use client';

import { Calendar } from 'lucide-react';
import { useTimeFormat } from '@/lib/utils/timeFormat';
import { formatEthiopianCalendarDate } from '@/lib/utils/ethiopianDate';

interface EthiopianDateHintProps {
  isoDate: string;
  className?: string;
}

export function EthiopianDateHint({ isoDate, className = '' }: EthiopianDateHintProps) {
  const { isEthiopianCalendar } = useTimeFormat();
  if (!isEthiopianCalendar || !isoDate) return null;

  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  return (
    <div className={`flex items-center gap-1.5 mt-1 text-[12px] text-text-secondary ${className}`}>
      <Calendar size={13} className="text-primary" />
      {formatEthiopianCalendarDate(date, 'medium')}
    </div>
  );
}