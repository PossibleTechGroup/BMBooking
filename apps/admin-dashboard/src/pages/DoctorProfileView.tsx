import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Star, 
  Calendar, 
  MessageSquare, 
  Phone, 
  Mail, 
  Clock, 
  DollarSign, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Activity,
  Award
} from 'lucide-react';
import { formatDate } from '../utils/ethiopianDate';
import { adminPageStyles } from '../styles/adminPageStyles';
import { SubTabs } from '../components/SubTabs';

interface DoctorDetail {
  id: number;
  fullName: string;
  specialization: string;
  experienceYears: number;
  licenseNumber: string | null;
  bio: string;
  rating: number;
  totalReviews: number;
  status: string;
  user: {
    phone: string;
    email: string;
    createdAt: string;
  };
  reviews: any[];
  appointments: any[];
}

export const DoctorProfileView = ({
  doctorId,
  onBack,
  backLabel = 'Back to Directory',
}: {
  doctorId: number;
  onBack: () => void;
  backLabel?: string;
}) => {
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'reviews' | 'appointments'>('overview');

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`/api/admin/doctors/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctor(response.data.data);
    } catch (err) {
      console.error('Failed to fetch doctor details', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Generating profile analysis...</div>;
  if (!doctor) return <div style={styles.empty}>Physician data not found.</div>;

  const profileTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'reviews', label: 'Reviews & Ratings' },
    { key: 'appointments', label: 'Appointment History' },
  ];

  return (
    <div style={adminPageStyles.page}>
      <button onClick={onBack} style={adminPageStyles.backBtn}>
        <ArrowLeft size={18} /> {backLabel}
      </button>

      <div style={styles.profileHeader}>
        <div style={styles.headerTop}>
          <div style={styles.avatarLarge}>
            {doctor.fullName[0]}
          </div>
          <div style={styles.headerInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={styles.name}>{doctor.fullName}</h1>
              <span style={{...styles.statusBadge, backgroundColor: doctor.status === 'Approved' ? '#ECFDF5' : '#FEF3F2', color: doctor.status === 'Approved' ? '#059669' : '#DC2626'}}>
                {doctor.status}
              </span>
            </div>
            <p style={styles.spec}>{doctor.specialization} • {doctor.experienceYears} Years Exp</p>
            <div style={styles.metrics}>
              <div style={styles.metricItem}>
                <Star size={16} fill="#F59E0B" color="#F59E0B" />
                <span style={styles.metricVal}>{doctor.rating.toFixed(1)}</span>
                <span style={styles.metricLabel}>({doctor.totalReviews} Reviews)</span>
              </div>
              <div style={styles.metricItem}>
                <Calendar size={16} color="#3B82F6" />
                <span style={styles.metricVal}>{doctor.appointments.length}</span>
                <span style={styles.metricLabel}>Total Bookings</span>
              </div>
            </div>
          </div>
        </div>

        <SubTabs
          tabs={profileTabs}
          activeKey={tab}
          onChange={(key) => setTab(key as typeof tab)}
        />
      </div>

      <div style={styles.content}>
        {tab === 'overview' && (
          <div style={styles.overviewGrid}>
            <div className="paper-card" style={styles.card}>
              <h3 style={styles.cardTitle}><Activity size={18} /> Biography</h3>
              <p style={styles.bio}>{doctor.bio}</p>
            </div>
            <div className="paper-card" style={styles.card}>
              <h3 style={styles.cardTitle}><Award size={18} /> Credentials & Contact</h3>
              <div style={styles.infoRow}>
                <Phone size={14} color="#64748B" />
                <span>{doctor.user.phone}</span>
              </div>
              <div style={styles.infoRow}>
                <Mail size={14} color="#64748B" />
                <span>{doctor.user.email || '--'}</span>
              </div>
              {doctor.licenseNumber && (
                <div style={styles.infoRow}>
                  <Award size={14} color="#64748B" />
                  <span>License: {doctor.licenseNumber}</span>
                </div>
              )}
              <div style={styles.infoRow}>
                <Clock size={14} color="#64748B" />
                <span>Joined: {formatDate(new Date(doctor.user.createdAt), 'medium')}</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div style={styles.listFeed}>
            {doctor.reviews.map(rev => (
              <div key={rev.id} className="paper-card" style={styles.reviewCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={styles.avatarSmall}>{rev.patient.patientProfile.fullName[0]}</div>
                    <span style={{ fontWeight: '700' }}>{rev.patient.patientProfile.fullName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < rev.rating ? "#F59E0B" : "transparent"} color={i < rev.rating ? "#F59E0B" : "#CBD5E1"} />)}
                  </div>
                </div>
                <p style={styles.comment}>"{rev.comment}"</p>
                <p style={styles.date}>{formatDate(new Date(rev.createdAt), 'medium')}</p>
              </div>
            ))}
            {doctor.reviews.length === 0 && <p style={styles.emptyText}>No patient reviews yet.</p>}
          </div>
        )}

        {tab === 'appointments' && (
          <div className="paper-card" style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {doctor.appointments.map(app => (
                  <tr key={app.id} style={styles.tr}>
                    <td style={styles.td}>{app.patient.patientProfile.fullName}</td>
                    <td style={styles.td}>
                      <span style={{...styles.statusTag, backgroundColor: app.status === 'COMPLETED' ? '#ECFDF5' : '#F1F5F9', color: app.status === 'COMPLETED' ? '#059669' : '#64748B'}}>
                        {app.status}
                      </span>
                    </td>
                    <td style={styles.td}>{app.fee} ETB</td>
                    <td style={styles.td}>{formatDate(new Date(app.dateTime), 'medium')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {doctor.appointments.length === 0 && <p style={styles.emptyText}>No appointment records found.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  profileHeader: { marginBottom: '32px' },
  headerTop: { display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '32px' },
  avatarLarge: { width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#0F172A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '800' },
  headerInfo: { flex: 1 },
  name: { fontSize: '28px', fontWeight: '800', color: '#0F172A' },
  spec: { fontSize: '16px', color: '#3B82F6', fontWeight: '600', marginTop: '4px' },
  metrics: { display: 'flex', gap: '24px', marginTop: '16px' },
  metricItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  metricVal: { fontSize: '18px', fontWeight: '800', color: '#1E293B' },
  metricLabel: { fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  statusBadge: { padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' },
  content: { marginTop: '32px' },
  overviewGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' },
  card: { padding: '24px' },
  cardTitle: { fontSize: '14px', textTransform: 'uppercase', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: '800' },
  bio: { fontSize: '15px', color: '#334155', lineHeight: '1.7' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '14px' },
  listFeed: { display: 'flex', flexDirection: 'column', gap: '20px' },
  reviewCard: { padding: '20px' },
  avatarSmall: { width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' },
  comment: { fontSize: '14px', color: '#475569', fontStyle: 'italic', margin: '12px 0' },
  date: { fontSize: '11px', color: '#94A3B8' },
  tableCard: { padding: '0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '16px 24px', textAlign: 'left', fontSize: '12px', color: '#64748B', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F8FAFC' },
  td: { padding: '16px 24px', fontSize: '14px' },
  statusTag: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  loading: { textAlign: 'center', padding: '100px', color: '#64748B' },
  empty: { textAlign: 'center', padding: '100px', color: '#64748B' },
  emptyText: { textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '14px' }
};
