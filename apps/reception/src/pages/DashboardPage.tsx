import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Stethoscope, Wrench, Building2, UserPlus, Clock, X, Loader2, CheckCircle, Image as ImageIcon, Video as VideoIcon, Trash, CreditCard, BadgeCheck, CalendarCheck, Bell, UsersRound, FileText } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { registerDoctor, clearRegisterResult } from '../store/slices/doctorsSlice';
import { fetchDashboardStats } from '../store/slices/dashboardSlice';
import { useTimeFormat, setTimeFormat, setCalendarFormat } from '../utils/timeFormat';

const styles: Record<string, CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
    maxWidth: '900px',
  },
  card: {
    padding: '24px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardIcon: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  cardDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(16, 24, 40, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    width: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '32px',
    backgroundColor: '#FFF',
    borderRadius: '16px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '6px',
    color: 'var(--text-primary)',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '15px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    outline: 'none',
    marginBottom: '16px',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '15px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    outline: 'none',
    marginBottom: '16px',
    minHeight: '80px',
    resize: 'vertical',
  },
  errorMsg: {
    background: '#FEF3F2',
    color: 'var(--status-error)',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
    border: '1px solid #FECDCA',
  },
  successMsg: {
    background: '#ECFDF3',
    color: '#027A48',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '14px',
    border: '1px solid #A6F4C5',
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  priorityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  priorityCard: {
    padding: '20px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  priorityValue: {
    fontFamily: 'var(--font-heading)',
    fontSize: '30px',
    fontWeight: 700,
    lineHeight: 1.1,
  },
  priorityLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  previewPanel: {
    padding: '20px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '24px',
  },
  previewRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
  },
};

const cards = [
  {
    icon: Calendar,
    color: '#1E5A8A',
    title: 'Schedules',
    desc: 'View and manage daily appointment schedules for all doctors.',
    to: '/schedules',
  },
  {
    icon: Stethoscope,
    color: '#175CD3',
    title: 'Appointments',
    desc: 'Approve or decline pending appointment requests.',
    to: '/appointments',
  },
  {
    icon: Wrench,
    color: '#B54708',
    title: 'Equipment',
    desc: 'Manage equipment booking requests.',
    to: '/equipment',
  },
  {
    icon: Building2,
    color: '#027A48',
    title: 'Hospital',
    desc: 'View facility details and update visit card price (ETB).',
    to: '/hospital',
  },
  {
    icon: UserPlus,
    color: '#6941C6',
    title: 'Register Doctor',
    desc: 'Add a new doctor to your hospital (pending admin approval).',
    onClick: true,
  },
];

function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { saving: registerLoading, registerResult: registerSuccess, error: registerError } = useSelector((state: RootState) => state.doctors);
  const { stats: dashStats } = useSelector((state: RootState) => state.dashboard);
  const { isEthiopian, isEthiopianCalendar } = useTimeFormat();
  const [showTimePopover, setShowTimePopover] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [localRegisterError, setLocalRegisterError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    specialization: '',
    licenseNumber: '',
    experienceYears: '',
    bio: '',
    profilePicture: null as File | null,
    introVideo: null as File | null,
  });

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setLocalRegisterError('');
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) return;
    setLocalRegisterError('');

    const fd = new FormData();
    fd.append('fullName', form.fullName);
    fd.append('phone', `+251${form.phone}`);
    if (form.email) fd.append('email', form.email);
    if (form.specialization) fd.append('specialization', form.specialization);
    if (form.licenseNumber) fd.append('licenseNumber', form.licenseNumber);
    if (form.experienceYears) fd.append('experienceYears', form.experienceYears);
    if (form.bio) fd.append('bio', form.bio);
    if (form.profilePicture) fd.append('profilePicture', form.profilePicture);
    if (form.introVideo) fd.append('introVideo', form.introVideo);
    try {
      await dispatch(registerDoctor(fd)).unwrap();
      setForm({ fullName: '', phone: '', email: '', specialization: '', licenseNumber: '', experienceYears: '', bio: '', profilePicture: null, introVideo: null });
    } catch (err) {
      setLocalRegisterError(typeof err === 'string' ? err : 'Registration failed');
    }
  };

  const handleCardClick = (card: typeof cards[0]) => {
    if ('onClick' in card && card.onClick) {
      setShowRegisterModal(true);
    } else if ('to' in card && card.to) {
      navigate(card.to);
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 600, margin: 0 }}>
            Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '4px 0 0' }}>
            Select a module to get started
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowTimePopover(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px', borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${isEthiopian ? '#7C3AED' : 'var(--accent-primary)'}`,
              background: isEthiopian ? '#F3E8FF' : '#EFF6FF',
              cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              color: isEthiopian ? '#7C3AED' : 'var(--accent-primary)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '0.8'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '1'; }}
          >
            <Clock size={16} color={isEthiopian ? '#7C3AED' : 'var(--accent-primary)'} />
            {isEthiopian ? 'ቀን/ሌሊት' : 'AM/PM'} · {isEthiopianCalendar ? 'Eth. cal' : 'Greg.'}
          </button>

          {showTimePopover && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setShowTimePopover(false)} />
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 10,
                background: '#fff', borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                border: '1px solid var(--border)', padding: 4, minWidth: 220,
              }}>
                <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Time
                </div>
                <div
                  onClick={() => { setTimeFormat('western'); setShowTimePopover(false); }}
                  style={{
                    padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                    background: !isEthiopian ? '#EFF6FF' : 'transparent',
                    color: !isEthiopian ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: !isEthiopian ? 600 : 400,
                  }}
                >
                  Standard (AM/PM)
                </div>
                <div
                  onClick={() => { setTimeFormat('ethiopian'); setShowTimePopover(false); }}
                  style={{
                    padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                    background: isEthiopian ? '#F3E8FF' : 'transparent',
                    color: isEthiopian ? '#7C3AED' : 'var(--text-secondary)',
                    fontWeight: isEthiopian ? 600 : 400,
                  }}
                >
                  Ethiopian (ቀን/ሌሊት)
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Calendar
                </div>
                <div
                  onClick={() => { setCalendarFormat('gregorian'); setShowTimePopover(false); }}
                  style={{
                    padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                    background: !isEthiopianCalendar ? '#EFF6FF' : 'transparent',
                    color: !isEthiopianCalendar ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: !isEthiopianCalendar ? 600 : 400,
                  }}
                >
                  Gregorian
                </div>
                <div
                  onClick={() => { setCalendarFormat('ethiopian'); setShowTimePopover(false); }}
                  style={{
                    padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                    background: isEthiopianCalendar ? '#F3E8FF' : 'transparent',
                    color: isEthiopianCalendar ? '#7C3AED' : 'var(--text-secondary)',
                    fontWeight: isEthiopianCalendar ? 600 : 400,
                  }}
                >
                  Ethiopian
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {dashStats && (
        <>
          <div
            onClick={() => navigate('/appointments')}
            style={{
              ...styles.grid,
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              marginBottom: '28px',
            }}
          >
            <div style={styles.priorityCard}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: '#175CD314', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarCheck size={20} color="#175CD3" />
              </div>
              <span style={styles.priorityValue}>{dashStats.todaysAppointments}</span>
              <span style={styles.priorityLabel}>Today's Appointments</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {dashStats.todaysApprovedAppointments} approved today
              </span>
            </div>
            <div
              onClick={() => navigate('/appointments')}
              style={styles.priorityCard}
            >
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: '#B5470814', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UsersRound size={20} color="#B54708" />
              </div>
              <span style={styles.priorityValue}>{dashStats.pendingBookings}</span>
              <span style={styles.priorityLabel}>Pending Bookings</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                of {dashStats.totalBookings} total
              </span>
            </div>
            <div
              onClick={() => navigate('/hospital')}
              style={styles.priorityCard}
            >
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: '#027A4814', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={20} color="#027A48" />
              </div>
              <span style={styles.priorityValue}>{dashStats.cardPackages.active}</span>
              <span style={styles.priorityLabel}>Active Cards</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {dashStats.cardPackages.expired} expired
              </span>
            </div>
            <div
              onClick={() => navigate('/hospital')}
              style={styles.priorityCard}
            >
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: '#6941C614', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BadgeCheck size={20} color="#6941C6" />
              </div>
              <span style={styles.priorityValue}>{dashStats.visitingCards.length}</span>
              <span style={styles.priorityLabel}>Visiting Cards</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                recent issuances
              </span>
            </div>
            <div
              onClick={() => navigate('/notifications')}
              style={styles.priorityCard}
            >
              <div style={{ position: 'absolute', top: 16, right: 16 }}>
                <Bell size={18} color="#98A2B3" />
                {dashStats.unreadNotifications > 0 && (
                  <span style={{
                    position: 'absolute', top: -8, right: -8, minWidth: 18, height: 18,
                    borderRadius: '50%', background: 'var(--status-error)', color: '#FFF',
                    fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: '0 4px',
                  }}>
                    {dashStats.unreadNotifications > 99 ? '99+' : dashStats.unreadNotifications}
                  </span>
                )}
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: '#06305B14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} color="#06305B" />
              </div>
              <span style={styles.priorityValue}>{dashStats.unreadNotifications}</span>
              <span style={styles.priorityLabel}>Notifications</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>unread alerts</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
            <div style={styles.previewPanel}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 600, margin: 0 }}>Card Packages</h3>
                <button
                  onClick={() => navigate('/hospital')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Manage
                </button>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                {dashStats.cardPackages.templates.length} templates · {dashStats.cardPackages.active} active · {dashStats.cardPackages.expired} expired
              </p>
              {dashStats.cardPackages.templates.slice(0, 4).map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{t.name}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>ETB {Number(t.price).toLocaleString()}</span>
                </div>
              ))}
              {dashStats.cardPackages.templates.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0' }}>No card packages configured yet.</p>
              )}
            </div>

            <div style={styles.previewPanel}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 600, margin: 0 }}>Recent Visiting Cards</h3>
                <button
                  onClick={() => navigate('/hospital')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  View all
                </button>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                Latest card issuances
              </p>
              {dashStats.visitingCards.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0' }}>No visiting cards issued yet.</p>
              )}
              {dashStats.visitingCards.slice(0, 4).map((vc) => (
                <div key={vc.id} style={styles.previewRow}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {vc.patient?.patientProfile?.fullName || vc.patient?.phone || 'Unknown patient'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(vc.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <BadgeCheck size={18} color="#027A48" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div style={styles.grid}>
        {cards.map((card) => (
          <div key={card.title} style={styles.card} onClick={() => handleCardClick(card)}>
            <div style={{ ...styles.cardIcon, background: `${card.color}14` }}>
              <card.icon size={22} color={card.color} />
            </div>
            <span style={styles.cardTitle}>{card.title}</span>
            <span style={styles.cardDesc}>{card.desc}</span>
          </div>
        ))}
      </div>
      {showRegisterModal && (
        <div style={styles.overlay} onClick={() => setShowRegisterModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Register New Doctor</h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {registerSuccess ? (
              <div>
                <div style={styles.successMsg}>
                  <CheckCircle size={24} style={{ marginBottom: '8px' }} />
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>Doctor registered successfully!</p>
                  <p style={{ fontSize: '13px', marginBottom: '8px' }}>
                    Status: <strong>Pending Review</strong> — awaiting admin approval.
                  </p>
                  <p style={{ fontSize: '13px' }}>
                    Temp password: <code style={{ background: '#D0F0FD', padding: '2px 6px', borderRadius: '4px' }}>{registerSuccess.tempPassword}</code>
                  </p>
                </div>
                <div style={styles.actions}>
                  <button
                    onClick={() => { setShowRegisterModal(false); dispatch(clearRegisterResult()); }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: 'var(--accent-primary)',
                      color: '#FFF',
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister}>
                {(registerError || localRegisterError) && <div style={styles.errorMsg}>{localRegisterError || registerError}</div>}

                <label style={styles.label}>Full Name *</label>
                <input
                  style={styles.input}
                  value={form.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="John Doe"
                  required
                />

                <label style={styles.label}>Phone *</label>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  overflow: 'hidden', marginBottom: '16px',
                }}>
                  <span style={{
                    padding: '0 12px', fontSize: 14, fontWeight: 600,
                    color: '#334155', background: '#F1F5F9', height: 44,
                    display: 'flex', alignItems: 'center',
                    borderRight: '1px solid var(--border)',
                  }}>+251</span>
                  <input
                    placeholder="XX XXX XXXX"
                    type="tel"
                    style={{
                      flex: 1, height: 44, border: 'none',
                      padding: '0 12px', fontSize: 15, outline: 'none',
                    }}
                    value={form.phone.replace(/[^0-9]/g, '').slice(0, 9)}
                    onChange={(e) => handleChange('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
                    required
                  />
                </div>

                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="doctor@example.com"
                />

                <label style={styles.label}>Specialization</label>
                <input
                  style={styles.input}
                  value={form.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  placeholder="Cardiology"
                />

                <label style={styles.label}>License Number</label>
                <input
                  style={styles.input}
                  value={form.licenseNumber}
                  onChange={(e) => handleChange('licenseNumber', e.target.value)}
                  placeholder="LIC-12345"
                />

                <label style={styles.label}>Experience (years)</label>
                <input
                  style={styles.input}
                  type="number"
                  value={form.experienceYears}
                  onChange={(e) => handleChange('experienceYears', e.target.value)}
                  placeholder="5"
                />

                <label style={styles.label}>Bio</label>
                <textarea
                  style={styles.textarea}
                  value={form.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Brief professional background..."
                />

                <label style={styles.label}>Profile Picture</label>
                <div
                  onClick={() => document.getElementById('dash-profile-pic')?.click()}
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: '12px',
                    padding: form.profilePicture ? '16px' : '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    background: form.profilePicture ? '#F8FAFC' : 'transparent',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <input
                    id="dash-profile-pic"
                    type="file"
                    accept="image/jpeg,image/png"
                    style={{ display: 'none' }}
                    onChange={(e) => setForm((p) => ({ ...p, profilePicture: e.target.files?.[0] || null }))}
                  />
                  {form.profilePicture ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={URL.createObjectURL(form.profilePicture)}
                        alt="Preview"
                        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '12px', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, profilePicture: null })); }}
                        style={{
                          position: 'absolute', top: '-8px', right: '-8px',
                          width: 24, height: 24, borderRadius: '50%', border: 'none',
                          background: 'var(--status-error)', color: '#FFF', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)' }}>
                      <ImageIcon size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Click to upload profile picture</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px' }}>JPEG or PNG, up to 10MB</p>
                    </div>
                  )}
                </div>

                <label style={styles.label}>Intro Video</label>
                <div
                  onClick={() => document.getElementById('dash-intro-video')?.click()}
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: '12px',
                    padding: form.introVideo ? '16px' : '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    background: form.introVideo ? '#F8FAFC' : 'transparent',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <input
                    id="dash-intro-video"
                    type="file"
                    accept="video/mp4,video/quicktime"
                    style={{ display: 'none' }}
                    onChange={(e) => setForm((p) => ({ ...p, introVideo: e.target.files?.[0] || null }))}
                  />
                  {form.introVideo ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: '10px',
                            background: '#F1F5F9', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', flexShrink: 0,
                          }}>
                            <VideoIcon size={24} color="var(--accent-primary)" />
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {form.introVideo.name}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {(form.introVideo.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, introVideo: null })); }}
                          style={{
                            padding: '6px 12px', borderRadius: '6px', border: '1px solid #FECDCA',
                            background: '#FFF', color: 'var(--status-error)', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          <Trash size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)' }}>
                      <VideoIcon size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Click to upload intro video</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px' }}>MP4 or MOV, up to 50MB</p>
                    </div>
                  )}
                </div>

                <div style={styles.actions}>
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: '#FFF',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registerLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 600,
                      cursor: registerLoading ? 'not-allowed' : 'pointer',
                      background: 'var(--accent-primary)',
                      color: '#FFF',
                      opacity: registerLoading ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {registerLoading && <Loader2 size={16} className="animate-spin" />}
                    {registerLoading ? 'Registering...' : 'Register Doctor'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
