import type { FormEvent } from 'react';
import { X, Loader2, CheckCircle, Image as ImageIcon, Video, Trash } from 'lucide-react';
import { styles } from './styles';

interface RegForm {
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

interface RegisterDoctorModalProps {
  registerResult: { tempPassword?: string } | null;
  form: RegForm;
  setForm: React.Dispatch<React.SetStateAction<RegForm>>;
  error: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}

export default function RegisterDoctorModal({
  registerResult, form, setForm, error, saving, onClose, onSubmit,
}: RegisterDoctorModalProps) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Register New Doctor</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {registerResult ? (
          <div>
            <div style={{
              background: '#ECFDF3', color: '#027A48', padding: '16px', borderRadius: '8px',
              fontSize: '14px', border: '1px solid #A6F4C5', textAlign: 'center',
            }}>
              <CheckCircle size={24} style={{ marginBottom: '8px' }} />
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>Doctor registered successfully!</p>
              <p style={{ fontSize: '13px', marginBottom: 0 }}>
                Status: <strong>Pending Review</strong> — awaiting admin approval.
              </p>
            </div>
            <div style={styles.modalActions}>
              <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', background: 'var(--accent-primary)', color: '#FFF' }}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            {error && <div style={styles.errorMsg}>{error}</div>}

            <label style={styles.label}>Full Name *</label>
            <input style={styles.input} value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="John Doe" required />

            <label style={styles.label}>Phone *</label>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: '1px solid var(--border)', borderRadius: '8px',
              overflow: 'hidden', marginBottom: '16px',
            }}>
              <span style={{
                padding: '0 12px', fontSize: 14, fontWeight: 600,
                color: '#334155', background: '#F1F5F9', height: 44,
                display: 'flex', alignItems: 'center',
                borderRight: '1px solid var(--border)',
              }}>+251</span>
              <input
                placeholder="XX XXX XXXX"
                type="tel"
                style={{ flex: 1, height: 44, border: 'none', padding: '0 12px', fontSize: 15, outline: 'none' }}
                value={form.phone.replace(/[^0-9]/g, '').slice(0, 9)}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 9) }))}
                required
              />
            </div>

            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="doctor@example.com" />

            <label style={styles.label}>Specialization</label>
            <input style={styles.input} value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))} placeholder="Cardiology" />

            <label style={styles.label}>License Number</label>
            <input style={styles.input} value={form.licenseNumber} onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))} placeholder="LIC-12345" />

            <label style={styles.label}>Experience (years)</label>
            <input style={styles.input} type="number" value={form.experienceYears} onChange={(e) => setForm((p) => ({ ...p, experienceYears: e.target.value }))} placeholder="5" />

            <label style={styles.label}>Bio</label>
            <textarea style={styles.textarea} value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Brief professional background..." />

            {/* Profile Picture Upload */}
            <label style={styles.label}>Profile Picture</label>
            <div
              onClick={() => document.getElementById('reg-profile-pic')?.click()}
              style={{
                border: '2px dashed var(--border)', borderRadius: '12px',
                padding: form.profilePicture ? '16px' : '24px', textAlign: 'center',
                cursor: 'pointer', marginBottom: '16px',
                background: form.profilePicture ? '#F8FAFC' : 'transparent',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <input id="reg-profile-pic" type="file" accept="image/jpeg,image/png" style={{ display: 'none' }}
                onChange={(e) => setForm((p) => ({ ...p, profilePicture: e.target.files?.[0] || null }))} />
              {form.profilePicture ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={URL.createObjectURL(form.profilePicture)} alt="Preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, profilePicture: null })); }}
                    style={{ position: 'absolute', top: '-8px', right: '-8px', width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--status-error)', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>
                  <ImageIcon size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Click to upload profile picture</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>JPEG or PNG, up to 10MB</p>
                </div>
              )}
            </div>

            {/* Intro Video Upload */}
            <label style={styles.label}>Intro Video</label>
            <div
              onClick={() => document.getElementById('reg-intro-video')?.click()}
              style={{
                border: '2px dashed var(--border)', borderRadius: '12px',
                padding: form.introVideo ? '16px' : '24px', textAlign: 'center',
                cursor: 'pointer', marginBottom: '16px',
                background: form.introVideo ? '#F8FAFC' : 'transparent',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <input id="reg-intro-video" type="file" accept="video/mp4,video/quicktime" style={{ display: 'none' }}
                onChange={(e) => setForm((p) => ({ ...p, introVideo: e.target.files?.[0] || null }))} />
              {form.introVideo ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Video size={24} color="var(--accent-primary)" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{form.introVideo.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{(form.introVideo.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, introVideo: null })); }}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #FECDCA', background: '#FFF', color: 'var(--status-error)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trash size={14} /> Remove
                  </button>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>
                  <Video size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Click to upload intro video</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>MP4 or MOV, up to 50MB</p>
                </div>
              )}
            </div>

            <div style={styles.modalActions}>
              <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer', background: '#FFF' }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', background: 'var(--accent-primary)', color: '#FFF', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
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
