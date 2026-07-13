import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

export type ToastData = {
  type: 'success' | 'error';
  message: string;
};

let globalShowToast: ((data: ToastData) => void) | null = null;

export function showToast(data: ToastData) {
  if (globalShowToast) globalShowToast(data);
}

function Toast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  globalShowToast = useCallback((data: ToastData) => {
    setToast(data);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setToast(null), 300);
    }, 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 18px',
        borderRadius: 10,
        backgroundColor: toast.type === 'success' ? '#ECFDF3' : '#FEF3F2',
        border: `1px solid ${toast.type === 'success' ? '#A6F4C5' : '#FECDCA'}`,
        color: toast.type === 'success' ? '#027A48' : '#B42318',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        fontSize: 14,
        fontWeight: 500,
        transition: 'opacity 0.3s, transform 0.3s',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-12px)',
      }}
    >
      {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        type="button"
        onClick={() => { setVisible(false); setTimeout(() => setToast(null), 300); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: toast.type === 'success' ? '#027A48' : '#B42318', padding: 0, display: 'flex' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default Toast;
