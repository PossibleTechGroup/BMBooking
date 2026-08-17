'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logout, fetchDoctorProfileStatus } from '@/lib/store/slices/authSlice';
import { MedText } from '@/components/ui/med-text';
import { MedButton } from '@/components/ui/med-button';
import { LogOut, RefreshCw, Hourglass, Info } from 'lucide-react';

export default function DoctorPendingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token, loading, doctorProfileStatus, rejectionReason } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (doctorProfileStatus === 'Approved') {
      router.replace('/doctor');
    } else if (doctorProfileStatus === 'Rejected') {
      router.replace('/doctor/setup');
    } else if (doctorProfileStatus === 'None') {
      router.replace('/doctor/setup');
    }
  }, [doctorProfileStatus, router]);

  useEffect(() => {
    if (!token && typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_token');
      if (!stored) router.push('/login');
    }
  }, [token, router]);

  const handleLogout = () => { dispatch(logout()); router.push('/login'); };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
        <div className="flex items-center gap-2.5">
          <Image src="/bm-booking-logo.png" alt="BM" width={36} height={36} className="w-9 h-9 rounded-[10px] object-cover" />
          <h1 className="text-[16px] font-bold text-primary leading-tight">BM</h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium text-error hover:bg-error-bg transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-[100px] h-[100px] rounded-full bg-[#FAEEDA] flex items-center justify-center mb-8 animate-pulse">
          <Hourglass size={58} className="text-[#B54708]" />
        </div>

        <MedText variant="h1" as="h2" className="text-[22px] mb-2">Under Review</MedText>
        <MedText variant="body" className="text-muted max-w-sm mb-6">
          Your profile has been submitted. The reception team is reviewing your application. You&apos;ll be able to use your
          dashboard once approved.
        </MedText>

        <div className="flex items-start gap-3 w-full max-w-sm px-4 py-3.5 rounded-[12px] bg-primary/5 border border-primary/20 text-left mb-6">
          <Info size={18} className="text-primary shrink-0 mt-0.5" />
          <MedText variant="metadata">
            You will be notified once your account is activated. Click below to refresh your status.
          </MedText>
        </div>

        {rejectionReason && (
          <div className="w-full max-w-sm px-4 py-3.5 rounded-[12px] bg-[#FCEBEB] border border-[#FEE4E2] text-left mb-6">
            <MedText variant="metadata" className="text-[#D92D20] font-bold">Correction Required</MedText>
            <MedText variant="metadata" className="text-[#D92D20]">{rejectionReason}</MedText>
          </div>
        )}

        <MedButton
          title="Refresh Status"
          onPress={() => dispatch(fetchDoctorProfileStatus())}
          loading={loading}
          type="outline"
          icon={<RefreshCw size={16} />}
          className="max-w-sm"
        />
      </div>
    </div>
  );
}
