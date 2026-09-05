'use client';

import React, { useState } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { registerHospitalDoctor, fetchHospitalDoctors, clearHospitalError } from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedInput } from '@/components/ui/med-input';
import { Check, X, Loader2, Image as ImageIcon, Video as VideoIcon, Trash } from 'lucide-react';

interface Form {
  fullName: string;
  phone: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  experienceYears: string;
  bio: string;
  profilePicture: File | null;
  introVideo: File | null;
}

const emptyForm: Form = {
  fullName: '',
  phone: '',
  email: '',
  specialization: '',
  licenseNumber: '',
  experienceYears: '',
  bio: '',
  profilePicture: null,
  introVideo: null,
};

export default function RegisterDoctorModal({
  open,
  onClose,
  onRegistered,
}: {
  open: boolean;
  onClose: () => void;
  onRegistered?: () => void;
}) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  if (!open) return null;

  const close = () => {
    setForm(emptyForm);
    setResult(null);
    setError('');
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) return;
    setSaving(true);
    setError('');
    dispatch(clearHospitalError());
    const fd = new FormData();
    fd.append('fullName', form.fullName.trim());
    fd.append('phone', `+251${form.phone.replace(/[^0-9]/g, '')}`);
    if (form.email) fd.append('email', form.email.trim());
    if (form.specialization) fd.append('specialization', form.specialization.trim());
    if (form.licenseNumber) fd.append('licenseNumber', form.licenseNumber.trim());
    if (form.experienceYears) fd.append('experienceYears', form.experienceYears);
    if (form.bio) fd.append('bio', form.bio);
    if (form.profilePicture) fd.append('profilePicture', form.profilePicture);
    if (form.introVideo) fd.append('introVideo', form.introVideo);
    const res = await dispatch(registerHospitalDoctor(fd));
    if (registerHospitalDoctor.fulfilled.match(res)) {
      setResult((res.payload as any)?.tempPassword ?? '');
      dispatch(fetchHospitalDoctors());
      onRegistered?.();
    } else {
      setError((res.payload as any)?.message || 'Failed to register doctor');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-5" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="bg-surface rounded-[16px] p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <MedText variant="h2" as="h3" className="text-[18px]">Register Doctor</MedText>
          <button onClick={close} className="p-1.5 text-muted hover:text-text-secondary">
            <X size={18} />
          </button>
        </div>

        {result !== null ? (
          <div className="text-center py-6">
            <Check size={36} className="text-success mx-auto mb-3" />
            <MedText variant="h2" as="h3" className="text-[16px] mb-1">Doctor registered successfully!</MedText>
            <MedText variant="body" className="text-text-secondary text-[13px] mb-3">
              Status: <strong>Pending Review</strong> — awaiting admin approval.
            </MedText>
            <div className="mb-5 text-text-secondary text-[13px]">
              Temp password: <code className="bg-foreground/5 px-2 py-0.5 rounded-[6px]">{result}</code>
            </div>
            <button onClick={close} className="px-6 py-2.5 rounded-[12px] bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-all">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && <p className="text-error text-[13px] font-semibold text-center mb-4">{error}</p>}
            <MedInput
              label="Full Name *"
              placeholder="Dr. John Doe"
              value={form.fullName}
              onChange={(e) => set({ fullName: e.target.value })}
            />
            <MedInput
              label="Phone *"
              placeholder="912 345 678"
              value={form.phone}
              maxLength={9}
              onChange={(e) => set({ phone: e.target.value.replace(/[^0-9]/g, '') })}
            />
            <MedInput
              label="Email"
              type="email"
              placeholder="doctor@hospital.com"
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
            />
            <MedInput
              label="Specialization"
              placeholder="Cardiology"
              value={form.specialization}
              onChange={(e) => set({ specialization: e.target.value })}
            />
            <MedInput
              label="License Number"
              placeholder="LIC-12345"
              value={form.licenseNumber}
              onChange={(e) => set({ licenseNumber: e.target.value })}
            />
            <MedInput
              label="Experience (years)"
              type="number"
              placeholder="5"
              value={form.experienceYears}
              onChange={(e) => set({ experienceYears: e.target.value })}
            />
            <div className="mb-5 w-full">
              <label className="block text-[12px] font-medium mb-2 ml-1 text-muted">Bio</label>
              <textarea
                rows={3}
                placeholder="Brief professional background..."
                value={form.bio}
                onChange={(e) => set({ bio: e.target.value })}
                className="w-full p-3 text-[16px] rounded-[12px] bg-surface border-[1.5px] border-border text-text placeholder:text-muted focus:outline-none focus:border-border-focus transition-colors resize-none"
              />
            </div>

            <div className="mb-5 w-full">
              <label className="block text-[12px] font-medium mb-2 ml-1 text-muted">Profile Picture</label>
              <div
                onClick={() => document.getElementById('dash-doctor-pic')?.click()}
                className="border-2 border-dashed border-border rounded-[12px] p-4 text-center cursor-pointer bg-transparent hover:border-primary transition-colors"
              >
                <input
                  id="dash-doctor-pic"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => set({ profilePicture: e.target.files?.[0] || null })}
                />
                {form.profilePicture ? (
                  <div className="flex items-center justify-center gap-3 text-[13px] text-text-secondary">
                    <ImageIcon size={20} /> {form.profilePicture.name}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); set({ profilePicture: null }); }}
                      className="text-error"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="text-muted">
                    <ImageIcon size={28} className="mx-auto mb-2 opacity-50" />
                    <p className="text-[13px]">Click to upload profile picture</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6 w-full">
              <label className="block text-[12px] font-medium mb-2 ml-1 text-muted">Intro Video</label>
              <div
                onClick={() => document.getElementById('dash-doctor-video')?.click()}
                className="border-2 border-dashed border-border rounded-[12px] p-4 text-center cursor-pointer bg-transparent hover:border-primary transition-colors"
              >
                <input
                  id="dash-doctor-video"
                  type="file"
                  accept="video/mp4,video/quicktime"
                  className="hidden"
                  onChange={(e) => set({ introVideo: e.target.files?.[0] || null })}
                />
                {form.introVideo ? (
                  <div className="flex items-center justify-center gap-3 text-[13px] text-text-secondary">
                    <VideoIcon size={20} /> {form.introVideo.name}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); set({ introVideo: null }); }}
                      className="text-error"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="text-muted">
                    <VideoIcon size={28} className="mx-auto mb-2 opacity-50" />
                    <p className="text-[13px]">Click to upload intro video</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={close}
                className="flex-1 py-3 rounded-[12px] bg-foreground/5 text-text-secondary text-[13px] font-medium hover:bg-foreground/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.fullName || !form.phone}
                className="flex-1 py-3 rounded-[12px] bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Registering...' : 'Register Doctor'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}