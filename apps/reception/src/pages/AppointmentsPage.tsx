import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { Search, X, Plus, List, Grid3x3, Calendar, ArrowUpDown, GripVertical } from 'lucide-react';
import DenyModal from '../components/DenyModal';
import RescheduleModal from '../components/RescheduleModal';
import AppointmentNotesModal from '../components/AppointmentNotesModal';
import CreateAppointmentModal from '../components/CreateAppointmentModal';
import { fetchAppointments, approveAppointment, denyAppointment, cancelAppointment, rescheduleAppointment, updateAppointmentNotes, createFollowUpAppointment, reorderAppointments } from '../store/slices/appointmentSlice';
import { fetchScheduleDoctors } from '../store/slices/scheduleSlice';
import { pageStyles } from './AppointmentsPage.styles';
import AppointmentsListView from '../components/appointments/AppointmentsListView';
import AppointmentsCalendarView from '../components/appointments/AppointmentsCalendarView';
import AppointmentDetailModal from '../components/appointments/AppointmentDetailModal';
import ReorderView from '../components/appointments/ReorderView';
import { EthiopianDateHint } from '../components/EthiopianDateHint';
import { PAYMENT_TYPE_FILTER_OPTIONS, matchesPaymentTypeFilter, type PaymentTypeFilter } from '../utils/paymentType';

export type Appointment = {
  id: number;
  patientId: number;
  doctorId: number;
  dateTime: string;
  status: string;
  fee: number;
  isPaid: boolean;
  paymentMethod?: string;
  confirmationCode?: string;
  reason: string | null;
  issueCategory: string | null;
  notes: string | null;
  declineReason: string | null;
  reviewedByReceptionistId: number | null;
  duration: number;
  patient: {
    id: number;
    phone: string;
    patientProfile: { fullName: string; gender: string; bloodType: string | null; dateOfBirth: string | null } | null;
  };
  doctor: { id: number; fullName: string; specialization: string };
  slot?: { id: number; startTime: string } | null;
};

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

function AppointmentsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, upcomingAppointments, loading, upcomingLoading, error } = useSelector((s: RootState) => s.appointments);
  const { doctors: allDoctors, error: doctorsError } = useSelector((s: RootState) => s.schedules);

  const [activeTab, setActiveTab] = useState<'all' | 'upcoming'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'reorder'>('calendar');

  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState<number | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentTypeFilter>('all');
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [denyTarget, setDenyTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [notesTarget, setNotesTarget] = useState<Appointment | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null);
  const [codeSearch, setCodeSearch] = useState('');
  const [reorderDate, setReorderDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  const weekDays = useMemo(() => getWeekDays(calendarDate), [calendarDate]);
  const doctorColorMap = useMemo(() => {
    const map: Record<number, string> = {};
    allDoctors.forEach((d, i) => { map[d.id] = DOCTOR_COLORS[i % DOCTOR_COLORS.length]; });
    return map;
  }, [allDoctors]);

  const filtered = appointments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (doctorFilter && a.doctorId !== doctorFilter) return false;
    if (!matchesPaymentTypeFilter(a.paymentMethod, paymentFilter)) return false;
    return true;
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    accepted: appointments.filter((a) => a.status === 'accepted').length,
    declined: appointments.filter((a) => a.status === 'declined').length,
  };

  useEffect(() => {
    dispatch(fetchScheduleDoctors());
  }, [dispatch]);

  // Debounced search: watches codeSearch and fetches after 300ms
  useEffect(() => {
    if (codeSearch) {
      const timer = setTimeout(() => {
        dispatch(fetchAppointments({ confirmationCode: codeSearch }));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [dispatch, codeSearch]);

  // Initial fetch when not searching by code
  useEffect(() => {
    if (codeSearch) return;
    if (viewMode === 'list') {
      dispatch(fetchAppointments(dateFilter ? { date: dateFilter } : {}));
    } else if (viewMode === 'reorder' && reorderDate) {
      dispatch(fetchAppointments({ date: reorderDate }));
    } else {
      const from = weekDays[0].toISOString();
      const to = new Date(weekDays[6].getFullYear(), weekDays[6].getMonth(), weekDays[6].getDate(), 23, 59, 59).toISOString();
      dispatch(fetchAppointments({ from, to }));
    }
  }, [dispatch, dateFilter, viewMode, weekDays, codeSearch, reorderDate]);

  const handleApprove = async (appointment: Appointment) => {
    if (!window.confirm(`Approve this appointment for ${appointment.patient.patientProfile?.fullName || 'patient'}?`)) return;
    setApprovingId(appointment.id);
    try {
      await dispatch(approveAppointment(appointment.id)).unwrap();
      refetchAppointments();
    } catch { /* error shown from Redux */ }
    setApprovingId(null);
  };

  const handleDeny = async (reason: string) => {
    if (!denyTarget) return;
    await dispatch(denyAppointment({ id: denyTarget.id, reason })).unwrap();
    refetchAppointments();
  };

  const handleCancel = async (appointment: Appointment) => {
    if (!window.confirm(`Cancel this appointment for ${appointment.patient.patientProfile?.fullName || 'patient'}?`)) return;
    setCancellingId(appointment.id);
    try {
      await dispatch(cancelAppointment(appointment.id)).unwrap();
      refetchAppointments();
    } catch { /* error shown from Redux */ }
    setCancellingId(null);
  };

  const handleReschedule = async (dateTime: string) => {
    if (!rescheduleTarget) return;
    await dispatch(rescheduleAppointment({ id: rescheduleTarget.id, dateTime })).unwrap();
    refetchAppointments();
  };

  const handleNotes = async (notes: string | null) => {
    if (!notesTarget) return;
    await dispatch(updateAppointmentNotes({ id: notesTarget.id, data: { notes } })).unwrap();
    refetchAppointments();
  };

  const handleDetailCancel = async (id: number) => {
    await dispatch(cancelAppointment(id)).unwrap();
    refetchAppointments();
    setDetailTarget(null);
  };

  const handleDetailApprove = async (id: number) => {
    await dispatch(approveAppointment(id)).unwrap();
    refetchAppointments();
    setDetailTarget(null);
  };

  const handleDetailReschedule = async (id: number, dateTime: string) => {
    await dispatch(rescheduleAppointment({ id, dateTime })).unwrap();
    refetchAppointments();
    setDetailTarget(null);
  };

  const handleDetailEditNotes = (a: Appointment) => {
    setNotesTarget(a);
    setDetailTarget(null);
  };

  const handleScheduleFollowUp = async (id: number, dateTime: string) => {
    await dispatch(createFollowUpAppointment({ id, dateTime })).unwrap();
    refetchAppointments();
    setDetailTarget(null);
  };

  const handleReorderApply = async (orderedSlots: (number | null)[]) => {
    if (!doctorFilter || !reorderDate) return;
    try {
      await dispatch(reorderAppointments({ doctorId: Number(doctorFilter), date: reorderDate, orderedSlots })).unwrap();
      refetchAppointments();
    } catch { /* error shown from Redux */ }
  };

  const refetchAppointments = () => {
    if (codeSearch) {
      dispatch(fetchAppointments({ confirmationCode: codeSearch }));
    } else if (viewMode === 'list') {
      dispatch(fetchAppointments(dateFilter ? { date: dateFilter } : {}));
    } else if (viewMode === 'reorder') {
      dispatch(fetchAppointments({ date: reorderDate }));
    } else {
      const from = weekDays[0].toISOString();
      const to = new Date(weekDays[6].getFullYear(), weekDays[6].getMonth(), weekDays[6].getDate(), 23, 59, 59).toISOString();
      dispatch(fetchAppointments({ from, to }));
    }
  };

  const calendarAppointments = useMemo(() => {
    if (viewMode !== 'calendar') return [];
    const toLocalKey = (d: Date) => {
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${dy}`;
    };
    const byDay: Record<string, Appointment[]> = {};
    for (const a of filtered) {
      const key = toLocalKey(new Date(a.dateTime));
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(a);
    }
    return weekDays.map((d) => {
      const key = toLocalKey(d);
      return { date: d, appointments: byDay[key] || [] };
    });
  }, [filtered, weekDays, viewMode]);

  return (
    <div className="animate-fade">
      <div style={pageStyles.headerContainer}>
        <div>
          <h2 style={pageStyles.headerTitle}>Appointments</h2>
          <p style={pageStyles.headerSubtitle}>
            {activeTab === 'upcoming'
              ? 'View and manage upcoming future appointments.'
              : viewMode === 'list'
                ? 'Review and manage appointment requests.'
                : 'Weekly calendar view of appointments.'}
          </p>
        </div>
        <div style={pageStyles.actionsContainer}>
          <div style={pageStyles.viewToggleGroup}>
            <button
              onClick={() => { setActiveTab('all'); }}
              style={{
                ...pageStyles.viewToggleButton,
                background: activeTab === 'all' ? 'var(--accent-primary)' : '#FFF',
                color: activeTab === 'all' ? '#FFF' : 'var(--text-secondary)',
              }}
            >
              <List size={16} /> All
            </button>
            <button
              onClick={() => { setActiveTab('upcoming'); }}
              style={{
                ...pageStyles.viewToggleButton,
                background: activeTab === 'upcoming' ? 'var(--accent-primary)' : '#FFF',
                color: activeTab === 'upcoming' ? '#FFF' : 'var(--text-secondary)',
              }}
            >
              <Calendar size={16} /> Upcoming
            </button>
            {activeTab === 'all' && (
              <>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    ...pageStyles.viewToggleButton,
                    background: viewMode === 'list' ? '#E8E4D9' : '#FFF',
                    color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <List size={16} /> List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  style={{
                    ...pageStyles.viewToggleButton,
                    background: viewMode === 'calendar' ? '#E8E4D9' : '#FFF',
                    color: viewMode === 'calendar' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <Grid3x3 size={16} /> Calendar
                </button>
                <button
                  onClick={() => setViewMode('reorder')}
                  style={{
                    ...pageStyles.viewToggleButton,
                    background: viewMode === 'reorder' ? '#E8E4D9' : '#FFF',
                    color: viewMode === 'reorder' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <ArrowUpDown size={16} /> Reorder
                </button>
              </>
            )}
          </div>
          <button onClick={() => setShowCreateModal(true)} style={pageStyles.newAppointmentBtn}>
            <Plus size={18} /> New Appointment
          </button>
        </div>
      </div>

      {activeTab === 'upcoming' && (
        <div style={pageStyles.statsRow}>
          {[
            { label: 'Upcoming', value: upcomingAppointments.length, color: '#1565C0', bg: '#E3EFFB' },
            { label: 'Pending', value: upcomingAppointments.filter(a => a.status === 'pending').length, color: '#B54708', bg: '#FFFAEB' },
            { label: 'Accepted', value: upcomingAppointments.filter(a => a.status === 'accepted').length, color: '#027A48', bg: '#ECFDF3' },
          ].map((s) => (
            <div key={s.label} style={pageStyles.statCard}>
              <div style={pageStyles.statLabel}>{s.label}</div>
              <div style={{ ...pageStyles.statValue, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {viewMode !== 'reorder' && <div style={pageStyles.filtersRow}>
        <div>
          <label style={pageStyles.filterLabel}>Search by Code</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-secondary)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={codeSearch}
              onChange={(e) => setCodeSearch(e.target.value.replace(/-/g, '').toUpperCase())}
              placeholder="Search by code (e.g. KTR260601)"
              style={{
                ...pageStyles.filterSelect,
                paddingLeft: 30,
                paddingRight: codeSearch ? 30 : 12,
                minWidth: 160,
              }}
            />
            {codeSearch && (
              <button
                onClick={() => { setCodeSearch(''); }}
                style={{
                  position: 'absolute', right: 6, background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-secondary)', padding: 4,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div>
          <label style={pageStyles.filterLabel}>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={pageStyles.filterSelect}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label style={pageStyles.filterLabel}>Doctor</label>
          <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value ? Number(e.target.value) : '')} style={{ ...pageStyles.filterSelect, minWidth: '180px' }}>
            <option value="">All Doctors</option>
            {allDoctors.map((d) => (
              <option key={d.id} value={d.id}>{d.fullName} ({d.specialization})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={pageStyles.filterLabel}>Payment Type</label>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentTypeFilter)} style={{ ...pageStyles.filterSelect, minWidth: '180px' }}>
            {PAYMENT_TYPE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {viewMode === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={pageStyles.filterLabel}>Date</label>
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: '4px',
                  }}
                >
                  Show All
                </button>
              )}
            </div>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={pageStyles.filterSelect} />
            <EthiopianDateHint isoDate={dateFilter} />
          </div>
        )}
      </div>}

      {error && <div style={pageStyles.errorBanner}>{error}</div>}

      {viewMode === 'list' ? (
        <AppointmentsListView
          loading={loading}
          filtered={filtered}
          statusFilter={statusFilter}
          approvingId={approvingId}
          cancellingId={cancellingId}
          handleApprove={handleApprove}
          setDenyTarget={setDenyTarget}
          handleCancel={handleCancel}
          setRescheduleTarget={setRescheduleTarget}
          setNotesTarget={setNotesTarget}
          setDetailTarget={setDetailTarget}
        />
      ) : viewMode === 'calendar' ? (
        <AppointmentsCalendarView
          loading={loading}
          filtered={filtered}
          weekDays={weekDays}
          calendarDate={calendarDate}
          setCalendarDate={setCalendarDate}
          calendarAppointments={calendarAppointments}
          doctorFilter={doctorFilter}
          doctorColorMap={doctorColorMap}
          setDetailTarget={setDetailTarget}
        />
      ) : (
        <ReorderView
          appointments={filtered}
          doctorFilter={doctorFilter}
          setDoctorFilter={setDoctorFilter}
          reorderDate={reorderDate}
          onDateChange={setReorderDate}
          allDoctors={allDoctors}
          onApply={handleReorderApply}
        />
      )}

      <DenyModal open={!!denyTarget} patientName={denyTarget?.patient.patientProfile?.fullName || ''} onClose={() => setDenyTarget(null)} onConfirm={handleDeny} />
      <RescheduleModal open={!!rescheduleTarget} patientName={rescheduleTarget?.patient.patientProfile?.fullName || ''} doctorId={rescheduleTarget?.doctorId} onClose={() => setRescheduleTarget(null)} onConfirm={handleReschedule} />
      {notesTarget && (
        <AppointmentNotesModal
          open={!!notesTarget}
          patientName={notesTarget?.patient.patientProfile?.fullName || ''}
          initialNotes={notesTarget.notes || ''}
          onClose={() => setNotesTarget(null)}
          onConfirm={handleNotes}
        />
      )}
      <CreateAppointmentModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onConfirm={async () => { refetchAppointments(); setShowCreateModal(false); }} />
      <AppointmentDetailModal
        open={!!detailTarget}
        appointment={detailTarget}
        onClose={() => setDetailTarget(null)}
        onApprove={handleDetailApprove}
        onReschedule={handleDetailReschedule}
        onCancel={handleDetailCancel}
        onEditNotes={handleDetailEditNotes}
        onScheduleFollowUp={handleScheduleFollowUp}
      />
    </div>
  );
}

export default AppointmentsPage;
