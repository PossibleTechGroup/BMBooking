'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchHospitalPatients } from '@/lib/store/slices/hospitalSlice';
import { api } from '@/lib/api/client';
import { MedText } from '@/components/ui/med-text';
import { HeartPulse, Search, Phone, Calendar, Clock, Stethoscope, Wrench, X, CheckCircle, XCircle, Ban, Loader2 } from 'lucide-react';

interface HistoryData {
  patient: {
    id: number;
    phone: string | null;
    createdAt: string;
    patientProfile: {
      fullName: string | null;
      gender: string | null;
      bloodType: string | null;
      dateOfBirth: string | null;
      emergencyContact: string | null;
    } | null;
  };
  appointments: {
    id: number;
    dateTime: string;
    status: string;
    fee: string;
    isPaid: boolean;
    doctor: { id: number; fullName: string | null; specialization: string | null };
  }[];
  equipmentBookings: {
    id: number;
    dateTime: string;
    status: string;
    fee: string | null;
    equipment: { id: number; name: string | null; price: string | null };
    hospital: { id: number; name: string; serviceFee: { amount: string | null } | null } | null;
  }[];
}

const STATUS_ICON = (status: string) =>
  status === 'completed' || status === 'confirmed' ? <CheckCircle size={14} className="text-emerald-500" /> :
  status === 'cancelled' || status === 'declined' ? <Ban size={14} className="text-red-500" /> :
  <Clock size={14} className="text-amber-500" />;

interface PatientRow {
  id: number;
  fullName: string;
  phone: string | null;
}

export default function HospitalPatientsPage() {
  const dispatch = useAppDispatch();
  const { patients, loading } = useAppSelector((s) => s.hospital);
  const [search, setSearch] = useState('');
  const [historyPatient, setHistoryPatient] = useState<PatientRow | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => dispatch(fetchHospitalPatients(search)), 250);
    return () => clearTimeout(t);
  }, [dispatch, search]);

  const loadHistory = async (p: PatientRow) => {
    setHistoryPatient(p);
    setHistoryLoading(true);
    setHistory(null);
    try {
      const res = await api.get(`/hospital/patients/${p.id}/history`);
      setHistory(res.data.data);
    } catch {
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeModal = () => { setHistoryPatient(null); setHistory(null); };

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <MedText variant="h2" as="h2" className="text-[22px]">Patient History</MedText>
          <MedText variant="metadata" className="text-text-secondary mt-1">
            View all patients and their appointment / equipment booking history at this hospital.
          </MedText>
        </div>
        <div className="flex items-center gap-2 h-11 px-4 rounded-[12px] border border-border bg-surface">
          <Search size={18} className="text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="bg-transparent outline-none text-[14px] text-text placeholder:text-muted w-52"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : patients.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <HeartPulse size={44} className="mx-auto mb-3 opacity-40" />
          <MedText variant="body">No patients found.</MedText>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-border">
                <th className="px-5 py-3.5 text-[12px] font-semibold text-text-secondary uppercase tracking-wide">Patient</th>
                <th className="px-5 py-3.5 text-[12px] font-semibold text-text-secondary uppercase tracking-wide">Contact</th>
                <th className="px-5 py-3.5 text-[12px] font-semibold text-text-secondary uppercase tracking-wide">Demographics</th>
                <th className="px-5 py-3.5 text-[12px] font-semibold text-text-secondary uppercase tracking-wide">Bookings</th>
                <th className="px-5 py-3.5 text-[12px] font-semibold text-text-secondary uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b border-border/60 hover:bg-foreground/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] bg-[#E3EFFB] text-[#1565C0] font-bold flex items-center justify-center shrink-0">
                        {(p.fullName || '?')[0]}
                      </div>
                      <div>
                        <MedText variant="body" className="font-medium text-[14px]">{p.fullName}</MedText>
                        <MedText variant="metadata" className="text-muted">ID: #{p.id}</MedText>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-[14px] text-text-secondary">
                      <Phone size={13} className="text-muted" /> {p.phone || '—'}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-foreground/5 text-text-secondary uppercase">{p.gender || 'N/A'}</span>
                      {p.bloodType && <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#FEE4E2] text-[#B42318] uppercase">{p.bloodType}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[14px] text-text-secondary">{p.bookings} appointment(s)</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => loadHistory(p)}
                      className="text-[#1565C0] font-semibold text-[14px] hover:underline inline-flex items-center gap-1"
                    >
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {historyPatient && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-surface rounded-[16px] w-full max-w-[640px] max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <MedText variant="h2" as="h3" className="text-[20px] font-bold">{historyPatient.fullName}</MedText>
                <MedText variant="metadata" className="text-muted mt-0.5">ID: #{historyPatient.id} &middot; {historyPatient.phone || 'No phone'}</MedText>
              </div>
              <button onClick={closeModal} className="text-muted hover:text-text"><X size={20} /></button>
            </div>

            {historyLoading ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-primary" /></div>
            ) : history ? (
              <div className="space-y-5">
                <div>
                  <MedText variant="body" className="font-semibold text-[15px] flex items-center gap-2">
                    <Stethoscope size={16} className="text-primary" /> Appointments ({history.appointments.length})
                  </MedText>
                  {history.appointments.length === 0 ? (
                    <MedText variant="metadata" className="text-muted py-2">No appointments.</MedText>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {history.appointments.map((a) => (
                        <div key={a.id} className="flex items-center gap-3 px-3.5 py-2.5 bg-foreground/[0.03] rounded-[10px]">
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-text truncate">{a.doctor?.fullName || 'N/A'}</div>
                            <div className="text-[12px] text-muted truncate">{a.doctor?.specialization || ''}</div>
                          </div>
                          <div className="text-[12px] text-muted flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar size={13} /> {new Date(a.dateTime).toLocaleString()}
                          </div>
                          {STATUS_ICON(a.status)}
                          <span className="text-[12px] font-semibold text-text-secondary capitalize">{a.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <MedText variant="body" className="font-semibold text-[15px] flex items-center gap-2">
                    <Wrench size={16} className="text-primary" /> Equipment Bookings ({history.equipmentBookings.length})
                  </MedText>
                  {history.equipmentBookings.length === 0 ? (
                    <MedText variant="metadata" className="text-muted py-2">No equipment bookings.</MedText>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {history.equipmentBookings.map((b) => (
                        <div key={b.id} className="flex items-center gap-3 px-3.5 py-2.5 bg-foreground/[0.03] rounded-[10px]">
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-text truncate">{b.equipment?.name || 'N/A'}</div>
                            <div className="text-[12px] text-muted truncate">{b.hospital?.name || ''}</div>
                            <div className="text-[12px] font-medium text-primary truncate">
                              Equipment {Number(b.equipment?.price ?? 0)} ETB + Hospital fee {Number(b.hospital?.serviceFee?.amount ?? 50)} ETB
                            </div>
                          </div>
                          <div className="text-[12px] text-muted flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar size={13} /> {new Date(b.dateTime).toLocaleString()}
                          </div>
                          {STATUS_ICON(b.status)}
                          <span className="text-[12px] font-semibold text-text-secondary capitalize">{b.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <MedText variant="body" className="text-muted">Failed to load history.</MedText>
            )}
          </div>
        </div>
      )}
    </div>
  );
}