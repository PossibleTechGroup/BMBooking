'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import {
  Star,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/ethiopianDate';
import { adminPageStyles } from '@/lib/adminStyles';
import { AdminPageHeader } from '@/components/admin/page-header';

interface Review {
  id: number;
  doctorId: number;
  rating: number;
  comment: string;
  createdAt: string;
  doctor: {
    fullName: string;
    specialization: string;
  };
  patient: {
    patientProfile: {
      fullName: string;
    };
  };
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await api.get('/admin/doctors');

      const allReviews: Review[] = [];
      response.data.data.forEach((doctor: any) => {
        if (doctor.reviews) {
          doctor.reviews.forEach((rev: any) => {
            allReviews.push({
              ...rev,
              doctor: {
                fullName: doctor.fullName,
                specialization: doctor.specialization,
              },
            });
          });
        }
      });

      allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(allReviews);
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(
    (rev) =>
      rev.doctor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.patient.patientProfile.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={adminPageStyles.page}>
      <AdminPageHeader
        icon={Star}
        title="Global Ratings & Reviews"
        subtitle="Monitor all patient feedback across the platform."
        actions={
          <div style={adminPageStyles.searchWrap}>
            <input
              placeholder="Filter by doctor, patient or comment..."
              style={adminPageStyles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        }
      />

      {loading ? (
        <div style={styles.loading}>Loading feedback feed...</div>
      ) : (
        <div style={styles.feed}>
          {filteredReviews.length === 0 ? (
            <div style={styles.empty}>No reviews found.</div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="paper-card" style={styles.reviewCard}>
                <div style={styles.reviewHeader}>
                  <div style={styles.patientInfo}>
                    <div style={styles.avatar}>
                      {review.patient.patientProfile.fullName[0]}
                    </div>
                    <div>
                      <h4 style={styles.patientName}>{review.patient.patientProfile.fullName}</h4>
                      <p style={styles.date}>{formatDate(new Date(review.createdAt), 'medium')}</p>
                    </div>
                  </div>
                  <div style={styles.ratingBox}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < review.rating ? '#F59E0B' : 'transparent'}
                        color={i < review.rating ? '#F59E0B' : '#CBD5E1'}
                      />
                    ))}
                  </div>
                </div>

                <div style={styles.reviewBody}>
                  <MessageSquare size={16} color="#94A3B8" style={{ marginTop: 4 }} />
                  <p style={styles.comment}>&ldquo;{review.comment}&rdquo;</p>
                </div>

                <div style={styles.reviewFooter}>
                  <div style={styles.doctorTag}>
                    <span style={styles.tagLabel}>Feedback for:</span>
                    <span style={styles.doctorName}>{review.doctor.fullName}</span>
                    <span style={styles.doctorSpec}>{review.doctor.specialization}</span>
                  </div>
                  <button
                    style={styles.viewDocBtn}
                    onClick={() => router.push(`/admin/doctor-profile/${review.doctorId}`)}
                  >
                    View Profile <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  feed: { display: 'flex', flexDirection: 'column', gap: '24px' },
  reviewCard: { padding: '24px' },
  reviewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  patientInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#334155' },
  patientName: { fontSize: '15px', fontWeight: '700', color: '#1E293B', margin: 0 },
  date: { fontSize: '12px', color: '#94A3B8', margin: 0 },
  ratingBox: { display: 'flex', gap: '2px' },
  reviewBody: { display: 'flex', gap: '12px', marginBottom: '20px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' },
  comment: { fontSize: '15px', color: '#334155', lineHeight: '1.6', fontStyle: 'italic', margin: 0 },
  reviewFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #F1F5F9' },
  doctorTag: { display: 'flex', alignItems: 'center', gap: '8px' },
  tagLabel: { fontSize: '12px', color: '#64748B' },
  doctorName: { fontSize: '13px', fontWeight: '700', color: '#0F172A' },
  doctorSpec: { fontSize: '11px', fontWeight: '600', color: '#3B82F6', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '100px' },
  viewDocBtn: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#64748B', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '100px', color: '#64748B' },
  empty: { textAlign: 'center', padding: '100px', color: '#64748B' },
};