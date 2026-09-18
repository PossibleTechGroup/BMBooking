import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { useRouter } from 'expo-router';

import { MedText } from '../medconnect/MedText';
import { MedCard } from '../medconnect/MedCard';
import { MedButton } from '../medconnect/MedButton';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { AppDispatch, RootState } from '../../store';
import {
  bookEquipment,
  fetchEquipmentAvailability,
  clearAvailability,
} from '../../store/slices/equipmentSlice';
import { BASE_URL, TELEBIRR_URL } from '../../constants/api';
import { formatDate } from '../../utils/ethiopianDate';
import { useTimeFormat } from '../../utils/timeFormat';

function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
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

interface Props {
  item: any;
}

export default function EquipmentBookingCard({ item }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isEthiopian } = useTimeFormat();

  const { availability, availabilityLoading, bookingLoading, error } = useSelector(
    (state: RootState) => state.equipment
  );
  const { token } = useSelector((state: RootState) => state.auth);

  const dates = getNext7Days();
  const availableSlots = availability?.slots || [];

  const [selectedDateId, setSelectedDateId] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (dates.length > 0) setSelectedDateId(dates[0].id);
  }, []);

  useEffect(() => {
    return () => {
      dispatch(clearAvailability());
    };
  }, [dispatch]);

  useEffect(() => {
    if (selectedDateId && item?.id) {
      dispatch(fetchEquipmentAvailability({ equipmentId: item.id, date: selectedDateId }));
    }
  }, [selectedDateId, item?.id, dispatch]);

  useEffect(() => {
    if (availableSlots.length > 0) {
      const firstAvailable = availableSlots.find((s: any) => !s.booked);
      if (firstAvailable) setSelectedTime(firstAvailable.start);
    } else {
      setSelectedTime('');
    }
  }, [availability]);

  const equipmentFee = item?.price ? Math.round(Number(item.price) * 100) / 100 : 0;
  const hospitalFee = item?.serviceFee != null
    ? Math.round(Number(item.serviceFee) * 100) / 100
    : 50;
  const feePerSlot = Math.round((equipmentFee + hospitalFee) * 100) / 100;
  const requiresPayment = feePerSlot > 0;

  const buildBookingAction = () => {
    const [year, month, day] = selectedDateId.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(year, month - 1, day, hours, minutes);
    if (isNaN(appointmentDate.getTime())) return null;
    return {
      equipmentId: item.id,
      dateTime: appointmentDate.toISOString(),
      notes: notes || undefined,
    };
  };

  const submitBooking = async (fee?: number) => {
    const action = buildBookingAction();
    if (!action) return;
    const result = await dispatch(bookEquipment({ ...action, fee }));
    if (bookEquipment.fulfilled.match(result)) {
      setBookingSuccess(true);
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

  if (bookingSuccess) {
    const parsed = selectedDateId.split('-').map(Number);
    const shownDate = parsed.length === 3 && parsed.every((n) => !isNaN(n))
      ? formatDate(new Date(parsed[0], parsed[1] - 1, parsed[2]), 'full')
      : selectedDateId;
    const shownTime = selectedTime ? fmtTime24to12(selectedTime, isEthiopian) : '';
    return (
      <MedCard style={{ padding: 20, backgroundColor: '#ECFDF3' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={24} color="#027A48" />
          <MedText variant="h2" style={{ marginLeft: 12, color: '#027A48', flex: 1 }}>
            Booking Requested
          </MedText>
        </View>
        <MedText variant="body" style={{ marginTop: 10, color: '#027A48', fontWeight: '700', fontSize: 16 }}>
          {item?.name || 'This service'}
        </MedText>
        <MedText variant="body" style={{ marginTop: 6, color: '#027A48' }}>
          {shownTime ? `${shownDate} at ${shownTime}` : shownDate}
        </MedText>
        <MedText variant="body" style={{ marginTop: 8, color: '#027A48' }}>
          Your booking for this service has been submitted. The center will confirm shortly.
        </MedText>
        <MedButton
          title="View My Bookings"
          size="small"
          onPress={() => router.push('/(tabs)/appointments')}
          style={{ marginTop: 16 }}
        />
      </MedCard>
    );
  }

  return (
    <MedCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <MedText variant="h2">{item?.name}</MedText>
          <MedText variant="metadata" style={{ color: theme.muted, marginTop: 2, textTransform: 'capitalize' }}>
            {(item?.category || '').replace('_', ' ')} • {equipmentFee} ETB + {hospitalFee} ETB fee
          </MedText>
        </View>
        <Pressable onPress={() => { setBookingSuccess(false); setShowPayment(false); }} hitSlop={8}>
          <Ionicons name="close-circle" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

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
          {availableSlots.map((slot: any) => {
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

      {!showPayment ? (
        <MedButton
          title={paymentProcessing ? 'Processing...' : bookingLoading ? 'Booking...' : 'Continue to Payment'}
          onPress={handleProceedToPayment}
          loading={bookingLoading || paymentProcessing}
          style={{ marginTop: 20 }}
        />
      ) : (
        <View style={{ marginTop: 12 }}>
          <View style={{ gap: 12, marginBottom: 16 }}>
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
        </View>
      )}
    </MedCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, marginTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
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
});