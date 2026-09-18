import { useEffect, useState } from 'react';
import client from '../api/client';
import {
  Users,
  Search,
  Phone,
  Calendar,
  Clock,
  Stethoscope,
  Wrench,
  CheckCircle,
  Ban,
  Loader2,
  X,
} from 'lucide-react';

interface Patient {
  id: number;
  phone: string | null;
  fullName: string;
  gender: string | null;
  bloodType: string | null;
  dateOfBirth: string | null;
  emergencyContact: string | null;
  joinedAt: string;
  bookings: number;
  cards: number;
}

interface HistoryData {
  patient: {
    id: number;
    phone: string | null;
    createdAt: string;
    patientProfile: {
      fullName: string | null;
      gender: string | null;
      bloodType: string | null;
      dateOfBirth: string | null;
      emergencyContact: string | null;
    } | null;
  };
  appointments: {
    id: number;
    dateTime: string;
    status: string;
    fee: string;
    isPaid: boolean;
    doctor: { id: number; fullName: string | null; specialization: string | null };
  }[];
  equipmentBookings: {
    id: number;
    dateTime: string;
    status: string;
    fee: string | null;
    equipment: { id: number; name: string | null; price: string | null };
    hospital: { id: number; name: string; serviceFee: { amount: string | null } | null } | null;
  }[];
}

const statusIcon = (status: string) =>
  status === 'completed' || status === 'confirmed' ? <CheckCircle size={15} color="#027A48" /> :
  status === 'cancelled' || status === 'declined' ? <Ban size={15} color="#D92D20" /> :
  <Clock size={15} color="#B54708" />;

const listCard: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-sm)',
};

const thStyle: React.CSSProperties = {
  padding: '14px 20px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  textAlign: 'left',
  borderBottom: '1px solid var(--border)',
  background: 'var(--surface)',
};

const tdStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid var(--border)',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [historyPatient, setHistoryPatient] = useState<{ id: number; fullName: string; phone: string | null } | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchPatients = async (q: string) => {
    setLoading(true);
    try {
      const res = await client.get('/receptionist/patients/directory', { params: { search: q } });
      setPatients(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchPatients(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const loadHistory = async (p: { id: number; fullName: string; phone: string | null }) => {
    setHistoryPatient(p);
    setHistoryLoading(true);
    setHistory(null);
    try {
      const res = await client.get(`/receptionist/patients/${p.id}/history`);
      setHistory(res.data.data);
    } catch {
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeModal = () => { setHistoryPatient(null); setHistory(null); };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', margin: 0 }}>Patient History</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            View all patients and their appointment / equipment booking history at this hospital.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
          <Search size={18} color="var(--text-secondary)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            style={{ border: 'none', outline: 'none', width: 220, fontSize: 14, background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={32} className="spin" color="var(--accent-primary)" />
        </div>
      ) : patients.length === 0 ? (
        <div style={{ ...listCard, padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Users size={44} style={{ opacity: 0.4, marginBottom: 12 }} />
          <p style={{ margin: 0 }}>No patients found.</p>
        </div>
      ) : (
        <div style={{ ...listCard, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Patient</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Demographics</th>
                <th style={thStyle}>Bookings</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-bg)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                        {(p.fullName || '?')[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.fullName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ID: #{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                      <Phone size={13} /> {p.phone || '—'}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: 'var(--accent-bg)', color: 'var(--accent-secondary)', borderRadius: 6, textTransform: 'uppercase' }}>{p.gender || 'N/A'}</span>
                      {p.bloodType && <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: '#FEE4E2', color: '#B42318', borderRadius: 6, textTransform: 'uppercase' }}>{p.bloodType}</span>}
                    </div>
                  </td>
                  <td style={tdStyle}><span style={{ color: 'var(--text-secondary)' }}>{p.bookings} appointment(s)</span></td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      onClick={() => loadHistory(p)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 600, fontSize: 14 }}
                    >
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {historyPatient && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 640, maxHeight: '80vh', overflowY: 'auto', padding: 28, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{historyPatient.fullName}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>ID: #{historyPatient.id} &middot; {historyPatient.phone || 'No phone'}</p>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            {historyLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader2 size={28} className="spin" color="var(--accent-primary)" />
              </div>
            ) : history ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Stethoscope size={16} color="var(--accent-primary)" /> Appointments ({history.appointments.length})
                  </h4>
                  {history.appointments.length === 0 ? (
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>No appointments.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {history.appointments.map((a) => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{a.doctor?.fullName || 'N/A'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.doctor?.specialization || ''}</div>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                            <Calendar size={13} /> {new Date(a.dateTime).toLocaleString()}
                          </span>
                          {statusIcon(a.status)}
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{a.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Wrench size={16} color="var(--accent-primary)" /> Equipment Bookings ({history.equipmentBookings.length})
                  </h4>
                  {history.equipmentBookings.length === 0 ? (
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>No equipment bookings.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {history.equipmentBookings.map((b) => (
                        <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{b.equipment?.name || 'N/A'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.hospital?.name || ''}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)' }}>
                              Equipment {Number(b.equipment?.price ?? 0)} ETB + Hospital fee {Number(b.hospital?.serviceFee?.amount ?? 50)} ETB
                            </div>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                            <Calendar size={13} /> {new Date(b.dateTime).toLocaleString()}
                          </span>
                          {statusIcon(b.status)}
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{b.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Failed to load history.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}