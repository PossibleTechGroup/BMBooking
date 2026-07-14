import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { formatNum } from '../utils/ethiopianDate';
import {
  TrendingUp,
  Users,
  UserCheck,
  UserX,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  Loader2,
  ClipboardList,
  Building2,
  Phone,
  Mail,
  Clock,
  Package,
  DollarSign,
  Server,
} from 'lucide-react';
import { adminPageStyles } from '../styles/adminPageStyles';
import { PageHeader } from '../components/PageHeader';
import { SubTabs } from '../components/SubTabs';

interface GrowthItem {
  month: string;
  count: number;
}

interface ActivePatients {
  total: number;
  active: number;
  inactive: number;
}

interface ApptStatus {
  status: string;
  count: number;
}

interface ApptStats {
  total: number;
  byStatus: ApptStatus[];
  todayAppts: number;
  totalRevenue: number;
}

interface StaffMetric {
  appointmentsReviewed: number;
  bookingsReviewed: number;
  schedulesCreated: number;
  totalActions: number;
  todayActions: number;
}

interface StaffMember {
  id: number;
  username: string;
  phone: string;
  email: string;
  hospital: string;
  hospitalId: number;
  joinedAt: string;
  metrics: StaffMetric;
}

interface StaffPerformance {
  staff: StaffMember[];
  summary: {
    totalStaff: number;
    totalActions: number;
    averageActions: number;
    totalTodayActions: number;
    actionsByType: {
      appointmentsReviewed: number;
      bookingsReviewed: number;
      schedulesCreated: number;
    };
  };
}

interface UtilizationByStatus {
  status: string;
  count: number;
}

interface UtilizationSummary {
  total: number;
  totalRevenue: number;
  totalEquipment: number;
  completedRate: number;
  byStatus: UtilizationByStatus[];
}

interface EquipmentUtilItem {
  equipmentId: number;
  name: string;
  category: string;
  isOperational: boolean;
  bookings: number;
  revenue: number;
}

interface CategoryUtilItem {
  category: string;
  bookings: number;
  revenue: number;
  equipmentCount: number;
}

interface MonthlyTrendItem {
  month: string;
  bookings: number;
  revenue: number;
}

interface EquipmentUtilization {
  summary: UtilizationSummary;
  byEquipment: EquipmentUtilItem[];
  byCategory: CategoryUtilItem[];
  monthlyTrend: MonthlyTrendItem[];
}

const CHART_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF'];

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  accepted: '#10B981',
  declined: '#EF4444',
  completed: '#3B82F6',
  cancelled: '#6B7280',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const ReportsPage: React.FC<{ onNavigate?: (view: string, filter?: 'all' | 'active' | 'inactive') => void }> = ({ onNavigate }) => {
  const [growth, setGrowth] = useState<GrowthItem[]>([]);
  const [activePatients, setActivePatients] = useState<ActivePatients | null>(null);
  const [apptStats, setApptStats] = useState<ApptStats | null>(null);
  const [staffPerf, setStaffPerf] = useState<StaffPerformance | null>(null);
  const [utilization, setUtilization] = useState<EquipmentUtilization | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'patients' | 'doctors' | 'staff' | 'equipment'>('patients');
  const [doctorList, setDoctorList] = useState<any[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsLoaded, setDoctorsLoaded] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (activeTab === 'doctors' && !doctorsLoaded) {
      fetchDoctors();
    }
  }, [activeTab]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [growthRes, activeRes, apptRes, staffRes, utilRes] = await Promise.all([
        client.get('/admin/stats/patient-growth?months=12'),
        client.get('/admin/stats/active-patients'),
        client.get('/admin/stats/appointments'),
        client.get('/admin/stats/staff-performance'),
        client.get('/admin/stats/equipment-utilization'),
      ]);

      setGrowth(growthRes.data.data || []);
      setActivePatients(activeRes.data.data || null);
      setApptStats(apptRes.data.data || null);
      setStaffPerf(staffRes.data.data || null);
      setUtilization(utilRes.data.data || null);
    } catch (err) {
      console.error('Failed to fetch reports data', err);
    } finally {
      setLoading(false);
    }
  };

  const maxCount = Math.max(...growth.map((g) => g.count), 1);

  const fetchDoctors = async () => {
    setDoctorsLoading(true);
    try {
      const res = await client.get('/admin/doctors');
      setDoctorList(res.data.data || []);
      setDoctorsLoaded(true);
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const doctorStatusCounts = {
    total: doctorList.length,
    approved: doctorList.filter((d: any) => d.status === 'Approved').length,
    pending: doctorList.filter((d: any) => d.status === 'PendingReview').length,
    rejected: doctorList.filter((d: any) => d.status === 'Rejected').length,
  };

  const topDoctors = [...doctorList]
    .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 15);

  if (loading) {
    return (
      <div style={adminPageStyles.loadingWrap}>
        <Loader2 size={32} className="spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  const reportTabs = [
    { key: 'patients', label: 'Patients', icon: <Users size={16} /> },
    { key: 'doctors', label: 'Doctors', icon: <Activity size={16} /> },
    { key: 'staff', label: 'Receptionist / Staff', icon: <ClipboardList size={16} /> },
    { key: 'equipment', label: 'Equipment', icon: <Server size={16} /> },
  ] as const;

  return (
    <div style={adminPageStyles.pageWide}>
      <PageHeader
        icon={BarChart3}
        title="System Analysis"
        subtitle="Analytics and performance metrics across all departments."
      />

      <SubTabs
        tabs={reportTabs.map((t) => ({ ...t, key: t.key }))}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as typeof activeTab)}
      />

      {activeTab === 'patients' && (
      <div style={s.grid}>
        {/* Patient Growth Chart */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <TrendingUp size={20} color="#3B82F6" />
            <h3 style={s.cardTitle}>Patient Growth (12 Months)</h3>
          </div>
          <div style={s.chartContainer}>
            {growth.length === 0 ? (
              <div style={s.empty}>No patient data available.</div>
            ) : (
              <div style={s.chart}>
                {growth.map((item, i) => (
                  <div key={i} style={s.barGroup}>
                    <div style={s.barLabel}>{item.count}</div>
                    <div
                      style={{
                        ...s.bar,
                        height: `${Math.max((item.count / maxCount) * 200, 4)}px`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                      title={`${item.month}: ${item.count} new patients`}
                    />
                    <div style={s.barMonth}>{item.month.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Patients */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <Users size={20} color="#10B981" />
            <h3 style={s.cardTitle}>Patient Activity</h3>
          </div>
          {activePatients ? (
            <div style={s.statusGrid}>
              {([
                { label: 'Total Registered', key: 'total', filter: 'all', color: '#3B82F6' },
                { label: 'Active', key: 'active', filter: 'active', color: '#10B981' },
                { label: 'Inactive', key: 'inactive', filter: 'inactive', color: '#EF4444' },
              ] as const).map((item) => {
                const val = activePatients[item.key as keyof typeof activePatients];
                const pct = activePatients.total > 0 ? ((val / activePatients.total) * 100).toFixed(1) : '0';
                return (
                  <button
                    key={item.label}
                    onClick={() => onNavigate?.('patients', item.filter)}
                    style={{ ...s.statusCard, borderTop: `3px solid ${item.color}`, textAlign: 'left' as any, cursor: 'pointer', width: '100%' }}
                    title={item.label}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = item.color; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                    </div>
                    <div style={s.statusCount}>{val}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={s.statusPct}>{pct}% of patients</span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>{item.label === 'Total Registered' ? 'all registered' : val === 1 ? '1 patient' : `${val} patients`}</span>
                    </div>
                    <div style={s.progressTrack}>
                      <div style={{ ...s.progressFill, width: `${pct}%`, backgroundColor: item.color }} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={s.empty}>No data.</div>
          )}
        </div>

        {/* Appointment Status Breakdown */}
        <div style={{ ...s.card, gridColumn: '1 / -1' }}>
          <div style={s.cardHead}>
            <PieChart size={20} color="#8B5CF6" />
            <h3 style={s.cardTitle}>Appointment Status Breakdown</h3>
          </div>
          {apptStats && (
            <div style={s.utilSummaryGrid}>
              {([
                { label: 'Total Appointments', value: apptStats.total, icon: <Calendar size={20} />, bg: '#EFF6FF', color: '#3B82F6' },
                { label: 'Total Revenue', value: `${formatNum(apptStats.totalRevenue)} ETB`, icon: <DollarSign size={20} />, bg: '#ECFDF5', color: '#059669' },
                { label: "Today's Appointments", value: apptStats.todayAppts, icon: <Clock size={20} />, bg: '#FEF3C7', color: '#D97706' },
                { label: 'Avg Revenue / Booking', value: apptStats.total > 0 ? `${formatNum(Math.round(apptStats.totalRevenue / apptStats.total))} ETB` : '0 ETB', icon: <BarChart3 size={20} />, bg: '#F3E8FF', color: '#9333EA' },
              ]).map((item) => (
                <div key={item.label} style={s.utilSummaryCard}>
                  <div style={{ ...s.utilIcon, backgroundColor: item.bg, color: item.color }}>{item.icon}</div>
                  <div style={s.utilNum}>{item.value}</div>
                  <div style={s.utilLabel}>{item.label}</div>
                </div>
              ))}
            </div>
          )}
          {apptStats && apptStats.byStatus.length > 0 ? (
            <div style={s.statusGrid}>
              {apptStats.byStatus.filter(s => s.status !== 'pending' && s.status !== 'declined').map((item) => {
                const pct = apptStats.total > 0 ? ((item.count / apptStats.total) * 100).toFixed(1) : '0';
                const color = statusColors[item.status] || '#6B7280';
                return (
                  <div
                    key={item.status}
                    style={{ ...s.statusCard, borderTop: `3px solid ${color}` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{statusLabels[item.status] || item.status}</span>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                    </div>
                    <div style={s.statusCount}>{item.count}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={s.statusPct}>{pct}% of total</span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>{item.count === 1 ? '1 booking' : `${item.count} bookings`}</span>
                    </div>
                    <div style={s.progressTrack}>
                      <div
                        style={{
                          ...s.progressFill,
                          width: `${pct}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={s.empty}>No appointment data.</div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'doctors' && (
      <div style={s.grid}>
        <div style={{ ...s.card, gridColumn: '1 / -1' }}>
          <div style={s.cardHead}>
            <Activity size={20} color="#3B82F6" />
            <h3 style={s.cardTitle}>Doctor Overview</h3>
          </div>
          {doctorsLoading ? (
            <div style={s.empty}>Loading doctor data...</div>
          ) : doctorList.length === 0 ? (
            <div style={s.empty}>No doctor data available.</div>
          ) : (
            <>
              <div style={s.staffSummaryGrid}>
                {([
                  { label: 'Total Doctors', value: doctorStatusCounts.total, icon: <Users size={20} />, bg: '#EFF6FF', color: '#3B82F6' },
                  { label: 'Approved', value: doctorStatusCounts.approved, icon: <UserCheck size={20} />, bg: '#ECFDF5', color: '#059669' },
                  { label: 'Pending Review', value: doctorStatusCounts.pending, icon: <Clock size={20} />, bg: '#FEF3C7', color: '#D97706' },
                  { label: 'Rejected', value: doctorStatusCounts.rejected, icon: <UserX size={20} />, bg: '#FEF2F2', color: '#EF4444' },
                ]).map((item) => (
                  <div key={item.label} style={s.summaryCard}>
                    <div style={{ ...s.summaryIcon, backgroundColor: item.bg, color: item.color }}>{item.icon}</div>
                    <div style={s.summaryNum}>{item.value}</div>
                    <div style={s.summaryLabel}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Doctor</th>
                      <th style={s.th}>Specialization</th>
                      <th style={s.th}>Rating</th>
                      <th style={s.th}>Experience</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Reviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDoctors.length === 0 && (
                      <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#94A3B8', padding: '40px' }}>No doctors found.</td></tr>
                    )}
                    {topDoctors.map((doc: any) => (
                      <tr key={doc.id} style={s.tr}>
                        <td style={s.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={s.avatar}>{doc.fullName?.charAt(0).toUpperCase() || 'D'}</div>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{doc.fullName}</span>
                          </div>
                        </td>
                        <td style={s.td}>{doc.specialization || '—'}</td>
                        <td style={s.td}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            {doc.rating?.toFixed(1) || '0.0'}
                          </span>
                        </td>
                        <td style={s.td}>{doc.experienceYears ? `${doc.experienceYears} yrs` : '—'}</td>
                        <td style={s.td}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
                            backgroundColor: doc.status === 'Approved' ? '#D1FAE5' : doc.status === 'PendingReview' ? '#FEF3C7' : '#FEE2E2',
                            color: doc.status === 'Approved' ? '#065F46' : doc.status === 'PendingReview' ? '#92400E' : '#991B1B',
                          }}>
                            {doc.status === 'Approved' ? 'Approved' : doc.status === 'PendingReview' ? 'Pending' : 'Rejected'}
                          </span>
                        </td>
                        <td style={s.td}>{doc.totalReviews || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {activeTab === 'staff' && (
      <div style={s.grid}>
        {/* Staff Performance */}
        <div style={{ ...s.card, gridColumn: '1 / -1' }}>
          <div style={s.cardHead}>
            <ClipboardList size={20} color="#D946EF" />
            <h3 style={s.cardTitle}>Receptionist & Staff Performance</h3>
          </div>
          {staffPerf ? (
            <>
              <div style={s.staffSummaryGrid}>
                {([
                  { label: 'Staff', value: staffPerf.summary.totalStaff, icon: <Users size={20} />, bg: '#F3E8FF', color: '#9333EA' },
                  { label: 'Total Actions', value: formatNum(staffPerf.summary.totalActions), icon: <Activity size={20} />, bg: '#EFF6FF', color: '#3B82F6' },
                  { label: 'Avg / Staff', value: staffPerf.summary.averageActions, icon: <BarChart3 size={20} />, bg: '#ECFDF5', color: '#059669' },
                  { label: "Today's Actions", value: staffPerf.summary.totalTodayActions, icon: <Clock size={20} />, bg: '#FEF3C7', color: '#D97706' },
                ]).map((item) => (
                  <div key={item.label} style={s.summaryCard}>
                    <div style={{ ...s.summaryIcon, backgroundColor: item.bg, color: item.color }}>{item.icon}</div>
                    <div style={s.summaryNum}>{item.value}</div>
                    <div style={s.summaryLabel}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={s.actionTypeRow}>
                <div style={s.actionTypeBadge}>
                  <Calendar size={14} /> {staffPerf.summary.actionsByType.appointmentsReviewed} Appointments
                </div>
                <div style={s.actionTypeBadge}>
                  <ClipboardList size={14} /> {staffPerf.summary.actionsByType.bookingsReviewed} Bookings
                </div>
                <div style={s.actionTypeBadge}>
                  <Clock size={14} /> {staffPerf.summary.actionsByType.schedulesCreated} Schedules
                </div>
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Staff</th>
                      <th style={s.th}>Hospital</th>
                      <th style={s.th}>Appts Reviewed</th>
                      <th style={s.th}>Bookings Reviewed</th>
                      <th style={s.th}>Schedules Created</th>
                      <th style={s.th}>Total Actions</th>
                      <th style={s.th}>Today</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffPerf.staff.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#94A3B8', padding: '40px' }}>No receptionist data found.</td>
                      </tr>
                    )}
                    {staffPerf.staff.map((member) => (
                      <tr key={member.id} style={s.tr}>
                        <td style={s.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={s.avatar}>
                              {(member.username || 'R').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={s.staffName}>{member.username}</div>
                              <div style={s.staffContact}>
                                <Phone size={11} /> {member.phone || '—'} &middot; <Mail size={11} /> {member.email || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={s.td}>
                          <div style={s.hospitalCell}>
                            <Building2 size={14} color="#64748B" />
                            {member.hospital}
                          </div>
                        </td>
                        <td style={s.td}>{member.metrics.appointmentsReviewed}</td>
                        <td style={s.td}>{member.metrics.bookingsReviewed}</td>
                        <td style={s.td}>{member.metrics.schedulesCreated}</td>
                        <td style={s.td}>
                          <span style={s.totalBadge}>{member.metrics.totalActions}</span>
                        </td>
                        <td style={s.td}>
                          <span style={{
                            ...s.todayBadge,
                            backgroundColor: member.metrics.todayActions > 0 ? '#ECFDF5' : '#F2F4F7',
                            color: member.metrics.todayActions > 0 ? '#027A48' : '#64748B',
                          }}>
                            {member.metrics.todayActions}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={s.empty}>No staff performance data.</div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'equipment' && (
      <div style={s.grid}>
        {/* Equipment Utilization */}
        <div style={{ ...s.card, gridColumn: '1 / -1' }}>
          <div style={s.cardHead}>
            <Server size={20} color="#059669" />
            <h3 style={s.cardTitle}>Equipment Utilization</h3>
          </div>
          {utilization ? (
            <>
              <div style={s.utilSummaryGrid}>
                {([
                  { label: 'Total Bookings', value: utilization.summary.total, icon: <Package size={20} />, bg: '#EFF6FF', color: '#3B82F6' },
                  { label: 'Total Revenue', value: `${formatNum(utilization.summary.totalRevenue)} ETB`, icon: <DollarSign size={20} />, bg: '#ECFDF5', color: '#059669' },
                  { label: 'Equipment Items', value: utilization.summary.totalEquipment, icon: <Server size={20} />, bg: '#FEF3C7', color: '#D97706' },
                  { label: 'Avg Completed / Item', value: utilization.summary.completedRate.toFixed(2), icon: <BarChart3 size={20} />, bg: '#F3E8FF', color: '#9333EA' },
                ]).map((item) => (
                  <div key={item.label} style={s.utilSummaryCard}>
                    <div style={{ ...s.utilIcon, backgroundColor: item.bg, color: item.color }}>{item.icon}</div>
                    <div style={s.utilNum}>{item.value}</div>
                    <div style={s.utilLabel}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Equipment Status Cards */}
              <div style={s.equipStatusGrid}>
                {utilization.summary.byStatus.filter(s => s.status !== 'pending' && s.status !== 'declined').map((item) => {
                  const color = statusColors[item.status] || '#6B7280';
                  const total = utilization.summary.total;
                  const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
                  return (
                    <div
                      key={item.status}
                      style={{ ...s.equipStatusCard, borderTop: `3px solid ${color}` }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{statusLabels[item.status] || item.status}</span>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                      </div>
                      <div style={s.statusCount}>{item.count}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4, marginBottom: 10 }}>
                        <span style={s.statusPct}>{pct}% of total</span>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>{item.count === 1 ? '1 booking' : `${item.count} bookings`}</span>
                      </div>
                      <div style={s.progressTrack}>
                        <div style={{ ...s.progressFill, width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Two-column layout: Category breakdown + Monthly trend */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
                {/* Category breakdown */}
                <div>
                  <h4 style={s.utilSectionTitle}>By Category</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {utilization.byCategory.map((cat) => {
                      const maxBookings = Math.max(...utilization.byCategory.map(c => c.bookings), 1);
                      return (
                        <div key={cat.category} style={{ padding: '10px 14px', backgroundColor: '#FAFAFA', borderRadius: '10px', border: '1px solid #F2F4F7' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#0F172A', textTransform: 'capitalize' }}>{cat.category.replace(/_/g, ' ').toLowerCase()}</span>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{cat.bookings}</span>
                          </div>
                          <div style={{ height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
                            <div style={{ height: '100%', width: `${(cat.bookings / maxBookings) * 100}%`, backgroundColor: '#3B82F6', borderRadius: '2px' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                            <span>{cat.equipmentCount} equipment</span>
                            <span>{formatNum(cat.revenue)} ETB</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Monthly trend */}
                <div>
                  <h4 style={s.utilSectionTitle}>Monthly Bookings (12 Months)</h4>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px', paddingTop: '16px' }}>
                    {utilization.monthlyTrend.map((item, i) => {
                      const maxB = Math.max(...utilization.monthlyTrend.map(m => m.bookings), 1);
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                          <div style={{ fontSize: '9px', fontWeight: 600, color: '#64748B', marginBottom: '2px' }}>{item.bookings}</div>
                          <div style={{
                            width: '100%', maxWidth: '28px',
                            height: `${Math.max((item.bookings / maxB) * 130, 3)}px`,
                            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s',
                          }} title={`${item.month}: ${item.bookings} bookings, ${formatNum(item.revenue)} ETB`} />
                          <div style={{ fontSize: '8px', color: '#94A3B8', marginTop: '4px', writingMode: 'vertical-lr', textOrientation: 'mixed' as any, transform: 'rotate(180deg)', height: '40px', overflow: 'hidden' }}>
                            {item.month.split(' ')[0]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Top equipment table */}
              <h4 style={s.utilSectionTitle}>Top Equipment by Usage</h4>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Equipment</th>
                      <th style={s.th}>Category</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Bookings</th>
                      <th style={s.th}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilization.byEquipment.length === 0 && (
                      <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: '#94A3B8', padding: '40px' }}>No equipment booking data yet.</td></tr>
                    )}
                    {utilization.byEquipment.slice(0, 15).map((eq) => (
                      <tr key={eq.equipmentId} style={s.tr}>
                        <td style={s.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={14} color="#64748B" />
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{eq.name}</span>
                          </div>
                        </td>
                        <td style={s.td}>{eq.category.replace(/_/g, ' ')}</td>
                        <td style={s.td}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
                            backgroundColor: eq.isOperational ? '#D1FAE5' : '#FEE2E2',
                            color: eq.isOperational ? '#065F46' : '#991B1B',
                          }}>
                            {eq.isOperational ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ ...s.td, fontWeight: 700 }}>{eq.bookings}</td>
                        <td style={s.td}>{formatNum(eq.revenue)} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={s.empty}>No equipment utilization data.</div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  card: {
    padding: '28px', backgroundColor: '#FFF',
    borderRadius: '16px', border: '1px solid #E2E8F0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)',
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' },
  cardTitle: { fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 },
  chartContainer: { minHeight: '260px' },
  chart: { display: 'flex', alignItems: 'flex-end', gap: '8px', height: '240px', paddingTop: '20px' },
  barGroup: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barLabel: { fontSize: '10px', fontWeight: 600, color: '#64748B', marginBottom: '4px' },
  bar: {
    width: '100%', maxWidth: '36px',
    borderRadius: '6px 6px 0 0', transition: 'height 0.3s', minHeight: '4px',
  },
  barMonth: { fontSize: '10px', color: '#94A3B8', marginTop: '6px', textAlign: 'center' },
  empty: { padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' },
  activeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
  activeStat: {
    textAlign: 'center', padding: '20px 16px', cursor: 'pointer',
    border: '1px solid #F1F5F9', background: '#FFF', display: 'block',
    width: '100%', borderRadius: '14px', transition: 'all 0.15s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  activeIcon: {
    width: '52px', height: '52px', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 12px',
  },
  activeNum: { fontSize: '28px', fontWeight: 800, color: '#0F172A' },
  activeLabel: { fontSize: '13px', color: '#64748B', marginTop: '4px' },
  statusGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  statusCard: { padding: '20px', backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' },
  statusDot: { width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0 },
  statusName: { fontSize: '14px', fontWeight: 600, color: '#0F172A' },
  statusCount: { fontSize: '32px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' },
  statusPct: { fontSize: '13px', color: '#64748B' },
  progressTrack: { height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.3s' },
  // Staff Performance
  staffSummaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' },
  summaryCard: { padding: '20px', backgroundColor: '#FFF', borderRadius: '14px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' },
  summaryIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' },
  summaryNum: { fontSize: '24px', fontWeight: 800, color: '#0F172A' },
  summaryLabel: { fontSize: '12px', color: '#64748B', marginTop: '2px' },
  actionTypeRow: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  actionTypeBadge: {
    display: 'flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
    padding: '6px 14px', borderRadius: '100px',
    fontSize: '13px', fontWeight: 600, color: '#475569',
  },
  tableWrap: { borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B',
    textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left',
    backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
  },
  tr: { borderBottom: '1px solid #F2F4F7' },
  td: { padding: '16px', fontSize: '14px', color: '#0F172A' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '10px',
    backgroundColor: '#F3E8FF', color: '#9333EA',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '15px', flexShrink: 0,
  },
  staffName: { fontSize: '14px', fontWeight: 600, color: '#0F172A' },
  staffContact: { fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' },
  hospitalCell: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#475569' },
  totalBadge: {
    display: 'inline-block', backgroundColor: '#EEF2FF', color: '#4F46E5',
    padding: '2px 10px', borderRadius: '100px', fontWeight: 700, fontSize: '13px',
  },
  todayBadge: {
    display: 'inline-block', padding: '2px 10px', borderRadius: '100px', fontWeight: 700, fontSize: '13px',
  },
  equipStatusGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' },
  equipStatusCard: { padding: '18px 20px', backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' },
  // Equipment Utilization
  utilSummaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' },
  utilSummaryCard: { padding: '16px', backgroundColor: '#FFF', borderRadius: '14px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' },
  utilIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' },
  utilNum: { fontSize: '22px', fontWeight: 800, color: '#0F172A' },
  utilLabel: { fontSize: '12px', color: '#64748B', marginTop: '2px' },
  utilSectionTitle: { fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 12px' },
};

export default ReportsPage;
