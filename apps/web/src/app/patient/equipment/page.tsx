'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { searchEquipment, fetchEquipmentCategories, MedicalEquipment } from '@/lib/store/slices/equipmentSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { Search, Building2, MapPin, ChevronRight } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  MRI: 'MRI',
  CT_SCAN: 'CT Scan',
  ULTRASOUND: 'Ultrasound',
  XRAY: 'X-Ray',
  LABORATORY: 'Laboratory',
};

interface CenterGroup {
  hospitalId: number | null;
  name: string;
  address: string;
  services: MedicalEquipment[];
}

export default function EquipmentPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { searchResults, categories, loading } = useAppSelector((s) => s.equipment);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    dispatch(searchEquipment({}));
    dispatch(fetchEquipmentCategories());
  }, [dispatch]);

  const filtered = searchResults.filter((eq) => {
    const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.hospitalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || eq.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const centers = useMemo<CenterGroup[]>(() => {
    const map = new Map<number, CenterGroup>();
    for (const eq of filtered) {
      if (eq.hospitalId == null) continue;
      let group = map.get(eq.hospitalId);
      if (!group) {
        group = {
          hospitalId: eq.hospitalId,
          name: eq.hospitalName || 'Diagnosis Center',
          address: eq.address || '',
          services: [],
        };
        map.set(eq.hospitalId, group);
      }
      group.services.push(eq);
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <MedText variant="h2" as="h2" className="text-[20px] mb-4">Diagnosis Centers</MedText>

      <div className="flex items-center gap-2 bg-surface border border-border rounded-[12px] py-3 px-4 mb-4">
        <Search size={20} className="text-muted" />
        <input
          type="text"
          placeholder="Search services or centers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {['All', ...categories.map((c) => c.category)].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 transition-all ${
              selectedCategory === cat ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'
            }`}
          >
            {cat === 'All' ? 'All' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      <div className="space-y-3 pb-24">
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        {centers.map((center) => {
          const available = center.services.filter((s) => s.isOperational).length;
          const chips = [...new Set(center.services.map((s) => CATEGORY_LABELS[s.category] || s.category))].slice(0, 3);
          return (
            <MedCard
              key={center.hospitalId}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <button
                className="w-full flex items-start gap-3 text-left"
                onClick={() => router.push(`/patient/equipment/centers/${center.hospitalId}`)}
              >
                <div className="w-12 h-12 rounded-[12px] bg-foreground/5 flex items-center justify-center flex-shrink-0">
                  <Building2 size={22} className="text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <MedText variant="metadata" className="text-primary font-semibold tracking-wide">
                    DIAGNOSIS CENTER
                  </MedText>
                  <MedText variant="body" className="text-[15px] font-medium text-text truncate">
                    {center.name}
                  </MedText>
                  {center.address && (
                    <span className="flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-muted" />
                      <MedText variant="metadata" className="truncate">{center.address}</MedText>
                    </span>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <MedText variant="metadata">{available} {available === 1 ? 'service' : 'services'}</MedText>
                    {chips.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-foreground/5 text-text-secondary text-[11px] font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted flex-shrink-0 mt-2" />
              </button>
            </MedCard>
          );
        })}
        {!loading && centers.length === 0 && (
          <div className="text-center py-12">
            <MedText variant="body" className="text-muted">No diagnosis centers found</MedText>
          </div>
        )}
      </div>
    </div>
  );
}