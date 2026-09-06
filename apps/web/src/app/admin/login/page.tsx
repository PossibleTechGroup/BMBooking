'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { adminLogin, clearError, logout } from '@/lib/store/slices/authSlice';
import { Eye, EyeOff, Lock, Mail, Loader2, LogIn, ShieldCheck, ArrowLeft } from 'lucide-react';

const errorMessages: Record<string, string> = {
  errorInvalidCredentials: 'Invalid email or password. Please check and try again.',
  errorAccountLocked: 'Account locked. Please try again later.',
  errorGeneric: 'Something went wrong. Please try again.',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, user } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && user.role === 'admin') {
      router.push('/admin');
    }
  }, [user, router]);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    dispatch(clearError());
    dispatch(adminLogin({ email: email.trim(), password }));
  };

  const handleLogout = async () => {
    await dispatch(logout());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div style={{ width: '100%', maxWidth: '420px' }} className="animate-fade">

        {user && user.role !== 'admin' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFF7ED', color: '#9A3412', padding: '11px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', border: '1px solid #FDBA74' }}>
            You&rsquo;re signed in as a different account.
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-main)' }}>
              Switch
            </button>
          </div>
        )}

        <button onClick={() => { router.push('/login'); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, padding: '0', marginBottom: '18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)' }}>
          <ArrowLeft size={16} />
          Back to login
        </button>

        <div style={{ padding: '40px 36px', background: 'var(--surface)', borderRadius: '20px', boxShadow: '0 20px 50px -12px rgba(11, 30, 51, 0.18)', border: '1px solid rgba(216, 227, 240, 0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--accent-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              <Image src="/bm-booking-logo.png" alt="BM Booking" width={100} height={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Platform Admin</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Full access to manage the platform</div>
            </div>
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>Enter your admin credentials to continue to the dashboard.</div>

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Email</label>
          <div style={{ position: 'relative', marginBottom: '18px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', pointerEvents: 'none' }}>
              <Mail size={18} />
            </span>
            <input
              type="email"
              placeholder="admin@bm-booking.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); dispatch(clearError()); }}
              autoComplete="email"
              style={{ width: '100%', padding: '13px 16px 13px 42px', fontSize: '15px', border: '1px solid var(--border)', borderRadius: '12px', outline: 'none', background: 'var(--surface)', color: 'var(--text-primary)', transition: 'border-color 0.15s ease, box-shadow 0.15s ease', fontFamily: 'var(--font-main)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(21, 101, 192, 0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Password</label>
          <div style={{ position: 'relative', marginBottom: '18px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', pointerEvents: 'none' }}>
              <Lock size={18} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); dispatch(clearError()); }}
              autoComplete="current-password"
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              style={{ width: '100%', padding: '13px 46px 13px 42px', fontSize: '15px', border: '1px solid var(--border)', borderRadius: '12px', outline: 'none', background: 'var(--surface)', color: 'var(--text-primary)', transition: 'border-color 0.15s ease, box-shadow 0.15s ease', fontFamily: 'var(--font-main)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(21, 101, 192, 0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              onMouseDown={(e) => e.preventDefault()}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF3F2', color: 'var(--status-error)', padding: '11px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '18px', border: '1px solid #FECDCA' }}>
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              {errorMessages[error] || error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={!email.trim() || !password || loading}
            style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1E88E5 100%)', border: 'none', borderRadius: '12px', cursor: !email.trim() || !password || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', opacity: !email.trim() || !password || loading ? 0.6 : 1, fontFamily: 'var(--font-main)' }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '20px' }}>
            <ShieldCheck size={14} />
            Authorized administrators only
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '20px' }}>
          <Link href="/login" style={{ textDecoration: 'none', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600 }}>
            Hospital Portal
          </Link>
          <span>&middot;</span>
          <Link href="/hospital/register" style={{ textDecoration: 'none', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600 }}>
            Register your hospital
          </Link>
        </div>
      </div>
    </div>
  );
}