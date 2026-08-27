'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { loadStoredAuth, logout } from '@/lib/store/slices/authSlice';
import { fetchHospitalProfile, fetchHospitalStats } from '@/lib/store/slices/hospitalSlice';
import { Gauge, Stethoscope, Users, User, ClipboardList, BarChart3, CreditCard, LogOut, Menu, X, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';

const navItems = [
  { href: '/hospital', label: 'Dashboard', icon: Gauge },
  { href: '/hospital/appointments', label: 'Appointments', icon: ClipboardList },
  { href: '/hospital/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/hospital/packages', label: 'Packages', icon: CreditCard },
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
  const [collapsed, setCollapsed] = useState(false);

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
  const initials = (hospitalName || 'H').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'H';

  if (isRegisterPage) {
    return <>{children}</>;
  }

  const isActive = (href: string) =>
    href === '/hospital' ? pathname === '/hospital' : pathname.startsWith(href);

  const renderNavLinks = (onNavigate?: () => void) =>
    navItems.map((item) => {
      const active = isActive(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-[8px] text-[14px] font-medium transition-colors ${
            collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'
          } ${active ? 'bg-[#E3EFFB] text-[#1565C0]' : 'text-text-secondary hover:bg-foreground/5 hover:text-text'}`}
          title={item.label}
        >
          <item.icon size={20} strokeWidth={active ? 2.2 : 1.8} />
          {!collapsed && <span>{item.label}</span>}
        </Link>
      );
    });

  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop fixed sidebar (like admin) ─────────────── */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 bottom-0 z-40 flex-col bg-surface border-r border-border transition-[width] duration-200 ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        {/* Brand */}
        <div className={`flex items-center border-b border-border min-h-[68px] ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          <Link href="/hospital" className="flex items-center gap-2 overflow-hidden">
            <Image src="/bm-booking-logo.png" alt="BM" width={36} height={36} className="w-9 h-9 rounded-[10px] object-cover shrink-0" />
            {!collapsed && <span className="text-[18px] font-bold text-primary truncate">Hospital Portal</span>}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-[6px] border border-border text-text-secondary hover:bg-foreground/5"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto flex flex-col gap-1 ${collapsed ? 'px-3 py-4' : 'px-3 py-4'}`}>
          {renderNavLinks()}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="flex items-center justify-center px-2 py-3 rounded-[8px] text-text-secondary hover:bg-foreground/5"
              title="Expand sidebar"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </nav>

        {/* Hospital + logout */}
        <div className="border-t border-border p-3 flex flex-col gap-2">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : 'px-1'}`}>
            <div className="w-9 h-9 rounded-full bg-[#E3EFFB] flex items-center justify-center text-[13px] font-bold text-[#1565C0] shrink-0 overflow-hidden">
              {profile?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.image} alt={hospitalName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-text truncate">{hospitalName}</p>
                <p className="text-[11px] text-muted truncate">{stats ? `${stats.doctors || 0} doctors` : 'Hospital'}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => { dispatch(logout()); router.push('/login'); }}
            className={`flex items-center gap-2.5 rounded-[8px] text-[14px] font-medium text-error hover:bg-error-bg transition-colors ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}`}
            title="Logout"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile header ──────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
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
      </header>

      {/* ── Mobile menu overlay ────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/20" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-[52px] left-0 right-0 bg-surface border-b border-border p-3 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all ${
                  isActive(item.href) ? 'bg-[#E3EFFB] text-[#1565C0]' : 'text-text-secondary hover:bg-foreground/5'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
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

      {/* ── Main content (offset for desktop sidebar) ──────── */}
      <main className={`min-h-screen ${collapsed ? 'lg:pl-[68px]' : 'lg:pl-[240px]'}`}>
        <div className="lg:hidden pb-20" />
        {children}
      </main>

      {/* Bottom nav for mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 flex justify-around py-2 px-1">
        {navItems.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                active ? 'text-[#1565C0]' : 'text-muted'
              }`}
            >
              <item.icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
