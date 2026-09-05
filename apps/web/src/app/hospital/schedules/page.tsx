'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  fetchHospitalSchedules,
  createHospitalSchedule,
  updateHospitalSchedule,
  deleteHospitalSchedule,
  fetchHospitalDoctors,
} from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { EthiopianDateHint } from '@/components/hospital/ethiopian-date-hint';
import { formatDate, formatTime } from '@/lib/utils/ethiopianDate';
import { useTimeFormat } from '@/lib/utils/timeFormat';
import { CalendarClock, Plus, Pencil, Trash2, X, Loader2, Clock, Users } from 'lucide-react';

interface ScheduleForm {
  id: number | null;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  clinicRoom: string;
  notes: string;
  isActive: boolean;
}

const emptyForm = (date: string): ScheduleForm => ({
  id: null,
  doctorId: '',
  date,
  startTime: '08:00',
  endTime: '17:00',
  slotDuration: 30,
  clinicRoom: '',
  notes: '',
  isActive: true,
});

function todayStr() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

export default function HospitalSchedulesPage() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { schedules, doctors, loading, error } = useAppSelector((s) => s.hospital);

  const [filter, setFilter] = useState('upcoming');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ScheduleForm>(emptyForm(todayStr()));
  const [saving, setSaving] = useState(false);
  const { toggle, toggleCalendar, isEthiopian, isEthiopianCalendar } = useTimeFormat();

  const loadSchedules = () => {
    dispatch(fetchHospitalSchedules({ limit: '200', sort: 'date', order: 'asc' }));
  };

  useEffect(() => {
    if (token) {
      dispatch(fetchHospitalDoctors());
      loadSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, token]);

  useEffect(() => {
    if (!showModal && error) {
      // discard transient errors from unrelated actions on modal close
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const openCreate = () => {
    setForm(emptyForm(todayStr()));
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setForm({
      id: s.id,
      doctorId: String(s.doctorId),
      date: (s.date || '').slice(0, 10),
      startTime: (s.startTime || '').slice(11, 16) || '08:00',
      endTime: (s.endTime || '').slice(11, 16) || '17:00',
      slotDuration: s.slotDuration || 30,
      clinicRoom: s.clinicRoom || '',
      notes: s.notes || '',
      isActive: s.isActive ?? true,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.doctorId || !form.date || !form.startTime || !form.endTime) {
      return;
    }
    setSaving(true);
    const payload = {
      doctorId: Number(form.doctorId),
      date: form.date,
      startTime: new Date(`${form.date}T${form.startTime}`).toISOString(),
      endTime: new Date(`${form.date}T${form.endTime}`).toISOString(),
      slotDuration: Number(form.slotDuration),
      clinicRoom: form.clinicRoom || undefined,
      notes: form.notes || undefined,
      isActive: form.isActive,
    };
    if (form.id) {
      await dispatch(updateHospitalSchedule({ id: form.id, payload }));
    } else {
      await dispatch(createHospitalSchedule(payload));
    }
    setSaving(false);
    setShowModal(false);
    loadSchedules();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this schedule? This cannot be undone.')) {
      await dispatch(deleteHospitalSchedule(id));
      loadSchedules();
    }
  };

  const filtered = schedules.filter((s) => {
    if (filter === 'upcoming') return s.date >= todayStr();
    if (filter === 'past') return s.date < todayStr();
    return true;
  });

  return (
    <div className="p-5 lg:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-border flex items-center justify-center">
            <CalendarClock size={20} className="text-primary" />
          </div>
          <div>
            <MedText variant="h2" as="h2" className="text-[20px]">Doctor Schedules</MedText>
            <MedText variant="metadata">Manage clinic days and time slots</MedText>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl border border-border bg-surface text-[12px] font-medium text-text-secondary">
            <button onClick={toggle} className={`${isEthiopian ? 'text-primary font-bold' : ''}`}>Time: {isEthiopian ? 'Ethiopian' : 'Western'}</button>
            <span className="text-muted">|</span>
            <button onClick={toggleCalendar} className={`${isEthiopianCalendar ? 'text-primary font-bold' : ''}`}>Cal: {isEthiopianCalendar ? 'Ethiopian' : 'Gregorian'}</button>
          </span>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold hover:opacity-90 transition-opacity">
            <Plus size={16} /> New Schedule
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error/5 border border-error/20 text-error text-[13px]">{error}</div>
      )}

      <div className="flex gap-2 mb-5">
        {(['upcoming', 'past', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium capitalize ${filter === f ? 'bg-primary text-white' : 'bg-surface text-text-secondary border border-border'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && schedules.length === 0 ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <MedCard className="p-10 text-center text-text-secondary">No schedules found. Create your first schedule to get started.</MedCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const booked = s.slots?.reduce((sum, sl) => sum + (sl._count?.bookings || 0), 0) || 0;
            const capacity = s.slots?.reduce((sum, sl) => sum + (sl.maxPatients || 0), 0) || 0;
            return (
              <MedCard key={s.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <MedText variant="body" className="text-[15px] font-semibold text-text truncate">
                      {s.doctor?.fullName || 'Doctor'}
                    </MedText>
                    {s.doctor?.specialization && (
                      <MedText variant="metadata" className="capitalize">{s.doctor.specialization}</MedText>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${s.isActive ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-secondary mb-3">
                  <span className="flex items-center gap-1.5"><CalendarClock size={13} className="text-primary" />{formatDate(new Date((s.date || '').slice(0, 10) + 'T00:00'))}</span>
                  <span className="flex items-center gap-1.5"><Clock size={13} className="text-primary" />{formatTime(new Date(s.startTime))} – {formatTime(new Date(s.endTime))}</span>
                  <span className="flex items-center gap-1.5"><Users size={13} className="text-primary" />{s.slotDuration} min slots</span>
                </div>

                {s.clinicRoom && <div className="text-[12px] text-text-secondary mb-2">Room: {s.clinicRoom}</div>}
                {s.notes && <div className="text-[12px] text-muted mb-2">{s.notes}</div>}

                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[12px] text-text-secondary">{booked}/{capacity} booked</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-[8px] text-text-secondary hover:bg-foreground/5 hover:text-primary" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-[8px] text-text-secondary hover:bg-error-bg hover:text-error" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </MedCard>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <MedText variant="body" className="text-[17px] font-bold text-text">{form.id ? 'Edit Schedule' : 'New Schedule'}</MedText>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-foreground/5"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">Doctor</label>
                <select
                  value={form.doctorId}
                  onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-[15px] focus:outline-none focus:border-primary"
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName}{d.specialization ? ` — ${d.specialization}` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  min={todayStr()}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-[15px] focus:outline-none focus:border-primary"
                />
                <EthiopianDateHint isoDate={form.date} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-[15px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-[15px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">Slot Duration (min)</label>
                  <select
                    value={form.slotDuration}
                    onChange={(e) => setForm({ ...form, slotDuration: Number(e.target.value) })}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-[15px] focus:outline-none focus:border-primary"
                  >
                    {[15, 20, 30, 45, 60].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">Clinic Room</label>
                  <input
                    type="text"
                    value={form.clinicRoom}
                    onChange={(e) => setForm({ ...form, clinicRoom: e.target.value })}
                    placeholder="e.g. Room 2"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-[15px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional"
                  className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-[15px] focus:outline-none focus:border-primary"
                />
              </div>

              <label className="flex items-center gap-2 text-[14px] text-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                Active (visible to patients)
              </label>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={!form.doctorId || !form.date || !form.startTime || !form.endTime || saving}
                className="w-full py-3 rounded-xl bg-primary text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {form.id ? 'Save Changes' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}