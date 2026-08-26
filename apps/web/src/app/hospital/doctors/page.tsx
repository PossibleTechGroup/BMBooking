'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  fetchHospitalDoctors,
  updateDoctorStatus,
  clearHospitalError,
} from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { Stethoscope, Check, X, Clock, Mail, Phone, Award } from 'lucide-react';

export default function HospitalDoctorsPage() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { doctors, loading, error } = useAppSelector((s) => s.hospital);

  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);

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

  const tabs = [
    { key: 'pending' as const, label: 'Pending', count: pendingDoctors.length },
    { key: 'approved' as const, label: 'Approved', count: approvedDoctors.length },
    { key: 'rejected' as const, label: 'Rejected', count: rejectedDoctors.length },
  ];

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="mb-6">
        <MedText variant="h2" as="h2" className="text-[20px]">Doctors</MedText>
        <MedText variant="body" className="text-text-secondary mt-1">
          View and manage doctors at your hospital.
        </MedText>
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
