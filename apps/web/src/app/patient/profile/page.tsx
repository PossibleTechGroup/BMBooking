'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logout } from '@/lib/store/slices/authSlice';
import { fetchPatientProfile } from '@/lib/store/slices/patientSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { User, Phone, Droplets, Calendar, LogOut, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const { profile } = useAppSelector((s) => s.patient);

  useEffect(() => {
    dispatch(fetchPatientProfile());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <MedText variant="h2" as="h2" className="text-[20px] mb-6">Profile</MedText>

      {/* Avatar + Name */}
      <MedCard className="mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
            <User size={28} className="text-muted" />
          </div>
          <div>
            <MedText variant="h2" as="h3">{profile?.fullName || user?.patientProfile?.fullName || 'User'}</MedText>
            <MedText variant="metadata" className="text-text-secondary">{user?.phone}</MedText>
          </div>
        </div>
      </MedCard>

      {/* Info Cards */}
      <MedCard className="mb-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-muted" />
              <div>
                <MedText variant="metadata" className="text-muted">Phone</MedText>
                <MedText variant="body" className="text-[14px]">{user?.phone}</MedText>
              </div>
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplets size={18} className="text-muted" />
              <div>
                <MedText variant="metadata" className="text-muted">Blood Type</MedText>
                <MedText variant="body" className="text-[14px]">{profile?.bloodType || user?.patientProfile?.bloodType || 'Not set'}</MedText>
              </div>
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-muted" />
              <div>
                <MedText variant="metadata" className="text-muted">Gender</MedText>
                <MedText variant="body" className="text-[14px] capitalize">{profile?.gender || user?.patientProfile?.gender || 'Not set'}</MedText>
              </div>
            </div>
          </div>
        </div>
      </MedCard>

      {/* Emergency Contact */}
      {(profile?.emergencyContact || user?.patientProfile?.emergencyContact) && (
        <MedCard className="mb-4">
          <MedText variant="h2" as="h3" className="mb-2">Emergency Contact</MedText>
          <MedText variant="body" className="text-text-secondary">{profile?.emergencyContact || user?.patientProfile?.emergencyContact}</MedText>
        </MedCard>
      )}

      {/* Logout */}
      <div className="pb-8">
        <MedButton title="Logout" onPress={handleLogout} type="outline" />
      </div>
    </div>
  );
}
