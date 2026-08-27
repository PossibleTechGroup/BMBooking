'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchMyAppointments, createAppointment, cancelAppointment, fetchDoctorScheduleSlots } from '@/lib/store/slices/appointmentSlice';
import { fetchDoctors } from '@/lib/store/slices/doctorSlice';
import { api, TELEBIRR_URL } from '@/lib/api/client';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { Calendar, Clock, X, CheckCircle, AlertCircle, Receipt, CreditCard, ExternalLink } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  accepted: 'bg-[#ECFDF3] text-[#027A48]',
  completed: 'bg-[#EFF6FF] text-[#2563EB]',
  declined: 'bg-[#FEF3F2] text-[#B42318]',
  cancelled: 'bg-[#F3F4F6] text-[#5A6B80]',
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { appointments, loading } = useAppSelector((s) => s.appointment);
  const { doctors } = useAppSelector((s) => s.doctors);
  const [filter, setFilter] = useState('all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDoctorId, setBookingDoctorId] = useState<number | null>(null);
  const [bookingDoctorName, setBookingDoctorName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingSlotId, setBookingSlotId] = useState<number | null>(null);
  const [bookingReason, setBookingReason] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [modalError, setModalError] = useState('');
  const [bookingStep, setBookingStep] = useState<'details' | 'payment'>('details');
  const [includeCardFee, setIncludeCardFee] = useState(false);
  const [paying, setPaying] = useState(false);

  const bookingDoctor = useMemo(
    () => doctors.find((d) => d.id === bookingDoctorId),
    [doctors, bookingDoctorId]
  );

  const serviceFeeAmount = useMemo(() => {
    const sf = bookingDoctor?.hospital?.serviceFee?.amount;
    return sf ? parseFloat(sf) : 50;
  }, [bookingDoctor]);

  const cardFeeAmount = useMemo(() => {
    const cp = bookingDoctor?.hospital?.cardPrice;
    return cp ? parseFloat(cp) : (Number(searchParams.get('fee')) || 100);
  }, [bookingDoctor, searchParams]);

  const doctorFee = useMemo(() => {
    const cp = bookingDoctor?.hospital?.cardPrice;
    return cp ? parseFloat(cp) : (Number(searchParams.get('fee')) || 0);
  }, [bookingDoctor, searchParams]);

  const totalPayable = serviceFeeAmount + (includeCardFee ? cardFeeAmount : 0);

  useEffect(() => {
    dispatch(fetchMyAppointments());
    if (doctors.length === 0) dispatch(fetchDoctors());
  }, [dispatch]);

  useEffect(() => {
    const bookDoctorId = searchParams.get('book');
    if (bookDoctorId) {
      setBookingDoctorId(Number(bookDoctorId));
      setBookingDoctorName(searchParams.get('name') || '');
      setModalError('');
      setBookingStep('details');
      setIncludeCardFee(false);
      setBookingSlotId(null);
      setShowBookingModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (bookingDoctorId && bookingDate) {
      dispatch(fetchDoctorScheduleSlots({ doctorId: bookingDoctorId, from: bookingDate, to: bookingDate }))
        .unwrap()
        .then((data) => {
          const slots = (data || [])
            .flatMap((s: any) => s.slots || [])
            .filter((sl: any) => !(sl._count?.bookings > 0));
          setAvailableSlots(slots);
        })
        .catch(() => setAvailableSlots([]));
    }
  }, [bookingDoctorId, bookingDate, dispatch]);

  const filtered = appointments.filter((a) => filter === 'all' || a.status === filter);

  const handlePayWithTelebirr = () => {
    if (totalPayable <= 0) {
      setModalError('Invalid payment amount.');
      return;
    }
    window.open(`${TELEBIRR_URL}/?amount=${encodeURIComponent(String(totalPayable))}`, '_blank');
  };

  const handleBook = async () => {
    if (!bookingDoctorId || !bookingDate || !bookingTime) return;
    setModalError('');
    setPaying(true);
    try {
      const verifyRes = await api.post('/payments/verify-telebirr', { amount: totalPayable });
      const paid = verifyRes.data?.status === 'success' && verifyRes.data?.data?.paid;
      if (!paid) {
        setModalError('Payment not completed. Please complete the Telebirr payment first.');
        return;
      }
      const dateTime = `${bookingDate}T${bookingTime}:00.000Z`;
      const result = await dispatch(createAppointment({
        doctorId: bookingDoctorId,
        dateTime,
        fee: doctorFee,
        reason: bookingReason,
        slotId: bookingSlotId ?? undefined,
        paymentMethod: includeCardFee ? 'card' : 'service_fee',
        paidCardFee: includeCardFee,
      }));
      if (createAppointment.fulfilled.match(result)) {
        setShowBookingModal(false);
        setBookingDoctorId(null);
        setBookingDate('');
        setBookingTime('');
        setBookingSlotId(null);
        setBookingReason('');
        setAvailableSlots([]);
        setBookingStep('details');
        setIncludeCardFee(false);
        router.push('/patient');
      } else {
        setModalError((result.payload as string) || 'Failed to book. Please try again.');
      }
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || 'Payment verification failed. Please try again.');
    } finally {
      setPaying(false);
    }
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
              <MedText variant="h2" as="h3">{bookingStep === 'payment' ? 'Payment' : 'Book Appointment'}</MedText>
              <button onClick={() => setShowBookingModal(false)}><X size={20} /></button>
            </div>

            <MedText variant="body" className="text-text-secondary mb-4">With {bookingDoctorName}</MedText>

            {bookingStep === 'details' && (
              <>
                <div className="mb-4">
                  <MedText variant="metadata" className="mb-2">Date</MedText>
                  <input type="date" value={bookingDate} onChange={(e) => { setBookingDate(e.target.value); setBookingTime(''); setBookingSlotId(null); }}
                    className="w-full h-12 px-4 rounded-[12px] border border-border bg-surface text-text text-[16px] outline-none focus:border-border-focus" />
                </div>

                {availableSlots.length > 0 && (
                  <div className="mb-4">
                    <MedText variant="metadata" className="mb-2">Available Slots</MedText>
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map((slot, i) => {
                        const maxPatients = slot.maxPatients;
                        const booked = slot._count?.bookings ?? 0;
                        const isFull = typeof maxPatients === 'number' && maxPatients > 0 && booked >= maxPatients;
                        const remaining = typeof maxPatients === 'number' && maxPatients > 0 ? Math.max(0, maxPatients - booked) : null;
                        const selected = bookingTime === slot.startTime?.slice(11, 16);
                        return (
                          <button
                            key={i}
                            disabled={isFull}
                            onClick={() => { setBookingTime(slot.startTime?.slice(11, 16) || ''); setBookingSlotId(slot.id ?? null); }}
                            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                              isFull
                                ? 'bg-foreground/5 text-muted line-through cursor-not-allowed'
                                : selected
                                ? 'bg-primary text-white'
                                : 'bg-foreground/5 text-text-secondary hover:bg-foreground/10'
                            }`}
                            title={isFull ? 'Slot is full' : remaining != null ? `${remaining} spot(s) remaining` : ''}
                          >
                            {slot.startTime?.slice(11, 16)}
                            {maxPatients != null && (
                              <span className={`ml-1.5 text-[11px] ${selected ? 'text-white/80' : isFull ? 'text-muted' : 'text-primary'}`}>
                                ({booked}/{maxPatients})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <MedText variant="metadata" className="mb-2">Reason (optional)</MedText>
                  <textarea value={bookingReason} onChange={(e) => setBookingReason(e.target.value)} placeholder="Describe your symptoms..."
                    className="w-full min-h-[80px] p-3 rounded-[12px] border border-border bg-surface text-text text-[14px] outline-none focus:border-border-focus resize-none placeholder:text-muted" />
                </div>

                {modalError && (
                  <div className="mb-4 px-4 py-3 rounded-[12px] bg-error/10 text-error text-[13px]">
                    {modalError}
                  </div>
                )}

                <MedButton title="Continue to Payment" onPress={() => { setModalError(''); setBookingStep('payment'); }} disabled={!bookingDate || !bookingTime} />
              </>
            )}

            {bookingStep === 'payment' && (
              <>
                <div className="rounded-[16px] border border-border overflow-hidden mb-4">
                  <div className="bg-primary/5 px-4 py-3 flex items-center gap-2">
                    <Receipt size={16} className="text-primary" />
                    <MedText variant="body" className="text-[13px] font-medium">Fee Breakdown</MedText>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <MedText variant="metadata" className="text-[13px]">App Fee</MedText>
                      <MedText variant="metadata" className="font-medium">{serviceFeeAmount.toFixed(2)} ETB</MedText>
                    </div>

                    <button onClick={() => setIncludeCardFee(!includeCardFee)}
                      className={`w-full flex items-center justify-between p-3 rounded-[12px] border transition-all ${
                        includeCardFee ? 'border-primary bg-primary/5' : 'border-border'
                      }`}>
                      <div className="flex items-center gap-2 flex-1 text-left">
                        <CreditCard size={15} className={includeCardFee ? 'text-primary' : 'text-muted'} />
                        <div>
                          <MedText variant="metadata" className="text-[13px] font-medium">Hospital Card</MedText>
                          <MedText variant="metadata" className="text-muted text-[11px]">New patient registration card</MedText>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MedText variant="metadata" className="font-medium">{cardFeeAmount.toFixed(2)} ETB</MedText>
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${includeCardFee ? 'border-primary bg-primary' : 'border-border'}`}>
                          {includeCardFee && <CheckCircle size={12} className="text-white" />}
                        </span>
                      </div>
                    </button>

                    <div className="h-px bg-border" />

                    <div className="flex justify-between items-center">
                      <MedText variant="body" className="text-[13px] font-medium">Total Amount</MedText>
                      <MedText variant="body" className="text-[14px] font-medium text-primary">{totalPayable.toFixed(2)} ETB</MedText>
                    </div>
                  </div>
                </div>

                <MedButton title={`Pay ${totalPayable.toFixed(2)} ETB with Telebirr`} onPress={handlePayWithTelebirr} icon={<ExternalLink size={16} />} className="mb-3" />
                <MedButton title={paying ? 'Verifying...' : 'Verify & Book Appointment'} onPress={handleBook} loading={paying} type="secondary" />

                {modalError && (
                  <div className="mt-4 px-4 py-3 rounded-[12px] bg-error/10 text-error text-[13px]">
                    {modalError}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
