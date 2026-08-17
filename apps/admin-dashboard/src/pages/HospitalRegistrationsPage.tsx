import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  Building2,
  Search,
  Calendar,
  Phone,
  Mail,
  User,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { formatDate } from '../utils/ethiopianDate';
import { adminPageStyles } from '../styles/adminPageStyles';
import { PageHeader } from '../components/PageHeader';
import { SubTabs } from '../components/SubTabs';

interface HospitalRegistration {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  hospital: { id: number; name: string; address: string | null; phone: string | null; email: string | null };
  user: { id: number; phone: string | null; email: string | null };
}

const theme = { primary: '#0F172A', border: '#E2E8F0' };

export const HospitalRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<HospitalRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await client.get('/admin/hospital-registrations');
      setRegistrations(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch hospital registrations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setUpdatingId(id);
    try {
      await client.patch(`/admin/hospital-registrations/${id}`, { status: 'APPROVED' });
      await fetchRegistrations();
    } catch (err) {
      console.error('Failed to approve registration', err);
      alert('Failed to approve registration');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setUpdatingId(rejectModal.id);
    try {
      await client.patch(`/admin/hospital-registrations/${rejectModal.id}`, {
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
      setUpdatingId(null);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const hospitalName = reg.hospital?.name || '';
    const phone = reg.user?.phone || '';
    const email = reg.user?.email || '';
    const matchesSearch =
      hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filter === 'ALL' || reg.status === filter;
    return matchesSearch && matchesStatus;
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
      <PageHeader
        icon={Building2}
        title="Hospital Registrations"
        subtitle="Review and approve hospital portal registrations."
        actions={
          <div style={adminPageStyles.searchWrap}>
            <Search size={18} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search hospital, phone, or email..."
              style={adminPageStyles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        }
      />

      <SubTabs
        tabs={[
          { key: 'ALL', label: `All (${registrations.length})`, icon: <Building2 size={16} /> },
          { key: 'PENDING', label: `Pending (${registrations.filter(r => r.status === 'PENDING').length})`, icon: <Clock size={16} /> },
          { key: 'APPROVED', label: `Approved (${registrations.filter(r => r.status === 'APPROVED').length})`, icon: <CheckCircle size={16} /> },
          { key: 'REJECTED', label: `Rejected (${registrations.filter(r => r.status === 'REJECTED').length})`, icon: <XCircle size={16} /> },
        ]}
        activeKey={filter}
        onChange={(key) => setFilter(key as any)}
      />

      {loading ? (
        <div style={s.loadingRow}>
          <Loader2 size={32} className="spin" style={{ color: '#0F172A' }} />
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thRow}>
                <th style={s.th}>Hospital Name</th>
                <th style={s.th}>Admin Phone</th>
                <th style={s.th}>Admin Email</th>
                <th style={s.th}>Address</th>
                <th style={s.th}>Registered</th>
                <th style={s.th}>Status</th>
                <th style={{...s.th, textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.hospitalNameWrap}>
                      <div style={s.iconBg}>
                        <Building2 size={16} color="var(--accent-primary)" />
                      </div>
                      <span style={s.hospitalName}>{reg.hospital?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={s.infoWrap}>
                      <Phone size={14} color="#64748B" />
                      <span>{reg.user?.phone || '-'}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={s.infoWrap}>
                      <Mail size={14} color="#64748B" />
                      <span>{reg.user?.email || '-'}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{ color: '#334155', fontSize: '13px' }}>{reg.hospital?.address || '-'}</span>
                  </td>
                  <td style={s.td}>
                    <div style={s.infoWrap}>
                      <Calendar size={14} color="#94A3B8" />
                      <span>{formatDate(new Date(reg.createdAt), 'medium')}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{...s.statusBadge, ...getStatusBadgeStyle(reg.status)}}>
                      {reg.status}
                    </span>
                    {reg.rejectionReason && (
                      <div style={{ fontSize: '11px', color: '#B42318', marginTop: '4px' }}>
                        {reg.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td style={{...s.td, textAlign: 'right'}}>
                    {reg.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          style={s.approveBtn}
                          onClick={() => handleApprove(reg.id)}
                          disabled={updatingId === reg.id}
                        >
                          {updatingId === reg.id ? (
                            <Loader2 size={14} className="spin" />
                          ) : (
                            <>
                              <CheckCircle size={14} />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          style={s.rejectBtn}
                          onClick={() => setRejectModal({ id: reg.id, name: reg.hospital?.name || '' })}
                          disabled={updatingId === reg.id}
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
            <div style={s.emptyState}>
              <Building2 size={48} color="#CBD5E1" />
              <p style={{ color: '#94A3B8', margin: '12px 0 0' }}>No hospital registrations found.</p>
            </div>
          )}
        </div>
      )}

      {rejectModal && (
        <div style={s.modalOverlay} onClick={() => { setRejectModal(null); setRejectReason(''); }}>
          <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
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
            <div style={s.modalBody}>
              <label style={s.label}>Rejection Reason (optional)</label>
              <textarea
                style={s.textarea}
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <div style={s.modalFooter}>
              <button
                style={s.cancelBtn}
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
              >
                Cancel
              </button>
              <button
                style={s.confirmRejectBtn}
                onClick={handleReject}
                disabled={updatingId === rejectModal.id}
              >
                {updatingId === rejectModal.id ? (
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
  );
};

const s: Record<string, React.CSSProperties> = {
  loadingRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' },
  tableWrap: { borderRadius: '14px', border: `1px solid ${theme.border}`, overflow: 'auto', background: '#FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#FAFAFA', borderBottom: `1px solid ${theme.border}` },
  th: { padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' },
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
  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modalContent: {
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
  cancelBtn: {
    backgroundColor: '#FFF', color: '#374151', border: '1px solid #E2E8F0', borderRadius: '8px',
    padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  },
  confirmRejectBtn: {
    backgroundColor: '#B42318', color: '#FFF', border: 'none', borderRadius: '8px',
    padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px',
  },
};

export default HospitalRegistrationsPage;
