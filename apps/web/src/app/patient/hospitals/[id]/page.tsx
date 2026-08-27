'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchHospitalById } from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Star,
  Hospital,
  User,
  Stethoscope,
  Award,
  Clock,
  Building2,
  Navigation,
} from 'lucide-react';

export default function HospitalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { selectedHospital, loading } = useAppSelector((s) => s.hospital);

  const id = Number(params.id);

  useEffect(() => {
    if (id) {
      dispatch(fetchHospitalById(id));
    }
  }, [dispatch, id]);

  if (loading && !selectedHospital) {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!selectedHospital) {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-text-secondary hover:text-text">
          <ArrowLeft size={20} /> <MedText variant="body" className="text-[14px]">Back</MedText>
        </button>
        <div className="text-center py-20">
          <MedText variant="body" className="text-muted">Hospital not found</MedText>
        </div>
      </div>
    );
  }

  const hasCoords =
    typeof selectedHospital.latitude === 'number' && typeof selectedHospital.longitude === 'number';

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-text-secondary hover:text-text transition-colors">
        <ArrowLeft size={20} /> <MedText variant="body" className="text-[14px]">Back</MedText>
      </button>

      {/* Hospital Header */}
      <MedCard className="mb-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-[16px] bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {selectedHospital.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedHospital.image} alt={selectedHospital.name} className="w-full h-full object-cover" />
            ) : (
              <Hospital size={32} className="text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <MedText variant="h1" as="h1" className="text-[20px]">{selectedHospital.name}</MedText>
            {selectedHospital.address && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={13} className="text-muted flex-shrink-0" />
                <MedText variant="body" className="text-text-secondary text-[14px]">{selectedHospital.address}</MedText>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {selectedHospital.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-muted" />
                  <MedText variant="metadata">{selectedHospital.phone}</MedText>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Stethoscope size={13} className="text-muted" />
                <MedText variant="metadata">{selectedHospital.doctors?.length || 0} doctors</MedText>
              </span>
            </div>
            {hasCoords && (
              <a
                href={`https://www.google.com/maps?q=${selectedHospital.latitude},${selectedHospital.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-[12px] text-primary font-medium"
              >
                <Navigation size={12} /> Get Directions
              </a>
            )}
          </div>
        </div>
      </MedCard>

      {/* Doctors */}
      <div className="mb-4">
        <MedText variant="metadata" className="text-text-secondary text-[13px] tracking-[0.3px] mb-3">
          Doctors at {selectedHospital.name}
        </MedText>

        {selectedHospital.doctors?.length === 0 ? (
          <MedCard>
            <div className="text-center py-8">
              <User size={36} className="text-border mx-auto mb-2" />
              <MedText variant="body" className="text-text-secondary">No doctors available at this hospital yet</MedText>
            </div>
          </MedCard>
        ) : (
          <div className="space-y-3">
            {(selectedHospital.doctors || []).map((doctor) => (
              <MedCard key={doctor.id} className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <MedText variant="body" className="text-[16px] font-medium text-text truncate">{doctor.fullName}</MedText>
                    <MedText variant="metadata" className="truncate">
                      {doctor.specializations?.length ? doctor.specializations.join(', ') : doctor.specialization || 'General'}
                    </MedText>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Star size={14} className="text-star fill-star" />
                        <MedText variant="metadata">{doctor.rating || '0.0'} ({doctor.totalReviews || 0} reviews)</MedText>
                      </span>
                      {doctor.experienceYears != null && (
                        <span className="flex items-center gap-1">
                          <Award size={13} className="text-muted" />
                          <MedText variant="metadata">{doctor.experienceYears} yrs</MedText>
                        </span>
                      )}
                    </div>
                    {displayClinic(doctor.clinicName, doctor.clinicAddress)}
                  </div>
                  <div className="w-16 h-16 rounded-[12px] bg-foreground/5 flex items-center justify-center ml-4 flex-shrink-0 overflow-hidden">
                    {doctor.profilePicture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={doctor.profilePicture} alt={doctor.fullName || ''} className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-border" />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Link href={`/patient/doctors/${doctor.id}`}>
                    <MedButton title="View Profile & Book" onPress={() => {}} type="outline" />
                  </Link>
                </div>
              </MedCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function displayClinic(clinicName?: string | null, clinicAddress?: string | null) {
  if (!clinicName && !clinicAddress) return null;
  return (
    <div className="flex items-center gap-1 mt-1">
      <Building2 size={13} className="text-muted flex-shrink-0" />
      <MedText variant="metadata" className="truncate">
        {[clinicName, clinicAddress].filter(Boolean).join(' • ')}
      </MedText>
    </div>
  );
}
