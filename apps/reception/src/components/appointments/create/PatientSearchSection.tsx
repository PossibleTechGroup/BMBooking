import React from 'react';
import { Search, Loader2, UserPlus, X } from 'lucide-react';
import type { PatientResult } from './useCreateAppointment';
import { EthiopianDateHint } from '../../EthiopianDateHint';

interface PatientSearchSectionProps {
  mode: 'search' | 'register';
  setMode: (mode: 'search' | 'register') => void;
  patientQuery: string;
  patientResults: PatientResult[];
  selectedPatient: PatientResult | null;
  setSelectedPatient: (p: PatientResult | null) => void;
  searching: boolean;
  showResults: boolean;
  searchRef: React.RefObject<HTMLDivElement>;
  registerForm: { phone: string; fullName: string; gender: string; dateOfBirth: string };
  setRegisterForm: React.Dispatch<React.SetStateAction<{ phone: string; fullName: string; gender: string; dateOfBirth: string }>>;
  registerSaving: boolean;
  handleSearch: (val: string) => void;
  selectPatient: (p: PatientResult) => void;
  handleRegisterPatient: (e: React.FormEvent) => void;
  setError: (err: string) => void;
}

export default function PatientSearchSection({
  mode, setMode,
  patientQuery, patientResults,
  selectedPatient, setSelectedPatient,
  searching, showResults, searchRef,
  registerForm, setRegisterForm, registerSaving,
  handleSearch, selectPatient, handleRegisterPatient,
  setError,
}: PatientSearchSectionProps) {
  return (
    <div ref={searchRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
          Patient <span style={{ color: 'var(--status-error)' }}>*</span>
        </label>
        {!selectedPatient && mode === 'search' && (
          <button
            type="button"
            onClick={() => setMode('register')}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, color: 'var(--accent-primary)', padding: '2px 4px',
            }}
          >
            <UserPlus size={14} />
            New Patient
          </button>
        )}
      </div>

      {selectedPatient ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          background: '#EAF2FB',
        }}>
          <div>
            <span style={{ fontWeight: 500 }}>{selectedPatient.patientProfile?.fullName || 'Unknown'}</span>
            <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '13px' }}>{selectedPatient.phone}</span>
          </div>
          <button type="button" onClick={() => setSelectedPatient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}>
            <X size={16} />
          </button>
        </div>
      ) : mode === 'register' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: '#F8FAFC', color: 'var(--text-secondary)', borderRight: '1px solid var(--border)', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              +251
            </div>
            <input
              type="tel"
              value={registerForm.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                setRegisterForm((p) => ({ ...p, phone: val }));
              }}
              placeholder="912345678"
              style={{
                flex: 1, padding: '10px 14px', fontSize: '15px',
                border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none'
              }}
            />
          </div>
          <input
            type="text"
            value={registerForm.fullName}
            onChange={(e) => setRegisterForm((p) => ({ ...p, fullName: e.target.value }))}
            placeholder="Full name"
            style={{
              width: '100%', padding: '10px 14px', fontSize: '15px',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)', color: 'var(--text-primary)',
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <select
              value={registerForm.gender}
              onChange={(e) => setRegisterForm((p) => ({ ...p, gender: e.target.value }))}
              style={{
                padding: '10px 14px', fontSize: '15px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)',
              }}
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <input
              type="date"
              value={registerForm.dateOfBirth}
              onChange={(e) => setRegisterForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
              style={{
                padding: '10px 14px', fontSize: '15px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)',
              }}
            />
            <EthiopianDateHint isoDate={registerForm.dateOfBirth} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setMode('search'); setError(''); }}
              style={{
                padding: '8px 14px', fontSize: '13px', fontWeight: 500,
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)', cursor: 'pointer',
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleRegisterPatient}
              disabled={registerSaving || registerForm.phone.length !== 9 || !registerForm.fullName}
              style={{
                padding: '8px 14px', fontSize: '13px', fontWeight: 600,
                border: 'none', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer',
                opacity: (registerSaving || registerForm.phone.length !== 9 || !registerForm.fullName) ? 0.6 : 1,
              }}
            >
              {registerSaving ? 'Creating...' : 'Create & Select'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={patientQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or phone..."
              style={{
                width: '100%', padding: '10px 14px 10px 36px', fontSize: '15px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', color: 'var(--text-primary)',
              }}
            />
          </div>
          {searching && (
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <Loader2 size={16} className="spin" />
            </div>
          )}
          {showResults && patientResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
              zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '4px',
            }}>
              {patientResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPatient(p)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: 'var(--text-primary)', fontSize: '14px',
                    borderBottom: '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#EAF2FB')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ fontWeight: 500 }}>{p.patientProfile?.fullName || 'Unknown'}</span>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '13px' }}>{p.phone}</span>
                </button>
              ))}
            </div>
          )}
          {showResults && patientResults.length === 0 && patientQuery.trim().length >= 2 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
              zIndex: 10, padding: '12px 14px', fontSize: '14px', color: 'var(--text-secondary)',
              marginTop: '4px',
            }}>
              No patients found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
