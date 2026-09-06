'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { requestOtp, verifyOtp, hospitalPortalLogin, adminLogin, clearError } from '@/lib/store/slices/authSlice';
import { User, Stethoscope, Building2, Eye, EyeOff, Lock, ShieldCheck, CalendarCheck, Loader2, LogIn, ArrowLeft } from 'lucide-react';

const errorMessages: Record<string, string> = {
  errorHospitalPending: 'Your hospital registration is pending admin approval. Please try again later.',
  errorHospitalRejected: 'Your hospital registration was rejected. Please contact support.',
  errorHospitalFormRequired: 'Hospitals must complete the hospital registration form before logging in.',
  errorHospitalNoProfile: 'No hospital is linked to this account. Please contact support.',
  errorInvalidCredentials: 'Invalid username or password. Please check and try again.',
  errorAlreadyRegistered: 'This phone number is already registered. Please log in instead.',
  errorRoleConflict: 'This phone is registered with a different role. Please log in directly.',
  errorInvalidPhone: 'Please enter a valid phone number.',
  errorOtpInvalid: 'Invalid OTP. Please check the code and try again.',
  errorOtpExpired: 'This OTP has expired. Please request a new one.',
  errorOtpUsed: 'This OTP has already been used.',
  errorOtpSend: 'Failed to send OTP. Please try again.',
  errorAccountLocked: 'Account locked. Please try again later.',
  errorRoleRequired: 'Please select your role to continue.',
  errorGeneric: 'Something went wrong. Please try again.',
};

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, otpSent, user, doctorProfileStatus } = useAppSelector((s) => s.auth);

  const [view, setView] = useState<'portal' | 'otp'>('portal');
  const [otpStep, setOtpStep] = useState<'phone' | 'role' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor' | null>(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'hospital' || user.role === 'receptionist') {
        router.push('/hospital');
      } else if (user.role === 'doctor') {
        if (doctorProfileStatus === 'None' || doctorProfileStatus === 'Rejected') {
          router.push('/doctor/setup');
        } else if (doctorProfileStatus === 'PendingReview') {
          router.push('/doctor/pending');
        } else {
          router.push('/doctor');
        }
      } else {
        router.push('/patient');
      }
    }
  }, [user, doctorProfileStatus, router]);

  useEffect(() => {
    if (otpSent) {
      setOtpStep('otp');
    }
  }, [otpSent]);

  const isPhoneValid = /^[79]\d{8}$/.test(phone);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) return;
    dispatch(clearError());
    if (identifier.includes('@')) {
      dispatch(adminLogin({ email: identifier.trim(), password }));
    } else {
      dispatch(hospitalPortalLogin({ identifier: identifier.trim(), password }));
    }
  };

  const handleRequestOtp = async () => {
    if (!isPhoneValid) return;
    dispatch(clearError());
    const result = await dispatch(requestOtp({ phone: `+251${phone}`, isRegistration: false }));
    if (requestOtp.rejected.match(result)) {
      if (result.payload === 'errorRoleRequired') setOtpStep('role');
    }
  };

  const handleRegisterWithRole = async () => {
    if (!role) return;
    dispatch(requestOtp({ phone: `+251${phone}`, role, isRegistration: true }));
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    dispatch(clearError());

    if (value && index < 5) {
      const next = document.querySelector(`input[name="otp-${index + 1}"]`) as HTMLInputElement;
      next?.focus();
    }

    const code = newDigits.join('');
    if (code.length === 6) {
      dispatch(verifyOtp({ phone: `+251${phone}`, code, role: role || undefined, isRegistration: !!role }));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prev = document.querySelector(`input[name="otp-${index - 1}"]`) as HTMLInputElement;
      prev?.focus();
    }
  };

  const heroFeatures = [
    { icon: CalendarCheck, text: 'Appointments, patients & scheduling' },
    { icon: ShieldCheck, text: 'Role-based staff access & permissions' },
    { icon: Building2, text: 'Hospital profile, services & equipment' },
  ];

  return (
    <div className="login-page">
      {/* Left Hero Panel */}
      <aside className="login-hero">
        <div className="login-hero-top">
          <img src="/bm-booking-logo.png" alt="BM Booking" className="login-hero-logo" />
          <span className="login-hero-brand">BM Hub</span>
        </div>

        <div className="login-hero-body">
          <h1 className="login-hero-title">Hospital Portal</h1>
          <p className="login-hero-text">
            Sign in to manage your hospital. One account for owners and staff — access is decided by your role and permissions.
          </p>
          <ul className="login-hero-features">
            <li>
              <CalendarCheck size={18} />
              <span>Appointments, patients &amp; scheduling</span>
            </li>
            <li>
              <ShieldCheck size={18} />
              <span>Role-based staff access &amp; permissions</span>
            </li>
            <li>
              <Building2 size={18} />
              <span>Hospital profile, services &amp; equipment</span>
            </li>
          </ul>
        </div>

        <div className="login-hero-foot">
          <span className="login-hero-chip">
            <Stethoscope size={14} /> Secure &amp; trusted by hospitals
          </span>
        </div>
      </aside>

      {/* Right Form Side */}
      <div className="login-form-side">
        <div style={{ width: '100%', maxWidth: '420px', padding: '40px 36px', background: 'var(--surface)', borderRadius: '20px', boxShadow: '0 20px 50px -12px rgba(11, 30, 51, 0.18)', border: '1px solid rgba(216, 227, 240, 0.7)' }} className="animate-fade">

          {view === 'portal' ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--accent-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <img src="/bm-booking-logo.png" alt="BM Booking" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Hospital Portal</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sign in to manage your hospital</div>
                </div>
              </div>

              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>One sign-in for hospital owners, staff and platform administrators.</div>

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Username or Phone Number</label>
              <div style={{ position: 'relative', marginBottom: '18px' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', pointerEvents: 'none' }}>
                  <Building2 size={18} />
                </span>
                <input
                  type="text"
                  placeholder="username or phone number"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); dispatch(clearError()); }}
                  autoComplete="username"
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
                disabled={!identifier.trim() || !password || loading}
                style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1E88E5 100%)', border: 'none', borderRadius: '12px', cursor: !identifier.trim() || !password || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', opacity: !identifier.trim() || !password || loading ? 0.6 : 1, fontFamily: 'var(--font-main)' }}
              >
                {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <button onClick={() => { setView('otp'); setOtpStep('phone'); setPhone(''); setRole(null); setOtpDigits(['', '', '', '', '', '']); dispatch(clearError()); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', marginTop: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'var(--font-main)' }}>
                <User size={15} style={{ color: 'var(--accent-primary)' }} />
                Patients &amp; doctors — sign in with phone
              </button>

              <Link href="/hospital/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', textDecoration: 'none', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, marginTop: '12px' }}>
                Don&rsquo;t have a hospital account? Register your hospital
              </Link>

              <Link href="/admin/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '12px' }}>
                <ShieldCheck size={14} />
                Platform Admin
              </Link>
            </div>
          ) : (
            <div>
              <button onClick={() => { setView('portal'); dispatch(clearError()); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, padding: '0', marginBottom: '18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)' }}>
                <ArrowLeft size={16} />
                Back to Hospital Portal
              </button>

              {otpStep === 'phone' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--accent-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      <img src="/bm-booking-logo.png" alt="BM Booking" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Welcome back</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sign in to your account</div>
                    </div>
                  </div>

                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>Enter your phone number to continue</div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Phone Number</label>
                  <div style={{ position: 'relative', marginBottom: '18px' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', pointerEvents: 'none' }}>
                      <LogIn size={18} />
                    </span>
                    <input
                      type="tel"
                      placeholder="912 345 678"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/[^0-9]/g, '')); dispatch(clearError()); }}
                      maxLength={9}
                      style={{ width: '100%', padding: '13px 16px 13px 42px', fontSize: '15px', border: '1px solid var(--border)', borderRadius: '12px', outline: 'none', background: 'var(--surface)', color: 'var(--text-primary)', transition: 'border-color 0.15s ease, box-shadow 0.15s ease', fontFamily: 'var(--font-main)' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(21, 101, 192, 0.12)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF3F2', color: 'var(--status-error)', padding: '11px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '18px', border: '1px solid #FECDCA' }}>
                      <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                      {errorMessages[error] || error}
                    </div>
                  )}

                  <button
                    onClick={handleRequestOtp}
                    disabled={!isPhoneValid || loading}
                    style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1E88E5 100%)', border: 'none', borderRadius: '12px', cursor: !isPhoneValid || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', opacity: !isPhoneValid || loading ? 0.6 : 1, fontFamily: 'var(--font-main)' }}
                  >
                    {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
                    {loading ? 'Sending...' : 'Continue'}
                  </button>
                </div>
              )}

              {otpStep === 'role' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--accent-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      <img src="/bm-booking-logo.png" alt="BM Booking" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Register</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Select your role to get started</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <button
                      onClick={() => setRole('patient')}
                      style={{ padding: '20px', borderRadius: '16px', border: `2px solid ${role === 'patient' ? 'var(--accent-primary)' : 'var(--border)'}`, background: role === 'patient' ? 'var(--accent-bg)' : 'var(--surface)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-main)' }}
                    >
                      <User size={28} style={{ color: role === 'patient' ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '12px', marginBottom: '4px' }}>Patient</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Book appointments and access healthcare services</div>
                    </button>

                    <button
                      onClick={() => setRole('doctor')}
                      style={{ padding: '20px', borderRadius: '16px', border: `2px solid ${role === 'doctor' ? 'var(--accent-primary)' : 'var(--border)'}`, background: role === 'doctor' ? 'var(--accent-bg)' : 'var(--surface)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-main)' }}
                    >
                      <Stethoscope size={28} style={{ color: role === 'doctor' ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '12px', marginBottom: '4px' }}>Doctor</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage your practice and appointments</div>
                    </button>
                  </div>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF3F2', color: 'var(--status-error)', padding: '11px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '18px', border: '1px solid #FECDCA' }}>
                      <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                      {errorMessages[error] || error}
                    </div>
                  )}

                  <button
                    onClick={handleRegisterWithRole}
                    disabled={!role || loading}
                    style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1E88E5 100%)', border: 'none', borderRadius: '12px', cursor: !role || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', opacity: !role || loading ? 0.6 : 1, fontFamily: 'var(--font-main)' }}
                  >
                    {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
                    {loading ? 'Sending...' : 'Continue'}
                  </button>

                  <Link href="/hospital/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', textDecoration: 'none', fontSize: '14px', color: 'var(--accent-primary)', marginTop: '16px' }}>
                    <Building2 size={16} />
                    Registering a hospital? Use the hospital form
                  </Link>

                  <button onClick={() => { setOtpStep('phone'); setRole(null); dispatch(clearError()); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, marginTop: '16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'var(--font-main)' }}>
                    Back
                  </button>
                </div>
              )}

              {otpStep === 'otp' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--accent-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      <img src="/bm-booking-logo.png" alt="BM Booking" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Verify OTP</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Enter the 6-digit code sent to +251{phone}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        name={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpInput(i, e.target.value.replace(/[^0-9]/g, ''))}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        style={{ width: '48px', height: '56px', textAlign: 'center', fontSize: '22px', fontWeight: 700, borderRadius: '12px', border: '2px solid var(--border)', background: 'var(--surface)', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'var(--font-main)', color: 'var(--text-primary)' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                      />
                    ))}
                  </div>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF3F2', color: 'var(--status-error)', padding: '11px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '18px', border: '1px solid #FECDCA' }}>
                      <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                      {errorMessages[error] || error}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const code = otpDigits.join('');
                      if (code.length === 6) {
                        dispatch(verifyOtp({ phone: `+251${phone}`, code, role: role || undefined, isRegistration: !!role }));
                      }
                    }}
                    disabled={otpDigits.join('').length < 6 || loading}
                    style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1E88E5 100%)', border: 'none', borderRadius: '12px', cursor: otpDigits.join('').length < 6 || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', opacity: otpDigits.join('').length < 6 || loading ? 0.6 : 1, fontFamily: 'var(--font-main)' }}
                  >
                    {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>

                  <button onClick={() => { setOtpStep(role ? 'role' : 'phone'); setOtpDigits(['', '', '', '', '', '']); dispatch(clearError()); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, marginTop: '16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'var(--font-main)' }}>
                    Change phone number
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}