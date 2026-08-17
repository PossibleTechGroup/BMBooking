'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchDoctorAppointments, acceptAppointment, declineAppointment } from '@/lib/store/slices/appointmentSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  accepted: 'bg-[#ECFDF3] text-[#027A48]',
  completed: 'bg-[#EFF6FF] text-[#2563EB]',
  declined: 'bg-[#FEF3F2] text-[#B42318]',
  cancelled: 'bg-[#F3F4F6] text-[#5A6B80]',
};

export default function DoctorAppointmentsPage() {
  const dispatch = useAppDispatch();
  const { appointments, loading } = useAppSelector((s) => s.appointment);
  const { token } = useAppSelector((s) => s.auth);
  const [filter, setFilter] = useState('all');
  const [declineModal, setDeclineModal] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    if (token) {
      dispatch(fetchDoctorAppointments({}));
    }
  }, [dispatch, token]);

  const filtered = appointments.filter((a) => filter === 'all' || a.status === filter);

  const handleDecline = async () => {
    if (declineModal && declineReason) {
      await dispatch(declineAppointment({ id: declineModal, reason: declineReason }));
      setDeclineModal(null);
      setDeclineReason('');
    }
  };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <MedText variant="h2" as="h2" className="text-[20px] mb-4">Appointments</MedText>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {['all', 'pending', 'accepted', 'completed', 'declined'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 capitalize transition-all ${
              filter === f ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'
            }`}>{f}</button>
        ))}
      </div>

      <div className="space-y-3 pb-24">
        {filtered.map((appt) => (
          <MedCard key={appt.id}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <MedText variant="body" className="text-[15px] font-medium text-text">
                  {appt.patient?.patientProfile?.fullName || 'Patient'}
                </MedText>
                <MedText variant="metadata">{appt.patient?.phone}</MedText>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_STYLES[appt.status]}`}>
                {appt.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                <MedText variant="metadata">{new Date(appt.dateTime).toLocaleDateString()}</MedText>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                <MedText variant="metadata">{new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</MedText>
              </span>
            </div>
            {appt.reason && <MedText variant="metadata" className="mt-2 text-text-secondary">Reason: {appt.reason}</MedText>}

            {appt.status === 'pending' && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <div className="flex-1">
                  <MedButton title="Accept" onPress={() => dispatch(acceptAppointment(appt.id))} />
                </div>
                <div className="flex-1">
                  <MedButton title="Decline" onPress={() => setDeclineModal(appt.id)} type="outline" />
                </div>
              </div>
            )}
          </MedCard>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <MedText variant="body" className="text-muted">No appointments found</MedText>
          </div>
        )}
      </div>

      {/* Decline Modal */}
      {declineModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center p-4" onClick={() => setDeclineModal(null)}>
          <div className="bg-surface rounded-t-[20px] sm:rounded-[20px] w-full max-w-lg p-6 animate-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
            <MedText variant="h2" as="h3" className="mb-4">Decline Appointment</MedText>
            <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason for declining..."
              className="w-full min-h-[80px] p-3 rounded-[12px] border border-border bg-surface text-text text-[14px] outline-none focus:border-border-focus resize-none placeholder:text-muted mb-4" />
            <div className="flex gap-2">
              <div className="flex-1"><MedButton title="Decline" onPress={handleDecline} disabled={!declineReason} /></div>
              <div className="flex-1"><MedButton title="Cancel" onPress={() => setDeclineModal(null)} type="outline" /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
