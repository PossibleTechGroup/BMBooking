import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { fetchAllDoctors, reviewDoctor, deleteDoctor } from '../store/slices/doctorSlice';
import { assetUrl } from '../config/env';
import { 
  Users, 
  Star, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Mail, 
  Phone,
  Stethoscope,
  MessageSquare,
  Trash2
} from 'lucide-react';

export const DoctorsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { doctors, loading } = useSelector((state: RootState) => state.doctors);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchAllDoctors());
  }, [dispatch]);

  const handleStatusChange = (id: number, status: string) => {
    dispatch(reviewDoctor({ doctorId: id, status }));
  };

  const handleDelete = (id: number) => {
    setConfirmDelete(id);
  };

  const confirmDeleteDoctor = () => {
    if (confirmDelete !== null) {
      dispatch(deleteDoctor(confirmDelete));
      setConfirmDelete(null);
    }
  };

  const filteredDoctors = (doctors || []).filter(doctor => {
    const matchesSearch = doctor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = doctor.rating >= minRating;
    return matchesSearch && matchesRating;
  });

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Physician Directory</h2>
          <p style={styles.subtitle}>Review and manage medical professional profiles and ratings.</p>
        </div>
      </div>

      <div style={styles.filterSection}>
        <div style={styles.searchBar}>
          <Search size={18} color="#64748B" />
          <input 
            placeholder="Search doctors or specialities..." 
            style={styles.searchInput}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={styles.ratingFilter}>
          <Filter size={16} color="#64748B" />
          <span style={{ fontSize: 14, color: '#475569', fontWeight: '600' }}>Min Rating:</span>
          {[0, 3, 4, 4.5].map(val => (
            <button 
              key={val}
              onClick={() => setMinRating(val)}
              style={{
                ...styles.filterBtn,
                backgroundColor: minRating === val ? '#0F172A' : '#FFF',
                color: minRating === val ? '#FFF' : '#64748B'
              }}
            >
              {val === 0 ? 'All' : `${val}+ ⭐`}
            </button>
          ))}
        </div>
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#64748B', padding: '40px' }}>Loading doctors...</p>}

      <div style={styles.grid}>
        {filteredDoctors.map(doctor => (
          <div key={doctor.id} style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.avatar}>
                {doctor.profilePicture ? (
                  <img src={assetUrl(doctor.profilePicture)} style={styles.img} alt="" />
                ) : (
                  <Users size={24} color="#64748B" />
                )}
              </div>
              <div style={{ flex: 1, marginLeft: 16 }}>
                <h4 style={styles.doctorName}>{doctor.fullName}</h4>
                <div style={styles.specBadge}>
                  <Stethoscope size={12} /> {doctor.specialization}
                </div>
              </div>
              <div style={styles.ratingBox}>
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <span style={styles.ratingVal}>{doctor.rating?.toFixed(1)}</span>
                <span style={styles.reviewCount}>({doctor.totalReviews} reviews)</span>
              </div>
            </div>

            <div style={styles.cardMid}>
              <div style={styles.infoRow}>
                <Mail size={14} color="#94A3B8" />
                <span>{doctor.user?.email}</span>
              </div>
              <div style={styles.infoRow}>
                <Phone size={14} color="#94A3B8" />
                <span>{doctor.user?.phone}</span>
              </div>
              <div style={styles.infoRow}>
                <MessageSquare size={14} color="#94A3B8" />
                <span style={{ color: '#3B82F6', fontWeight: '600' }}>Recent Reviews:</span>
              </div>
              {doctor.reviews?.length > 0 ? (
                <p style={styles.latestReview}>
                  "{doctor.reviews[0].comment?.substring(0, 80)}..."
                </p>
              ) : (
                <p style={styles.noReview}>No reviews yet.</p>
              )}
            </div>

            <div style={styles.cardBot}>
              <div style={{...styles.status, color: doctor.status === 'Approved' ? '#059669' : doctor.status === 'Rejected' ? '#DC2626' : '#D97706'}}>
                {doctor.status === 'Approved' ? <CheckCircle size={14} /> : doctor.status === 'Rejected' ? <XCircle size={14} /> : <Filter size={14} />}
                {doctor.status}
              </div>
              <div style={styles.actions}>
                {doctor.status === 'PendingReview' && (
                  <>
                    <button 
                      style={{...styles.actionBtn, backgroundColor: '#ECFDF5', color: '#059669'}}
                      onClick={() => handleStatusChange(doctor.id, 'Approved')}
                    >
                      Approve
                    </button>
                    <button 
                      style={{...styles.actionBtn, backgroundColor: '#FEF2F2', color: '#DC2626'}}
                      onClick={() => handleStatusChange(doctor.id, 'Rejected')}
                    >
                      Reject
                    </button>
                  </>
                )}
                <button 
                  style={{...styles.actionBtn, backgroundColor: '#FEF2F2', color: '#DC2626'}}
                  onClick={() => handleDelete(doctor.id)}
                  title="Delete doctor"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {confirmDelete !== null && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Delete Doctor</h3>
            <p style={styles.modalText}>
              Are you sure you want to delete this doctor? This action cannot be undone and will remove all associated data (appointments, reviews, wallet, etc.).
            </p>
            <div style={styles.modalActions}>
              <button 
                style={{...styles.modalBtn, backgroundColor: '#E2E8F0', color: '#475569'}}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button 
                style={{...styles.modalBtn, backgroundColor: '#DC2626', color: '#FFF'}}
                onClick={confirmDeleteDoctor}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '32px' },
  title: { fontSize: '24px', fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: '14px', color: '#64748B' },
  filterSection: { display: 'flex', gap: '20px', marginBottom: '32px', alignItems: 'center' },
  searchBar: { flex: 1, height: '48px', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px', backgroundColor: '#FFF' },
  searchInput: { border: 'none', outline: 'none', flex: 1, fontSize: '15px' },
  ratingFilter: { display: 'flex', alignItems: 'center', gap: '10px' },
  filterBtn: { padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' },
  card: { backgroundColor: '#FFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  cardTop: { display: 'flex', alignItems: 'center' },
  avatar: { width: '52px', height: '52px', borderRadius: '14px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  doctorName: { fontSize: '17px', fontWeight: '700', color: '#1E293B' },
  specBadge: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3B82F6', fontWeight: '600', marginTop: '4px' },
  ratingBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  ratingVal: { fontSize: '18px', fontWeight: '800', color: '#1E293B' },
  reviewCount: { fontSize: '11px', color: '#94A3B8' },
  cardMid: { padding: '16px 0', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '10px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569' },
  latestReview: { fontSize: '13px', color: '#64748B', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '10px', marginTop: '4px' },
  noReview: { fontSize: '12px', color: '#94A3B8', marginTop: '4px' },
  cardBot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  status: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' },
  actions: { display: 'flex', gap: '8px', alignItems: 'center' },
  actionBtn: { padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#FFF', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '90%' },
  modalTitle: { fontSize: '20px', fontWeight: '700', color: '#0F172A', marginBottom: '12px' },
  modalText: { fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  modalBtn: { padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
};
