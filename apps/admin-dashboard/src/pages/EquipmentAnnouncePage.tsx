import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { postAnnouncement, clearSuccess } from '../store/slices/equipmentSlice';
import { fetchHospitals } from '../store/slices/hospitalSlice';
import { Megaphone, Send, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

export const EquipmentAnnouncePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, success, error } = useSelector((state: RootState) => state.equipment);
  const { hospitals } = useSelector((state: RootState) => state.hospitals);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'MRI',
    hospitalId: '' as string | number,
  });

  useEffect(() => {
    dispatch(fetchHospitals());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      setFormData({ title: '', message: '', category: 'MRI', hospitalId: '' });
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      postAnnouncement({
        title: formData.title,
        message: formData.message,
        category: formData.category,
        hospitalId: formData.hospitalId ? Number(formData.hospitalId) : undefined,
      }),
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <Megaphone size={32} color="#3B82F6" />
        <div style={{ marginLeft: 16 }}>
          <h2 style={styles.title}>Tool Announcements</h2>
          <p style={styles.subtitle}>Broadcast availability alerts directly to all users.</p>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.formCard}>
          <h3 style={styles.cardTitle}>Create Tool Alert</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Title</label>
              <input
                placeholder="e.g. MRI Scan slots available"
                style={styles.input}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Tool Category</label>
                <select
                  style={styles.input}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={loading}
                >
                  <option value="MRI">MRI</option>
                  <option value="CT_SCAN">CT Scan</option>
                  <option value="DIALYSIS">Dialysis</option>
                  <option value="ULTRASOUND">Ultrasound</option>
                  <option value="XRAY">X-Ray</option>
                  <option value="MAMMOGRAPHY">Mammography</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Hospital (optional)</label>
                <select
                  style={styles.input}
                  value={formData.hospitalId}
                  onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                  disabled={loading}
                >
                  <option value="">All hospitals</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Alert Message</label>
              <textarea
                placeholder="Message content for the notification..."
                style={styles.textarea}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div style={styles.errorMsg}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              <span style={{ marginLeft: 8 }}>Broadcast Alert</span>
            </button>

            {success && (
              <div style={styles.successMsg}>
                <CheckCircle size={16} /> Alert sent successfully!
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '32px', maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: '14px', color: '#64748B' },
  content: { display: 'flex', justifyContent: 'center' },
  formCard: {
    backgroundColor: '#FFF',
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    width: '100%',
  },
  cardTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  input: {
    height: '44px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '0 12px',
    fontSize: '14px',
  },
  textarea: {
    height: '120px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    resize: 'none',
  },
  submitBtn: {
    backgroundColor: 'var(--accent-primary)',
    color: '#FFF',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
  },
  errorMsg: { color: '#EF4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' },
  successMsg: {
    color: '#027A48',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#ECFDF3',
    borderRadius: '8px',
  },
};
