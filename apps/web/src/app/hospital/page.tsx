'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchHospitalStats } from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { Stethoscope, Users, ClipboardList, TrendingUp } from 'lucide-react';

export default function HospitalDashboardPage() {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((s) => s.auth);
  const { profile, stats } = useAppSelector((s) => s.hospital);

  useEffect(() => {
    if (token) {
      dispatch(fetchHospitalStats());
    }
  }, [dispatch, token]);

  const cards = [
    { label: 'Doctors', value: stats?.doctors || 0, icon: Stethoscope, color: 'text-blue', href: '/hospital/doctors' },
    { label: 'Receptionists', value: stats?.receptionists || 0, icon: Users, color: 'text-secondary', href: '/hospital/receptionists' },
    { label: 'Appointments', value: stats?.appointments || 0, icon: ClipboardList, color: 'text-success', href: '/hospital' },
  ];

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="mb-6">
        <MedText variant="h2" as="h2" className="text-[20px]">Dashboard</MedText>
        <MedText variant="body" className="text-text-secondary mt-1">
          Welcome back, {profile?.name || user?.phone || 'Hospital'}
        </MedText>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <MedCard className="h-full hover:shadow-md transition-shadow">
              <c.icon size={20} className={`${c.color} mb-2`} />
              <MedText variant="h1" as="span" className="text-[24px] block">{c.value}</MedText>
              <MedText variant="metadata">{c.label}</MedText>
            </MedCard>
          </Link>
        ))}
      </div>

      {!stats && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}
    </div>
  );
}
