'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  fetchHospitalOverview,
  fetchHospitalAppointments,
  fetchHospitalServices,
} from '@/lib/store/slices/hospitalSlice';
import { api } from '@/lib/api/client';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import RegisterDoctorModal from '@/components/hospital/register-doctor-modal';
import {
  Bell, ClipboardList, BarChart3, CreditCard, Stethoscope, Users,
  Clock, CheckCircle2, CalendarDays, UserPlus, Wallet, CalendarClock, Ticket,
  Building2, MapPin, ArrowRight, CircleDollarSign, UsersRound, Activity, XCircle,
} from 'lucide-react';

interface NotificationItem {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface QuickAction {
  title: string;
  desc: string;
  color: string;
  icon: typeof ClipboardList;
  href?: string;
  action?: string;
}

const quickActions: QuickAction[] = [
  { title: 'Appointments', desc: 'Manage patient bookings', color: '#175CD3', icon: ClipboardList, href: '/hospital/appointments' },
  { title: 'Analytics', desc: 'Bookings, payments & cards', color: '#6941C6', icon: BarChart3, href: '/hospital/analytics' },
  { title: 'Register Doctor', desc: 'Add a doctor with intro video', color: '#027A48', icon: UserPlus, action: 'register-doctor' },
  { title: 'Doctors', desc: 'Review & manage doctors', color: '#1E5A8A', icon: Stethoscope, href: '/hospital/doctors' },
  { title: 'Staff', desc: 'Manage reception staff', color: '#B54708', icon: Users, href: '/hospital/staff' },
  { title: 'Profile', desc: 'Facility details & services', color: '#334155', icon: Building2, href: '/hospital/profile' },
];

const statusBadge = (status?: string) => {
  const s = (status || 'booked').toLowerCase();
  if (s === 'completed') return { cls: 'bg-success/10 text-success', label: 'Completed' };
  if (s === 'cancelled') return { cls: 'bg-error/10 text-error', label: 'Cancelled' };
  if (s === 'accepted' || s === 'confirmed') return { cls: 'bg-blue/10 text-blue', label: s === 'accepted' ? 'Accepted' : 'Confirmed' };
  return { cls: 'bg-warning/10 text-warning', label: 'Pending' };
};

export default function HospitalDashboardPage() {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((s) => s.auth);
  const { profile, overview, appointments, services } = useAppSelector((s) => s.hospital);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [showRegister, setShowRegister] = useState(false);

  const loadOverview = () => {
    dispatch(fetchHospitalOverview());
    dispatch(fetchHospitalServices());
    dispatch(fetchHospitalAppointments({ status: tab === 'pending' ? 'pending' : undefined, limit: 10 }));
  };

  useEffect(() => {
    if (token) loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, token, tab]);

  useEffect(() => {
    let interval: any;
    const loadNotifications = async () => {
      try {
        const res = await api.get(`/notifications?limit=20&t=${Date.now()}`);
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      } catch {
        // ignore
      }
    };
    if (token) {
      loadNotifications();
      interval = setInterval(loadNotifications, 15000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
    } catch {
      // ignore
    }
  };

  const kpis = [
    { label: "Today's Appointments", value: overview?.todayAppointments ?? 0, icon: CalendarDays, color: '#1565C0', tint: '#E3EFFB' },
    { label: 'Pending Bookings', value: overview?.pending ?? 0, icon: Clock, color: '#B54708', tint: '#FEF3E2' },
    { label: 'Confirmed', value: overview?.confirmed ?? 0, icon: CheckCircle2, color: '#027A48', tint: '#E5F8EE' },
    { label: 'Total Patients', value: overview?.newPatients ?? 0, icon: UsersRound, color: '#1E5A8A', tint: '#E4EFF5' },
  ];

  const visibleAppointments = overview
    ? appointments.filter((a) => (tab === 'pending' ? a.status?.toLowerCase() === 'pending' : true)).slice(0, 10)
    : [];

  return (
    <div className="p-5 lg:p-6 max-w-6xl mx-auto">
      {/* ── Header bar ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 size={22} className="text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <MedText variant="h2" as="h2" className="text-[20px] truncate">{profile?.name || 'My Hospital'}</MedText>
            <div className="flex items-center gap-1 mt-0.5">
              {profile?.address ? (
                <>
                  <MapPin size={12} className="text-muted flex-shrink-0" />
                  <MedText variant="metadata" className="truncate">{profile.address}</MedText>
                </>
              ) : (
                <MedText variant="metadata">{user?.phone || 'Hospital account'}</MedText>
              )}
            </div>
            {services.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {services.slice(0, 5).map((s) => (
                  <span key={s.id} className="text-[10px] bg-foreground/5 text-text-secondary px-2 py-0.5 rounded-full">{s.name}</span>
                ))}
                {services.length > 5 && (
                  <span className="text-[10px] text-primary font-medium px-1">+{services.length - 5}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notification bell */}
        <div className="flex items-center gap-3">
          <button
            onClick={markAllRead}
            className="relative p-2.5 rounded-xl border border-border bg-surface hover:bg-foreground/5 transition-colors"
            title={unreadCount > 0 ? 'Mark all read' : 'Notifications'}
          >
            <Bell size={18} className="text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <Link href="/hospital/profile" className="px-4 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <CreditCard size={15} /> Manage
          </Link>
        </div>
      </div>

      {/* ── KPI metric row ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {kpis.map((k) => (
          <MedCard key={k.label} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-medium text-text-secondary">{k.label}</span>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: k.tint, color: k.color }}>
                <k.icon size={18} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <MedText variant="h1" as="span" className="text-[28px] leading-none">{k.value}</MedText>
            </div>
          </MedCard>
        ))}
      </div>

      {/* ── Secondary stats strip ──────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Available Slots', value: overview?.availableSlots ?? 0, icon: CalendarClock, color: '#1565C0' },
          { label: 'Total Slots', value: overview?.totalSlots ?? 0, icon: Activity, color: '#334155' },
          { label: 'Active Cards', value: overview?.activeCards ?? 0, icon: Ticket, color: '#027A48' },
          { label: 'Revenue (ETB)', value: overview ? `${Number(overview.revenue || 0).toLocaleString()}` : '0', icon: Wallet, color: '#B54708' },
        ].map((s) => (
          <MedCard key={s.label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}14`, color: s.color }}>
              <s.icon size={18} />
            </div>
            <div className="min-w-0">
              <MedText variant="h1" as="span" className="text-[20px] block">{s.value}</MedText>
              <MedText variant="metadata" className="truncate">{s.label}</MedText>
            </div>
          </MedCard>
        ))}
      </div>

      {/* ── Quick actions ──────────────────────────────────── */}
      <MedText variant="body" className="text-[15px] font-semibold mb-3">Quick Actions</MedText>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        {quickActions.map((m) =>
          m.action === 'register-doctor' ? (
            <button key={m.title} onClick={() => setShowRegister(true)} className="group">
              <MedCard className="h-full hover:shadow-md transition-all hover:-translate-y-0.5 p-4 cursor-pointer text-left">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
                  style={{ background: `${m.color}14` }}
                >
                  <m.icon size={20} color={m.color} />
                </div>
                <MedText variant="body" className="text-[14px] font-semibold">{m.title}</MedText>
                <MedText variant="metadata" className="mt-0.5">{m.desc}</MedText>
              </MedCard>
            </button>
          ) : (
            <Link key={m.title} href={m.href!} className="group">
              <MedCard className="h-full hover:shadow-md transition-all hover:-translate-y-0.5 p-4">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
                  style={{ background: `${m.color}14` }}
                >
                  <m.icon size={20} color={m.color} />
                </div>
                <MedText variant="body" className="text-[14px] font-semibold">{m.title}</MedText>
                <MedText variant="metadata" className="mt-0.5">{m.desc}</MedText>
              </MedCard>
            </Link>
          )
        )}
      </div>

      {/* ── Two-column layout: notifications + bookings ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Notifications */}
        <MedCard className="lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <MedText variant="body" className="text-[15px] font-semibold flex items-center gap-2">
              <Bell size={16} className="text-primary" /> Notifications
            </MedText>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[12px] text-primary font-medium hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <MedText variant="body" className="text-text-secondary py-8 text-center">No notifications yet</MedText>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {notifications.slice(0, 12).map((n) => (
                <div key={n.id} className={`flex items-start gap-3 p-2.5 rounded-[10px] ${n.isRead ? 'bg-transparent' : 'bg-primary/5'}`}>
                  <div className="mt-0.5">
                    {n.isRead ? <CheckCircle2 size={16} className="text-muted" /> : <Bell size={16} className="text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <MedText variant="body" className="text-[13px] text-text">{n.message}</MedText>
                    <MedText variant="metadata" className="text-[11px]">{timeAgo(n.createdAt)}</MedText>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MedCard>

        {/* Bookings */}
        <MedCard className="lg:col-span-3">
          <div className="flex justify-between items-center mb-3">
            <MedText variant="body" className="text-[15px] font-semibold">Patient Bookings</MedText>
            <div className="flex gap-2">
              {(['pending', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded-full text-[12px] font-medium capitalize ${tab === t ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {!overview ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : visibleAppointments.length === 0 ? (
            <MedText variant="body" className="text-text-secondary py-10 text-center">No {tab === 'pending' ? 'pending ' : ''}bookings</MedText>
          ) : (
            <div className="overflow-x-auto -mx-4">
              <table className="w-full text-left min-w-[560px]">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-secondary">
                    <th className="py-2.5 px-4 font-medium">Patient</th>
                    <th className="py-2.5 px-4 font-medium">Doctor</th>
                    <th className="py-2.5 px-4 font-medium">Date &amp; Time</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium text-right">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAppointments.map((a) => {
                    const badge = statusBadge(a.status);
                    return (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-foreground/5 transition-colors">
                        <td className="py-3 px-4">
                          <MedText variant="body" className="text-[13px] font-medium text-text">{a.patientName}</MedText>
                          {a.patientPhone && <MedText variant="metadata" className="text-[11px]">{a.patientPhone}</MedText>}
                        </td>
                        <td className="py-3 px-4">
                          <MedText variant="body" className="text-[13px]">{a.doctorName || 'Doctor'}</MedText>
                          {a.specialization && <MedText variant="metadata" className="text-[11px]">{a.specialization}</MedText>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-muted flex-shrink-0" />
                            <MedText variant="metadata">
                              {a.dateTime ? new Date(a.dateTime).toLocaleDateString() : 'N/A'}
                              <span className="block text-[11px]">{a.dateTime ? new Date(a.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}{a.slotStart ? ` • ${a.slotStart}` : ''}</span>
                            </MedText>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <MedText variant="body" className="text-[13px] font-medium text-text flex items-center justify-end gap-1">
                            {a.fee ? `ETB ${Number(a.fee).toLocaleString()}` : '—'}
                            {a.isPaid ? <CheckCircle2 size={13} className="text-success" /> : a.fee ? <XCircle size={13} className="text-muted" /> : null}
                          </MedText>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {visibleAppointments.length > 0 && (
            <div className="mt-3 flex justify-end">
              <Link href="/hospital/appointments" className="text-[12px] text-primary font-medium flex items-center gap-1 hover:underline">
                View all bookings <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </MedCard>
      </div>

      <RegisterDoctorModal open={showRegister} onClose={() => setShowRegister(false)} onRegistered={loadOverview} />
    </div>
  );
}
