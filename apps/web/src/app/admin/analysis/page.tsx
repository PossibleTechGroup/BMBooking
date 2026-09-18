'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { formatNum } from '@/lib/utils/ethiopianDate';
import {
  TrendingUp,
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  Building2,
  Stethoscope,
  Activity,
  ShoppingCart,
  CreditCard,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';

interface CategoryPoint {
  label: string;
  value: number;
}

interface HospitalRow {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  doctors: number;
  patients: number;
  appointments: number;
  paidAppointments: number;
  appointmentRevenue: number;
  equipment: number;
  equipmentBookings: number;
  equipmentRevenue: number;
  cards: number;
  cardRevenue: number;
  totalRevenue: number;
}

interface AnalyticsData {
  summary: {
    hospitals: number;
    doctors: number;
    patients: number;
    equipment: number;
    appointments: number;
    paidAppointments: number;
    equipmentBookings: number;
    cards: number;
    registrationPipeline: number;
    revenue: number;
    revenueBySource: { appointments: number; equipment: number; cards: number };
  };
  branches: {
    hospitals: { total: number; approvals: number; pending: number };
    doctors: { total: number; bySpecialization: CategoryPoint[]; byStatus: CategoryPoint[] };
    patients: { total: number; byGender: CategoryPoint[] };
    appointments: { total: number; paid: number; byStatus: CategoryPoint[] };
    equipment: { total: number; operational: number; byCategory: CategoryPoint[] };
  };
  hospitals: HospitalRow[];
  growth: { month: string; patients: number; appointments: number }[];
}

interface HospitalOption {
  id: number;
  name: string;
}

const EMPTY: AnalyticsData = {
  summary: {
    hospitals: 0, doctors: 0, patients: 0, equipment: 0,
    appointments: 0, paidAppointments: 0, equipmentBookings: 0, cards: 0,
    registrationPipeline: 0, revenue: 0,
    revenueBySource: { appointments: 0, equipment: 0, cards: 0 },
  },
  branches: {
    hospitals: { total: 0, approvals: 0, pending: 0 },
    doctors: { total: 0, bySpecialization: [], byStatus: [] },
    patients: { total: 0, byGender: [] },
    appointments: { total: 0, paid: 0, byStatus: [] },
    equipment: { total: 0, operational: 0, byCategory: [] },
  },
  hospitals: [],
  growth: [],
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--status-warning)',
  accepted: 'var(--status-success)',
  declined: 'var(--status-error)',
  completed: 'var(--accent-secondary)',
  cancelled: 'var(--text-secondary)',
};

const BAR_COLORS = ['var(--accent-primary)', 'var(--accent-secondary)', '#B54708', '#3E5C76', '#027A48', '#7A5AFF'];

export default function AdminAnalysisPage() {
  const [data, setData] = useState<AnalyticsData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ from: '', to: '', hospitalId: '' });
  const [applied, setApplied] = useState({ from: '', to: '', hospitalId: '' });

  const fetchAnalytics = useCallback(async (params?: { from?: string; to?: string; hospitalId?: string }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params?.from) query.set('from', params.from);
      if (params?.to) query.set('to', params.to);
      if (params?.hospitalId) query.set('hospitalId', params.hospitalId);
      const response = await api.get(`/admin/analytics${query.toString() ? `?${query.toString()}` : ''}`);
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAnalytics();
    api.get('/admin/hospitals?limit=100').then((r) => {
      const list: HospitalOption[] = Array.isArray(r.data?.data) ? r.data.data : [];
      setHospitals(list.map((h: any) => ({ id: h.id, name: h.name })));
    }).catch((e) => console.error('Failed to load hospitals', e));
  }, [fetchAnalytics]);

  const applyFilters = () => {
    setApplied(filters);
    fetchAnalytics({
      from: filters.from || undefined,
      to: filters.to || undefined,
      hospitalId: filters.hospitalId || undefined,
    });
  };

  const resetFilters = () => {
    setFilters({ from: '', to: '', hospitalId: '' });
    setApplied({ from: '', to: '', hospitalId: '' });
    fetchAnalytics();
  };

  const filteredHospitals = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data.hospitals;
    return data.hospitals.filter((h) => h.name.toLowerCase().includes(term) || (h.address || '').toLowerCase().includes(term));
  }, [data.hospitals, search]);

  const maxRevenue = useMemo(() => {
    return Math.max(
      data.summary.revenueBySource.appointments,
      data.summary.revenueBySource.equipment,
      data.summary.revenueBySource.cards,
      1
    );
  }, [data.summary.revenueBySource]);

  const maxGrowthValue = useMemo(() => {
    let m = 1;
    data.growth.forEach((g) => {
      m = Math.max(m, g.patients, g.appointments);
    });
    return m;
  }, [data.growth]);

  const revenueBars = [
    { label: 'Doctor Appointments', value: data.summary.revenueBySource.appointments, color: 'var(--accent-primary)' },
    { label: 'Equipment Bookings', value: data.summary.revenueBySource.equipment, color: 'var(--accent-secondary)' },
    { label: 'Hospital Cards', value: data.summary.revenueBySource.cards, color: '#B54708' },
  ];

  const summaryCards = [
    { label: 'Total Revenue', value: `${formatNum(data.summary.revenue)} ETB`, icon: DollarSign, color: '#B54708', sub: `${formatNum(data.summary.paidAppointments)} paid appointments` },
    { label: 'Hospitals', value: formatNum(data.summary.hospitals), icon: Building2, color: '#3E5C76', sub: `${data.summary.registrationPipeline} in pipeline` },
    { label: 'Active Doctors', value: formatNum(data.summary.doctors), icon: Stethoscope, color: '#1A1A1A', sub: `${data.branches.doctors.byStatus.find((s) => s.label === 'Approved')?.value || 0} approved` },
    { label: 'Patients', value: formatNum(data.summary.patients), icon: Users, color: '#027A48', sub: `${data.branches.patients.byGender.reduce((s, g) => s + g.value, 0)} profiled` },
    { label: 'Appointments', value: formatNum(data.summary.appointments), icon: Calendar, color: '#6927DA', sub: `${data.summary.paidAppointments} paid` },
    { label: 'Equipment', value: formatNum(data.summary.equipment), icon: Activity, color: '#027A48', sub: `${data.branches.equipment.operational} operational` },
  ];

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <h1 style={styles.title}>System Analytics</h1>
        <p style={styles.subtitle}>Detailed performance, revenue and activity breakdown across every category.</p>
      </div>

      <div className="paper-card" style={styles.filterCard}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>From</span>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} style={styles.filterInput} />
          </div>
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>To</span>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} style={styles.filterInput} />
          </div>
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Hospital</span>
            <select
              value={filters.hospitalId}
              onChange={(e) => setFilters({ ...filters, hospitalId: e.target.value })}
              style={styles.filterInput}
            >
              <option value="">All hospitals</option>
              {hospitals.map((h) => (
                <option key={h.id} value={String(h.id)}>{h.name}</option>
              ))}
            </select>
          </div>
          <button onClick={applyFilters} style={styles.applyBtn}>
            <Filter size={14} /> Apply
          </button>
          <button onClick={resetFilters} style={styles.resetBtn}>
            <RefreshCw size={14} /> Reset
          </button>
        </div>
        {(applied.from || applied.to || applied.hospitalId) && (
          <div style={styles.activeFilters}>
            {applied.hospitalId ? `Hospital: ${hospitals.find((h) => String(h.id) === applied.hospitalId)?.name || 'Selected'}` : 'All hospitals'}
            {applied.from ? ` · From: ${applied.from}` : ''}
            {applied.to ? ` · To: ${applied.to}` : ''}
          </div>
        )}
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div className="animate-spin" style={styles.spinner}></div>
        </div>
      ) : (
        <div style={styles.content}>
          <div style={styles.statsGrid}>
            {summaryCards.map((card, idx) => (
              <div key={card.label} className="paper-card" style={styles.statCard}>
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.iconBox, backgroundColor: card.color + '15', color: card.color }}>
                    <card.icon size={22} />
                  </div>
                  {idx === 0 && data.summary.revenue > 0 && (
                    <div style={styles.trend}>
                      <TrendingUp size={12} /> <span>All Sources</span>
                    </div>
                  )}
                </div>
                <div style={styles.cardBody}>
                  <p style={styles.statLabel}>{card.label}</p>
                  <h2 style={styles.statValue}>{card.value}</h2>
                  <div style={styles.weeklyInfo}>
                    <span style={styles.weeklyCount}>{card.sub}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="paper-card" style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>
                <DollarSign size={18} color="var(--accent-secondary)" /> Revenue by Source
              </h3>
            </div>
            <div style={styles.revenueGrid}>
              {revenueBars.map((rb) => (
                <div key={rb.label} style={styles.revenueItem}>
                  <div style={styles.revenueInfo}>
                    <span style={styles.revenueLabel}>{rb.label}</span>
                    <span style={styles.revenueValue}>{formatNum(rb.value)} ETB</span>
                  </div>
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${Math.round((rb.value / maxRevenue) * 100)}%`, backgroundColor: rb.color, height: '10px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="paper-card" style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>
                <TrendingUp size={18} color="var(--accent-secondary)" /> Growth — last 12 months
              </h3>
              <div style={styles.legendRow}>
                <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: 'var(--accent-primary)' }} /> Patients</span>
                <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: 'var(--accent-secondary)' }} /> Appointments</span>
              </div>
            </div>
            <div style={styles.chartRow}>
              {data.growth.map((g) => (
                <div key={g.month} style={styles.chartCol}>
                  <div style={styles.barsWrap}>
                    <div style={{ ...styles.chartBar, height: `${Math.max(2, Math.round((g.patients / maxGrowthValue) * 150))}px`, backgroundColor: 'var(--accent-primary)' }} title={`${g.month}: ${g.patients} patients`} />
                    <div style={{ ...styles.chartBar, height: `${Math.max(2, Math.round((g.appointments / maxGrowthValue) * 150))}px`, backgroundColor: 'var(--accent-secondary)' }} title={`${g.month}: ${g.appointments} appointments`} />
                  </div>
                  <span style={styles.chartMonth}>{g.month.slice(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.branchGrid}>
            <div className="paper-card" style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}><Stethoscope size={18} color="var(--accent-primary)" /> Doctors</h3>
                <span style={styles.panelMeta}>{data.branches.doctors.total} total</span>
              </div>
              <div style={styles.branchTopRow}>
                {data.branches.doctors.byStatus.map((s, i) => (
                  <div key={s.label} style={styles.smallStat}>
                    <span style={{ ...styles.smallStatValue, color: BAR_COLORS[i % BAR_COLORS.length] }}>{s.value}</span>
                    <span style={styles.smallStatLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
              {data.branches.doctors.bySpecialization.map((s) => (
                <div key={s.label} style={styles.distItem}>
                  <div style={styles.distInfo}>
                    <span style={styles.distLabel}>{s.label}</span>
                    <span style={styles.distValue}>{s.value}</span>
                  </div>
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${Math.min(100, Math.round((s.value / Math.max(1, data.branches.doctors.bySpecialization[0]?.value || 1)) * 100))}%`, backgroundColor: 'var(--accent-primary)' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="paper-card" style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}><Calendar size={18} color="var(--accent-primary)" /> Appointments</h3>
                <span style={styles.panelMeta}>{data.branches.appointments.total} total · {formatNum(data.branches.appointments.paid)} paid</span>
              </div>
              <div style={styles.chipRow}>
                {data.branches.appointments.byStatus.map((s) => (
                  <div key={s.label} style={styles.statusChip}>
                    <span style={{ ...styles.statusDot, backgroundColor: STATUS_COLORS[s.label] || 'var(--accent-primary)' }} />
                    <span style={styles.statusLabel}>{s.label}</span>
                    <span style={styles.statusValue}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div style={styles.distColumn}>
                {data.branches.appointments.byStatus.map((s) => (
                  <div key={s.label} style={styles.distItem}>
                    <div style={styles.distInfo}>
                      <span style={styles.distLabel}>{s.label}</span>
                      <span style={styles.distValue}>{s.value}</span>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${Math.min(100, Math.round((s.value / Math.max(1, data.branches.appointments.total)) * 100))}%`, backgroundColor: STATUS_COLORS[s.label] || 'var(--accent-primary)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="paper-card" style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}><Building2 size={18} color="var(--accent-primary)" /> Hospitals</h3>
                <span style={styles.panelMeta}>{data.branches.hospitals.total} registered</span>
              </div>
              <div style={styles.distColumn}>
                <div style={styles.distItem}>
                  <div style={styles.distInfo}>
                    <span style={styles.distLabel}>Approved</span>
                    <span style={styles.distValue}>{data.branches.hospitals.approvals}</span>
                  </div>
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${Math.min(100, Math.round((data.branches.hospitals.approvals / Math.max(1, data.branches.hospitals.total)) * 100))}%`, backgroundColor: '#027A48' }} />
                  </div>
                </div>
                <div style={styles.distItem}>
                  <div style={styles.distInfo}>
                    <span style={styles.distLabel}>Pending Approval</span>
                    <span style={styles.distValue}>{data.branches.hospitals.pending}</span>
                  </div>
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${Math.min(100, Math.round((data.branches.hospitals.pending / Math.max(1, data.branches.hospitals.total)) * 100))}%`, backgroundColor: 'var(--status-warning)' }} />
                  </div>
                </div>
                <div style={styles.distItem}>
                  <div style={styles.distInfo}>
                    <span style={styles.distLabel}>Registration Pipeline</span>
                    <span style={styles.distValue}>{data.summary.registrationPipeline}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="paper-card" style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}><Users size={18} color="var(--accent-primary)" /> Patients</h3>
                <span style={styles.panelMeta}>{data.branches.patients.total} registered</span>
              </div>
              <div style={styles.distColumn}>
                {data.branches.patients.byGender.map((g) => (
                  <div key={g.label} style={styles.distItem}>
                    <div style={styles.distInfo}>
                      <span style={styles.distLabel}>{g.label}</span>
                      <span style={styles.distValue}>{g.value}</span>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${Math.min(100, Math.round((g.value / Math.max(1, data.branches.patients.total)) * 100))}%`, backgroundColor: '#3E5C76' }} />
                    </div>
                  </div>
                ))}
                {data.branches.patients.byGender.length === 0 && <span style={styles.emptyText}>No patient profile data yet.</span>}
              </div>
            </div>

            <div className="paper-card" style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}><Activity size={18} color="var(--accent-primary)" /> Equipment</h3>
                <span style={styles.panelMeta}>{data.branches.equipment.operational}/{data.branches.equipment.total} operational</span>
              </div>
              <div style={styles.distColumn}>
                {data.branches.equipment.byCategory.map((c) => (
                  <div key={c.label} style={styles.distItem}>
                    <div style={styles.distInfo}>
                      <span style={styles.distLabel} className="capitalize">{c.label.toLowerCase().replace(/_/g, ' ')}</span>
                      <span style={styles.distValue}>{c.value}</span>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${Math.min(100, Math.round((c.value / Math.max(1, data.branches.equipment.total)) * 100))}%`, backgroundColor: '#027A48' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="paper-card" style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}><CreditCard size={18} color="var(--accent-primary)" /> Cards & Bookings</h3>
                <span style={styles.panelMeta}>{formatNum(data.summary.revenueBySource.cards)} ETB cards</span>
              </div>
              <div style={styles.distColumn}>
                <div style={styles.distItem}>
                  <div style={styles.distInfo}>
                    <span style={styles.distLabel}>Hospital Cards Issued</span>
                    <span style={styles.distValue}>{data.summary.cards}</span>
                  </div>
                </div>
                <div style={styles.distItem}>
                  <div style={styles.distInfo}>
                    <span style={styles.distLabel}>Equipment Bookings</span>
                    <span style={styles.distValue}>{data.summary.equipmentBookings}</span>
                  </div>
                </div>
                <div style={styles.distItem}>
                  <div style={styles.distInfo}>
                    <span style={styles.distLabel}>Equipment Revenue</span>
                    <span style={styles.distValue}>{formatNum(data.summary.revenueBySource.equipment)} ETB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="paper-card" style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>
                <ShoppingCart size={18} color="var(--accent-secondary)" /> Revenue by Hospital
              </h3>
              <div style={styles.tableSearch}>
                <Search size={14} color="var(--text-secondary)" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search hospital..."
                  style={styles.searchInput}
                />
              </div>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Hospital</th>
                    <th style={styles.th}>Doctors</th>
                    <th style={styles.th}>Patients</th>
                    <th style={styles.th}>Appointments</th>
                    <th style={styles.th}>Equipment</th>
                    <th style={styles.th}>Cards</th>
                    <th style={styles.thRight}>Revenue (ETB)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHospitals.map((h) => (
                    <tr key={h.id}>
                      <td style={styles.td}>
                        <span style={styles.hospitalName}>{h.name}</span>
                        {h.address && <span style={styles.hospitalAddr}>{h.address}</span>}
                      </td>
                      <td style={styles.td}>{h.doctors}</td>
                      <td style={styles.td}>{h.patients}</td>
                      <td style={styles.td}>{h.appointments} <span style={styles.tdSub}>({h.paidAppointments} paid)</span></td>
                      <td style={styles.td}>
                        {h.equipmentBookings} <span style={styles.tdSub}>({h.equipment} tools)</span>
                      </td>
                      <td style={styles.td}>{h.cards}</td>
                      <td style={{ ...styles.td, ...styles.tdRight }}>
                        <span style={styles.revenueTotal}>{formatNum(h.totalRevenue)}</span>
                        <span style={styles.tdSub}>Apt {formatNum(h.appointmentRevenue)} · Eq {formatNum(h.equipmentRevenue)} · Card {formatNum(h.cardRevenue)}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredHospitals.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                        No hospitals match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: { padding: '40px', height: '100%', overflowY: 'auto' },
  pageHeader: { marginBottom: '32px' },
  title: { fontSize: '28px', color: 'var(--accent-primary)', marginBottom: '4px', marginTop: 0 },
  subtitle: { fontSize: '15px', color: 'var(--text-secondary)' },
  loadingContainer: { height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent-secondary)', borderRadius: '50%' },
  content: { display: 'flex', flexDirection: 'column', gap: '28px' },
  filterCard: { padding: '20px', marginBottom: '4px' },
  filterRow: { display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  filterLabel: { fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' },
  filterInput: {
    height: '38px',
    padding: '0 12px',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontSize: '13px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text-primary)',
    minWidth: '160px',
  },
  applyBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    height: '38px', padding: '0 16px',
    backgroundColor: 'var(--accent-primary)', color: '#FFF', border: 'none',
    borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  resetBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    height: '38px', padding: '0 16px',
    backgroundColor: 'transparent', color: 'var(--text-secondary)',
    border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  activeFilters: { marginTop: '14px', fontSize: '12px', color: 'var(--accent-secondary)', fontWeight: '600', backgroundColor: 'rgba(123,97,255,0.08)', padding: '8px 12px', borderRadius: '8px', display: 'inline-block' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '20px' },
  statCard: { padding: '22px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  iconBox: { width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  trend: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '800', color: '#027A48', backgroundColor: '#ECFDF3', padding: '4px 10px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  cardBody: {},
  statLabel: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' },
  statValue: { fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px', whiteSpace: 'nowrap' },
  weeklyInfo: { marginTop: '8px' },
  weeklyCount: { fontSize: '12px', fontWeight: '600', color: 'var(--accent-secondary)' },
  panel: { padding: '26px' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' },
  panelTitle: { fontSize: '17px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
  panelMeta: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' },
  revenueGrid: { display: 'flex', flexDirection: 'column', gap: '18px' },
  revenueItem: {},
  revenueInfo: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  revenueLabel: { fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' },
  revenueValue: { fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' },
  progressTrack: { height: '8px', backgroundColor: '#F2F4F7', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '4px' },
  legendRow: { display: 'flex', gap: '16px', alignItems: 'center' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' },
  legendDot: { width: '10px', height: '10px', borderRadius: '3px' },
  chartRow: { display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', overflowX: 'auto' },
  chartCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '36px', height: '100%', justifyContent: 'flex-end' },
  barsWrap: { display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px' },
  chartBar: { width: '12px', borderRadius: '4px 4px 0 0' },
  chartMonth: { fontSize: '10px', color: 'var(--text-secondary)' },
  branchGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  branchTopRow: { display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
  smallStat: { display: 'flex', flexDirection: 'column' },
  smallStatValue: { fontSize: '22px', fontWeight: '700' },
  smallStatLabel: { fontSize: '12px', color: 'var(--text-secondary)' },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' },
  statusChip: { display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: '#F9FAFB', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px' },
  statusDot: { width: '9px', height: '9px', borderRadius: '50%' },
  statusLabel: { fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' },
  statusValue: { fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' },
  distColumn: { display: 'flex', flexDirection: 'column', gap: '18px' },
  distItem: { width: '100%' },
  distInfo: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  distLabel: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'capitalize' },
  distValue: { fontSize: '13px', fontWeight: '700' },
  emptyText: { fontSize: '13px', color: 'var(--text-secondary)' },
  tableSearch: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F2F4F7', borderRadius: '10px', padding: '0 12px', height: '38px', minWidth: '240px' },
  searchInput: { border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '13px', color: 'var(--text-primary)', width: '100%' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '600', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' },
  thRight: { textAlign: 'right', padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '600', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' },
  td: { padding: '12px', borderBottom: '1px solid var(--border)', verticalAlign: 'top', color: 'var(--text-primary)' },
  tdRight: { textAlign: 'right', whiteSpace: 'nowrap' },
  tdSub: { fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' },
  hospitalName: { fontWeight: '600', display: 'block' },
  hospitalAddr: { fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' },
  revenueTotal: { fontWeight: '700', color: 'var(--accent-primary)' },
};