import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import {
  fetchDoctors,
  registerDoctor,
  updateDoctor,
  deleteDoctor,
  clearRegisterResult,
  type Doctor,
} from '../../store/slices/doctorsSlice';
import { showToast } from '../../components/Toast';

// ── Hook ──

export function useDoctorsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { doctors, loading, error, page, totalPages, total, saving, registerResult } =
    useSelector((state: RootState) => state.doctors);

  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Edit modal
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '', specialization: '', licenseNumber: '', experienceYears: '', bio: '',
  });
  const [editError, setEditError] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);

  // Register modal
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({
    fullName: '', phone: '', email: '', specialization: '',
    licenseNumber: '', experienceYears: '', bio: '',
    profilePicture: null as File | null, introVideo: null as File | null,
  });
  const [regError, setRegError] = useState('');

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    dispatch(fetchDoctors(1));
    return () => { mounted.current = false; };
  }, [dispatch]);

  const loadDoctors = (targetPage: number) => dispatch(fetchDoctors(targetPage));

  const toggleExpand = (doctor: Doctor) => {
    setExpandedId(prev => prev === doctor.id ? null : doctor.id);
  };

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
    if (editForm.experienceYears !== (editDoctor.experienceYears?.toString() || ''))
      payload.experienceYears = editForm.experienceYears ? parseInt(editForm.experienceYears) : null;
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
        fullName: '', phone: '', email: '', specialization: '',
        licenseNumber: '', experienceYears: '', bio: '',
        profilePicture: null, introVideo: null,
      });
      dispatch(fetchDoctors(page));
    } catch (err) {
      setRegError(typeof err === 'string' ? err : 'Registration failed');
    }
  };

  const clearRegResult = () => dispatch(clearRegisterResult());

  return {
    doctors, loading, error, page, totalPages, total, saving, registerResult,
    expandedId,
    editDoctor, setEditDoctor, editForm, setEditForm, editError,
    deleteTarget, setDeleteTarget,
    showRegister, setShowRegister, regForm, setRegForm, regError,
    loadDoctors, toggleExpand,
    openEdit, handleEditSubmit, handleDelete, handleRegister, clearRegResult,
  };
}
