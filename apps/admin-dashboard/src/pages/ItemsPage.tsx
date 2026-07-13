import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { 
  fetchAdminHospitals as fetchItems, 
  addItem, 
  updateItem,
  deleteItem,
  fetchEquipmentBookings,
  clearSuccess
} from '../store/slices/equipmentSlice';
import { fetchHospitals, createHospital } from '../store/slices/hospitalSlice';
import { formatDateTime, formatNum } from '../utils/ethiopianDate';
import { EthiopianDateHint } from '../components/EthiopianDateHint';
import { 
   Plus, 
   MapPin, 
  Phone, 
  Trash2, 
  Edit3,
  Search,
  Package,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle,
  Building2,
  Image as ImageIcon,
  Calendar,
  Clock,
} from 'lucide-react';
import { adminPageStyles } from '../styles/adminPageStyles';
import { PageHeader } from '../components/PageHeader';
import { SubTabs } from '../components/SubTabs';


const DEFAULT_CENTER = { lat: 9.0192, lng: 38.7525 };

const emptyNewHospital = {
  name: '',
  address: '',
  phone: '',
  email: '',
  latitude: DEFAULT_CENTER.lat,
  longitude: DEFAULT_CENTER.lng,
  cardPrice: '0',
};

export const ItemsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, success, error, bookings, bookingsLoading } = useSelector((state: RootState) => state.equipment);
  const { hospitals } = useSelector((state: RootState) => state.hospitals);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showNewHospitalModal, setShowNewHospitalModal] = useState(false);
  const [subTab, setSubTab] = useState<'equipment' | 'bookings'>('equipment');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [newHospitalForm, setNewHospitalForm] = useState(emptyNewHospital);
  const [hospitalImageFile, setHospitalImageFile] = useState<File | null>(null);
  const [hospitalImagePreview, setHospitalImagePreview] = useState<string | null>(null);
  const hospitalFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    id: null as number | null,
    name: '',
    category: 'MRI',
    hospitalId: '' as string | number,
    description: '',
    isOperational: true,
  });

  useEffect(() => {
    dispatch(fetchItems());
    dispatch(fetchHospitals());
  }, [dispatch]);

  useEffect(() => {
    if (subTab === 'bookings') {
      const params: any = {};
      if (bookingStatusFilter) params.status = bookingStatusFilter;
      if (bookingDateFilter) params.date = bookingDateFilter;
      dispatch(fetchEquipmentBookings(params));
    }
  }, [subTab, bookingStatusFilter, bookingDateFilter, dispatch]);

  // Handle Success Feedback
  useEffect(() => {
    if (success) {
      setShowToast(true);
      setShowModal(false);
      const timer = setTimeout(() => {
        setShowToast(false);
        dispatch(clearSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const selectedHospital = hospitals.find((h) => h.id === Number(formData.hospitalId));

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      name: '',
      category: 'MRI',
      hospitalId: hospitals[0]?.id ?? '',
      description: '',
      isOperational: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setIsEditing(true);
    setFormData({
      id: item.id,
      name: item.name,
      category: item.category,
      hospitalId: item.hospitalId ?? '',
      description: item.description || '',
      isOperational: item.isOperational,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hospitalId) return;

    const data = new FormData();
    data.append('name', formData.name);
    data.append('category', formData.category);
    data.append('hospitalId', String(formData.hospitalId));
    data.append('isOperational', String(formData.isOperational));
    if (formData.description) data.append('description', formData.description);

    if (isEditing && formData.id) {
      dispatch(updateItem({ id: formData.id, formData: data }));
    } else {
      dispatch(addItem(data));
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    const base = {
      name: newHospitalForm.name,
      address: newHospitalForm.address || null,
      phone: newHospitalForm.phone || null,
      email: newHospitalForm.email || null,
      latitude: Number(newHospitalForm.latitude),
      longitude: Number(newHospitalForm.longitude),
      cardPrice: 0,
    };
    const payload = hospitalImageFile
      ? (() => { const fd = new FormData(); Object.entries(base).forEach(([k, v]) => fd.append(k, String(v))); fd.append('image', hospitalImageFile); return fd; })()
      : base;
    const result = await dispatch(createHospital(payload as any));
    if (createHospital.fulfilled.match(result)) {
      setFormData((prev) => ({ ...prev, hospitalId: result.payload.id }));
      setShowNewHospitalModal(false);
      setNewHospitalForm(emptyNewHospital);
      setHospitalImageFile(null);
      setHospitalImagePreview(null);
      dispatch(fetchHospitals());
    }
  };

  const handleDelete = async (id: number) => {
    dispatch(deleteItem(id));
    setShowConfirmDelete(null);
  };

  const filteredItems = items.filter((item: any) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.hospitalName || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div style={adminPageStyles.pageWide}>
      <PageHeader
        icon={Package}
        title="Medical Tools Management"
        subtitle="Manage tool availability and location details."
        actions={
          <button style={adminPageStyles.primaryBtn} onClick={handleOpenAdd}>
            <Plus size={18} /> Post New Tool
          </button>
        }
      />

      <SubTabs
        tabs={[
          { key: 'equipment', label: 'Equipment', icon: <Package size={16} /> },
          { key: 'bookings', label: 'Bookings', icon: <Calendar size={16} /> },
        ]}
        activeKey={subTab}
        onChange={(key) => setSubTab(key as 'equipment' | 'bookings')}
      />

      {subTab === 'equipment' ? (
        <>
      <div style={styles.searchContainer}>
        <div style={adminPageStyles.searchWrap}>
          <Search size={18} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Search tools..." 
            style={adminPageStyles.searchInput}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable Container */}
      <div style={styles.scrollArea}>
        <div style={styles.grid}>
          {filteredItems.map(item => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.iconBox}>
                  <Package size={20} color="#3B82F6" />
                </div>
                <div style={{ flex: 1, marginLeft: 12 }}>
                  <h4 style={styles.itemName}>{item.name}</h4>
                  <p style={styles.itemCat}>{item.category}</p>
                </div>
                <div style={styles.itemActions}>
                  <button style={styles.actionBtn} onClick={() => handleOpenEdit(item)}>
                    <Edit3 size={16} />
                  </button>
                  <button style={{...styles.actionBtn, color: '#EF4444'}} onClick={() => setShowConfirmDelete(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <Building2 size={14} color="#64748B" />
                  <span style={styles.infoLabel}>{item.hospitalName}</span>
                </div>
                <div style={styles.infoRow}>
                  <Phone size={14} color="#64748B" />
                  <span style={styles.infoLabel}>{item.hospitalPhone}</span>
                </div>
                <div style={styles.infoRow}>
                  <MapPin size={14} color="#64748B" />
                  <span style={styles.infoLabel}>{item.address}</span>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <div style={{...styles.statusBadge, backgroundColor: item.isOperational ? '#ECFDF3' : '#FEF3F2'}}>
                  <span style={{...styles.statusText, color: item.isOperational ? '#027A48' : '#D92D20'}}>
                    {item.isOperational ? 'Available' : 'Busy'}
                  </span>
                </div>
                <div style={styles.coords}>
                  {(item.latitude ?? 0).toFixed(4)}, {(item.longitude ?? 0).toFixed(4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div style={styles.toast}>
          <CheckCircle size={18} color="#FFF" />
          <span>Tool saved successfully!</span>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{isEditing ? 'Edit Medical Tool' : 'Post New Medical Tool'}</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn} disabled={loading}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formSplit}>
                <div style={styles.formLeft}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Tool Name</label>
                    <input
                      placeholder="Tool Name"
                      style={styles.input}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Category & Status</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <select
                        style={{ ...styles.input, flex: 1 }}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        disabled={loading}
                      >
                        <option value="MRI">MRI</option>
                        <option value="CT_SCAN">CT Scan</option>
                        <option value="DIALYSIS">Dialysis</option>
                        <option value="ULTRASOUND">Ultrasound</option>
                        <option value="XRAY">X-Ray</option>
                        <option value="MAMMOGRAPHY">Mammography</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <select
                        style={{ ...styles.input, flex: 1 }}
                        value={formData.isOperational ? 'true' : 'false'}
                        onChange={(e) =>
                          setFormData({ ...formData, isOperational: e.target.value === 'true' })
                        }
                        disabled={loading}
                      >
                        <option value="true">Available</option>
                        <option value="false">Busy</option>
                      </select>
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Hospital *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        style={{ ...styles.input, flex: 1 }}
                        value={formData.hospitalId}
                        onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                        required
                        disabled={loading || isEditing}
                      >
                        <option value="">Select hospital</option>
                        {hospitals.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} (Service fee: {h.serviceFee ? `${formatNum(Number(h.serviceFee))} ETB` : 'Not set'})
                          </option>
                        ))}
                      </select>
                      {!isEditing && (
                        <button
                          type="button"
                          style={styles.secondaryBtn}
                          onClick={() => setShowNewHospitalModal(true)}
                          disabled={loading}
                        >
                          <Plus size={16} /> New
                        </button>
                      )}
                    </div>
                    {selectedHospital && (
                      <p style={styles.hospitalHint}>
                        <Building2 size={12} /> {selectedHospital.address || 'No address'} · Service fee{' '}
                        {selectedHospital.serviceFee ? `${formatNum(Number(selectedHospital.serviceFee))} ETB` : 'Not set'}
                      </p>
                    )}
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Description</label>
                    <textarea
                      placeholder="Optional description"
                      style={styles.textarea}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div style={styles.formRight}>
                  <label style={styles.label}>Hospital location (read-only)</label>
                  {selectedHospital ? (
                    <div style={styles.hospitalPreview}>
                      <p>
                        <MapPin size={14} /> {selectedHospital.address || '—'}
                      </p>
                      <p>
                        <Phone size={14} /> {selectedHospital.phone || '—'}
                      </p>
                      <p style={styles.coords}>
                        {selectedHospital.latitude ?? '—'}, {selectedHospital.longitude ?? '—'}
                      </p>
                      <p style={{ fontSize: 12, color: '#64748B', marginTop: 12 }}>
                        Location is managed under Hospitals. Create a new hospital if this facility
                        is not listed.
                      </p>
                    </div>
                  ) : (
                    <div style={styles.mapPlaceholder}>Select or create a hospital</div>
                  )}
                </div>
              </div>

              {error && <div style={styles.errorMsg}><AlertTriangle size={14} /> {error}</div>}

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn} disabled={loading}>Cancel</button>
                <button type="submit" style={styles.confirmBtn} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (isEditing ? 'Save Changes' : 'Post Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewHospitalModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, width: 480 }}>
            <h3 style={{ marginBottom: 16 }}>New Hospital</h3>
            <form onSubmit={handleCreateHospital} style={styles.form}>
              <input
                placeholder="Hospital name *"
                style={styles.input}
                value={newHospitalForm.name}
                onChange={(e) => setNewHospitalForm({ ...newHospitalForm, name: e.target.value })}
                required
              />
              {/* Visit card price hidden */}
              <input
                placeholder="Address"
                style={styles.input}
                value={newHospitalForm.address}
                onChange={(e) => setNewHospitalForm({ ...newHospitalForm, address: e.target.value })}
              />
              <input
                placeholder="Phone"
                style={styles.input}
                value={newHospitalForm.phone}
                onChange={(e) => setNewHospitalForm({ ...newHospitalForm, phone: e.target.value })}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  style={{ ...styles.input, flex: 1 }}
                  value={newHospitalForm.latitude}
                  onChange={(e) =>
                    setNewHospitalForm({ ...newHospitalForm, latitude: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  style={{ ...styles.input, flex: 1 }}
                  value={newHospitalForm.longitude}
                  onChange={(e) =>
                    setNewHospitalForm({ ...newHospitalForm, longitude: Number(e.target.value) })
                  }
                />
              </div>
              {newHospitalForm.latitude && newHospitalForm.longitude && (
                <a href={`https://www.google.com/maps?q=${newHospitalForm.latitude},${newHospitalForm.longitude}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#3B82F6', textDecoration: 'none' }}>
                  <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Open in Google Maps
                </a>
              )}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 4, display: 'block' }}>
                  <ImageIcon size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Hospital Photo
                </label>
                <input
                  ref={hospitalFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setHospitalImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setHospitalImagePreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
                  <button type="button" onClick={() => hospitalFileInputRef.current?.click()} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    {hospitalImagePreview ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {hospitalImagePreview && (
                    <button type="button" onClick={() => { setHospitalImageFile(null); setHospitalImagePreview(null); }} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#B42318', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>
                {hospitalImagePreview && (
                  <img src={hospitalImagePreview} alt="Preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />
                )}
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => { setShowNewHospitalModal(false); setHospitalImageFile(null); setHospitalImagePreview(null); }}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.confirmBtn}>
                  Create & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, width: '400px', textAlign: 'center'}}>
            <div style={styles.warningIcon}><AlertTriangle size={48} color="#EF4444" /></div>
            <h3 style={{ marginBottom: 12 }}>Are you sure?</h3>
            <p style={{ color: '#64748B', marginBottom: 24 }}>This tool will be permanently removed.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setShowConfirmDelete(null)} style={styles.cancelBtn} disabled={loading}>Cancel</button>
              <button onClick={() => handleDelete(showConfirmDelete)} style={{...styles.confirmBtn, backgroundColor: '#EF4444'}} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>) : null}

      {subTab === 'bookings' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>Status</label>
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', background: '#FFF', minWidth: '140px' }}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>Date</label>
              <input
                type="date"
                value={bookingDateFilter}
                onChange={(e) => setBookingDateFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', background: '#FFF' }}
              />
              <EthiopianDateHint isoDate={bookingDateFilter} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 24 }}>
            {error && <div style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} />{error}</div>}
            {bookingsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : bookings?.bookings?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B', fontSize: '15px' }}>No equipment bookings found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>
                  {bookings?.total ?? 0} booking(s)
                  {bookings?.byStatus?.map((s: any) => (
                    <span key={s.status} style={{ marginLeft: '12px', fontSize: '13px' }}>
                      {s.status}: <strong>{s._count.id}</strong>
                    </span>
                  ))}
                </div>
                {bookings?.bookings?.map((b: any) => (
                  <div key={b.id} style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '15px' }}>{b.patient?.patientProfile?.fullName || 'Unknown'}</strong>
                        <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '8px' }}>{b.patient?.phone}</span>
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: b.status === 'pending' ? '#FEF3C7' : b.status === 'confirmed' ? '#DBEAFE' : b.status === 'completed' ? '#D1FAE5' : b.status === 'declined' ? '#FEE2E2' : '#F1F5F9',
                        color: b.status === 'pending' ? '#92400E' : b.status === 'confirmed' ? '#1E40AF' : b.status === 'completed' ? '#065F46' : b.status === 'declined' ? '#991B1B' : '#475569',
                      }}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#475569' }}>
                      <span><Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{formatDateTime(new Date(b.dateTime))}</span>
                      <span><Package size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{b.equipment?.name || 'Unknown'}</span>
                      <span><Building2 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{b.hospital?.name || 'Unknown'}</span>
                    </div>
                    {b.notes && <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontStyle: 'italic' }}>{b.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  searchContainer: { marginBottom: '24px' },
  scrollArea: { flex: 1, overflowY: 'auto', paddingRight: '8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', paddingBottom: '40px' },
  card: { backgroundColor: '#FFF', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' },
  cardHeader: { display: 'flex', alignItems: 'center', marginBottom: '16px' },
  iconBox: { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: '16px', fontWeight: '700', color: '#1E293B' },
  itemCat: { fontSize: '12px', color: '#3B82F6', fontWeight: '600' },
  itemActions: { display: 'flex', gap: '4px' },
  actionBtn: { padding: '8px', color: '#94A3B8', cursor: 'pointer', border: 'none', background: 'none' },
  cardBody: { padding: '12px 0', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  infoLabel: { fontSize: '13px', color: '#475569' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '100px' },
  statusText: { fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' },
  coords: { fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' },
  toast: { position: 'fixed', bottom: '32px', right: '32px', backgroundColor: '#0F172A', color: '#FFF', padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 2000 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#FFF', width: '900px', padding: '32px', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  closeBtn: { border: 'none', background: 'none', color: '#64748B', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  formSplit: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px' },
  formLeft: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formRight: { display: 'flex', flexDirection: 'column' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '4px' },
  input: { height: '44px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0 12px', fontSize: '14px', outline: 'none', backgroundColor: '#F8FAFC' },
  textarea: { height: '100px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#F8FAFC', resize: 'none' },
  mapContainer: { height: '280px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' },
  map: { width: '100%', height: '100%' },
  mapPlaceholder: { height: '280px', backgroundColor: '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' },
  errorMsg: { color: '#EF4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '24px' },
  cancelBtn: { padding: '10px 20px', color: '#64748B', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer' },
  confirmBtn: { backgroundColor: '#0F172A', color: '#FFF', minWidth: '120px', height: '44px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  warningIcon: { marginBottom: '16px', display: 'flex', justifyContent: 'center' },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '0 12px',
    height: 44,
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: '#FFF',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  hospitalHint: { fontSize: 12, color: '#64748B', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 },
  hospitalPreview: {
    padding: 16,
    background: '#F8FAFC',
    borderRadius: 12,
    border: '1px solid #E2E8F0',
    fontSize: 14,
    color: '#475569',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
};
