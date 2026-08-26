'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { loadStoredAuth, fetchDoctorProfileStatus } from '@/lib/store/slices/authSlice';
import { fetchDoctorStats, fetchDoctorAppointments } from '@/lib/store/slices/appointmentSlice';
import { TopNav } from '@/components/layout/top-nav';
import { DesktopLayout } from '@/components/layout/desktop-layout';
import { LeftSidebar } from '@/components/layout/left-sidebar';
import { RightSidebar } from '@/components/layout/right-sidebar';
import { Gauge, FileText, Calendar, User } from 'lucide-react';

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
  const { user, token, doctorProfileStatus } = useAppSelector((s) => s.auth);
  const { stats, appointments } = useAppSelector((s) => s.appointment);

  useEffect(() => {
    if (!token) dispatch(loadStoredAuth());
  }, [dispatch, token]);

  useEffect(() => {
    if (token && !user) {
      dispatch(loadStoredAuth());
    }
  }, [dispatch, token, user]);

  useEffect(() => {
    if (!token && typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_token');
      if (!stored) router.push('/login');
    }
  }, [token, router]);

  useEffect(() => {
    if (token && user?.role === 'doctor') {
      dispatch(fetchDoctorProfileStatus());
    }
  }, [dispatch, token, user]);

  useEffect(() => {
    if (!user || user.role !== 'doctor') return;
    if (pathname.startsWith('/doctor/onboarding') || pathname.startsWith('/doctor/setup') || pathname.startsWith('/doctor/pending')) return;
    if (doctorProfileStatus === 'None' || doctorProfileStatus === 'Rejected') {
      router.push('/doctor/onboarding');
    } else if (doctorProfileStatus === 'PendingReview') {
      router.push('/doctor/pending');
    }
  }, [user, doctorProfileStatus, pathname, router]);

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

  const isOnboardingPage = pathname.startsWith('/doctor/onboarding') || pathname.startsWith('/doctor/pending');

  if (isOnboardingPage) {
    return <>{children}</>;
  }

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
