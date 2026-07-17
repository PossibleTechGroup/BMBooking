'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchMyAppointments, createAppointment, cancelAppointment, fetchDoctorScheduleSlots } from '@/lib/store/slices/appointmentSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { Calendar, Clock, X, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  accepted: 'bg-[#ECFDF3] text-[#027A48]',
  completed: 'bg-[#EFF6FF] text-[#2563EB]',
  declined: 'bg-[#FEF3F2] text-[#B42318]',
  cancelled: 'bg-[#F3F4F6] text-[#667085]',
};

export default function AppointmentsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-5 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
      <AppointmentsPage />
    </Suspense>
  );
}

function AppointmentsPage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { appointments, loading } = useAppSelector((s) => s.appointment);
  const [filter, setFilter] = useState('all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDoctorId, setBookingDoctorId] = useState<number | null>(null);
  const [bookingDoctorName, setBookingDoctorName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  useEffect(() => {
    dispatch(fetchMyAppointments());
  }, [dispatch]);

  useEffect(() => {
    const bookDoctorId = searchParams.get('book');
    if (bookDoctorId) {
      setBookingDoctorId(Number(bookDoctorId));
      setBookingDoctorName(searchParams.get('name') || '');
      setShowBookingModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (bookingDoctorId && bookingDate) {
      dispatch(fetchDoctorScheduleSlots({ doctorId: bookingDoctorId, from: bookingDate, to: bookingDate }))
        .unwrap()
        .then((data) => setAvailableSlots(data || []))
        .catch(() => setAvailableSlots([]));
    }
  }, [bookingDoctorId, bookingDate, dispatch]);

  const filtered = appointments.filter((a) => filter === 'all' || a.status === filter);

  const handleBook = async () => {
    if (!bookingDoctorId || !bookingDate || !bookingTime) return;
    const dateTime = `${bookingDate}T${bookingTime}:00.000Z`;
    await dispatch(createAppointment({ doctorId: bookingDoctorId, dateTime, reason: bookingReason }));
    setShowBookingModal(false);
    setBookingDoctorId(null);
    setBookingDate('');
    setBookingTime('');
    setBookingReason('');
  };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <MedText variant="h2" as="h2" className="text-[20px] mb-4">My Appointments</MedText>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {['all', 'pending', 'accepted', 'completed', 'declined', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 capitalize transition-all ${
              filter === f ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Appointment list */}
      <div className="space-y-3 pb-24">
        {filtered.map((appt) => (
          <MedCard key={appt.id}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <MedText variant="body" className="text-[15px] font-medium text-text">{appt.doctor?.fullName || 'Doctor'}</MedText>
                <MedText variant="metadata">{appt.doctor?.specialization || ''}</MedText>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_STYLES[appt.status] || ''}`}>
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
            {appt.reason && <MedText variant="metadata" className="mt-2 text-text-secondary">{appt.reason}</MedText>}
            {appt.status === 'pending' && (
              <div className="mt-3 pt-3 border-t border-border">
                <MedButton title="Cancel" onPress={() => dispatch(cancelAppointment(appt.id))} type="outline" />
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

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center p-4" onClick={() => setShowBookingModal(false)}>
          <div className="bg-surface rounded-t-[20px] sm:rounded-[20px] w-full max-w-lg p-6 animate-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <MedText variant="h2" as="h3">Book Appointment</MedText>
              <button onClick={() => setShowBookingModal(false)}><X size={20} /></button>
            </div>

            <MedText variant="body" className="text-text-secondary mb-4">With {bookingDoctorName}</MedText>

            <div className="mb-4">
              <MedText variant="metadata" className="mb-2">Date</MedText>
              <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
                className="w-full h-12 px-4 rounded-[12px] border border-border bg-surface text-text text-[16px] outline-none focus:border-border-focus" />
            </div>

            {availableSlots.length > 0 && (
              <div className="mb-4">
                <MedText variant="metadata" className="mb-2">Available Slots</MedText>
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((slot, i) => (
                    <button key={i} onClick={() => setBookingTime(slot.start?.slice(11, 16) || '')}
                      className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                        bookingTime === slot.start?.slice(11, 16) ? 'bg-primary text-white' : 'bg-foreground/5 text-text-secondary hover:bg-foreground/10'
                      }`}>
                      {slot.start?.slice(11, 16)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <MedText variant="metadata" className="mb-2">Reason (optional)</MedText>
              <textarea value={bookingReason} onChange={(e) => setBookingReason(e.target.value)} placeholder="Describe your symptoms..."
                className="w-full min-h-[80px] p-3 rounded-[12px] border border-border bg-surface text-text text-[14px] outline-none focus:border-border-focus resize-none placeholder:text-muted" />
            </div>

            <MedButton title="Book Now" onPress={handleBook} disabled={!bookingDate || !bookingTime} />
          </div>
        </div>
      )}
    </div>
  );
}
