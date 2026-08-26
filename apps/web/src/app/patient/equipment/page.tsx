'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { searchEquipment, fetchEquipmentCategories, fetchEquipmentAvailability, createEquipmentBooking } from '@/lib/store/slices/equipmentSlice';
import { api, TELEBIRR_URL } from '@/lib/api/client';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { Search, Cpu, Clock, MapPin, X, Calendar, CheckCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  MRI: 'MRI',
  CT_SCAN: 'CT Scan',
  ULTRASOUND: 'Ultrasound',
  XRAY: 'X-Ray',
  LABORATORY: 'Laboratory',
};

type Step = 'details' | 'payment' | 'confirm';

export default function EquipmentPage() {
  const dispatch = useAppDispatch();
  const { searchResults, categories, availability, loading, error } = useAppSelector((s) => s.equipment);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [bookingEq, setBookingEq] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState<any>(null);
  const [step, setStep] = useState<Step>('details');
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    dispatch(searchEquipment({}));
    dispatch(fetchEquipmentCategories());
  }, [dispatch]);

  useEffect(() => {
    if (bookingEq?.id && bookingDate) {
      setBookingTime('');
      dispatch(fetchEquipmentAvailability({ equipmentId: bookingEq.id, date: bookingDate }));
    }
  }, [bookingEq?.id, bookingDate, dispatch]);

  const filtered = searchResults.filter((eq) => {
    const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.hospitalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || eq.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const freeSlots = (availability?.slots || []).filter((s) => !s.booked);
  const price = bookingEq?.price || 0;

  const handleContinueToPayment = () => {
    if (price > 0) {
      setStep('payment');
    } else {
      setPaymentVerified(true);
      setStep('confirm');
    }
  };

  const handlePay = async () => {
    setPaying(true);
    const url = `${TELEBIRR_URL}/?amount=${encodeURIComponent(String(price))}`;
    window.open(url, '_blank');
    setTimeout(() => setPaying(false), 3000);
  };

  const handleVerifyPayment = async () => {
    setVerifying(true);
    try {
      const res = await api.post(`/payments/verify-telebirr`, { amount: price });
      if (res.data?.data?.paid) {
        setPaymentVerified(true);
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
    if (!bookingEq || !bookingDate || !bookingTime) return;
    setSubmitting(true);
    const [h, m] = bookingTime.split(':').map(Number);
    const [y, mo, d] = bookingDate.split('-').map(Number);
    const dateTime = new Date(Date.UTC(y, mo - 1, d, h - 3, m)).toISOString();
    const result = await dispatch(createEquipmentBooking({
      equipmentId: bookingEq.id,
      dateTime,
      notes: bookingNotes || undefined,
      fee: price || undefined,
    }));
    setSubmitting(false);
    if (createEquipmentBooking.fulfilled.match(result)) {
      setBooked(result.payload);
    }
  };

  const closeModal = () => {
    setBookingEq(null);
    setBookingDate('');
    setBookingTime('');
    setBookingNotes('');
    setBooked(null);
    setStep('details');
    setPaymentVerified(false);
    setVerifying(false);
    setPaying(false);
  };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <MedText variant="h2" as="h2" className="text-[20px] mb-4">Medical Equipment</MedText>

      <div className="flex items-center gap-2 bg-surface border border-border rounded-[12px] py-3 px-4 mb-4">
        <Search size={20} className="text-muted" />
        <input
          type="text"
          placeholder="Search equipment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {['All', ...categories.map((c) => c.category)].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 transition-all ${
              selectedCategory === cat ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'
            }`}
          >
            {cat === 'All' ? 'All' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      <div className="space-y-3 pb-24">
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        {filtered.map((eq) => (
          <MedCard key={eq.id}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-[12px] bg-foreground/5 flex items-center justify-center flex-shrink-0">
                <Cpu size={22} className="text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <MedText variant="body" className="text-[15px] font-medium text-text truncate">{eq.name}</MedText>
                <MedText variant="metadata">{CATEGORY_LABELS[eq.category] || eq.category}</MedText>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-muted" />
                    <MedText variant="metadata">{eq.hospitalName}</MedText>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-muted" />
                    <MedText variant="metadata">{eq.duration}min</MedText>
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`w-2 h-2 rounded-full ${eq.isOperational ? 'bg-success' : 'bg-error'}`} />
                  <MedText variant="metadata">{eq.isOperational ? 'Available' : 'Unavailable'}</MedText>
                </div>
                {eq.price != null && eq.price > 0 && (
                  <MedText variant="metadata" className="text-primary font-medium mt-1">{eq.price} ETB</MedText>
                )}
              </div>
              <div className="flex-shrink-0">
                <MedButton
                  title="Book"
                  onPress={() => { setBookingEq(eq); setStep('details'); setPaymentVerified(false); setBooked(null); }}
                  type="outline"
                  disabled={!eq.isOperational}
                />
              </div>
            </div>
          </MedCard>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <MedText variant="body" className="text-muted">No equipment found</MedText>
          </div>
        )}
      </div>

      {bookingEq && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-surface rounded-t-[20px] sm:rounded-[20px] w-full max-w-lg p-6 animate-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {booked ? (
              <div className="text-center py-6">
                <CheckCircle size={48} className="text-success mx-auto mb-4" />
                <MedText variant="h2" as="h3" className="mb-2">Booking Confirmed</MedText>
                <MedText variant="body" className="text-text-secondary mb-1">{bookingEq.name}</MedText>
                <MedText variant="metadata" className="mb-1">
                  {new Date(booked.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </MedText>
                {booked.confirmationCode && (
                  <MedText variant="metadata">Code: {booked.confirmationCode}</MedText>
                )}
                <div className="mt-6">
                  <MedButton title="Done" onPress={closeModal} />
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <MedText variant="h2" as="h3">
                      {step === 'details' ? 'Book Equipment' : step === 'payment' ? 'Payment' : 'Confirm Booking'}
                    </MedText>
                    <MedText variant="metadata">{bookingEq.name}</MedText>
                  </div>
                  <button onClick={closeModal}><X size={20} /></button>
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
                      <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
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

                    {price > 0 && (
                      <MedCard className="mb-4">
                        <div className="flex justify-between items-center">
                          <MedText variant="body" className="text-[14px] font-medium">Total</MedText>
                          <MedText variant="body" className="text-[16px] font-bold text-primary">{price} ETB</MedText>
                        </div>
                      </MedCard>
                    )}

                    <MedButton
                      title={price > 0 ? 'Continue to Payment' : 'Confirm Booking'}
                      onPress={price > 0 ? handleContinueToPayment : handleBook}
                      disabled={!bookingDate || !bookingTime}
                      loading={submitting}
                    />
                  </>
                )}

                {step === 'payment' && (
                  <>
                    <MedCard className="mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <MedText variant="body" className="text-[14px]">Equipment Rental</MedText>
                        <MedText variant="body" className="text-[14px] font-medium">{bookingEq.name}</MedText>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <MedText variant="body" className="text-[14px]">Date</MedText>
                        <MedText variant="body" className="text-[14px]">{bookingDate}</MedText>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-border">
                        <MedText variant="body" className="text-[14px] font-bold">Total</MedText>
                        <MedText variant="body" className="text-[16px] font-bold text-primary">{price} ETB</MedText>
                      </div>
                    </MedCard>

                    <MedText variant="metadata" className="text-center mb-4 block">
                      You will be redirected to Telebirr to complete payment
                    </MedText>

                    <MedButton
                      title={paying ? 'Opening Telebirr...' : `Pay ${price} ETB via Telebirr`}
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
                        <MedText variant="body" className="text-[14px]">Equipment</MedText>
                        <MedText variant="body" className="text-[14px] font-medium">{bookingEq.name}</MedText>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <MedText variant="body" className="text-[14px]">Hospital</MedText>
                        <MedText variant="body" className="text-[14px]">{bookingEq.hospitalName}</MedText>
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
                          Paid ({price} ETB)
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
      )}
    </div>
  );
}
