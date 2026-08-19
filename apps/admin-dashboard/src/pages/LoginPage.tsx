import { useState, type CSSProperties, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LogIn,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  Loader2,
  Users,
  Building2,
  BarChart3,
} from 'lucide-react';
import { loginAdmin } from '../store/slices/authSlice';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  if (token) {
    window.location.href = '/';
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;
    dispatch(loginAdmin({ email, password }));
  };

  const inputStyle = (field: 'email' | 'password') =>
    focusedField === field ? { ...styles.input, ...styles.inputFocus } : styles.input;

  return (
    <div className="login-page">
      <aside className="login-hero">
        <div className="login-hero-top">
          <img src="/bm-booking.png" alt="BM Booking" className="login-hero-logo" />
          <span className="login-hero-brand">BM Hub</span>
        </div>

        <div className="login-hero-body">
          <h1 className="login-hero-title">Admin Portal</h1>
          <p className="login-hero-text">
            Full access to manage doctors, hospitals, patients, and platform operations.
          </p>
          <ul className="login-hero-features">
            <li>
              <ShieldCheck size={18} />
              <span>Approve &amp; manage doctor registrations</span>
            </li>
            <li>
              <Users size={18} />
              <span>Oversee patients &amp; medical tools</span>
            </li>
            <li>
              <Building2 size={18} />
              <span>Control hospital registrations &amp; settings</span>
            </li>
          </ul>
        </div>

        <div className="login-hero-foot">
          <span className="login-hero-chip">
            <BarChart3 size={14} /> Superadmin access
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
                Sign in to your admin account
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
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <Mail size={18} />
              </span>
              <input
                style={inputStyle('email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="admin@bm-booking.com"
                autoComplete="email"
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
                ...(loading || !email || !password ? styles.buttonDisabled : {}),
              }}
              disabled={loading || !email || !password}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={styles.hint}>
            <ShieldCheck size={14} />
            Authorized administrators only
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
