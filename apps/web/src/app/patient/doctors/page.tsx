'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { Search, Star, MapPin, SlidersHorizontal, X, User } from 'lucide-react';

const SPECIALTIES = [
  'All', 'Cardiology', 'Neurology', 'Dermatology', 'Pediatrics', 'Orthopedics',
  'Ophthalmology', 'Gynecology', 'Internal Medicine', 'General Surgery',
  'Urology', 'Psychiatry', 'Oncology', 'ENT', 'Family Medicine',
];

export default function DoctorsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-5 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
      <DoctorsPage />
    </Suspense>
  );
}

function DoctorsPage() {
  const searchParams = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') || 'All';

  const { doctors, loading } = useAppSelector((s) => s.doctors);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [sortBy, setSortBy] = useState<'rating' | 'name'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState('All');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredDoctors = useMemo(() => {
    let result = doctors.filter((doctor: any) => {
      const allSpecs = (doctor.specializations?.length ? doctor.specializations.join(', ') : doctor.specialization || '').toLowerCase();
      const matchesSearch =
        doctor.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        allSpecs.includes(searchQuery.toLowerCase()) ||
        (doctor.clinicAddress || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpec = selectedSpecialty === 'All' || allSpecs.includes(selectedSpecialty.toLowerCase());
      const matchesRating = minRating === 'All' || (doctor.rating || 0) >= parseFloat(minRating);
      return matchesSearch && matchesSpec && matchesRating;
    });

    if (sortBy === 'rating') result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else result = [...result].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    return result;
  }, [doctors, searchQuery, selectedSpecialty, sortBy, minRating]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <MedText variant="h2" as="h2" className="text-[20px]">Find Doctors</MedText>
      </div>

      {/* Search */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-[12px] py-3 px-4">
          <Search size={20} className="text-muted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, specialty, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
          />
          <button onClick={() => setShowFilters(!showFilters)} className="p-1.5 hover:bg-foreground/5 rounded-lg transition-colors">
            <SlidersHorizontal size={18} className={showFilters ? 'text-primary' : 'text-muted'} />
          </button>
        </div>
      </div>

      {/* Sort pills */}
      <div className="px-5 pb-3 flex gap-2">
        {(['rating', 'name'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              sortBy === s ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary hover:border-primary/30'
            }`}
          >
            {s === 'rating' ? 'Top Rated' : 'A-Z'}
          </button>
        ))}
      </div>

      {/* Specialty chips */}
      <div className="px-5 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
        {SPECIALTIES.map((spec) => (
          <button
            key={spec}
            onClick={() => setSelectedSpecialty(spec)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              selectedSpecialty === spec ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary hover:border-primary/30'
            }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="px-5 pb-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-surface border border-border rounded-[12px] p-4">
            <div className="flex justify-between items-center mb-3">
              <MedText variant="body" className="text-[14px] font-medium">Filters</MedText>
              <button onClick={() => { setShowFilters(false); setMinRating('All'); }}><X size={16} /></button>
            </div>
            <MedText variant="metadata" className="mb-2">Minimum Rating</MedText>
            <div className="flex gap-2">
              {['All', '4+', '3+', '2+'].map((r) => (
                <button key={r} onClick={() => setMinRating(r)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${minRating === r ? 'bg-primary text-white' : 'bg-foreground/5 text-text-secondary'}`}>
                  {r === 'All' ? 'All' : `${r}+`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Counter */}
      <div className="px-5 pb-2">
        <MedText variant="metadata" className="text-muted">{filteredDoctors.length} doctors found</MedText>
      </div>

      {/* List */}
      <div className="px-5 pb-24 space-y-2">
        {!mounted || (loading && filteredDoctors.length === 0) ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor: any) => (
            <MedCard key={doctor.id}>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <MedText variant="body" className="text-[16px] font-medium text-text truncate">{doctor.fullName}</MedText>
                  <MedText variant="metadata" className="truncate">
                    {doctor.specializations?.length ? doctor.specializations.join(', ') : doctor.specialization}
                  </MedText>
                  {doctor.clinicName && <MedText variant="metadata">{doctor.clinicName}</MedText>}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1">
                      <Star size={13} className="text-star fill-star" />
                      <MedText variant="metadata">{doctor.rating || '0.0'} ({doctor.totalReviews || 0})</MedText>
                    </span>
                    {doctor.clinicAddress && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-muted" />
                        <MedText variant="metadata">{doctor.clinicAddress}</MedText>
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-[12px] bg-foreground/5 flex items-center justify-center ml-3 flex-shrink-0">
                  <User size={20} className="text-border" />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Link href={`/patient/doctors/${doctor.id}`} className="flex-1">
                  <MedButton title="View" onPress={() => {}} type="outline" />
                </Link>
              </div>
            </MedCard>
          ))
        ) : (
          <div className="text-center py-12">
            <MedText variant="body" className="text-muted">No doctors found matching your criteria</MedText>
          </div>
        )}
      </div>
    </div>
  );
}
