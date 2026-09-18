import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Pressable,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { MedText } from '../../components/medconnect/MedText';
import { MedButton } from '../../components/medconnect/MedButton';
import { BMHeader } from '../../components/BMHeader';
import { LanguagePicker } from '../../components/LanguagePicker';
import axios from 'axios';
import { BASE_URL } from '../../constants/api';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppDispatch, RootState } from '../../store';
import {
  fetchMyAppointments,
  cancelAppointment,
} from '../../store/slices/appointmentSlice';
import {
  fetchMyEquipmentBookings,
} from '../../store/slices/equipmentSlice';
import { formatEthiopianLocalTime } from '../../utils/ethiopianDate';
import { useTimeFormat } from '../../utils/timeFormat';

const STATUS_TABS = ['All', 'Pending', 'Accepted', 'Completed', 'Declined', 'Cancelled'];

export default function PatientAppointmentsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isEthiopian } = useTimeFormat();
  const { t } = useTranslation();
  const router = useRouter();

  const fmtTime = (d: Date) =>
    isEthiopian
      ? formatEthiopianLocalTime(d)
      : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const { appointments, loading } = useSelector((state: RootState) => state.appointment);
  const { myBookings } = useSelector((state: RootState) => state.equipment);
  const { token } = useSelector((state: RootState) => state.auth);
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  const [activeTab, setActiveTab] = useState('All');
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [hospitalReviews, setHospitalReviews] = useState<any[]>([]);
  const [reviewTarget, setReviewTarget] = useState<'doctor' | 'hospital'>('doctor');

  useEffect(() => {
    dispatch(fetchMyAppointments());
    dispatch(fetchMyEquipmentBookings());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchMyAppointments());
    dispatch(fetchMyEquipmentBookings());
  }, [dispatch]);

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'All') return true;
    return apt.status.toLowerCase() === activeTab.toLowerCase();
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'confirmed':
        return { bg: '#E8F5E9', fg: '#2E7D32', text: 'Accepted' };
      case 'pending':
        return { bg: '#FFF8E1', fg: '#F57C00', text: 'Pending' };
      case 'completed':
        return { bg: '#E3F2FD', fg: '#1565C0', text: 'Completed' };
      case 'declined':
        return { bg: '#FFEBEE', fg: '#C62828', text: 'Declined' };
      case 'cancelled':
        return { bg: '#F3F4F6', fg: '#5A6B80', text: 'Cancelled' };
      default:
        return { bg: '#F1F5F9', fg: '#64748B', text: status };
    }
  };

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
      ]
    );
  };

  const openRateReview = (appointment: any, target: 'doctor' | 'hospital') => {
    setSelectedAppointment(appointment);
    setReviewTarget(target);
    setRateModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedAppointment) return;
    try {
      setSubmitting(true);
      await axios.post(
        `${BASE_URL}/api/reviews`,
        {
          doctorId: reviewTarget === 'doctor' ? selectedAppointment.doctorId : undefined,
          hospitalId: reviewTarget === 'hospital' ? selectedAppointment.doctor?.hospital?.id : undefined,
          rating,
          comment,
          appointmentId: selectedAppointment.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSelectedAppointment(null);
      setRateModalVisible(false);
      setComment('');
      setRating(5);
      dispatch(fetchMyAppointments());
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderAppointmentCard = (apt: any) => {
    const badge = getStatusBadge(apt.status);
    const doctor = apt.doctor;
    const hospital = doctor?.hospital || {};
    const hospitalName = hospital?.name || doctor?.clinicName || 'Clinic';
    const regPhone = hospital?.phone || doctor?.clinicAddress || '1212121212';
    const receptionistPhone = hospital?.receptionistPhone || null;
    const hospitalAddress = hospital?.address || '';
    const hasCoords =
      typeof hospital?.latitude === 'number' &&
      typeof hospital?.longitude === 'number';
    const aptDate = apt.dateTime ? new Date(apt.dateTime) : new Date();
    const dateFormatted = `${aptDate.getMonth() + 1}/${aptDate.getDate()}/${aptDate.getFullYear()}`;
    const timeFormatted = fmtTime(aptDate);
    const specialty = doctor?.specializations?.length
      ? doctor.specializations.join(', ')
      : doctor?.specialization || 'General Doctor';

    const openMaps = () => {
      if (!hasCoords) return;
      const url = Platform.select({
        ios: `maps:0,0?q=${hospitalName}@${hospital.latitude},${hospital.longitude}`,
        android: `geo:0,0?q=${hospital.latitude},${hospital.longitude}(${encodeURIComponent(hospitalName)})`,
      });
      if (url) Linking.openURL(url);
    };

    return (
      <View key={apt.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Top Doctor & Status */}
        <View style={styles.cardHeader}>
          <MedText variant="body" style={[styles.doctorName, { color: theme.text }]} numberOfLines={1}>
            {doctor?.fullName || 'john'}
          </MedText>
          <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
            <MedText style={[styles.statusText, { color: badge.fg }]}>
              {badge.text}
            </MedText>
          </View>
        </View>

        {/* Doctor Specialty */}
        <MedText style={[styles.specialtyText, { color: theme.textSecondary }]} numberOfLines={1}>
          {specialty}
        </MedText>

        {/* Date & Time Row */}
        <View style={styles.dateTimeRow}>
          <View style={styles.iconTextRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
            <MedText style={[styles.metaValue, { color: theme.text }]}>{dateFormatted}</MedText>
          </View>
          <View style={styles.iconTextRow}>
            <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
            <MedText style={[styles.metaValue, { color: theme.text }]}>{timeFormatted}</MedText>
          </View>
        </View>

        {apt.reason ? (
          <MedText style={[styles.reasonText, { color: theme.textSecondary }]} numberOfLines={2}>
            {apt.reason}
          </MedText>
        ) : null}

        {/* Divider */}
        <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

        {/* Hospital info */}
        <MedText style={[styles.hospitalName, { color: theme.text }]} numberOfLines={1}>
          {hospitalName}
        </MedText>

        {hospitalAddress ? (
          <View style={styles.regRow}>
            <Ionicons name="location-outline" size={15} color={theme.textSecondary} />
            <MedText style={[styles.regText, { color: theme.textSecondary }]}>
              {hospitalAddress}
            </MedText>
          </View>
        ) : null}

        {/* Phone & Registration info */}
        {regPhone !== '1212121212' && (
          <Pressable
            style={styles.regRow}
            onPress={() => Linking.openURL(`tel:${regPhone}`)}
            hitSlop={6}
          >
            <Ionicons name="call-outline" size={15} color={theme.textSecondary} />
            <MedText style={[styles.regText, { color: theme.textSecondary }]}>
              Registration: {regPhone}
            </MedText>
            <View style={[styles.callBadge, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="call" size={14} color={theme.primary} />
            </View>
          </Pressable>
        )}

        {receptionistPhone ? (
          <Pressable
            style={styles.regRow}
            onPress={() => Linking.openURL(`tel:${receptionistPhone}`)}
            hitSlop={6}
          >
            <Ionicons name="person-circle-outline" size={15} color={theme.textSecondary} />
            <MedText style={[styles.regText, { color: theme.textSecondary }]}>
              Reception: {receptionistPhone}
            </MedText>
            <View style={[styles.callBadge, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="call" size={14} color={theme.primary} />
            </View>
          </Pressable>
        ) : null}

        {regPhone !== '1212121212' && (
          <View style={styles.contactRow}>
            <MedButton
              title="Call Hospital"
              type="outline"
              size="small"
              style={{ flex: 1 }}
              icon={<Ionicons name="call-outline" size={14} color={theme.primary} />}
              onPress={() => Linking.openURL(`tel:${regPhone}`)}
            />
            {hasCoords && (
              <MedButton
                title="Directions"
                type="outline"
                size="small"
                style={{ flex: 1 }}
                icon={<Ionicons name="navigate-outline" size={14} color={theme.primary} />}
                onPress={openMaps}
              />
            )}
          </View>
        )}

        {/* For someone else badge if applicable */}
        {apt.bookedBy && apt.bookedBy.id === userId && apt.patient?.patientProfile?.fullName && (
          <View style={[styles.forRow, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="people-outline" size={14} color={theme.primary} />
            <MedText style={[styles.forText, { color: theme.primary }]}>
              For: {apt.patient.patientProfile.fullName}
            </MedText>
          </View>
        )}

        {/* Actions for Pending (mirrors web) */}
        {apt.status === 'pending' && (
          <View style={styles.actionRow}>
            <MedButton
              title="Cancel"
              type="outline"
              size="small"
              style={{ flex: 1 }}
              onPress={() => handleCancel(apt)}
            />
          </View>
        )}

        {/* Actions for Completed */}
        {apt.status === 'completed' && (
          <View style={styles.actionRow}>
            <MedButton
              title="Rate Doctor"
              size="small"
              style={{ flex: 1 }}
              onPress={() => openRateReview(apt, 'doctor')}
              icon={<Ionicons name="star-outline" size={14} color="#FFF" />}
            />
            {doctor?.hospital?.id ? (
              <MedButton
                title="Rate Hospital"
                type="outline"
                size="small"
                style={{ flex: 1 }}
                onPress={() => openRateReview(apt, 'hospital')}
                icon={<Ionicons name="business-outline" size={14} color={theme.text} />}
              />
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* BM Brand Header */}
      <BMHeader />

      {/* Title & Language Row */}
      <View style={styles.titleSection}>
        <MedText variant="h1" style={[styles.pageTitle, { color: theme.text }]}>
          {t("myAppointments") || "My Appointments"}
        </MedText>
        <LanguagePicker />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabPill,
                  active
                    ? { backgroundColor: "#1E56A0", borderColor: "#1E56A0" }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <MedText
                  style={[
                    styles.tabText,
                    { color: active ? "#FFFFFF" : theme.textSecondary, fontWeight: active ? "700" : "500" },
                  ]}
                >
                  {tab}
                </MedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Appointment List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      >
        {loading && appointments.length === 0 ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.secondaryBg }]}>
              <Ionicons name="calendar-outline" size={32} color={theme.textSecondary} />
            </View>
            <MedText style={[styles.emptyTitle, { color: theme.text }]}>
              {t("noAppointments") || "No appointments found"}
            </MedText>
            <MedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {t("bookFirstAppointment") || "Book your first appointment to get started."}
            </MedText>
            <MedButton
              title={t("findDoctors") || "Find Doctors"}
              onPress={() => router.push("/(tabs)/doctors")}
              style={{ marginTop: 20 }}
            />
          </View>
        ) : (
          filteredAppointments.map((apt) => renderAppointmentCard(apt))
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={rateModalVisible} animationType="slide" transparent onRequestClose={() => setRateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <MedText variant="h2">Rate Experience</MedText>
              <TouchableOpacity onPress={() => setRateModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <MedText style={{ textAlign: 'center', color: theme.textSecondary }}>
                {reviewTarget === 'hospital' ? 'How was your experience with the hospital?' : 'How was your experience with the doctor?'}
              </MedText>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)}>
                    <Ionicons name={s <= rating ? 'star' : 'star-outline'} size={36} color={s <= rating ? '#F59E0B' : theme.border} />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.commentInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Share details of your visit (optional)..."
                placeholderTextColor={theme.textSecondary}
                multiline
                value={comment}
                onChangeText={setComment}
              />
              <MedButton title="Submit Review" onPress={handleSubmitReview} loading={submitting} style={{ marginTop: 20 }} />
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
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  tabsContainer: {
    marginBottom: 12,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  specialtyText: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 10,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 13,
    marginBottom: 10,
  },
  cardDivider: {
    height: 1,
    marginVertical: 10,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  regRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  regText: {
    fontSize: 13,
  },
  callBadge: {
    marginLeft: 'auto',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  forRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  forText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 18,
  },
  commentInput: {
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 14,
  },
});
