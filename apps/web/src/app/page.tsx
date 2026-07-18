'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { loadStoredAuth } from '@/lib/store/slices/authSlice';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, token, doctorProfileStatus, patientProfileStatus } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }
    if (user.role === 'doctor') {
      if (doctorProfileStatus === 'None' || doctorProfileStatus === 'Rejected') {
        router.push('/doctor/onboarding');
      } else if (doctorProfileStatus === 'PendingReview') {
        router.push('/doctor/pending');
      } else {
        router.push('/doctor');
      }
    } else {
      if (patientProfileStatus === 'None') {
        router.push('/patient/onboarding');
      } else {
        router.push('/patient');
      }
    }
  }, [user, token, doctorProfileStatus, patientProfileStatus, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
