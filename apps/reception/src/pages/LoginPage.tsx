import { useState, type CSSProperties, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { loginReceptionist } from '../store/slices/authSlice';
import type { AppDispatch, RootState } from '../store';

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border)',
  },
  logo: {
    fontFamily: 'var(--font-heading)',
    fontSize: '28px',
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: '8px',
    color: 'var(--accent-primary)',
  },
  subtitle: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    marginBottom: '32px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '15px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    marginBottom: '20px',
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    background: 'var(--accent-primary)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    opacity: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    background: '#FEF3F2',
    color: 'var(--status-error)',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    marginBottom: '20px',
    border: '1px solid #FECDCA',
  },
};

function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { token, loading, error } = useSelector((state: RootState) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    dispatch(loginReceptionist({ username, password }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="animate-fade">
        <div style={styles.logo}>BM Hub</div>
        <div style={styles.subtitle}>Receptionist Portal</div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />

          <button
            type="submit"
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
            disabled={loading}
          >
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
