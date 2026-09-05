'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  fetchHospitalAppointments,
  fetchHospitalUpcomingAppointments,
  fetchHospitalDoctors,
  approveHospitalAppointment,
  denyHospitalAppointment,
  cancelHospitalAppointment,
  rescheduleHospitalAppointment,
  updateHospitalAppointmentNotes,
  createHospitalAppointmentFollowUp,
  reorderHospitalAppointments,
} from '@/lib/store/slices/hospitalSlice';
import type { HospitalAppointment } from '@/lib/store/slices/hospitalSlice';
import { api } from '@/lib/api/client';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { EthiopianDateHint } from '@/components/hospital/ethiopian-date-hint';
import {
  formatDate,
  formatDateShort,
  formatTime,
  formatDateTime,
  formatWeekRange,
  formatNum,
} from '@/lib/utils/ethiopianDate';
import { useTimeFormat } from '@/lib/utils/timeFormat';
import { PAYMENT_TYPE_FILTER_OPTIONS, matchesPaymentTypeFilter, getPaymentTypeLabel, type PaymentTypeFilter } from '@/lib/utils/paymentType';
import {
  Search, X, Plus, List, Grid3x3, Calendar, ArrowUpDown, GripVertical,
  ChevronLeft, ChevronRight, Clock, CreditCard, Phone, Hash, User, Stethoscope,
  DollarSign, FileText, AlertCircle, CheckCircle, XCircle, Edit3, Loader2,
  CalendarClock,
} from 'lucide-react';

const DOCTOR_COLORS = [
  '#3B82F6', '#059669', '#D97706', '#DC2626', '#7C3AED',
  '#0891B2', '#65A30D', '#BE185D', '#1D4ED8', '#B45309',
];

function getWeekDays(refDate: Date) {
  const start = new Date(refDate);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function localKey(d: Date) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  accepted: 'bg-success/10 text-success',
  declined: 'bg-error/10 text-error',
  completed: 'bg-blue/10 text-blue',
  cancelled: 'bg-muted/10 text-muted',
};

const STATUS_SOLID: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFFAEB', text: '#B54708' },
  accepted: { bg: '#ECFDF3', text: '#027A48' },
  declined: { bg: '#FEF3F2', text: '#D92D20' },
  completed: { bg: '#EFF8FF', text: '#175CD3' },
  cancelled: { bg: '#F2F4F7', text: '#5A6B80' },
};

function doctorOf(a: HospitalAppointment) {
  return a.doctorName || a.doctor?.fullName || 'Doctor';
}

function patientOf(a: HospitalAppointment) {
  return a.patientName || a.patient?.patientProfile?.fullName || a.patientPhone || 'Patient';
}

/* ─────────────────────── Detail / Reschedule / Follow-up Modal ─────────────────────── */

function DetailModal({
  appointment,
  onClose,
  onRefresh,
}: {
  appointment: HospitalAppointment | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const dispatch = useAppDispatch();
  const { isEthiopianCalendar } = useTimeFormat();
  const [view, setView] = useState<'detail' | 'reschedule' | 'follow-up'>('detail');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setView('detail');
    setConfirmCancel(false);
    setSelectedDate('');
    setSlots([]);
    setSelectedSlot(null);
    setError('');
  }, [appointment]);

  const loadSlots = useCallback(async (doctorId: number, date: string) => {
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await api.get('/hospital/schedules', { params: { doctorId, date } });
      const scheds = res.data.data || [];
      const all: any[] = [];
      for (const s of scheds) {
        for (const slot of s.slots || []) all.push({ ...slot, scheduleId: s.id, doctorId: s.doctorId });
      }
      all.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setSlots(all);
    } catch {
      setError('Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if ((view === 'reschedule' || view === 'follow-up') && appointment?.doctorId && selectedDate) {
      loadSlots(appointment.doctorId, selectedDate);
    }
  }, [view, appointment, selectedDate, loadSlots]);

  if (!appointment) return null;

  const a = appointment;
  const colors = STATUS_SOLID[a.status] || STATUS_SOLID.pending;

  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      onClose();
      onRefresh();
    } catch (e: any) {
      setError(e?.message || 'Operation failed');
    } finally {
      setBusy(false);
    }
  };

  const submitReschedule = () =>
    run(() => dispatch(rescheduleHospitalAppointment({ id: a.id, dateTime: selectedSlot.startTime })).unwrap());
  const submitFollowUp = () =>
    run(() => dispatch(createHospitalAppointmentFollowUp({ id: a.id, dateTime: selectedSlot.startTime, slotId: selectedSlot.id })).unwrap());
  const submitCancel = () => run(() => dispatch(cancelHospitalAppointment(a.id)).unwrap());
  const submitApprove = () => run(() => dispatch(approveHospitalAppointment(a.id)).unwrap());

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface rounded-2xl p-6 shadow-xl animate-fade">
        <div className="flex items-center justify-between mb-4">
          <MedText variant="h2" as="h3" className="text-[17px] font-bold text-text">
            {view === 'detail' ? 'Appointment Details' : view === 'reschedule' ? 'Reschedule' : 'Schedule Follow-Up'}
          </MedText>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-foreground/5"><X size={18} /></button>
        </div>

        {error && <div className="mb-4 px-3 py-2.5 rounded-xl bg-error/5 border border-error/20 text-error text-[13px]">{error}</div>}

        {view === 'detail' ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-[12px] font-semibold capitalize" style={{ background: colors.bg, color: colors.text }}>
                {a.status}
              </span>
              {a.isPaid && (
                <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-success/10 text-success">Paid</span>
              )}
              {a.parentAppointmentId && (
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-blue/10 text-blue">Follow-up</span>
              )}
            </div>

            <DetailRow icon={<User size={16} />} label="Patient" value={patientOf(a)} />
            {a.patientPhone && <DetailRow icon={<Phone size={16} />} label="Phone" value={a.patientPhone} />}
            <DetailRow icon={<Stethoscope size={16} />} label="Doctor" value={doctorOf(a)} />
            <DetailRow icon={<Calendar size={16} />} label="Date & Time" value={formatDateTime(new Date(a.dateTime))} />
            {a.fee != null && <DetailRow icon={<DollarSign size={16} />} label="Fee" value={`${formatNum(Number(a.fee))} ETB`} />}
            {getPaymentTypeLabel(a.paymentMethod) && (
              <DetailRow icon={<CreditCard size={16} />} label="Payment" value={getPaymentTypeLabel(a.paymentMethod)!} />
            )}
            {a.confirmationCode && <DetailRow icon={<Hash size={16} />} label="Confirmation Code" value={a.confirmationCode} />}
            {a.reason && <DetailRow icon={<FileText size={16} />} label="Reason" value={a.reason} />}
            {a.issueCategory && <DetailRow icon={<AlertCircle size={16} />} label="Issue Category" value={a.issueCategory} />}
            {a.notes && <DetailRow icon={<Edit3 size={16} />} label="Notes" value={a.notes} />}
            {a.declineReason && (
              <div className="mt-2 px-3 py-2.5 rounded-xl bg-error/5 border border-error/20 text-[13px] text-error">
                <strong>Decline reason:</strong> {a.declineReason}
              </div>
            )}

            {a.attachments && a.attachments.length > 0 && (
              <div className="mt-4">
                <div className="text-[12px] font-semibold text-text mb-2 flex items-center gap-1.5">
                  <FileText size={13} /> Referral Attachments ({a.attachments.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.attachments.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="block w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <img src={url} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-2">
              {a.status === 'pending' && (
                <ActionBtn label="Approve" solid="#027A48" onClick={submitApprove} busy={busy} icon={<CheckCircle size={14} />} />
              )}
              {(a.status === 'pending' || a.status === 'accepted') && (
                <>
                  <ActionBtn label="Reschedule" style={{ background: '#F2F4F7', color: '#1565C0' }} onClick={() => setView('reschedule')} icon={<Calendar size={14} />} />
                  {!confirmCancel ? (
                    <ActionBtn label="Cancel" solid="#D92D20" onClick={() => setConfirmCancel(true)} icon={<XCircle size={14} />} />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-error font-medium">Cancel this appointment?</span>
                      <ActionBtn label="Yes" solid="#D92D20" onClick={submitCancel} busy={busy} loadingText="..." />
                      <ActionBtn label="No" style={{ background: '#F2F4F7', color: '#5A6B80' }} onClick={() => setConfirmCancel(false)} />
                    </div>
                  )}
                </>
              )}
              {a.status === 'completed' && (
                <ActionBtn label="Schedule Follow-Up" style={{ background: '#EFF8FF', color: '#175CD3' }} onClick={() => setView('follow-up')} icon={<CalendarClock size={14} />} />
              )}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setView('detail')} className="mb-4 text-primary text-[13px] font-medium flex items-center gap-1 hover:underline">
              <ChevronLeft size={14} /> Back to details
            </button>

            <MedText variant="body" className="text-text-secondary text-[13px] mb-4">
              {view === 'reschedule'
                ? `Select a new date and time for ${patientOf(a)}'s appointment with Dr. ${a.doctorName || a.doctor?.fullName || '?'}.`
                : `Schedule a follow-up for ${patientOf(a)} with Dr. ${a.doctorName || a.doctor?.fullName || '?'}.`}
            </MedText>

            <div className="mb-4">
              <label className="block text-[12px] font-medium text-muted mb-1.5 ml-1">New Date *</label>
              <input
                type="date"
                value={selectedDate}
                min={formatDateShort(new Date())}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-[15px] focus:outline-none focus:border-primary"
              />
              <EthiopianDateHint isoDate={selectedDate} />
            </div>

            {selectedDate && (
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-text mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-primary" /> Available Slots
                  {selectedSlot && <span className="text-[12px] text-success font-medium">• Slot selected</span>}
                </label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-[13px] text-text-secondary py-2">
                    <Loader2 size={14} className="animate-spin" /> Loading slots...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="px-3 py-2.5 rounded-xl bg-error/5 text-error text-[13px]">No available slots for this doctor on this date.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => {
                      const filled = slot._count?.bookings || 0;
                      const max = slot.maxPatients || 1;
                      const isFull = filled >= max;
                      const isSelected = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isFull}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: '8px 14px', borderRadius: 8, cursor: isFull ? 'not-allowed' : 'pointer',
                            border: `1px solid ${isSelected ? '#1565C0' : isFull ? '#FECDCA' : '#E2E0DA'}`,
                            background: isSelected ? '#E3EFFB' : isFull ? '#FEF3F2' : '#FFF',
                            color: isFull ? '#98A2B3' : '#101828',
                            fontWeight: isSelected ? 600 : 400,
                            fontSize: 13,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                            opacity: isFull ? 0.6 : 1,
                          }}
                        >
                          <span>{formatTime(new Date(slot.startTime))} – {formatTime(new Date(slot.endTime))}</span>
                          <span style={{ fontSize: 11, color: isFull ? '#D92D20' : '#667085' }}>
                            {isFull ? 'FULL' : `${max - filled} spot${max - filled !== 1 ? 's' : ''} left`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <button
                onClick={() => { setView('detail'); setSelectedDate(''); setSelectedSlot(null); }}
                className="px-4 py-2.5 rounded-xl border border-border text-[13px] font-medium text-text-secondary hover:bg-foreground/5"
              >
                Cancel
              </button>
              <button
                onClick={view === 'reschedule' ? submitReschedule : submitFollowUp}
                disabled={!selectedSlot || busy}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                {view === 'reschedule' ? 'Reschedule' : 'Schedule Follow-Up'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1">
      <div className="text-text-secondary mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">{label}</div>
        <div className="text-[14px] text-text mt-0.5 break-words">{value}</div>
      </div>
    </div>
  );
}

function ActionBtn({
  label, onClick, solid, style, busy, icon, loadingText,
}: {
  label: string; onClick: () => void; solid?: string; style?: React.CSSProperties;
  busy?: boolean; icon?: React.ReactNode; loadingText?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60"
      style={solid ? { background: solid, color: '#fff', ...style } : style}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : icon}
      {busy && loadingText ? loadingText : label}
    </button>
  );
}

function DenyModal({ appointment, onClose, onConfirm }: { appointment: HospitalAppointment | null; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  if (!appointment) return null;
  const ok = reason.trim().length >= 3;
  const submit = async () => {
    if (!ok) return;
    setBusy(true);
    await onConfirm(reason.trim());
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm bg-surface rounded-2xl p-6 shadow-xl">
        <MedText variant="h2" as="h3" className="text-[16px] font-bold text-text mb-1">Deny Appointment</MedText>
        <MedText variant="body" className="text-text-secondary text-[13px] mb-4">
          Confirm denial for {patientOf(appointment)}? A reason is required.
        </MedText>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Doctor unavailable on this date"
          className="w-full p-3 rounded-xl border border-border bg-surface text-[14px] focus:outline-none focus:border-error"
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-[13px] font-medium text-text-secondary">Cancel</button>
          <button onClick={submit} disabled={!ok || busy} className="flex-1 py-2.5 rounded-xl bg-error text-white text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            {busy && <Loader2 size={14} className="animate-spin" />} Deny
          </button>
        </div>
      </div>
    </div>
  );
}

function NotesModal({ appointment, onClose, onConfirm }: { appointment: HospitalAppointment | null; onClose: () => void; onConfirm: (notes: string) => void }) {
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [busy, setBusy] = useState(false);
  useEffect(() => setNotes(appointment?.notes || ''), [appointment]);
  if (!appointment) return null;
  const submit = async () => {
    setBusy(true);
    await onConfirm(notes);
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-surface rounded-2xl p-6 shadow-xl">
        <MedText variant="h2" as="h3" className="text-[16px] font-bold text-text mb-4">Edit Notes</MedText>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Appointment notes..."
          className="w-full p-3 rounded-xl border border-border bg-surface text-[14px] focus:outline-none focus:border-primary"
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-[13px] font-medium text-text-secondary">Cancel</button>
          <button onClick={submit} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            {busy && <Loader2 size={14} className="animate-spin" />} Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Calendar View ─────────────────────── */

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

function CalendarView({
  loading, appointments, weekDays, calendarDate, setCalendarDate,
  doctorColorMap, onOpenDetail,
}: {
  loading: boolean;
  appointments: HospitalAppointment[];
  weekDays: Date[];
  calendarDate: Date;
  setCalendarDate: (d: Date) => void;
  doctorColorMap: Record<number, string>;
  onOpenDetail: (a: HospitalAppointment) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const byDay = useMemo(() => {
    const m: Record<string, HospitalAppointment[]> = {};
    for (const a of appointments) {
      const k = localKey(new Date(a.dateTime));
      if (!m[k]) m[k] = [];
      m[k].push(a);
    }
    return weekDays.map((d) => ({ date: d, day: m[localKey(d)] || [] }));
  }, [appointments, weekDays]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => { const d = new Date(calendarDate); d.setDate(d.getDate() - 7); setCalendarDate(d); }}
          className="p-2 rounded-[10px] border border-border hover:bg-surface"><ChevronLeft size={16} /></button>
        <span className="text-[14px] font-semibold text-text flex-1">{formatWeekRange(weekDays)}</span>
        <button onClick={() => setCalendarDate(new Date())}
          className="px-3 py-1.5 rounded-lg border border-border text-[12px] font-medium text-text-secondary hover:bg-surface">Today</button>
        <button onClick={() => { const d = new Date(calendarDate); d.setDate(d.getDate() + 7); setCalendarDate(d); }}
          className="p-2 rounded-[10px] border border-border hover:bg-surface"><ChevronRight size={16} /></button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-secondary gap-2"><Loader2 size={18} className="animate-spin" /> Loading calendar...</div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-2xl bg-surface">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border">
              <div />
              {weekDays.map((d, i) => {
                const isT = d.toDateString() === today.toDateString();
                return (
                  <div key={i} className={`text-center py-2 ${isT ? 'bg-primary/5 rounded-t-2xl' : ''}`}>
                    <div className={`text-[11px] uppercase tracking-wide ${isT ? 'font-bold text-primary' : 'text-text-secondary'}`}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}
                    </div>
                    <div className={`text-[15px] ${isT ? 'font-bold text-primary' : 'text-text'}`}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>

            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border last:border-b-0">
                <div className="text-[10px] text-text-secondary px-2 py-1">{formatTime(new Date(new Date().setHours(hour, 0, 0, 0)))}</div>
                {weekDays.map((day, dayIdx) => {
                  const dayStart = new Date(day); dayStart.setHours(hour, 0, 0, 0);
                  const dayEnd = new Date(day); dayEnd.setHours(hour, 59, 59, 999);
                  const cell = byDay[dayIdx]?.day.filter((a) => {
                    const t = new Date(a.dateTime);
                    return t >= dayStart && t <= dayEnd;
                  }) || [];
                  const isT = day.toDateString() === today.toDateString();
                  return (
                    <div key={dayIdx} className={`min-h-[58px] p-1 border-l border-border first:border-l-0 ${isT ? 'bg-primary/[0.02]' : ''}`}>
                      {cell.map((a) => {
                        const c = STATUS_SOLID[a.status] || STATUS_SOLID.pending;
                        const color = doctorColorMap[a.doctorId || 0] || '#3B82F6';
                        return (
                          <button
                            key={a.id}
                            onClick={() => onOpenDetail(a)}
                            title={`${patientOf(a)} — ${formatTime(new Date(a.dateTime))} — Dr. ${doctorOf(a)}`}
                            className="w-full text-left px-2 py-1 rounded-md mb-0.5 text-[11px] leading-tight font-medium hover:opacity-80 transition-opacity"
                            style={{ background: c.bg, color: c.text, borderLeft: `3px solid ${color}` }}
                          >
                            <span className="font-bold">{patientOf(a).split(' ')[0]}</span> {formatTime(new Date(a.dateTime))}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Reorder View ─────────────────────── */

interface SlotData {
  id: number;
  startTime: string;
  endTime: string;
  maxPatients: number;
  _count: { bookings: number };
}

function ReorderView({
  appointments, doctorId, onDoctorChange, date, onDateChange, allDoctors, onApply,
}: {
  appointments: HospitalAppointment[];
  doctorId: number | '';
  onDoctorChange: (v: number | '') => void;
  date: string;
  onDateChange: (d: string) => void;
  allDoctors: { id: number; fullName: string | null; specialization?: string | null }[];
  onApply: (ordered: (number | null)[]) => void;
}) {
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [ordered, setOrdered] = useState<(number | null)[]>([]);
  const [original, setOriginal] = useState<(number | null)[]>([]);
  const [applying, setApplying] = useState(false);
  const dragItem = useRef<number | null>(null);

  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([]); setOrdered([]); setOriginal([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    api.get('/hospital/schedules', { params: { doctorId, date } })
      .then((res) => {
        if (cancelled) return;
        const scheds: { slots: SlotData[] }[] = res.data.data || [];
        const all: SlotData[] = [];
        for (const s of scheds) all.push(...(s.slots || []));
        all.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setSlots(all);
        const initial: (number | null)[] = all.map((slot) => {
          const apt = appointments.find((a) => a.slotId === slot.id && ['pending', 'accepted'].includes(a.status));
          return apt ? apt.id : null;
        });
        setOrdered(initial);
        setOriginal(initial);
        setLoadingSlots(false);
      })
      .catch(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [doctorId, date, appointments]);

  const isDirty = ordered.some((id, i) => id !== original[i]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <label className="text-[13px] font-semibold text-text">Doctor</label>
        <select
          value={doctorId}
          onChange={(e) => onDoctorChange(e.target.value ? Number(e.target.value) : '')}
          className="px-3 py-2 rounded-[10px] border border-border bg-surface text-[14px] focus:outline-none focus:border-primary min-w-[220px]"
        >
          <option value="">Select a doctor</option>
          {allDoctors.map((d) => (
            <option key={d.id} value={d.id}>{d.fullName || `Doctor #${d.id}`}{d.specialization ? ` (${d.specialization})` : ''}</option>
          ))}
        </select>
        <label className="text-[13px] font-semibold text-text">Date</label>
        <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)}
          className="px-3 py-2 rounded-[10px] border border-border bg-surface text-[14px] focus:outline-none focus:border-primary" />
        <EthiopianDateHint isoDate={date} />
      </div>

      {loadingSlots && <div className="py-10 text-center text-text-secondary">Loading slots...</div>}
      {!loadingSlots && doctorId && slots.length === 0 && (
        <div className="py-10 text-center text-text-secondary bg-surface border border-border rounded-xl">
          No schedule slots found for this doctor and date
        </div>
      )}

      {!loadingSlots && doctorId && slots.length > 0 && (
        <>
          <div className="flex flex-col gap-1.5">
            {slots.map((slot, idx) => {
              const apptId = ordered[idx];
              const apt = apptId != null ? appointments.find((a) => a.id === apptId) : null;
              const isDragging = dragItem.current === idx;
              return (
                <div
                  key={slot.id}
                  draggable={!!apt}
                  onDragStart={() => apt && (dragItem.current = idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    const from = dragItem.current;
                    if (from === null || from === idx) return;
                    const next = [...ordered];
                    const [moved] = next.splice(from, 1);
                    next.splice(idx, 0, moved);
                    setOrdered(next);
                    dragItem.current = null;
                  }}
                  onDragEnd={() => { dragItem.current = null; }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${apt ? 'border-border bg-surface cursor-grab' : 'border-dashed border-muted/40 bg-foreground/[0.02]'} ${isDragging ? 'shadow-md opacity-60' : ''}`}
                >
                  {apt ? <GripVertical size={18} className="text-text-secondary" /> : <div className="w-[18px]" />}
                  <span className="font-semibold text-[14px] text-text-secondary w-[70px]">{formatTime(new Date(slot.startTime))}</span>
                  {apt ? (
                    <>
                      <span className="font-semibold text-[15px] text-text">{patientOf(apt)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${apt.status === 'accepted' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {apt.status}
                      </span>
                    </>
                  ) : (
                    <span className="text-[13px] text-muted italic flex items-center gap-1"><Plus size={14} /> Empty slot — drop an appointment here</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-0 mt-6 flex justify-end gap-3 bg-surface/95 backdrop-blur px-4 py-3 rounded-xl border border-border">
            <button
              onClick={() => setOrdered([...original])}
              disabled={!isDirty}
              className="px-5 py-2.5 rounded-[10px] border border-border text-[13px] font-semibold text-text disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setApplying(true);
                await onApply(ordered);
                setApplying(false);
              }}
              disabled={!isDirty || applying}
              className="px-6 py-2.5 rounded-[10px] bg-primary text-white text-[13px] font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {applying && <Loader2 size={14} className="animate-spin" />}
              {applying ? 'Applying...' : 'Apply Changes'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────── Page ─────────────────────── */

export default function HospitalAppointmentsPage() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { appointments, upcomingAppointments, loading, error, doctors } = useAppSelector((s) => s.hospital);
  const { toggle, toggleCalendar, isEthiopian, isEthiopianCalendar } = useTimeFormat();

  const [activeTab, setActiveTab] = useState<'all' | 'upcoming'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'reorder'>('calendar');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState<number | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentTypeFilter>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [codeSearch, setCodeSearch] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [reorderDate, setReorderDate] = useState(formatDateShort(new Date()));
  const [detailTarget, setDetailTarget] = useState<HospitalAppointment | null>(null);
  const [denyTarget, setDenyTarget] = useState<HospitalAppointment | null>(null);
  const [notesTarget, setNotesTarget] = useState<HospitalAppointment | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const weekDays = useMemo(() => getWeekDays(calendarDate), [calendarDate]);
  const doctorColorMap = useMemo(() => {
    const m: Record<number, string> = {};
    doctors.forEach((d, i) => { m[d.id] = DOCTOR_COLORS[i % DOCTOR_COLORS.length]; });
    return m;
  }, [doctors]);

  useEffect(() => {
    if (token) dispatch(fetchHospitalDoctors());
  }, [dispatch, token]);

  useEffect(() => {
    if (!token) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (activeTab === 'upcoming') {
      dispatch(fetchHospitalUpcomingAppointments({ doctorId: doctorFilter === '' ? undefined : Number(doctorFilter) }));
    } else if (codeSearch) {
      timer = setTimeout(() => dispatch(fetchHospitalAppointments({ confirmationCode: codeSearch })), 300);
    } else if (viewMode === 'list') {
      dispatch(fetchHospitalAppointments({
        status: statusFilter === 'all' ? undefined : statusFilter,
        doctorId: doctorFilter === '' ? undefined : Number(doctorFilter),
        ...(dateFilter ? { from: `${dateFilter}T00:00:00.000Z`, to: `${dateFilter}T23:59:59.999Z` } : {}),
        limit: 200,
      }));
    } else if (viewMode === 'reorder') {
      dispatch(fetchHospitalAppointments({ from: `${reorderDate}T00:00:00.000Z`, to: `${reorderDate}T23:59:59.999Z`, limit: 500 }));
    } else {
      dispatch(fetchHospitalAppointments({
        from: weekDays[0].toISOString(),
        to: new Date(weekDays[6].getFullYear(), weekDays[6].getMonth(), weekDays[6].getDate(), 23, 59, 59).toISOString(),
        status: statusFilter === 'all' ? undefined : statusFilter,
        doctorId: doctorFilter === '' ? undefined : Number(doctorFilter),
        limit: 500,
      }));
    }
    return () => { if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, token, activeTab, viewMode, statusFilter, doctorFilter, codeSearch, dateFilter, reorderDate, calendarDate]);

  const refresh = useCallback(() => {
    if (activeTab === 'upcoming') {
      dispatch(fetchHospitalUpcomingAppointments({ doctorId: doctorFilter === '' ? undefined : Number(doctorFilter) }));
      return;
    }
    if (codeSearch) { dispatch(fetchHospitalAppointments({ confirmationCode: codeSearch })); return; }
    if (viewMode === 'list') {
      dispatch(fetchHospitalAppointments({
        status: statusFilter === 'all' ? undefined : statusFilter,
        doctorId: doctorFilter === '' ? undefined : Number(doctorFilter),
        ...(dateFilter ? { from: `${dateFilter}T00:00:00.000Z`, to: `${dateFilter}T23:59:59.999Z` } : {}),
        limit: 200,
      }));
    } else if (viewMode === 'reorder') {
      dispatch(fetchHospitalAppointments({ from: `${reorderDate}T00:00:00.000Z`, to: `${reorderDate}T23:59:59.999Z`, limit: 500 }));
    } else {
      dispatch(fetchHospitalAppointments({
        from: weekDays[0].toISOString(),
        to: new Date(weekDays[6].getFullYear(), weekDays[6].getMonth(), weekDays[6].getDate(), 23, 59, 59).toISOString(),
        status: statusFilter === 'all' ? undefined : statusFilter,
        doctorId: doctorFilter === '' ? undefined : Number(doctorFilter),
        limit: 500,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, activeTab, viewMode, statusFilter, doctorFilter, codeSearch, dateFilter, reorderDate, weekDays]);

  const list = activeTab === 'upcoming' ? upcomingAppointments : appointments;

  const filtered = list.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (doctorFilter && a.doctorId !== doctorFilter) return false;
    if (!matchesPaymentTypeFilter(a.paymentMethod, paymentFilter)) return false;
    return true;
  });

  const handleApprove = async (a: HospitalAppointment) => {
    if (!window.confirm(`Approve this appointment for ${patientOf(a)}?`)) return;
    setApprovingId(a.id);
    await dispatch(approveHospitalAppointment(a.id)).unwrap();
    setApprovingId(null);
    refresh();
  };

  const handleCancel = async (a: HospitalAppointment) => {
    if (!window.confirm(`Cancel this appointment for ${patientOf(a)}?`)) return;
    setCancellingId(a.id);
    await dispatch(cancelHospitalAppointment(a.id)).unwrap();
    setCancellingId(null);
    refresh();
  };

  const handleDeny = async (reason: string) => {
    if (!denyTarget) return;
    await dispatch(denyHospitalAppointment({ id: denyTarget.id, reason })).unwrap();
    setDenyTarget(null);
    refresh();
  };

  const handleNotes = async (notes: string) => {
    if (!notesTarget) return;
    await dispatch(updateHospitalAppointmentNotes({ id: notesTarget.id, notes })).unwrap();
    setNotesTarget(null);
    refresh();
  };

  const handleReorderApply = async (ordered: (number | null)[]) => {
    if (!doctorFilter || !reorderDate) return;
    try {
      await dispatch(reorderHospitalAppointments({ doctorId: Number(doctorFilter), date: new Date(`${reorderDate}T12:00:00`).toISOString(), orderedSlots: ordered })).unwrap();
      refresh();
    } catch { /* error shown from redux */ }
  };

  return (
    <div className="p-5 lg:p-6 max-w-6xl mx-auto animate-fade">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
        <div>
          <MedText variant="h2" as="h2" className="text-[20px]">Appointments</MedText>
          <MedText variant="body" className="text-text-secondary mt-1">
            {activeTab === 'upcoming'
              ? 'View and manage upcoming future appointments.'
              : viewMode === 'list'
                ? 'Review and manage appointment requests.'
                : 'Weekly calendar view of appointments.'}
          </MedText>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl border border-border bg-surface text-[12px] font-medium text-text-secondary">
            <button onClick={toggle} className={`${isEthiopian ? 'text-primary font-bold' : ''}`}>Time: {isEthiopian ? 'Ethiopian' : 'Western'}</button>
            <span className="text-muted">|</span>
            <button onClick={toggleCalendar} className={`${isEthiopianCalendar ? 'text-primary font-bold' : ''}`}>Cal: {isEthiopianCalendar ? 'Ethiopian' : 'Gregorian'}</button>
          </span>
          <button onClick={() => setDetailTarget(null)} className="hidden" />
        </div>
      </div>

      {/* Tabs + view modes */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1.5">
          {(['all', 'upcoming'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-medium capitalize ${activeTab === t ? 'bg-primary text-white' : 'bg-surface text-text-secondary border border-border'}`}
            >
              {t === 'all' ? <List size={14} /> : <Calendar size={14} />}
              {t}
            </button>
          ))}
        </div>
        {activeTab === 'all' && (
          <div className="flex gap-1.5 ml-auto">
            {([
              { key: 'list', label: 'List', icon: List },
              { key: 'calendar', label: 'Calendar', icon: Grid3x3 },
              { key: 'reorder', label: 'Reorder', icon: ArrowUpDown },
            ] as const).map((v) => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-medium ${viewMode === v.key ? 'bg-foreground/10 text-text' : 'bg-surface text-text-secondary border border-border'}`}
              >
                <v.icon size={14} /> {v.label}
              </button>
            ))}
          </div>
        )}
        {activeTab === 'upcoming' && (
          <div className="ml-auto flex gap-3">
            {[
              { label: 'Upcoming', value: upcomingAppointments.length, color: '#1565C0' },
              { label: 'Pending', value: upcomingAppointments.filter(a => a.status === 'pending').length, color: '#B54708' },
              { label: 'Accepted', value: upcomingAppointments.filter(a => a.status === 'accepted').length, color: '#027A48' },
            ].map((s) => (
              <div key={s.label} className="px-4 py-2 rounded-xl bg-surface border border-border text-center">
                <div className="text-[11px] text-text-secondary">{s.label}</div>
                <div className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      {viewMode !== 'reorder' && (
        <MedCard className="mb-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="w-full pl-9 pr-8 py-2 border border-border rounded-[10px] text-[13px] focus:outline-none focus:border-primary"
                placeholder="Search by code (e.g. KTR..."
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value.replace(/-/g, '').toUpperCase())}
              />
              {codeSearch && (
                <button onClick={() => setCodeSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-text-secondary"><X size={14} /></button>
              )}
            </div>
            <select className="w-full px-3 py-2 border border-border rounded-[10px] text-[13px] bg-surface focus:outline-none focus:border-primary"
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {['pending', 'accepted', 'declined', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select className="w-full px-3 py-2 border border-border rounded-[10px] text-[13px] bg-surface focus:outline-none focus:border-primary"
              value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">All Doctors</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName || `Doctor #${d.id}`}</option>)}
            </select>
            <select className="w-full px-3 py-2 border border-border rounded-[10px] text-[13px] bg-surface focus:outline-none focus:border-primary"
              value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentTypeFilter)}>
              {PAYMENT_TYPE_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {viewMode === 'list' && (
              <div>
                <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-[10px] text-[13px] bg-surface focus:outline-none focus:border-primary" />
                <EthiopianDateHint isoDate={dateFilter} />
              </div>
            )}
          </div>
        </MedCard>
      )}

      {error && <div className="mb-4 px-4 py-3 rounded-xl bg-error/5 border border-error/20 text-error text-[13px]">{error}</div>}

      {viewMode === 'reorder' ? (
        <ReorderView
          appointments={appointments}
          doctorId={doctorFilter}
          onDoctorChange={setDoctorFilter}
          date={reorderDate}
          onDateChange={setReorderDate}
          allDoctors={doctors}
          onApply={handleReorderApply}
        />
      ) : viewMode === 'calendar' ? (
        <CalendarView
          loading={loading}
          appointments={filtered}
          weekDays={weekDays}
          calendarDate={calendarDate}
          setCalendarDate={setCalendarDate}
          doctorColorMap={doctorColorMap}
          onOpenDetail={setDetailTarget}
        />
      ) : (
        <div className="space-y-3">
          {loading && !filtered.length ? (
            <div className="text-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <MedCard><div className="text-center py-10">
              <List size={28} className="text-muted mx-auto mb-3" />
              <MedText variant="body" className="text-text-secondary">No appointments found.</MedText>
            </div></MedCard>
          ) : (
            filtered.map((a) => (
              <MedCard key={a.id}>
                <button className="w-full text-left" onClick={() => setDetailTarget(a)}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <MedText variant="body" className="text-[14px] font-semibold text-text">{patientOf(a)}</MedText>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_STYLES[a.status] || STATUS_STYLES.pending}`}>
                          {a.status}
                        </span>
                        {a.isPaid && <span className="text-[11px] font-medium text-success">Paid</span>}
                        {a.parentAppointmentId && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue/10 text-blue">Follow-up</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-text-secondary">
                        <span className="flex items-center gap-1"><Stethoscope size={13} className="text-muted" />{doctorOf(a)}{a.specialization ? ` • ${a.specialization}` : ''}</span>
                        <span className="flex items-center gap-1"><Calendar size={13} className="text-muted" />{formatDateTime(new Date(a.dateTime))}</span>
                        {a.patientPhone && <span className="flex items-center gap-1"><Phone size={13} className="text-muted" />{a.patientPhone}</span>}
                        {a.confirmationCode && <span className="flex items-center gap-1"><Hash size={13} className="text-muted" />{a.confirmationCode}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-start sm:items-end gap-1">
                      {a.fee != null && <MedText variant="body" className="text-[14px] font-semibold">{formatNum(Number(a.fee))} ETB</MedText>}
                      {a.slotStart && <span className="flex items-center gap-1 text-[11px] text-text-secondary"><Clock size={12} />{formatTime(new Date(a.slotStart))}</span>}
                    </div>
                  </div>
                </button>

                {(a.status === 'pending' || a.status === 'accepted') && (
                  <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                    {a.status === 'pending' && (
                      <ActionBtn label="Approve" solid="#027A48" onClick={() => handleApprove(a)} busy={approvingId === a.id}
                        icon={<CheckCircle size={14} />} loadingText="..." />
                    )}
                    <ActionBtn label="Deny" style={{ background: '#FEF3F2', color: '#D92D20' }} onClick={() => setDenyTarget(a)} icon={<XCircle size={14} />} />
                    <ActionBtn label="Reschedule" style={{ background: '#F2F4F7', color: '#1565C0' }} onClick={() => setDetailTarget(a)} icon={<CalendarClock size={14} />} />
                    <ActionBtn label="Notes" style={{ background: '#F2F4F7', color: '#475467' }} onClick={() => setNotesTarget(a)} icon={<Edit3 size={14} />} />
                    <ActionBtn label="Cancel" style={{ background: '#FEF3F2', color: '#D92D20' }}
                      onClick={() => a.status === 'pending' ? handleCancel(a) : setDetailTarget(a)} busy={cancellingId === a.id}
                      icon={<XCircle size={14} />} loadingText="..." />
                    <button onClick={() => setDetailTarget(a)} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-foreground/5 text-text-secondary text-[13px] font-medium hover:bg-foreground/10">
                      Details <ChevronRight size={14} />
                    </button>
                  </div>
                )}
                {a.status !== 'pending' && a.status !== 'accepted' && (
                  <button onClick={() => setDetailTarget(a)} className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-foreground/5 text-text-secondary text-[13px] font-medium hover:bg-foreground/10">
                    Details <ChevronRight size={14} />
                  </button>
                )}
              </MedCard>
            ))
          )}
        </div>
      )}

      <DetailModal appointment={detailTarget} onClose={() => setDetailTarget(null)} onRefresh={refresh} />
      <DenyModal appointment={denyTarget} onClose={() => setDenyTarget(null)} onConfirm={handleDeny} />
      <NotesModal appointment={notesTarget} onClose={() => setNotesTarget(null)} onConfirm={handleNotes} />
    </div>
  );
}