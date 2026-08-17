import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePublishAnnouncement,
  resendAnnouncement,
  clearSuccess,
  clearError,
} from '../store/slices/announcementSlice';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Send,
  X,
  CheckCircle,
  Globe,
  Users,
  Stethoscope,
  Clock,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { formatDate } from '../utils/ethiopianDate';
import { adminPageStyles } from '../styles/adminPageStyles';
import { PageHeader } from '../components/PageHeader';

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users', icon: Globe, color: '#6366F1', bg: '#EEF2FF' },
  { value: 'doctor', label: 'Doctors', icon: Stethoscope, color: '#0891B2', bg: '#ECFEFF' },
  { value: 'patient', label: 'Patients', icon: Users, color: '#059669', bg: '#ECFDF5' },
];

interface FormState {
  title: string;
  message: string;
  audience: string;
}

const emptyForm: FormState = { title: '', message: '', audience: 'all' };

export const AnnouncementsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, submitting, success, error } = useSelector((state: RootState) => state.announcements);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchAnnouncements());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    dispatch(clearError());
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({ title: item.title, message: item.message, audience: item.audience });
    setShowForm(true);
    dispatch(clearError());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    if (editingId) {
      await dispatch(updateAnnouncement({ id: editingId, data: form }));
    } else {
      await dispatch(createAnnouncement(form));
    }
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    await dispatch(deleteAnnouncement(id));
    setConfirmDelete(null);
  };

  const handleTogglePublish = async (id: number) => {
    await dispatch(togglePublishAnnouncement(id));
  };

  const handleResend = async (id: number) => {
    setResendingId(id);
    await dispatch(resendAnnouncement(id));
    setResendingId(null);
  };

  const fmtDate = (dateStr: string) => {
    return formatDate(new Date(dateStr), 'full');
  };

  if (loading) {
    return (
      <div style={adminPageStyles.loadingWrap}>
        <Loader2 size={32} className="spin" style={{ color: '#6366F1' }} />
      </div>
    );
  }

  const audienceMeta = (val: string) => AUDIENCE_OPTIONS.find(o => o.value === val) || AUDIENCE_OPTIONS[0];
  const AudienceIcon = (val: string) => audienceMeta(val).icon;

  return (
    <div style={adminPageStyles.page}>
      <PageHeader
        icon={Megaphone}
        iconColor="#6366F1"
        title="Announcements"
        subtitle="Create and send targeted announcements via SMS & push notifications."
        actions={
          <button onClick={openCreate} style={adminPageStyles.primaryBtn}>
            <Plus size={18} /> New Announcement
          </button>
        }
      />

      {/* Alerts */}
      {success && (
        <div style={s.successBanner}>
          <CheckCircle size={18} />
          <span>{editingId ? 'Announcement updated' : 'Announcement created'} successfully!</span>
        </div>
      )}
      {error && (
        <div style={s.errorBanner}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{editingId ? 'Edit Announcement' : 'New Announcement'}</h3>
            <button onClick={() => setShowForm(false)} style={s.closeBtn}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Title</label>
              <input style={s.input} type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. System Maintenance" required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Message</label>
              <textarea style={s.textarea} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write your announcement message..." rows={4} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Target Audience</label>
              <div style={s.audienceRow}>
                {AUDIENCE_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = form.audience === opt.value;
                  return (
                    <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, audience: opt.value }))}
                      style={{
                        ...s.audienceBtn,
                        borderColor: isSelected ? opt.color : '#E2E8F0',
                        backgroundColor: isSelected ? opt.bg : '#FFF',
                        color: isSelected ? opt.color : '#64748B',
                        boxShadow: isSelected ? `0 0 0 1px ${opt.color}` : 'none',
                      }}>
                      <Icon size={18} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={s.formActions}>
              <button type="button" onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
              <button type="submit" disabled={submitting} style={s.submitBtn}>
                {submitting ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {items.length === 0 ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}><Megaphone size={48} color="#CBD5E1" /></div>
          <h3 style={{ margin: '0 0 8px', color: '#1E293B' }}>No announcements yet</h3>
          <p style={{ margin: '0 0 24px', color: '#94A3B8' }}>Create your first announcement to reach your users.</p>
          <button onClick={openCreate} style={s.emptyBtn}><Plus size={16} /> Create Announcement</button>
        </div>
      ) : (
        <div style={s.list}>
          {items.map(item => {
            const meta = audienceMeta(item.audience);
            const Icon = meta.icon;
            return (
              <div key={item.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={s.cardLeft}>
                    <div style={{ ...s.audienceBadge, backgroundColor: meta.bg, color: meta.color }}>
                      <Icon size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={s.cardTitleRow}>
                        <h4 style={s.cardTitle}>{item.title}</h4>
                        <span style={{
                          ...s.statusBadge,
                          backgroundColor: item.isPublished ? '#ECFDF5' : '#F8FAFC',
                          color: item.isPublished ? '#059669' : '#64748B',
                          borderColor: item.isPublished ? '#A7F3D0' : '#E2E8F0',
                        }}>
                          {item.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                          {item.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p style={s.cardMessage}>{item.message}</p>
                    </div>
                  </div>
                  <div style={s.cardActions}>
                    <button onClick={() => handleTogglePublish(item.id)}
                      title={item.isPublished ? 'Unpublish' : 'Publish'}
                      style={{ ...s.actionBtn, color: item.isPublished ? '#F59E0B' : '#059669' }}>
                      {item.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {item.isPublished && (
                      <button onClick={() => handleResend(item.id)} disabled={resendingId === item.id}
                        title="Resend" style={{ ...s.actionBtn, color: '#6366F1' }}>
                        {resendingId === item.id ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                      </button>
                    )}
                    <button onClick={() => openEdit(item)} title="Edit" style={s.actionBtn}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setConfirmDelete(item.id)} title="Delete"
                      style={{ ...s.actionBtn, color: '#EF4444' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div style={s.cardMeta}>
                  <span style={s.metaItem}>
                    <Icon size={13} /> {meta.label}
                  </span>
                  <span style={s.metaItem}>
                    <Clock size={13} /> {fmtDate(item.createdAt)}
                  </span>
                  {item.publishedAt && (
                    <span style={s.metaItem}>
                      <Send size={13} /> Sent {fmtDate(item.publishedAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
      {confirmDelete && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalIcon}><AlertTriangle size={36} color="#EF4444" /></div>
            <h3 style={{ margin: '0 0 8px', color: '#1E293B' }}>Delete Announcement?</h3>
            <p style={{ margin: '0 0 24px', color: '#64748B', fontSize: '14px' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={s.modalCancel}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={s.modalDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  successBanner: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '12px', backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', marginBottom: '20px', fontSize: '14px', fontWeight: 500 },
  errorBanner: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '12px', backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', marginBottom: '20px', fontSize: '14px', fontWeight: 500 },

  formCard: { padding: '28px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '28px', backgroundColor: '#FFF', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px', borderRadius: '8px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 700, color: '#475569' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '15px', outline: 'none', backgroundColor: '#F8FAFC', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '15px', outline: 'none', backgroundColor: '#F8FAFC', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  audienceRow: { display: 'flex', gap: '12px' },
  audienceBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #E2E8F0', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.15s' },
  formActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #F1F5F9' },
  cancelBtn: { padding: '10px 22px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#FFF', color: '#64748B', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
  submitBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--accent-primary)', color: '#FFF', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },

  emptyState: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { marginBottom: '16px' },
  emptyBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: '10px', backgroundColor: 'var(--accent-primary)', color: '#FFF', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' },

  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { padding: '20px 24px', borderRadius: '14px', border: '1px solid #E2E8F0', backgroundColor: '#FFF', transition: 'box-shadow 0.2s' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' },
  cardLeft: { display: 'flex', gap: '14px', flex: 1, minWidth: 0 },
  audienceBadge: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitleRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' as const },
  cardTitle: { margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, border: '1px solid' },
  cardMessage: { margin: 0, fontSize: '14px', color: '#64748B', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any },
  cardActions: { display: 'flex', gap: '4px', flexShrink: 0 },
  actionBtn: { padding: '7px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' },
  cardMeta: { display: 'flex', alignItems: 'center', gap: '20px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #F1F5F9', fontSize: '13px', color: '#94A3B8' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '5px' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#FFF', padding: '32px', borderRadius: '20px', maxWidth: '400px', width: '90%', textAlign: 'center' as const, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  modalIcon: { marginBottom: '16px' },
  modalCancel: { padding: '11px 24px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#FFF', color: '#64748B', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
  modalDelete: { padding: '11px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#EF4444', color: '#FFF', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
};
