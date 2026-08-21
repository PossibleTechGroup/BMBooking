'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { registerHospital, clearHospitalError } from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedButton } from '@/components/ui/med-button';
import { MedInput } from '@/components/ui/med-input';
import { ArrowLeft, CheckCircle2, Building2, Eye, EyeOff } from 'lucide-react';

export default function HospitalRegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.hospital);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isPhoneValid = /^[79]\d{8}$/.test(adminPhone);
  const isEmailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const canSubmit = name.trim().length > 0 && isPhoneValid && isEmailValid && isPasswordValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    dispatch(clearHospitalError());
    const result = await dispatch(
      registerHospital({
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        adminPhone: `+251${adminPhone}`,
        password,
      })
    );
    if (registerHospital.fulfilled.match(result)) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full mt-12">
        <Link href="/login" className="flex items-center gap-2 mb-6 w-fit">
          <ArrowLeft size={18} className="text-muted" />
          <MedText variant="metadata" color="#1565C0">Back to login</MedText>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Image src="/bm-booking-logo.png" alt="BM Booking" width={48} height={48} className="w-12 h-12 rounded-[12px] object-cover" />
          <div>
            <span className="text-[24px] font-bold text-primary tracking-[-0.3px]">BM</span>
            <MedText variant="metadata" className="text-muted">Hospital Registration</MedText>
          </div>
        </div>

        {submitted ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#ECFDF3] flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-[#027A48]" />
            </div>
            <MedText variant="h1" as="h1" className="mb-2">Registration Submitted</MedText>
            <MedText variant="body" className="mb-6">
              Thank you! Your hospital registration is pending admin approval. You will be able to log in once your account is approved.
            </MedText>
            <MedCardInline />
            <MedButton title="Go to Login" onPress={() => router.push('/login')} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <MedText variant="h1" as="h1" className="mb-2">Register Your Hospital</MedText>
            <MedText variant="body" className="mb-6">Fill in your hospital details. An admin will review and approve your registration.</MedText>

            <MedInput
              label="Hospital Name"
              placeholder="e.g. Tikur Anbessa Specialized Hospital"
              value={name}
              onChange={(e) => { setName(e.target.value); dispatch(clearHospitalError()); }}
              error={false}
            />

            <MedInput
              label="Address"
              placeholder="City, sub-city, area"
              value={address}
              onChange={(e) => { setAddress(e.target.value); dispatch(clearHospitalError()); }}
            />

            <MedInput
              label="Hospital Phone"
              placeholder="+251 91 234 5678"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); dispatch(clearHospitalError()); }}
            />

            <MedInput
              label="Email"
              type="email"
              placeholder="contact@hospital.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); dispatch(clearHospitalError()); }}
              error={!!email && !isEmailValid}
              errorText="Enter a valid email address"
            />

            <div>
              <MedText variant="metadata" className="text-muted mb-2 ml-1">Admin Phone Number</MedText>
              <div className="flex h-14 rounded-[12px] border-[1.5px] border-border bg-surface overflow-hidden mb-1 focus-within:border-border-focus transition-colors">
                <div className="flex items-center px-4 border-r border-border">
                  <span className="text-[16px] font-bold">+251</span>
                </div>
                <input
                  type="tel"
                  placeholder="912 345 678"
                  value={adminPhone}
                  onChange={(e) => { setAdminPhone(e.target.value.replace(/[^0-9]/g, '')); dispatch(clearHospitalError()); }}
                  maxLength={9}
                  className="flex-1 text-[16px] font-semibold px-4 bg-transparent outline-none placeholder:text-muted"
                />
              </div>
              <MedText variant="metadata" className="text-muted mb-4 ml-1">
                This number will be used to log in to your hospital dashboard.
              </MedText>
            </div>

            <div className="mb-5 w-full">
              <label className={`block text-[12px] font-medium mb-2 ml-1 ${!!password && !isPasswordValid ? 'text-error' : 'text-muted'}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); dispatch(clearHospitalError()); }}
                  className={`
                    w-full h-14 px-4 pr-12 text-[16px] rounded-[12px]
                    bg-surface border-[1.5px] text-text
                    placeholder:text-muted
                    focus:outline-none focus:border-border-focus
                    transition-colors
                    shadow-[0_2px_8px_rgba(0,0,0,0.02)]
                    ${!!password && !isPasswordValid ? 'border-error' : 'border-border'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!!password && !isPasswordValid && (
                <p className="text-error text-[12px] mt-1.5 ml-1">Password must be at least 8 characters</p>
              )}
            </div>

            {error && (
              <p className="text-error text-[14px] font-semibold text-center mb-4 animate-in fade-in">{error}</p>
            )}

            <MedButton
              title="Submit for Approval"
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={loading}
              icon={<Building2 size={18} />}
            />
          </div>
        )}
      </div>

      <div className="px-10 pb-6 text-center">
        <p className="text-[12px] text-muted">By registering, you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
}

function MedCardInline() {
  return (
    <div className="mb-6 px-4 py-3 rounded-[12px] bg-primary/10 border border-primary/30 text-left">
      <p className="text-[12px] font-bold text-primary uppercase tracking-wide mb-1">Next steps</p>
      <p className="text-[13px] text-text-secondary leading-relaxed">
        1. An admin reviews your registration.
        <br />
        2. Once approved, log in with your phone number and password.
      </p>
    </div>
  );
}
