'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { formatNum } from '@/lib/utils/ethiopianDate';
import {
  TrendingUp,
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  Activity,
  Zap,
} from 'lucide-react';

interface Stats {
  doctors: number;
  patients: number;
  appointments: number;
  revenue: number;
  weekly: {
    doctors: number;
    patients: number;
    appointments: number;
  };
}

export default function AdminAnalysisPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats/summary');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Patients',
      value: stats?.patients || 0,
      icon: Users,
      color: '#3E5C76',
      weeklyLabel: 'New this week',
      weeklyValue: stats?.weekly.patients || 0,
    },
    {
      label: 'Active Doctors',
      value: stats?.doctors || 0,
      icon: UserPlus,
      color: '#1A1A1A',
      weeklyLabel: 'New this week',
      weeklyValue: stats?.weekly.doctors || 0,
    },
    {
      label: 'Appointments',
      value: stats?.appointments || 0,
      icon: Calendar,
      color: '#027A48',
      weeklyLabel: 'Booked this week',
      weeklyValue: stats?.weekly.appointments || 0,
    },
    {
      label: 'Total Revenue',
      value: `${formatNum(stats?.revenue || 0)} ETB`,
      icon: DollarSign,
      color: '#B54708',
      weeklyLabel: 'Platform Health',
      weeklyValue: 'Stable',
    },
  ];

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <h1 style={styles.title}>System Analytics</h1>
        <p style={styles.subtitle}>Real-time overview of BM Booking&rsquo;s growth and performance metrics.</p>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div className="animate-spin" style={styles.spinner}></div>
        </div>
      ) : (
        <div style={styles.content}>
          <div style={styles.statsGrid}>
            {statCards.map((card, idx) => (
              <div key={idx} className="paper-card" style={styles.statCard}>
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.iconBox, backgroundColor: card.color + '15', color: card.color }}>
                    <card.icon size={24} />
                  </div>
                  {typeof card.weeklyValue === 'number' && card.weeklyValue > 0 && (
                    <div style={styles.trend}>
                      <Zap size={12} />
                      <span>Active Growth</span>
                    </div>
                  )}
                </div>
                <div style={styles.cardBody}>
                  <p style={styles.statLabel}>{card.label}</p>
                  <h2 style={styles.statValue}>{card.value}</h2>
                  <div style={styles.weeklyInfo}>
                    <span style={styles.weeklyTag}>{card.weeklyLabel}:</span>
                    <span style={styles.weeklyCount}>
                      {typeof card.weeklyValue === 'number' ? `+${card.weeklyValue}` : card.weeklyValue}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.chartsGrid}>
            <div className="paper-card" style={styles.mainChart}>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>
                  <TrendingUp size={20} color="var(--accent-secondary)" />
                  Weekly Momentum
                </h3>
                <div style={styles.chartActions}>
                  <button style={styles.activeTab}>This Week</button>
                  <button style={styles.inactiveTab}>Monthly</button>
                </div>
              </div>
              <div style={styles.placeholderChart}>
                <Activity size={48} color="var(--border)" />
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '300px' }}>
                  Patient acquisition is up by <strong>{stats?.weekly.patients}</strong> users in the last 7 days.
                </p>
              </div>
            </div>

            <div className="paper-card" style={styles.sidePanel}>
              <h3 style={styles.chartTitle}>Onboarding Status</h3>
              <div style={styles.distList}>
                <div style={styles.distItem}>
                  <div style={styles.distInfo}>
                    <span style={styles.distLabel}>Completed Profiles</span>
                    <span style={styles.distValue}>85%</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: '85%', backgroundColor: 'var(--status-success)' }} />
                  </div>
                </div>
                <div style={styles.distItem}>
                  <div style={styles.distInfo}>
                    <span style={styles.distLabel}>Pending Verification</span>
                    <span style={styles.distValue}>15%</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: '15%', backgroundColor: 'var(--status-warning)' }} />
                  </div>
                </div>
              </div>

              <div style={styles.alertBox}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--accent-primary)' }}>Weekly Insights</h4>
                <p style={styles.alertText}>
                  Platform activity is peaking on <strong>Mondays</strong> and <strong>Wednesdays</strong>. Consider running doctor promotions during these times.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: { padding: '40px', height: '100%', overflowY: 'auto' },
  pageHeader: { marginBottom: '40px' },
  title: { fontSize: '28px', color: 'var(--accent-primary)', marginBottom: '4px', marginTop: 0 },
  subtitle: { fontSize: '15px', color: 'var(--text-secondary)' },
  loadingContainer: { height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent-secondary)', borderRadius: '50%' },
  content: { display: 'flex', flexDirection: 'column', gap: '32px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' },
  statCard: { padding: '24px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  iconBox: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  trend: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800', color: '#027A48', backgroundColor: '#ECFDF3', padding: '4px 10px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statLabel: { fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' },
  statValue: { fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' },
  weeklyInfo: { marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
  weeklyTag: { fontSize: '12px', color: 'var(--text-secondary)' },
  weeklyCount: { fontSize: '12px', fontWeight: '700', color: 'var(--accent-secondary)' },
  chartsGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' },
  mainChart: { padding: '32px' },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  chartTitle: { fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
  chartActions: { display: 'flex', backgroundColor: '#F2F4F7', padding: '4px', borderRadius: '10px' },
  activeTab: { backgroundColor: '#FFF', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', boxShadow: '0px 1px 2px rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer' },
  inactiveTab: { backgroundColor: 'transparent', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' },
  placeholderChart: { height: '300px', backgroundColor: '#FAFAFA', borderRadius: '16px', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' },
  sidePanel: { padding: '32px' },
  distList: { marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '24px' },
  distItem: { width: '100%' },
  distInfo: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  distLabel: { fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' },
  distValue: { fontSize: '14px', fontWeight: '700' },
  progressBar: { height: '8px', backgroundColor: '#F2F4F7', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '4px' },
  alertBox: { marginTop: '40px', padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid var(--border)' },
  alertText: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' },
};