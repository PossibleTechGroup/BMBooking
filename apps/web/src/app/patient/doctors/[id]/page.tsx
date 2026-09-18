'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchDoctorScheduleSlots, DoctorScheduleEntry } from '@/lib/store/slices/appointmentSlice';
import { useI18n } from '@/lib/i18n/LanguageProvider';
import LangSwitcher from '@/components/ui/lang-switcher';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { ArrowLeft, Star, MapPin, Award, Languages, Building2, User, Clock, CalendarDays, Phone, Navigation } from 'lucide-react';

interface Coords {
  lat: number;
  lng: number;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const { doctors } = useAppSelector((s) => s.doctors);
  const { doctorSchedules } = useAppSelector((s) => s.appointment);
  const doctor = doctors.find((d) => String(d.id) === String(params.id));
  const [schedulesLoaded, setSchedulesLoaded] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (doctor?.id) {
      const today = new Date();
      const end = new Date(today);
      end.setDate(end.getDate() + 14);
      const from = today.toISOString().split('T')[0];
      const to = end.toISOString().split('T')[0];
      dispatch(fetchDoctorScheduleSlots({ doctorId: doctor.id, from, to }))
        .unwrap()
        .then(() => setSchedulesLoaded(true))
        .catch(() => setSchedulesLoaded(true));
    }
  }, [doctor?.id, dispatch]);

  if (!doctor) {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <div className="text-center py-20">
          <MedText variant="body" className="text-muted">{t('loadingDoctorProfile')}</MedText>
        </div>
      </div>
    );
  }

  const groupedSchedules: Record<string, DoctorScheduleEntry[]> = {};
  (doctorSchedules || []).forEach((s: DoctorScheduleEntry) => {
    const dateKey = s.date?.split('T')[0];
    if (!dateKey) return;
    if (!groupedSchedules[dateKey]) groupedSchedules[dateKey] = [];
    groupedSchedules[dateKey].push(s);
  });
  const sortedDates = Object.keys(groupedSchedules).sort();

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors">
          <ArrowLeft size={20} /> <MedText variant="body" className="text-[14px]">{t('back')}</MedText>
        </button>
        <LangSwitcher />
      </div>

      {/* Doctor Header */}
      <MedCard className="mb-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-[16px] bg-foreground/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {doctor.profilePicture ? (
              <img src={doctor.profilePicture} alt={doctor.fullName} className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-border" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <MedText variant="h1" as="h1">{doctor.fullName}</MedText>
            <MedText variant="body" className="text-text-secondary mt-1">
              {doctor.specializations?.length ? doctor.specializations.join(', ') : doctor.specialization}
            </MedText>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Star size={14} className="text-star fill-star" />
                <MedText variant="metadata">{doctor.rating || '0.0'} ({doctor.totalReviews || 0} {t('reviews')})</MedText>
              </span>
              <span className="flex items-center gap-1">
                <Award size={14} className="text-muted" />
                <MedText variant="metadata">{doctor.experienceYears || 0} {t('yearsExp')}</MedText>
              </span>
            </div>
          </div>
        </div>
      </MedCard>

      {/* Bio */}
      {doctor.bio && (
        <MedCard className="mb-4">
          <MedText variant="h2" as="h3" className="mb-2">{t('about')}</MedText>
          <MedText variant="body" className="text-text-secondary">{doctor.bio}</MedText>
        </MedCard>
      )}

      {/* Details */}
      <MedCard className="mb-4">
        <MedText variant="h2" as="h3" className="mb-3">{t('details')}</MedText>
        <div className="space-y-3">
          {doctor.clinicName && (
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-muted flex-shrink-0" />
              <div>
                <MedText variant="metadata" className="text-muted">{t('clinic')}</MedText>
                <MedText variant="body" className="text-[14px]">{doctor.clinicName}</MedText>
              </div>
            </div>
          )}
          {doctor.clinicAddress && (
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-muted flex-shrink-0" />
              <div>
                <MedText variant="metadata" className="text-muted">{t('address')}</MedText>
                <MedText variant="body" className="text-[14px]">{doctor.clinicAddress}</MedText>
              </div>
            </div>
          )}
          {doctor.hospital?.name && (
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-muted flex-shrink-0" />
              <div>
                <MedText variant="metadata" className="text-muted">{t('hospital')}</MedText>
                <MedText variant="body" className="text-[14px]">{doctor.hospital.name}</MedText>
              </div>
            </div>
          )}
          {doctor.languages?.length > 0 && (
            <div className="flex items-center gap-3">
              <Languages size={18} className="text-muted flex-shrink-0" />
              <div>
                <MedText variant="metadata" className="text-muted">{t('languages')}</MedText>
                <MedText variant="body" className="text-[14px]">{doctor.languages.join(', ')}</MedText>
              </div>
            </div>
          )}
        </div>
      </MedCard>

      {/* Hospital Location */}
      {doctor.hospital && (
        <MedCard className="mb-4">
          <MedText variant="h2" as="h3" className="mb-3">{t('hospital')} Location</MedText>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-primary flex-shrink-0" />
              <div>
                <MedText variant="metadata" className="text-muted">{t('facility')}</MedText>
                <MedText variant="body" className="text-[14px]">{doctor.hospital.name}</MedText>
              </div>
            </div>
            {(doctor.hospital.address || doctor.clinicAddress) && (
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-primary flex-shrink-0" />
                <div>
                  <MedText variant="metadata" className="text-muted">{t('address')}</MedText>
                  <MedText variant="body" className="text-[14px]">{doctor.hospital.address || doctor.clinicAddress}</MedText>
                </div>
              </div>
            )}
            {doctor.hospital.phone && (
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-primary flex-shrink-0" />
                <div>
                  <MedText variant="metadata" className="text-muted">{t('phone')}</MedText>
                  <MedText variant="body" className="text-[14px]">{doctor.hospital.phone}</MedText>
                </div>
              </div>
            )}
            {coords && doctor.hospital.latitude && doctor.hospital.longitude && (
              <div className="flex items-center gap-3">
                <Navigation size={18} className="text-primary flex-shrink-0" />
                <MedText variant="body" className="text-[14px] text-primary font-semibold">
                  {haversineKm(coords.lat, coords.lng, doctor.hospital.latitude, doctor.hospital.longitude).toFixed(1)} km away
                </MedText>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            {doctor.hospital.phone && (
              <a href={`tel:${doctor.hospital.phone}`} className="flex-1">
                <MedButton title={t('call')} onPress={() => {}} />
              </a>
            )}
            {doctor.hospital.latitude && doctor.hospital.longitude && (
              <a
                href={`https://www.google.com/maps?q=${doctor.hospital.latitude},${doctor.hospital.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <MedButton title={t('directions')} onPress={() => {}} type="outline" />
              </a>
            )}
          </div>
        </MedCard>
      )}

      {/* Schedule */}
      <MedCard className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={18} className="text-primary" />
          <MedText variant="h2" as="h3">{t('upcomingSchedule')}</MedText>
        </div>
        {!schedulesLoaded ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedDates.length > 0 ? (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {sortedDates.map((dateKey) => {
              const d = new Date(dateKey + 'T00:00:00');
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = d.getDate();
              const month = d.toLocaleDateString('en-US', { month: 'short' });
              return (
                <div key={dateKey} className="flex gap-3">
                  <div className="w-12 h-12 rounded-[10px] bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-medium text-primary">{dayName}</span>
                    <span className="text-[16px] font-bold text-primary leading-none">{dayNum}</span>
                    <span className="text-[9px] text-primary/70">{month}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    {groupedSchedules[dateKey].map((s: DoctorScheduleEntry) => {
                      const start = s.startTime?.slice(11, 16) || '';
                      const end = s.endTime?.slice(11, 16) || '';
                      return (
                        <div key={s.id} className="flex items-center gap-2 text-[13px]">
                          <Clock size={12} className="text-muted flex-shrink-0" />
                          <span className="text-text-secondary">{start} – {end}</span>
                          {s.clinicRoom && (
                            <span className="text-muted">({s.clinicRoom})</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <MedText variant="metadata" className="text-muted text-center py-4 block">{t('noUpcomingSchedules')}</MedText>
        )}
      </MedCard>

      {/* Fees */}
      {(doctor.hospital?.serviceFee?.amount || doctor.hospital?.cardPrice) && (
        <MedCard className="mb-4">
          <MedText variant="h2" as="h3" className="mb-3">{t('fees')}</MedText>
          {doctor.hospital?.serviceFee?.amount && (
            <div className="flex justify-between items-center mb-3">
              <MedText variant="body" className="text-text-secondary">{t('appFee')}</MedText>
              <MedText variant="h2" as="span" className="text-success">ETB {doctor.hospital.serviceFee.amount}</MedText>
            </div>
          )}
          {doctor.hospital?.cardPrice && (
            <div className="flex justify-between items-center">
              <MedText variant="body" className="text-text-secondary">{t('hospitalCardPrice')}</MedText>
              <MedText variant="h2" as="span" className="text-success">ETB {doctor.hospital.cardPrice}</MedText>
            </div>
          )}
        </MedCard>
      )}

      {/* Book Button */}
      <div className="pb-8">
        <MedButton
          title={t('bookAppointment')}
          onPress={() => router.push(`/patient/appointments?book=${doctor.id}&name=${encodeURIComponent(doctor.fullName)}&fee=${doctor.hospital?.cardPrice || ''}`)}
        />
      </div>
    </div>
  );
}
