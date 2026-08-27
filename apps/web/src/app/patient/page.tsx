'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchHospitals } from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { Search, ArrowRight, MapPin, Phone, Heart, Stethoscope, Brain, Baby, Bone, Eye, Cpu, Hospital } from 'lucide-react';

const SERVICES = [
  { label: 'Cardiology', icon: Heart, category: 'cardiology' },
  { label: 'Dermatology', icon: Stethoscope, category: 'dermatology' },
  { label: 'Neurology', icon: Brain, category: 'neurology' },
  { label: 'Pediatrics', icon: Baby, category: 'pediatrics' },
  { label: 'Orthopedics', icon: Bone, category: 'orthopedics' },
  { label: 'Ophthalmology', icon: Eye, category: 'ophthalmology' },
];

export default function PatientHomePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { hospitals, loading } = useAppSelector((s) => s.hospital);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!hospitals.length) {
      dispatch(fetchHospitals());
    }
  }, [dispatch, hospitals.length]);

  const filteredHospitals = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hospitals;
    return hospitals.filter(
      (h) =>
        h.name?.toLowerCase().includes(q) ||
        h.address?.toLowerCase().includes(q) ||
        (h.phone ?? '').toLowerCase().includes(q)
    );
  }, [hospitals, query]);

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
      <div className="flex items-center gap-3 bg-surface border border-border rounded-[12px] py-3 px-4 mb-8 hover:shadow-md transition-shadow">
        <Search size={20} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search hospitals by name, location..."
          className="w-full bg-transparent outline-none text-[15px] text-text placeholder:text-muted"
        />
      </div>

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

      {/* Hospitals Grid */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <MedText variant="metadata" className="text-text-secondary text-[13px] tracking-[0.3px]">Hospitals</MedText>
          <MedText variant="metadata" className="text-muted">{filteredHospitals.length} available</MedText>
        </div>

        {loading && hospitals.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="text-center py-12">
            <Hospital size={40} className="text-border mx-auto mb-3" />
            <MedText variant="body" className="text-text-secondary">No hospitals found</MedText>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredHospitals.map((h) => (
              <Link key={h.id} href={`/patient/hospitals/${h.id}`}>
                <MedCard className="h-full hover:shadow-md transition-shadow">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-[12px] bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {h.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                      ) : (
                        <Hospital size={28} className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <MedText variant="body" className="text-[16px] font-medium text-text truncate">{h.name}</MedText>
                      {h.address && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-muted flex-shrink-0" />
                          <MedText variant="metadata" className="truncate">{h.address}</MedText>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Stethoscope size={12} className="text-muted" />
                        <MedText variant="metadata">{h.doctorCount || 0} doctors</MedText>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-[12px] text-primary font-medium flex items-center gap-1">
                      View hospital <ArrowRight size={12} />
                    </div>
                    {h.phone && (
                      <div className="flex items-center gap-1 text-muted">
                        <Phone size={12} />
                        <MedText variant="metadata">{h.phone}</MedText>
                      </div>
                    )}
                  </div>
                </MedCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
