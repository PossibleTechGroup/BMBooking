'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logout, submitDoctorProfile, fetchDoctorProfileStatus } from '@/lib/store/slices/authSlice';
import { fetchHospitals } from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedInput, MedTextarea } from '@/components/ui/med-input';
import { MedButton } from '@/components/ui/med-button';
import { MedCard } from '@/components/ui/med-card';
import {
  X, AlertCircle, Image as ImageIcon, Video, Plus, Trash2, LogOut, ChevronRight, MapPin, Repeat, Calendar, Clock,
} from 'lucide-react';
import {
  ScheduleEntry, DAYS, DAYS_SHORT, SLOT_DURATIONS, generateId, hasOverlap,
  formatDisplayTime, formatDateDisplay, getDayColor,
} from '@/lib/utils/schedule';

const MEDICAL_SPECIALIZATIONS = [
  "Allergy and Immunology", "Anesthesiology", "Cardiology", "Cardiothoracic Surgery",
  "Child and Adolescent Psychiatry", "Clinical Neurophysiology", "Colon and Rectal Surgery",
  "Critical Care Medicine", "Dermatology", "Diagnostic Radiology", "Emergency Medicine",
  "Endocrinology, Diabetes and Metabolism", "Family Medicine", "Gastroenterology",
  "General Surgery", "Geriatric Medicine", "Gynecologic Oncology", "Hematology",
  "Hospice and Palliative Medicine", "Infectious Disease", "Internal Medicine",
  "Medical Genetics", "Medical Oncology", "Neonatal-Perinatal Medicine", "Nephrology",
  "Neurological Surgery", "Neurology", "Neuroradiology", "Nuclear Medicine",
  "Obstetrics and Gynecology", "Occupational Medicine", "Ophthalmology",
  "Orthopaedic Surgery", "Otolaryngology (ENT)", "Pain Medicine", "Pathology",
  "Pediatric Cardiology", "Pediatric Surgery", "Pediatrics",
  "Physical Medicine and Rehabilitation", "Plastic Surgery", "Preventive Medicine",
  "Psychiatry", "Pulmonary Disease", "Radiation Oncology",
  "Reproductive Endocrinology and Infertility", "Rheumatology", "Sleep Medicine",
  "Sports Medicine", "Thoracic Surgery", "Urology", "Vascular Surgery",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

type Step = 1 | 2 | 3;

export default function DoctorSetupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token, loading, error, doctorProfileStatus, rejectionReason } = useAppSelector((s) => s.auth);
  const { hospitals } = useAppSelector((s) => s.hospital);

  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [fullName, setFullName] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | ''>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [specModalOpen, setSpecModalOpen] = useState(false);

  // Step 2
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [introVideo, setIntroVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Step 3
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [schedModalOpen, setSchedModalOpen] = useState(false);
  const [editingSched, setEditingSched] = useState<ScheduleEntry | null>(null);
  const [schedIsRecurring, setSchedIsRecurring] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday']);
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedStart, setSchedStart] = useState('09:00');
  const [schedEnd, setSchedEnd] = useState('17:00');
  const [schedSlotDuration, setSchedSlotDuration] = useState(30);
  const [schedHospitalId, setSchedHospitalId] = useState<number | ''>('');
  const [schedErrors, setSchedErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) dispatch(fetchDoctorProfileStatus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    dispatch(fetchHospitals());
  }, [dispatch]);

  useEffect(() => {
    if (doctorProfileStatus === 'Approved') router.push('/doctor');
    else if (doctorProfileStatus === 'PendingReview') router.push('/doctor/pending');
  }, [doctorProfileStatus, router]);

  useEffect(() => {
    if (!token && typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_token');
      if (!stored) router.push('/login');
    }
  }, [token, router]);

  const selectedHospitalName = useMemo(() => {
    const h = hospitals.find((x) => x.id === schedHospitalId);
    return h ? h.name : null;
  }, [hospitals, schedHospitalId]);

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (specializations.length === 0) errors.specializations = 'Select at least one specialization';
    if (!experience.trim()) {
      errors.experience = 'Years of experience is required';
    } else {
      const expNum = Number(experience);
      if (isNaN(expNum) || expNum < 0 || expNum > 60) {
        errors.experience = 'Experience must be between 0 and 60 years';
      }
    }
    if (!licenseNumber.trim()) errors.licenseNumber = 'License number is required';
    if (bio.trim().length < 10) errors.bio = 'Bio must be at least 10 characters';
    else if (bio.trim().length > 1000) errors.bio = 'Bio must be less than 1000 characters';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!profileImage) errors.profileImage = 'A profile photo is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const toggleSpecialization = (item: string) => {
    setSpecializations((prev) => {
      if (prev.includes(item)) return prev.filter((s) => s !== item);
      if (prev.length >= 2) return prev;
      return [...prev, item];
    });
    setFieldErrors((prev) => { const n = { ...prev }; delete n.specializations; return n; });
  };

  const handlePickImage = (file: File | undefined) => {
    setFileSizeError(null);
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      setFileSizeError(`Image must not be greater than 10MB`);
      return;
    }
    setProfileImage(file);
    setProfilePreview(URL.createObjectURL(file));
    setFieldErrors((prev) => { const n = { ...prev }; delete n.profileImage; return n; });
  };

  const handlePickVideo = (file: File | undefined) => {
    setFileSizeError(null);
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE) {
      setFileSizeError(`Video must not be greater than 50MB`);
      return;
    }
    setIntroVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const openAddSchedule = () => {
    setEditingSched(null);
    setSchedIsRecurring(true);
    setSelectedDays(['Monday']);
    setSchedDate(new Date().toISOString().split('T')[0]);
    setSchedStart('09:00');
    setSchedEnd('17:00');
    setSchedSlotDuration(30);
    setSchedHospitalId('');
    setSchedErrors({});
    setSchedModalOpen(true);
  };

  const openEditSchedule = (entry: ScheduleEntry) => {
    setEditingSched(entry);
    setSchedIsRecurring(entry.isRecurring);
    setSelectedDays(entry.isRecurring ? [entry.day || 'Monday'] : []);
    setSchedDate(entry.date || new Date().toISOString().split('T')[0]);
    setSchedStart(entry.startTime);
    setSchedEnd(entry.endTime);
    setSchedSlotDuration(entry.slotDuration || 30);
    setSchedHospitalId(entry.hospitalId ?? '');
    setSchedErrors({});
    setSchedModalOpen(true);
  };

  const validateScheduleForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const startMin = Number(schedStart.split(':')[0]) * 60 + Number(schedStart.split(':')[1]);
    const endMin = Number(schedEnd.split(':')[0]) * 60 + Number(schedEnd.split(':')[1]);
    if (endMin <= startMin) errors.endTime = 'End time must be after start time';
    if (schedIsRecurring && selectedDays.length === 0) errors.days = 'Select at least one day';
    if (!schedIsRecurring && !schedDate) errors.date = 'Select a date';

    const others = editingSched ? schedules.filter((s) => s.id !== editingSched.id) : schedules;
    if (schedIsRecurring) {
      for (const day of selectedDays) {
        const temp: ScheduleEntry = {
          id: editingSched?.id || 'temp', isRecurring: true, day, startTime: schedStart, endTime: schedEnd,
          hospitalId: schedHospitalId === '' ? null : Number(schedHospitalId), hospitalName: selectedHospitalName,
        };
        if (hasOverlap([...others, temp])) { errors.overlap = `Schedule overlaps with another slot (${day})`; break; }
      }
    } else {
      const temp: ScheduleEntry = {
        id: editingSched?.id || 'temp', isRecurring: false, date: schedDate, startTime: schedStart, endTime: schedEnd,
        hospitalId: schedHospitalId === '' ? null : Number(schedHospitalId), hospitalName: selectedHospitalName,
      };
      if (hasOverlap([...others, temp])) errors.overlap = 'Schedule overlaps with another slot';
    }
    return errors;
  };

  const handleSaveSchedule = () => {
    const errors = validateScheduleForm();
    setSchedErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const entries: ScheduleEntry[] = [];
    if (schedIsRecurring) {
      selectedDays.forEach((day, index) => {
        entries.push({
          id: index === 0 && editingSched ? editingSched.id : generateId(),
          isRecurring: true, day, startTime: schedStart, endTime: schedEnd,
          hospitalId: schedHospitalId === '' ? null : Number(schedHospitalId),
          hospitalName: schedHospitalId === '' ? null : selectedHospitalName,
          slotDuration: schedSlotDuration,
        });
      });
    } else {
      entries.push({
        id: editingSched?.id || generateId(),
        isRecurring: false, date: schedDate, startTime: schedStart, endTime: schedEnd,
        hospitalId: schedHospitalId === '' ? null : Number(schedHospitalId),
        hospitalName: schedHospitalId === '' ? null : selectedHospitalName,
        slotDuration: schedSlotDuration,
      });
    }

    if (editingSched) {
      setSchedules((prev) => prev.map((s) => (s.id === editingSched.id ? entries[0] : s)));
    } else {
      setSchedules((prev) => [...prev, ...entries]);
    }
    setSchedModalOpen(false);
  };

  const handleRemoveSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('specialization', specializations[0] || '');
    formData.append('specializations', JSON.stringify(specializations));
    formData.append('experienceYears', experience);
    formData.append('bio', bio);
    formData.append('licenseNumber', licenseNumber);
    if (selectedHospitalId) formData.append('hospitalId', String(selectedHospitalId));
    if (schedules.length > 0) formData.append('availability', JSON.stringify(schedules));
    if (profileImage) formData.append('profilePicture', profileImage);
    if (introVideo) formData.append('introVideo', introVideo);
    const result = await dispatch(submitDoctorProfile(formData));
    if (submitDoctorProfile.fulfilled.match(result)) {
      router.push('/doctor/pending');
    }
  };

  const handleLogout = () => { dispatch(logout()); router.push('/login'); };

  const displayError = error ? (error.startsWith('Upload Error:') ? error.replace(/^Upload Error:\s*/, '') : error) : null;
  const totalSteps = 3;
  const stepProgress = step / totalSteps;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
        <div className="flex items-center gap-2.5">
          <Image src="/bm-booking-logo.png" alt="BM" width={36} height={36} className="w-9 h-9 rounded-[10px] object-cover" />
          <div>
            <h1 className="text-[16px] font-bold text-primary leading-tight">BM</h1>
            <p className="text-[10px] text-muted leading-tight">Doctor Onboarding</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium text-error hover:bg-error-bg transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-6 py-6">
        {/* Heading + progress */}
        <div className="mb-6">
          <MedText variant="h1" as="h2" className="text-[22px]">
            {step === 1 ? 'Professional Details' : step === 2 ? 'Identity & Media' : 'Availability & Schedule'}
          </MedText>
          <MedText variant="metadata">Step {step} of {totalSteps}</MedText>
          <div className="h-1 rounded-full bg-foreground/10 mt-3 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${stepProgress * 100}%` }} />
          </div>
        </div>

        {rejectionReason && step === 1 && (
          <div className="mb-6 px-4 py-3.5 rounded-[12px] bg-[#FCEBEB] border border-[#FEE4E2] flex items-start gap-3 animate-in fade-in">
            <AlertCircle size={22} className="text-[#D92D20] shrink-0 mt-0.5" />
            <div>
              <MedText variant="metadata" className="text-[#D92D20] font-bold">Correction Required</MedText>
              <MedText variant="metadata" className="text-[#D92D20]">{rejectionReason}</MedText>
            </div>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <MedInput
              label="Full Name"
              placeholder="Dr. Abebe Kebede"
              value={fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value, setFullName)}
              error={!!fieldErrors.fullName}
              errorText={fieldErrors.fullName}
            />

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className={`text-[12px] font-medium ${fieldErrors.specializations ? 'text-error' : 'text-muted'}`}>
                  Specialization <span className="text-muted/70">(select up to 2)</span>
                </label>
                <button onClick={() => setSpecModalOpen(true)} className="flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline">
                  Select <ChevronRight size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-[12px] bg-surface border-[1.5px] border-border">
                {specializations.length === 0 ? (
                  <span className="text-[14px] text-muted">No specializations selected</span>
                ) : (
                  specializations.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-[12px] font-medium text-primary">
                      {s}
                      <button onClick={() => toggleSpecialization(s)} className="hover:text-error transition-colors"><X size={12} /></button>
                    </span>
                  ))
                )}
              </div>
              {fieldErrors.specializations && <p className="text-error text-[12px] mt-1.5 ml-1">{fieldErrors.specializations}</p>}
            </div>

            <MedInput
              label="Years of Experience"
              placeholder="e.g. 5"
              type="number"
              inputMode="numeric"
              value={experience}
              onChange={(e) => handleInputChange('experience', e.target.value.replace(/[^0-9]/g, ''), setExperience)}
              error={!!fieldErrors.experience}
              errorText={fieldErrors.experience}
            />

            <MedInput
              label="License Number"
              placeholder="e.g. 012345"
              value={licenseNumber}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value, setLicenseNumber)}
              error={!!fieldErrors.licenseNumber}
              errorText={fieldErrors.licenseNumber}
            />

            <MedTextarea
              label="Professional Bio"
              placeholder="Tell patients about your experience, approach, and areas of focus…"
              value={bio}
              onChange={(e) => handleInputChange('bio', e.target.value, setBio)}
              error={!!fieldErrors.bio}
              errorText={fieldErrors.bio}
            />

            <div className="mb-5">
              <label className="text-[12px] font-medium text-muted ml-1 mb-2 block">Hospital / Clinic</label>
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-[48px] px-4 rounded-[12px] bg-surface border-[1.5px] border-border text-[14px] text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Select a hospital (optional)</option>
                {hospitals.map((h: any) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-2">
            <MedText variant="body" className="mb-4">Provide a professional photo so patients can recognize you.</MedText>

            <div className="mb-5">
              <label className="block text-[12px] font-medium mb-2 ml-1 text-muted">Profile Photo</label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePickImage(e.target.files?.[0])}
              />
              {profilePreview ? (
                <div className="relative w-28 h-28 rounded-[16px] overflow-hidden border border-border">
                  <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setProfileImage(null); setProfilePreview(null); }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className={`w-full h-28 rounded-[14px] border-[1.5px] border-dashed flex flex-col items-center justify-center gap-2 text-[13px] transition-colors ${
                    fieldErrors.profileImage ? 'border-error text-error' : 'border-border text-muted hover:border-primary hover:text-primary'
                  }`}
                >
                  <ImageIcon size={22} />
                  Upload profile photo
                </button>
              )}
              {fieldErrors.profileImage && <p className="text-error text-[12px] mt-1.5 ml-1">{fieldErrors.profileImage}</p>}
            </div>

            <div className="mb-5">
              <label className="block text-[12px] font-medium mb-2 ml-1 text-muted">Intro Video <span className="text-muted/70">(optional)</span></label>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handlePickVideo(e.target.files?.[0])}
              />
              {videoPreview ? (
                <div className="flex items-center gap-3 p-3 rounded-[12px] border border-border bg-surface">
                  <video src={videoPreview} className="w-20 h-14 rounded-[8px] object-cover bg-black" controls />
                  <div className="flex-1 min-w-0">
                    <MedText variant="body" className="text-[13px] font-medium truncate">{introVideo?.name}</MedText>
                    <MedText variant="metadata">{((introVideo?.size || 0) / 1024 / 1024).toFixed(1)} MB</MedText>
                  </div>
                  <button onClick={() => { setIntroVideo(null); setVideoPreview(null); }} className="p-2 text-error hover:bg-error-bg rounded-[8px]">
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full h-16 rounded-[12px] border-[1.5px] border-dashed border-border text-muted hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-[13px] transition-colors"
                >
                  <Video size={18} /> Upload intro video
                </button>
              )}
            </div>

            {fileSizeError && <p className="text-error text-[12px] mb-3 ml-1">{fileSizeError}</p>}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-2">
            <MedText variant="body" className="mb-4">Add the days and times you&apos;re available to see patients.</MedText>

            {schedules.length === 0 ? (
              <button
                onClick={openAddSchedule}
                className="w-full py-10 rounded-[14px] border-[1.5px] border-dashed border-border text-muted hover:border-primary hover:text-primary flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Plus size={26} />
                <MedText variant="body" className="text-[14px] font-medium">Add your first time slot</MedText>
              </button>
            ) : (
              <div className="space-y-2.5 mb-4">
                {schedules.map((s) => (
                  <MedCard key={s.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {s.isRecurring ? (
                          <span className="p-2 rounded-[10px]" style={{ backgroundColor: `${getDayColor(s.day || 'Monday')}18`, color: getDayColor(s.day || 'Monday') }}>
                            <Repeat size={16} />
                          </span>
                        ) : (
                          <span className="p-2 rounded-[10px] bg-secondary/10 text-secondary">
                            <Calendar size={16} />
                          </span>
                        )}
                        <div className="min-w-0">
                          <MedText variant="body" className="text-[14px] font-semibold capitalize">
                            {s.isRecurring ? s.day : (s.date ? formatDateDisplay(new Date(`${s.date}T00:00:00`)) : '')}
                          </MedText>
                          <div className="flex items-center gap-1 text-[12px] text-muted">
                            <Clock size={12} />
                            {formatDisplayTime(s.startTime)} – {formatDisplayTime(s.endTime)}
                          </div>
                          <div className="flex items-center gap-1 text-[12px] text-muted mt-0.5">
                            <MapPin size={12} />
                            {s.hospitalName || 'Private Practice'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditSchedule(s)} className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium text-primary hover:bg-primary/10">Edit</button>
                        <button onClick={() => handleRemoveSchedule(s.id)} className="p-2 text-error hover:bg-error-bg rounded-[8px]"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </MedCard>
                ))}
              </div>
            )}

            {schedules.length > 0 && (
              <button onClick={openAddSchedule} className="flex items-center gap-2 text-[14px] font-semibold text-primary hover:underline">
                <Plus size={16} /> Add another time slot
              </button>
            )}
          </div>
        )}

        {displayError && (
          <div className="mt-4 px-4 py-3 rounded-[12px] bg-[#FCEBEB] border border-[#FEE4E2] flex items-start gap-2 animate-in fade-in">
            <AlertCircle size={18} className="text-[#D92D20] shrink-0 mt-0.5" />
            <p className="text-[13px] font-medium text-[#D92D20]">{displayError}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="sticky bottom-0 border-t border-border bg-surface px-6 py-4">
        <div className="max-w-2xl w-full mx-auto flex gap-3">
          {(step === 2 || step === 3) && (
            <MedButton
              title="Back"
              onPress={() => { setStep(step === 2 ? 1 : 2); }}
              type="outline"
              className="flex-1"
            />
          )}
          <MedButton
            title={step === 1 ? 'Next' : step === 2 ? 'Next' : 'Submit Profile'}
            onPress={() => {
              if (step === 1) { if (validateStep1()) setStep(2); }
              else if (step === 2) { if (validateStep2()) setStep(3); }
              else handleSubmit();
            }}
            loading={loading}
            className="flex-[2]"
          />
        </div>
        <p className="text-center text-[11px] text-muted mt-3">
          By continuing you agree to our Terms of Service and Privacy Policy. Your consultation fee as a new doctor is set to 50 Birr.
        </p>
      </footer>

      {/* Specialization Modal */}
      {specModalOpen && (
        <SpecializationModal
          specializations={specializations}
          onToggle={toggleSpecialization}
          onClose={() => setSpecModalOpen(false)}
        />
      )}

      {/* Schedule Modal */}
      {schedModalOpen && (
        <ScheduleModal
          hospitals={hospitals.map((h) => ({ id: h.id, name: h.name }))}
          isRecurring={schedIsRecurring}
          selectedDays={selectedDays}
          date={schedDate}
          startTime={schedStart}
          endTime={schedEnd}
          slotDuration={schedSlotDuration}
          hospitalId={schedHospitalId}
          errors={schedErrors}
          editing={editingSched}
          setSchedIsRecurring={setSchedIsRecurring}
          setSelectedDays={setSelectedDays}
          setDate={setSchedDate}
          setStartTime={setSchedStart}
          setEndTime={setSchedEnd}
          setSlotDuration={setSchedSlotDuration}
          setHospitalId={setSchedHospitalId}
          setErrors={setSchedErrors}
          onSave={handleSaveSchedule}
          onClose={() => setSchedModalOpen(false)}
        />
      )}
    </div>
  );
}

function SpecializationModal({ specializations, onToggle, onClose }: {
  specializations: string[];
  onToggle: (item: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MEDICAL_SPECIALIZATIONS;
    return MEDICAL_SPECIALIZATIONS.filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-surface rounded-t-[20px] sm:rounded-[20px] w-full max-w-md p-5 max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <MedText variant="h2" as="h3">Specialization</MedText>
          <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-[8px]"><X size={20} /></button>
        </div>

        {specializations.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {specializations.map((s) => (
              <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-[12px] font-medium text-primary">
                {s}
                <button onClick={() => onToggle(s)}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-11 px-4 rounded-[10px] bg-background border border-border flex items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search specializations"
              className="flex-1 bg-transparent outline-none text-[14px]"
            />
          </div>
          <span className="text-[12px] font-medium text-muted shrink-0">{specializations.length}/2</span>
        </div>

        <div className="overflow-y-auto max-h-[50vh] pr-1">
          {filtered.length === 0 ? (
            <p className="text-center text-muted py-8">No specializations found</p>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((s) => {
                const isSelected = specializations.includes(s);
                const isMaxed = !isSelected && specializations.length >= 2;
                return (
                  <button
                    key={s}
                    disabled={isMaxed}
                    onClick={() => onToggle(s)}
                    className={`w-full text-left px-4 py-3 rounded-[10px] border text-[14px] font-medium transition-colors ${
                      isSelected ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border hover:bg-foreground/5'
                    } ${isMaxed ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScheduleModal({
  hospitals, isRecurring, selectedDays, date, startTime, endTime, slotDuration, hospitalId, errors, editing,
  setSchedIsRecurring, setSelectedDays, setDate, setStartTime, setEndTime, setSlotDuration, setHospitalId, setErrors,
  onSave, onClose,
}: {
  hospitals: { id: number; name: string }[];
  isRecurring: boolean;
  selectedDays: string[];
  date: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  hospitalId: number | '';
  errors: Record<string, string>;
  editing: ScheduleEntry | null;
  setSchedIsRecurring: (v: boolean) => void;
  setSelectedDays: (v: string[] | ((prev: string[]) => string[])) => void;
  setDate: (v: string) => void;
  setStartTime: (v: string) => void;
  setEndTime: (v: string) => void;
  setSlotDuration: (v: number) => void;
  setHospitalId: (v: number | '') => void;
  setErrors: (v: Record<string, string>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const toggleDay = (day: string) => {
    if (editing) {
      setSelectedDays([day]);
    } else {
      setSelectedDays((prev) => {
        const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
        return next.length > 0 ? next : prev;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-surface rounded-t-[20px] sm:rounded-[20px] w-full max-w-md p-5 max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <MedText variant="h2" as="h3">{editing ? 'Edit' : 'New'} Time Slot</MedText>
          <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-[8px]"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto max-h-[calc(88vh-140px)] pr-1">
          <label className="text-[11px] font-bold text-text mb-2 block ml-1">TYPE</label>
          <div className="flex p-1 rounded-[10px] bg-background border border-border mb-5">
            <button
              onClick={() => { setSchedIsRecurring(true); setErrors({}); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-[13px] font-bold transition-colors ${isRecurring ? 'bg-primary text-white' : 'text-text-secondary'}`}
            >
              <Repeat size={15} /> Weekly
            </button>
            <button
              onClick={() => { setSchedIsRecurring(false); setErrors({}); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-[13px] font-bold transition-colors ${!isRecurring ? 'bg-primary text-white' : 'text-text-secondary'}`}
            >
              <Calendar size={15} /> One-time
            </button>
          </div>

          {isRecurring ? (
            <div className="mb-5">
              <label className="text-[11px] font-bold text-text mb-2 block ml-1">DAYS OF WEEK</label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map((day, i) => {
                  const active = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      title={day}
                      className={`h-10 rounded-[8px] text-[12px] font-semibold transition-colors ${active ? 'bg-primary text-white' : 'bg-background border border-border text-text-secondary hover:border-primary'}`}
                    >
                      {DAYS_SHORT[i]}
                    </button>
                  );
                })}
              </div>
              {errors.days && <p className="text-error text-[12px] mt-1.5 ml-1">{errors.days}</p>}
            </div>
          ) : (
            <div className="mb-5">
              <label className="text-[11px] font-bold text-text mb-2 block ml-1">DATE</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => { setDate(e.target.value); setErrors({}); }}
                className="w-full h-12 px-4 text-[15px] rounded-[10px] bg-surface border-[1.5px] border-border focus:outline-none focus:border-border-focus"
              />
              {errors.date && <p className="text-error text-[12px] mt-1.5 ml-1">{errors.date}</p>}
            </div>
          )}

          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-text mb-2 block ml-1">START</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); setErrors({}); }}
                className="w-full h-12 px-3 text-[15px] rounded-[10px] bg-surface border-[1.5px] border-border focus:outline-none focus:border-border-focus"
              />
            </div>
            <div className="flex-1">
              <label className={`text-[11px] font-bold mb-2 block ml-1 ${errors.endTime ? 'text-error' : 'text-text'}`}>END</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); setErrors({}); }}
                className={`w-full h-12 px-3 text-[15px] rounded-[10px] bg-surface border-[1.5px] focus:outline-none focus:border-border-focus ${errors.endTime ? 'border-error' : 'border-border'}`}
              />
              {errors.endTime && <p className="text-error text-[12px] mt-1.5 ml-1">{errors.endTime}</p>}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-[11px] font-bold text-text mb-2 block ml-1">SLOT DURATION</label>
            <div className="flex gap-2">
              {SLOT_DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setSlotDuration(d)}
                  className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold transition-colors ${slotDuration === d ? 'bg-primary text-white' : 'bg-background border border-border text-text-secondary'}`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <label className="text-[11px] font-bold text-text mb-2 block ml-1">HOSPITAL</label>
            <select
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full h-12 px-4 text-[15px] rounded-[10px] bg-surface border-[1.5px] border-border focus:outline-none focus:border-border-focus"
            >
              <option value="">Private Practice (No Hospital)</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          {errors.overlap && <p className="text-error text-[12px] mb-3 ml-1">{errors.overlap}</p>}
        </div>

        <div className="mt-4">
          <MedButton title="Save" onPress={onSave} />
        </div>
      </div>
    </div>
  );
}
