'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { loadStoredAuth, logout } from '@/lib/store/slices/authSlice';
import { Gauge, Stethoscope, Users, Building2, Settings, LogOut, Menu, X, ChevronLeft, ChevronRight, ShieldCheck, BarChart3, ClipboardList, Briefcase, Package, Megaphone, Star, Banknote, Clock } from 'lucide-react';
import { useTimeFormat, setTimeFormat, setCalendarFormat } from '@/lib/utils/timeFormat';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: Gauge },
  { href: '/admin/analysis', label: 'Analysis', icon: BarChart3 },
  { href: '/admin/reports', label: 'Reports', icon: ClipboardList },
  { href: '/admin/hospitals', label: 'Hospitals', icon: Building2 },
  { href: '/admin/applied-hospitals', label: 'Applied Hospitals', icon: Briefcase },
  { href: '/admin/medical-tools', label: 'Medical Tools', icon: Package },
  { href: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/patients', label: 'Patients', icon: Users },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/payouts', label: 'Payouts', icon: Banknote },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((s) => s.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { isEthiopian, isEthiopianCalendar } = useTimeFormat();
  const isAdminLoginPage = pathname.includes('/admin/login');

  useEffect(() => {
    if (!token) dispatch(loadStoredAuth());
  }, [dispatch, token]);

  useEffect(() => {
    if (isAdminLoginPage) return;
    if (!token && typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_token');
      if (!stored) {
        router.push('/login');
      }
    }
  }, [token, router, isAdminLoginPage]);

  useEffect(() => {
    if (token && user && user.role !== 'admin' && !isAdminLoginPage && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user_data');
      let storedRole: string | null = null;
      try {
        storedRole = storedUser ? (JSON.parse(storedUser) as any).role : null;
      } catch {
        storedRole = null;
      }
      if (storedRole !== 'admin') {
        router.push('/login');
      }
    }
  }, [token, user, router]);

  const adminName = user?.email || 'Admin';
  const initials = 'A';

  if (isAdminLoginPage) {
    return <>{children}</>;
  }

  if (!token || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted animate-pulse">Loading admin portal...</div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

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
      {/* ── Desktop fixed sidebar ──────────────────────────── */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 bottom-0 z-40 flex-col bg-surface border-r border-border transition-[width] duration-200 ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        <div className={`flex items-center border-b border-border min-h-[68px] ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          <Link href="/admin" className="flex items-center gap-2 overflow-hidden">
            <Image src="/bm-booking-logo.png" alt="BM" width={36} height={36} className="w-9 h-9 rounded-[10px] object-cover shrink-0" />
            {!collapsed && <span className="text-[18px] font-bold text-primary truncate">Admin Portal</span>}
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

        <nav className="flex-1 overflow-y-auto flex flex-col gap-1 px-3 py-4">
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

        <div className="border-t border-border p-3 flex flex-col gap-2">
          {!collapsed && (
            <div className="relative">
              <button
                onClick={() => setShowSettings((p) => !p)}
                className={`flex items-center gap-2.5 rounded-[8px] text-[13px] font-medium transition-colors px-3 py-2.5 ${
                  isEthiopian || isEthiopianCalendar
                    ? 'bg-[#F3E8FF] text-[#7C3AED] hover:bg-[#EDE3FF]'
                    : 'bg-[#EFF6FF] text-[#1565C0] hover:bg-[#E3EFFB]'
                }`}
                title="Time & calendar format"
              >
                <Clock size={16} />
                <span>{isEthiopian ? 'ቀን/ሌሊት' : 'AM/PM'} · {isEthiopianCalendar ? 'Eth. cal' : 'Greg.'}</span>
              </button>
              {showSettings && (
                <>
                  <div className="fixed inset-0 z-50" onClick={() => setShowSettings(false)} />
                  <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-white rounded-lg shadow-lg border border-border p-1">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-muted uppercase">Time</div>
                    <button
                      onClick={() => { setTimeFormat('western'); setShowSettings(false); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-[13px] ${!isEthiopian ? 'bg-[#EFF6FF] text-[#1565C0] font-semibold' : 'text-text-secondary hover:bg-foreground/5'}`}
                    >
                      Standard (AM/PM)
                    </button>
                    <button
                      onClick={() => { setTimeFormat('ethiopian'); setShowSettings(false); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-[13px] ${isEthiopian ? 'bg-[#F3E8FF] text-[#7C3AED] font-semibold' : 'text-text-secondary hover:bg-foreground/5'}`}
                    >
                      Ethiopian (ቀን/ሌሊት)
                    </button>
                    <div className="h-px bg-border my-1.5" />
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-muted uppercase">Calendar</div>
                    <button
                      onClick={() => { setCalendarFormat('gregorian'); setShowSettings(false); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-[13px] ${!isEthiopianCalendar ? 'bg-[#EFF6FF] text-[#1565C0] font-semibold' : 'text-text-secondary hover:bg-foreground/5'}`}
                    >
                      Gregorian
                    </button>
                    <button
                      onClick={() => { setCalendarFormat('ethiopian'); setShowSettings(false); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-[13px] ${isEthiopianCalendar ? 'bg-[#F3E8FF] text-[#7C3AED] font-semibold' : 'text-text-secondary hover:bg-foreground/5'}`}
                    >
                      Ethiopian
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : 'px-1'}`}>
            <div className="w-9 h-9 rounded-full bg-[#E3EFFB] flex items-center justify-center text-[13px] font-bold text-[#1565C0] shrink-0">
              <ShieldCheck size={17} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-text truncate">{adminName}</p>
                <p className="text-[11px] text-muted truncate">Platform Admin</p>
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
            <p className="text-[10px] text-muted">Admin Portal</p>
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

      {/* ── Main content ───────────────────────────────────── */}
      <main className={`min-h-screen ${collapsed ? 'lg:pl-[68px]' : 'lg:pl-[240px]'}`}>
        <div className="lg:hidden pb-20" />
        {children}
      </main>

      {/* ── Bottom nav for mobile ──────────────────────────── */}
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