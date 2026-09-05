'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { useAppSelector } from '@/lib/hooks';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';

interface NotificationItem {
  id: number;
  type: string;
  title: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

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

export default function HospitalNotificationsPage() {
  const { token } = useAppSelector((s) => s.auth);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get(`/notifications?limit=100&t=${Date.now()}`);
      setNotifications(res.data.data.notifications || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
    } catch {
      // ignore
    }
  };

  const markRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((n) => n.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
    } catch {
      // ignore
    }
  };

  const remove = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((n) => n.filter((x) => x.id !== id));
    } catch {
      // ignore
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-5 lg:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-border flex items-center justify-center">
            <Bell size={20} className="text-primary" />
          </div>
          <div>
            <MedText variant="h2" as="h2" className="text-[20px]">Notifications</MedText>
            <MedText variant="metadata">{unread > 0 ? `${unread} unread` : 'All caught up'}</MedText>
          </div>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold hover:opacity-90 transition-opacity">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : notifications.length === 0 ? (
        <MedCard className="p-10 text-center text-text-secondary">No notifications yet.</MedCard>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <MedCard key={n.id} className={`p-4 ${n.isRead ? 'opacity-70' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-muted' : 'bg-primary'}`} />
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => { if (!n.isRead) markRead(n.id); }}
                >
                  {n.title && <MedText variant="body" className="text-[13px] font-semibold text-text">{n.title}</MedText>}
                  <MedText variant="body" className="text-[13px] text-text">{n.message}</MedText>
                  <MedText variant="metadata" className="text-[11px]">{timeAgo(n.createdAt)}</MedText>
                </button>
                <button onClick={() => remove(n.id)} className="p-1.5 rounded-lg text-text-secondary hover:bg-error-bg hover:text-error" title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </MedCard>
          ))}
        </div>
      )}
    </div>
  );
}