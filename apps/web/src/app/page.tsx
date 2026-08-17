'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, token } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (user && token) {
      if (user.role === 'hospital') router.push('/hospital');
      else router.push(user.role === 'doctor' ? '/doctor' : '/patient');
    } else {
      router.push('/login');
    }
  }, [user, token, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
