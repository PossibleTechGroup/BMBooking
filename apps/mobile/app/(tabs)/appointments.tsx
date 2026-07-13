import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Pressable, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { MedText } from '../../components/medconnect/MedText';
import { MedCard } from '../../components/medconnect/MedCard';
import { MedButton } from '../../components/medconnect/MedButton';
import { MedInput } from '../../components/medconnect/MedInput';
import axios from 'axios';
import { BASE_URL } from '../../constants/api';
import { useRouter } from 'expo-router';
import { AppDispatch, RootState } from '../../store';
import { fetchMyAppointments, cancelAppointment, rescheduleAppointment, fetchDoctorScheduleSlots } from '../../store/slices/appointmentSlice';
import { fetchMyEquipmentBookings, cancelEquipmentBooking, rescheduleEquipmentBooking, fetchEquipmentAvailability } from '../../store/slices/equipmentSlice';
import { formatDate, formatEthiopianLocalTime } from '../../utils/ethiopianDate';
import { useTimeFormat } from '../../utils/timeFormat';
import { formatDisplayTime } from '../../types/schedule';

const STATUS_TABS = ['All', 'Pending', 'Accepted', 'Completed', 'Cancelled'];
const BOOKING_TABS = ['Doctor', 'Lab Bookings'];
export default function PatientAppointmentsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isEthiopian } = useTimeFormat();

  const fmtTime = (d: Date) => isEthiopian ? formatEthiopianLocalTime(d) : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const router = useRouter();
  const { appointments, loading } = useSelector((state: RootState) => state.appointment);
  const { myBookings } = useSelector((state: RootState) => state.equipment);
  const [activeTab, setActiveTab] = useState('All');
  const [bookingTab, setBookingTab] = useState('Doctor');

  useEffect(() => {
    dispatch(fetchMyAppointments());
    dispatch(fetchMyEquipmentBookings());
  }, [dispatch]);

  useEffect(() => {
    if (bookingTab === 'Lab Bookings') {
      dispatch(fetchMyEquipmentBookings());
    }
  }, [bookingTab, dispatch]);
  const { token } = useSelector((state: RootState) => state.auth);
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [rescheduleAppt, setRescheduleAppt] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [scheduleDates, setScheduleDates] = useState<any[]>([]);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [slotsForDate, setSlotsForDate] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const [equipReschedVisible, setEquipReschedVisible] = useState(false);
  const [equipReschedBooking, setEquipReschedBooking] = useState<any>(null);
  const [equipAvailDate, setEquipAvailDate] = useState('');
  const [equipAvailSlots, setEquipAvailSlots] = useState<any[]>([]);
  const [selectedEquipSlot, setSelectedEquipSlot] = useState('');
  const [loadingEquipAvail, setLoadingEquipAvail] = useState(false);

  const existingReview = React.useMemo(() => {
    if (!selectedAppointment) return null;
    return reviews.find((r: any) => r.appointmentId === selectedAppointment.id) || null;
  }, [reviews, selectedAppointment]);

  const loadReviews = async (appointment: any) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/reviews/doctor/${appointment.doctorId}`);
      setReviews(res.data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    if (selectedAppointment) {
      const existing = reviews.find((r: any) => r.appointmentId === selectedAppointment.id);
      setRating(existing?.rating || 5);
      setComment(existing?.comment || '');
    }
  }, [selectedAppointment, reviews]);

  const handleSubmitReview = async () => {
    if (!selectedAppointment) return;
    try {
      setSubmitting(true);
      await axios.post(`${BASE_URL}/api/reviews`, {
        doctorId: selectedAppointment.doctorId,
        rating,
        comment,
        appointmentId: selectedAppointment.id,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedAppointment(null);
      setRateModalVisible(false);
      setComment('');
      setRating(5);
      setReviews([]);
      dispatch(fetchMyAppointments());
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const onRefresh = () => {
    dispatch(fetchMyAppointments());
  };

  const openReschedule = async (apt: any) => {
    setRescheduleAppt(apt);
    setRescheduleModalVisible(true);
    setSelectedSlot(null);
    setSelectedDateId(null);
    setSlotsForDate([]);
    setLoadingSchedules(true);
    try {
      const result = await dispatch(fetchDoctorScheduleSlots({ doctorId: apt.doctorId })).unwrap();
      setSchedules(result || []);
      const dates = (result || []).map((s: any) => {
        const d = new Date(s.date);
        return {
          id: d.toISOString().split('T')[0],
          day: formatDate(d, 'weekday-short'),
          date: formatDate(d, 'month-day'),
          label: formatDate(d, 'full'),
        };
      });
      const unique = dates.filter((d: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === d.id) === i);
      setScheduleDates(unique);
      if (unique.length > 0) setSelectedDateId(unique[0].id);
    } catch { /* handled by UI */ }
    finally { setLoadingSchedules(false); }
  };

  useEffect(() => {
    if (!selectedDateId || schedules.length === 0) { setSlotsForDate([]); return; }
    const daySchedules = schedules.filter((s: any) =>
      new Date(s.date).toISOString().split('T')[0] === selectedDateId
    );
    const allSlots = daySchedules.flatMap((s: any) => s.slots || []);
    allSlots.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    setSlotsForDate(allSlots);
    setSelectedSlot(null);
  }, [selectedDateId, schedules]);

  const handleCancel = (apt: any) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelAppointment(apt.id)).unwrap();
              dispatch(fetchMyAppointments());
            } catch (err: any) {
              Alert.alert('Error', err || 'Failed to cancel appointment');
            }
          },
        },
      ],
    );
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduleAppt || !selectedSlot) return;
    try {
      await dispatch(rescheduleAppointment({
        appointmentId: rescheduleAppt.id,
        dateTime: selectedSlot.startTime,
        slotId: selectedSlot.id,
      })).unwrap();
      setRescheduleModalVisible(false);
      setRescheduleAppt(null);
      dispatch(fetchMyAppointments());
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to reschedule appointment');
    }
  };

  const handleEquipCancel = (booking: any) => {
    Alert.alert(
      'Cancel Lab Booking',
      'Are you sure you want to cancel this lab booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelEquipmentBooking(booking.id)).unwrap();
              dispatch(fetchMyEquipmentBookings());
            } catch (err: any) {
              Alert.alert('Error', err || 'Failed to cancel booking');
            }
          },
        },
      ],
    );
  };

  const openEquipReschedule = async (booking: any) => {
    setEquipReschedBooking(booking);
    setEquipReschedVisible(true);
    setSelectedEquipSlot('');
    setEquipAvailSlots([]);
    const today = new Date().toISOString().split('T')[0];
    setEquipAvailDate(today);
    await loadEquipAvail(booking.equipmentId, today);
  };

  const loadEquipAvail = async (equipmentId: number, date: string) => {
    setLoadingEquipAvail(true);
    setEquipAvailDate(date);
    setSelectedEquipSlot('');
    try {
      const result = await dispatch(fetchEquipmentAvailability({ equipmentId, date })).unwrap();
      setEquipAvailSlots(result.slots || []);
    } catch { setEquipAvailSlots([]); }
    finally { setLoadingEquipAvail(false); }
  };

  const handleEquipRescheduleConfirm = async () => {
    if (!equipReschedBooking || !selectedEquipSlot) return;
    const dateTime = `${equipAvailDate}T${selectedEquipSlot}:00+03:00`;
    try {
      await dispatch(rescheduleEquipmentBooking({
        bookingId: equipReschedBooking.id,
        dateTime,
      })).unwrap();
      setEquipReschedVisible(false);
      setEquipReschedBooking(null);
      dispatch(fetchMyEquipmentBookings());
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to reschedule booking');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === 'All') return true;
    return apt.status.toLowerCase() === activeTab.toLowerCase();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return theme.success;
      case 'pending': return '#F59E0B';
      case 'completed': return theme.secondary;
      case 'declined': return '#EF4444';
      default: return theme.muted;
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return theme.success;
      case 'pending': return '#F59E0B';
      case 'completed': return theme.secondary;
      case 'declined': return '#EF4444';
      case 'cancelled': return '#EF4444';
      default: return theme.muted;
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <MedText variant="h1">My Appointments</MedText>
      </View>

      <View style={styles.topTabBar}>
        {BOOKING_TABS.map(tab => (
          <Pressable
            key={tab}
            onPress={() => setBookingTab(tab)}
            style={[
              styles.topTab,
              bookingTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
            ]}
          >
            <MedText
              variant="metadata"
              style={{ fontWeight: bookingTab === tab ? '700' : '400' }}
              color={bookingTab === tab ? theme.text : theme.muted}
            >
              {tab}
            </MedText>
          </Pressable>
        ))}
      </View>

      {bookingTab === 'Doctor' && (
        <View style={styles.tabBar}>
          {STATUS_TABS.map(tab => (
            <Pressable 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab, 
                activeTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 2 }
              ]}
            >
              <MedText 
                variant="metadata" 
                style={{ fontWeight: activeTab === tab ? '700' : '400' }}
                color={activeTab === tab ? theme.text : theme.muted}
              >
                {tab}
              </MedText>
            </Pressable>
          ))}
        </View>
      )}

      {bookingTab === 'Doctor' ? (
        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        >
          {filteredAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={theme.border} />
              <MedText variant="h2" style={{ marginTop: 16 }}>No appointments found</MedText>
              <MedText variant="body" style={{ marginTop: 8, textAlign: 'center' }}>
                Your {activeTab !== 'All' ? activeTab.toLowerCase() : ''} appointments will appear here.
              </MedText>
            </View>
          ) : (
            filteredAppointments.map((apt) => (
              <MedCard key={apt.id} style={[styles.card, apt.bookedBy && apt.bookedBy.id === userId && { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#EFF6FF', borderLeftWidth: 4, borderLeftColor: '#3B82F6' }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.doctorInfo}>
                    <MedText variant="h2">{apt.doctor?.fullName || 'Doctor'}</MedText>
                    <MedText variant="metadata">{apt.doctor?.specializations && apt.doctor.specializations.length > 0 ? apt.doctor.specializations.join(", ") : apt.doctor?.specialization}</MedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(apt.status) + '20' }]}>
                    <MedText variant="metadata" style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: 10 }} color={getStatusColor(apt.status)}>
                      {apt.status}
                    </MedText>
                  </View>
                </View>

                {apt.bookedBy && apt.bookedBy.id === userId && apt.patient?.patientProfile?.fullName && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#3B82F6', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                    <Ionicons name="people-outline" size={14} color="#FFFFFF" />
                    <MedText variant="metadata" style={{ marginLeft: 4, color: '#FFFFFF', fontWeight: '700' }}>
                      For: {apt.patient.patientProfile.fullName}
                    </MedText>
                  </View>
                )}

                <View style={styles.divider} />

                <View style={styles.details}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={theme.muted} />
                    <MedText variant="body" style={styles.detailText}>
                      {formatDate(new Date(apt.dateTime), 'weekday-short')}
                    </MedText>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={theme.muted} />
                    <MedText variant="body" style={styles.detailText}>
                      {fmtTime(new Date(apt.dateTime))}
                    </MedText>
                  </View>
                </View>

                {apt.status === 'accepted' && (
                  <View style={[styles.details, { marginTop: 8 }]}>
                    <View style={styles.detailRow}>
                      <Ionicons name="business-outline" size={16} color={theme.muted} />
                      <MedText variant="body" style={styles.detailText}>
                        {apt.doctor?.clinicName || 'Private Clinic'}
                      </MedText>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={16} color={theme.muted} />
                      <MedText variant="body" style={styles.detailText}>
                        {apt.doctor?.clinicAddress || 'Addis Ababa'}
                      </MedText>
                    </View>
                  </View>
                )}

                {apt.status === 'declined' && apt.declineReason && (
                  <View style={styles.reasonBox}>
                    <MedText variant="metadata" color="#EF4444">Reason: {apt.declineReason}</MedText>
                  </View>
                )}

                {(apt.status === 'pending' || apt.status === 'accepted') && (
                  <View style={{ flexDirection: 'row', marginTop: 16, gap: 10 }}>
                    <Pressable
                      onPress={() => openReschedule(apt)}
                      style={[styles.actionButton, { backgroundColor: theme.primary + '10', borderColor: theme.primary, borderWidth: 1, borderRadius: 8, flex: 1, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }]}
                    >
                      <Ionicons name="calendar-outline" size={15} color={theme.primary} />
                      <MedText variant="metadata" style={{ color: theme.primary, fontWeight: '600' }}>Reschedule</MedText>
                    </Pressable>
                    <Pressable
                      onPress={() => handleCancel(apt)}
                      style={[styles.actionButton, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 8, flex: 1, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }]}
                    >
                      <Ionicons name="close-outline" size={15} color="#EF4444" />
                      <MedText variant="metadata" style={{ color: '#EF4444', fontWeight: '600' }}>Cancel</MedText>
                    </Pressable>
                  </View>
                )}

                {apt.status === 'completed' && (
                  <MedButton 
                    title="Rate Doctor" 
                    size="small" 
                    onPress={() => {
                      setSelectedAppointment(apt);
                      loadReviews(apt);
                      setRateModalVisible(true);
                    }}
                    style={{ marginTop: 16 }}
                    icon={<Ionicons name="star-outline" size={16} color="white" />}
                  />
                )}
              </MedCard>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchMyEquipmentBookings())} />}
        >
          {myBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={64} color={theme.border} />
              <MedText variant="h2" style={{ marginTop: 16 }}>No lab bookings yet</MedText>
              <MedText variant="body" style={{ marginTop: 8, textAlign: 'center' }}>
                Search for medical tools and book an appointment at a center near you.
              </MedText>
              <MedButton
                title="Find Equipments"
                onPress={() => router.push('/(tabs)/equipment')}
                style={{ marginTop: 16 }}
              />
            </View>
          ) : (
            myBookings.map((booking: any) => (
              <MedCard key={booking.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.doctorInfo}>
                    <MedText variant="h2">{booking.equipment?.name || 'Equipment'}</MedText>
                    <MedText variant="metadata">
                      {booking.equipment?.category?.replace('_', ' ') || 'Medical Tool'}
                    </MedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getBookingStatusColor(booking.status) + '20' }]}>
                    <MedText
                      variant="metadata"
                      style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: 10 }}
                      color={getBookingStatusColor(booking.status)}
                    >
                      {booking.status}
                    </MedText>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.details}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={theme.muted} />
                    <MedText variant="body" style={styles.detailText}>
                      {formatDate(new Date(booking.dateTime), 'weekday-short')}
                    </MedText>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={theme.muted} />
                    <MedText variant="body" style={styles.detailText}>
                      {fmtTime(new Date(booking.dateTime))}
                    </MedText>
                  </View>
                </View>

                {booking.notes && (
                  <MedText variant="metadata" style={{ marginTop: 8, color: theme.muted }}>
                    Notes: {booking.notes}
                  </MedText>
                )}

                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <View style={{ flexDirection: 'row', marginTop: 16, gap: 10 }}>
                    <Pressable
                      onPress={() => openEquipReschedule(booking)}
                      style={[styles.actionButton, { backgroundColor: theme.primary + '10', borderColor: theme.primary, borderWidth: 1 }]}
                    >
                      <Ionicons name="calendar-outline" size={15} color={theme.primary} />
                      <MedText variant="metadata" style={{ color: theme.primary, fontWeight: '600' }}>Reschedule</MedText>
                    </Pressable>
                    <Pressable
                      onPress={() => handleEquipCancel(booking)}
                      style={[styles.actionButton, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 }]}
                    >
                      <Ionicons name="close-outline" size={15} color="#EF4444" />
                      <MedText variant="metadata" style={{ color: '#EF4444', fontWeight: '600' }}>Cancel</MedText>
                    </Pressable>
                  </View>
                )}

              </MedCard>
            ))
          )}
        </ScrollView>
      )}

      {/* Rating Modal */}
      <Modal
        visible={rateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <MedText variant="h2">Rate your Experience</MedText>
              <TouchableOpacity onPress={() => setRateModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <MedText variant="body" color={theme.muted}>How was your visit with</MedText>
                <MedText variant="h2" style={{ marginTop: 4 }}>{selectedAppointment?.doctor?.fullName}</MedText>

                {existingReview ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FEF3C7', borderRadius: 8 }}>
                    <Ionicons name="create-outline" size={14} color="#92400E" />
                    <MedText variant="metadata" style={{ color: '#92400E', marginLeft: 4, fontWeight: '500' }}>Editing your review</MedText>
                  </View>
                ) : null}
                
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                      <Ionicons 
                        name={s <= rating ? "star" : "star-outline"} 
                        size={40} 
                        color={s <= rating ? "#F59E0B" : theme.border} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <MedText variant="metadata" style={{ marginBottom: 8 }}>YOUR COMMENT</MedText>
              <TextInput
                style={[styles.commentInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Share your experience (optional)..."
                placeholderTextColor={theme.muted}
                multiline
                value={comment}
                onChangeText={setComment}
              />

              <MedButton 
                title={existingReview ? "Update Review" : "Submit Review"} 
                onPress={handleSubmitReview} 
                loading={submitting}
                style={{ marginTop: 32 }} 
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <MedText variant="h2">Reschedule Appointment</MedText>
              <TouchableOpacity onPress={() => setRescheduleModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
              {rescheduleAppt && (
                <MedCard style={{ padding: 16, marginBottom: 16 }}>
                  <MedText variant="body" style={{ fontWeight: '500' }}>{rescheduleAppt.doctor?.fullName}</MedText>
                  <MedText variant="metadata" style={{ marginTop: 2, color: theme.muted }}>
                    {rescheduleAppt.doctor?.specialization}
                  </MedText>
                </MedCard>
              )}

              {loadingSchedules ? (
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 32 }} />
              ) : scheduleDates.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={40} color={theme.muted} />
                  <MedText variant="body" style={{ color: theme.muted, marginTop: 12, textAlign: 'center' }}>No available schedules</MedText>
                </View>
              ) : (
                <>
                  <MedText variant="metadata" style={{ marginBottom: 10, fontWeight: '600' }}>SELECT DATE</MedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                    {scheduleDates.map((d: any) => (
                      <Pressable
                        key={d.id}
                        onPress={() => setSelectedDateId(d.id)}
                        style={[
                          { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, marginRight: 10, borderWidth: 1 },
                          selectedDateId === d.id
                            ? { backgroundColor: theme.primary, borderColor: theme.primary }
                            : { backgroundColor: theme.surface, borderColor: theme.border },
                        ]}
                      >
                        <MedText variant="metadata" style={{ color: selectedDateId === d.id ? '#FFF' : theme.muted, fontWeight: '500', textAlign: 'center' }}>{d.day}</MedText>
                        <MedText variant="body" style={{ color: selectedDateId === d.id ? '#FFF' : theme.text, marginTop: 4, fontWeight: '500', textAlign: 'center' }}>{d.date}</MedText>
                      </Pressable>
                    ))}
                  </ScrollView>

                  {slotsForDate.length === 0 ? (
                    <View style={{ padding: 16, backgroundColor: '#FEF3F2', borderRadius: 10 }}>
                      <MedText variant="body" style={{ color: '#B42318', fontSize: 13, textAlign: 'center' }}>No slots available for this date</MedText>
                    </View>
                  ) : (
                    <>
                      <MedText variant="metadata" style={{ marginBottom: 10, fontWeight: '600' }}>SELECT TIME</MedText>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {slotsForDate.map((slot: any) => {
                          const remaining = slot.maxPatients - slot._count.bookings;
                          const isFull = remaining <= 0;
                          const isSelected = selectedSlot?.id === slot.id;
                          return (
                            <Pressable
                              key={slot.id}
                              disabled={isFull}
                              onPress={() => setSelectedSlot(slot)}
                              style={[
                                { flex: 1, minWidth: '45%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
                                isFull && { opacity: 0.4 },
                                isSelected
                                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                  : { backgroundColor: theme.surface, borderColor: theme.border },
                              ]}
                            >
                              <MedText
                                variant="body"
                                style={{ fontWeight: '500', color: isSelected ? '#FFF' : theme.text, fontSize: 13 }}
                              >
                                {fmtTime(new Date(slot.startTime))}
                              </MedText>
                              <MedText
                                variant="metadata"
                                style={{ color: isSelected ? '#FFF' : theme.muted, fontSize: 10, marginTop: 2 }}
                              >
                                {isFull ? 'Full' : `${remaining} left`}
                              </MedText>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  )}

                  <MedButton
                    title="Confirm Reschedule"
                    onPress={handleRescheduleConfirm}
                    disabled={!selectedSlot}
                    style={{ marginTop: 24 }}
                    textStyle={{ color: colorScheme === "dark" ? "#101828" : "#FFFFFF" }}
                  />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Equipment Reschedule Modal */}
      <Modal
        visible={equipReschedVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEquipReschedVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <MedText variant="h2">Reschedule Lab Booking</MedText>
              <TouchableOpacity onPress={() => setEquipReschedVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
              {equipReschedBooking && (
                <MedCard style={{ padding: 16, marginBottom: 16 }}>
                  <MedText variant="body" style={{ fontWeight: '500' }}>{equipReschedBooking.equipment?.name}</MedText>
                  <MedText variant="metadata" style={{ marginTop: 2, color: theme.muted }}>
                    {equipReschedBooking.equipment?.category?.replace('_', ' ') || 'Medical Tool'}
                  </MedText>
                  <View style={[styles.divider, { marginVertical: 10 }]} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                    <Ionicons name="calendar-outline" size={13} color="#FFFFFF" />
                    <MedText variant="metadata" style={{ marginLeft: 5, color: '#FFFFFF', fontWeight: '700' }}>
                      Current: {formatDate(new Date(equipReschedBooking.dateTime), 'weekday-short')} {' '}
                      {fmtTime(new Date(equipReschedBooking.dateTime))}
                    </MedText>
                  </View>
                </MedCard>
              )}

              <MedText variant="metadata" style={{ marginBottom: 10, fontWeight: '600' }}>SELECT DATE</MedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {(() => {
                  const dates: { day: string; date: string; iso: string }[] = [];
                  for (let i = 0; i < 30; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    dates.push({
                      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      iso: d.toISOString().split('T')[0],
                    });
                  }
                  return dates;
                })().map((d) => (
                  <Pressable
                    key={d.iso}
                    onPress={() => equipReschedBooking && loadEquipAvail(equipReschedBooking.equipmentId, d.iso)}
                    style={[
                      { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, marginRight: 10, borderWidth: 1 },
                      equipAvailDate === d.iso
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <MedText variant="metadata" style={{ color: equipAvailDate === d.iso ? '#FFF' : theme.muted, fontWeight: '500', textAlign: 'center' }}>{d.day}</MedText>
                    <MedText variant="body" style={{ color: equipAvailDate === d.iso ? '#FFF' : theme.text, marginTop: 4, fontWeight: '500', textAlign: 'center' }}>{d.date}</MedText>
                  </Pressable>
                ))}
              </ScrollView>

              {loadingEquipAvail ? (
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 16 }} />
              ) : equipAvailSlots.length === 0 && equipAvailDate ? (
                <View style={{ padding: 16, backgroundColor: '#FEF3F2', borderRadius: 10, marginBottom: 16 }}>
                  <MedText variant="body" style={{ color: '#B42318', fontSize: 13, textAlign: 'center' }}>
                    No available slots for this date
                  </MedText>
                </View>
              ) : equipAvailSlots.length > 0 ? (
                <>
                  <MedText variant="metadata" style={{ marginBottom: 10, fontWeight: '600' }}>SELECT TIME</MedText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {equipAvailSlots.map((slot: any, idx: number) => {
                      const isSelected = selectedEquipSlot === slot.start;
                      const isBooked = slot.booked === true;
                      const currentTime = equipReschedBooking
                        // hour12:false stays 24h to match slot.start (HH:MM from API)
                        ? new Date(equipReschedBooking.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : '';
                      const currentDate = equipReschedBooking
                        ? new Date(equipReschedBooking.dateTime).toISOString().split('T')[0]
                        : '';
                      const isCurrent = currentTime === slot.start && currentDate === equipAvailDate;
                      return (
                        <Pressable
                          key={idx}
                          disabled={isBooked || isCurrent}
                          onPress={() => !isBooked && !isCurrent && setSelectedEquipSlot(slot.start)}
                          style={[
                            { flex: 1, minWidth: '45%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
                            isCurrent
                              ? { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }
                              : isBooked
                                ? { backgroundColor: '#F9FAFB', borderColor: theme.border }
                                : isSelected
                                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                  : { backgroundColor: theme.surface, borderColor: theme.border },
                          ]}
                        >
                          <MedText variant="body" style={{
                            fontWeight: '500',
                            color: isCurrent ? '#92400E' : isBooked ? '#D1D5DB' : isSelected ? '#FFF' : theme.text,
                            fontSize: 13,
                            textDecorationLine: isBooked ? 'line-through' : 'none',
                          }}>
                            {formatDisplayTime(slot.start, isEthiopian)} - {formatDisplayTime(slot.end, isEthiopian)}
                          </MedText>
                          {isCurrent && (
                            <MedText variant="metadata" style={{ color: '#92400E', fontSize: 9, marginTop: 2, fontWeight: '700' }}>
                              Current Booking
                            </MedText>
                          )}
                          {isBooked && (
                            <MedText variant="metadata" style={{ color: '#D1D5DB', fontSize: 9, marginTop: 2 }}>
                              Booked
                            </MedText>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}

              <MedButton
                title="Confirm Reschedule"
                onPress={handleEquipRescheduleConfirm}
                disabled={!selectedEquipSlot}
                style={{ marginTop: 24 }}
                textStyle={{ color: colorScheme === "dark" ? "#101828" : "#FFFFFF" }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  topTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7EC',
  },
  topTab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7EC',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  doctorInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F4F7',
    marginVertical: 12,
  },
  details: {
    flexDirection: 'row',
    gap: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
  },
  reasonBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '65%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  starRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  commentInput: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap:8,
  },
});
