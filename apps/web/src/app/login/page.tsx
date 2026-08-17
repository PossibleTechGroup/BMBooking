'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { requestOtp, verifyOtp, hospitalLogin, clearError } from '@/lib/store/slices/authSlice';
import { MedText } from '@/components/ui/med-text';
import { MedButton } from '@/components/ui/med-button';
import { User, Stethoscope, Building2 } from 'lucide-react';

const errorMessages: Record<string, string> = {
  errorHospitalPending: 'Your hospital registration is pending admin approval. Please try again later.',
  errorHospitalRejected: 'Your hospital registration was rejected. Please contact support.',
  errorHospitalFormRequired: 'Hospitals must complete the hospital registration form before logging in.',
  errorHospitalNoProfile: 'No hospital is linked to this account. Please contact support.',
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

type AuthStep = 'phone' | 'role' | 'otp' | 'hospital-login';

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

  useEffect(() => {
    if (user) {
      if (user.role === 'hospital') {
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

  const isHospitalPhoneValid = /^[79]\d{8}$/.test(hospitalPhone);

  const handleHospitalLogin = async () => {
    if (!isHospitalPhoneValid || !hospitalPassword) return;
    dispatch(clearError());
    dispatch(hospitalLogin({ phone: `+251${hospitalPhone}`, password: hospitalPassword }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full mt-16">
        <div className="flex items-center gap-3 mb-10">
          <Image src="/bm-booking-logo.png" alt="BM Booking" width={48} height={48} className="w-12 h-12 rounded-[12px] object-cover" />
          <span className="text-[24px] font-bold text-primary tracking-[-0.3px]">BM</span>
        </div>
        {step === 'phone' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <MedText variant="h1" as="h1" className="mb-2">Login</MedText>
            <MedText variant="body" className="mb-8">Enter your phone number to continue</MedText>

            <div className="flex h-[60px] rounded-[12px] border-[1.5px] border-border bg-surface overflow-hidden mb-6 focus-within:border-border-focus transition-colors">
              <div className="flex items-center px-4 border-r border-border">
                <span className="text-[16px] font-bold">+251</span>
              </div>
              <input
                type="tel"
                placeholder="912 345 678"
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/[^0-9]/g, '')); dispatch(clearError()); }}
                maxLength={9}
                className="flex-1 text-[18px] font-semibold px-4 tracking-[0.3px] bg-transparent outline-none placeholder:text-muted"
              />
            </div>

            {error && (
              <p className="text-error text-[14px] font-semibold text-center mb-4 animate-in fade-in slide-in-from-bottom-2">
                {errorMessages[error] || error}
              </p>
            )}

            <MedButton title="Continue" onPress={handleRequestOtp} disabled={!isPhoneValid} loading={loading} />

            <div className="flex flex-col gap-3 mt-6">
              <button onClick={() => { setStep('hospital-login'); dispatch(clearError()); }} className="flex items-center justify-center gap-2 w-full py-3 rounded-[12px] border-[1.5px] border-border bg-surface hover:border-muted transition-colors">
                <Building2 size={16} className="text-primary" />
                <MedText variant="metadata" color="#1565C0">Login as Hospital</MedText>
              </button>

              <Link href="/hospital/register" className="flex items-center justify-center gap-2 w-full">
                <Building2 size={16} className="text-primary" />
                <MedText variant="metadata" color="#1565C0">Register your hospital</MedText>
              </Link>
            </div>
          </div>
        )}

        {step === 'role' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <MedText variant="h1" as="h1" className="mb-2">Register</MedText>
            <MedText variant="body" className="mb-8">Select your role to get started</MedText>

            <div className="flex flex-col gap-4 mb-8">
              <button
                onClick={() => setRole('patient')}
                className={`p-5 rounded-[16px] border-2 text-left transition-all ${
                  role === 'patient' ? 'border-primary bg-surface shadow-sm' : 'border-border bg-surface hover:border-muted'
                }`}
              >
                <User size={28} className={role === 'patient' ? 'text-primary' : 'text-muted'} />
                <MedText variant="h2" as="h3" className="mt-3 mb-1">Patient</MedText>
                <MedText variant="metadata">Book appointments and access healthcare services</MedText>
              </button>

              <button
                onClick={() => setRole('doctor')}
                className={`p-5 rounded-[16px] border-2 text-left transition-all ${
                  role === 'doctor' ? 'border-primary bg-surface shadow-sm' : 'border-border bg-surface hover:border-muted'
                }`}
              >
                <Stethoscope size={28} className={role === 'doctor' ? 'text-primary' : 'text-muted'} />
                <MedText variant="h2" as="h3" className="mt-3 mb-1">Doctor</MedText>
                <MedText variant="metadata">Manage your practice and appointments</MedText>
              </button>
            </div>

            {error && (
              <p className="text-error text-[14px] font-semibold text-center mb-4 animate-in fade-in">{errorMessages[error] || error}</p>
            )}

            <MedButton title="Continue" onPress={handleRegisterWithRole} disabled={!role} loading={loading} />

            <Link href="/hospital/register" className="mt-6 flex items-center justify-center gap-2 w-full">
              <Building2 size={16} className="text-primary" />
              <MedText variant="metadata" color="#1565C0">Registering a hospital? Use the hospital form</MedText>
            </Link>

            <button onClick={() => { setStep('phone'); setRole(null); dispatch(clearError()); }} className="mt-6 w-full text-center">
              <MedText variant="metadata" color="#1565C0">Back</MedText>
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <MedText variant="h1" as="h1" className="mb-2">Verify OTP</MedText>
            <MedText variant="body" className="mb-8">Enter the 6-digit code sent to +251{phone}</MedText>

            <div className="flex justify-center gap-3 mb-6">
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
                  className="w-12 h-[60px] text-center text-[24px] font-bold rounded-[12px] border-2 bg-surface outline-none transition-all border-border focus:border-primary"
                />
              ))}
            </div>

            {error && (
              <p className="text-error text-[14px] font-semibold text-center mb-4 animate-in fade-in">{errorMessages[error] || error}</p>
            )}

            <MedButton title="Verify" onPress={() => {
              const code = otpDigits.join('');
              if (code.length === 6) {
                dispatch(verifyOtp({ phone: `+251${phone}`, code, role: role || undefined, isRegistration: !!role }));
              }
            }} disabled={otpDigits.join('').length < 6} loading={loading} />

            <button onClick={() => { setStep(role ? 'role' : 'phone'); setOtpDigits(['', '', '', '', '', '']); dispatch(clearError()); }} className="mt-6 w-full text-center">
              <MedText variant="metadata" color="#1565C0">Change phone number</MedText>
            </button>
          </div>
        )}

        {step === 'hospital-login' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <MedText variant="h1" as="h1" className="mb-2">Hospital Login</MedText>
            <MedText variant="body" className="mb-8">Enter your registered phone and password</MedText>

            <div className="flex h-[60px] rounded-[12px] border-[1.5px] border-border bg-surface overflow-hidden mb-4 focus-within:border-border-focus transition-colors">
              <div className="flex items-center px-4 border-r border-border">
                <span className="text-[16px] font-bold">+251</span>
              </div>
              <input
                type="tel"
                placeholder="912 345 678"
                value={hospitalPhone}
                onChange={(e) => { setHospitalPhone(e.target.value.replace(/[^0-9]/g, '')); dispatch(clearError()); }}
                maxLength={9}
                className="flex-1 text-[18px] font-semibold px-4 tracking-[0.3px] bg-transparent outline-none placeholder:text-muted"
              />
            </div>

            <div className="flex h-[60px] rounded-[12px] border-[1.5px] border-border bg-surface overflow-hidden mb-6 focus-within:border-border-focus transition-colors">
              <input
                type="password"
                placeholder="Password"
                value={hospitalPassword}
                onChange={(e) => { setHospitalPassword(e.target.value); dispatch(clearError()); }}
                className="flex-1 text-[16px] px-4 bg-transparent outline-none placeholder:text-muted"
              />
            </div>

            {error && (
              <p className="text-error text-[14px] font-semibold text-center mb-4 animate-in fade-in">{errorMessages[error] || error}</p>
            )}

            <MedButton title="Login" onPress={handleHospitalLogin} disabled={!isHospitalPhoneValid || !hospitalPassword} loading={loading} />

            <button onClick={() => { setStep('phone'); setHospitalPhone(''); setHospitalPassword(''); dispatch(clearError()); }} className="mt-6 w-full text-center">
              <MedText variant="metadata" color="#1565C0">Back to phone login</MedText>
            </button>
          </div>
        )}
      </div>

      <div className="px-10 pb-6 text-center">
        <p className="text-[12px] text-muted">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
}
