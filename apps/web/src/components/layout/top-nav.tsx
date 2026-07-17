'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logout } from '@/lib/store/slices/authSlice';
import { Search, Bell, ChevronDown, LogOut } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }>;
}

interface TopNavProps {
  navItems: NavItem[];
  portalLabel?: string;
}

export function TopNav({ navItems, portalLabel }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayName = user?.role === 'doctor'
    ? user?.doctorProfile?.fullName || user?.phone
    : user?.patientProfile?.fullName || user?.phone;

  return (
    <header className="hidden lg:flex sticky top-0 z-50 h-[80px] bg-surface border-b border-border items-center px-6 gap-4">
      <Link href={user?.role === 'doctor' ? '/doctor' : '/patient'} className="flex items-center gap-2 shrink-0">
        <Image src="/bm-booking-logo.png" alt="BM Booking" width={36} height={36} className="w-9 h-9 rounded-[10px] object-cover" />
        <span className="text-[18px] font-bold text-primary tracking-[-0.3px]">BM</span>
      </Link>

      <nav className="flex items-center gap-1 ml-auto">
        {navItems.map((item) => {
          const isActive = item.href.endsWith('/')
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center w-10 h-10 rounded-[10px] transition-all ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-foreground/5 hover:text-text-secondary'
              }`}
              title={item.label}
            >
              <item.icon size={20} strokeWidth={isActive ? 2 : 1.8} />
            </Link>
          );
        })}
      </nav>

      <button className="relative flex items-center justify-center w-10 h-10 rounded-[10px] text-muted hover:bg-foreground/5 hover:text-text-secondary transition-all ml-1">
        <Bell size={20} />
        <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
      </button>

      <div className="relative ml-2">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-foreground/5 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-[13px] font-semibold text-primary">
            {displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="text-left hidden xl:block">
            <p className="text-[13px] font-medium text-text leading-tight">{displayName || 'User'}</p>
            {portalLabel && <p className="text-[11px] text-muted leading-tight">{portalLabel}</p>}
          </div>
          <ChevronDown size={14} className="text-muted hidden xl:block" />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-[12px] shadow-lg z-50 py-1 overflow-hidden">
              <Link
                href={user?.role === 'doctor' ? '/doctor/profile' : '/patient/profile'}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-text-secondary hover:bg-foreground/5 transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={() => { dispatch(logout()); router.push('/login'); }}
                className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-error hover:bg-error-bg w-full transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
