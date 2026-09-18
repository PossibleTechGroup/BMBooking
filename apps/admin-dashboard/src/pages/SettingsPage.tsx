import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { formatNum } from '../utils/ethiopianDate';
import {
  fetchHospitals,
  setServiceFee,
  clearHospitalError,
  type Hospital,
} from '../store/slices/hospitalSlice';
import {
  Settings,
  DollarSign,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Building2,
  Loader2,
  Search,
  Package,
} from 'lucide-react';
import { adminPageStyles } from '../styles/adminPageStyles';
import { PageHeader } from '../components/PageHeader';
import {
  fetchAdminHospitals as fetchEquipmentItems,
  updateItem as updateEquipmentItem,
} from '../store/slices/equipmentSlice';

export const SettingsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hospitals, loading, error, success } = useSelector((state: RootState) => state.hospitals);
  const { items: equipmentItems, loading: equipmentLoading } = useSelector((state: RootState) => state.equipment);

  const [search, setSearch] = useState('');
  const [editingFeeId, setEditingFeeId] = useState<number | null>(null);
  const [feeInputValue, setFeeInputValue] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [priceInputValue, setPriceInputValue] = useState('');
  const [savingPriceId, setSavingPriceId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchHospitals({ page: 1, limit: 500 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchEquipmentItems());
  }, [dispatch]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const filtered = hospitals.filter((h: Hospital) =>
    h.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveFee = async (hospitalId: number) => {
    const amount = feeInputValue === '' ? null : Number(feeInputValue);
    if (amount !== null && (isNaN(amount) || amount < 0)) {
      setToast({ type: 'error', message: 'Invalid amount' });
      return;
    }
    const result = await dispatch(setServiceFee({ hospitalId, amount }));
    if (setServiceFee.fulfilled.match(result)) {
      setToast({ type: 'success', message: 'Service fee updated.' });
      dispatch(fetchHospitals({ page: 1, limit: 500 }));
    } else {
      setToast({ type: 'error', message: (result.payload as string) || 'Failed to set service fee' });
    }
    setEditingFeeId(null);
    setFeeInputValue('');
  };

  const stats = {
    hospitals: hospitals.length,
    withFee: hospitals.filter((h) => h.serviceFee !== null && h.serviceFee !== undefined).length,
  };

  const hostedEquipments = equipmentItems.filter((e: any) =>
    e.name?.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  const handleSavePrice = async (id: number) => {
    const amount = priceInputValue === '' ? null : Number(priceInputValue);
    if (amount !== null && (isNaN(amount) || amount < 0)) {
      setToast({ type: 'error', message: 'Invalid price' });
      return;
    }
    setSavingPriceId(id);
    const formData = new FormData();
    formData.append('price', amount === null ? 'null' : JSON.stringify(amount));
    const result = await dispatch(updateEquipmentItem({ id, formData }));
    setSavingPriceId(null);
    if (updateEquipmentItem.fulfilled.match(result)) {
      setToast({ type: 'success', message: 'Equipment price updated.' });
      dispatch(fetchEquipmentItems());
    } else {
      setToast({ type: 'error', message: (result.payload as string) || 'Failed to update price' });
    }
    setEditingPriceId(null);
    setPriceInputValue('');
  };

  return (
    <div style={adminPageStyles.pageWide}>
      <PageHeader
        icon={Settings}
        title="Settings"
        subtitle="Manage application-level settings and service fees."
      />

      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button type="button" onClick={() => dispatch(clearHospitalError())} style={styles.dismissBtn}>
            Dismiss
          </button>
        </div>
      )}
      {toast && (
        <div style={{ ...styles.toast, backgroundColor: toast.type === 'success' ? '#ECFDF3' : '#FEF3F2', color: toast.type === 'success' ? '#027A48' : '#B42318' }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} style={styles.dismissBtn}>Dismiss</button>
        </div>
      )}

      {/* Service fee management section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.sectionIcon}><DollarSign size={18} color="#059669" /></div>
            <div>
              <h2 style={styles.sectionTitle}>Service Fee Management</h2>
              <p style={styles.sectionSubtitle}>
                Set the platform service fee charged per hospital. Leave blank to clear a fee.
              </p>
            </div>
          </div>
          <div style={styles.statChips}>
            <span style={styles.statChip}>Hospitals: <strong>{stats.hospitals}</strong></span>
            <span style={styles.statChip}>With fee: <strong>{stats.withFee}</strong></span>
          </div>
        </div>

        {/* Search */}
        <div style={{ ...adminPageStyles.searchWrap, width: '100%', maxWidth: 400, marginBottom: 20 }}>
          <Search size={16} color="#94A3B8" />
          <input
            style={adminPageStyles.searchInput}
            placeholder="Search hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && hospitals.length === 0 ? (
          <div style={adminPageStyles.loadingWrap}>
            <Loader2 size={28} className="spin" color="#94A3B8" />
          </div>
        ) : filtered.length === 0 ? (
          <p style={adminPageStyles.emptyState}>No hospitals found.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Hospital</th>
                  <th style={{ ...styles.th, width: 200 }}>Service Fee (ETB)</th>
                  <th style={{ ...styles.th, textAlign: 'right', width: 160 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr key={h.id} style={styles.tr}>
                    <td style={styles.td}>
                      {h.image ? (
                        <img src={h.image} alt={h.name} style={styles.thumb} />
                      ) : (
                        <div style={styles.thumbPlaceholder}><Building2 size={16} color="#94A3B8" /></div>
                      )}
                      <div>
                        <strong style={styles.hospitalName}>{h.name}</strong>
                        {h.address && <span style={styles.hospitalAddr}>{h.address}</span>}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {editingFeeId === h.id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Amount or empty to clear"
                            style={styles.feeInput}
                            value={feeInputValue}
                            onChange={(e) => setFeeInputValue(e.target.value)}
                            autoFocus
                          />
                          <span style={styles.etbSuffix}>ETB</span>
                        </div>
                      ) : (
                        <span style={styles.feeDisplay}>
                          {h.serviceFee !== null && h.serviceFee !== undefined
                            ? `${formatNum(Number(h.serviceFee))} ETB`
                            : <span style={{ color: '#CBD5E1' }}>Not set</span>}
                        </span>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      {editingFeeId === h.id ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button type="button" style={styles.smallBtn} onClick={() => handleSaveFee(h.id)}>
                            Save
                          </button>
                          <button
                            type="button"
                            style={{ ...styles.smallBtn, color: '#64748B', background: 'none', border: '1px solid #E2E8F0' }}
                            onClick={() => { setEditingFeeId(null); setFeeInputValue(''); }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          style={styles.editFeeBtn}
                          onClick={() => { setEditingFeeId(h.id); setFeeInputValue(h.serviceFee !== null && h.serviceFee !== undefined ? String(h.serviceFee) : ''); }}
                          title="Edit service fee"
                        >
                          <Edit3 size={13} /> Edit Fee
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Equipment prices section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...styles.sectionIcon, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <Package size={18} color="#2563EB" />
            </div>
            <div>
              <h2 style={styles.sectionTitle}>Equipment Prices</h2>
              <p style={styles.sectionSubtitle}>
                Set the price charged per equipment booking. Patients pay the equipment price plus the
                hospital service fee.
              </p>
            </div>
          </div>
          <div style={styles.statChips}>
            <span style={styles.statChip}>Equipment: <strong>{equipmentItems.length}</strong></span>
          </div>
        </div>

        <div style={{ ...adminPageStyles.searchWrap, width: '100%', maxWidth: 400, marginBottom: 20 }}>
          <Search size={16} color="#94A3B8" />
          <input
            style={adminPageStyles.searchInput}
            placeholder="Search equipment..."
            value={equipmentSearch}
            onChange={(e) => setEquipmentSearch(e.target.value)}
          />
        </div>

        {equipmentLoading && equipmentItems.length === 0 ? (
          <div style={adminPageStyles.loadingWrap}>
            <Loader2 size={28} className="spin" color="#94A3B8" />
          </div>
        ) : hostedEquipments.length === 0 ? (
          <p style={adminPageStyles.emptyState}>No equipment found.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Equipment</th>
                  <th style={styles.th}>Hospital</th>
                  <th style={{ ...styles.th, width: 140 }}>Service Fee (ETB)</th>
                  <th style={{ ...styles.th, width: 160 }}>Price (ETB)</th>
                  <th style={{ ...styles.th, width: 140 }}>Total (ETB)</th>
                  <th style={{ ...styles.th, textAlign: 'right', width: 160 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {hostedEquipments.map((it: any) => (
                  <tr key={it.id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong style={styles.hospitalName}>{it.name}</strong>
                      <span style={styles.hospitalAddr}>{it.category}</span>
                    </td>
                    <td style={styles.td}>{it.hospitalName || '—'}</td>
                    <td style={styles.td}>
                      <span style={styles.feeDisplay}>
                        {it.serviceFee !== null && it.serviceFee !== undefined && Number(it.serviceFee) > 0
                          ? `${formatNum(Number(it.serviceFee))} ETB`
                          : <span style={{ color: '#CBD5E1' }}>Default (50)</span>}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {editingPriceId === it.id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Amount"
                            autoFocus
                            style={styles.feeInput}
                            value={priceInputValue}
                            onChange={(e) => setPriceInputValue(e.target.value)}
                          />
                          <span style={styles.etbSuffix}>ETB</span>
                        </div>
                      ) : (
                        <span style={styles.feeDisplay}>
                          {it.price !== null && it.price !== undefined && Number(it.price) > 0
                            ? `${formatNum(Number(it.price))} ETB`
                            : <span style={{ color: '#CBD5E1' }}>Free</span>}
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.feeDisplay, color: '#2563EB' }}>
                        {formatNum((Number(it.price) || 0) + (it.serviceFee !== null && it.serviceFee !== undefined ? Number(it.serviceFee) : 50))} ETB
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      {editingPriceId === it.id ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button type="button" style={styles.smallBtn} onClick={() => handleSavePrice(it.id)} disabled={savingPriceId === it.id}>
                            {savingPriceId === it.id ? <Loader2 size={14} className="spin" /> : 'Save'}
                          </button>
                          <button
                            type="button"
                            style={{ ...styles.smallBtn, color: '#64748B', background: 'none', border: '1px solid #E2E8F0' }}
                            onClick={() => { setEditingPriceId(null); setPriceInputValue(''); }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          title="Edit equipment price"
                          style={{ ...styles.editFeeBtn, color: '#2563EB', borderColor: '#3B82F6' }}
                          onClick={() => { setEditingPriceId(it.id); setPriceInputValue(it.price !== null && it.price !== undefined ? String(it.price) : ''); }}
                        >
                          <Edit3 size={13} /> Edit Price
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  section: {
    background: '#FFF',
    borderRadius: 16,
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: '#F0FDF4',
    border: '1px solid #DCFCE7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' },
  sectionSubtitle: { margin: '4px 0 0', fontSize: 13, color: '#64748B' },
  statChips: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  statChip: {
    padding: '6px 12px',
    borderRadius: 8,
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    fontSize: 13,
    color: '#475569',
  },
  tableWrap: { overflowX: 'auto', borderRadius: 12, border: '1px solid #E2E8F0' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 860 },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    background: '#F8FAFC',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    borderBottom: '1px solid #E2E8F0',
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '12px 16px', fontSize: 14, color: '#334155', verticalAlign: 'middle' },
  thumb: { width: 40, height: 40, borderRadius: 8, objectFit: 'cover', marginRight: 12, verticalAlign: 'middle' },
  thumbPlaceholder: {
    width: 40, height: 40, borderRadius: 8, background: '#F1F5F9',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  hospitalName: { display: 'block', color: '#0F172A' },
  hospitalAddr: { display: 'block', fontSize: 12, color: '#94A3B8', marginTop: 2 },
  feeDisplay: { fontSize: 15, fontWeight: 600, color: '#065F46' },
  feeInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #059669',
    fontSize: 14,
    outline: 'none',
    backgroundColor: '#F8FAFC',
    minWidth: 140,
  },
  etbSuffix: { fontSize: 12, fontWeight: 600, color: '#64748B' },
  editFeeBtn: {
    background: 'none',
    border: '1.5px solid #059669',
    borderRadius: 8,
    cursor: 'pointer',
    color: '#059669',
    padding: '7px 12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  smallBtn: { padding: '7px 12px', borderRadius: 8, background: '#059669', color: '#FFF', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 12 },
  errorBanner: {
    background: '#FEF3F2',
    color: '#B42318',
    padding: '14px 18px',
    borderRadius: 12,
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #FECACA',
    fontSize: '14px',
  },
  toast: { padding: '14px 18px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid transparent', fontSize: '14px', fontWeight: 500 },
  dismissBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 600, opacity: 0.7 },
};
