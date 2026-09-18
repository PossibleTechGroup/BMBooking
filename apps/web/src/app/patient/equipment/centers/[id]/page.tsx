'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { searchEquipment, MedicalEquipment } from '@/lib/store/slices/equipmentSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import EquipmentBookingModal from '../../EquipmentBookingModal';
import { ArrowLeft, MapPin, Activity } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  MRI: 'MRI',
  CT_SCAN: 'CT Scan',
  ULTRASOUND: 'Ultrasound',
  XRAY: 'X-Ray',
  LABORATORY: 'Laboratory',
};

export default function EquipmentCenterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { searchResults, loading } = useAppSelector((s) => s.equipment);
  const [bookingItem, setBookingItem] = useState<MedicalEquipment | null>(null);

  const id = Number(params.id);

  useEffect(() => {
    dispatch(searchEquipment({}));
  }, [dispatch]);

  const services = useMemo(
    () => searchResults.filter((eq) => eq.hospitalId === id),
    [searchResults, id]
  );

  const centerName = services[0]?.hospitalName || 'Diagnosis Center';
  const centerAddress = services[0]?.address || '';

  if (loading && services.length === 0) {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-text-secondary hover:text-text transition-colors">
        <ArrowLeft size={20} /> <MedText variant="body" className="text-[14px]">Back</MedText>
      </button>

      <MedText variant="metadata" className="text-primary font-semibold tracking-wide mb-1">
        DIAGNOSIS CENTER
      </MedText>
      <MedText variant="h1" as="h1" className="text-[20px] mb-1">{centerName}</MedText>
      {centerAddress && (
        <span className="flex items-center gap-1 mb-6">
          <MapPin size={13} className="text-muted" />
          <MedText variant="body" className="text-text-secondary text-[14px]">{centerAddress}</MedText>
        </span>
      )}

      <MedText variant="metadata" className="text-text-secondary text-[13px] tracking-[0.3px] mb-3">
        Services
      </MedText>

      {services.length === 0 ? (
        <MedCard>
          <div className="text-center py-10">
            <Activity size={36} className="text-border mx-auto mb-2" />
            <MedText variant="body" className="text-text-secondary">No services listed at this center yet</MedText>
          </div>
        </MedCard>
      ) : (
        <div className="space-y-3 pb-24">
          {services.map((eq) => {
            const price = eq.price != null ? `${eq.price} ETB` : 'Contact center';
            return (
              <MedCard key={eq.id}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-[12px] bg-foreground/5 flex items-center justify-center flex-shrink-0">
                    <Activity size={22} className="text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <MedText variant="body" className="text-[15px] font-medium text-text truncate">{eq.name}</MedText>
                    <MedText variant="metadata">
                      {CATEGORY_LABELS[eq.category] || eq.category} • {price} • {eq.duration || 30}min
                    </MedText>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`w-2 h-2 rounded-full ${eq.isOperational ? 'bg-success' : 'bg-error'}`} />
                      <MedText variant="metadata">{eq.isOperational ? 'Available' : 'Unavailable'}</MedText>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <MedButton
                      title="Book"
                      onPress={() => { setBookingItem(eq); }}
                      type="outline"
                      disabled={!eq.isOperational}
                    />
                  </div>
                </div>
              </MedCard>
            );
          })}
        </div>
      )}

      {bookingItem && (
        <EquipmentBookingModal item={bookingItem} onClose={() => setBookingItem(null)} />
      )}
    </div>
  );
}