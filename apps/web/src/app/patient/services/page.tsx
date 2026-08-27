'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { Search, Star, MapPin, SlidersHorizontal, Stethoscope, Hospital, Navigation, ChevronLeft, User } from 'lucide-react';

const SERVICES = [
  'General Checkup', 'Dental', 'Orthopedics / Bone & Joint', 'Cardiology / Heart',
  'Dermatology / Skin', 'Eye Care / Ophthalmology', 'Neurology / Brain & Nerves',
  'ENT / Ear, Nose & Throat', 'Gastroenterology / Digestive', 'Pediatrics / Children',
  "Gynecology / Women's Health", 'Urology', 'Psychiatry / Mental Health',
  'Pulmonology / Lungs', 'Laboratory / Lab Tests', 'Pharmacy', 'Emergency / 24/7',
];

export default function ServiceSearchPageWrapper() {
  return (
    <Suspense fallback={<div className="p-5 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
      <ServiceSearchPage />
    </Suspense>
  );
}

function ServiceSearchPage() {
  const searchParams = useSearchParams();
  const [initialized, setInitialized] = useState(false);
  const [type, setType] = useState<'all' | 'doctor' | 'hospital'>('all');
  const [service, setService] = useState('');
  const [query, setQuery] = useState('');
  const [availability, setAvailability] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [data, setData] = useState<{ doctors: any[]; hospitals: any[] }>({ doctors: [], hospitals: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const preset = searchParams.get('service');
    if (preset && SERVICES.includes(preset)) setService(preset);
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('type', type === 'all' ? '' : type);
      if (service) params.set('service', service);
      if (query.trim()) params.set('q', query.trim());
      if (availability) params.set('availability', 'true');
      if (coords) {
        params.set('lat', String(coords.lat));
        params.set('lng', String(coords.lng));
        params.set('radius', '50');
      }
      const response = await api.get(`/hospitals/search?${params.toString()}`);
      const res = response.data.data || { doctors: [], hospitals: [] };
      setData({ doctors: res.doctors || [], hospitals: res.hospitals || [] });
    } catch (err) {
      setData({ doctors: [], hospitals: [] });
    } finally {
      setLoading(false);
    }
  }, [type, service, query, availability, coords]);

  useEffect(() => {
    if (!initialized) return;
    const t = setTimeout(() => runSearch(), 300);
    return () => clearTimeout(t);
  }, [runSearch, initialized]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) { setGeoError('Geolocation is not supported'); return; }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setGeoError('Unable to get your location. Please try again.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const total = data.doctors.length + data.hospitals.length;

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <Link href="/patient" className="p-1.5 -ml-2 hover:bg-foreground/5 rounded-lg">
          <ChevronLeft size={20} />
        </Link>
        <MedText variant="h2" as="h2" className="text-[20px]">Find Services</MedText>
        <button
          onClick={locateMe}
          className={`ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium border transition-colors ${coords ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-primary hover:border-primary/40'}`}
        >
          {locating ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Navigation size={15} />}
          <span>Near Me</span>
        </button>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-[12px] py-3 px-4">
          <Search size={20} className="text-muted flex-shrink-0" />
          <input type="text" placeholder="Search doctors, hospitals, services, location..." value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted" />
          <button onClick={() => setShowFilters(!showFilters)} className="p-1.5 hover:bg-foreground/5 rounded-lg transition-colors">
            <SlidersHorizontal size={18} className={showFilters ? 'text-primary' : 'text-muted'} />
          </button>
        </div>
      </div>

      <div className="px-5 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {(['all', 'doctor', 'hospital'] as const).map((t) => (
          <button key={t} onClick={() => setType(t)} className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${type === t ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'}`}>
            {t === 'all' ? 'All' : t === 'doctor' ? 'Doctors' : 'Hospitals'}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="px-5 pb-3">
          <div className="bg-surface border border-border rounded-[12px] p-4 space-y-4">
            <div>
              <MedText variant="metadata" className="mb-2">Service</MedText>
              <select value={service} onChange={(e) => setService(e.target.value)} className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-[14px] outline-none">
                <option value="">All services</option>
                {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={availability} onChange={(e) => setAvailability(e.target.checked)} className="accent-primary" />
              <MedText variant="body" className="text-[14px]">Currently available (at least one upcoming slot)</MedText>
            </label>
            {coords && (
              <div className="flex items-center justify-between bg-foreground/5 rounded-lg px-3 py-2">
                <MedText variant="metadata" className="flex items-center gap-1"><Navigation size={13} className="text-primary" /> Located - sorted by distance</MedText>
                <button onClick={() => setCoords(null)} className="text-[13px] text-primary font-medium">Clear</button>
              </div>
            )}
            {geoError && <MedText variant="metadata" className="text-red-500">{geoError}</MedText>}
          </div>
        </div>
      )}

      <div className="px-5 pb-2">
        <MedText variant="metadata" className="text-muted">{total} results found {coords ? '· sorted by distance' : ''}</MedText>
      </div>

      {loading && total === 0 ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <>
          {type !== 'hospital' && data.doctors.length > 0 && (
            <div className="px-5 pb-4">
              <MedText variant="metadata" className="text-text-secondary text-[13px] tracking-[0.3px] mb-2">Doctors ({data.doctors.length})</MedText>
              <div className="space-y-2">
                {data.doctors.map((d: any) => (
                  <MedCard key={d.id}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <MedText variant="body" className="text-[16px] font-medium text-text truncate">{d.fullName || 'Doctor'}</MedText>
                        <MedText variant="metadata" className="truncate">{d.specializations?.length ? d.specializations.join(', ') : d.specialization}</MedText>
                        {d.hospital?.name && <MedText variant="metadata">{d.hospital.name}</MedText>}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1"><Star size={13} className="text-star fill-star" /><MedText variant="metadata">{d.rating || '0.0'}</MedText></span>
                          {d.distanceKm != null && <span className="flex items-center gap-1"><MapPin size={12} className="text-muted" /><MedText variant="metadata">{d.distanceKm} km</MedText></span>}
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${d.availability ? 'bg-green-100 text-green-700' : 'bg-foreground/5 text-muted'}`}>{d.availability ? 'Available' : 'Unavailable'}</span>
                        </div>
                      </div>
                      <div className="w-14 h-14 rounded-[12px] bg-foreground/5 flex items-center justify-center ml-3 flex-shrink-0 overflow-hidden">
                        {d.profilePicture ? <img src={d.profilePicture} alt={d.fullName} className="w-full h-full object-cover" /> : <User size={20} className="text-border" />}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link href={`/patient/doctors/${d.id}`} className="flex-1">
                        <span className="flex items-center justify-center py-2 rounded-lg border border-primary text-primary text-[14px] font-medium">View Doctor</span>
                      </Link>
                    </div>
                  </MedCard>
                ))}
              </div>
            </div>
          )}

          {type !== 'doctor' && data.hospitals.length > 0 && (
            <div className="px-5 pb-4">
              <MedText variant="metadata" className="text-text-secondary text-[13px] tracking-[0.3px] mb-2">Hospitals & Clinics ({data.hospitals.length})</MedText>
              <div className="space-y-2">
                {data.hospitals.map((h: any) => (
                  <Link key={h.id} href={`/patient/hospitals/${h.id}`}>
                    <MedCard className="hover:shadow-md transition-shadow">
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-[12px] bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {h.image ? <img src={h.image} alt={h.name} className="w-full h-full object-cover" /> : <Hospital size={24} className="text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <MedText variant="body" className="text-[16px] font-medium text-text truncate">{h.name}</MedText>
                          {h.address && <div className="flex items-center gap-1 mt-0.5"><MapPin size={12} className="text-muted flex-shrink-0" /><MedText variant="metadata" className="truncate">{h.address}</MedText></div>}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1"><Stethoscope size={12} className="text-muted" /><MedText variant="metadata">{h.doctorCount || 0} doctors</MedText></span>
                            {h.distanceKm != null && <span className="flex items-center gap-1"><MapPin size={12} className="text-muted" /><MedText variant="metadata">{h.distanceKm} km</MedText></span>}
                          </div>
                          {h.services?.length > 0 && (
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              {h.services.slice(0, 4).map((s: string) => <span key={s} className="text-[11px] bg-foreground/5 text-text-secondary px-2 py-0.5 rounded-full">{s}</span>)}
                              {h.services.length > 4 && <span className="text-[11px] text-muted">+{h.services.length - 4}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </MedCard>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {total === 0 && (
            <div className="text-center py-12"><MedText variant="body" className="text-muted">No results found. Try different filters or clear "Near Me".</MedText></div>
          )}
        </>
      )}
    </div>
  );
}
