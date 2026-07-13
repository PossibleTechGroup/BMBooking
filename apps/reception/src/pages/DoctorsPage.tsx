import { 
  UserRound, 
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  Loader2, 
  X, 
  Plus, 
  CheckCircle, 
  Image as ImageIcon, 
  Video, 
  Trash, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { 
  useDoctorsPage, 
  fmtTime, 
  formatWeekRange, 
  isToday, 
  type Doctor, 
  type ScheduleSlot 
} from './useDoctorsPage';

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1200px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 600, margin: 0 },
  subtitle: { color: 'var(--text-secondary)', fontSize: '15px', marginTop: '2px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'var(--accent-secondary)',
    color: '#FFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '20px',
    flexShrink: 0,
  },
  cardBody: { flex: 1, minWidth: 0 },
  docName: { fontSize: '16px', fontWeight: 600, marginBottom: '2px' },
  docSpec: { fontSize: '13px', color: 'var(--text-secondary)' },
  statusBadge: (status: string) => ({
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '100px',
    background: status === 'Approved' ? '#ECFDF3' : status === 'Rejected' ? '#FEF3F2' : '#FEF7E6',
    color: status === 'Approved' ? '#027A48' : status === 'Rejected' ? '#D92D20' : '#F79009',
  }),
  contactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  expandArea: {
    borderTop: '1px solid var(--border)',
    padding: '16px 20px',
    background: '#F8FAFC',
  },
  scheduleSection: { marginBottom: '12px' },
  scheduleTitle: { fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' },
  slotGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  slot: (filled: boolean, max: number) => ({
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    border: `1px solid ${filled >= max ? '#FECDCA' : '#E2E8F0'}`,
    background: filled >= max ? '#FEF3F2' : '#FFF',
    color: filled >= max ? 'var(--status-error)' : 'var(--text-primary)',
  }),
  actions: { display: 'flex', gap: '8px', marginTop: '12px' },
  editBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)',
    background: '#FFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
  },
  deleteBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '8px', border: '1px solid #FECDCA',
    background: '#FFF', color: 'var(--status-error)', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
  },
  pagination: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
    marginTop: '24px', padding: '16px 0',
  },
  pageBtn: (disabled: boolean) => ({
    padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)',
    background: disabled ? '#F2F4F7' : '#FFF', fontWeight: 600, fontSize: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? 'var(--text-secondary)' : 'var(--text-primary)',
    opacity: disabled ? 0.5 : 1,
  }),
  pageInfo: { fontSize: '14px', color: 'var(--text-secondary)' },
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(16, 24, 40, 0.4)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    width: '500px', maxHeight: '90vh', overflowY: 'auto',
    padding: '32px', background: '#FFF', borderRadius: '16px',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px',
  },
  modalTitle: { fontSize: '20px', fontWeight: 700 },
  label: { display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' },
  input: {
    width: '100%', padding: '10px 14px', fontSize: '15px',
    border: '1px solid var(--border)', borderRadius: '8px', outline: 'none', marginBottom: '16px',
  },
  textarea: {
    width: '100%', padding: '10px 14px', fontSize: '15px',
    border: '1px solid var(--border)', borderRadius: '8px', outline: 'none',
    marginBottom: '16px', minHeight: '80px', resize: 'vertical',
  },
  errorMsg: {
    background: '#FEF3F2', color: 'var(--status-error)',
    padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
    marginBottom: '16px', border: '1px solid #FECDCA',
  },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' },
  emptyState: { textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' },
  detailLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  detailValue: { fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' },
};

export default function DoctorsPage() {
  const {
    doctors,
    loading,
    error,
    page,
    totalPages,
    total,
    saving,
    registerResult,
    expandedId,
    doctorSchedules,
    calendarDate,
    setCalendarDate,
    editDoctor,
    setEditDoctor,
    editForm,
    setEditForm,
    editError,
    deleteTarget,
    setDeleteTarget,
    showRegister,
    setShowRegister,
    regForm,
    setRegForm,
    regError,
    loadDoctors,
    toggleExpand,
    weekDays,
    openEdit,
    handleEditSubmit,
    handleDelete,
    handleRegister,
    handleClearRegisterResult
  } = useDoctorsPage();

  return (
    <div className="animate-fade" style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Doctors</h2>
          <p style={styles.subtitle}>Manage doctors in your hospital ({total} total)</p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 16px', fontSize: '14px', fontWeight: 600,
            border: 'none', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Register Doctor
        </button>
      </div>

      {error && (
        <div style={{
          background: '#FEF3F2', color: 'var(--status-error)',
          padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          fontSize: '14px', border: '1px solid #FECDCA', marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-secondary)', gap: '8px' }}>
          <Loader2 size={20} className="spin" />
          Loading doctors...
        </div>
      ) : doctors.length === 0 ? (
        <div style={styles.emptyState}>
          <UserRound size={48} color="var(--border)" />
          <p style={{ fontSize: '16px', fontWeight: 500, marginTop: '12px' }}>No doctors found</p>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>Register a new doctor to get started.</p>
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {doctors.map((doctor) => {
              const isExpanded = expandedId === doctor.id;
              const docSchedules = doctorSchedules[doctor.id] || [];

              return (
                <div key={doctor.id} style={styles.card}>
                  <div style={styles.cardHeader} onClick={() => toggleExpand(doctor)}>
                    {doctor.profilePicture ? (
                      <img
                        src={doctor.profilePicture}
                        alt=""
                        style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={styles.avatar}>
                        {(doctor.fullName || 'D').charAt(0)}
                      </div>
                    )}
                    <div style={styles.cardBody}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={styles.docName}>{doctor.fullName}</span>
                        <span style={styles.statusBadge(doctor.status)}>{doctor.status}</span>
                      </div>
                      <span style={styles.docSpec}>{doctor.specialization || 'General Practice'}</span>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <div style={styles.contactRow}>
                          <Phone size={12} />
                          {doctor.user.phone}
                        </div>
                        {doctor.user.email && (
                          <div style={styles.contactRow}>
                            <Mail size={12} />
                            {doctor.user.email}
                          </div>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                  </div>

                  {isExpanded && (
                    <div style={styles.expandArea}>
                      {/* Detail grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                          <div style={styles.detailLabel}>License Number</div>
                          <div style={styles.detailValue}>{doctor.licenseNumber || '—'}</div>
                        </div>
                        <div>
                          <div style={styles.detailLabel}>Experience</div>
                          <div style={styles.detailValue}>{doctor.experienceYears ? `${doctor.experienceYears} years` : '—'}</div>
                        </div>
                        <div>
                          <div style={styles.detailLabel}>Specialization</div>
                          <div style={styles.detailValue}>{doctor.specialization || 'General Practice'}</div>
                        </div>
                        <div>
                          <div style={styles.detailLabel}>Status</div>
                          <div style={styles.detailValue}>{doctor.status}</div>
                        </div>
                      </div>

                      {/* Profile picture + intro video */}
                      {(doctor.profilePicture || doctor.introVideo) && (
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                          {doctor.profilePicture && (
                            <div>
                              <div style={styles.detailLabel}>Profile Photo</div>
                              <img
                                src={doctor.profilePicture}
                                alt=""
                                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '12px', marginTop: '4px' }}
                              />
                            </div>
                          )}
                          {doctor.introVideo && (
                            <div>
                              <div style={styles.detailLabel}>Intro Video</div>
                              <video
                                src={doctor.introVideo}
                                controls
                                style={{ width: 200, height: 112, borderRadius: '12px', marginTop: '4px', background: '#000' }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bio */}
                      {doctor.bio && (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={styles.detailLabel}>Bio</div>
                          <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0' }}>{doctor.bio}</p>
                        </div>
                      )}

                      {/* Week calendar */}
                      <div style={styles.scheduleSection}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={styles.scheduleTitle}>Weekly Schedule</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              onClick={() => {
                                const d = new Date(calendarDate);
                                d.setDate(d.getDate() - 7);
                                setCalendarDate(d);
                              }}
                              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', minWidth: 120, textAlign: 'center' }}>{formatWeekRange(weekDays)}</span>
                            <button
                              onClick={() => {
                                const d = new Date(calendarDate);
                                d.setDate(d.getDate() + 7);
                                setCalendarDate(d);
                              }}
                              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <ChevronRight size={14} />
                            </button>
                            <button
                              onClick={() => setCalendarDate(new Date())}
                              style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: '#FFF', cursor: 'pointer', fontWeight: 500, fontSize: '11px' }}
                            >
                              Today
                            </button>
                          </div>
                        </div>

                        {/* Day columns */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                          {weekDays.map((day, dayIdx) => {
                            const key = day.toISOString().slice(0, 10);
                            const daySchedules = docSchedules.filter((s) => s.date?.slice(0, 10) === key);
                            const isTodayDay = isToday(day);
                            return (
                              <div key={dayIdx} style={{
                                border: `1px solid ${isTodayDay ? 'var(--accent-primary)' : 'var(--border)'}`,
                                borderRadius: 8, padding: '6px', minHeight: 80,
                                background: isTodayDay ? '#EFF6FF' : '#FFF',
                              }}>
                                <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: isTodayDay ? 700 : 500, color: isTodayDay ? 'var(--accent-primary)' : 'var(--text-secondary)', marginBottom: '4px' }}>
                                  <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                  <div style={{ fontSize: '15px' }}>{day.getDate()}</div>
                                </div>
                                {daySchedules.length === 0 ? (
                                  <p style={{ fontSize: '10px', color: '#CBD5E1', textAlign: 'center', margin: '12px 0' }}>—</p>
                                ) : (
                                  daySchedules.map((sched) => (
                                    <div key={sched.id} style={{ marginBottom: '4px', padding: '4px 6px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                                        {fmtTime(sched.startTime)}–{fmtTime(sched.endTime)}
                                      </div>
                                      <div style={styles.slotGrid}>
                                        {(sched.slots || []).map((slot) => {
                                          const filled = slot._count.bookings;
                                          const max = slot.maxPatients;
                                          return (
                                            <span key={slot.id} style={{
                                              ...styles.slot(filled, max),
                                              padding: '2px 6px', fontSize: '10px',
                                            }}>
                                              {fmtTime(slot.startTime)} ({filled}/{max})
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div style={styles.actions}>
                        <button style={styles.editBtn} onClick={() => openEdit(doctor)}>
                          <Edit3 size={14} /> Edit
                        </button>
                        <button style={styles.deleteBtn} onClick={() => setDeleteTarget(doctor)}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={styles.pageBtn(page <= 1)}
                disabled={page <= 1}
                onClick={() => loadDoctors(page - 1)}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button
                style={styles.pageBtn(page >= totalPages)}
                disabled={page >= totalPages}
                onClick={() => loadDoctors(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editDoctor && (
        <div style={styles.overlay} onClick={() => setEditDoctor(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Doctor</h3>
              <button onClick={() => setEditDoctor(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            {editError && <div style={styles.errorMsg}>{editError}</div>}
            <form onSubmit={handleEditSubmit}>
              <label style={styles.label}>Full Name</label>
              <input style={styles.input} value={editForm.fullName} onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))} required />

              <label style={styles.label}>Specialization</label>
              <input style={styles.input} value={editForm.specialization} onChange={(e) => setEditForm((p) => ({ ...p, specialization: e.target.value }))} />

              <label style={styles.label}>License Number</label>
              <input style={styles.input} value={editForm.licenseNumber} onChange={(e) => setEditForm((p) => ({ ...p, licenseNumber: e.target.value }))} />

              <label style={styles.label}>Experience (years)</label>
              <input style={styles.input} type="number" value={editForm.experienceYears} onChange={(e) => setEditForm((p) => ({ ...p, experienceYears: e.target.value }))} />

              <label style={styles.label}>Bio</label>
              <textarea style={styles.textarea} value={editForm.bio} onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))} />

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setEditDoctor(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer', background: '#FFF' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', background: 'var(--accent-primary)', color: '#FFF', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div style={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div style={{ ...styles.modal, width: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Remove Doctor</h3>
              <button onClick={() => setDeleteTarget(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#475569', marginBottom: '24px' }}>
              Are you sure you want to remove <strong>{deleteTarget.fullName}</strong> from your hospital?
              They will be unassigned and won't appear in schedules.
            </p>
            <div style={styles.modalActions}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer', background: '#FFF' }}>Cancel</button>
              <button onClick={handleDelete} disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', background: 'var(--status-error)', color: '#FFF', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div style={styles.overlay} onClick={() => { setShowRegister(false); handleClearRegisterResult(); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Register New Doctor</h3>
              <button onClick={() => { setShowRegister(false); handleClearRegisterResult(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {registerResult ? (
              <div>
                <div style={{
                  background: '#ECFDF3', color: '#027A48', padding: '16px', borderRadius: '8px',
                  fontSize: '14px', border: '1px solid #A6F4C5', textAlign: 'center',
                }}>
                  <CheckCircle size={24} style={{ marginBottom: '8px' }} />
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>Doctor registered successfully!</p>
                  <p style={{ fontSize: '13px', marginBottom: 0 }}>
                    Status: <strong>Pending Review</strong> — awaiting admin approval.
                  </p>
                </div>
                <div style={styles.modalActions}>
                  <button onClick={() => { setShowRegister(false); handleClearRegisterResult(); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', background: 'var(--accent-primary)', color: '#FFF' }}>Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister}>
                {regError && <div style={styles.errorMsg}>{regError}</div>}

                <label style={styles.label}>Full Name *</label>
                <input style={styles.input} value={regForm.fullName} onChange={(e) => setRegForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="John Doe" required />

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
                    value={regForm.phone.replace(/[^0-9]/g, '').slice(0, 9)}
                    onChange={(e) => setRegForm((p) => ({ ...p, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 9) }))}
                    required
                  />
                </div>

                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" value={regForm.email} onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))} placeholder="doctor@example.com" />

                <label style={styles.label}>Specialization</label>
                <input style={styles.input} value={regForm.specialization} onChange={(e) => setRegForm((p) => ({ ...p, specialization: e.target.value }))} placeholder="Cardiology" />

                <label style={styles.label}>License Number</label>
                <input style={styles.input} value={regForm.licenseNumber} onChange={(e) => setRegForm((p) => ({ ...p, licenseNumber: e.target.value }))} placeholder="LIC-12345" />

                <label style={styles.label}>Experience (years)</label>
                <input style={styles.input} type="number" value={regForm.experienceYears} onChange={(e) => setRegForm((p) => ({ ...p, experienceYears: e.target.value }))} placeholder="5" />

                <label style={styles.label}>Bio</label>
                <textarea style={styles.textarea} value={regForm.bio} onChange={(e) => setRegForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Brief professional background..." />

                <label style={styles.label}>Profile Picture</label>
                <div
                  onClick={() => document.getElementById('reg-profile-pic')?.click()}
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: '12px',
                    padding: regForm.profilePicture ? '16px' : '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    background: regForm.profilePicture ? '#F8FAFC' : 'transparent',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <input
                    id="reg-profile-pic"
                    type="file"
                    accept="image/jpeg,image/png"
                    style={{ display: 'none' }}
                    onChange={(e) => setRegForm((p) => ({ ...p, profilePicture: e.target.files?.[0] || null }))}
                  />
                  {regForm.profilePicture ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={URL.createObjectURL(regForm.profilePicture)}
                        alt="Preview"
                        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '12px', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setRegForm((p) => ({ ...p, profilePicture: null })); }}
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
                  onClick={() => document.getElementById('reg-intro-video')?.click()}
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: '12px',
                    padding: regForm.introVideo ? '16px' : '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    background: regForm.introVideo ? '#F8FAFC' : 'transparent',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <input
                    id="reg-intro-video"
                    type="file"
                    accept="video/mp4,video/quicktime"
                    style={{ display: 'none' }}
                    onChange={(e) => setRegForm((p) => ({ ...p, introVideo: e.target.files?.[0] || null }))}
                  />
                  {regForm.introVideo ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: '10px',
                            background: '#F1F5F9', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Video size={24} color="var(--accent-primary)" />
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {regForm.introVideo.name}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {(regForm.introVideo.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setRegForm((p) => ({ ...p, introVideo: null })); }}
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
                      <Video size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Click to upload intro video</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px' }}>MP4 or MOV, up to 50MB</p>
                    </div>
                  )}
                </div>

                <div style={styles.modalActions}>
                  <button type="button" onClick={() => setShowRegister(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer', background: '#FFF' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', background: 'var(--accent-primary)', color: '#FFF', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {saving ? 'Registering...' : 'Register Doctor'}
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
