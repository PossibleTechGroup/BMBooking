'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { loadStoredAuth, logout } from '@/lib/store/slices/authSlice';
import { fetchHospitalProfile, fetchHospitalStats } from '@/lib/store/slices/hospitalSlice';
import { TopNav } from '@/components/layout/top-nav';
import { DesktopLayout } from '@/components/layout/desktop-layout';
import { LeftSidebar } from '@/components/layout/left-sidebar';
import { Gauge, Stethoscope, Users, User, LogOut, Menu, X } from 'lucide-react';

const navItems = [
  { href: '/hospital', label: 'Dashboard', icon: Gauge },
  { href: '/hospital/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/hospital/receptionists', label: 'Receptionists', icon: Users },
  { href: '/hospital/profile', label: 'Profile', icon: User },
];

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((s) => s.auth);
  const { profile, stats } = useAppSelector((s) => s.hospital);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) dispatch(loadStoredAuth());
  }, [dispatch, token]);

  useEffect(() => {
    if (!token && typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_token');
      if (!stored && !pathname.includes('/hospital/register')) {
        router.push('/login');
      }
    }
  }, [token, router, pathname]);

  useEffect(() => {
    if (token) {
      dispatch(fetchHospitalProfile());
      dispatch(fetchHospitalStats());
    }
  }, [dispatch, token]);

  const isRegisterPage = pathname.includes('/hospital/register');
  const hospitalName = profile?.name || user?.hospitalProfile?.hospital?.name || user?.phone || 'Hospital';

  if (isRegisterPage) {
    return <>{children}</>;
  }

  const leftPanel = (
    <LeftSidebar
      name={hospitalName}
      role="hospital"
      subtitle={profile?.address || 'Hospital account'}
      avatar={profile?.image}
      stats={[
        { label: 'Doctors', value: stats?.doctors || 0 },
        { label: 'Pending', value: stats?.pendingDoctors || 0 },
        { label: 'Receptionists', value: stats?.receptionists || 0 },
      ]}
      profileLink="/hospital/profile"
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <TopNav navItems={navItems} portalLabel="Hospital Portal" />

      <div className="hidden lg:block">
        <DesktopLayout left={leftPanel} center={children} right={<div />} />
      </div>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/bm-booking-logo.png" alt="BM" width={32} height={32} className="w-8 h-8 rounded-[8px] object-cover" />
          <div>
            <h1 className="text-[16px] font-bold text-primary">BM</h1>
            <p className="text-[10px] text-muted">Hospital Portal</p>
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
              const isActive = item.href === '/hospital' ? pathname === '/hospital' : pathname.startsWith(item.href);
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
          const isActive = item.href === '/hospital' ? pathname === '/hospital' : pathname.startsWith(item.href);
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
