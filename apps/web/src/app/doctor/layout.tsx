'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { loadStoredAuth, logout } from '@/lib/store/slices/authSlice';
import { fetchDoctorStats, fetchDoctorAppointments } from '@/lib/store/slices/appointmentSlice';
import { TopNav } from '@/components/layout/top-nav';
import { DesktopLayout } from '@/components/layout/desktop-layout';
import { LeftSidebar } from '@/components/layout/left-sidebar';
import { RightSidebar } from '@/components/layout/right-sidebar';
import { Gauge, FileText, Calendar, User, LogOut, Menu, X } from 'lucide-react';

const navItems = [
  { href: '/doctor', label: 'Dashboard', icon: Gauge },
  { href: '/doctor/appointments', label: 'Appointments', icon: FileText },
  { href: '/doctor/schedule', label: 'Schedule', icon: Calendar },
  { href: '/doctor/profile', label: 'Profile', icon: User },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((s) => s.auth);
  const { stats, appointments } = useAppSelector((s) => s.appointment);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) dispatch(loadStoredAuth());
  }, [dispatch, token]);

  useEffect(() => {
    if (!token && typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_token');
      if (!stored) router.push('/login');
    }
  }, [token, router]);

  useEffect(() => {
    if (token) {
      dispatch(fetchDoctorStats());
      dispatch(fetchDoctorAppointments({ status: 'pending', limit: 10 }));
    }
  }, [dispatch, token]);

  const doctorName = user?.doctorProfile?.fullName || user?.phone || 'Doctor';
  const specializations = user?.doctorProfile?.specializations || [];
  const rating = user?.doctorProfile?.rating;

  const upcomingEvents = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'accepted' || a.status === 'pending')
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        title: a.patient?.patientProfile?.fullName || 'Patient',
        time: new Date(a.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: a.status as 'pending' | 'accepted',
      }));
  }, [appointments]);

  const leftPanel = (
    <LeftSidebar
      name={doctorName}
      role="doctor"
      subtitle={user?.doctorProfile?.clinicName}
      avatar={user?.doctorProfile?.profilePicture}
      rating={rating}
      stats={[
        { label: 'Today', value: stats?.todayAppointments || 0 },
        { label: 'Pending', value: stats?.pendingRequests || 0 },
        { label: 'Done', value: stats?.totalCompleted || 0 },
      ]}
      pills={specializations.length > 0 ? specializations : ['General Practice']}
      profileLink="/doctor/profile"
    />
  );

  const rightPanel = (
    <RightSidebar
      events={upcomingEvents}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <TopNav navItems={navItems} portalLabel="Doctor Portal" />

      <div className="hidden lg:block">
        <DesktopLayout left={leftPanel} center={children} right={rightPanel} />
      </div>

      {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-40 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/bm-booking-logo.png" alt="BM" width={32} height={32} className="w-8 h-8 rounded-[8px] object-cover" />
          <div>
            <h1 className="text-[16px] font-bold text-primary">BM</h1>
            <p className="text-[10px] text-muted">Doctor Portal</p>
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/20" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-[52px] left-0 right-0 bg-surface border-b border-border p-3 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const isActive = item.href === '/doctor' ? pathname === '/doctor' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all ${
                    isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-foreground/5'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => { dispatch(logout()); router.push('/login'); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-error hover:bg-error-bg w-full"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Mobile content */}
      <main className="lg:hidden min-h-screen pb-20">
        {children}
      </main>

      {/* Bottom nav for mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 flex justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = item.href === '/doctor' ? pathname === '/doctor' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted'
              }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
