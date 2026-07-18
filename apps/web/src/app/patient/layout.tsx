'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { loadStoredAuth, fetchPatientProfileStatus } from '@/lib/store/slices/authSlice';
import { fetchDoctors } from '@/lib/store/slices/doctorSlice';
import { fetchMyAppointments } from '@/lib/store/slices/appointmentSlice';
import { TopNav } from '@/components/layout/top-nav';
import { DesktopLayout } from '@/components/layout/desktop-layout';
import { LeftSidebar } from '@/components/layout/left-sidebar';
import { RightSidebar } from '@/components/layout/right-sidebar';
import { Grid3X3, Users, Cpu, Calendar, User } from 'lucide-react';

const navItems = [
  { href: '/patient', label: 'Services', icon: Grid3X3 },
  { href: '/patient/doctors', label: 'Doctors', icon: Users },
  { href: '/patient/equipment', label: 'Equipment', icon: Cpu },
  { href: '/patient/appointments', label: 'Appointments', icon: Calendar },
  { href: '/patient/profile', label: 'Profile', icon: User },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, token, patientProfileStatus } = useAppSelector((s) => s.auth);
  const { doctors } = useAppSelector((s) => s.doctors);
  const { appointments } = useAppSelector((s) => s.appointment);

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
    if (token && user?.role === 'patient') {
      dispatch(fetchPatientProfileStatus());
    }
  }, [dispatch, token, user]);

  useEffect(() => {
    if (!user || user.role !== 'patient') return;
    if (pathname.startsWith('/patient/onboarding')) return;
    if (patientProfileStatus === 'None') {
      router.push('/patient/onboarding');
    }
  }, [user, patientProfileStatus, pathname, router]);

  useEffect(() => {
    dispatch(fetchDoctors());
    dispatch(fetchMyAppointments());
  }, [dispatch]);

  const userName = user?.patientProfile?.fullName || user?.phone || 'Guest';

  const upcomingEvents = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'accepted' || a.status === 'pending')
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        title: a.doctor?.fullName || 'Doctor',
        time: new Date(a.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: a.status as 'pending' | 'accepted',
      }));
  }, [appointments]);

  const specializations = useMemo(() => {
    const specs = appointments
      .map((a) => a.doctor?.specialization)
      .filter((s): s is string => !!s);
    return [...new Set(specs)].slice(0, 5);
  }, [appointments]);

  const isOnboardingPage = pathname.startsWith('/patient/onboarding');

  if (isOnboardingPage) {
    return <>{children}</>;
  }

  const leftPanel = (
    <LeftSidebar
      name={userName}
      role="patient"
      stats={[
        { label: 'Doctors', value: doctors.length },
        { label: 'Appointments', value: appointments.length },
        { label: 'Active', value: appointments.filter((a) => a.status === 'accepted').length },
      ]}
      pills={specializations.length > 0 ? specializations : ['No visits yet']}
      profileLink="/patient/profile"
    />
  );

  const rightPanel = (
    <RightSidebar
      events={upcomingEvents}
      actionLabel="Book Appointment"
      onAction={() => router.push('/patient/doctors')}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <TopNav navItems={navItems} />

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
          const isActive = item.href === '/patient' ? pathname === '/patient' : pathname.startsWith(item.href);
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
