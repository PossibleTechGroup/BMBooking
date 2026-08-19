'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { submitPatientProfile, logout, clearError } from '@/lib/store/slices/authSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { MedInput } from '@/components/ui/med-input';
import { LogOut } from 'lucide-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientOnboardingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodType, setBloodType] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 3) errors.fullName = 'Full name is required (min 3 characters)';
    if (!dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const result = await dispatch(submitPatientProfile({
      fullName,
      dateOfBirth,
      gender,
      bloodType: bloodType || undefined,
      emergencyContact: emergencyPhone ? `+251${emergencyPhone}` : undefined,
    }));
    if (submitPatientProfile.fulfilled.match(result)) {
      router.push('/patient');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden sticky top-0 z-40 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/bm-booking-logo.png" alt="BM" width={32} height={32} className="w-8 h-8 rounded-[8px] object-cover" />
          <span className="text-[16px] font-bold text-primary">BM</span>
        </div>
        <button onClick={() => { dispatch(logout()); router.push('/login'); }} className="p-2 text-error">
          <LogOut size={20} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8">
        <div className="mb-8">
          <MedText variant="h1" as="h1" className="mb-2">Complete Your Profile</MedText>
          <MedText variant="body">Tell us a bit about yourself to get started</MedText>
        </div>

        <MedCard className="mb-6">
          <MedInput
            label="Full Name *"
            placeholder="Abebe Kebede"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors(p => { const n = { ...p }; delete n.fullName; return n; });
            }}
            error={!!fieldErrors.fullName}
            errorText={fieldErrors.fullName}
          />

          <MedInput
            label="Date of Birth *"
            type="date"
            value={dateOfBirth}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              if (fieldErrors.dateOfBirth) setFieldErrors(p => { const n = { ...p }; delete n.dateOfBirth; return n; });
            }}
            error={!!fieldErrors.dateOfBirth}
            errorText={fieldErrors.dateOfBirth}
          />

          <div className="mb-5">
            <label className="block text-[12px] font-medium mb-2 ml-1 text-muted">Gender</label>
            <div className="flex gap-3">
              {['Male', 'Female', 'Other'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 py-3 rounded-[12px] border-[1.5px] text-[14px] font-medium transition-all ${
                    gender === g
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-text-secondary hover:border-muted'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-[12px] font-medium mb-2 ml-1 text-muted">Blood Type (optional)</label>
            <div className="flex flex-wrap gap-2">
              {BLOOD_TYPES.map((bt) => (
                <button
                  key={bt}
                  onClick={() => setBloodType(bloodType === bt ? '' : bt)}
                  className={`px-4 py-2.5 rounded-[10px] border-[1.5px] text-[13px] font-medium transition-all ${
                    bloodType === bt
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-text-secondary hover:border-muted'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-1">
            <label className="block text-[12px] font-medium mb-2 ml-1 text-muted">Emergency Contact (optional)</label>
            <div className="flex h-14 rounded-[12px] border-[1.5px] border-border bg-surface overflow-hidden focus-within:border-border-focus transition-colors">
              <div className="flex items-center px-4 border-r border-border">
                <span className="text-[14px] font-semibold text-muted">+251</span>
              </div>
              <input
                type="tel"
                placeholder="912 345 678"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={9}
                className="flex-1 text-[16px] px-4 bg-transparent outline-none placeholder:text-muted"
              />
            </div>
          </div>
        </MedCard>

        {error && (
          <p className="text-error text-[14px] font-semibold text-center mb-4">{error}</p>
        )}

        <MedButton title="Save & Continue" onPress={handleSubmit} loading={loading} />

        <p className="text-[12px] text-muted text-center mt-4">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
