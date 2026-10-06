import { Loader2, Trash2, Settings } from 'lucide-react';
import { statusCardStyles } from '../../pages/EquipmentPage.styles';
import type { HospitalEquipment } from '../../store/slices/equipmentSlice';

interface Props {
  equipment: HospitalEquipment[];
  loading: boolean;
  togglingId: number | null;
  deleteTargetId: number | null;
  onToggle: (eq: HospitalEquipment) => void;
  onDelete: (eq: HospitalEquipment) => void;
  onAdd: () => void;
  onEdit: (eq: HospitalEquipment) => void;
}

export default function EquipmentStatusCards({ equipment, loading, togglingId, deleteTargetId, onToggle, onDelete, onAdd, onEdit }: Props) {
  if (loading) return null;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={statusCardStyles.sectionHeader}>
        <h3 style={statusCardStyles.sectionTitle}>Equipment Status</h3>
        <button onClick={onAdd} style={statusCardStyles.addBtn}>+ Add Equipment</button>
      </div>
      {equipment.length > 0 && (
      <div className="equipment-scroll" style={statusCardStyles.scrollContainer as React.CSSProperties}>
        {equipment.map((eq) => (
          <div key={eq.id} style={statusCardStyles.card}>
            <div style={statusCardStyles.cardBody}>
              <div style={statusCardStyles.cardName}>{eq.name}</div>
              <div style={statusCardStyles.cardCategory}>{eq.category}</div>
              {eq.doctorName && (
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Dr. {eq.doctorName}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: eq.price != null ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {eq.price != null ? `${eq.price} ETB` : 'Free'}
                </span>
              </div>
            </div>
            <div style={statusCardStyles.cardActions}>
              <span style={{
                ...statusCardStyles.statusBadge,
                background: eq.isOperational ? '#ECFDF3' : '#FEF3F2',
                color: eq.isOperational ? '#027A48' : '#D92D20',
              }}>
                {eq.isOperational ? 'Operational' : 'Maintenance'}
              </span>
              <button
                onClick={() => onToggle(eq)}
                disabled={togglingId === eq.id}
                style={{ ...statusCardStyles.toggleBtn, opacity: togglingId === eq.id ? 0.6 : 1 }}
              >
                {togglingId === eq.id ? '...' : 'Toggle'}
              </button>
              <button
                onClick={() => onEdit(eq)}
                title="Edit equipment"
                style={statusCardStyles.hoursBtn}
              >
                <Settings size={14} />
              </button>
              <button
                onClick={() => onDelete(eq)}
                disabled={deleteTargetId === eq.id}
                title="Delete equipment"
                style={{ ...statusCardStyles.deleteBtn, opacity: deleteTargetId === eq.id ? 0.5 : 1 }}
              >
                {deleteTargetId === eq.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}