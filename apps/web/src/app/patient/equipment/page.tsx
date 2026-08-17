'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { searchEquipment, fetchEquipmentCategories, fetchEquipmentAvailability, createEquipmentBooking } from '@/lib/store/slices/equipmentSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { Search, Cpu, Clock, MapPin, X, Calendar, CheckCircle } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  MRI: 'MRI',
  CT_SCAN: 'CT Scan',
  ULTRASOUND: 'Ultrasound',
  XRAY: 'X-Ray',
  LABORATORY: 'Laboratory',
};

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
  };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <MedText variant="h2" as="h2" className="text-[20px] mb-4">Medical Equipment</MedText>

      {/* Search */}
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

      {/* Categories */}
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

      {/* Results */}
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
              </div>
              <div className="flex-shrink-0">
                <MedButton
                  title="Book"
                  onPress={() => setBookingEq(eq)}
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

      {/* Booking Modal */}
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
                    <MedText variant="h2" as="h3">Book Equipment</MedText>
                    <MedText variant="metadata">{bookingEq.name}</MedText>
                  </div>
                  <button onClick={closeModal}><X size={20} /></button>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-3 rounded-[12px] bg-error-bg text-error text-[13px]">
                    {error}
                  </div>
                )}

                <div className="mb-4">
                  <MedText variant="metadata" className="mb-2">Date</MedText>
                  <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
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

                <MedButton title="Confirm Booking" onPress={handleBook} disabled={!bookingDate || !bookingTime} loading={submitting} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
