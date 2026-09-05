'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { requestOtp, verifyOtp, hospitalLogin, receptionistLogin, clearError } from '@/lib/store/slices/authSlice';
import { MedText } from '@/components/ui/med-text';
import { MedButton } from '@/components/ui/med-button';
import { User, Stethoscope, Building2, Eye, EyeOff, Lock, ShieldCheck, CalendarCheck, CalendarDays, Loader2, LogIn, ArrowLeft, UserCog } from 'lucide-react';

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

type AuthStep = 'phone' | 'role' | 'otp' | 'hospital-login' | 'receptionist-login';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, otpSent, user, doctorProfileStatus } = useAppSelector((s) => s.auth);

  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor' | null>(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [hospitalPhone, setHospitalPhone] = useState('');
  const [hospitalPassword, setHospitalPassword] = useState('');
  const [showHospitalPassword, setShowHospitalPassword] = useState(false);
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'hospital' || user.role === 'receptionist') {
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
      setStep('otp');
    }
  }, [otpSent]);

  const isPhoneValid = /^[79]\d{8}$/.test(phone);

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleRequestOtp = async () => {
    if (!isPhoneValid) return;
    dispatch(clearError());
    const result = await dispatch(requestOtp({ phone: `+251${phone}`, isRegistration: false }));
    if (requestOtp.rejected.match(result)) {
      if (result.payload === 'errorRoleRequired') setStep('role');
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

  const isHospitalPhoneValid = /^(?:0)?[79]\d{8}$/.test(hospitalPhone);

  const handleHospitalLogin = async () => {
    if (!isHospitalPhoneValid || !hospitalPassword) return;
    dispatch(clearError());
    const normalizedPhone = hospitalPhone.startsWith('0')
      ? hospitalPhone.slice(1)
      : hospitalPhone;
    dispatch(hospitalLogin({ phone: `+251${normalizedPhone}`, password: hospitalPassword }));
  };

  const handleReceptionistLogin = async () => {
    if (!staffUsername.trim() || !staffPassword) return;
    dispatch(clearError());
    dispatch(receptionistLogin({ username: staffUsername.trim(), password: staffPassword }));
  };

  const heroFeatures = [
    { icon: ShieldCheck, text: 'Book appointments with trusted doctors' },
    { icon: CalendarCheck, text: 'Manage your healthcare journey' },
    { icon: Building2, text: 'Access medical equipment & services' },
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
          <h1 className="login-hero-title">Patient &amp; Doctor Portal</h1>
          <p className="login-hero-text">
            Connect with top doctors, book appointments, and manage your healthcare — all in one place.
          </p>
          <ul className="login-hero-features">
            <li>
              <ShieldCheck size={18} />
              <span>Book appointments with trusted doctors</span>
            </li>
            <li>
              <CalendarCheck size={18} />
              <span>Manage your healthcare journey</span>
            </li>
            <li>
              <Building2 size={18} />
              <span>Access medical equipment &amp; services</span>
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

          {/* Step: Phone */}
          {step === 'phone' && (
            <div>
              <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, padding: '0', marginBottom: '18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)' }}>
                <ArrowLeft size={16} />
                Back
              </button>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                <button onClick={() => { setStep('receptionist-login'); dispatch(clearError()); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', transition: 'border-color 0.15s', fontFamily: 'var(--font-main)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <UserCog size={16} style={{ color: 'var(--accent-primary)' }} />
                  Login as Hospital Staff
                </button>

                <button onClick={() => { setStep('hospital-login'); dispatch(clearError()); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', transition: 'border-color 0.15s', fontFamily: 'var(--font-main)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <Building2 size={16} style={{ color: 'var(--accent-primary)' }} />
                  Login as Hospital
                </button>

                <Link href="/hospital/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', textDecoration: 'none', fontSize: '14px', color: 'var(--accent-primary)' }}>
                  <Building2 size={16} />
                  Register your hospital
                </Link>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '20px' }}>
                <ShieldCheck size={14} />
                Patients &amp; doctors — OTP sign in
              </div>
            </div>
          )}

          {/* Step: Role */}
          {step === 'role' && (
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

              <button onClick={() => { setStep('phone'); setRole(null); dispatch(clearError()); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, marginTop: '16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'var(--font-main)' }}>
                Back
              </button>
            </div>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
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

              <button onClick={() => { setStep(role ? 'role' : 'phone'); setOtpDigits(['', '', '', '', '', '']); dispatch(clearError()); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, marginTop: '16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'var(--font-main)' }}>
                Change phone number
              </button>
            </div>
          )}

          {/* Step: Hospital Login */}
          {step === 'hospital-login' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--accent-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <img src="/bm-booking-logo.png" alt="BM Booking" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Hospital Login</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Enter your registered phone and password</div>
                </div>
              </div>

              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>Sign in to your hospital dashboard</div>

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Phone Number</label>
              <div style={{ position: 'relative', marginBottom: '18px' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', pointerEvents: 'none' }}>
                  <Building2 size={18} />
                </span>
                <input
                  type="tel"
                  placeholder="912 345 678"
                  value={hospitalPhone}
                  onChange={(e) => { setHospitalPhone(e.target.value.replace(/[^0-9]/g, '')); dispatch(clearError()); }}
                  maxLength={10}
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
                  type={showHospitalPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={hospitalPassword}
                  onChange={(e) => { setHospitalPassword(e.target.value); dispatch(clearError()); }}
                  style={{ width: '100%', padding: '13px 46px 13px 42px', fontSize: '15px', border: '1px solid var(--border)', borderRadius: '12px', outline: 'none', background: 'var(--surface)', color: 'var(--text-primary)', transition: 'border-color 0.15s ease, box-shadow 0.15s ease', fontFamily: 'var(--font-main)' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(21, 101, 192, 0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowHospitalPassword((v) => !v)}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px' }}
                  aria-label={showHospitalPassword ? 'Hide password' : 'Show password'}
                  title={showHospitalPassword ? 'Hide password' : 'Show password'}
                >
                  {showHospitalPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF3F2', color: 'var(--status-error)', padding: '11px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '18px', border: '1px solid #FECDCA' }}>
                  <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                  {errorMessages[error] || error}
                </div>
              )}

              <button
                onClick={handleHospitalLogin}
                disabled={!isHospitalPhoneValid || !hospitalPassword || loading}
                style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1E88E5 100%)', border: 'none', borderRadius: '12px', cursor: !isHospitalPhoneValid || !hospitalPassword || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', opacity: !isHospitalPhoneValid || !hospitalPassword || loading ? 0.6 : 1, fontFamily: 'var(--font-main)' }}
              >
                {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <button onClick={() => { setStep('phone'); setHospitalPhone(''); setHospitalPassword(''); dispatch(clearError()); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, marginTop: '16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'var(--font-main)' }}>
                Back to phone login
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '20px' }}>
                <ShieldCheck size={14} />
                Authorized hospital staff only
              </div>
            </div>
          )}

          {/* Step: Receptionist (Staff) Login */}
          {step === 'receptionist-login' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--accent-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <img src="/bm-booking-logo.png" alt="BM Booking" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Staff Login</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Enter your staff username and password</div>
                </div>
              </div>

              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>Sign in to your hospital dashboard</div>

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Username</label>
              <div style={{ position: 'relative', marginBottom: '18px' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', pointerEvents: 'none' }}>
                  <UserCog size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={staffUsername}
                  onChange={(e) => { setStaffUsername(e.target.value); dispatch(clearError()); }}
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
                  type={showStaffPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={staffPassword}
                  onChange={(e) => { setStaffPassword(e.target.value); dispatch(clearError()); }}
                  style={{ width: '100%', padding: '13px 46px 13px 42px', fontSize: '15px', border: '1px solid var(--border)', borderRadius: '12px', outline: 'none', background: 'var(--surface)', color: 'var(--text-primary)', transition: 'border-color 0.15s ease, box-shadow 0.15s ease', fontFamily: 'var(--font-main)' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(21, 101, 192, 0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowStaffPassword((v) => !v)}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px' }}
                  aria-label={showStaffPassword ? 'Hide password' : 'Show password'}
                  title={showStaffPassword ? 'Hide password' : 'Show password'}
                >
                  {showStaffPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF3F2', color: 'var(--status-error)', padding: '11px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '18px', border: '1px solid #FECDCA' }}>
                  <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                  {errorMessages[error] || error}
                </div>
              )}

              <button
                onClick={handleReceptionistLogin}
                disabled={!staffUsername.trim() || !staffPassword || loading}
                style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1E88E5 100%)', border: 'none', borderRadius: '12px', cursor: !staffUsername.trim() || !staffPassword || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', opacity: !staffUsername.trim() || !staffPassword || loading ? 0.6 : 1, fontFamily: 'var(--font-main)' }}
              >
                {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <button onClick={() => { setStep('phone'); setStaffUsername(''); setStaffPassword(''); dispatch(clearError()); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, marginTop: '16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'var(--font-main)' }}>
                Back to login
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '20px' }}>
                <ShieldCheck size={14} />
                Provided by your hospital administrator
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
