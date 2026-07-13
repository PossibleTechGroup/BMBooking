import type { JSX } from 'react';
import { ClipboardList, CheckCircle, CheckCheck, Ban } from 'lucide-react';
import { statsStyles } from '../../pages/EquipmentPage.styles';

interface Stats {
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

const STAT_ITEMS: { label: string; key: keyof Stats; color: string; bg: string; icon: JSX.Element }[] = [
  { label: 'Total', key: 'total', color: '#1E293B', bg: '#F1F5F9', icon: <ClipboardList size={18} /> },
  { label: 'Confirmed', key: 'confirmed', color: '#027A48', bg: '#ECFDF3', icon: <CheckCircle size={18} /> },
  { label: 'Completed', key: 'completed', color: '#175CD3', bg: '#EFF8FF', icon: <CheckCheck size={18} /> },
  { label: 'Cancelled', key: 'cancelled', color: '#6941C6', bg: '#F4F3FF', icon: <Ban size={18} /> },
];

export default function EquipmentStatsCards({ stats }: { stats: Stats }) {
  return (
    <div style={statsStyles.row}>
      {STAT_ITEMS.map((s) => (
        <div
          key={s.label}
          style={statsStyles.card}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'none';
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
          }}
        >
          <div style={statsStyles.cardHeader}>
            <span style={statsStyles.label}>{s.label}</span>
            <div style={{ ...statsStyles.iconBox, backgroundColor: s.bg, color: s.color }}>
              {s.icon}
            </div>
          </div>
          <div style={{ ...statsStyles.value, color: s.color }}>{stats[s.key]}</div>
        </div>
      ))}
    </div>
  );
}
