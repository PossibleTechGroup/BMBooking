import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import {
  fetchHospital,
  updateCardPrice,
  clearHospitalSuccess,
  clearHospitalError,
} from '../store/slices/hospitalSlice';
import { Building2, CreditCard, MapPin, Phone, Loader2, Save, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import { formatNum } from '../utils/ethiopianDate';

const styles: Record<string, CSSProperties> = {
  page: {},
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  headerLeft: {},
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: {
    padding: 24,
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
  },
  cardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  infoRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', fontSize: 14, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' },
  infoRowLast: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', fontSize: 14, color: 'var(--text-secondary)' },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 },
  input: {
    width: '100%',
    height: 48,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0 14px',
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputWrapper: { position: 'relative', marginBottom: 16 },
  inputSuffix: { position: 'absolute', right: 14, top: 14, fontSize: 14, color: '#94A3B8', fontWeight: 500, pointerEvents: 'none' },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--accent-primary)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  priceDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
    padding: '16px 20px',
    background: '#F0F9FF',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid #BAE6FD',
    marginBottom: 20,
  },
  priceValue: { fontSize: 28, fontWeight: 700, color: '#0369A1' },
  priceLabel: { fontSize: 14, color: '#64748B' },
  toast: {
    padding: '12px 16px',
    borderRadius: 8,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
  },
  img: { width: '100%', height: 160, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: 16 },
  placeholderImg: {
    width: '100%', height: 160, borderRadius: 'var(--radius-sm)', marginBottom: 16,
    background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px dashed #E2E8F0',
  },
};

function HospitalSettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { hospital, loading, saving, success, error } = useSelector((state: RootState) => state.hospital);
  const [cardPrice, setCardPrice] = useState('');

  useEffect(() => {
    dispatch(fetchHospital());
  }, [dispatch]);

  useEffect(() => {
    if (hospital) setCardPrice(String(hospital.cardPrice));
  }, [hospital]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => dispatch(clearHospitalSuccess()), 3000);
      return () => clearTimeout(t);
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => dispatch(clearHospitalError()), 5000);
      return () => clearTimeout(t);
    }
  }, [error, dispatch]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    dispatch(updateCardPrice(Number(cardPrice)));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', padding: 40 }}>
        <Loader2 size={20} className="animate-spin" /> Loading hospital…
      </div>
    );
  }

  return (
    <div className="animate-fade" style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Hospital Settings</h1>
          <p style={styles.subtitle}>Manage your facility details and visit card fee.</p>
        </div>
      </div>

      {success && (
        <div style={{ ...styles.toast, background: '#ECFDF3', color: '#027A48', border: '1px solid #A6F4C5' }}>
          <CheckCircle size={18} />
          <span style={{ flex: 1 }}>{success}</span>
          <button type="button" onClick={() => dispatch(clearHospitalSuccess())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#027A48', fontWeight: 600 }}>Dismiss</button>
        </div>
      )}
      {error && (
        <div style={{ ...styles.toast, background: '#FEF3F2', color: '#B42318', border: '1px solid #FECDCA' }}>
          <AlertTriangle size={18} />
          <span style={{ flex: 1 }}>{error}</span>
          <button type="button" onClick={() => dispatch(clearHospitalError())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B42318', fontWeight: 600 }}>Dismiss</button>
        </div>
      )}

      <div style={styles.grid}>
        {hospital && (
          <>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}><Building2 size={18} color="#3B82F6" /> Facility Info</h2>
              {hospital.image ? (
                <img src={hospital.image} alt={hospital.name} style={styles.img} />
              ) : (
                <div style={styles.placeholderImg}>
                  <Building2 size={40} color="#CBD5E1" />
                </div>
              )}
              <div style={styles.infoRow}>
                <Building2 size={16} color="#64748B" />
                <strong style={{ color: 'var(--text-primary)', flex: 1 }}>{hospital.name}</strong>
              </div>
              {hospital.address && (
                <div style={styles.infoRow}>
                  <MapPin size={16} color="#64748B" />
                  <span>{hospital.address}</span>
                </div>
              )}
              {hospital.phone && (
                <div style={styles.infoRow}>
                  <Phone size={16} color="#64748B" />
                  <span>{hospital.phone}</span>
                </div>
              )}
              {hospital.latitude && hospital.longitude && (
                <div style={styles.infoRowLast}>
                  <MapPin size={16} color="#64748B" />
                  <a href={`https://www.google.com/maps?q=${hospital.latitude},${hospital.longitude}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>
                    View on Google Maps
                  </a>
                </div>
              )}
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}><CreditCard size={18} color="#059669" /> Visit Card Fee</h2>
              <div style={styles.priceDisplay}>
                <span style={styles.priceValue}>{formatNum(Number(hospital.cardPrice))}</span>
                <span style={styles.priceLabel}>ETB per card</span>
              </div>

              <form onSubmit={handleSave}>
                <label style={styles.label}>
                  <CreditCard size={14} />
                  Update card price (ETB)
                </label>
                <div style={styles.inputWrapper}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    style={styles.input}
                    value={cardPrice}
                    onChange={(e) => setCardPrice(e.target.value)}
                    required
                  />
                  <span style={styles.inputSuffix}>ETB</span>
                </div>
                <button
                  type="submit"
                  style={{ ...styles.btn, ...(saving ? styles.btnDisabled : {}) }}
                  disabled={saving}
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {saving ? 'Saving…' : 'Update Card Price'}
                </button>
              </form>
            </div>



            <div style={styles.card}>
              <h2 style={styles.cardTitle}><DollarSign size={18} color="#D97706" /> Service Fee</h2>
              <div style={{ ...styles.priceDisplay, background: '#FFFBEB', borderColor: '#FDE68A' }}>
                <span style={{ ...styles.priceValue, color: '#B45309' }}>{hospital.serviceFee ? formatNum(Number(hospital.serviceFee.amount)) : 'Not set'}</span>
                <span style={styles.priceLabel}>{hospital.serviceFee ? 'ETB per appointment' : ''}</span>
              </div>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Service fee is configured by the admin. This fee is charged per appointment as a booking fee.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HospitalSettingsPage;
