import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginAdmin } from '../store/slices/authSlice';
import type { AppDispatch, RootState } from '../store';
import { ShieldCheck, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginAdmin({ email, password }));
  };

  return (
    <div style={styles.container}>
      <div className="glass-card animate-fade" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <ShieldCheck size={32} color="var(--accent-primary)" />
          </div>
          <h1 style={styles.title}>BM Admin</h1>
          <p style={styles.subtitle}>Enter your credentials to access the hub</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="admin@bm-booking.com"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button 
            type="submit" 
            style={{
              ...styles.button,
              backgroundColor: loading ? 'var(--text-secondary)' : 'var(--accent-primary)'
            }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <p>© 2026 BM Health Group</p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    textAlign: 'center'
  },
  header: {
    marginBottom: '32px'
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  title: {
    fontSize: '24px',
    color: 'var(--accent-primary)',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    textAlign: 'left'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  input: {
    height: '48px',
    padding: '0 16px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    height: '48px',
    color: '#FFF',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '12px'
  },
  error: {
    color: 'var(--status-error)',
    fontSize: '14px',
    textAlign: 'center'
  },
  footer: {
    marginTop: '32px',
    fontSize: '12px',
    color: 'var(--text-secondary)'
  }
};

export default LoginPage;
