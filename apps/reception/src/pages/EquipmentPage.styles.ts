import { CSSProperties } from 'react';

export const pageStyles: Record<string, CSSProperties> = {
  headerContainer: { marginBottom: '24px' },
  headerTitle: { fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 600, marginBottom: '4px' },
  headerSubtitle: { color: 'var(--text-secondary)', fontSize: '15px' },
  errorBanner: { background: '#FEF3F2', color: 'var(--status-error)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '14px', border: '1px solid #FECDCA', marginBottom: '16px' },
  loadingContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-secondary)', gap: '8px' },
  emptyState: { textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' },
  emptyTitle: { fontSize: '16px', fontWeight: 500, marginBottom: '4px' },
  emptySubtitle: { fontSize: '14px' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
};

export const statusCardStyles: Record<string, CSSProperties> = {
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  sectionTitle: { fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' },
  addBtn: {
    padding: '6px 14px', fontSize: '13px', fontWeight: 600,
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)', color: 'var(--text-primary)', cursor: 'pointer',
  },
  scrollContainer: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' },
  card: {
    flex: '0 0 auto', minWidth: 180, display: 'flex', flexDirection: 'column', gap: '6px',
    padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)',
  },
  cardBody: { flex: '1 1 auto' },
  cardName: { fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' },
  cardCategory: { fontSize: '12px', color: 'var(--text-secondary)' },
  cardActions: { display: 'flex', alignItems: 'center', gap: '4px' },
  statusBadge: { fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap' },
  toggleBtn: {
    padding: '4px 10px', fontSize: '11px', fontWeight: 600,
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)', color: 'var(--text-secondary)', cursor: 'pointer',
  },
  deleteBtn: {
    padding: '4px 8px', fontSize: '13px', fontWeight: 600,
    border: '1px solid transparent', borderRadius: 'var(--radius-sm)',
    background: 'none', color: 'var(--status-error)', cursor: 'pointer',
    lineHeight: 1, display: 'flex', alignItems: 'center',
  },
  hoursBtn: {
    padding: '4px 8px', fontSize: '13px',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)', color: 'var(--accent-primary)', cursor: 'pointer',
    lineHeight: 1, display: 'flex', alignItems: 'center',
  },
};

export const statsStyles: Record<string, CSSProperties> = {
  row: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '16px 18px',
    boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '8px',
    transition: 'transform 0.15s, box-shadow 0.15s',
    cursor: 'default',
  },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: {
    width: '36px', height: '36px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 },
  value: { fontSize: '28px', fontWeight: 800, lineHeight: 1.1 },
  trendRow: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' },
};

export const filterStyles: Record<string, CSSProperties> = {
  row: { display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-end' },
  fieldLabel: { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' },
  select: { padding: '8px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text-primary)', minWidth: '140px' },
  dateInput: { padding: '8px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text-primary)' },
  equipSelect: { padding: '8px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text-primary)', minWidth: '180px' },
};

export const bookingCardStyles: Record<string, CSSProperties> = {
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '16px 20px',
    boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '8px',
  },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  infoCol: { flex: 1 },
  titleRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' },
  patientName: { fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' },
  equipName: { fontSize: '13px', color: 'var(--text-secondary)' },
  categoryBadge: { fontSize: '12px', color: 'var(--text-secondary)', background: '#F9F7F2', padding: '1px 6px', borderRadius: '4px' },
  maintBadge: { fontSize: '12px', color: '#D92D20', background: '#FEF3F2', padding: '1px 6px', borderRadius: '4px' },
  detailsRow: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' },
  declineReason: { marginTop: '6px', fontSize: '13px', color: 'var(--status-error)', background: '#FEF3F2', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' },
  statusCol: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '16px' },
  statusBadge: { fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' },
  actionRow: { display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '2px', flexWrap: 'wrap' },
};

export const btnStyles: Record<string, CSSProperties> = {
  base: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '6px 12px', fontSize: '12px', fontWeight: 600,
    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
  },
  confirm: { background: '#027A48', color: '#fff' },
  decline: { background: '#D92D20', color: '#fff' },
  cancel: { background: '#F2F4F7', color: '#667085' },
  reschedule: { background: '#F2F4F7', color: 'var(--accent-primary)' },
  notes: { background: '#F2F4F7', color: 'var(--accent-primary)' },
  complete: { background: '#175CD3', color: '#fff' },
  cancelDanger: { background: '#FEF3F2', color: '#D92D20' },
};
