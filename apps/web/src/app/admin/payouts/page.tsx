'use client';

import React, { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api/client';
import { assetUrl } from '@/lib/assetUrl';
import {
  Banknote,
  Upload,
  CheckCircle,
  Clock,
  ExternalLink,
  ArrowLeft,
  Camera,
  Loader2,
} from 'lucide-react';
import { adminPageStyles } from '@/lib/adminStyles';
import { AdminPageHeader } from '@/components/admin/page-header';

interface WithdrawalRequest {
  id: number;
  walletId: number;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  receiptImage?: string | null;
  referenceId?: string | null;
  createdAt: string;
  wallet: {
    doctor: {
      fullName: string;
    };
  };
}

export default function AdminPayoutsPage() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [referenceId, setReferenceId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/withdrawals');
      setRequests(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      alert('You must upload the bank receipt image');
      return;
    }
    if (!selectedRequest) return;

    const formData = new FormData();
    formData.append('receipt', receiptFile);
    formData.append('referenceId', referenceId);

    setSubmitting(true);
    setError('');
    try {
      const response = await api.post(`/admin/withdrawals/${selectedRequest.id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = response.data.data;
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete payout');
    } finally {
      setSubmitting(false);
      setSelectedRequest(null);
      setReceiptFile(null);
      setPreviewUrl(null);
      setReferenceId('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openModal = (req: WithdrawalRequest) => {
    setSelectedRequest(req);
    setReceiptFile(null);
    setPreviewUrl(null);
    setReferenceId('');
    setError('');
  };

  return (
    <div style={adminPageStyles.pageWide}>
      <AdminPageHeader
        icon={Banknote}
        title="Withdrawal & Payout Management"
        subtitle="Process doctor earnings withdrawals and confirm bank transfers."
      />

      <div style={styles.content}>
        {error && (
          <div style={styles.errorBanner}>{error}</div>
        )}

        <div className="paper-card" style={styles.listCard}>
          {loading ? (
            <div style={adminPageStyles.loadingWrap}>
              <Loader2 size={32} className="spin" style={{ color: 'var(--accent-primary)' }} />
            </div>
          ) : requests.length === 0 ? (
            <div style={adminPageStyles.emptyState}>
              <Banknote size={48} color="#CBD5E1" />
              <p>No withdrawal requests found.</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Doctor</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Bank Info</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={styles.tr}>
                    <td style={styles.tdName}>{req.wallet.doctor.fullName}</td>
                    <td style={styles.tdAmount}>{req.amount} ETB</td>
                    <td style={styles.td}>
                      <div style={styles.bankInfo}>
                        <span style={styles.bankName}>{req.bankName}</span>
                        <span style={styles.accNo}>{req.accountNumber}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: req.status === 'completed' ? '#ECFDF3' : '#FFFAEB',
                          color: req.status === 'completed' ? '#027A48' : '#B54708',
                        }}
                      >
                        {req.status === 'completed' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {req.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {req.status === 'pending' ? (
                        <button style={styles.processBtn} onClick={() => openModal(req)}>
                          <Upload size={14} /> Process Payout
                        </button>
                      ) : (
                        <a href={assetUrl(req.receiptImage)} target="_blank" rel="noreferrer" style={styles.viewLink}>
                          <ExternalLink size={14} /> View Receipt
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedRequest && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button style={styles.modalClose} onClick={() => setSelectedRequest(null)}>
              <ArrowLeft size={18} /> Back
            </button>
            <h3 style={styles.modalTitle}>Complete Payout</h3>
            <p style={styles.modalSub}>
              Payout for <b>{selectedRequest.wallet.doctor.fullName}</b>
            </p>

            <div style={styles.summaryBox}>
              <p>
                Transfer Amount: <b>{selectedRequest.amount} ETB</b>
              </p>
              <p>
                Account: {selectedRequest.accountName} ({selectedRequest.accountNumber})
              </p>
              <p>Bank: {selectedRequest.bankName}</p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Bank Reference ID</label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="e.g. TXN-123456789"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.uploadArea}>
                <label style={styles.uploadLabel}>
                  <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                  {previewUrl ? (
                    <img src={previewUrl} alt="Receipt Preview" style={styles.preview} />
                  ) : (
                    <div style={styles.uploadPlaceholder}>
                      <Camera size={32} />
                      <span>Snap or Upload Bank Receipt</span>
                    </div>
                  )}
                </label>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setSelectedRequest(null)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.confirmBtn} disabled={submitting}>
                  {submitting ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  content: { display: 'flex', flexDirection: 'column', gap: '24px' },
  errorBanner: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '12px', backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', fontSize: '14px', fontWeight: 500 },
  listCard: { padding: '24px', overflowX: 'auto' as const },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { textAlign: 'left' as const, borderBottom: '1px solid var(--border)' },
  th: { padding: '16px', fontSize: '12px', color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #F2F4F7' },
  td: { padding: '16px', fontSize: '14px' },
  tdName: { fontWeight: '600', padding: '16px', fontSize: '14px' },
  tdAmount: { fontWeight: '700', color: 'var(--accent-primary)', padding: '16px', fontSize: '14px' },
  bankInfo: { display: 'flex', flexDirection: 'column' as const },
  bankName: { fontSize: '14px', fontWeight: 500 },
  accNo: { fontSize: '12px', color: 'var(--text-secondary)' },
  statusBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' as const },
  processBtn: { backgroundColor: 'var(--accent-primary)', color: '#FFF', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 },
  viewLink: { color: 'var(--accent-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { width: '500px', maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto' as const, padding: '32px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  modalClose: { backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize: '14px', marginBottom: '16px' },
  modalTitle: { fontSize: '20px', marginBottom: '8px', color: 'var(--text-primary)' },
  modalSub: { fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' },
  summaryBox: { backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 700, color: '#475569' },
  input: { height: '44px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px', fontSize: '14px', outline: 'none', backgroundColor: '#F8FAFC' },
  uploadArea: { height: '200px', border: '2px dashed var(--border)', borderRadius: '12px', overflow: 'hidden' },
  uploadLabel: { width: '100%', height: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  preview: { width: '100%', height: '100%', objectFit: 'cover' as const },
  uploadPlaceholder: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' },
  cancelBtn: { backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
  confirmBtn: { backgroundColor: 'var(--status-success)', color: '#FFF', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' },
};