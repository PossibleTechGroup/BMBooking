'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { formatNum, formatDate } from '@/lib/utils/ethiopianDate';
import {
  fetchHospitals,
  createHospital,
  updateHospital,
  deleteHospital,
  setServiceFee,
  fetchReceptionists,
  createReceptionist,
  updateReceptionist,
  deleteReceptionist,
  clearHospitalSuccess,
  clearHospitalError,
  type Hospital,
  type ReceptionistProfile,
} from '@/lib/store/slices/adminHospitalSlice';
import { api } from '@/lib/api/client';
import { Building2, Plus, MapPin, Phone, Mail, Users, Edit3, Trash2, CheckCircle, AlertTriangle, X, Image as ImageIcon, Loader2, DollarSign, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { adminPageStyles } from '@/lib/adminStyles';
import { AdminPageHeader } from '@/components/admin/page-header';
import { AdminSubTabs } from '@/components/admin/subtabs';

const DEFAULT_CENTER = { lat: 9.0192, lng: 38.7525 };

const emptyHospitalForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  latitude: String(DEFAULT_CENTER.lat),
  longitude: String(DEFAULT_CENTER.lng),
  cardPrice: '0',
  serviceFee: '',
};

interface HospitalRegistration {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  hospital: { id: number; name: string; address: string | null; phone: string | null; email: string | null };
  user: { id: number; phone: string | null; email: string | null };
}

export default function AdminHospitalsPage() {
  const dispatch = useAppDispatch();
  const { hospitals, receptionists, loading, success, error, pagination } = useAppSelector(
    (state) => state.adminHospitals,
  );

  const [tab, setTab] = useState<'hospitals' | 'receptionists' | 'registrations'>('hospitals');
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [hospitalForm, setHospitalForm] = useState(emptyHospitalForm);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [editingReception, setEditingReception] = useState<ReceptionistProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Hospital | null>(null);
  const [deleteReceptionTarget, setDeleteReceptionTarget] = useState<ReceptionistProfile | null>(null);
  const [page, setPage] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingFeeId, setEditingFeeId] = useState<number | null>(null);
  const [feeInputValue, setFeeInputValue] = useState('');

  const [receptionForm, setReceptionForm] = useState({
    username: '',
    password: '',
    hospitalId: '',
    phone: '',
    email: '',
  });

  const [registrations, setRegistrations] = useState<HospitalRegistration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [registrationFilter, setRegistrationFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [updatingRegId, setUpdatingRegId] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    dispatch(fetchHospitals({ page, limit: 12 }));
    dispatch(fetchReceptionists());
  }, [dispatch, page]);

  useEffect(() => {
    if (tab === 'registrations' && registrations.length === 0) {
      fetchRegistrations();
    }
  }, [tab]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => dispatch(clearHospitalSuccess()), 3000);
      return () => clearTimeout(t);
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchRegistrations = async () => {
    setRegistrationsLoading(true);
    try {
      const response = await api.get('/admin/hospital-registrations');
      setRegistrations(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch hospital registrations', err);
    } finally {
      setRegistrationsLoading(false);
    }
  };

  const handleApproveRegistration = async (id: number) => {
    setUpdatingRegId(id);
    try {
      await api.patch(`/admin/hospital-registrations/${id}`, { status: 'APPROVED' });
      await fetchRegistrations();
    } catch (err) {
      console.error('Failed to approve registration', err);
      alert('Failed to approve registration');
    } finally {
      setUpdatingRegId(null);
    }
  };

  const handleRejectRegistration = async () => {
    if (!rejectModal) return;
    setUpdatingRegId(rejectModal.id);
    try {
      await api.patch(`/admin/hospital-registrations/${rejectModal.id}`, {
        status: 'REJECTED',
        rejectionReason: rejectReason || null,
      });
      setRejectModal(null);
      setRejectReason('');
      await fetchRegistrations();
    } catch (err) {
      console.error('Failed to reject registration', err);
      alert('Failed to reject registration');
    } finally {
      setUpdatingRegId(null);
    }
  };

  const openAddHospital = () => {
    setEditingHospital(null);
    setHospitalForm(emptyHospitalForm);
    setImageFile(null);
    setImagePreview(null);
    setShowHospitalModal(true);
  };

  const openEditHospital = (h: Hospital) => {
    setEditingHospital(h);
    setHospitalForm({
      name: h.name,
      address: h.address || '',
      phone: h.phone || '',
      email: h.email || '',
      latitude: h.latitude != null ? String(h.latitude) : String(DEFAULT_CENTER.lat),
      longitude: h.longitude != null ? String(h.longitude) : String(DEFAULT_CENTER.lng),
      cardPrice: '0',
      serviceFee: h.serviceFee ? String(h.serviceFee) : '',
    });
    setImageFile(null);
    setImagePreview(h.image || null);
    setShowHospitalModal(true);
  };

  const handleHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const base: Record<string, any> = {
      name: hospitalForm.name,
      address: hospitalForm.address || null,
      phone: hospitalForm.phone || null,
      email: hospitalForm.email || null,
      latitude: Number(hospitalForm.latitude),
      longitude: Number(hospitalForm.longitude),
    };
    if (!editingHospital) {
      base.cardPrice = 0;
    }

    let payload: FormData | Record<string, unknown> = base;
    if (imageFile) {
      const fd = new FormData();
      Object.entries(base).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append('image', imageFile);
      payload = fd;
    }

    let result: any;
    if (editingHospital) {
      result = await dispatch(updateHospital({ id: editingHospital.id, payload }));
    } else {
      result = await dispatch(createHospital(payload));
    }

    if (createHospital.fulfilled.match(result) || updateHospital.fulfilled.match(result)) {
      const hospitalId = result.payload.id;
      const currentFee = editingHospital?.serviceFee ?? null;
      const newFee = Number(hospitalForm.serviceFee);
      if (currentFee !== newFee && !isNaN(newFee)) {
        await dispatch(setServiceFee({ hospitalId, amount: newFee }));
      }
      setToast({ type: 'success', message: 'Hospital saved successfully.' });
    } else {
      const errMsg = (result.payload as string) || 'Failed to save hospital';
      setToast({ type: 'error', message: errMsg });
    }
    setShowHospitalModal(false);
    dispatch(fetchHospitals({ page, limit: 12 }));
  };

  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const num = digits.startsWith('251') ? digits.slice(3) : digits;
    const limited = num.slice(0, 9);
    setHospitalForm({ ...hospitalForm, phone: limited ? `+251${limited}` : '' });
  };

  const handleDeleteHospital = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteHospital(deleteTarget.id));
    if (deleteHospital.fulfilled.match(result)) {
      setToast({ type: 'success', message: 'Hospital deleted.' });
    } else {
      const errMsg = (result.payload as string) || 'Failed to delete hospital';
      setToast({ type: 'error', message: errMsg });
    }
    setDeleteTarget(null);
  };

  const handleReceptionPhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const num = digits.startsWith('251') ? digits.slice(3) : digits;
    const limited = num.slice(0, 9);
    setReceptionForm({ ...receptionForm, phone: limited ? `+251${limited}` : '' });
  };

  const [receptionError, setReceptionError] = useState<string | null>(null);

  const openReceptionModal = () => {
    setEditingReception(null);
    setReceptionError(null);
    setReceptionForm({ username: '', password: '', hospitalId: '', phone: '', email: '' });
    setShowReceptionModal(true);
  };

  const openEditReception = (r: ReceptionistProfile) => {
    setEditingReception(r);
    setReceptionError(null);
    setReceptionForm({
      username: r.user.username || '',
      password: '',
      hospitalId: String(r.hospitalId),
      phone: r.user.phone || '',
      email: r.user.email || '',
    });
    setShowReceptionModal(true);
  };

  const closeReceptionModal = () => {
    setShowReceptionModal(false);
    setEditingReception(null);
    setReceptionError(null);
  };

  const handleReceptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReceptionError(null);
    if (editingReception) {
      const payload: { username?: string; password?: string; hospitalId?: number; phone?: string; email?: string } = {};
      if (receptionForm.username !== editingReception.user.username) payload.username = receptionForm.username;
      if (receptionForm.password) payload.password = receptionForm.password;
      if (Number(receptionForm.hospitalId) !== editingReception.hospitalId) payload.hospitalId = Number(receptionForm.hospitalId);
      if (receptionForm.phone !== (editingReception.user.phone || '')) payload.phone = receptionForm.phone || undefined;
      if (receptionForm.email !== (editingReception.user.email || '')) payload.email = receptionForm.email || undefined;
      if (Object.keys(payload).length === 0) {
        setReceptionError('No changes made.');
        return;
      }
      const result = await dispatch(updateReceptionist({ id: editingReception.id, payload }));
      if (updateReceptionist.fulfilled.match(result)) {
        closeReceptionModal();
        setToast({ type: 'success', message: 'Receptionist updated.' });
        dispatch(fetchReceptionists());
      } else {
        setReceptionError((result.payload as string) || 'Failed to update receptionist');
      }
    } else {
      const result = await dispatch(
        createReceptionist({
          username: receptionForm.username,
          password: receptionForm.password,
          hospitalId: Number(receptionForm.hospitalId),
          phone: receptionForm.phone || undefined,
          email: receptionForm.email || undefined,
        }),
      );
      if (createReceptionist.fulfilled.match(result)) {
        closeReceptionModal();
        setToast({ type: 'success', message: 'Receptionist created successfully.' });
        dispatch(fetchReceptionists());
      } else {
        setReceptionError((result.payload as string) || 'Failed to create receptionist');
      }
    }
  };

  const handleDeleteReception = async () => {
    if (!deleteReceptionTarget) return;
    const result = await dispatch(deleteReceptionist(deleteReceptionTarget.id));
    if (deleteReceptionist.fulfilled.match(result)) {
      setToast({ type: 'success', message: 'Receptionist deleted.' });
    } else {
      const errMsg = (result.payload as string) || 'Failed to delete receptionist';
      setToast({ type: 'error', message: errMsg });
    }
    setDeleteReceptionTarget(null);
  };

  const handleSaveFee = async (hospitalId: number) => {
    const amount = feeInputValue === '' ? null : Number(feeInputValue);
    if (amount !== null && (isNaN(amount) || amount < 0)) {
      setToast({ type: 'error', message: 'Invalid amount' });
      return;
    }
    const result = await dispatch(setServiceFee({ hospitalId, amount }));
    if (setServiceFee.fulfilled.match(result)) {
      setToast({ type: 'success', message: 'Service fee updated.' });
    } else {
      setToast({ type: 'error', message: (result.payload as string) || 'Failed to set service fee' });
    }
    setEditingFeeId(null);
    setFeeInputValue('');
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesStatus = registrationFilter === 'ALL' || reg.status === registrationFilter;
    return matchesStatus;
  });

  const getStatusBadgeStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'PENDING':
        return { backgroundColor: '#FEF3F2', color: '#B42318', border: '1px solid #FECDCA' };
      case 'APPROVED':
        return { backgroundColor: '#ECFDF3', color: '#027A48', border: '1px solid #A7F3D0' };
      case 'REJECTED':
        return { backgroundColor: '#FEF3F2', color: '#B42318', border: '1px solid #FECDCA' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' };
    }
  };

  return (
    <div style={adminPageStyles.page}>
      <AdminPageHeader
        icon={Building2}
        title="Hospitals & Staff"
        subtitle="Manage facilities, visit card fees, reception accounts, and registration requests."
        actions={
          <div style={{ display: 'flex', gap: 12 }}>
            {tab === 'hospitals' ? (
              <button style={adminPageStyles.primaryBtn} onClick={openAddHospital}>
                <Plus size={18} /> Add Hospital
              </button>
            ) : tab === 'receptionists' ? (
              <button style={adminPageStyles.primaryBtn} onClick={openReceptionModal}>
                <Plus size={18} /> Add Receptionist
              </button>
            ) : registrations.filter(r => r.status === 'PENDING').length > 0 ? (
              <span style={{ padding: '11px 22px', borderRadius: '10px', backgroundColor: '#FEF3F2', color: '#B42318', fontWeight: 600, fontSize: '14px' }}>
                {registrations.filter(r => r.status === 'PENDING').length} pending requests
              </span>
            ) : null}
          </div>
        }
      />

      {error && !toast && (
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

      <AdminSubTabs
        tabs={[
          { key: 'hospitals', label: `Hospitals (${hospitals.length})`, icon: <Building2 size={16} /> },
          { key: 'receptionists', label: `Receptionists (${receptionists.length})`, icon: <Users size={16} /> },
          { key: 'registrations', label: `Registrations (${registrations.filter(r => r.status === 'PENDING').length})`, icon: <Clock size={16} /> },
        ]}
        activeKey={tab}
        onChange={(key) => setTab(key as 'hospitals' | 'receptionists' | 'registrations')}
      />

      {tab === 'hospitals' && (
        <div style={styles.grid}>
          {hospitals.map((h) => (
            <div key={h.id} style={styles.card}>
              {h.image ? (
                <img src={h.image} alt={h.name} style={styles.cardImg} />
              ) : (
                <div style={styles.cardImgPlaceholder}>
                  <Building2 size={36} color="#CBD5E1" />
                </div>
              )}
              <div style={styles.cardHeader}>
                <Building2 size={22} color="#3B82F6" />
                <h3 style={styles.cardTitle}>{h.name}</h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" style={styles.iconBtn} onClick={() => openEditHospital(h)} title="Edit">
                    <Edit3 size={16} />
                  </button>
                  <button type="button" style={{ ...styles.iconBtn, color: '#EF4444' }} onClick={() => setDeleteTarget(h)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div style={styles.feeRow}>
                <DollarSign size={14} color="#059669" />
                {editingFeeId === h.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1 }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount or empty to clear"
                      style={{ ...styles.input, padding: '6px 10px', fontSize: 13, flex: 1 }}
                      value={feeInputValue}
                      onChange={(e) => setFeeInputValue(e.target.value)}
                      autoFocus
                    />
                    <button type="button" style={styles.smallBtn} onClick={() => handleSaveFee(h.id)}>Save</button>
                    <button type="button" style={{ ...styles.smallBtn, color: '#64748B', background: 'none', border: '1px solid #E2E8F0' }} onClick={() => { setEditingFeeId(null); setFeeInputValue(''); }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <span style={{ flex: 1 }}>
                      <span style={styles.feeLabel}>Service fee</span>
                      <strong style={styles.feeValue}>{h.serviceFee ? `${formatNum(Number(h.serviceFee))} ETB` : 'Not set'}</strong>
                    </span>
                    <button
                      type="button"
                      style={styles.editFeeBtn}
                      onClick={() => { setEditingFeeId(h.id); setFeeInputValue(h.serviceFee ? String(h.serviceFee) : ''); }}
                      title="Edit service fee"
                    >
                      <Edit3 size={13} /> Edit Fee
                    </button>
                  </>
                )}
              </div>
              {h.address && (
                <p style={styles.meta}>
                  <MapPin size={14} /> {h.address}
                </p>
              )}
              {h.phone && (
                <p style={styles.meta}>
                  <Phone size={14} /> {h.phone}
                </p>
              )}
              {h.latitude != null && h.longitude != null && (
                <p style={styles.meta}>
                  <MapPin size={14} />
                  <a href={`https://www.google.com/maps?q=${h.latitude},${h.longitude}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>
                    View on Google Maps
                  </a>
                </p>
              )}
              <p style={styles.counts}>
                {h._count?.doctors ?? 0} doctors · {h._count?.receptionists ?? 0} reception
              </p>
            </div>
          ))}
          {hospitals.length === 0 && !loading && (
            <p style={styles.empty}>No hospitals yet. Add your first hospital.</p>
          )}
          {pagination.totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                type="button"
                style={{ ...styles.pageBtn, opacity: page <= 1 ? 0.4 : 1 }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                type="button"
                style={{ ...styles.pageBtn, opacity: page >= pagination.totalPages ? 0.4 : 1 }}
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'receptionists' && (
        <div style={styles.grid}>
          {receptionists.map((r) => (
            <div key={r.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.receptionAvatar}>
                  {(r.user.username || 'R').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={styles.cardTitle}>{r.user.username}</h3>
                  <p style={{ fontSize: 12, color: '#64748B' }}>{r.hospital.name}</p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" style={styles.iconBtn} onClick={() => openEditReception(r)} title="Edit">
                    <Edit3 size={16} />
                  </button>
                  <button type="button" style={{ ...styles.iconBtn, color: '#EF4444' }} onClick={() => setDeleteReceptionTarget(r)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {r.user.phone && (
                <p style={styles.meta}><Phone size={14} /> {r.user.phone}</p>
              )}
              {r.user.email && (
                <p style={styles.meta}><Mail size={14} /> {r.user.email}</p>
              )}
            </div>
          ))}
          {receptionists.length === 0 && !loading && (
            <p style={styles.empty}>No receptionists. Create one and assign a hospital.</p>
          )}
        </div>
      )}

      {tab === 'registrations' && (
        <div>
          <div style={styles.regTabs}>
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setRegistrationFilter(f)}
                style={{
                  ...styles.regTabBtn,
                  ...(registrationFilter === f ? styles.regTabBtnActive : {}),
                }}
              >
                {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending' : f === 'APPROVED' ? 'Approved' : 'Rejected'}
                ({f === 'ALL' ? registrations.length : registrations.filter(r => r.status === f).length})
              </button>
            ))}
          </div>

          {registrationsLoading ? (
            <div style={styles.loadingRow}>
              <Loader2 size={32} className="spin" style={{ color: '#0F172A' }} />
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Hospital Name</th>
                    <th style={styles.th}>Admin Phone</th>
                    <th style={styles.th}>Admin Email</th>
                    <th style={styles.th}>Address</th>
                    <th style={styles.th}>Registered</th>
                    <th style={styles.th}>Status</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.hospitalNameWrap}>
                          <div style={styles.iconBg}>
                            <Building2 size={16} color="var(--accent-primary)" />
                          </div>
                          <span style={styles.hospitalName}>{reg.hospital?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.infoWrap}>
                          <Phone size={14} color="#64748B" />
                          <span>{reg.user?.phone || '-'}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.infoWrap}>
                          <Mail size={14} color="#64748B" />
                          <span>{reg.user?.email || '-'}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: '#334155', fontSize: '13px' }}>{reg.hospital?.address || '-'}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.infoWrap}>
                          <Clock size={14} color="#94A3B8" />
                          <span>{formatDate(new Date(reg.createdAt), 'medium')}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.statusBadge, ...getStatusBadgeStyle(reg.status)}}>
                          {reg.status}
                        </span>
                        {reg.rejectionReason && (
                          <div style={{ fontSize: '11px', color: '#B42318', marginTop: '4px' }}>
                            {reg.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        {reg.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              style={styles.approveBtn}
                              onClick={() => handleApproveRegistration(reg.id)}
                              disabled={updatingRegId === reg.id}
                            >
                              {updatingRegId === reg.id ? (
                                <Loader2 size={14} className="spin" />
                              ) : (
                                <>
                                  <CheckCircle2 size={14} />
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              style={styles.rejectBtn}
                              onClick={() => setRejectModal({ id: reg.id, name: reg.hospital?.name || '' })}
                              disabled={updatingRegId === reg.id}
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredRegistrations.length === 0 && (
                <div style={styles.emptyState}>
                  <Building2 size={48} color="#CBD5E1" />
                  <p style={{ color: '#94A3B8', margin: '12px 0 0' }}>No hospital registrations found.</p>
                </div>
              )}
            </div>
          )}

          {rejectModal && (
            <div style={styles.modalOverlay} onClick={() => { setRejectModal(null); setRejectReason(''); }}>
              <div style={styles.modalContentReg} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>
                      Reject Registration
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                      {rejectModal.name}
                    </p>
                  </div>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    onClick={() => { setRejectModal(null); setRejectReason(''); }}
                  >
                    <X size={20} color="#64748B" />
                  </button>
                </div>
                <div style={styles.modalBody}>
                  <label style={styles.label}>Rejection Reason (optional)</label>
                  <textarea
                    style={styles.textarea}
                    placeholder="Enter reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <div style={styles.modalFooter}>
                  <button
                    style={styles.cancelBtnReg}
                    onClick={() => { setRejectModal(null); setRejectReason(''); }}
                  >
                    Cancel
                  </button>
                  <button
                    style={styles.confirmRejectBtn}
                    onClick={handleRejectRegistration}
                    disabled={updatingRegId === rejectModal.id}
                  >
                    {updatingRegId === rejectModal.id ? (
                      <Loader2 size={14} className="spin" />
                    ) : (
                      'Reject Registration'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showHospitalModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: 16 }}>{editingHospital ? 'Edit Hospital' : 'Add Hospital'}</h3>
            <form onSubmit={handleHospitalSubmit} style={styles.form}>
              <input
                placeholder="Hospital name *"
                style={styles.input}
                value={hospitalForm.name}
                onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                required
              />
              <input
                placeholder="Service fee (ETB) *"
                type="number"
                min="0"
                step="0.01"
                style={styles.input}
                value={hospitalForm.serviceFee}
                onChange={(e) => setHospitalForm({ ...hospitalForm, serviceFee: e.target.value })}
                required
              />
              <input
                placeholder="Address"
                style={styles.input}
                value={hospitalForm.address}
                onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={styles.fieldLabel}><Phone size={14} /> Phone (Ethiopia)</label>
                <div style={styles.phoneInputWrapper}>
                  <span style={styles.phonePrefix}>+251</span>
                  <input
                    placeholder="XX XXX XXXX"
                    type="tel"
                    style={styles.phoneInput}
                    value={hospitalForm.phone.replace('+251', '')}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={styles.fieldLabel}><Mail size={14} /> Email</label>
                <input
                  placeholder="hospital@example.com"
                  type="email"
                  style={styles.input}
                  value={hospitalForm.email}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                />
              </div>
              <label style={{ ...styles.fieldLabel, marginTop: 4 }}><MapPin size={14} /> Location</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={styles.coordBadge}>Latitude</span>
                  <input
                    type="number"
                    step="any"
                    style={styles.input}
                    value={hospitalForm.latitude}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, latitude: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={styles.coordBadge}>Longitude</span>
                  <input
                    type="number"
                    step="any"
                    style={styles.input}
                    value={hospitalForm.longitude}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, longitude: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={styles.coordBadge}>Lat: {Number(hospitalForm.latitude).toFixed(4)}</span>
                <span style={styles.coordBadge}>Lng: {Number(hospitalForm.longitude).toFixed(4)}</span>
              </div>
              <div>
                <label style={styles.fileLabel}>
                  <ImageIcon size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Hospital Photo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setImagePreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.uploadBtn}>
                    {imagePreview ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {imagePreview && (
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} style={styles.removeBtn}>
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" style={styles.previewImg} />
                )}
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowHospitalModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.confirmBtn} disabled={loading}>
                  {loading ? <Loader2 size={18} className="spin" /> : null}
                  {editingHospital ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, width: 400 }}>
            <h3 style={{ marginBottom: 16 }}>Delete Hospital</h3>
            <p style={{ fontSize: 14, color: '#475569', marginBottom: 24 }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button type="button" onClick={() => setDeleteTarget(null)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button type="button" onClick={handleDeleteHospital} style={{ ...styles.confirmBtn, backgroundColor: '#EF4444' }} disabled={loading}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceptionModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: 16 }}>{editingReception ? 'Edit Receptionist' : 'Add Receptionist'}</h3>
            <form onSubmit={handleReceptionSubmit} style={styles.form}>
              <input
                placeholder="Username *"
                style={styles.input}
                value={receptionForm.username}
                onChange={(e) => setReceptionForm({ ...receptionForm, username: e.target.value })}
                required
              />
              <input
                placeholder={editingReception ? 'New password (leave blank to keep)' : 'Password (min 8) *'}
                type="password"
                style={styles.input}
                value={receptionForm.password}
                onChange={(e) => setReceptionForm({ ...receptionForm, password: e.target.value })}
                minLength={8}
                required={!editingReception}
              />
              <select
                style={styles.input}
                value={receptionForm.hospitalId}
                onChange={(e) => setReceptionForm({ ...receptionForm, hospitalId: e.target.value })}
                required
              >
                <option value="">Select hospital *</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} (Service fee: {h.serviceFee ? `${formatNum(Number(h.serviceFee))} ETB` : 'Not set'})
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={styles.fieldLabel}><Phone size={14} /> Phone (Ethiopia)</label>
                <div style={styles.phoneInputWrapper}>
                  <span style={styles.phonePrefix}>+251</span>
                  <input
                    placeholder="XX XXX XXXX"
                    type="tel"
                    style={styles.phoneInput}
                    value={receptionForm.phone.replace('+251', '')}
                    onChange={(e) => handleReceptionPhoneChange(e.target.value)}
                  />
                </div>
              </div>
              <input
                placeholder="Email (optional)"
                type="email"
                style={styles.input}
                value={receptionForm.email}
                onChange={(e) => setReceptionForm({ ...receptionForm, email: e.target.value })}
              />
              {receptionError && (
                <div style={styles.inlineError}>{receptionError}</div>
              )}
              <div style={styles.modalActions}>
                <button type="button" onClick={closeReceptionModal} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.confirmBtn} disabled={loading}>
                  {editingReception ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteReceptionTarget && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, width: 400 }}>
            <h3 style={{ marginBottom: 16 }}>Delete Receptionist</h3>
            <p style={{ fontSize: 14, color: '#475569', marginBottom: 24 }}>
              Are you sure you want to delete <strong>{deleteReceptionTarget.user.username}</strong>? This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button type="button" onClick={() => setDeleteReceptionTarget(null)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button type="button" onClick={handleDeleteReception} style={{ ...styles.confirmBtn, backgroundColor: '#EF4444' }} disabled={loading}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const theme = { primary: '#0F172A', border: '#E2E8F0' };

const styles: Record<string, React.CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: {
    padding: '20px 24px',
    borderRadius: '14px',
    border: `1px solid ${theme.border}`,
    background: '#FFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.2s',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: 600, margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, borderRadius: 6 },
  meta: { fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0', lineHeight: 1.5 },
  feeRow: { fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 6px', lineHeight: 1.5, padding: '10px 12px', backgroundColor: '#F0FDF4', borderRadius: 10, border: '1px solid #DCFCE7' },
  feeLabel: { display: 'block', fontSize: 11, fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.4 },
  feeValue: { display: 'block', fontSize: 16, fontWeight: 700, color: '#065F46', marginTop: 2 },
  editFeeBtn: { background: 'none', border: '1.5px solid #059669', borderRadius: 8, cursor: 'pointer', color: '#059669', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' },
  smallBtn: { padding: '4px 10px', borderRadius: 6, background: '#059669', color: '#FFF', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 12 },
  counts: { fontSize: 12, color: '#94A3B8', marginTop: 12 },
  receptionAvatar: {
    width: 40, height: 40, borderRadius: 10,
    background: '#3B82F6', color: '#FFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16, flexShrink: 0,
  },
  empty: { padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '24px 0' },
  pageBtn: { padding: '8px 16px', borderRadius: 8, border: `1px solid ${theme.border}`, background: '#FFF', cursor: 'pointer', fontWeight: 500, fontSize: 14 },
  pageInfo: { fontSize: 14, color: '#64748B' },
  cardImg: { width: 'calc(100% + 48px)', height: 140, objectFit: 'cover', borderTopLeftRadius: '14px', borderTopRightRadius: '14px', marginBottom: 12, marginTop: -20, marginLeft: -24, marginRight: -24, background: '#F1F5F9' },
  cardImgPlaceholder: { width: 'calc(100% + 48px)', height: 140, borderTopLeftRadius: '14px', borderTopRightRadius: '14px', marginBottom: 12, marginTop: -20, marginLeft: -24, marginRight: -24, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' },
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
  fileLabel: { fontSize: 13, fontWeight: 600, color: theme.primary, marginBottom: 4, display: 'block' },
  uploadBtn: { padding: '10px 16px', borderRadius: 10, border: `1px solid ${theme.border}`, background: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  removeBtn: { padding: '10px 16px', borderRadius: 10, border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#B42318', display: 'flex', alignItems: 'center', gap: 4 },
  previewImg: { width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, marginTop: 8 },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.5)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 0',
    overflowY: 'auto',
    zIndex: 1000,
  },
  modalContent: { background: '#FFF', width: 520, maxWidth: '95vw', padding: 32, borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  fieldLabel: { fontSize: 13, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 },
  input: { padding: '12px 16px', borderRadius: 10, border: `1px solid ${theme.border}`, fontSize: 15, outline: 'none', backgroundColor: '#F8FAFC', boxSizing: 'border-box' as const },
  phoneInputWrapper: { display: 'flex', alignItems: 'center', border: `1px solid ${theme.border}`, borderRadius: 10, overflow: 'hidden' },
  phonePrefix: { padding: '0 14px', fontSize: 14, fontWeight: 600, color: '#334155', background: '#F1F5F9', display: 'flex', alignItems: 'center', borderRight: `1px solid ${theme.border}`, height: 44 },
  phoneInput: { flex: 1, height: 44, border: 'none', padding: '0 12px', fontSize: 15, outline: 'none', backgroundColor: '#F8FAFC' },
  coordBadge: { fontSize: 12, fontWeight: 500, color: '#475569', background: '#F8FAFC', padding: '4px 10px', borderRadius: 6, border: `1px solid ${theme.border}` },
  inlineError: { background: '#FEF3F2', color: '#B42318', padding: '10px 14px', borderRadius: 10, fontSize: 13, border: '1px solid #FECDCA' },
  modalActions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 },
  cancelBtn: { padding: '10px 22px', borderRadius: 10, border: `1px solid ${theme.border}`, background: '#FFF', color: '#64748B', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },
  confirmBtn: { background: theme.primary, color: '#FFF', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' },
  loadingRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' },
  tableWrap: { borderRadius: '14px', border: `1px solid ${theme.border}`, overflow: 'auto', background: '#FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  thRow: { backgroundColor: '#FAFAFA', borderBottom: `1px solid ${theme.border}` },
  th: { padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', whiteSpace: 'nowrap' as const },
  tr: { borderBottom: '1px solid #F2F4F7' },
  td: { padding: '20px 24px', fontSize: '14px', color: '#0F172A' },
  hospitalNameWrap: { display: 'flex', alignItems: 'center', gap: '12px' },
  iconBg: { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  hospitalName: { fontWeight: 600, fontSize: '15px' },
  infoWrap: { display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' },
  statusBadge: { display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '100px', textTransform: 'uppercase' },
  approveBtn: {
    backgroundColor: '#027A48', color: '#FFF', border: 'none', borderRadius: '8px',
    padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
  },
  rejectBtn: {
    backgroundColor: '#FFF', color: '#B42318', border: '1px solid #FECDCA', borderRadius: '8px',
    padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
  },
  emptyState: { padding: '60px', textAlign: 'center' },
  regTabs: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  regTabBtn: { padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1px solid #E2E8F0', backgroundColor: '#FFF', color: '#475569' },
  regTabBtnActive: { borderColor: 'var(--accent-primary)', backgroundColor: 'var(--accent-bg)', color: 'var(--accent-primary)' },
  modalContentReg: {
    backgroundColor: '#FFF', borderRadius: '16px', width: '90%', maxWidth: '440px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '24px 24px 0',
  },
  modalBody: { padding: '20px 24px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '0 24px 24px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
  textarea: {
    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0',
    fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  cancelBtnReg: {
    backgroundColor: '#FFF', color: '#374151', border: '1px solid #E2E8F0', borderRadius: '8px',
    padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  },
  confirmRejectBtn: {
    backgroundColor: '#B42318', color: '#FFF', border: 'none', borderRadius: '8px',
    padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px',
  },
};