'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { ArrowLeft, Star, MapPin, Award, Languages, Building2, User } from 'lucide-react';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { doctors } = useAppSelector((s) => s.doctors);
  const doctor = doctors.find((d) => String(d.id) === String(params.id));

  if (!doctor) {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <div className="text-center py-20">
          <MedText variant="body" className="text-muted">Loading doctor profile...</MedText>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-text-secondary hover:text-text transition-colors">
        <ArrowLeft size={20} /> <MedText variant="body" className="text-[14px]">Back</MedText>
      </button>

      {/* Doctor Header */}
      <MedCard className="mb-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-[16px] bg-foreground/5 flex items-center justify-center flex-shrink-0">
            <User size={32} className="text-border" />
          </div>
          <div className="flex-1 min-w-0">
            <MedText variant="h1" as="h1">{doctor.fullName}</MedText>
            <MedText variant="body" className="text-text-secondary mt-1">
              {doctor.specializations?.length ? doctor.specializations.join(', ') : doctor.specialization}
            </MedText>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Star size={14} className="text-star fill-star" />
                <MedText variant="metadata">{doctor.rating || '0.0'} ({doctor.totalReviews || 0} reviews)</MedText>
              </span>
              <span className="flex items-center gap-1">
                <Award size={14} className="text-muted" />
                <MedText variant="metadata">{doctor.experienceYears || 0} years exp.</MedText>
              </span>
            </div>
          </div>
        </div>
      </MedCard>

      {/* Bio */}
      {doctor.bio && (
        <MedCard className="mb-4">
          <MedText variant="h2" as="h3" className="mb-2">About</MedText>
          <MedText variant="body" className="text-text-secondary">{doctor.bio}</MedText>
        </MedCard>
      )}

      {/* Details */}
      <MedCard className="mb-4">
        <MedText variant="h2" as="h3" className="mb-3">Details</MedText>
        <div className="space-y-3">
          {doctor.clinicName && (
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-muted flex-shrink-0" />
              <div>
                <MedText variant="metadata" className="text-muted">Clinic</MedText>
                <MedText variant="body" className="text-[14px]">{doctor.clinicName}</MedText>
              </div>
            </div>
          )}
          {doctor.clinicAddress && (
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-muted flex-shrink-0" />
              <div>
                <MedText variant="metadata" className="text-muted">Address</MedText>
                <MedText variant="body" className="text-[14px]">{doctor.clinicAddress}</MedText>
              </div>
            </div>
          )}
          {doctor.hospital?.name && (
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-muted flex-shrink-0" />
              <div>
                <MedText variant="metadata" className="text-muted">Hospital</MedText>
                <MedText variant="body" className="text-[14px]">{doctor.hospital.name}</MedText>
              </div>
            </div>
          )}
          {doctor.languages?.length > 0 && (
            <div className="flex items-center gap-3">
              <Languages size={18} className="text-muted flex-shrink-0" />
              <div>
                <MedText variant="metadata" className="text-muted">Languages</MedText>
                <MedText variant="body" className="text-[14px]">{doctor.languages.join(', ')}</MedText>
              </div>
            </div>
          )}
        </div>
      </MedCard>

      {/* Hospital Card Price */}
      {doctor.hospital?.cardPrice && (
        <MedCard className="mb-4">
          <div className="flex justify-between items-center">
            <MedText variant="body" className="text-text-secondary">Hospital Card Price</MedText>
            <MedText variant="h2" as="span" className="text-success">ETB {doctor.hospital.cardPrice}</MedText>
          </div>
          {doctor.hospital.serviceFee && (
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
              <MedText variant="body" className="text-text-secondary">Service Fee</MedText>
              <MedText variant="h2" as="span">ETB {doctor.hospital.serviceFee.amount}</MedText>
            </div>
          )}
        </MedCard>
      )}

      {/* Book Button */}
      <div className="pb-8">
        <MedButton
          title="Book Appointment"
          onPress={() => router.push(`/patient/appointments?book=${doctor.id}&name=${encodeURIComponent(doctor.fullName)}&fee=${doctor.hospital?.cardPrice || ''}`)}
        />
      </div>
    </div>
  );
}
