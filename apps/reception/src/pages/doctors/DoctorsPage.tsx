import { UserRound, Loader2, Plus } from 'lucide-react';
import { useDoctorsPage } from './useDoctorsPage';
import { styles } from './styles';
import DoctorCard from './DoctorCard';
import EditDoctorModal from './EditDoctorModal';
import DeleteDoctorModal from './DeleteDoctorModal';
import RegisterDoctorModal from './RegisterDoctorModal';

function DoctorsPage() {
  const {
    doctors, loading, error, page, totalPages, total, saving, registerResult,
    expandedId,
    editDoctor, setEditDoctor, editForm, setEditForm, editError,
    deleteTarget, setDeleteTarget,
    showRegister, setShowRegister, regForm, setRegForm, regError,
    loadDoctors, toggleExpand,
    openEdit, handleEditSubmit, handleDelete, handleRegister, clearRegResult,
  } = useDoctorsPage();

  return (
    <div className="animate-fade" style={styles.container}>
      {/* Header */}
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
          <Plus size={18} /> Register Doctor
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#FEF3F2', color: 'var(--status-error)',
          padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          fontSize: '14px', border: '1px solid #FECDCA', marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-secondary)', gap: '8px' }}>
          <Loader2 size={20} className="spin" /> Loading doctors...
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
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                isExpanded={expandedId === doctor.id}
                onToggle={toggleExpand}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button style={styles.pageBtn(page <= 1)} disabled={page <= 1} onClick={() => loadDoctors(page - 1)}>Previous</button>
              <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button style={styles.pageBtn(page >= totalPages)} disabled={page >= totalPages} onClick={() => loadDoctors(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {editDoctor && (
        <EditDoctorModal
          doctor={editDoctor}
          form={editForm}
          setForm={setEditForm}
          error={editError}
          saving={saving}
          onClose={() => setEditDoctor(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      {deleteTarget && (
        <DeleteDoctorModal
          doctor={deleteTarget}
          saving={saving}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {showRegister && (
        <RegisterDoctorModal
          registerResult={registerResult}
          form={regForm}
          setForm={setRegForm}
          error={regError}
          saving={saving}
          onClose={() => { setShowRegister(false); clearRegResult(); }}
          onSubmit={handleRegister}
        />
      )}
    </div>
  );
}

export default DoctorsPage;
