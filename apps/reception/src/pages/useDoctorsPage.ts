import { useState, useEffect, useRef, useMemo, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { 
  fetchDoctors, 
  registerDoctor, 
  updateDoctor, 
  deleteDoctor, 
  clearRegisterResult, 
  type Doctor 
} from '../store/slices/doctorsSlice';
import { fetchSchedules } from '../store/slices/scheduleSlice';
import { showToast } from '../components/Toast';
import { formatTime, formatDate } from '../utils/ethiopianDate';

export interface DoctorUser {
  id: number;
  phone: string;
  email: string | null;
}

export interface ScheduleSlot {
  id: number;
  startTime: string;
  endTime: string;
  maxPatients: number;
  _count: { bookings: number };
}

export interface Schedule {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  slots: ScheduleSlot[];
}

export function fmtTime(iso: string) {
  if (!iso) return '';
  return formatTime(new Date(iso));
}

export function fmtDate(iso: string) {
  if (!iso) return '';
  return formatDate(new Date(iso), 'weekday-short');
}

export function getWeekDays(refDate: Date) {
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

export { formatWeekRange } from '../utils/ethiopianDate';

export function isToday(d: Date) {
  return d.toDateString() === new Date().toDateString();
}

export function useDoctorsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { doctors, loading, error, page, totalPages, total, saving, registerResult } = useSelector((state: RootState) => state.doctors);
  const { schedules: allSchedules } = useSelector((state: RootState) => state.schedules);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [doctorSchedules, setDoctorSchedules] = useState<Record<number, any[]>>({});
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Edit modal
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', specialization: '', licenseNumber: '', experienceYears: '', bio: '' });
  const [editError, setEditError] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);

  // Register modal
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ 
    fullName: '', 
    phone: '', 
    email: '', 
    specialization: '', 
    licenseNumber: '', 
    experienceYears: '', 
    bio: '', 
    profilePicture: null as File | null, 
    introVideo: null as File | null 
  });
  const [regError, setRegError] = useState('');

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    dispatch(fetchDoctors(1));
    return () => { mounted.current = false; };
  }, [dispatch]);

  const loadSchedules = (doctorId: number, from: string, to: string) => {
    dispatch(fetchSchedules({ doctorId: String(doctorId), from, to }));
  };

  const loadDoctors = (targetPage: number) => {
    dispatch(fetchDoctors(targetPage));
  };

  // Merge Redux schedules into per-doctor map when schedules update
  useEffect(() => {
    if (expandedId && allSchedules.length >= 0) {
      setDoctorSchedules(prev => ({ 
        ...prev, 
        [expandedId]: allSchedules.filter(s => s.doctorId === expandedId) 
      }));
    }
  }, [allSchedules, expandedId]);

  const toggleExpand = (doctor: Doctor) => {
    if (expandedId === doctor.id) {
      setExpandedId(null);
    } else {
      setExpandedId(doctor.id);
      const wd = getWeekDays(calendarDate);
      loadSchedules(doctor.id, wd[0].toISOString().slice(0, 10), wd[6].toISOString().slice(0, 10));
    }
  };

  const weekDays = useMemo(() => getWeekDays(calendarDate), [calendarDate]);

  const reloadCurrentSchedules = useRef(false);
  useEffect(() => {
    if (expandedId && reloadCurrentSchedules.current) {
      const wd = getWeekDays(calendarDate);
      loadSchedules(expandedId, wd[0].toISOString().slice(0, 10), wd[6].toISOString().slice(0, 10));
    }
    reloadCurrentSchedules.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarDate]);

  const openEdit = (doctor: Doctor) => {
    setEditDoctor(doctor);
    setEditForm({
      fullName: doctor.fullName,
      specialization: doctor.specialization || '',
      licenseNumber: doctor.licenseNumber || '',
      experienceYears: doctor.experienceYears?.toString() || '',
      bio: doctor.bio || '',
    });
    setEditError('');
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editDoctor) return;
    setEditError('');
    const payload: Record<string, unknown> = {};
    if (editForm.fullName !== editDoctor.fullName) payload.fullName = editForm.fullName;
    if (editForm.specialization !== (editDoctor.specialization || '')) payload.specialization = editForm.specialization || null;
    if (editForm.licenseNumber !== (editDoctor.licenseNumber || '')) payload.licenseNumber = editForm.licenseNumber || null;
    if (editForm.experienceYears !== (editDoctor.experienceYears?.toString() || '')) payload.experienceYears = editForm.experienceYears ? parseInt(editForm.experienceYears) : null;
    if (editForm.bio !== (editDoctor.bio || '')) payload.bio = editForm.bio || null;
    if (Object.keys(payload).length === 0) { setEditDoctor(null); return; }
    try {
      await dispatch(updateDoctor({ id: editDoctor.id, payload })).unwrap();
      dispatch(fetchDoctors(page));
      setEditDoctor(null);
      showToast({ type: 'success', message: 'Doctor updated successfully.' });
    } catch (err) {
      setEditError(typeof err === 'string' ? err : 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteDoctor(deleteTarget.id)).unwrap();
      setDeleteTarget(null);
      showToast({ type: 'success', message: 'Doctor removed from hospital.' });
    } catch (err) {
      showToast({ type: 'error', message: typeof err === 'string' ? err : 'Delete failed' });
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.phone) return;
    setRegError('');
    const fd = new FormData();
    fd.append('fullName', regForm.fullName);
    fd.append('phone', `+251${regForm.phone}`);
    if (regForm.email) fd.append('email', regForm.email);
    if (regForm.specialization) fd.append('specialization', regForm.specialization);
    if (regForm.licenseNumber) fd.append('licenseNumber', regForm.licenseNumber);
    if (regForm.experienceYears) fd.append('experienceYears', regForm.experienceYears);
    if (regForm.bio) fd.append('bio', regForm.bio);
    if (regForm.profilePicture) fd.append('profilePicture', regForm.profilePicture);
    if (regForm.introVideo) fd.append('introVideo', regForm.introVideo);
    try {
      await dispatch(registerDoctor(fd)).unwrap();
      setRegForm({ 
        fullName: '', 
        phone: '', 
        email: '', 
        specialization: '', 
        licenseNumber: '', 
        experienceYears: '', 
        bio: '', 
        profilePicture: null, 
        introVideo: null 
      });
      dispatch(fetchDoctors(page));
    } catch (err) {
      setRegError(typeof err === 'string' ? err : 'Registration failed');
    }
  };

  const handleClearRegisterResult = () => {
    dispatch(clearRegisterResult());
  };

  return {
    doctors,
    loading,
    error,
    page,
    totalPages,
    total,
    saving,
    registerResult,
    expandedId,
    setExpandedId,
    doctorSchedules,
    calendarDate,
    setCalendarDate,
    editDoctor,
    setEditDoctor,
    editForm,
    setEditForm,
    editError,
    deleteTarget,
    setDeleteTarget,
    showRegister,
    setShowRegister,
    regForm,
    setRegForm,
    regError,
    loadDoctors,
    toggleExpand,
    weekDays,
    openEdit,
    handleEditSubmit,
    handleDelete,
    handleRegister,
    handleClearRegisterResult
  };
}
