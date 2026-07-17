'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/lib/hooks';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { Search, Star, ArrowRight, User, Heart, Stethoscope, Brain, Baby, Bone, Eye, Cpu } from 'lucide-react';

const SERVICES = [
  { label: 'Cardiology', icon: Heart, category: 'cardiology' },
  { label: 'Dermatology', icon: Stethoscope, category: 'dermatology' },
  { label: 'Neurology', icon: Brain, category: 'neurology' },
  { label: 'Pediatrics', icon: Baby, category: 'pediatrics' },
  { label: 'Orthopedics', icon: Bone, category: 'orthopedics' },
  { label: 'Ophthalmology', icon: Eye, category: 'ophthalmology' },
];

export default function PatientHomePage() {
  const { user } = useAppSelector((s) => s.auth);
  const { doctors } = useAppSelector((s) => s.doctors);

  const featuredDoctors = useMemo(() => doctors.slice(0, 3), [doctors]);

  return (
    <div className="p-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <MedText variant="metadata">Welcome back</MedText>
          <MedText variant="h2" as="h2" className="mt-0.5">{user?.patientProfile?.fullName || user?.phone || 'Guest'}</MedText>
        </div>
        <Link href="/patient/equipment">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-white rounded-[8px] hover:opacity-90 transition-opacity cursor-pointer">
            <Cpu size={16} />
            <MedText variant="metadata" className="text-[13px] font-bold text-white">Book Imaging & Diagnostic Centers</MedText>
          </div>
        </Link>
      </div>

      {/* Search Bar */}
      <Link href="/patient/doctors">
        <div className="flex items-center gap-3 bg-surface border border-border rounded-[12px] py-3 px-4 mb-8 hover:shadow-md transition-shadow cursor-pointer">
          <Search size={20} className="text-muted" />
          <MedText variant="body" className="text-muted">Search doctors, clinics...</MedText>
        </div>
      </Link>

      {/* Services Grid */}
      <div className="mb-8">
        <MedText variant="metadata" className="text-text-secondary text-[13px] tracking-[0.3px] mb-4">Services</MedText>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {SERVICES.map((s) => (
            <Link
              key={s.category}
              href={`/patient/doctors?specialty=${s.category}`}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-[20px] bg-surface flex items-center justify-center shadow-sm border border-border/50 hover:scale-105 transition-transform">
                <s.icon size={24} className="text-primary" />
              </div>
              <MedText variant="metadata" className="text-center">{s.label}</MedText>
            </Link>
          ))}
        </div>
      </div>



      {/* Featured Doctors */}
      {featuredDoctors.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <MedText variant="metadata" className="text-text-secondary text-[13px] tracking-[0.3px]">Top Rated Doctors</MedText>
            <Link href="/patient/doctors" className="text-[12px] text-primary font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {featuredDoctors.map((doctor) => (
              <MedCard key={doctor.id}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <MedText variant="body" className="text-[16px] font-medium text-text truncate">{doctor.fullName}</MedText>
                    <MedText variant="metadata" className="truncate">
                      {doctor.specializations?.length ? doctor.specializations.join(', ') : doctor.specialization} • {doctor.clinicName || 'Clinic'}
                    </MedText>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={14} className="text-star fill-star" />
                      <MedText variant="metadata">{doctor.rating || '0.0'} ({doctor.totalReviews || 0} reviews)</MedText>
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-[12px] bg-foreground/5 flex items-center justify-center ml-4 flex-shrink-0">
                    <User size={24} className="text-border" />
                  </div>
                </div>
                <div className="mt-4">
                  <Link href={`/patient/doctors/${doctor.id}`}>
                    <MedButton title="View Profile" onPress={() => {}} type="outline" />
                  </Link>
                </div>
              </MedCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
