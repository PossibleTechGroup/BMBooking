'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import {
  Users,
  Stethoscope,
  CalendarCheck,
  Banknote,
  TrendingUp,
  Building2,
  Loader2,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  CalendarDays,
} from 'lucide-react';
import { formatNum } from '@/lib/utils/ethiopianDate';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [growth, setGrowth] = useState<any[]>([]);
  const [appointmentStats, setAppointmentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [s, g, a] = await Promise.all([
          api.get('/admin/stats/summary'),
          api.get('/admin/stats/patient-growth?months=12'),
          api.get('/admin/stats/appointments'),
        ]);
        setSummary(s.data.data);
        setGrowth(g.data.data || []);
        setAppointmentStats(a.data.data);
      } catch (err) {
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxGrowth = Math.max(1, ...growth.map((g) => g.count));

  const statusColor: Record<string, string> = {
    completed: '#10B981',
    accepted: '#3B82F6',
    pending: '#F59E0B',
    declined: '#EF4444',
    cancelled: '#94A3B8',
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <Loader2 size={40} className="spin" color="#94A3B8" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorCard}>
        <p>{error}</p>
        <button
          style={styles.retryBtn}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const cards = [
    {
      label: 'Doctors',
      value: summary?.doctors ?? 0,
      weekly: summary?.weekly?.doctors ?? 0,
      icon: Stethoscope,
      color: '#3B82F6',
      bg: '#EFF6FF',
      href: '/admin/doctors',
    },
    {
      label: 'Patients',
      value: summary?.patients ?? 0,
      weekly: summary?.weekly?.patients ?? 0,
      icon: Users,
      color: '#059669',
      bg: '#ECFDF3',
      href: '/admin/patients',
    },
    {
      label: 'Appointments',
      value: summary?.appointments ?? 0,
      weekly: summary?.weekly?.appointments ?? 0,
      icon: CalendarCheck,
      color: '#F59E0B',
      bg: '#FFFBEB',
      href: '/admin/doctors',
    },
    {
      label: 'Revenue (ETB)',
      value: formatNum(summary?.revenue ?? 0),
      weekly: null,
      icon: Banknote,
      color: '#7C3AED',
      bg: '#F5F3FF',
      href: '/admin/settings',
    },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Platform overview across doctors, patients, appointments, and revenue.</p>
        </div>
      </div>

      <div style={styles.cardGrid}>
        {cards.map((c) => (
          <Link key={c.label} href={c.href} style={styles.statCard}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={styles.statLabel}>{c.label}</p>
                <p style={styles.statValue}>{c.value}</p>
              </div>
              <div style={{ ...styles.statIcon, backgroundColor: c.bg, color: c.color }}>
                <c.icon size={22} />
              </div>
            </div>
            {c.weekly !== null && (
              <p style={styles.statWeekly}>
                <TrendingUp size={13} color="#059669" />
                <strong>{c.weekly}</strong> this week
              </p>
            )}
          </Link>
        ))}
      </div>

      <div style={styles.row}>
        {/* Patient growth bar chart */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Patient Growth (12 months)</h3>
          </div>
          <div style={styles.chart}>
            {growth.map((g) => (
              <div key={g.month} style={styles.barCol}>
                <div style={styles.barTrack}>
                  <div
                    style={{
                      ...styles.barFill,
                      height: `${Math.max(4, Math.round((g.count / maxGrowth) * 100))}%`,
                    }}
                    title={`${g.month}: ${g.count}`}
                  />
                </div>
                <span style={styles.barValue}>{g.count}</span>
                <span style={styles.barLabel}>{g.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment status distribution */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h3 style={styles.panelTitle}>Appointments by Status</h3>
              <p style={styles.panelSub}>{appointmentStats?.total ?? 0} total · {appointmentStats?.todayAppts ?? 0} created today</p>
            </div>
            <CalendarDays size={18} color="#64748B" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(appointmentStats?.byStatus || []).map((s: any) => (
              <div key={s.status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ ...styles.statusLabel, textTransform: 'capitalize' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor[s.status] || '#94A3B8', display: 'inline-block' }} />
                    {s.status === 'accepted' ? <CheckCircle size={12} color="#3B82F6" /> : s.status === 'completed' ? <CheckCircle size={12} color="#10B981" /> : s.status === 'declined' ? <XCircle size={12} color="#EF4444" /> : s.status === 'cancelled' ? <XCircle size={12} color="#94A3B8" /> : <Clock size={12} color="#F59E0B" />} {s.status}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{s.count}</span>
                </div>
                <div style={styles.progressTrack}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${appointmentStats?.total ? (s.count / appointmentStats.total) * 100 : 0}%`,
                      backgroundColor: statusColor[s.status] || '#94A3B8',
                    }}
                  />
                </div>
              </div>
            ))}
            {(appointmentStats?.byStatus || []).length === 0 && (
              <p style={{ fontSize: 13, color: '#94A3B8' }}>No appointment data.</p>
            )}
          </div>
        </div>
      </div>

      <div style={styles.quickNav}>
        <Link href="/admin/hospitals" style={styles.quickLink}>
          <Building2 size={16} /> Hospitals & Staff <ArrowRight size={14} />
        </Link>
        <Link href="/admin/patients" style={styles.quickLink}>
          <Users size={16} /> Patient Directory <ArrowRight size={14} />
        </Link>
        <Link href="/admin/settings" style={styles.quickLink}>
          <Banknote size={16} /> Fees & Prices <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '36px', maxWidth: '1100px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  title: { margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' },
  subtitle: { margin: '6px 0 0', fontSize: '14px', color: 'var(--text-secondary)' },
  loadingWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' },
  errorCard: { maxWidth: 420, margin: '80px auto', padding: '32px', borderRadius: 16, border: '1px solid #FECACA', background: '#FEF3F2', textAlign: 'center' as const, color: '#B42318', fontSize: 14 },
  retryBtn: { marginTop: 16, padding: '10px 24px', borderRadius: 10, background: '#B42318', color: '#FFF', fontWeight: 600, border: 'none', cursor: 'pointer' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: '28px' },
  statCard: {
    padding: '20px 22px',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    background: '#FFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    textDecoration: 'none',
    transition: 'box-shadow 0.2s',
  },
  statIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statLabel: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 6px' },
  statValue: { fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 },
  statWeekly: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#64748B', margin: '14px 0 0' },
  row: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: '28px', alignItems: 'start' },
  panel: { padding: '24px', borderRadius: '14px', border: '1px solid var(--border)', background: '#FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  panelTitle: { margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' },
  panelSub: { margin: '4px 0 0', fontSize: '12px', color: '#94A3B8' },
  chart: { display: 'flex', alignItems: 'flex-end', gap: '6px', height: 220, overflowX: 'auto' as const, paddingBottom: 4 },
  barCol: { flex: 1, minWidth: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' },
  barTrack: { flex: 1, width: '100%', maxWidth: 30, display: 'flex', alignItems: 'flex-end', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #F1F5F9', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#3B82F6', borderRadius: '6px 6px 0 0', transition: 'height 0.3s' },
  barValue: { fontSize: '10px', fontWeight: 700, color: '#64748B', marginTop: 4 },
  barLabel: { fontSize: '9px', color: '#94A3B8', marginTop: 2, whiteSpace: 'nowrap' as const },
  statusLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#475569', fontWeight: 500 },
  progressTrack: { backgroundColor: '#F1F5F9', borderRadius: '100px', height: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '100px', transition: 'width 0.3s' },
  quickNav: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  quickLink: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px',
    borderRadius: '10px', border: '1px solid var(--border)', background: '#FFF',
    fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none',
  },
};

export const dynamic = 'force-dynamic';