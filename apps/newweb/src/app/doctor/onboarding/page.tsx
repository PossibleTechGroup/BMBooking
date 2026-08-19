'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { submitDoctorProfile, logout, clearError } from '@/lib/store/slices/authSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { MedInput, MedTextarea } from '@/components/ui/med-input';
import { LogOut, AlertCircle } from 'lucide-react';

const SPECIALIZATIONS = [
  'General Practice', 'Internal Medicine', 'Pediatrics', 'Cardiology',
  'Dermatology', 'Orthopedics', 'Gynecology', 'Neurology',
  'Ophthalmology', 'ENT', 'Urology', 'Psychiatry',
];

export default function DoctorOnboardingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, rejectionReason } = useAppSelector((s) => s.auth);

  const [fullName, setFullName] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (specializations.length === 0) errors.specializations = 'Select at least one specialization';
    if (!experience.trim()) {
      errors.experience = 'Experience is required';
    } else {
      const expNum = Number(experience);
      if (isNaN(expNum) || expNum < 0 || expNum > 60) {
        errors.experience = 'Experience must be between 0 and 60 years';
      }
    }
    if (!licenseNumber.trim()) errors.licenseNumber = 'License number is required';
    if (bio.trim().length < 10) errors.bio = 'Bio must be at least 10 characters';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const toggleSpecialization = (spec: string) => {
    setSpecializations(prev => {
      if (prev.includes(spec)) return prev.filter(s => s !== spec);
      if (prev.length >= 2) return prev;
      return [...prev, spec];
    });
    setFieldErrors(prev => { const n = { ...prev }; delete n.specializations; return n; });
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const data = {
      fullName,
      specialization: specializations[0] || '',
      specializations,
      experienceYears: Number(experience),
      licenseNumber,
      bio,
    };
    const result = await dispatch(submitDoctorProfile(data));
    if (submitDoctorProfile.fulfilled.match(result)) {
      router.push('/doctor/pending');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden sticky top-0 z-40 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/bm-booking-logo.png" alt="BM" width={32} height={32} className="w-8 h-8 rounded-[8px] object-cover" />
          <div>
            <h1 className="text-[16px] font-bold text-primary">BM</h1>
            <p className="text-[10px] text-muted">Doctor Setup</p>
          </div>
        </div>
        <button onClick={() => { dispatch(logout()); router.push('/login'); }} className="p-2 text-error">
          <LogOut size={20} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8">
        <div className="mb-8">
          <MedText variant="h1" as="h1" className="mb-2">Professional Details</MedText>
          <MedText variant="body">Complete your profile to get started</MedText>
        </div>

        {rejectionReason && (
          <MedCard className="mb-6 border-error/30 bg-error/5">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-error mt-0.5 shrink-0" />
              <div>
                <MedText variant="h2" as="h3" className="text-error mb-1">Profile Rejected</MedText>
                <MedText variant="body" className="text-[14px]">{rejectionReason}</MedText>
              </div>
            </div>
          </MedCard>
        )}

        <MedCard className="mb-6">
          <MedInput
            label="Full Name *"
            placeholder="Dr. Abebe Kebede"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors(p => { const n = { ...p }; delete n.fullName; return n; });
            }}
            error={!!fieldErrors.fullName}
            errorText={fieldErrors.fullName}
          />

          <div className="mb-5">
            <label className={`block text-[12px] font-medium mb-2 ml-1 ${fieldErrors.specializations ? 'text-error' : 'text-muted'}`}>
              Specializations * (max 2)
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((spec) => (
                <button
                  key={spec}
                  onClick={() => toggleSpecialization(spec)}
                  className={`px-3 py-2 rounded-[10px] border-[1.5px] text-[13px] font-medium transition-all ${
                    specializations.includes(spec)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-text-secondary hover:border-muted'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
            {fieldErrors.specializations && (
              <p className="text-error text-[12px] mt-1.5 ml-1">{fieldErrors.specializations}</p>
            )}
          </div>

          <MedInput
            label="Years of Experience *"
            type="number"
            placeholder="5"
            value={experience}
            onChange={(e) => {
              setExperience(e.target.value);
              if (fieldErrors.experience) setFieldErrors(p => { const n = { ...p }; delete n.experience; return n; });
            }}
            error={!!fieldErrors.experience}
            errorText={fieldErrors.experience}
          />

          <MedInput
            label="License Number *"
            placeholder="MD-12345"
            value={licenseNumber}
            onChange={(e) => {
              setLicenseNumber(e.target.value);
              if (fieldErrors.licenseNumber) setFieldErrors(p => { const n = { ...p }; delete n.licenseNumber; return n; });
            }}
            error={!!fieldErrors.licenseNumber}
            errorText={fieldErrors.licenseNumber}
          />

          <MedTextarea
            label="Bio * (min 10 characters)"
            placeholder="Tell patients about your experience and approach to care..."
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              if (fieldErrors.bio) setFieldErrors(p => { const n = { ...p }; delete n.bio; return n; });
            }}
            error={!!fieldErrors.bio}
            errorText={fieldErrors.bio}
          />
        </MedCard>

        {error && (
          <p className="text-error text-[14px] font-semibold text-center mb-4">{error}</p>
        )}

        <MedButton title="Submit Profile" onPress={handleSubmit} loading={loading} />

        <p className="text-[12px] text-muted text-center mt-4">
          Your profile will be reviewed by an admin before activation.
        </p>
      </div>
    </div>
  );
}
