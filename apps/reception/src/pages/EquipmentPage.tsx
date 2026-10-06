import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import type { AppDispatch, RootState } from '../store';
import {
  fetchEquipmentBookings, fetchHospitalEquipment, completeBooking, cancelBooking,
  rescheduleBooking, updateBookingNotes, toggleEquipmentStatus, addEquipment,
  deleteEquipment, createEquipmentBooking, updateEquipment,
  type EquipmentBooking, type HospitalEquipment,
} from '../store/slices/equipmentSlice';
import { showToast } from '../components/Toast';
import { pageStyles, btnStyles } from './EquipmentPage.styles';
import EquipmentStatusCards from '../components/equipment/EquipmentStatusCards';
import EquipmentStatsCards from '../components/equipment/EquipmentStatsCards';
import EquipmentFilters from '../components/equipment/EquipmentFilters';
import EquipmentBookingList from '../components/equipment/EquipmentBookingList';
import RescheduleModal from '../components/RescheduleModal';
import BookingNotesModal from '../components/BookingNotesModal';
import AddEquipmentModal, { type AddEquipmentForm } from '../components/AddEquipmentModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import CreateEquipmentBookingModal from '../components/CreateEquipmentBookingModal';
import EditEquipmentModal, { type EditEquipmentData } from '../components/equipment/EditEquipmentModal';

function EquipmentPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { bookings, hospitalEquipment, loadingBookings: loading, loadingEquipment: equipLoading, error } = useSelector((state: RootState) => state.equipment);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [equipmentFilter, setEquipmentFilter] = useState<number | ''>('');
  const [rescheduleTarget, setRescheduleTarget] = useState<EquipmentBooking | null>(null);
  const [notesTarget, setNotesTarget] = useState<EquipmentBooking | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HospitalEquipment | null>(null);
  const [editTarget, setEditTarget] = useState<HospitalEquipment | null>(null);

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (equipmentFilter && b.equipmentId !== equipmentFilter) return false;
    return true;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  useEffect(() => {
    dispatch(fetchEquipmentBookings(dateFilter));
  }, [dateFilter, dispatch]);

  useEffect(() => {
    dispatch(fetchHospitalEquipment());
  }, [dispatch]);

  const withToast = async (action: () => Promise<any>, successMsg: string) => {
    try {
      await action();
      showToast({ type: 'success', message: successMsg });
      dispatch(fetchEquipmentBookings(dateFilter));
    } catch (err: any) {
      showToast({ type: 'error', message: err || 'Operation failed' });
    }
  };

  const handleComplete = (b: EquipmentBooking) => { setCompletingId(b.id); withToast(() => dispatch(completeBooking(b.id)).unwrap(), 'Booking completed').finally(() => setCompletingId(null)); };
  const handleCancel = (b: EquipmentBooking) => { setCancellingId(b.id); withToast(() => dispatch(cancelBooking(b.id)).unwrap(), 'Booking cancelled').finally(() => setCancellingId(null)); };
  const handleReschedule = async (dateTime: string) => { if (!rescheduleTarget) return; await withToast(() => dispatch(rescheduleBooking({ id: rescheduleTarget.id, dateTime })).unwrap(), 'Rescheduled'); setRescheduleTarget(null); };
  const handleNotes = async (notes: string) => { if (!notesTarget) return; await withToast(() => dispatch(updateBookingNotes({ id: notesTarget.id, notes })).unwrap(), 'Notes updated'); setNotesTarget(null); };
  const handleToggleStatus = async (eq: HospitalEquipment) => {
    setTogglingId(eq.id);
    try {
      await dispatch(toggleEquipmentStatus({ id: eq.id, isOperational: !eq.isOperational })).unwrap();
      showToast({ type: 'success', message: `Status updated to ${!eq.isOperational ? 'Operational' : 'Maintenance'}` });
    } catch (err: any) {
      showToast({ type: 'error', message: err || 'Failed to toggle status' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateBooking = async (data: { patientId: number; equipmentId: number; dateTime: string; notes?: string }) => {
    try {
      await dispatch(createEquipmentBooking(data)).unwrap();
      showToast({ type: 'success', message: 'Booking created' });
    } catch (err: any) {
      showToast({ type: 'error', message: err || 'Failed' });
    }
  };
  const handleEditEquipment = async (data: EditEquipmentData) => {
    if (!editTarget) return;
    try {
      await dispatch(updateEquipment({
        id: editTarget.id,
        price: data.price,
        duration: data.duration,
        operatingHours: data.operatingHours,
      })).unwrap();
      showToast({ type: 'success', message: 'Equipment updated' });
      dispatch(fetchHospitalEquipment());
    } catch (err: any) {
      showToast({ type: 'error', message: err || 'Failed to update equipment' });
    }
  };

  const handleAddEquipment = async (form: AddEquipmentForm) => {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('category', form.category);
    if (form.doctorName) fd.append('doctorName', form.doctorName);
    fd.append('duration', String(form.duration));
    if (form.price != null) fd.append('price', String(form.price));
    if (form.description) fd.append('description', form.description);
    if (form.photo) fd.append('photo', form.photo);
    if (form.operatingHours) fd.append('operatingHours', JSON.stringify(form.operatingHours));
    try {
      await dispatch(addEquipment(fd)).unwrap();
      showToast({ type: 'success', message: 'Equipment added' });
      dispatch(fetchHospitalEquipment());
    } catch (err: any) {
      showToast({ type: 'error', message: err || 'Failed to add equipment' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteEquipment(deleteTarget.id)).unwrap();
      showToast({ type: 'success', message: 'Equipment deleted' });
      setDeleteTarget(null);
      dispatch(fetchHospitalEquipment());
    } catch (err: any) {
      showToast({ type: 'error', message: err || 'Failed to delete' });
    }
  };

  return (
    <div className="animate-fade">
      <div style={pageStyles.headerContainer}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={pageStyles.headerTitle}>Equipment Bookings</h2>
            <p style={pageStyles.headerSubtitle}>Review and manage equipment booking requests.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)}
            style={{ ...btnStyles.base, ...btnStyles.confirm, padding: '8px 16px', fontSize: '13px' }}>
            <Plus size={14} /> New Booking
          </button>
        </div>
      </div>

      <EquipmentStatusCards
        equipment={hospitalEquipment}
        loading={equipLoading}
        togglingId={togglingId}
        deleteTargetId={deleteTarget?.id ?? null}
        onToggle={handleToggleStatus}
        onDelete={setDeleteTarget}
        onAdd={() => setShowAddModal(true)}
        onEdit={setEditTarget}
      />

      <EquipmentStatsCards stats={stats} />

      <EquipmentFilters
        statusFilter={statusFilter}
        dateFilter={dateFilter}
        equipmentFilter={equipmentFilter}
        equipment={hospitalEquipment}
        onStatusChange={setStatusFilter}
        onDateChange={setDateFilter}
        onEquipmentChange={setEquipmentFilter}
      />

      {error && <div style={pageStyles.errorBanner}>{error}</div>}

      <EquipmentBookingList bookings={filtered} loading={loading} statusFilter={statusFilter}
        completingId={completingId} cancellingId={cancellingId}
        onComplete={handleComplete} onCancel={handleCancel}
        onReschedule={setRescheduleTarget} onNotes={setNotesTarget} />

      <RescheduleModal
        open={!!rescheduleTarget}
        patientName={rescheduleTarget?.patient.patientProfile?.fullName || ''}
        onClose={() => setRescheduleTarget(null)}
        onConfirm={handleReschedule}
      />

      {notesTarget && (
        <BookingNotesModal
          open={!!notesTarget}
          patientName={notesTarget?.patient.patientProfile?.fullName || ''}
          equipmentName={notesTarget?.equipment.name || ''}
          initialNotes={notesTarget.notes || ''}
          onClose={() => setNotesTarget(null)}
          onConfirm={handleNotes}
        />
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Delete Equipment"
        message={deleteTarget ? `Are you sure you want to delete ${deleteTarget.name} (${deleteTarget.category})?` : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <EditEquipmentModal
        open={!!editTarget}
        name={editTarget?.name || ''}
        currentPrice={editTarget?.price ?? null}
        currentDuration={editTarget?.duration ?? 30}
        currentHours={editTarget?.operatingHours ?? null}
        onClose={() => setEditTarget(null)}
        onSave={handleEditEquipment}
      />
      <AddEquipmentModal open={showAddModal} onClose={() => setShowAddModal(false)} onConfirm={handleAddEquipment} />

      <CreateEquipmentBookingModal
        open={showCreateModal}
        equipment={hospitalEquipment}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateBooking}
      />
    </div>
  );
}

export default EquipmentPage;
