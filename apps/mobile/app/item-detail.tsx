import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';

import { MedText } from '../components/medconnect/MedText';
import { MedCard } from '../components/medconnect/MedCard';
import { MedButton } from '../components/medconnect/MedButton';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { AppDispatch, RootState } from '../store';
import { fetchItemDetail, clearSelectedItem, bookEquipment, fetchEquipmentAvailability, clearAvailability, fetchHospitalDetail } from '../store/slices/equipmentSlice';
import { BASE_URL, TELEBIRR_URL, getAssetUrl } from '../constants/api';
import { formatDate, formatEthiopianLocalTime } from '../utils/ethiopianDate';
import { useTimeFormat } from '../utils/timeFormat';
import { useUserLocation } from '../hooks/useUserLocation';
import { haversineKm } from '../utils/location';

function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const eth = formatDate(d);
    days.push({
      id: d.toISOString().split('T')[0],
      day: formatDate(d, 'weekday-short'),
      date: formatDate(d, 'month-day'),
      label: formatDate(d, 'full'),
    });
  }
  return days;
}

function fmtTime24to12(time24: string, eth?: boolean) {
  const [h, m] = time24.split(':').map(Number);
  if (eth) {
    const ethHour = ((h + 6) % 12) || 12;
    const period = (h >= 6 && h < 18) ? 'ቀን' : 'ሌሊት';
    return `${ethHour}:${String(m).padStart(2, '0')} ${period}`;
  }
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function ItemDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? 'light';
  const { isEthiopian } = useTimeFormat();
  const theme = Colors[colorScheme];

  const { selectedItem, loading, bookingLoading, error, availability, availabilityLoading } = useSelector((state: RootState) => state.equipment);
  const { token } = useSelector((state: RootState) => state.auth);
  const equipmentHospitals = useSelector((state: RootState) => state.equipment.hospitals || []);
  const { latitude, longitude } = useUserLocation();

  const distanceKm = useMemo(() => {
    if (latitude == null || longitude == null || !selectedItem) return null;
    const lat = selectedItem.latitude;
    const lng = selectedItem.longitude;
    if (!lat || !lng) return null;
    return Math.round(haversineKm(latitude, longitude, lat, lng) * 10) / 10;
  }, [latitude, longitude, selectedItem]);

  const [showBooking, setShowBooking] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const dates = getNext7Days();
  const availableSlots = availability?.slots || [];

  const hospitalServices = useMemo(() => {
    if (!selectedItem?.hospitalId) return [];
    const found = equipmentHospitals.find((h: any) => String(h.id) === String(selectedItem.hospitalId));
    return found?.equipment || [];
  }, [equipmentHospitals, selectedItem]);

  useEffect(() => {
    if (selectedItem?.hospitalId) {
      const existing = equipmentHospitals.find((h: any) => String(h.id) === String(selectedItem.hospitalId));
      if (!existing) dispatch(fetchHospitalDetail(selectedItem.hospitalId));
    }
  }, [selectedItem?.hospitalId, dispatch, equipmentHospitals]);

  useEffect(() => {
    if (selectedItem?.id) {
      const firstDate = dates[0]?.id ?? '';
      setSelectedDateId(firstDate);
      setSelectedTime('');
      setNotes('');
      setBookingSuccess(false);
      setShowPayment(false);
    }
  }, [selectedItem?.id]);

  const switchService = (service: any) => {
    if (!service || service.id === selectedItem?.id) return;
    dispatch(clearAvailability());
    dispatch(fetchItemDetail(service.id));
  };

  useEffect(() => {
    if (dates.length > 0) setSelectedDateId(dates[0].id);
  }, []);

  useEffect(() => {
    if (dates.length > 0 && !selectedDateId) {
      setSelectedDateId(dates[0].id);
    }
  }, [showBooking]);

  useEffect(() => {
    if (showBooking && selectedDateId && selectedItem?.id) {
      dispatch(fetchEquipmentAvailability({ equipmentId: selectedItem.id, date: selectedDateId }));
    }
  }, [showBooking, selectedDateId, dispatch, selectedItem?.id]);

  useEffect(() => {
    if (availableSlots.length > 0) {
      const firstAvailable = availableSlots.find(s => !s.booked);
      if (firstAvailable) setSelectedTime(firstAvailable.start);
    } else {
      setSelectedTime('');
    }
  }, [availability]);

  const equipmentFee = selectedItem?.price ? Math.round(Number(selectedItem.price) * 100) / 100 : 0;
  const hospitalFee = selectedItem?.serviceFee != null
    ? Math.round(Number(selectedItem.serviceFee) * 100) / 100
    : 50;
  const feePerSlot = Math.round((equipmentFee + hospitalFee) * 100) / 100;
  const requiresPayment = feePerSlot > 0;

  const buildBookingAction = () => {
    const [year, month, day] = selectedDateId.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(year, month - 1, day, hours, minutes);
    if (isNaN(appointmentDate.getTime())) return null;
    return {
      equipmentId: selectedItem?.id ?? parseInt(id as string),
      dateTime: appointmentDate.toISOString(),
      notes: notes || undefined,
    };
  };

  const submitBooking = async (fee?: number) => {
    const action = buildBookingAction();
    if (!action) return;
    const result = await dispatch(bookEquipment({
      ...action,
      fee,
    }));

    if (bookEquipment.fulfilled.match(result)) {
      setBookingSuccess(true);
      setShowBooking(false);
      setShowPayment(false);
      setNotes('');
    } else {
      const errMsg = (result as any).payload || error || 'Something went wrong. Please try again.';
      if (errMsg.includes('Unauthorized') || errMsg.includes('token')) {
        Alert.alert('Session Expired', 'Please log in again to continue.');
        router.push('/(auth)/login');
      } else {
        Alert.alert('Booking Failed', errMsg);
      }
    }
  };

  const handleProceedToPayment = () => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to book an appointment.');
      router.push('/(auth)/login');
      return;
    }
    if (!selectedDateId || !selectedTime) {
      Alert.alert('Error', 'Please select date and time.');
      return;
    }
    setShowPayment(true);
  };

  const handlePayWithTelebirr = async () => {
    if (paymentProcessing) return;
    if (!requiresPayment) {
      submitBooking(0);
      return;
    }
    setPaymentProcessing(true);
    try {
      const checkoutUrl = `${TELEBIRR_URL}/?amount=${encodeURIComponent(String(feePerSlot))}&src=app`;
      await WebBrowser.openBrowserAsync(checkoutUrl);
      const { data } = await axios.post(
        `${BASE_URL}/api/payments/verify-telebirr`,
        { amount: feePerSlot },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.paid) {
        await submitBooking(feePerSlot);
      } else {
        Alert.alert('Payment Required', 'Payment was not completed. Please try again.');
      }
    } catch {
      Alert.alert('Payment Error', 'Something went wrong with the payment. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  useEffect(() => {
    dispatch(fetchItemDetail(parseInt(id as string)));
    return () => {
      dispatch(clearSelectedItem());
      dispatch(clearAvailability());
    };
  }, [dispatch, id]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <MedText variant="metadata" style={{ marginTop: 12 }}>Loading tool details...</MedText>
      </View>
    );
  }

  if (!selectedItem) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <MedText variant="h2">Tool not found</MedText>
        <MedButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ 
              uri: selectedItem.photo 
                ? getAssetUrl(selectedItem.photo) 
                : 'https://images.unsplash.com/photo-1587350859728-117622bc93cf?q=80&w=800&auto=format&fit=crop' 
            }}
            style={styles.image}
          />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
        </View>

        <View style={[styles.content, { backgroundColor: theme.surface }]}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <MedText variant="h1">{selectedItem.name}</MedText>
              <MedText variant="metadata" style={{ color: theme.primary }}>
                {selectedItem.category.replace('_', ' ')}
              </MedText>
            </View>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: selectedItem.isOperational ? '#ECFDF3' : '#FEF3F2' }
            ]}>
              <MedText 
                variant="metadata" 
                style={{ color: selectedItem.isOperational ? '#027A48' : '#D92D20', fontWeight: 'bold' }}
              >
                {selectedItem.isOperational ? 'ACTIVE' : 'INACTIVE'}
              </MedText>
            </View>
          </View>

          <View style={styles.premiumCard}>
            <View style={styles.hospitalInfoSection}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="business" size={24} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <MedText variant="h2">{selectedItem.hospitalName}</MedText>
                <MedText variant="metadata" style={{ color: theme.muted }}>
                  {selectedItem.address}
                </MedText>
                {distanceKm != null ? (
                  <View style={styles.distanceRow}>
                    <Ionicons name="navigate-outline" size={14} color={theme.primary} />
                    <MedText variant="metadata" style={{ color: theme.primary, marginLeft: 4, fontWeight: '600' }}>
                      {distanceKm.toFixed(1)} km away
                    </MedText>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <MedText variant="h2" style={styles.sectionTitle}>All services at {selectedItem.hospitalName}</MedText>
          {hospitalServices.length === 0 ? (
            <MedText variant="body" style={{ color: theme.muted }}>
              Loading this hospital's services...
            </MedText>
          ) : (
            hospitalServices.map((service: any) => {
              const svcPrice = service.price != null ? `${service.price} ETB` : service.cardPrice != null ? `${service.cardPrice} ETB` : 'Contact hospital';
              const isSelected = service.id === selectedItem.id;
              const svcOperational = service.isOperational !== false;
              return (
                <Pressable
                  key={service.id}
                  onPress={() => switchService(service)}
                  disabled={!svcOperational}
                  style={[
                    styles.serviceRow,
                    { borderColor: isSelected ? theme.primary : theme.border, backgroundColor: isSelected ? theme.primary + '0F' : theme.surface },
                    !svcOperational && { opacity: 0.5 },
                  ]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.serviceTitleRow}>
                      <MedText variant="body" style={[styles.serviceName, { color: theme.text }]} numberOfLines={1}>
                        {service.name}
                      </MedText>
                      {svcOperational ? (
                        <View style={[styles.statusDot, { backgroundColor: isSelected ? theme.primary : '#16A34A' }]} />
                      ) : (
                        <View style={[styles.statusDot, { backgroundColor: '#DC2626' }]} />
                      )}
                    </View>
                    <MedText variant="metadata" numberOfLines={1} style={{ marginTop: 2, textTransform: 'capitalize' }}>
                      {(service.category || '').replace('_', ' ')} • {svcPrice}
                    </MedText>
                  </View>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                    size={20}
                    color={isSelected ? theme.primary : theme.muted}
                  />
                </Pressable>
              );
            })
          )}

          <MedText variant="h2" style={styles.sectionTitle}>Details</MedText>
          <MedText variant="body" style={{ color: theme.muted, lineHeight: 22 }}>
            {selectedItem.description || 'This specialized medical tool is available at the facility for patients requiring diagnostic or therapeutic care.'}
          </MedText>

          {!showBooking && !bookingSuccess && (
            <MedCard style={{ marginTop: 24, padding: 20, backgroundColor: theme.primary + '10' }}>
              <MedText variant="h2" style={{ color: theme.primary }}>
                Ready to book this diagnostic service?
              </MedText>
              <MedText variant="body" style={{ color: theme.muted, marginTop: 4 }}>
                Choose a date and time. The center will confirm your booking.
              </MedText>
            </MedCard>
          )}

          {bookingSuccess && (
            <MedCard style={{ marginTop: 24, padding: 20, backgroundColor: '#ECFDF3' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={24} color="#027A48" />
                <MedText variant="h2" style={{ marginLeft: 12, color: '#027A48' }}>
                  Booking Requested
                </MedText>
              </View>
              <MedText variant="body" style={{ marginTop: 8, color: '#027A48' }}>
                Your appointment request has been submitted. The center will confirm your booking shortly.
              </MedText>
              <MedButton
                title="View My Bookings"
                size="small"
                onPress={() => router.push('/(tabs)/appointments')}
                style={{ marginTop: 16 }}
              />
            </MedCard>
          )}

          {showBooking && (
            <MedCard style={{ marginTop: 24, padding: 20 }}>
              <MedText variant="h2" style={{ marginBottom: 16 }}>Book Appointment</MedText>

              <MedText variant="metadata" style={styles.sectionLabel}>SELECT DATE</MedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {dates.map((date) => (
                  <Pressable
                    key={date.id}
                    onPress={() => setSelectedDateId(date.id)}
                    style={[
                      styles.dateCard,
                      { borderColor: theme.border, backgroundColor: theme.surface },
                      selectedDateId === date.id && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                  >
                    <MedText
                      variant="metadata"
                      style={{ color: selectedDateId === date.id ? '#FFF' : theme.muted, fontWeight: '700' }}
                    >
                      {date.day}
                    </MedText>
                    <MedText
                      variant="h2"
                      style={{ color: selectedDateId === date.id ? '#FFF' : theme.text, marginTop: 4, fontSize: 14 }}
                    >
                      {date.date}
                    </MedText>
                  </Pressable>
                ))}
              </ScrollView>

              <MedText variant="metadata" style={styles.sectionLabel}>AVAILABLE SLOTS</MedText>
              {availabilityLoading ? (
                <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
              ) : availableSlots.length === 0 ? (
                <View style={{ padding: 16, backgroundColor: '#FEF3F2', borderRadius: 12, marginBottom: 8 }}>
                  <MedText variant="body" style={{ color: '#B42318', fontSize: 13, textAlign: 'center' }}>
                    No available slots for this date.
                  </MedText>
                </View>
              ) : (
                <View style={styles.timeGrid}>
                  {availableSlots.map((slot) => {
                    const displayTime = fmtTime24to12(slot.start, isEthiopian);
                    const isBooked = slot.booked === true;
                    return (
                      <Pressable
                        key={slot.start}
                        disabled={isBooked}
                        onPress={() => setSelectedTime(slot.start)}
                        style={[
                          styles.timeChip,
                          isBooked
                            ? { borderColor: theme.border, backgroundColor: '#F9FAFB' }
                            : { borderColor: theme.border, backgroundColor: theme.surface },
                          !isBooked && selectedTime === slot.start && { backgroundColor: theme.primary, borderColor: theme.primary },
                        ]}
                      >
                        <Ionicons
                          name={isBooked ? 'close-circle' : selectedTime === slot.start ? 'checkmark-circle' : 'time-outline'}
                          size={14}
                          color={isBooked ? '#D1D5DB' : selectedTime === slot.start ? '#FFF' : theme.muted}
                        />
                        <MedText
                          variant="metadata"
                          style={{
                            color: isBooked ? '#D1D5DB' : selectedTime === slot.start ? '#FFF' : theme.text,
                            fontWeight: '600',
                            textDecorationLine: isBooked ? 'line-through' : 'none',
                          }}
                        >
                          {displayTime}
                        </MedText>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <MedText variant="metadata" style={styles.sectionLabel}>FEE SUMMARY</MedText>
              <View style={styles.feeSummary}>
                <View style={styles.feeSummaryRow}>
                  <MedText variant="body" style={{ color: theme.muted }}>Equipment cost</MedText>
                  <MedText variant="body">{equipmentFee} ETB</MedText>
                </View>
                <View style={styles.feeSummaryRow}>
                  <MedText variant="body" style={{ color: theme.muted }}>App Fee</MedText>
                  <MedText variant="body">{hospitalFee} ETB</MedText>
                </View>
                <View style={[styles.feeSummaryRow, styles.feeSummaryTotal]}>
                  <MedText variant="h2">Total</MedText>
                  <MedText variant="h2">{feePerSlot} ETB</MedText>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <MedButton
                  title="Cancel"
                  onPress={() => { setShowBooking(false); setShowPayment(false); }}
                  style={{ flex: 1, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }}
                  textStyle={{ color: theme.text }}
                />
                <MedButton
                  title={paymentProcessing ? 'Processing...' : bookingLoading ? 'Booking...' : 'Continue to Payment'}
                  onPress={handleProceedToPayment}
                  loading={bookingLoading || paymentProcessing}
                  style={{ flex: 1 }}
                />
              </View>
            </MedCard>
          )}

          {showPayment && selectedItem && (
            <MedCard style={{ marginTop: 16, padding: 20 }}>
              <MedText variant="h2" style={{ marginBottom: 16 }}>Payment Summary</MedText>

              <View style={{ gap: 12, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <MedText variant="body" style={{ color: theme.muted }}>{selectedItem.name}</MedText>
                  <MedText variant="body">{selectedItem.duration} min</MedText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <MedText variant="body" style={{ color: theme.muted }}>Equipment Rental</MedText>
                  <MedText variant="body">{equipmentFee} ETB</MedText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <MedText variant="body" style={{ color: theme.muted }}>Hospital service fee</MedText>
                  <MedText variant="body">{hospitalFee} ETB</MedText>
                </View>
                <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <MedText variant="h2">Total</MedText>
                  <MedText variant="h2">{feePerSlot} ETB</MedText>
                </View>
              </View>

              {requiresPayment ? (
                <MedButton
                  title={paymentProcessing ? 'Processing...' : `Pay ${feePerSlot} ETB via Telebirr`}
                  onPress={handlePayWithTelebirr}
                  loading={paymentProcessing}
                  icon={<Ionicons name="phone-portrait-outline" size={18} color="#FFF" />}
                />
              ) : (
                <MedButton
                  title={bookingLoading ? 'Booking...' : 'Confirm Free Booking'}
                  onPress={() => submitBooking(0)}
                  loading={bookingLoading}
                />
              )}
              {requiresPayment && (
                <MedText variant="metadata" style={{ color: theme.muted, marginTop: 12, textAlign: 'center' }}>
                  You will be redirected to Telebirr to complete the payment.
                </MedText>
              )}
            </MedCard>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {!showBooking && !bookingSuccess && (
        <View style={[styles.bookFooter, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MedButton
            title="Book Appointment"
            onPress={() => setShowBooking(true)}
            icon={<Ionicons name="calendar-outline" size={18} color="#FFF" />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { height: 250, width: '100%' },
  image: { width: '100%', height: '100%' },
  backButton: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  premiumCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginTop: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  hospitalInfoSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  serviceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  serviceName: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { marginTop: 32, marginBottom: 12, fontSize: 18, fontWeight: '800' },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', marginBottom: 12, letterSpacing: 1 },
  dateCard: { width: 64, height: 80, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1, minWidth: '30%' },
  feeSummary: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  feeSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  feeSummaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bookFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
});
