'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchDoctorProfileStatus, logout } from '@/lib/store/slices/authSlice';
import { MedText } from '@/components/ui/med-text';
import { MedButton } from '@/components/ui/med-button';
import { Clock, CheckCircle, LogOut, RefreshCw } from 'lucide-react';

export default function DoctorPendingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { doctorProfileStatus, loading } = useAppSelector((s) => s.auth);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (doctorProfileStatus === 'Approved') {
      setApproved(true);
      const timer = setTimeout(() => router.push('/doctor'), 2500);
      return () => clearTimeout(timer);
    }
  }, [doctorProfileStatus, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchDoctorProfileStatus());
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden sticky top-0 z-40 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/bm-booking-logo.png" alt="BM" width={32} height={32} className="w-8 h-8 rounded-[8px] object-cover" />
          <div>
            <h1 className="text-[16px] font-bold text-primary">BM</h1>
            <p className="text-[10px] text-muted">Doctor Portal</p>
          </div>
        </div>
        <button onClick={() => { dispatch(logout()); router.push('/login'); }} className="p-2 text-error">
          <LogOut size={20} />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        {!approved ? (
          <div className="text-center max-w-sm">
            <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
              <Clock size={48} className="text-amber-600" />
            </div>

            <MedText variant="h1" as="h1" className="mb-3">Under Review</MedText>
            <MedText variant="body" className="mb-8 text-center">
              Your profile has been submitted and is being reviewed by our team. We&apos;ll notify you once it&apos;s approved.
            </MedText>

            <MedCard className="mb-8 text-left">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <MedText variant="metadata" className="text-text-secondary">
                  This usually takes 1-2 business days. You can refresh to check the status.
                </MedText>
              </div>
            </MedCard>

            <MedButton
              title="Refresh Status"
              onPress={() => dispatch(fetchDoctorProfileStatus())}
              loading={loading}
              type="outline"
            />
          </div>
        ) : (
          <div className="text-center max-w-sm animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-emerald-600" />
            </div>

            <MedText variant="h1" as="h1" className="mb-3 text-emerald-700">Approved!</MedText>
            <MedText variant="body" className="text-center">
              Your profile has been verified. Redirecting to your dashboard...
            </MedText>
          </div>
        )}
      </div>
    </div>
  );
}
