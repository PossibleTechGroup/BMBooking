'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logout } from '@/lib/store/slices/authSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { User, Phone, Award, Building2, Star, LogOut } from 'lucide-react';

export default function DoctorProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const profile = user?.doctorProfile;

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
            <MedText variant="h2" as="h3">{profile?.fullName || user?.phone || 'Doctor'}</MedText>
            <MedText variant="metadata" className="text-text-secondary">{profile?.specialization || ''}</MedText>
          </div>
        </div>
      </MedCard>

      {/* Professional Info */}
      <MedCard className="mb-4">
        <MedText variant="h2" as="h3" className="mb-3">Professional Details</MedText>
        <div className="space-y-3">
          {profile?.experienceYears && (
            <div className="flex items-center gap-3">
              <Award size={18} className="text-muted" />
              <div>
                <MedText variant="metadata" className="text-muted">Experience</MedText>
                <MedText variant="body" className="text-[14px]">{profile.experienceYears} years</MedText>
              </div>
            </div>
          )}
          {profile?.hospital?.name && (
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-muted" />
              <div>
                <MedText variant="metadata" className="text-muted">Hospital</MedText>
                <MedText variant="body" className="text-[14px]">{profile.hospital.name}</MedText>
              </div>
            </div>
          )}
          {profile?.clinicName && (
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-muted" />
              <div>
                <MedText variant="metadata" className="text-muted">Clinic</MedText>
                <MedText variant="body" className="text-[14px]">{profile.clinicName}</MedText>
              </div>
            </div>
          )}
          {profile?.rating !== undefined && (
            <div className="flex items-center gap-3">
              <Star size={18} className="text-star" />
              <div>
                <MedText variant="metadata" className="text-muted">Rating</MedText>
                <MedText variant="body" className="text-[14px]">{profile.rating} ({profile.totalReviews || 0} reviews)</MedText>
              </div>
            </div>
          )}
        </div>
      </MedCard>

      {/* Bio */}
      {profile?.bio && (
        <MedCard className="mb-4">
          <MedText variant="h2" as="h3" className="mb-2">About</MedText>
          <MedText variant="body" className="text-text-secondary">{profile.bio}</MedText>
        </MedCard>
      )}

      {/* Contact */}
      <MedCard className="mb-4">
        <div className="flex items-center gap-3">
          <Phone size={18} className="text-muted" />
          <div>
            <MedText variant="metadata" className="text-muted">Phone</MedText>
            <MedText variant="body" className="text-[14px]">{user?.phone}</MedText>
          </div>
        </div>
      </MedCard>

      {/* Status */}
      {profile?.status && (
        <MedCard className="mb-4">
          <div className="flex justify-between items-center">
            <MedText variant="body" className="text-text-secondary">Profile Status</MedText>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              profile.status === 'Approved' ? 'bg-[#ECFDF3] text-[#027A48]' :
              profile.status === 'PendingReview' ? 'bg-[#FEF3C7] text-[#92400E]' :
              'bg-[#FEF3F2] text-[#B42318]'
            }`}>{profile.status}</span>
          </div>
        </MedCard>
      )}

      <div className="pb-8">
        <MedButton title="Logout" onPress={handleLogout} type="outline" />
      </div>
    </div>
  );
}
