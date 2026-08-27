'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  fetchHospitalOverview,
  fetchHospitalAppointments,
} from '@/lib/store/slices/hospitalSlice';
import { api } from '@/lib/api/client';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import {
  Bell, ClipboardList, BarChart3, CreditCard, Stethoscope, Users,
  Clock, CheckCircle2, CalendarDays, UserPlus, Wallet, CalendarClock, Ticket,
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

const moduleCards = [
  { title: 'Appointments', desc: 'View, filter and manage all patient bookings.', color: '#175CD3', icon: ClipboardList, href: '/hospital/appointments' },
  { title: 'Analytics', desc: 'Track bookings, payments and card usage.', color: '#6941C6', icon: BarChart3, href: '/hospital/analytics' },
  { title: 'Packages', desc: 'Manage card templates and validity periods.', color: '#027A48', icon: CreditCard, href: '/hospital/packages' },
  { title: 'Doctors', desc: 'Review and manage registered doctors.', color: '#1E5A8A', icon: Stethoscope, href: '/hospital/doctors' },
  { title: 'Receptionists', desc: 'Manage reception staff accounts.', color: '#B54708', icon: Users, href: '/hospital/receptionists' },
];

export default function HospitalDashboardPage() {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((s) => s.auth);
  const { profile, overview, appointments } = useAppSelector((s) => s.hospital);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');

  const loadOverview = () => {
    dispatch(fetchHospitalOverview());
    dispatch(fetchHospitalAppointments({ status: tab === 'pending' ? 'pending' : undefined, limit: 10 }));
  };

  useEffect(() => {
    if (token) {
      loadOverview();
    }
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

  const statCards = [
    { label: "Today's Appointments", value: overview?.todayAppointments ?? 0, icon: CalendarDays, color: 'text-blue' },
    { label: 'New Bookings', value: overview?.newBookings ?? 0, icon: UserPlus, color: 'text-secondary' },
    { label: 'Pending', value: overview?.pending ?? 0, icon: Clock, color: 'text-warning' },
    { label: 'Confirmed', value: overview?.confirmed ?? 0, icon: CheckCircle2, color: 'text-success' },
    { label: 'Available Slots', value: overview?.availableSlots ?? 0, icon: CalendarClock, color: 'text-blue' },
    { label: 'Total Slots', value: overview?.totalSlots ?? 0, icon: CalendarClock, color: 'text-secondary' },
    { label: 'Active Cards', value: overview?.activeCards ?? 0, icon: Ticket, color: 'text-success' },
    { label: 'Revenue (ETB)', value: overview ? `${Number(overview.revenue || 0).toLocaleString()}` : '0', icon: Wallet, color: 'text-warning' },
  ];

  const visibleAppointments = overview
    ? appointments.filter((a) => (tab === 'pending' ? a.status?.toLowerCase() === 'pending' : true)).slice(0, 10)
    : [];

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <MedText variant="h2" as="h2" className="text-[20px]">Dashboard</MedText>
          <MedText variant="body" className="text-text-secondary mt-1">
            Welcome back, {profile?.name || user?.phone || 'Hospital'}
          </MedText>
        </div>
        <div className="flex items-center gap-2 relative">
          <Bell size={18} className="text-muted" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Overview stat tiles */}
      <MedText variant="body" className="text-[15px] font-medium mb-3">Overview</MedText>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {statCards.map((c) => (
          <MedCard key={c.label} className="h-full">
            <c.icon size={20} className={`${c.color} mb-2`} />
            <MedText variant="h1" as="span" className="text-[24px] block">{c.value}</MedText>
            <MedText variant="metadata">{c.label}</MedText>
          </MedCard>
        ))}
      </div>

      {/* Module links */}
      <MedText variant="body" className="text-[15px] font-medium mb-3">Modules</MedText>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {moduleCards.map((m) => (
          <Link key={m.title} href={m.href}>
            <MedCard className="h-full hover:shadow-md transition-shadow">
              <div
                className="w-11 h-11 rounded-[10px] flex items-center justify-center mb-3"
                style={{ background: `${m.color}14` }}
              >
                <m.icon size={22} color={m.color} />
              </div>
              <MedText variant="body" className="text-[16px] font-semibold">{m.title}</MedText>
              <MedText variant="metadata" className="mt-0.5">{m.desc}</MedText>
            </MedCard>
          </Link>
        ))}
      </div>

      {/* Booking Notifications */}
      <MedCard className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <MedText variant="body" className="text-[15px] font-medium flex items-center gap-2">
            <Bell size={16} className="text-primary" /> Booking Notifications
          </MedText>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[12px] text-primary font-medium hover:underline">
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <MedText variant="body" className="text-text-secondary py-4 text-center">
            No notifications yet
          </MedText>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-2.5 rounded-[10px] ${n.isRead ? 'bg-transparent' : 'bg-primary/5'}`}
              >
                <div className="mt-0.5">
                  {n.isRead ? (
                    <CheckCircle2 size={16} className="text-muted" />
                  ) : (
                    <Bell size={16} className="text-primary" />
                  )}
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

      {/* Patient Booking List */}
      <MedCard>
        <div className="flex justify-between items-center mb-3">
          <MedText variant="body" className="text-[15px] font-medium">Patient Bookings</MedText>
          <div className="flex gap-2">
            <button
              onClick={() => setTab('pending')}
              className={`px-3 py-1 rounded-full text-[12px] font-medium ${tab === 'pending' ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1 rounded-full text-[12px] font-medium ${tab === 'all' ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}
            >
              All
            </button>
          </div>
        </div>

        {!overview ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : visibleAppointments.length === 0 ? (
          <MedText variant="body" className="text-text-secondary py-6 text-center">
            No {tab === 'pending' ? 'pending ' : ''}bookings
          </MedText>
        ) : (
          <div className="space-y-3">
            {visibleAppointments.map((a) => (
              <div key={a.id} className="border border-border rounded-[10px] p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <MedText variant="body" className="text-[14px] font-medium text-text">{a.patientName}</MedText>
                    <MedText variant="metadata" className="mt-0.5">
                      {a.doctorName || 'Doctor'} {a.specialization ? `• ${a.specialization}` : ''}
                    </MedText>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-muted" />
                      <MedText variant="metadata">
                        {a.dateTime ? new Date(a.dateTime).toLocaleString() : 'N/A'}
                        {a.slotStart ? ` • ${a.slotStart}` : ''}
                      </MedText>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-[11px] font-medium ${
                      a.status?.toLowerCase() === 'completed'
                        ? 'bg-success/10 text-success'
                        : a.status?.toLowerCase() === 'cancelled'
                        ? 'bg-error/10 text-error'
                        : a.status?.toLowerCase() === 'accepted'
                        ? 'bg-blue/10 text-blue'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {a.status || 'booked'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </MedCard>
    </div>
  );
}
