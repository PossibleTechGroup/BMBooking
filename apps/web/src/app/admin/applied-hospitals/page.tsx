'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import {
  Building2,
  Search,
  Calendar,
  Phone,
  User,
  Loader2,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/ethiopianDate';
import { adminPageStyles } from '@/lib/adminStyles';
import { AdminPageHeader } from '@/components/admin/page-header';
import { AdminSubTabs } from '@/components/admin/subtabs';

interface HospitalApplication {
  id: number;
  hospitalName: string;
  contactPerson: string;
  contactInfo: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  rejectionReason: string | null;
}

interface HospitalRegistration {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  rejectionReason: string | null;
  hospital: {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  user: {
    id: number;
    phone: string | null;
    email: string | null;
  };
}

const theme = { primary: '#0F172A', border: '#E2E8F0' };

export default function AdminAppliedHospitalsPage() {
  const [applications, setApplications] = useState<HospitalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/hospital-registrations');
      const data: HospitalRegistration[] = response.data.data || [];
      setApplications(
        data.map((r) => ({
          id: r.id,
          hospitalName: r.hospital?.name ?? 'Unknown hospital',
          contactPerson: r.user?.phone ?? r.user?.email ?? '-',
          contactInfo: r.hospital?.address ?? r.hospital?.phone ?? '-',
          status: r.status,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          rejectionReason: r.rejectionReason,
        }))
      );
    } catch (error) {
      console.error('Failed to fetch hospital registrations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/hospital-registrations/${id}`, { status: 'APPROVED' });
      await fetchApplications();
    } catch (error) {
      console.error('Failed to approve registration', error);
      alert('Failed to approve registration');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return;
    setUpdatingId(id);
    try {
      await api.patch(`/admin/hospital-registrations/${id}`, {
        status: 'REJECTED',
        rejectionReason: reason.trim() || null,
      });
      await fetchApplications();
    } catch (error) {
      console.error('Failed to reject registration', error);
      alert('Failed to reject registration');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.contactInfo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filter === 'ALL' || app.status === filter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'PENDING':
        return { backgroundColor: '#FEF3F2', color: '#B42318', border: '1px solid #FECDCA' };
      case 'APPROVED':
        return { backgroundColor: '#ECFDF3', color: '#027A48', border: '1px solid #A7F3D0' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' };
    }
  };

  return (
    <div style={adminPageStyles.page}>
      <AdminPageHeader
        icon={Building2}
        title="Applied Hospitals"
        subtitle="Manage and track simplified onboarding requests from new hospitals."
        actions={
          <div style={adminPageStyles.searchWrap}>
            <Search size={18} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search hospital or contact..."
              style={adminPageStyles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        }
      />

      <AdminSubTabs
        tabs={[
          { key: 'ALL', label: `All (${applications.length})`, icon: <Building2 size={16} /> },
          { key: 'PENDING', label: `Pending (${applications.filter((a) => a.status === 'PENDING').length})`, icon: <Clock size={16} /> },
          { key: 'APPROVED', label: `Approved (${applications.filter((a) => a.status === 'APPROVED').length})`, icon: <CheckCircle size={16} /> },
          { key: 'REJECTED', label: `Rejected (${applications.filter((a) => a.status === 'REJECTED').length})`, icon: <Phone size={16} /> },
        ]}
        activeKey={filter}
        onChange={(key) => setFilter(key as typeof filter)}
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
                <th style={s.th}>Contact Person</th>
                <th style={s.th}>Contact Info</th>
                <th style={s.th}>Applied Date</th>
                <th style={s.th}>Status</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => (
                <tr key={app.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.hospitalNameWrap}>
                      <div style={s.iconBg}>
                        <Building2 size={16} color="var(--accent-primary)" />
                      </div>
                      <span style={s.hospitalName}>{app.hospitalName}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={s.infoWrap}>
                      <User size={14} color="#64748B" />
                      <span>{app.contactPerson}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={s.infoWrap}>
                      <Phone size={14} color="#64748B" />
                      <span>{app.contactInfo}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={s.infoWrap}>
                      <Calendar size={14} color="#94A3B8" />
                      <span>{formatDate(new Date(app.createdAt), 'medium')}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.statusBadge, ...getStatusBadgeStyle(app.status) }}>
                      {app.status}
                    </span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <div style={s.actionsWrap}>
                      {app.status === 'PENDING' && (
                        <>
                          <button
                            style={{ ...s.markBtn, backgroundColor: '#059669' }}
                            onClick={() => handleApprove(app.id)}
                            disabled={updatingId === app.id}
                          >
                            {updatingId === app.id ? <Loader2 size={14} className="spin" /> : 'Approve'}
                          </button>
                          <button
                            style={{ ...s.rejectBtn }}
                            onClick={() => handleReject(app.id)}
                            disabled={updatingId === app.id}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {app.status === 'REJECTED' && app.rejectionReason && (
                        <span style={{ color: '#94A3B8', fontSize: '12px' }}>
                          {app.rejectionReason}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredApplications.length === 0 && (
            <div style={s.emptyState}>
              <Building2 size={48} color="#CBD5E1" />
              <p style={{ color: '#94A3B8', margin: '12px 0 0' }}>No hospital applications found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  loadingRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' },
  tableWrap: { borderRadius: '14px', border: `1px solid ${theme.border}`, overflow: 'hidden', background: '#FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
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
  markBtn: {
    backgroundColor: 'var(--accent-primary)',
    color: '#FFF',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  rejectBtn: {
    backgroundColor: '#FFF',
    color: '#B42318',
    border: '1px solid #FECDCA',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  actionsWrap: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' },
  emptyState: { padding: '60px', textAlign: 'center' },
};