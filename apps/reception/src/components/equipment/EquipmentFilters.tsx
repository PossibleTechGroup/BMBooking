import { filterStyles } from '../../pages/EquipmentPage.styles';
import type { HospitalEquipment } from '../../store/slices/equipmentSlice';
import { EthiopianDateHint } from '../EthiopianDateHint';

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface Props {
  statusFilter: string;
  dateFilter: string;
  equipmentFilter: number | '';
  equipment: HospitalEquipment[];
  onStatusChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onEquipmentChange: (v: number | '') => void;
}

export default function EquipmentFilters({ statusFilter, dateFilter, equipmentFilter, equipment, onStatusChange, onDateChange, onEquipmentChange }: Props) {
  return (
    <div style={filterStyles.row}>
      <div>
        <label style={filterStyles.fieldLabel}>Status</label>
        <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} style={filterStyles.select}>
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={filterStyles.fieldLabel}>Date</label>
        <input type="date" value={dateFilter} onChange={(e) => onDateChange(e.target.value)} style={filterStyles.dateInput} />
        <EthiopianDateHint isoDate={dateFilter} />
      </div>
      <div>
        <label style={filterStyles.fieldLabel}>Equipment</label>
        <select value={equipmentFilter} onChange={(e) => onEquipmentChange(e.target.value ? Number(e.target.value) : '')} style={filterStyles.equipSelect}>
          <option value="">All Equipment</option>
          {equipment.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
