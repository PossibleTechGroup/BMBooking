'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchHospitalProfile, updateHospitalProfile, clearHospitalError } from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { MedButton } from '@/components/ui/med-button';
import { MedInput } from '@/components/ui/med-input';
import { Building2, Mail, MapPin, Phone, Pencil, Check } from 'lucide-react';

export default function HospitalProfilePage() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { profile, error } = useAppSelector((s) => s.hospital);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) {
      dispatch(fetchHospitalProfile());
    }
  }, [dispatch, token]);

  const startEdit = () => {
    if (!profile) return;
    setName(profile.name || '');
    setAddress(profile.address || '');
    setPhone(profile.phone || '');
    setEmail(profile.email || '');
    setEditing(true);
  };

  const isEmailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSave = async () => {
    dispatch(clearHospitalError());
    setSaving(true);
    await dispatch(
      updateHospitalProfile({
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      })
    );
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <MedText variant="h2" as="h2" className="text-[20px]">Profile</MedText>
          <MedText variant="body" className="text-text-secondary mt-1">Your hospital details.</MedText>
        </div>
        {!editing && profile && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-all"
          >
            <Pencil size={15} /> Edit
          </button>
        )}
      </div>

      {error && (
        <p className="text-error text-[14px] font-semibold text-center mb-4 animate-in fade-in">{error}</p>
      )}

      {!profile ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : editing ? (
        <MedCard className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
              <Building2 size={22} className="text-muted" />
            </div>
            <MedText variant="h2" as="h3">Edit Hospital Details</MedText>
          </div>

          <MedInput
            label="Hospital Name"
            value={name}
            onChange={(e) => { setName(e.target.value); dispatch(clearHospitalError()); }}
          />
          <MedInput
            label="Address"
            value={address}
            onChange={(e) => { setAddress(e.target.value); dispatch(clearHospitalError()); }}
          />
          <MedInput
            label="Phone"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); dispatch(clearHospitalError()); }}
          />
          <MedInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); dispatch(clearHospitalError()); }}
            error={!!email && !isEmailValid}
            errorText="Enter a valid email address"
          />

          <div className="flex gap-3">
            <MedButton title="Save Changes" onPress={handleSave} disabled={!name.trim() || !isEmailValid} loading={saving} />
            <MedButton title="Cancel" onPress={() => { setEditing(false); dispatch(clearHospitalError()); }} type="outline" className="w-auto px-8" />
          </div>
        </MedCard>
      ) : (
        <>
          <MedCard className="mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
                <Building2 size={28} className="text-muted" />
              </div>
              <div>
                <MedText variant="h2" as="h3">{profile.name}</MedText>
                <MedText variant="metadata" className="text-text-secondary">{profile.address || 'No address'}</MedText>
              </div>
            </div>
          </MedCard>

          <MedCard className="mb-4">
            <div className="space-y-4">
              {profile.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-muted" />
                  <div>
                    <MedText variant="metadata" className="text-muted">Phone</MedText>
                    <MedText variant="body" className="text-[14px]">{profile.phone}</MedText>
                  </div>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-muted" />
                  <div>
                    <MedText variant="metadata" className="text-muted">Email</MedText>
                    <MedText variant="body" className="text-[14px]">{profile.email}</MedText>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-muted" />
                <div>
                  <MedText variant="metadata" className="text-muted">Address</MedText>
                  <MedText variant="body" className="text-[14px]">{profile.address || 'Not set'}</MedText>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Check size={18} className="text-success" />
                <div>
                  <MedText variant="metadata" className="text-muted">Approval Status</MedText>
                  <MedText variant="body" className="text-[14px] text-success">Approved</MedText>
                </div>
              </div>
            </div>
          </MedCard>
        </>
      )}
    </div>
  );
}
