import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  Users, 
  Search, 
  Calendar, 
  Phone,
  ChevronRight,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
  Loader2,
  X,
  Clock,
  Stethoscope,
  Wrench,
  CheckCircle,
  XCircle,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/ethiopianDate';
import { adminPageStyles } from '../styles/adminPageStyles';
import { PageHeader } from '../components/PageHeader';

interface Patient {
  id: number;
  fullName: string;
  gender: string;
  bloodType: string;
  user: {
    phone: string;
    createdAt: string;
  }
}

const theme = { primary: '#0F172A', border: '#E2E8F0' };

const PatientsPage: React.FC<{ initialFilter?: 'all' | 'active' | 'inactive'; onBack?: () => void }> = ({ initialFilter = 'all', onBack }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState(initialFilter);
  const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    setFilter(initialFilter);
    setPage(1);
  }, [initialFilter]);

  useEffect(() => {
    fetchPatients(page, filter);
  }, [page, filter]);

  const fetchPatients = async (p: number, statusFilter: string) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: p, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await client.get('/admin/patients', {
        params,
      });
      setPatients(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotal(response.data.pagination.total);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (patient: Patient) => {
    setHistoryPatient(patient);
    setHistoryLoading(true);
    try {
      const res = await client.get(`/admin/patients/${patient.id}/history`);
      setHistoryData(res.data.data);
    } catch {
      setHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user.phone.includes(searchQuery)
  );

  return (
    <div style={adminPageStyles.page}>
      {onBack && (
        <button onClick={onBack} style={adminPageStyles.backBtn}>
          <ChevronLeft size={18} /> Back to Analysis
        </button>
      )}
      <PageHeader
        icon={Users}
        title="Patient Directory"
        subtitle="Manage and view all registered patients on the platform."
        actions={
          <div style={adminPageStyles.searchWrap}>
            <Search size={18} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              style={adminPageStyles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        }
      />

      {filter !== 'all' && (
        <div style={s.filterBar}>
          <span style={s.filterLabel}>
            Showing <strong>{filter === 'active' ? 'Active' : 'Inactive'}</strong> patients
            (with {filter === 'active' ? 'at least one' : 'no'} appointment history)
          </span>
          <button
            style={s.clearFilterBtn}
            onClick={() => setFilter('all')}
          >
            Clear filter
          </button>
        </div>
      )}

      {loading ? (
        <div style={s.loadingRow}>
          <Loader2 size={32} className="spin" style={{ color: '#0F172A' }} />
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thRow}>
                <th style={s.th}>Patient Name</th>
                <th style={s.th}>Contact</th>
                <th style={s.th}>Demographics</th>
                <th style={s.th}>Joined Date</th>
                <th style={{...s.th, textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.patientInfo}>
                      <div style={s.avatar}>
                        {patient.fullName?.[0] || '?'}
                      </div>
                      <div>
                        <div style={s.patientName}>{patient.fullName || 'Unnamed Patient'}</div>
                        <div style={s.patientId}>ID: #{patient.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={s.contactInfo}>
                      <Phone size={14} color="#64748B" />
                      {patient.user.phone}
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={s.genderBadge}>{patient.gender || 'N/A'}</span>
                      {patient.bloodType && (
                        <span style={s.bloodBadge}>{patient.bloodType}</span>
                      )}
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={s.dateInfo}>
                      <Calendar size={14} color="#94A3B8" />
                      {formatDate(new Date(patient.user.createdAt), 'medium')}
                    </div>
                  </td>
                  <td style={{...s.td, textAlign: 'right'}}>
                    <button style={s.viewBtn} onClick={() => fetchHistory(patient)}>
                      View History <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPatients.length === 0 && (
            <div style={s.emptyState}>
              <Users size={48} color="#CBD5E1" />
              <p style={{ color: '#94A3B8', margin: '12px 0 0' }}>No patients found matching your search.</p>
            </div>
          )}

          <div style={s.pagination}>
            <span style={s.pageInfo}>
              {total > 0 ? `${total} patient${total !== 1 ? 's' : ''} total` : 'No patients'}
            </span>
            <div style={s.pageBtns}>
              <button style={s.pageBtn} disabled={page <= 1} onClick={() => setPage(1)} title="First page">
                <ChevronFirst size={16} />
              </button>
              <button style={s.pageBtn} disabled={page <= 1} onClick={() => setPage(page - 1)} title="Previous">
                <ChevronLeft size={16} />
              </button>
              <span style={s.pageNum}>Page {page} of {Math.max(1, totalPages)}</span>
              <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(page + 1)} title="Next">
                <ChevronRight size={16} />
              </button>
              <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(totalPages)} title="Last page">
                <ChevronLast size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {historyPatient && (
        <div style={s.overlay} onClick={() => { setHistoryPatient(null); setHistoryData(null); }}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitle}>{historyPatient.fullName || 'Unnamed Patient'}</h3>
                <p style={s.modalSub}>ID: #{historyPatient.id} &middot; {historyPatient.user.phone}</p>
              </div>
              <button style={s.modalClose} onClick={() => { setHistoryPatient(null); setHistoryData(null); }}><X size={20} /></button>
            </div>

            {historyLoading ? (
              <div style={s.loadingRow}><Loader2 size={28} className="spin" style={{ color: '#0F172A' }} /></div>
            ) : historyData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h4 style={s.sectionTitle}><Stethoscope size={16} /> Appointments ({historyData.appointments.length})</h4>
                  {historyData.appointments.length === 0 ? (
                    <p style={s.emptyText}>No appointments.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {historyData.appointments.map((a: any) => (
                        <div key={a.id} style={s.historyRow}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{a.doctor?.fullName || 'N/A'}</span>
                            <span style={{ fontSize: '12px', color: '#64748B' }}>{a.doctor?.specialization || ''}</span>
                          </div>
                          <span style={s.dateBadge}>{formatDateTime(new Date(a.dateTime))}</span>
                          {a.status === 'completed' ? <CheckCircle size={14} color="#10B981" /> :
                           a.status === 'accepted' ? <CheckCircle size={14} color="#3B82F6" /> :
                           a.status === 'cancelled' ? <Ban size={14} color="#EF4444" /> :
                           a.status === 'declined' ? <XCircle size={14} color="#EF4444" /> :
                           <Clock size={14} color="#F59E0B" />}
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'capitalize' }}>{a.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 style={s.sectionTitle}><Wrench size={16} /> Equipment Bookings ({historyData.equipmentBookings.length})</h4>
                  {historyData.equipmentBookings.length === 0 ? (
                    <p style={s.emptyText}>No equipment bookings.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {historyData.equipmentBookings.map((b: any) => (
                        <div key={b.id} style={s.historyRow}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{b.equipment?.name || 'N/A'}</span>
                            <span style={{ fontSize: '12px', color: '#64748B' }}>{b.hospital?.name || ''}</span>
                          </div>
                          <span style={s.dateBadge}>{formatDateTime(new Date(b.dateTime))}</span>
                          {b.status === 'completed' ? <CheckCircle size={14} color="#10B981" /> :
                           b.status === 'confirmed' ? <CheckCircle size={14} color="#3B82F6" /> :
                           b.status === 'cancelled' ? <Ban size={14} color="#EF4444" /> :
                           b.status === 'declined' ? <XCircle size={14} color="#EF4444" /> :
                           <Clock size={14} color="#F59E0B" />}
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'capitalize' }}>{b.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p style={s.emptyText}>Failed to load history.</p>
            )}
          </div>
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
  td: { padding: '20px 24px' },
  patientInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F0F4F8', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 },
  patientName: { fontSize: '15px', fontWeight: 600, color: '#0F172A' },
  patientId: { fontSize: '12px', color: '#64748B', marginTop: 2 },
  contactInfo: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#0F172A' },
  genderBadge: { fontSize: '11px', fontWeight: 700, padding: '4px 10px', backgroundColor: '#F2F4F7', color: '#344054', borderRadius: '6px', textTransform: 'uppercase' },
  bloodBadge: { fontSize: '11px', fontWeight: 700, padding: '4px 10px', backgroundColor: '#FEF3F2', color: '#B42318', borderRadius: '6px', textTransform: 'uppercase' },
  dateInfo: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B' },
  viewBtn: { backgroundColor: 'transparent', color: '#3B82F6', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px' },
  emptyState: { padding: '60px', textAlign: 'center' },
  pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: `1px solid ${theme.border}`, backgroundColor: '#FAFAFA' },
  pageInfo: { fontSize: '14px', color: '#64748B' },
  pageBtns: { display: 'flex', alignItems: 'center', gap: '8px' },
  pageBtn: { padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#0F172A', fontSize: '14px', opacity: 1 },
  pageNum: { fontSize: '14px', color: '#0F172A', fontWeight: 600, padding: '0 8px' },
  filterBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 16px', marginBottom: '16px',
    backgroundColor: '#F0F4FF', border: '1px solid #CBD5E1', borderRadius: '10px',
  },
  filterLabel: { fontSize: '14px', color: '#1E293B' },
  clearFilterBtn: {
    padding: '4px 12px', fontSize: '12px', fontWeight: 600,
    border: '1px solid #CBD5E1', borderRadius: '6px',
    background: '#FFF', color: '#475569', cursor: 'pointer',
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
  },
  modal: {
    background: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '640px',
    maxHeight: '80vh', overflowY: 'auto', padding: '28px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: 700, color: '#0F172A' },
  modalSub: { margin: '4px 0 0', fontSize: '14px', color: '#64748B' },
  modalClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px', borderRadius: '8px' },
  sectionTitle: { margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' },
  emptyText: { fontSize: '14px', color: '#94A3B8', padding: '12px 0' },
  historyRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 14px', backgroundColor: '#FAFAFA', borderRadius: '10px',
    border: '1px solid #F2F4F7',
  },
  dateBadge: { fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap' },
};

export default PatientsPage;
