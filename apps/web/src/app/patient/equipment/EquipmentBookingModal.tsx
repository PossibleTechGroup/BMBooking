'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchEquipmentAvailability, createEquipmentBooking, MedicalEquipment } from '@/lib/store/slices/equipmentSlice';
import { api, TELEBIRR_URL } from '@/lib/api/client';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { X, CheckCircle } from 'lucide-react';

type Step = 'details' | 'payment' | 'confirm';

export default function EquipmentBookingModal({
  item,
  onClose,
}: {
  item: MedicalEquipment;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const { availability, error } = useAppSelector((s) => s.equipment);

  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState<{ id?: number; dateTime?: string; confirmationCode?: string } | null>(null);
  const [step, setStep] = useState<Step>('details');
  const [verifying, setVerifying] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (item?.id && bookingDate) {
      dispatch(fetchEquipmentAvailability({ equipmentId: item.id, date: bookingDate }));
    }
  }, [item?.id, bookingDate, dispatch]);

  const freeSlots = (availability?.slots || []).filter((s) => !s.booked);
  const price = item?.price || 0;
  const hospitalFee = item?.serviceFee ? Number(item.serviceFee) : 50;
  const totalPay = Math.round((price + hospitalFee) * 100) / 100;

  const close = () => {
    setBooked(null);
    onClose();
  };

  const handleContinueToPayment = () => {
    if (totalPay > 0) {
      setStep('payment');
    } else {
      setStep('confirm');
    }
  };

  const handlePay = async () => {
    setPaying(true);
    const url = `${TELEBIRR_URL}/?amount=${encodeURIComponent(String(totalPay))}`;
    window.open(url, '_blank');
    setTimeout(() => setPaying(false), 3000);
  };

  const handleVerifyPayment = async () => {
    setVerifying(true);
    try {
      const res = await api.post(`/payments/verify-telebirr`, { amount: totalPay });
      if (res.data?.data?.paid) {
        setStep('confirm');
      } else {
        alert('Payment not detected yet. Please complete the payment and try again.');
      }
    } catch {
      alert('Could not verify payment. Please try again.');
    }
    setVerifying(false);
  };

  const handleBook = async () => {
    if (!item || !bookingDate || !bookingTime) return;
    setSubmitting(true);
    const [h, m] = bookingTime.split(':').map(Number);
    const [y, mo, d] = bookingDate.split('-').map(Number);
    const dateTime = new Date(Date.UTC(y, mo - 1, d, h - 3, m)).toISOString();
    const result = await dispatch(createEquipmentBooking({
      equipmentId: item.id,
      dateTime,
      notes: bookingNotes || undefined,
      fee: totalPay || undefined,
    }));
    setSubmitting(false);
    if (createEquipmentBooking.fulfilled.match(result)) {
      setBooked(result.payload);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center p-4" onClick={close}>
      <div className="bg-surface rounded-t-[20px] sm:rounded-[20px] w-full max-w-lg p-6 animate-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {booked ? (
          <div className="text-center py-6">
            <CheckCircle size={48} className="text-success mx-auto mb-4" />
            <MedText variant="h2" as="h3" className="mb-2">Booking Requested</MedText>
            <MedText variant="body" className="text-text-secondary mb-1">{item.name}</MedText>
            <MedText variant="metadata" className="mb-1">
              {booked.dateTime ? new Date(booked.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
            </MedText>
            {booked.confirmationCode && (
              <MedText variant="metadata">Code: {booked.confirmationCode}</MedText>
            )}
            <div className="mt-6">
              <MedButton title="Done" onPress={close} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-5">
              <div>
                <MedText variant="h2" as="h3">
                  {step === 'details' ? 'Book Service' : step === 'payment' ? 'Payment' : 'Confirm Booking'}
                </MedText>
                <MedText variant="metadata">{item.name}</MedText>
              </div>
              <button onClick={close}><X size={20} /></button>
            </div>

            {step === 'details' && (
              <>
                {error && (
                  <div className="mb-4 px-4 py-3 rounded-[12px] bg-error-bg text-error text-[13px]">
                    {error}
                  </div>
                )}

                <div className="mb-4">
                  <MedText variant="metadata" className="mb-2">Date</MedText>
                  <input type="date" value={bookingDate} onChange={(e) => { setBookingDate(e.target.value); setBookingTime(''); }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-12 px-4 rounded-[12px] border border-border bg-surface text-text text-[16px] outline-none focus:border-border-focus" />
                </div>

                {bookingDate && (
                  <div className="mb-4">
                    <MedText variant="metadata" className="mb-2">Available Slots</MedText>
                    {freeSlots.length > 0 ? (
                      <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                        {freeSlots.map((slot, i) => (
                          <button key={i} onClick={() => setBookingTime(slot.start)}
                            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                              bookingTime === slot.start ? 'bg-primary text-white' : 'bg-foreground/5 text-text-secondary hover:bg-foreground/10'
                            }`}>
                            {slot.start}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <MedText variant="metadata" className="text-muted">No available slots on this date</MedText>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <MedText variant="metadata" className="mb-2">Notes (optional)</MedText>
                  <textarea value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Add notes..."
                    className="w-full min-h-[80px] p-3 rounded-[12px] border border-border bg-surface text-text text-[14px] outline-none focus:border-border-focus resize-none placeholder:text-muted" />
                </div>

                {totalPay > 0 && (
                  <MedCard className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <MedText variant="body" className="text-[14px]">Service Fee</MedText>
                      <MedText variant="body" className="text-[14px]">{price} ETB</MedText>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <MedText variant="body" className="text-[14px]">Hospital service fee</MedText>
                      <MedText variant="body" className="text-[14px]">{hospitalFee} ETB</MedText>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <MedText variant="body" className="text-[14px] font-medium">Total</MedText>
                      <MedText variant="body" className="text-[16px] font-bold text-primary">{totalPay} ETB</MedText>
                    </div>
                  </MedCard>
                )}

                <MedButton
                  title={totalPay > 0 ? 'Continue to Payment' : 'Confirm Booking'}
                  onPress={totalPay > 0 ? handleContinueToPayment : handleBook}
                  disabled={!bookingDate || !bookingTime}
                  loading={submitting}
                />
              </>
            )}

            {step === 'payment' && (
              <>
                <MedCard className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <MedText variant="body" className="text-[14px]">Service Fee</MedText>
                    <MedText variant="body" className="text-[14px]">{price} ETB</MedText>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <MedText variant="body" className="text-[14px]">Hospital service fee</MedText>
                    <MedText variant="body" className="text-[14px]">{hospitalFee} ETB</MedText>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <MedText variant="body" className="text-[14px]">Date</MedText>
                    <MedText variant="body" className="text-[14px]">{bookingDate}</MedText>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <MedText variant="body" className="text-[14px] font-bold">Total</MedText>
                    <MedText variant="body" className="text-[16px] font-bold text-primary">{totalPay} ETB</MedText>
                  </div>
                </MedCard>

                <MedText variant="metadata" className="text-center mb-4 block">
                  You will be redirected to Telebirr to complete payment
                </MedText>

                <MedButton
                  title={paying ? 'Opening Telebirr...' : `Pay ${totalPay} ETB via Telebirr`}
                  onPress={handlePay}
                  disabled={paying}
                />

                <div className="mt-4">
                  <MedButton
                    title={verifying ? 'Verifying...' : 'I Completed Payment - Verify'}
                    onPress={handleVerifyPayment}
                    disabled={verifying}
                    type="outline"
                  />
                </div>
              </>
            )}

            {step === 'confirm' && (
              <>
                <MedCard className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <MedText variant="body" className="text-[14px]">Service</MedText>
                    <MedText variant="body" className="text-[14px] font-medium">{item.name}</MedText>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <MedText variant="body" className="text-[14px]">Hospital</MedText>
                    <MedText variant="body" className="text-[14px]">{item.hospitalName}</MedText>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <MedText variant="body" className="text-[14px]">Date</MedText>
                    <MedText variant="body" className="text-[14px]">{bookingDate}</MedText>
                  </div>
                  {bookingTime && (
                    <div className="flex justify-between items-center mb-3">
                      <MedText variant="body" className="text-[14px]">Time</MedText>
                      <MedText variant="body" className="text-[14px]">{bookingTime}</MedText>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-3">
                    <MedText variant="body" className="text-[14px]">Payment</MedText>
                    <MedText variant="body" className="text-[14px] text-success font-medium">
                      <CheckCircle size={14} className="inline mr-1" />
                      Paid ({totalPay} ETB)
                    </MedText>
                  </div>
                  {bookingNotes && (
                    <div className="flex justify-between items-center">
                      <MedText variant="body" className="text-[14px]">Notes</MedText>
                      <MedText variant="body" className="text-[14px]">{bookingNotes}</MedText>
                    </div>
                  )}
                </MedCard>

                <MedButton
                  title={submitting ? 'Booking...' : 'Confirm Booking'}
                  onPress={handleBook}
                  disabled={submitting}
                  loading={submitting}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}