'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  fetchHospitalCardTemplates,
  createCardTemplate,
  updateCardTemplate,
  deleteCardTemplate,
} from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedInput } from '@/components/ui/med-input';
import { MedButton } from '@/components/ui/med-button';
import { CreditCard, Plus, Pencil, Trash2, X, CalendarDays } from 'lucide-react';

const VALIDITY_PRESETS = [7, 15, 30, 60, 90];

interface FormState {
  name: string;
  price: string;
  validityMode: 'preset' | 'custom';
  validityDays: string;
}

const emptyForm: FormState = { name: '', price: '', validityMode: 'preset', validityDays: '30' };

function labelFor(days?: number | null) {
  if (days == null) return 'No expiry';
  return `${days} days`;
}

export default function HospitalPackagesPage() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { cardTemplates, loading, error } = useAppSelector((s) => s.hospital);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      dispatch(fetchHospitalCardTemplates());
    }
  }, [dispatch, token]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const resolveValidity = (): number | null => {
    if (form.validityMode === 'preset') return Number(form.validityDays);
    return form.validityDays ? Number(form.validityDays) : null;
  };

  const canSubmit = form.name.trim().length > 0 && Number(form.price) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      validityDays: resolveValidity(),
    };
    if (editingId !== null) {
      await dispatch(updateCardTemplate({ id: editingId, data: payload }));
    } else {
      await dispatch(createCardTemplate(payload));
    }
    setSubmitting(false);
    resetForm();
    dispatch(fetchHospitalCardTemplates());
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    await dispatch(deleteCardTemplate(id));
    setDeletingId(null);
  };

  const startEdit = (t: (typeof cardTemplates)[number]) => {
    setEditingId(t.id);
    const days = t.validityDays;
    setForm({
      name: t.name,
      price: String(Number(t.price || 0)),
      validityMode: days !== null && days !== undefined && VALIDITY_PRESETS.includes(days) ? 'preset' : 'custom',
      validityDays: days != null ? String(days) : '',
    });
    setShowForm(true);
  };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <MedText variant="h2" as="h2" className="text-[20px]">Packages</MedText>
          <MedText variant="body" className="text-text-secondary mt-1">
            Configure card packages and their validity periods.
          </MedText>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-all"
          >
            <Plus size={16} /> Add Package
          </button>
        )}
      </div>

      {error && (
        <p className="text-error text-[14px] font-semibold text-center mb-4">{error}</p>
      )}

      {showForm && (
        <MedCard className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <MedText variant="h2" as="h3">{editingId !== null ? 'Edit Package' : 'Add Package'}</MedText>
            <button onClick={resetForm} className="p-1.5 text-muted hover:text-text-secondary">
              <X size={18} />
            </button>
          </div>

          <MedInput
            label="Package Name"
            placeholder="e.g. Standard Visit Card"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <MedInput
            label="Price (ETB)"
            type="number"
            placeholder="500"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9]/g, '') })}
          />

          <div className="mb-4">
            <label className="text-[13px] font-medium text-text-secondary mb-2 block">Validity Period</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {VALIDITY_PRESETS.map((d) => (
                <button
                  key={d}
                  onClick={() => setForm({ ...form, validityMode: 'preset', validityDays: String(d) })}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${
                    form.validityMode === 'preset' && Number(form.validityDays) === d
                      ? 'bg-primary text-white'
                      : 'bg-surface text-text-secondary'
                  }`}
                >
                  {d} days
                </button>
              ))}
              <button
                onClick={() => setForm({ ...form, validityMode: 'custom' })}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${
                  form.validityMode === 'custom' ? 'bg-primary text-white' : 'bg-surface text-text-secondary'
                }`}
              >
                Custom
              </button>
            </div>
            {form.validityMode === 'custom' && (
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-muted" />
                <input
                  type="number"
                  className="w-24 px-3 py-2 border border-border rounded-[10px] text-[13px] focus:outline-none focus:border-primary"
                  placeholder="Days"
                  value={form.validityDays}
                  onChange={(e) => setForm({ ...form, validityDays: e.target.value.replace(/[^0-9]/g, '') })}
                />
                <span className="text-[13px] text-text-secondary">days (leave empty for no expiry)</span>
              </div>
            )}
          </div>

          <MedButton title={editingId !== null ? 'Save Changes' : 'Create Package'} onPress={handleSubmit} disabled={!canSubmit} loading={submitting} />
        </MedCard>
      )}

      {loading && !cardTemplates.length ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : cardTemplates.length === 0 ? (
        <MedCard>
          <div className="text-center py-6">
            <CreditCard size={28} className="text-muted mx-auto mb-3" />
            <MedText variant="body" className="text-text-secondary">No packages yet. Add your first card package.</MedText>
          </div>
        </MedCard>
      ) : (
        <div className="space-y-3">
          {cardTemplates.map((t) => (
            <MedCard key={t.id}>
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-primary" />
                    <MedText variant="body" className="text-[14px] font-medium truncate">{t.name}</MedText>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${t.isActive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <MedText variant="metadata" className="mt-0.5">
                    ETB {Number(t.price || 0).toLocaleString()} • {labelFor(t.validityDays)}
                  </MedText>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(t)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-foreground/5 text-text-secondary text-[13px] font-medium hover:bg-foreground/10 transition-all"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-error-bg text-error text-[13px] font-medium hover:bg-[#FEE4E2] transition-all"
                  >
                    {deletingId === t.id ? (
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
