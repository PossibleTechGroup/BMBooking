'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { searchEquipment, fetchEquipmentCategories } from '@/lib/store/slices/equipmentSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { Search, Cpu, Clock, MapPin } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  MRI: 'MRI',
  CT_SCAN: 'CT Scan',
  ULTRASOUND: 'Ultrasound',
  XRAY: 'X-Ray',
  LABORATORY: 'Laboratory',
};

export default function EquipmentPage() {
  const dispatch = useAppDispatch();
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

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <MedText variant="h2" as="h2" className="text-[20px] mb-4">Medical Equipment</MedText>

      {/* Search */}
      <div className="flex items-center gap-2 bg-surface border border-border rounded-[12px] py-3 px-4 mb-4">
        <Search size={20} className="text-muted" />
        <input
          type="text"
          placeholder="Search equipment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
        />
      </div>

      {/* Categories */}
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

      {/* Results */}
      <div className="space-y-3 pb-24">
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        {filtered.map((eq) => (
          <MedCard key={eq.id}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-[12px] bg-foreground/5 flex items-center justify-center flex-shrink-0">
                <Cpu size={22} className="text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <MedText variant="body" className="text-[15px] font-medium text-text truncate">{eq.name}</MedText>
                <MedText variant="metadata">{CATEGORY_LABELS[eq.category] || eq.category}</MedText>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-muted" />
                    <MedText variant="metadata">{eq.hospitalName}</MedText>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-muted" />
                    <MedText variant="metadata">{eq.duration}min</MedText>
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`w-2 h-2 rounded-full ${eq.isOperational ? 'bg-success' : 'bg-error'}`} />
                  <MedText variant="metadata">{eq.isOperational ? 'Available' : 'Unavailable'}</MedText>
                </div>
              </div>
            </div>
          </MedCard>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <MedText variant="body" className="text-muted">No equipment found</MedText>
          </div>
        )}
      </div>
    </div>
  );
}
