import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { assetUrl } from '../config/env';
import { fetchWithdrawals, completePayout } from '../store/slices/payoutSlice';
import type { AppDispatch, RootState } from '../store';
import { 
  Banknote, 
  Upload, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  ArrowLeft,
  Camera,
  FileCheck
} from 'lucide-react';

export const PayoutsPage = ({ onBack }: { onBack: () => void }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { requests, loading } = useSelector((state: RootState) => state.payouts);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [referenceId, setReferenceId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchWithdrawals());
  }, [dispatch]);

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

    const formData = new FormData();
    formData.append('receipt', receiptFile);
    formData.append('referenceId', referenceId);

    await dispatch(completePayout({ id: selectedRequest.id, formData }));
    setSelectedRequest(null);
    setReceiptFile(null);
    setPreviewUrl(null);
    setReferenceId('');
  };

  return (
    <div className="animate-fade" style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h2 style={styles.title}>Withdrawal & Payout Management</h2>
      </header>

      <div style={styles.content}>
        <div style={styles.listCard} className="paper-card">
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th>Doctor</th>
                <th>Amount</th>
                <th>Bank Info</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} style={styles.tr}>
                  <td style={styles.tdName}>{req.wallet.doctor.fullName}</td>
                  <td style={styles.tdAmount}>{req.amount} ETB</td>
                  <td>
                    <div style={styles.bankInfo}>
                      <span style={styles.bankName}>{req.bankName}</span>
                      <span style={styles.accNo}>{req.accountNumber}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: req.status === 'completed' ? '#ECFDF3' : '#FFFAEB',
                      color: req.status === 'completed' ? '#027A48' : '#B54708'
                    }}>
                      {req.status === 'completed' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                      {req.status}
                    </span>
                  </td>
                  <td>
                    {req.status === 'pending' ? (
                      <button 
                        style={styles.processBtn}
                        onClick={() => setSelectedRequest(req)}
                      >
                        Process Payout
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
        </div>

        {selectedRequest && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent} className="glass-card animate-fade">
              <h3 style={styles.modalTitle}>Complete Payout</h3>
              <p style={styles.modalSub}>Payout for <b>{selectedRequest.wallet.doctor.fullName}</b></p>
              
              <div style={styles.summaryBox}>
                <p>Transfer Amount: <b>{selectedRequest.amount} ETB</b></p>
                <p>Account: {selectedRequest.accountName} ({selectedRequest.accountNumber})</p>
                <p>Bank: {selectedRequest.bankName}</p>
              </div>

              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label>Bank Reference ID</label>
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
                    <input type="file" onChange={handleFileChange} style={{display: 'none'}} accept="image/*" />
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
                  <button type="button" onClick={() => setSelectedRequest(null)} style={styles.cancelBtn}>Cancel</button>
                  <button type="submit" style={styles.confirmBtn}>
                    <FileCheck size={18} />
                    Confirm Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' },
  backBtn: { backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' },
  title: { fontSize: '24px', color: 'var(--accent-primary)' },
  content: { display: 'flex', flexDirection: 'column', gap: '24px' },
  listCard: { padding: '24px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-secondary)' },
  tr: { borderBottom: '1px solid #F2F4F7' },
  tdName: { fontWeight: '600', padding: '16px 0' },
  tdAmount: { fontWeight: '700', color: 'var(--accent-primary)' },
  bankInfo: { display: 'flex', flexDirection: 'column' },
  bankName: { fontSize: '14px', fontWeight: '500' },
  accNo: { fontSize: '12px', color: 'var(--text-secondary)' },
  statusBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' },
  processBtn: { backgroundColor: 'var(--accent-primary)', color: '#FFF', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' },
  viewLink: { color: 'var(--accent-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalContent: { width: '500px', padding: '32px' },
  modalTitle: { fontSize: '20px', marginBottom: '8px' },
  modalSub: { fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' },
  summaryBox: { backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  input: { height: '44px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px' },
  uploadArea: { height: '200px', border: '2px dashed var(--border)', borderRadius: '12px', overflow: 'hidden' },
  uploadLabel: { width: '100%', height: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  preview: { width: '100%', height: '100%', objectFit: 'cover' },
  uploadPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' },
  cancelBtn: { backgroundColor: 'transparent', color: 'var(--text-primary)' },
  confirmBtn: { backgroundColor: 'var(--status-success)', color: '#FFF', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }
};

export default PayoutsPage;
