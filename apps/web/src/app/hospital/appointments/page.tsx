'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchHospitalAppointments, fetchHospitalDoctors } from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { ClipboardList, Search, Clock, CreditCard, ChevronLeft, ChevronRight, Phone, Pill, Hash } from 'lucide-react';

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const statusColor = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 'bg-success/10 text-success';
  if (s === 'cancelled') return 'bg-error/10 text-error';
  if (s === 'accepted') return 'bg-blue/10 text-blue';
  return 'bg-warning/10 text-warning';
};

function formatMoney(v?: string | number) {
  return `ETB ${Number(v || 0).toLocaleString()}`;
}

export default function HospitalAppointmentsPage() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { appointments, appointmentsTotal, loading, doctors } = useAppSelector((s) => s.hospital);

  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    if (token) {
      dispatch(fetchHospitalDoctors());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (token) {
      dispatch(
        fetchHospitalAppointments({
          status: status === 'all' ? undefined : status,
          search: search || undefined,
          doctorId: doctorId === '' ? undefined : Number(doctorId),
          from: from || undefined,
          to: to || undefined,
          page,
          limit,
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, token, status, search, doctorId, from, to, page]);

  const totalPages = Math.max(1, Math.ceil(appointmentsTotal / limit));

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="mb-5">
        <MedText variant="h2" as="h2" className="text-[20px]">Appointments</MedText>
        <MedText variant="body" className="text-text-secondary mt-1">
          View and filter all patient bookings.
        </MedText>
      </div>

      {/* Filters */}
      <MedCard className="mb-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-border rounded-[10px] text-[13px] focus:outline-none focus:border-primary"
              placeholder="Search patient / phone / code"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="w-full px-3 py-2 border border-border rounded-[10px] text-[13px] focus:outline-none focus:border-primary bg-surface"
            value={doctorId}
            onChange={(e) => { setDoctorId(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}
          >
            <option value="">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.fullName || `Doctor #${d.id}`}</option>
            ))}
          </select>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-[10px] text-[13px] focus:outline-none focus:border-primary bg-surface"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          />
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-[10px] text-[13px] focus:outline-none focus:border-primary bg-surface"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => {
            const active = status === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setStatus(t.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${active ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </MedCard>

      {loading && !appointments.length ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : appointments.length === 0 ? (
        <MedCard>
          <div className="text-center py-10">
            <ClipboardList size={28} className="text-muted mx-auto mb-3" />
            <MedText variant="body" className="text-text-secondary">No appointments found.</MedText>
          </div>
        </MedCard>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <MedCard key={a.id}>
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <MedText variant="body" className="text-[14px] font-medium text-text">{a.patientName}</MedText>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColor(a.status)}`}>
                      {a.status || 'booked'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-text-secondary">
                    <span className="flex items-center gap-1">
                      <ClipboardList size={13} className="text-muted" />
                      {a.doctorName || 'Doctor'} {a.specialization ? `• ${a.specialization}` : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-muted" />
                      {a.dateTime ? new Date(a.dateTime).toLocaleString() : 'N/A'}
                      {a.slotStart ? ` • ${a.slotStart}` : ''}
                    </span>
                    {a.slotMaxPatients != null && <span>Serving {a.slotMaxPatients}</span>}
                  </div>
                  {a.patientPhone && (
                    <div className="flex items-center gap-1 mt-1 text-[12px] text-text-secondary">
                      <Phone size={13} className="text-muted" /> {a.patientPhone}
                    </div>
                  )}
                  {(a.patientGender || a.patientBloodType) && (
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-text-secondary">
                      {a.patientGender && <span className="flex items-center gap-1"><Pill size={13} className="text-muted" />{a.patientGender}</span>}
                      {a.patientBloodType && <span className="flex items-center gap-1"><Pill size={13} className="text-muted" />{a.patientBloodType}</span>}
                    </div>
                  )}
                  {a.confirmationCode && (
                    <div className="flex items-center gap-1 mt-1 text-[12px] text-text-secondary">
                      <Hash size={13} className="text-muted" /> Code: {a.confirmationCode}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {(a.fee != null || a.card) && (
                    <div className="flex flex-col items-end gap-1">
                      {a.fee != null && (
                        <MedText variant="body" className="text-[14px] font-semibold">{formatMoney(a.fee)}</MedText>
                      )}
                      {a.isPaid != null && (
                        <span className={`text-[11px] font-medium ${a.isPaid ? 'text-success' : 'text-warning'}`}>
                          {a.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {a.card && (
                <div className="mt-3 border-t border-border pt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-text-secondary">
                  <span className="flex items-center gap-1"><CreditCard size={13} className="text-muted" />{a.card.code}</span>
                  {a.card.name && <span>{a.card.name}</span>}
                  <span className={a.card.isActive ? 'text-success' : 'text-error'}>
                    {a.card.isActive ? 'Active' : 'Expired'}
                  </span>
                  {a.card.activatedAt && <span>Activated {new Date(a.card.activatedAt).toLocaleDateString()}</span>}
                  <span>Expires {new Date(a.card.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </MedCard>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-2">
              <MedText variant="metadata">{appointmentsTotal} total</MedText>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-[10px] border border-border hover:bg-surface disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <MedText variant="metadata">Page {page} / {totalPages}</MedText>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-[10px] border border-border hover:bg-surface disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
