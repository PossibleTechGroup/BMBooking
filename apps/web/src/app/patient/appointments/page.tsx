'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchMyAppointments, createAppointment, cancelAppointment, fetchDoctorScheduleSlots } from '@/lib/store/slices/appointmentSlice';
import { fetchDoctors } from '@/lib/store/slices/doctorSlice';
import { api, TELEBIRR_URL } from '@/lib/api/client';
import { useI18n } from '@/lib/i18n/LanguageProvider';
import LangSwitcher from '@/components/ui/lang-switcher';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { Calendar, Clock, X, CheckCircle, AlertCircle, Receipt, CreditCard, ExternalLink, Upload, Phone } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  accepted: 'bg-[#ECFDF3] text-[#027A48]',
  completed: 'bg-[#EFF6FF] text-[#2563EB]',
  declined: 'bg-[#FEF3F2] text-[#B42318]',
  cancelled: 'bg-[#F3F4F6] text-[#5A6B80]',
};

const PENDING_BOOKING_KEY = 'bm_pending_booking';

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
  const { t } = useI18n();
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
  const [confirmMsg, setConfirmMsg] = useState('');
  const [bookingFor, setBookingFor] = useState<'myself' | 'someone_else'>('myself');
  const [otherName, setOtherName] = useState('');
  const [otherPhone, setOtherPhone] = useState('');
  const [otherGender, setOtherGender] = useState('');
  const [otherDob, setOtherDob] = useState('');
  const [otherBloodType, setOtherBloodType] = useState('');
  const [referralUrl, setReferralUrl] = useState('');
  const [uploading, setUploading] = useState(false);

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

  const otherDetailsValid = () => {
    if (bookingFor !== 'someone_else') return true;
    if (!otherName.trim()) {
      setModalError(t('bookForRequired'));
      return false;
    }
    if (!/^\+251[79]\d{8}$/.test(otherPhone.trim())) {
      setModalError(t('phoneRequired'));
      return false;
    }
    return true;
  };

  const otherPatientDetails = () =>
    bookingFor === 'someone_else'
      ? {
          fullName: otherName.trim(),
          phone: otherPhone.trim(),
          gender: otherGender || undefined,
          dateOfBirth: otherDob || undefined,
          bloodType: otherBloodType || undefined,
        }
      : undefined;

  const handleReferralUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setModalError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/appointments/upload', fd);
      const url = res.data?.data?.url;
      if (url) setReferralUrl(url);
      else setModalError('Upload failed. Please try again.');
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchMyAppointments());
    if (doctors.length === 0) dispatch(fetchDoctors());
  }, [dispatch]);

  // Restore a pending booking after returning from the Telebirr payment flow,
  // verify the payment, and auto-create the appointment. The pending booking is
  // kept in localStorage (survives tab switches and logins) and the completion
  // is re-checked when the app tab regains focus/visibility.
  const pendingFinishRef = useRef(false);

  const completePendingBooking = async () => {
    if (pendingFinishRef.current) return;
    if (doctors.length === 0) return;
    let pending: any = null;
    try {
      pending = JSON.parse(localStorage.getItem(PENDING_BOOKING_KEY) || 'null');
    } catch (e) { /* ignore */ }
    if (!pending?.doctorId) return;
    const doctor = doctors.find((d) => d.id === Number(pending.doctorId));
    if (!doctor) return;

    pendingFinishRef.current = true;
    setBookingDoctorId(Number(pending.doctorId));
    setBookingDoctorName(pending.name || doctor.fullName || '');
    setBookingDate(pending.date || '');
    setBookingTime(pending.time || '');
    setBookingSlotId(pending.slotId ?? null);
    setBookingReason(pending.reason || '');
    setIncludeCardFee(!!pending.includeCardFee);
    setBookingFor(pending.bookingFor === 'someone_else' ? 'someone_else' : 'myself');
    setOtherName(pending.otherName || '');
    setOtherPhone(pending.otherPhone || '');
    setOtherGender(pending.otherGender || '');
    setOtherDob(pending.otherDob || '');
    setOtherBloodType(pending.otherBloodType || '');
    setReferralUrl(pending.referralUrl || '');
    setShowBookingModal(true);
    setBookingStep('payment');
    setModalError('');

    try {
      setPaying(true);
      let paid = false;
      const MAX_TRIES = 18;
      for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
        try {
          const verifyRes = await api.post('/payments/verify-telebirr', { amount: pending.totalPayable });
          paid = verifyRes.data?.status === 'success' && verifyRes.data?.data?.paid;
          if (paid) break;
        } catch (err) { /* retry below */ }
        setPaying(false);
        setConfirmMsg('Waiting for Telebirr to confirm your payment... (this can take a few seconds)');
        await new Promise((r) => setTimeout(r, 5000));
        setPaying(true);
        setConfirmMsg('');
      }
      if (!paid) {
        setModalError('Payment not confirmed yet. If you already paid, tap "Verify & Book" to confirm.');
        return;
      }
      if (!pending.date || !pending.time) {
        setModalError('Please pick a date and time to finish booking.');
        return;
      }
      const dateTime = `${pending.date}T${pending.time}:00.000Z`;
      const result = await dispatch(createAppointment({
        doctorId: Number(pending.doctorId),
        dateTime,
        fee: pending.totalPayable ?? pending.fee ?? 0,
        reason: pending.reason || '',
        slotId: pending.slotId ?? undefined,
        paymentMethod: pending.includeCardFee ? 'card' : 'service_fee',
        paidCardFee: !!pending.includeCardFee,
        isPaid: true,
        bookingFor: pending.bookingFor === 'someone_else' ? 'someone_else' : 'myself',
        otherPatientName: pending.otherName || undefined,
        otherPatientPhone: pending.otherPhone || undefined,
        otherPatientDetails: pending.otherName ? {
          fullName: pending.otherName,
          phone: pending.otherPhone,
          gender: pending.otherGender || undefined,
          dateOfBirth: pending.otherDob || undefined,
          bloodType: pending.otherBloodType || undefined,
        } : undefined,
        attachments: pending.referralUrl ? [pending.referralUrl] : undefined,
      }));
      if (createAppointment.fulfilled.match(result)) {
        try { localStorage.removeItem(PENDING_BOOKING_KEY); } catch (e) { /* ignore */ }
        setShowBookingModal(false);
        setBookingDoctorId(null);
        setBookingDate('');
        setBookingTime('');
        setBookingSlotId(null);
        setBookingReason('');
        setAvailableSlots([]);
        setBookingStep('details');
        setIncludeCardFee(false);
        setBookingFor('myself');
        setOtherName('');
        setOtherPhone('');
        setOtherGender('');
        setOtherDob('');
        setOtherBloodType('');
        setReferralUrl('');
        dispatch(fetchMyAppointments());
        router.push('/patient');
      } else {
        setModalError((result.payload as string) || 'Failed to book. Please try again.');
      }
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || 'Payment verification failed. Please try again.');
    } finally {
      setPaying(false);
      setConfirmMsg('');
      pendingFinishRef.current = false;
    }
  };

  useEffect(() => {
    completePendingBooking();
    const onVisible = () => {
      if (document.visibilityState === 'visible') completePendingBooking();
    };
    const onActivate = () => completePendingBooking();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onActivate);
    window.addEventListener('pageshow', onActivate);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onActivate);
      window.removeEventListener('pageshow', onActivate);
    };
  }, [doctors, dispatch]);

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
    if (bookingFor === 'someone_else' && !otherDetailsValid()) {
      setBookingStep('details');
      return;
    }
    try {
      localStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify({
        doctorId: bookingDoctorId,
        name: bookingDoctorName,
        date: bookingDate,
        time: bookingTime,
        slotId: bookingSlotId,
        reason: bookingReason,
        includeCardFee,
        totalPayable,
        fee: doctorFee,
        bookingFor,
        otherName: bookingFor === 'someone_else' ? otherName.trim() : '',
        otherPhone: bookingFor === 'someone_else' ? otherPhone.trim() : '',
        otherGender: bookingFor === 'someone_else' ? otherGender : '',
        otherDob: bookingFor === 'someone_else' ? otherDob : '',
        otherBloodType: bookingFor === 'someone_else' ? otherBloodType : '',
        referralUrl,
      }));
    } catch (e) { /* ignore */ }
    window.open(`${TELEBIRR_URL}/?amount=${encodeURIComponent(String(totalPayable))}`, '_blank');
  };

  const handleBook = async () => {
    if (!bookingDoctorId || !bookingDate || !bookingTime) return;
    if (bookingFor === 'someone_else' && !otherDetailsValid()) {
      setBookingStep('details');
      return;
    }
    setModalError('');
    setPaying(true);
    try { localStorage.removeItem(PENDING_BOOKING_KEY); } catch (e) { /* ignore */ }
    try {
      const verifyRes = await api.post('/payments/verify-telebirr', { amount: totalPayable });
      const paid = verifyRes.data?.status === 'success' && verifyRes.data?.data?.paid;
      if (!paid) {
        setModalError(t('paymentNotConfirmed'));
        return;
      }
      const dateTime = `${bookingDate}T${bookingTime}:00.000Z`;
      const result = await dispatch(createAppointment({
        doctorId: bookingDoctorId,
        dateTime,
        fee: totalPayable,
        reason: bookingReason,
        slotId: bookingSlotId ?? undefined,
        paymentMethod: includeCardFee ? 'card' : 'service_fee',
        paidCardFee: includeCardFee,
        isPaid: true,
        bookingFor,
        otherPatientName: otherName.trim() || undefined,
        otherPatientPhone: otherPhone.trim() || undefined,
        otherPatientDetails: otherPatientDetails(),
        attachments: referralUrl ? [referralUrl] : undefined,
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
        setBookingFor('myself');
        setOtherName('');
        setOtherPhone('');
        setOtherGender('');
        setOtherDob('');
        setOtherBloodType('');
        setReferralUrl('');
        router.push('/patient');
      } else {
        setModalError((result.payload as string) || t('failedToBook'));
      }
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || t('paymentVerificationFailed'));
    } finally {
      setPaying(false);
    }
  };

  const cancelBooking = () => {
    try { localStorage.removeItem(PENDING_BOOKING_KEY); } catch (e) { /* ignore */ }
    setShowBookingModal(false);
    setBookingFor('myself');
    setOtherName('');
    setOtherPhone('');
    setOtherGender('');
    setOtherDob('');
    setOtherBloodType('');
    setReferralUrl('');
  };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <MedText variant="h2" as="h2" className="text-[20px]">{t('appointments')}</MedText>
        <LangSwitcher />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {['all', 'pending', 'accepted', 'completed', 'declined', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 transition-all ${
              filter === f ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'
            }`}
          >
            {t(f)}
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
                {t(appt.status)}
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
            {appt.doctor?.hospital && (
              <div className="mt-3 pt-3 border-t border-border">
                <MedText variant="metadata" className="font-medium text-text">{appt.doctor.hospital.name}</MedText>
                {(appt.doctor.hospital.phone || appt.doctor.hospital.receptionistPhone) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {appt.doctor.hospital.phone && (
                      <a href={`tel:${appt.doctor.hospital.phone}`} className="flex items-center gap-1.5 text-text-secondary no-underline">
                        <Phone size={13} className="text-primary" />
                        <MedText variant="metadata">{t('registrationPhone')}: {appt.doctor.hospital.phone}</MedText>
                      </a>
                    )}
                    {appt.doctor.hospital.receptionistPhone && (
                      <a href={`tel:${appt.doctor.hospital.receptionistPhone}`} className="flex items-center gap-1.5 text-text-secondary no-underline">
                        <Phone size={13} className="text-primary" />
                        <MedText variant="metadata">{t('receptionPhone')}: {appt.doctor.hospital.receptionistPhone}</MedText>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
            {appt.status === 'pending' && (
              <div className="mt-3 pt-3 border-t border-border">
                <MedButton title="Cancel" onPress={() => dispatch(cancelAppointment(appt.id))} type="outline" />
              </div>
            )}
          </MedCard>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <MedText variant="body" className="text-muted">{t('noAppointments')}</MedText>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center p-4" onClick={cancelBooking}>
          <div className="bg-surface rounded-t-[20px] sm:rounded-[20px] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <MedText variant="h2" as="h3">{bookingStep === 'payment' ? t('payment') : t('bookAppointment')}</MedText>
              <button onClick={cancelBooking}><X size={20} /></button>
            </div>

            <MedText variant="body" className="text-text-secondary mb-4">{t('bookWith', { name: bookingDoctorName })}</MedText>

            {bookingStep === 'details' && (
              <>
                <div className="mb-4">
                  <MedText variant="metadata" className="mb-2">{t('whoIsThisFor')}</MedText>
                  <div className="flex gap-2">
                    {(['myself', 'someone_else'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setBookingFor(opt); setModalError(''); }}
                        className={`flex-1 px-4 py-3 rounded-[12px] border text-[14px] font-medium transition-all cursor-pointer ${
                          bookingFor === opt ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary'
                        }`}
                      >
                        {t(opt)}
                      </button>
                    ))}
                  </div>
                </div>

                {bookingFor === 'someone_else' && (
                  <div className="mb-4 space-y-3 rounded-[12px] border border-border p-4">
                    <div>
                      <MedText variant="metadata" className="mb-2">{t('fullName')} *</MedText>
                      <input type="text" value={otherName} onChange={(e) => setOtherName(e.target.value)}
                        placeholder={t('otherPatientNamePlaceholder')}
                        className="w-full h-12 px-4 rounded-[12px] border border-border bg-surface text-text text-[16px] outline-none focus:border-border-focus" />
                    </div>
                    <div>
                      <MedText variant="metadata" className="mb-2">{t('phone')} *</MedText>
                      <input type="tel" value={otherPhone} onChange={(e) => setOtherPhone(e.target.value)}
                        placeholder={t('otherPatientPhonePlaceholder')}
                        className="w-full h-12 px-4 rounded-[12px] border border-border bg-surface text-text text-[16px] outline-none focus:border-border-focus" />
                    </div>
                    <div>
                      <MedText variant="metadata" className="mb-2">{t('gender')}</MedText>
                      <select value={otherGender} onChange={(e) => setOtherGender(e.target.value)}
                        className="w-full h-12 px-4 rounded-[12px] border border-border bg-surface text-text text-[16px] outline-none focus:border-border-focus">
                        <option value="">—</option>
                        <option value="male">{t('male')}</option>
                        <option value="female">{t('female')}</option>
                      </select>
                    </div>
                    <div>
                      <MedText variant="metadata" className="mb-2">{t('dateOfBirth')}</MedText>
                      <input type="date" value={otherDob} onChange={(e) => setOtherDob(e.target.value)}
                        className="w-full h-12 px-4 rounded-[12px] border border-border bg-surface text-text text-[16px] outline-none focus:border-border-focus" />
                    </div>
                    <div>
                      <MedText variant="metadata" className="mb-2">{t('bloodType')}</MedText>
                      <select value={otherBloodType} onChange={(e) => setOtherBloodType(e.target.value)}
                        className="w-full h-12 px-4 rounded-[12px] border border-border bg-surface text-text text-[16px] outline-none focus:border-border-focus">
                        <option value="">—</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Referral paper (optional) */}
                <div className="mb-4">
                  <MedText variant="metadata" className="mb-2">{t('referralPaper')}</MedText>
                  {referralUrl ? (
                    <div className="flex items-center gap-3 rounded-[12px] border border-border p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={referralUrl} alt="referral" className="w-16 h-16 rounded-[10px] object-cover" />
                      <button onClick={() => setReferralUrl('')} className="text-[13px] text-error">
                        {t('removePhoto')}
                      </button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center gap-1.5 border border-dashed border-border rounded-[12px] py-6 cursor-pointer hover:bg-foreground/5 transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                      <Upload size={20} className="text-muted" />
                      <MedText variant="metadata" className="text-text-secondary text-[13px]">
                        {uploading ? t('uploading') : t('uploadReferral')}
                      </MedText>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => handleReferralUpload(e.target.files?.[0] || null)} />
                    </label>
                  )}
                </div>

                <div className="mb-4">
                  <MedText variant="metadata" className="mb-2">{t('date')}</MedText>
                  <input type="date" value={bookingDate} onChange={(e) => { setBookingDate(e.target.value); setBookingTime(''); setBookingSlotId(null); }}
                    className="w-full h-12 px-4 rounded-[12px] border border-border bg-surface text-text text-[16px] outline-none focus:border-border-focus" />
                </div>

                {availableSlots.length > 0 && (
                  <div className="mb-4">
                    <MedText variant="metadata" className="mb-2">{t('availableSlots')}</MedText>
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
                            title={isFull ? t('slotIsFull') : remaining != null ? t('spotsRemaining') : ''}
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
                  <MedText variant="metadata" className="mb-2">{t('reasonOptional')}</MedText>
                  <textarea value={bookingReason} onChange={(e) => setBookingReason(e.target.value)} placeholder={t('describeSymptoms')}
                    className="w-full min-h-[80px] p-3 rounded-[12px] border border-border bg-surface text-text text-[14px] outline-none focus:border-border-focus resize-none placeholder:text-muted" />
                </div>

                {modalError && (
                  <div className="mb-4 px-4 py-3 rounded-[12px] bg-error/10 text-error text-[13px]">
                    {modalError}
                  </div>
                )}

                <MedButton title={t('continueToPayment')} onPress={() => {
                  setModalError('');
                  if (bookingFor === 'someone_else' && !otherDetailsValid()) return;
                  setBookingStep('payment');
                }} disabled={!bookingDate || !bookingTime} />
              </>
            )}

            {bookingStep === 'payment' && (
              <>
                <div className="rounded-[16px] border border-border overflow-hidden mb-4">
                  <div className="bg-primary/5 px-4 py-3 flex items-center gap-2">
                    <Receipt size={16} className="text-primary" />
                    <MedText variant="body" className="text-[13px] font-medium">{t('feeBreakdown')}</MedText>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <MedText variant="metadata" className="text-[13px]">{t('appFee')}</MedText>
                      <MedText variant="metadata" className="font-medium">{serviceFeeAmount.toFixed(2)} ETB</MedText>
                    </div>

                    <button onClick={() => setIncludeCardFee(!includeCardFee)}
                      className={`w-full flex items-center justify-between p-3 rounded-[12px] border transition-all ${
                        includeCardFee ? 'border-primary bg-primary/5' : 'border-border'
                      }`}>
                      <div className="flex items-center gap-2 flex-1 text-left">
                        <CreditCard size={15} className={includeCardFee ? 'text-primary' : 'text-muted'} />
                        <div>
                          <MedText variant="metadata" className="text-[13px] font-medium">{t('hospitalCard')}</MedText>
                          <MedText variant="metadata" className="text-muted text-[11px]">{t('newPatientCard')}</MedText>
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
                      <MedText variant="body" className="text-[13px] font-medium">{t('totalAmount')}</MedText>
                      <MedText variant="body" className="text-[14px] font-medium text-primary">{totalPayable.toFixed(2)} ETB</MedText>
                    </div>
                  </div>
                </div>

                <MedButton title={t('paidWithTelebirr', { amount: totalPayable.toFixed(2) })} onPress={handlePayWithTelebirr} icon={<ExternalLink size={16} />} className="mb-3" />
                <MedButton title={paying ? t('verifying') : t('verifyAndBook')} onPress={handleBook} loading={paying} type="secondary" />

                {confirmMsg && (
                  <div className="mt-4 px-4 py-3 rounded-[12px] bg-primary/10 text-primary text-[13px]">
                    {confirmMsg}
                  </div>
                )}

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
