'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  fetchHospitalDoctors,
  updateDoctorStatus,
  registerHospitalDoctor,
  clearHospitalError,
} from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedInput } from '@/components/ui/med-input';
import { Stethoscope, Check, X, Clock, Mail, Phone, Award, Plus, Loader2, Image as ImageIcon, Video as VideoIcon, Trash } from 'lucide-react';

interface RegisterForm {
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

const emptyRegister: RegisterForm = {
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

export default function HospitalDoctorsPage() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { doctors, loading, error } = useAppSelector((s) => s.hospital);

  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState<RegisterForm>(emptyRegister);
  const [registerSaving, setRegisterSaving] = useState(false);
  const [registerResult, setRegisterResult] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      dispatch(fetchHospitalDoctors());
    }
  }, [dispatch, token]);

  const pendingDoctors = doctors.filter((d) => d.status === 'PendingReview');
  const approvedDoctors = doctors.filter((d) => d.status === 'Approved');
  const rejectedDoctors = doctors.filter((d) => d.status === 'Rejected');

  const filteredDoctors =
    tab === 'pending' ? pendingDoctors : tab === 'approved' ? approvedDoctors : rejectedDoctors;

  const handleApprove = async (id: number) => {
    setActioningId(id);
    await dispatch(updateDoctorStatus({ id, status: 'Approved' }));
    dispatch(clearHospitalError());
    setActioningId(null);
  };

  const handleReject = async (id: number) => {
    setActioningId(id);
    await dispatch(updateDoctorStatus({ id, status: 'Rejected', rejectionReason: rejectReason || undefined }));
    dispatch(clearHospitalError());
    setShowRejectModal(null);
    setRejectReason('');
    setActioningId(null);
  };

  const closeRegister = () => {
    setShowRegister(false);
    setRegisterForm(emptyRegister);
    setRegisterResult(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.fullName || !registerForm.phone) return;
    setRegisterSaving(true);
    dispatch(clearHospitalError());
    const fd = new FormData();
    fd.append('fullName', registerForm.fullName.trim());
    fd.append('phone', `+251${registerForm.phone.replace(/[^0-9]/g, '')}`);
    if (registerForm.email) fd.append('email', registerForm.email.trim());
    if (registerForm.specialization) fd.append('specialization', registerForm.specialization.trim());
    if (registerForm.licenseNumber) fd.append('licenseNumber', registerForm.licenseNumber.trim());
    if (registerForm.experienceYears) fd.append('experienceYears', registerForm.experienceYears);
    if (registerForm.bio) fd.append('bio', registerForm.bio);
    if (registerForm.profilePicture) fd.append('profilePicture', registerForm.profilePicture);
    if (registerForm.introVideo) fd.append('introVideo', registerForm.introVideo);
    const res = await dispatch(registerHospitalDoctor(fd));
    if (registerHospitalDoctor.fulfilled.match(res)) {
      setRegisterResult((res.payload as any)?.tempPassword ?? '');
      dispatch(fetchHospitalDoctors());
    }
    setRegisterSaving(false);
  };

  const tabs = [
    { key: 'pending' as const, label: 'Pending', count: pendingDoctors.length },
    { key: 'approved' as const, label: 'Approved', count: approvedDoctors.length },
    { key: 'rejected' as const, label: 'Rejected', count: rejectedDoctors.length },
  ];

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <MedText variant="h2" as="h2" className="text-[20px]">Doctors</MedText>
          <MedText variant="body" className="text-text-secondary mt-1">
            View and manage doctors at your hospital.
          </MedText>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-all"
        >
          <Plus size={16} /> Add Doctor
        </button>
      </div>

      {error && (
        <p className="text-error text-[14px] font-semibold text-center mb-4 animate-in fade-in">{error}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-[12px] text-[13px] font-medium transition-all ${
              tab === t.key
                ? 'bg-primary text-white'
                : 'bg-foreground/5 text-text-secondary hover:bg-foreground/10'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 text-[11px] ${tab === t.key ? 'text-white/80' : 'text-muted'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reject Modal */}
      {showRejectModal !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-5">
          <div className="bg-surface rounded-[16px] p-5 w-full max-w-sm shadow-lg">
            <MedText variant="h2" as="h3" className="text-[16px] mb-2">Reject Doctor</MedText>
            <MedText variant="body" className="text-text-secondary text-[13px] mb-4">
              Optionally provide a reason for rejection.
            </MedText>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className="w-full border border-border rounded-[12px] px-3 py-2.5 text-[14px] bg-transparent placeholder:text-muted focus:outline-none focus:border-primary resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 rounded-[12px] bg-foreground/5 text-text-secondary text-[13px] font-medium hover:bg-foreground/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={actioningId === showRejectModal}
                className="flex-1 py-2.5 rounded-[12px] bg-error text-white text-[13px] font-medium hover:bg-error/90 transition-all"
              >
                {actioningId === showRejectModal ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Doctor Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-5">
          <div className="bg-surface rounded-[16px] p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <MedText variant="h2" as="h3" className="text-[18px]">Add Doctor</MedText>
              <button onClick={closeRegister} className="p-1.5 text-muted hover:text-text-secondary">
                <X size={18} />
              </button>
            </div>

            {registerResult !== null ? (
              <div className="text-center py-6">
                <Check size={36} className="text-success mx-auto mb-3" />
                <MedText variant="h2" as="h3" className="text-[16px] mb-1">Doctor registered successfully!</MedText>
                <MedText variant="body" className="text-text-secondary text-[13px] mb-3">
                  Status: <strong>Pending Review</strong> — awaiting admin approval.
                </MedText>
                <div className="mb-5 text-text-secondary text-[13px]">
                  Temp password: <code className="bg-foreground/5 px-2 py-0.5 rounded-[6px]">{registerResult}</code>
                </div>
                <button
                  onClick={closeRegister}
                  className="px-6 py-2.5 rounded-[12px] bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister}>
                <MedInput
                  label="Full Name *"
                  placeholder="Dr. John Doe"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                />
                <MedInput
                  label="Phone *"
                  placeholder="912 345 678"
                  value={registerForm.phone}
                  maxLength={9}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value.replace(/[^0-9]/g, '') })}
                />
                <MedInput
                  label="Email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                />
                <MedInput
                  label="Specialization"
                  placeholder="Cardiology"
                  value={registerForm.specialization}
                  onChange={(e) => setRegisterForm({ ...registerForm, specialization: e.target.value })}
                />
                <MedInput
                  label="License Number"
                  placeholder="LIC-12345"
                  value={registerForm.licenseNumber}
                  onChange={(e) => setRegisterForm({ ...registerForm, licenseNumber: e.target.value })}
                />
                <MedInput
                  label="Experience (years)"
                  type="number"
                  placeholder="5"
                  value={registerForm.experienceYears}
                  onChange={(e) => setRegisterForm({ ...registerForm, experienceYears: e.target.value })}
                />
                <div className="mb-5 w-full">
                  <label className="block text-[12px] font-medium mb-2 ml-1 text-muted">Bio</label>
                  <textarea
                    rows={3}
                    placeholder="Brief professional background..."
                    value={registerForm.bio}
                    onChange={(e) => setRegisterForm({ ...registerForm, bio: e.target.value })}
                    className="w-full p-3 text-[16px] rounded-[12px] bg-surface border-[1.5px] border-border text-text placeholder:text-muted focus:outline-none focus:border-border-focus transition-colors resize-none"
                  />
                </div>

                <div className="mb-5 w-full">
                  <label className="block text-[12px] font-medium mb-2 ml-1 text-muted">Profile Picture</label>
                  <div
                    onClick={() => document.getElementById('hosp-doctor-pic')?.click()}
                    className="border-2 border-dashed border-border rounded-[12px] p-4 text-center cursor-pointer bg-transparent hover:border-primary transition-colors"
                  >
                    <input
                      id="hosp-doctor-pic"
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => setRegisterForm({ ...registerForm, profilePicture: e.target.files?.[0] || null })}
                    />
                    {registerForm.profilePicture ? (
                      <div className="flex items-center justify-center gap-3 text-[13px] text-text-secondary">
                        <ImageIcon size={20} /> {registerForm.profilePicture.name}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setRegisterForm({ ...registerForm, profilePicture: null }); }}
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
                    onClick={() => document.getElementById('hosp-doctor-video')?.click()}
                    className="border-2 border-dashed border-border rounded-[12px] p-4 text-center cursor-pointer bg-transparent hover:border-primary transition-colors"
                  >
                    <input
                      id="hosp-doctor-video"
                      type="file"
                      accept="video/mp4,video/quicktime"
                      className="hidden"
                      onChange={(e) => setRegisterForm({ ...registerForm, introVideo: e.target.files?.[0] || null })}
                    />
                    {registerForm.introVideo ? (
                      <div className="flex items-center justify-center gap-3 text-[13px] text-text-secondary">
                        <VideoIcon size={20} /> {registerForm.introVideo.name}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setRegisterForm({ ...registerForm, introVideo: null }); }}
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
                    onClick={closeRegister}
                    className="flex-1 py-3 rounded-[12px] bg-foreground/5 text-text-secondary text-[13px] font-medium hover:bg-foreground/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registerSaving || !registerForm.fullName || !registerForm.phone}
                    className="flex-1 py-3 rounded-[12px] bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {registerSaving && <Loader2 size={16} className="animate-spin" />}
                    {registerSaving ? 'Adding...' : 'Add Doctor'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {loading && !doctors.length ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredDoctors.length === 0 ? (
        <MedCard>
          <div className="text-center py-6">
            <Stethoscope size={28} className="text-muted mx-auto mb-3" />
            <MedText variant="body" className="text-text-secondary">
              {tab === 'pending'
                ? 'No pending doctors waiting for review.'
                : tab === 'approved'
                ? 'No approved doctors yet.'
                : 'No rejected doctors.'}
            </MedText>
          </div>
        </MedCard>
      ) : (
        <div className="space-y-3">
          {filteredDoctors.map((doc) => (
            <MedCard key={doc.id}>
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <MedText variant="body" className="text-[14px] font-medium">
                    {doc.fullName || 'Unnamed Doctor'}
                  </MedText>
                  {doc.specialization && (
                    <MedText variant="metadata" className="mt-0.5 flex items-center gap-1">
                      <Award size={12} /> {doc.specialization}
                    </MedText>
                  )}
                  {doc.user?.phone && (
                    <MedText variant="metadata" className="flex items-center gap-1 mt-0.5">
                      <Phone size={12} /> {doc.user.phone}
                    </MedText>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full ${
                      doc.status === 'Approved'
                        ? 'bg-success/10 text-success'
                        : doc.status === 'PendingReview'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-error/10 text-error'
                    }`}>
                      {doc.status === 'Approved' && <Check size={12} />}
                      {doc.status === 'PendingReview' && <Clock size={12} />}
                      {doc.status === 'Rejected' && <X size={12} />}
                      {doc.status === 'PendingReview' ? 'Pending' : doc.status}
                    </span>
                    {doc._count?.appointments != null && (
                      <span className="text-[12px] text-muted">
                        {doc._count.appointments} appointment{doc._count.appointments !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {doc.rejectionReason && (
                    <MedText variant="metadata" className="text-error mt-1">
                      Reason: {doc.rejectionReason}
                    </MedText>
                  )}
                </div>

                {/* Action buttons for pending doctors */}
                {doc.status === 'PendingReview' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(doc.id)}
                      disabled={actioningId === doc.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-success/10 text-success text-[13px] font-medium hover:bg-success/20 transition-all"
                    >
                      {actioningId === doc.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-success border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectModal(doc.id)}
                      disabled={actioningId === doc.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-error/10 text-error text-[13px] font-medium hover:bg-error/20 transition-all"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </MedCard>
          ))}
        </div>
      )}
    </div>
  );
}
