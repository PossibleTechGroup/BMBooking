import { useState, type CSSProperties, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import {
  LogIn,
  Eye,
  EyeOff,
  UserRound,
  Lock,
  CalendarCheck,
  Stethoscope,
  Building2,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { loginReceptionist } from '../store/slices/authSlice';
import type { AppDispatch, RootState } from '../store';

const styles: Record<string, CSSProperties> = {
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px 36px',
    background: 'var(--surface)',
    borderRadius: '20px',
    boxShadow: '0 20px 50px -12px rgba(11, 30, 51, 0.18)',
    border: '1px solid rgba(216, 227, 240, 0.7)',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
  },
  logoBadge: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    marginBottom: '28px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  inputWrap: {
    position: 'relative',
    marginBottom: '18px',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-secondary)',
    display: 'flex',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '13px 46px 13px 42px',
    fontSize: '15px',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    outline: 'none',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    fontFamily: 'var(--font-main)',
  },
  inputFocus: {
    borderColor: 'var(--accent-primary)',
    boxShadow: '0 0 0 4px rgba(21, 101, 192, 0.12)',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '6px',
  },
  button: {
    width: '100%',
    padding: '13px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1E88E5 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '8px',
    transition: 'opacity 0.15s ease, transform 0.1s ease',
    fontFamily: 'var(--font-main)',
  },
  buttonHover: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#FEF3F2',
    color: 'var(--status-error)',
    padding: '11px 14px',
    borderRadius: '10px',
    fontSize: '14px',
    marginBottom: '18px',
    border: '1px solid #FECDCA',
  },
  hint: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    marginTop: '20px',
  },
};

function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { token, loading, error } = useSelector((state: RootState) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password || loading) return;
    dispatch(loginReceptionist({ username, password }));
  };

  const inputStyle = (field: 'username' | 'password') =>
    focusedField === field ? { ...styles.input, ...styles.inputFocus } : styles.input;

  return (
    <div className="login-page">
      <aside className="login-hero">
        <div className="login-hero-top">
          <img src="/bm-booking.png" alt="BM Booking" className="login-hero-logo" />
          <span className="login-hero-brand">BM Hub</span>
        </div>

        <div className="login-hero-body">
          <h1 className="login-hero-title">Receptionist Portal</h1>
          <p className="login-hero-text">
            Manage doctor requests, appointments, schedules, and equipment — all in one place.
          </p>
          <ul className="login-hero-features">
            <li>
              <ShieldCheck size={18} />
              <span>Review &amp; approve doctor registrations</span>
            </li>
            <li>
              <CalendarCheck size={18} />
              <span>Manage appointments &amp; schedules</span>
            </li>
            <li>
              <Building2 size={18} />
              <span>Run your hospital's daily operations</span>
            </li>
          </ul>
        </div>

        <div className="login-hero-foot">
          <span className="login-hero-chip">
            <Stethoscope size={14} /> Secure staff access
          </span>
        </div>
      </aside>

      <div className="login-form-side">
        <div style={styles.card} className="animate-fade">
          <div style={styles.brandRow}>
            <div style={styles.logoBadge}>
              <img src="/bm-booking.png" alt="BM Booking" style={styles.logoImg} />
            </div>
            <div>
              <div style={styles.title}>Welcome back</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Sign in to your reception account
              </div>
            </div>
          </div>

          <div style={styles.subtitle}>Enter your credentials to continue to the dashboard.</div>

          {error && (
            <div style={styles.error}>
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <UserRound size={18} />
              </span>
              <input
                style={inputStyle('username')}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>

            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <Lock size={18} />
              </span>
              <input
                style={inputStyle('password')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                onMouseDown={(e) => e.preventDefault()}
                style={styles.eyeBtn}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(loading || !username || !password ? styles.buttonDisabled : {}),
              }}
              disabled={loading || !username || !password}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={styles.hint}>
            <ShieldCheck size={14} />
            Authorized hospital staff only
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
