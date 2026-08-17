'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  fetchHospitalReceptionists,
  createReceptionist,
  updateReceptionist,
  deleteReceptionist,
  clearHospitalError,
} from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { MedInput } from '@/components/ui/med-input';
import { Users, Plus, Pencil, Trash2, X } from 'lucide-react';

interface FormState {
  username: string;
  phone: string;
  email: string;
  password: string;
}

const emptyForm: FormState = { username: '', phone: '', email: '', password: '' };

export default function HospitalReceptionistsPage() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { receptionists, loading, error } = useAppSelector((s) => s.hospital);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      dispatch(fetchHospitalReceptionists());
    }
  }, [dispatch, token]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const isPhoneValid = !form.phone || /^[79]\d{8}$/.test(form.phone);
  const isEmailValid = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canSubmit =
    form.username.trim().length > 0 &&
    (editingId !== null ? form.password.length === 0 || form.password.length >= 8 : form.password.length >= 8) &&
    isPhoneValid &&
    isEmailValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    dispatch(clearHospitalError());
    setSubmitting(true);
    const payload = {
      username: form.username.trim(),
      phone: form.phone ? `+251${form.phone}` : undefined,
      email: form.email.trim() || undefined,
      ...(form.password ? { password: form.password } : {}),
    };
    if (editingId !== null) {
      await dispatch(updateReceptionist({ id: editingId, data: payload }));
    } else {
      await dispatch(createReceptionist(payload as { username: string; phone?: string; email?: string; password: string }));
    }
    setSubmitting(false);
    resetForm();
    dispatch(fetchHospitalReceptionists());
  };

  const handleDelete = async (id: number) => {
    dispatch(clearHospitalError());
    setDeletingId(id);
    await dispatch(deleteReceptionist(id));
    setDeletingId(null);
  };

  const startEdit = (r: (typeof receptionists)[number]) => {
    setEditingId(r.id);
    setForm({
      username: r.user.username || '',
      phone: r.user.phone ? r.user.phone.replace(/^\+251/, '') : '',
      email: r.user.email || '',
      password: '',
    });
    setShowForm(true);
  };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <MedText variant="h2" as="h2" className="text-[20px]">Receptionists</MedText>
          <MedText variant="body" className="text-text-secondary mt-1">
            Manage receptionists who work at your hospital.
          </MedText>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-all"
          >
            <Plus size={16} /> Add Receptionist
          </button>
        )}
      </div>

      {error && (
        <p className="text-error text-[14px] font-semibold text-center mb-4 animate-in fade-in">{error}</p>
      )}

      {showForm && (
        <MedCard className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <MedText variant="h2" as="h3">{editingId !== null ? 'Edit Receptionist' : 'Add Receptionist'}</MedText>
            <button onClick={resetForm} className="p-1.5 text-muted hover:text-text-secondary">
              <X size={18} />
            </button>
          </div>

          <MedInput
            label="Username"
            placeholder="Receptionist username"
            value={form.username}
            onChange={(e) => { setForm({ ...form, username: e.target.value }); dispatch(clearHospitalError()); }}
          />
          <MedInput
            label="Phone"
            placeholder="912 345 678"
            value={form.phone}
            onChange={(e) => { setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '') }); dispatch(clearHospitalError()); }}
            maxLength={9}
            error={!!form.phone && !isPhoneValid}
            errorText="Enter a valid phone number"
          />
          <MedInput
            label="Email"
            type="email"
            placeholder="receptionist@hospital.com"
            value={form.email}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); dispatch(clearHospitalError()); }}
            error={!!form.email && !isEmailValid}
            errorText="Enter a valid email address"
          />
          <MedInput
            label={editingId !== null ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => { setForm({ ...form, password: e.target.value }); dispatch(clearHospitalError()); }}
            error={form.password.length > 0 && form.password.length < 8}
            errorText="Password must be at least 8 characters"
          />

          <MedButton
            title={editingId !== null ? 'Save Changes' : 'Create Receptionist'}
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
          />
        </MedCard>
      )}

      {loading && !receptionists.length ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : receptionists.length === 0 ? (
        <MedCard>
          <div className="text-center py-6">
            <Users size={28} className="text-muted mx-auto mb-3" />
            <MedText variant="body" className="text-text-secondary">No receptionists yet. Add your first one.</MedText>
          </div>
        </MedCard>
      ) : (
        <div className="space-y-3">
          {receptionists.map((r) => (
            <MedCard key={r.id}>
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <MedText variant="body" className="text-[14px] font-medium truncate">{r.user.username || 'Receptionist'}</MedText>
                  <MedText variant="metadata">
                    {r.user.phone || 'No phone'}
                    {r.user.email ? ` · ${r.user.email}` : ''}
                  </MedText>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(r)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-foreground/5 text-text-secondary text-[13px] font-medium hover:bg-foreground/10 transition-all"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-error-bg text-error text-[13px] font-medium hover:bg-[#FEE4E2] transition-all"
                  >
                    {deletingId === r.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-error border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </MedCard>
          ))}
        </div>
      )}
    </div>
  );
}
