'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  fetchHospitalReceptionists,
  createReceptionist,
  updateReceptionist,
  deleteReceptionist,
  clearHospitalError,
} from '@/lib/store/slices/hospitalSlice';
import {
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  GRANTABLE_PERMISSIONS,
  OPERATIONAL_PERMISSIONS,
} from '@/lib/permissions';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { MedInput } from '@/components/ui/med-input';
import { Users, Plus, Pencil, Trash2, X, Eye, EyeOff, ShieldCheck, CheckSquare, Square } from 'lucide-react';

interface FormState {
  fullName: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  permissions: string[];
}

const emptyForm: FormState = {
  fullName: '',
  username: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  permissions: [...OPERATIONAL_PERMISSIONS],
};

function PasswordField({
  label,
  value,
  show,
  onToggle,
  onChange,
  error,
  errorText,
  placeholder,
}: {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  errorText?: string;
  placeholder?: string;
}) {
  return (
    <div className="mb-5 w-full">
      <label className={`block text-[12px] font-medium mb-2 ml-1 ${error ? 'text-error' : 'text-muted'}`}>
        {label}
      </label>
      <div className={`relative flex items-center h-14 rounded-[12px] bg-surface border-[1.5px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] focus-within:border-border-focus transition-colors ${error ? 'border-error' : 'border-border'}`}>
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full h-full px-4 pr-12 text-[16px] bg-transparent text-text placeholder:text-muted focus:outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 text-muted hover:text-text-secondary transition-colors"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && errorText && (
        <p className="text-error text-[12px] mt-1.5 ml-1">{errorText}</p>
      )}
    </div>
  );
}

function PermissionMatrix({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);

  const toggleGroup = (keys: string[]) =>
    onChange(
      keys.every((k) => selected.includes(k))
        ? selected.filter((k) => !keys.includes(k))
        : [...new Set([...selected, ...keys])]
    );

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2 ml-1">
        <span className="text-[12px] font-medium text-muted">Permissions ({selected.length}/{GRANTABLE_PERMISSIONS.length})</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onChange([...GRANTABLE_PERMISSIONS])}
            className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20"
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onChange([...OPERATIONAL_PERMISSIONS])}
            className="px-2 py-1 rounded-lg bg-foreground/10 text-text-secondary text-[11px] font-medium hover:bg-foreground/20"
          >
            Operational
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="px-2 py-1 rounded-lg border border-border text-text-secondary text-[11px] font-medium hover:bg-foreground/5"
          >
            None
          </button>
        </div>
      </div>

      <div className="space-y-3 border-[1.5px] border-border rounded-[12px] p-3 bg-surface">
        {PERMISSION_GROUPS.map((g) => {
          const items = g.items.filter((i) => GRANTABLE_PERMISSIONS.includes(i.key));
          if (items.length === 0) return null;
          const allInGroup = items.every((i) => selected.includes(i.key));
          const someInGroup = items.some((i) => selected.includes(i.key));
          return (
            <div key={g.group} className="border-b border-border last:border-0 pb-3 last:pb-0">
              <button
                type="button"
                onClick={() => toggleGroup(items.map((i) => i.key))}
                className="flex items-center gap-2 w-full text-left mb-2"
              >
                {allInGroup ? (
                  <CheckSquare size={16} className="text-primary flex-shrink-0" />
                ) : someInGroup ? (
                  <Square size={16} className="text-primary flex-shrink-0 opacity-60" />
                ) : (
                  <Square size={16} className="text-muted flex-shrink-0" />
                )}
                <span className="text-[13px] font-semibold text-text">{g.group}</span>
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {items.map((p) => {
                  const checked = selected.includes(p.key);
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => toggle(p.key)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[12px] transition-colors ${
                        checked ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-foreground/5'
                      }`}
                    >
                      {checked ? <CheckSquare size={14} className="flex-shrink-0" /> : <Square size={14} className="flex-shrink-0 text-muted" />}
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HospitalStaffPage() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { receptionists, loading, error, hospitalRole } = useAppSelector((s) => s.hospital);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isOwner = hospitalRole === 'owner';

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
  const passwordOk =
    editingId !== null
      ? form.password.length === 0 || form.password.length >= 8
      : form.password.length >= 8;
  const passwordsMatch = form.password === form.confirmPassword;
  const canSubmit =
    form.fullName.trim().length > 0 &&
    form.username.trim().length > 0 &&
    passwordOk &&
    passwordsMatch &&
    isPhoneValid &&
    isEmailValid;

  const selectedCountLabel = useMemo(() => {
    if (!form.permissions.length) return 'No permissions';
    return `${form.permissions.length} of ${ALL_PERMISSIONS.length} permissions`;
  }, [form.permissions]);

  if (!isOwner) {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <MedCard>
          <div className="text-center py-8">
            <ShieldCheck size={28} className="text-muted mx-auto mb-3" />
            <MedText variant="h2" as="h2" className="text-[18px]">Access denied</MedText>
            <MedText variant="body" className="text-text-secondary mt-1">
              Only the hospital owner can manage staff.
            </MedText>
          </div>
        </MedCard>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!canSubmit) return;
    dispatch(clearHospitalError());
    setSubmitting(true);
    const payload = {
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      phone: form.phone ? `+251${form.phone}` : undefined,
      email: form.email.trim() || undefined,
      permissions: form.permissions,
      ...(form.password ? { password: form.password } : {}),
    };
    if (editingId !== null) {
      await dispatch(updateReceptionist({ id: editingId, data: payload }));
    } else {
      await dispatch(createReceptionist(payload as { fullName: string; username: string; phone?: string; email?: string; password: string; permissions?: string[] }));
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
      fullName: r.fullName || '',
      username: r.user.username || '',
      phone: r.user.phone ? r.user.phone.replace(/^\+251/, '') : '',
      email: r.user.email || '',
      password: '',
      confirmPassword: '',
      permissions: r.permissions && r.permissions.length ? [...r.permissions].filter((p) => GRANTABLE_PERMISSIONS.includes(p)) : [...GRANTABLE_PERMISSIONS],
    });
    setShowForm(true);
  };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <MedText variant="h2" as="h2" className="text-[20px]">Staff</MedText>
          <MedText variant="body" className="text-text-secondary mt-1">
            Manage reception staff and their permissions.
          </MedText>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-all"
          >
            <Plus size={16} /> Add Staff
          </button>
        )}
      </div>

      {error && (
        <p className="text-error text-[14px] font-semibold text-center mb-4 animate-in fade-in">{error}</p>
      )}

      {showForm && (
        <MedCard className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <MedText variant="h2" as="h3">{editingId !== null ? 'Edit Staff' : 'Add Staff'}</MedText>
            <button onClick={resetForm} className="p-1.5 text-muted hover:text-text-secondary">
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-[10px] bg-primary/5 text-primary text-[12px] font-medium">
            <ShieldCheck size={15} />
            {selectedCountLabel}
          </div>

          <MedInput
            label="Full Name"
            placeholder="Staff full name"
            value={form.fullName}
            onChange={(e) => { setForm({ ...form, fullName: e.target.value }); dispatch(clearHospitalError()); }}
          />
          <MedInput
            label="Username"
            placeholder="Staff username (used to log in)"
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
            placeholder="staff@hospital.com"
            value={form.email}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); dispatch(clearHospitalError()); }}
            error={!!form.email && !isEmailValid}
            errorText="Enter a valid email address"
          />
          <PasswordField
            label={editingId !== null ? 'New Password (leave blank to keep current)' : 'Password'}
            placeholder="At least 8 characters"
            value={form.password}
            show={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            onChange={(e) => { setForm({ ...form, password: e.target.value }); dispatch(clearHospitalError()); }}
            error={form.password.length > 0 && form.password.length < 8}
            errorText="Password must be at least 8 characters"
          />
          <PasswordField
            label="Confirm Password"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); dispatch(clearHospitalError()); }}
            error={editingId === null && form.confirmPassword !== '' && !passwordsMatch}
            errorText="Passwords do not match"
          />

          <PermissionMatrix
            selected={form.permissions}
            onChange={(next) => {
              setForm({ ...form, permissions: next });
              dispatch(clearHospitalError());
            }}
          />

          <MedButton
            title={editingId !== null ? 'Save Changes' : 'Create Staff'}
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
            <MedText variant="body" className="text-text-secondary">No staff members yet. Add your first one.</MedText>
          </div>
        </MedCard>
      ) : (
        <div className="space-y-3">
          {receptionists.map((r) => {
            const count = r.permissions?.length || 0;
            return (
              <MedCard key={r.id}>
                <div className="flex justify-between items-center">
                  <div className="min-w-0">
                    <MedText variant="body" className="text-[14px] font-medium truncate">{r.fullName || r.user.username || 'Staff'}</MedText>
                    <MedText variant="metadata">
                      @{r.user.username || '—'}
                      {r.user.phone ? ` · ${r.user.phone}` : ''}
                    </MedText>
                    <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-1 rounded-full text-[11px] font-medium ${
                      count >= 20 ? 'bg-success/10 text-success' : count > 0 ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'
                    }`}>
                      <ShieldCheck size={11} />
                      {count}/{GRANTABLE_PERMISSIONS.length} permissions
                    </span>
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
            );
          })}
        </div>
      )}
    </div>
  );
}