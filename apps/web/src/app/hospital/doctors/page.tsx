'use client';

import React from 'react';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { Stethoscope } from 'lucide-react';

export default function HospitalDoctorsPage() {
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="mb-6">
        <MedText variant="h2" as="h2" className="text-[20px]">Doctors</MedText>
        <MedText variant="body" className="text-text-secondary mt-1">
          Manage doctors at your hospital.
        </MedText>
      </div>

      <MedCard>
        <div className="text-center py-12">
          <Stethoscope size={40} className="text-muted mx-auto mb-4" />
          <MedText variant="h2" as="h3" className="text-[18px] mb-2">Coming Soon</MedText>
          <MedText variant="body" className="text-text-secondary text-[14px]">
            Doctor management will be available in a future update. Doctors can currently register through the web portal and will appear here once this feature is live.
          </MedText>
        </div>
      </MedCard>
    </div>
  );
}
