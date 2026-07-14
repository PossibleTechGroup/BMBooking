import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  Building2, 
  Search, 
  Calendar, 
  Phone,
  User,
  Loader2,
  CheckCircle,
  Clock,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/ethiopianDate';
import { adminPageStyles } from '../styles/adminPageStyles';
import { PageHeader } from '../components/PageHeader';
import { SubTabs } from '../components/SubTabs';

interface HospitalApplication {
  id: string;
  hospitalName: string;
  contactPerson: string;
  contactInfo: string;
  status: 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  contactedAt: string | null;
  notes: string | null;
}

const theme = { primary: '#0F172A', border: '#E2E8F0' };

export const AppliedHospitalsPage: React.FC = () => {
  const [applications, setApplications] = useState<HospitalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await client.get('/admin/hospital-applications');
      setApplications(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch hospital applications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkContacted = async (id: string) => {
    setUpdatingId(id);
    try {
      await client.patch(`/admin/hospital-applications/${id}`, {
        status: 'CONTACTED'
      });
      // Refresh local list
      await fetchApplications();
    } catch (err) {
      console.error('Failed to mark as contacted', err);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter and search applications
  const filteredApplications = applications.filter(app => {
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
      case 'CONTACTED':
        return { backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' };
      case 'APPROVED':
        return { backgroundColor: '#ECFDF3', color: '#027A48', border: '1px solid #A7F3D0' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' };
    }
  };

  return (
    <div style={adminPageStyles.page}>
      <PageHeader
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

      <SubTabs
        tabs={[
          { key: 'ALL', label: `All (${applications.length})`, icon: <Building2 size={16} /> },
          { key: 'PENDING', label: `Pending (${applications.filter(a => a.status === 'PENDING').length})`, icon: <Clock size={16} /> },
          { key: 'CONTACTED', label: `Contacted (${applications.filter(a => a.status === 'CONTACTED').length})`, icon: <Phone size={16} /> },
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
                <th style={s.th}>Contact Person</th>
                <th style={s.th}>Contact Info</th>
                <th style={s.th}>Applied Date</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Contacted Date</th>
                <th style={{...s.th, textAlign: 'right'}}>Actions</th>
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
                    <span style={{...s.statusBadge, ...getStatusBadgeStyle(app.status)}}>
                      {app.status}
                    </span>
                  </td>
                  <td style={s.td}>
                    {app.contactedAt ? (
                      <div style={s.infoWrap}>
                        <CheckCircle size={14} color="#10B981" />
                        <span>{formatDate(new Date(app.contactedAt), 'medium')}</span>
                      </div>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: '13px' }}>-</span>
                    )}
                  </td>
                  <td style={{...s.td, textAlign: 'right'}}>
                    {app.status === 'PENDING' && (
                      <button 
                        style={s.markBtn} 
                        onClick={() => handleMarkContacted(app.id)}
                        disabled={updatingId === app.id}
                      >
                        {updatingId === app.id ? (
                          <Loader2 size={14} className="spin" />
                        ) : (
                          'Mark Contacted'
                        )}
                      </button>
                    )}
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
};

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
  emptyState: { padding: '60px', textAlign: 'center' }
};

export default AppliedHospitalsPage;
