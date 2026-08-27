import { useEffect, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from '../store/slices/notificationSlice';
import { CheckCheck, Clock, Stethoscope, Loader2, Inbox } from 'lucide-react';const styles: Record<string, CSSProperties> = {
  page: {},
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  titleBox: {},
  title: { fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, margin: 0 },
  card: {
    padding: 16,
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    marginBottom: 12,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  unreadCard: {
    background: 'linear-gradient(135deg, #EFF6FF, #FFFFFF)',
    border: '1px solid #BFDBFE',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' },
  msg: { fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: 1.4 },
  meta: { fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 },
  empty: { textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 6 },
  markAll: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: '#fff',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};

function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, loading, unreadCount } = useSelector((state: RootState) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleOpen = (n: (typeof notifications)[number]) => {
    if (!n.isRead) dispatch(markAsRead(n.id));
    if (n.metadata?.appointmentId) {
      navigate(`/appointments?booking=${n.metadata.appointmentId}`);
    } else {
      navigate('/appointments');
    }
  };

  return (
    <div className="animate-fade" style={styles.page}>
      <div style={styles.header}>
        <div style={styles.titleBox}>
          <h1 style={styles.title}>Notifications</h1>
          <p style={styles.subtitle}>{unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <button style={styles.markAll} onClick={() => dispatch(markAllAsRead())}>
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', padding: 40 }}>
          <Loader2 size={20} className="animate-spin" /> Loading notifications…
        </div>
      ) : notifications.length === 0 ? (
        <div style={styles.empty}>
          <Inbox size={40} color="#CBD5E1" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 500 }}>No notifications yet</p>
          <p style={{ fontSize: 13 }}>New patient bookings will appear here.</p>
        </div>
      ) : (
        <div>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{ ...styles.card, ...(n.isRead ? {} : styles.unreadCard) }}
              onClick={() => handleOpen(n)}
            >
              <div style={{ ...styles.iconBox, background: n.type === 'APPOINTMENT_BOOKED' ? '#DBEAFE' : '#F3F4F6' }}>
                <Stethoscope size={20} color="#2563EB" />
              </div>
              <div style={styles.body}>
                <p style={styles.title}>{n.title || n.type}</p>
                <p style={styles.msg}>{n.message}</p>
                <span style={styles.meta}>
                  <Clock size={12} /> {timeAgo(n.createdAt)}
                </span>
              </div>
              {!n.isRead && <span style={styles.dot} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
