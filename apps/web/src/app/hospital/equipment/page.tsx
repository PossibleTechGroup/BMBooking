'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  fetchHospitalEquipment,
  addHospitalEquipment,
  deleteHospitalEquipment,
  toggleHospitalEquipmentStatus,
  updateHospitalEquipment,
  fetchEquipmentBookings,
  confirmEquipmentBooking,
  declineEquipmentBooking,
  completeEquipmentBooking,
  cancelEquipmentBooking,
} from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { Scissors, Plus, Pencil, Trash2, X, Loader2, CalendarDays, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface EqForm {
  id: number | null;
  name: string;
  category: string;
  price: string;
  duration: string;
  description: string;
}

const emptyForm: EqForm = { id: null, name: '', category: '', price: '', duration: '60', description: '' };

function todayStr() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

export default function HospitalEquipmentPage() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { equipment, equipmentBookings, loading, error } = useAppSelector((s) => s.hospital);

  const [tab, setTab] = useState<'equipment' | 'bookings'>('equipment');
  const [bookingDate, setBookingDate] = useState(todayStr());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<EqForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    if (token) {
      dispatch(fetchHospitalEquipment());
      dispatch(fetchEquipmentBookings({ date: bookingDate }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, token]);

  const reloadBookings = () => dispatch(fetchEquipmentBookings({ date: bookingDate }));

  const openCreate = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (e: any) => {
    setForm({
      id: e.id,
      name: e.name,
      category: e.category || '',
      price: e.price != null ? String(e.price) : '',
      duration: e.duration != null ? String(e.duration) : '60',
      description: e.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (form.id) {
      await dispatch(updateHospitalEquipment({
        id: form.id,
        name: form.name.trim(),
        category: form.category.trim() || null,
        price: form.price ? Number(form.price) : null,
        duration: form.duration ? Number(form.duration) : null,
        description: form.description.trim() || null,
      }));
    } else {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('category', form.category.trim());
      if (form.price) fd.append('price', String(Number(form.price)));
      if (form.duration) fd.append('duration', String(Number(form.duration)));
      if (form.description) fd.append('description', form.description.trim());
      await dispatch(addHospitalEquipment(fd));
      dispatch(fetchHospitalEquipment());
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this equipment item?')) {
      await dispatch(deleteHospitalEquipment(id));
    }
  };

  const bookingAction = (id: number, action: 'confirm' | 'complete' | 'cancel') => {
    if (action === 'confirm') dispatch(confirmEquipmentBooking(id)).then(reloadBookings);
    if (action === 'complete') dispatch(completeEquipmentBooking(id)).then(reloadBookings);
    if (action === 'cancel') {
      if (window.confirm('Cancel this equipment booking?')) dispatch(cancelEquipmentBooking(id)).then(reloadBookings);
    }
  };

  const submitDecline = async () => {
    if (declineId == null) return;
    if (!declineReason.trim()) return;
    await dispatch(declineEquipmentBooking({ id: declineId, reason: declineReason.trim() }));
    setDeclineId(null);
    setDeclineReason('');
    reloadBookings();
  };

  return (
    <div className="p-5 lg:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-border flex items-center justify-center">
            <Scissors size={20} className="text-primary" />
          </div>
          <div>
            <MedText variant="h2" as="h2" className="text-[20px]">Medical Equipment</MedText>
            <MedText variant="metadata">Manage equipment inventory and bookings</MedText>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} /> Add Equipment
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error/5 border border-error/20 text-error text-[13px]">{error}</div>
      )}

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('equipment')}
          className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${tab === 'equipment' ? 'bg-primary text-white' : 'bg-surface text-text-secondary border border-border'}`}
        >
          Equipment ({equipment.length})
        </button>
        <button
          onClick={() => setTab('bookings')}
          className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${tab === 'bookings' ? 'bg-primary text-white' : 'bg-surface text-text-secondary border border-border'}`}
        >
          Bookings ({equipmentBookings.length})
        </button>
      </div>

      {tab === 'equipment' ? (
        loading && equipment.length === 0 ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : equipment.length === 0 ? (
          <MedCard className="p-10 text-center text-text-secondary">No equipment yet. Add your first piece of equipment.</MedCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {equipment.map((e) => (
              <MedCard key={e.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <MedText variant="body" className="text-[15px] font-semibold text-text truncate">{e.name}</MedText>
                    {e.category && <MedText variant="metadata" className="capitalize">{e.category}</MedText>}
                  </div>
                  <button
                    onClick={() => dispatch(toggleHospitalEquipmentStatus({ id: e.id, isOperational: !e.isOperational }))}
                    className={`px-2 py-1 rounded-full text-[11px] font-medium ${e.isOperational ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
                    title="Toggle operational status"
                  >
                    {e.isOperational ? 'Operational' : 'Maintenance'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-secondary mb-3">
                  <span className="flex items-center gap-1.5"><Clock size={13} className="text-primary" />{e.duration != null ? `${e.duration} min` : '—'}</span>
                  <span className="flex items-center gap-1.5"><Scissors size={13} className="text-primary" />{e.price != null ? `ETB ${Number(e.price).toLocaleString()}` : '—'}</span>
                </div>

                {e.description && <div className="text-[12px] text-muted mb-2 line-clamp-2">{e.description}</div>}

                <div className="mt-auto pt-3 border-t border-border flex items-center justify-end gap-1.5">
                  <button onClick={() => openEdit(e)} className="p-1.5 rounded-[8px] text-text-secondary hover:bg-foreground/5 hover:text-primary" title="Edit">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-[8px] text-text-secondary hover:bg-error-bg hover:text-error" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </MedCard>
            ))}
          </div>
        )
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 text-[13px] text-text-secondary">
              <CalendarDays size={15} className="text-primary" />
              Date
            </label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => {
                setBookingDate(e.target.value);
                dispatch(fetchEquipmentBookings({ date: e.target.value }));
              }}
              className="h-10 px-3 rounded-lg border border-border bg-surface text-[14px] focus:outline-none focus:border-primary"
            />
          </div>

          {equipmentBookings.length === 0 ? (
            <MedCard className="p-10 text-center text-text-secondary">No bookings for this date.</MedCard>
          ) : (
            <div className="space-y-3">
              {equipmentBookings.map((b) => {
                const canReview = b.status === 'pending';
                return (
                  <MedCard key={b.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <MedText variant="body" className="text-[14px] font-semibold text-text">
                            {b.equipment?.name || 'Equipment'}
                          </MedText>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize
                            ${b.status === 'confirmed' || b.status === 'completed' ? 'bg-success/10 text-success' : ''}
                            ${b.status === 'declined' || b.status === 'cancelled' ? 'bg-error/10 text-error' : ''}
                            ${b.status === 'pending' ? 'bg-warning/10 text-warning' : ''}`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <MedText variant="metadata">
                          {b.patient?.patientProfile?.fullName || b.patient?.phone || 'Patient'}
                          {b.dateTime ? ` — ${new Date(b.dateTime).toLocaleString()}` : ''}
                        </MedText>
                      </div>
                      <div className="flex items-center gap-2">
                        {canReview && (
                          <>
                            <button onClick={() => bookingAction(b.id, 'confirm')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-[12px] font-medium hover:bg-success/20">
                              <CheckCircle2 size={14} /> Confirm
                            </button>
                            <button onClick={() => { setDeclineId(b.id); setDeclineReason(''); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 text-error text-[12px] font-medium hover:bg-error/20">
                              <XCircle size={14} /> Decline
                            </button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <button onClick={() => bookingAction(b.id, 'complete')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[12px] font-medium hover:bg-primary/20">
                            <CheckCircle2 size={14} /> Mark Complete
                          </button>
                        )}
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button onClick={() => bookingAction(b.id, 'cancel')} className="p-1.5 rounded-lg text-text-secondary hover:bg-error-bg hover:text-error" title="Cancel">
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                    {b.notes && <div className="mt-2 text-[12px] text-muted">{b.notes}</div>}
                  </MedCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Equipment modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-surface rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <MedText variant="body" className="text-[17px] font-bold text-text">{form.id ? 'Edit Equipment' : 'Add Equipment'}</MedText>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-foreground/5"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. MRI Scanner"
                  className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-[15px] focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Imaging"
                  className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-[15px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">Price (ETB)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 250"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-[15px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">Duration (min)</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-[15px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-border bg-surface text-[14px] focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim() || saving}
                className="w-full py-3 rounded-xl bg-primary text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {form.id ? 'Save Changes' : 'Add Equipment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline modal */}
      {declineId != null && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setDeclineId(null)}>
          <div className="w-full max-w-sm bg-surface rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <MedText variant="body" className="text-[17px] font-bold text-text mb-4">Decline Booking</MedText>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              placeholder="Reason for declining"
              className="w-full p-3 rounded-xl border border-border bg-surface text-[14px] focus:outline-none focus:border-error"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setDeclineId(null)} className="flex-1 py-2.5 rounded-xl border border-border text-[13px] font-medium text-text-secondary">
                Cancel
              </button>
              <button
                onClick={submitDecline}
                disabled={!declineReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-error text-white text-[13px] font-semibold disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}