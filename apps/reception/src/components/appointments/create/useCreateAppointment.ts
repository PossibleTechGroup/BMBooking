import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../store';
import { fetchScheduleDoctors, fetchSchedules } from '../../../store/slices/scheduleSlice';
import { createAppointment, searchPatients, registerPatient } from '../../../store/slices/appointmentSlice';
import { showToast } from '../../Toast';

import { formatTime as utilFormatTime } from '../../../utils/ethiopianDate';

export interface PatientResult {
  id: number;
  phone: string;
  patientProfile: { fullName: string | null } | null;
}

export interface DoctorOption {
  id: number;
  fullName: string;
  specialization: string;
}

export interface SlotOption {
  id: number;
  startTime: string;
  endTime: string;
  maxPatients: number;
  _count: { bookings: number };
}

export function fmtSlotTime(iso: string) {
  return utilFormatTime(new Date(iso));
}

interface UseCreateAppointmentProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function useCreateAppointment({ open, onClose, onConfirm }: UseCreateAppointmentProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [mode, setMode] = useState<'search' | 'register'>('search');
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  // Slot picker state
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [registerForm, setRegisterForm] = useState({ phone: '', fullName: '', gender: '', dateOfBirth: '' });
  const [registerSaving, setRegisterSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await dispatch(fetchScheduleDoctors()).unwrap();
        setDoctors(res);
      } catch { /* ignore */ }
    })();
    // Reset on open
    setSlotId(null);
    setSlots([]);
  }, [open, dispatch]);

  // Fetch available slots when doctor + date are selected
  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([]);
      setSlotId(null);
      return;
    }
    (async () => {
      setLoadingSlots(true);
      try {
        const res = await dispatch(fetchSchedules({ doctorId: doctorId.toString(), date })).unwrap();
        const allSlots: SlotOption[] = (res || []).flatMap(
          (sched: any) => sched.slots || []
        );
        allSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setSlots(allSlots);
        // Clear selected slot if no longer valid
        if (slotId && !allSlots.find((s) => s.id === slotId)) {
          setSlotId(null);
        }
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, date]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (value: string) => {
    setPatientQuery(value);
    setSelectedPatient(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setPatientResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await dispatch(searchPatients(value)).unwrap();
        setPatientResults(res);
        setShowResults(true);
      } catch {
        setPatientResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const selectPatient = (p: PatientResult) => {
    setSelectedPatient(p);
    setPatientQuery('');
    setPatientResults([]);
    setShowResults(false);
  };

  const handleRegisterPatient = async (e: FormEvent) => {
    e.preventDefault();
    if (registerForm.phone.length !== 9 || !registerForm.fullName) return;
    setRegisterSaving(true);
    setError('');
    try {
      const payload = { ...registerForm, phone: `+251${registerForm.phone}` };
      const patient = await dispatch(registerPatient(payload)).unwrap();
      selectPatient({ id: patient.id, phone: patient.phone, patientProfile: patient.patientProfile });
      setMode('search');
      setRegisterForm({ phone: '', fullName: '', gender: '', dateOfBirth: '' });
    } catch (err) {
      const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to register patient';
      setError(message);
    } finally {
      setRegisterSaving(false);
    }
  };

  const selectSlot = (slot: SlotOption) => {
    setSlotId(slot.id);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !doctorId || !date || !slotId) return;
    setSaving(true);
    setError('');

    try {
      const selectedSlot = slots.find((s) => s.id === slotId);
      if (!selectedSlot) {
        setError('Please select a valid time slot.');
        setSaving(false);
        return;
      }
      const payload: Record<string, unknown> = {
        patientId: selectedPatient.id,
        doctorId,
        dateTime: selectedSlot.startTime,
        slotId,
        reason: reason || undefined,
      };
      await dispatch(createAppointment(payload)).unwrap();
      
      showToast({ 
        type: 'success', 
        message: 'Appointment created! Please go to the Schedules page to see it in the calendar.', 
        duration: 6000 
      });

      setSelectedPatient(null);
      setDoctorId('');
      setDate('');
      setReason('');
      setSlotId(null);
      setSlots([]);
      await onConfirm();
      onClose();
    } catch (err) {
      const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to create appointment';
      
      if (message && message.toLowerCase().includes('double book')) {
        showToast({ type: 'error', message: 'This doctor is already booked for this time!', duration: 5000 });
        setError('This doctor is already booked for this time!');
      } else {
        showToast({ type: 'error', message: message, duration: 5000 });
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  return {
    mode, setMode,
    patientQuery, setPatientQuery,
    patientResults, setPatientResults,
    selectedPatient, setSelectedPatient,
    searching, setSearching,
    showResults, setShowResults,
    searchRef,
    doctors, setDoctors,
    doctorId, setDoctorId,
    date, setDate,
    reason, setReason,
    slots, setSlots,
    slotId, setSlotId,
    loadingSlots, setLoadingSlots,
    saving, setSaving,
    error, setError,
    registerForm, setRegisterForm,
    registerSaving, setRegisterSaving,
    handleSearch,
    selectPatient,
    handleRegisterPatient,
    selectSlot,
    handleSubmit,
  };
}
