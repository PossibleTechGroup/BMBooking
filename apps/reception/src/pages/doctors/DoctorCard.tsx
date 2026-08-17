import { useNavigate } from 'react-router-dom';
import { Phone, Mail, ChevronDown, ChevronUp, Edit3, Trash2, Calendar, Check, X } from 'lucide-react';
import type { Doctor } from '../../store/slices/doctorsSlice';
import { styles } from './styles';

interface DoctorCardProps {
  doctor: Doctor;
  isExpanded: boolean;
  onToggle: (d: Doctor) => void;
  onEdit: (d: Doctor) => void;
  onDelete: (d: Doctor) => void;
  onApprove: (d: Doctor) => void;
  onReject: (d: Doctor) => void;
}

function statusLabel(s: string) {
  return s === 'PendingReview' ? 'Pending' : s;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function DoctorCard({
  doctor, isExpanded,
  onToggle, onEdit, onDelete, onApprove, onReject,
}: DoctorCardProps) {
  const navigate = useNavigate();
  const isPending = doctor.status === 'PendingReview';
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader} onClick={() => onToggle(doctor)}>
        {doctor.profilePicture ? (
          <img src={doctor.profilePicture} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={styles.avatar}>{(doctor.fullName || 'D').charAt(0)}</div>
        )}
        <div style={styles.cardBody}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={styles.docName}>{doctor.fullName}</span>
            <span style={styles.statusBadge(doctor.status)}>{statusLabel(doctor.status)}</span>
          </div>
          <span style={styles.docSpec}>{doctor.specialization || 'General Practice'}</span>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
            <div style={styles.contactRow}><Phone size={12} />{doctor.user.phone}</div>
            {doctor.user.email && <div style={styles.contactRow}><Mail size={12} />{doctor.user.email}</div>}
            {isPending && doctor.createdAt && (
              <div style={styles.requestedAt}>Requested {formatDate(doctor.createdAt)}</div>
            )}
          </div>
        </div>
        {isExpanded ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
      </div>

      {isExpanded && (
        <div style={styles.expandArea}>
          {/* Detail grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div><div style={styles.detailLabel}>License Number</div><div style={styles.detailValue}>{doctor.licenseNumber || '—'}</div></div>
            <div><div style={styles.detailLabel}>Experience</div><div style={styles.detailValue}>{doctor.experienceYears ? `${doctor.experienceYears} years` : '—'}</div></div>
            <div><div style={styles.detailLabel}>Specialization</div><div style={styles.detailValue}>{doctor.specialization || 'General Practice'}</div></div>
            <div><div style={styles.detailLabel}>Status</div><div style={styles.detailValue}>{statusLabel(doctor.status)}</div></div>
          </div>

          {doctor.status === 'Rejected' && doctor.rejectionReason && (
            <div style={styles.rejectReason}>
              <strong>Rejection reason:</strong> {doctor.rejectionReason}
            </div>
          )}

          {/* Media */}
          {(doctor.profilePicture || doctor.introVideo) && (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {doctor.profilePicture && (
                <div>
                  <div style={styles.detailLabel}>Profile Photo</div>
                  <img src={doctor.profilePicture} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '12px', marginTop: '4px' }} />
                </div>
              )}
              {doctor.introVideo && (
                <div>
                  <div style={styles.detailLabel}>Intro Video</div>
                  <video src={doctor.introVideo} controls style={{ width: 200, height: 112, borderRadius: '12px', marginTop: '4px', background: '#000' }} />
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

          <div style={styles.actions}>
            {isPending ? (
              <>
                <button style={styles.approveBtn} onClick={() => onApprove(doctor)}><Check size={14} /> Approve</button>
                <button style={styles.rejectBtn} onClick={() => onReject(doctor)}><X size={14} /> Reject</button>
              </>
            ) : (
              <>
                <button style={styles.editBtn} onClick={() => navigate(`/schedules?doctorId=${doctor.id}`)}>
                  <Calendar size={14} /> View Schedule
                </button>
                <button style={styles.editBtn} onClick={() => onEdit(doctor)}><Edit3 size={14} /> Edit</button>
                <button style={styles.deleteBtn} onClick={() => onDelete(doctor)}><Trash2 size={14} /> Remove</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
