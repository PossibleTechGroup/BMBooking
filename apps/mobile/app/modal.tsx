import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';

import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { MedText } from '../components/medconnect/MedText';
import { MedButton } from '../components/medconnect/MedButton';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { AppDispatch, RootState } from '../store';
import { BASE_URL, TELEBIRR_URL } from '../constants/api';
import {
  createAppointment,
  fetchDoctorScheduleSlots,
  resetBookingState,
} from '../store/slices/appointmentSlice';
import { fetchDoctors } from '../store/slices/doctorSlice';
import { formatDate, formatEthiopianLocalTime } from '../utils/ethiopianDate';
import { useTimeFormat } from '../utils/timeFormat';
import { normalizeEthiopianPhone, ethiopianPhoneDigits } from '../utils/phone';

export default function BookingModal() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isEthiopian } = useTimeFormat();

  const { token, user } = useSelector((state: RootState) => state.auth);
  const { doctors } = useSelector((state: RootState) => state.doctors);

  const doctorId = params.doctorId ? parseInt(params.doctorId as string) : null;
  const doctor = useMemo(() => doctors.find((d) => d.id === doctorId), [doctors, doctorId]);
  const doctorName = (params.doctorName as string) || doctor?.fullName || 'Dr. Samrawit Girma';

  // Form State
  const [bookingFor, setBookingFor] = useState<'Myself' | 'someone_else'>('Myself');
  const [otherName, setOtherName] = useState('');
  const [otherPhone, setOtherPhone] = useState('');
  const [otherGender, setOtherGender] = useState<'male' | 'female'>('male');
  const [referralPhoto, setReferralPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [reason, setReason] = useState('');

  // Schedule & Slots State
  const [schedules, setSchedules] = useState<any[]>([]);
  const [scheduleDates, setScheduleDates] = useState<{ id: string; label: string; date: Date }[]>([]);
  const [selectedDateId, setSelectedDateId] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [slotsForDate, setSlotsForDate] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const fmtSlot = (startTime: string) => {
    const d = new Date(startTime);
    return isEthiopian
      ? formatEthiopianLocalTime(d)
      : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Flow State: 'form' | 'payment' | 'success'
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [includeCardFee, setIncludeCardFee] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<{ id: number } | null>(null);

  // Deriving Fees
  const serviceFeeAmount = useMemo(() => {
    if (doctor?.hospital?.serviceFee?.amount) {
      return parseFloat(doctor.hospital.serviceFee.amount);
    }
    return 1.0; // Default service fee fallback
  }, [doctor]);

  const cardFeeAmount = useMemo(() => {
    if (doctor?.hospital?.cardPrice) {
      return parseFloat(doctor.hospital.cardPrice);
    }
    return 0.0;
  }, [doctor]);

  const totalPayable = serviceFeeAmount + (includeCardFee ? cardFeeAmount : 0);

  useEffect(() => {
    dispatch(fetchDoctors());
    dispatch(resetBookingState());
  }, [dispatch]);

  // Load doctor schedules
  useEffect(() => {
    if (!doctorId) return;
    setSlotsLoading(true);
    dispatch(fetchDoctorScheduleSlots({ doctorId }))
      .unwrap()
      .then((result) => {
        setSchedules(result || []);
        const rawDates = (result || []).map((s: any) => {
          const d = new Date(s.date);
          return {
            id: d.toISOString().split('T')[0],
            label: formatDate(d, 'full'),
            date: d,
          };
        });
        const unique = rawDates.filter(
          (d: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === d.id) === i
        );
        if (unique.length > 0) {
          setScheduleDates(unique);
          setSelectedDateId(unique[0].id);
        } else {
          // Fallback next 5 days if doctor has no explicit slot table
          const fallbackDates = [];
          for (let i = 1; i <= 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            fallbackDates.push({
              id: d.toISOString().split('T')[0],
              label: formatDate(d, 'full'),
              date: d,
            });
          }
          setScheduleDates(fallbackDates);
          setSelectedDateId(fallbackDates[0].id);
        }
      })
      .catch(() => {
        // Fallback
        const fallbackDates = [];
        for (let i = 1; i <= 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          fallbackDates.push({
            id: d.toISOString().split('T')[0],
            label: formatDate(d, 'full'),
            date: d,
          });
        }
        setScheduleDates(fallbackDates);
        setSelectedDateId(fallbackDates[0].id);
      })
      .finally(() => setSlotsLoading(false));
  }, [doctorId, dispatch]);

  // Derive available slots for the selected date
  useEffect(() => {
    if (!selectedDateId || schedules.length === 0) {
      setSlotsForDate([]);
      setSelectedSlot(null);
      return;
    }
    const daySchedules = schedules.filter(
      (s: any) => new Date(s.date).toISOString().split('T')[0] === selectedDateId
    );
    const allSlots = daySchedules.flatMap((s: any) => s.slots || []);
    allSlots.sort(
      (a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    setSlotsForDate(allSlots);
    setSelectedSlot(null);
  }, [selectedDateId, schedules]);

  // Pick Referral Photo
  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow media library access to upload referral photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setReferralPhoto(uri);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to pick image');
    }
  };

  const handleContinueToPayment = () => {
    if (!token) {
      Alert.alert('Login Required', 'Please log in to book an appointment.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (bookingFor === 'someone_else' && (!otherName.trim() || !otherPhone.trim())) {
      Alert.alert('Missing Info', 'Please provide the patient name and phone number.');
      return;
    }

    if (!selectedDateId) {
      Alert.alert('Missing Date', 'Please select an appointment date.');
      return;
    }

    if (!selectedSlot) {
      Alert.alert('Select Slot', 'Please choose an available slot for the selected date.');
      return;
    }

    setStep('payment');
  };

  const handlePayAndConfirm = async () => {
    try {
      setPaymentLoading(true);

      if (totalPayable > 0) {
        const checkoutUrl = `${TELEBIRR_URL}/?amount=${encodeURIComponent(String(totalPayable))}&src=app`;
        await WebBrowser.openBrowserAsync(checkoutUrl);

        let paid = false;
        const MAX_TRIES = 12;
        for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
          try {
            const verifyRes = await axios.post(
              `${BASE_URL}/api/payments/verify-telebirr`,
              { amount: totalPayable },
              { headers: { Authorization: `Bearer ${token}` } },
            );
            paid = verifyRes.data?.status === 'success' && verifyRes.data?.data?.paid;
            if (paid) break;
          } catch {
            /* retry below */
          }
          if (attempt < MAX_TRIES - 1) {
            await new Promise((r) => setTimeout(r, 3000));
          }
        }

        if (!paid) {
          Alert.alert(
            'Payment Not Confirmed',
            'Your payment was not confirmed yet. If you already paid, tap "Pay & Confirm" again to verify.',
          );
          return;
        }
      }

      // Submit Appointment (marked as paid after confirmed payment)
      const scheduleDate = selectedDateId || new Date().toISOString().split('T')[0];
      const timePart = selectedSlot?.startTime?.slice(11, 16);
      const dateTime = timePart
        ? `${scheduleDate}T${timePart}:00.000Z`
        : `${scheduleDate}T09:00:00.000Z`;

      const payload: any = {
        doctorId: doctorId || undefined,
        dateTime,
        fee: totalPayable,
        notes: reason || undefined,
        reason: reason || undefined,
        slotId: selectedSlot?.id,
        paymentMethod: includeCardFee ? 'card' : 'service_fee',
        paidCardFee: includeCardFee,
        isPaid: true,
      };

      if (bookingFor === 'someone_else') {
        const normalizedPhone = normalizeEthiopianPhone(otherPhone);
        payload.otherPatientDetails = {
          fullName: otherName,
          phone: normalizedPhone ?? `+251${otherPhone.replace(/^0/, '')}`,
          gender: otherGender,
        };
      }

      const result = await dispatch(createAppointment(payload));

      if (createAppointment.fulfilled.match(result)) {
        setCreatedAppointment(
          result.payload?.appointment || result.payload?.id
            ? { id: result.payload.id ?? result.payload.appointment?.id }
            : { id: Math.floor(100000 + Math.random() * 900000) }
        );
        setStep('success');
      } else {
        const errMsg = (result as any).payload || 'Failed to book appointment.';
        Alert.alert('Booking Error', errMsg);
      }
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'An error occurred during booking.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // ─── Step 1: Main Booking Form (Screenshot 4) ───────────────────
  if (step === 'form') {
    const selectedDateLabel =
      scheduleDates.find((d) => d.id === selectedDateId)?.label ||
      (selectedDateId ? selectedDateId : 'Select appointment date');

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
          {/* Header with Title and Close 'X' */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <MedText variant="h1" style={[styles.modalTitle, { color: theme.text }]}>
                Book Appointment
              </MedText>
              <MedText style={styles.modalSubtitle}>
                With {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
              </MedText>
            </View>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          {/* Section: Who is this for? */}
          <View style={styles.formSection}>
            <MedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Who is this for?
            </MedText>
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setBookingFor('Myself')}
                style={[
                  styles.togglePill,
                  bookingFor === 'Myself'
                    ? { backgroundColor: '#EFF6FF', borderColor: '#1E56A0' }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <MedText
                  style={[
                    styles.toggleText,
                    { color: bookingFor === 'Myself' ? '#1E56A0' : theme.textSecondary, fontWeight: bookingFor === 'Myself' ? '700' : '500' },
                  ]}
                >
                  Myself
                </MedText>
              </Pressable>

              <Pressable
                onPress={() => setBookingFor('someone_else')}
                style={[
                  styles.togglePill,
                  bookingFor === 'someone_else'
                    ? { backgroundColor: '#EFF6FF', borderColor: '#1E56A0' }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <MedText
                  style={[
                    styles.toggleText,
                    { color: bookingFor === 'someone_else' ? '#1E56A0' : theme.textSecondary, fontWeight: bookingFor === 'someone_else' ? '700' : '500' },
                  ]}
                >
                  someone_else
                </MedText>
              </Pressable>
            </View>

            {bookingFor === 'someone_else' && (
              <View style={styles.otherFieldsContainer}>
                <View style={styles.inputGroup}>
                  <MedText style={styles.inputLabel}>Full Name *</MedText>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    placeholder="Patient's Full Name"
                    placeholderTextColor="#94A3B8"
                    value={otherName}
                    onChangeText={setOtherName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <MedText style={styles.inputLabel}>Phone Number *</MedText>
                  <View style={[styles.phoneInputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <MedText style={styles.phonePrefix}>+251</MedText>
<TextInput
                          style={[styles.phoneInput, { color: theme.text }]}
                          placeholder="912 345 678"
                          placeholderTextColor="#94A3B8"
                          keyboardType="phone-pad"
                          maxLength={9}
                          value={otherPhone}
                          onChangeText={(t) => setOtherPhone(ethiopianPhoneDigits(t))}
                        />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Section: Referral paper (optional) */}
          <View style={styles.formSection}>
            <MedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Referral paper (optional)
            </MedText>

            <Pressable
              onPress={handlePickPhoto}
              style={[styles.uploadBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              {referralPhoto ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: referralPhoto }} style={styles.previewImg} />
                  <Pressable
                    onPress={() => setReferralPhoto(null)}
                    style={styles.removePhotoBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={22} color="#DC2626" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.uploadContent}>
                  <Ionicons name="arrow-up-outline" size={26} color="#64748B" />
                  <MedText style={styles.uploadText}>Upload referral photo</MedText>
                </View>
              )}
            </Pressable>
          </View>

          {/* Section: Date Picker */}
          <View style={styles.formSection}>
            <MedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Date
            </MedText>
            <Pressable
              onPress={() => setDatePickerVisible(true)}
              style={[styles.dropdownBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <MedText style={[styles.dropdownText, { color: selectedDateId ? theme.text : '#94A3B8' }]} numberOfLines={1}>
                {selectedDateLabel}
              </MedText>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* Section: Available Slots */}
          <View style={styles.formSection}>
            <MedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Available Slots
            </MedText>
            {slotsLoading ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
            ) : slotsForDate.length === 0 ? (
              <View style={styles.noSlotsBox}>
                <MedText style={styles.noSlotsText}>No available slots for this date.</MedText>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {slotsForDate.map((slot) => {
                  const maxPatients = slot.maxPatients;
                  const booked = slot._count?.bookings ?? 0;
                  const isFull =
                    typeof maxPatients === 'number' && maxPatients > 0 && booked >= maxPatients;
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <Pressable
                      key={slot.id ?? slot.startTime}
                      disabled={isFull}
                      onPress={() => setSelectedSlot(slot)}
                      style={[
                        styles.slotPill,
                        isFull && { opacity: 0.4 },
                        isSelected
                          ? { backgroundColor: '#1E56A0', borderColor: '#1E56A0' }
                          : { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <MedText
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: isSelected
                            ? '#FFF'
                            : isFull
                            ? theme.textSecondary
                            : theme.text,
                        }}
                      >
                        {fmtSlot(slot.startTime)}
                      </MedText>
                      {maxPatients != null &&
                        (isFull || booked != null) && (
                          <MedText
                            style={{
                              fontSize: 10,
                              marginTop: 2,
                              color: isSelected ? '#FFF' : theme.textSecondary,
                            }}
                          >
                            {isFull ? 'Full' : `${Math.max(0, maxPatients - booked)} left`}
                          </MedText>
                        )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Section: Reason (optional) */}
          <View style={styles.formSection}>
            <MedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Reason (optional)
            </MedText>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="Describe your symptoms..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
            />
          </View>

          {/* Section: Fee Summary */}
          {doctor && (
            <View style={[styles.formSection, styles.feeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.summaryRow}>
                <MedText style={styles.summaryLabel}>App Service Fee</MedText>
                <MedText style={styles.summaryValue}>{serviceFeeAmount.toFixed(2)} ETB</MedText>
              </View>

              {cardFeeAmount > 0 && (
                <Pressable onPress={() => setIncludeCardFee(!includeCardFee)} style={styles.summaryRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="card-outline" size={16} color="#64748B" />
                    <MedText style={styles.summaryLabel}>Hospital Card Price</MedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MedText style={styles.summaryValue}>{cardFeeAmount.toFixed(2)} ETB</MedText>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: includeCardFee ? '#1E56A0' : 'transparent',
                          borderColor: includeCardFee ? '#1E56A0' : theme.border,
                        },
                      ]}
                    >
                      {includeCardFee && <Ionicons name="checkmark" size={12} color="#FFF" />}
                    </View>
                  </View>
                </Pressable>
              )}

              <View
                style={[
                  styles.summaryRow,
                  { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12, marginTop: 6 },
                ]}
              >
                <MedText style={[styles.summaryLabel, { fontWeight: '800', fontSize: 16, color: theme.text }]}>
                  Total Amount
                </MedText>
                <MedText style={[styles.summaryValue, { fontWeight: '800', fontSize: 16, color: '#1E56A0' }]}>
                  {totalPayable.toFixed(2)} ETB
                </MedText>
              </View>
            </View>
          )}

          {/* Medical Disclaimer */}
          <MedicalDisclaimer />

          {/* Bottom Action Button */}
          <Pressable
            style={[styles.continueButton, { backgroundColor: '#1E56A0' }]}
            onPress={handleContinueToPayment}
          >
            <MedText style={styles.continueButtonText}>Continue to Payment</MedText>
          </Pressable>
        </ScrollView>

        {/* Date Selector Modal */}
        <Modal visible={datePickerVisible} transparent animationType="slide" onRequestClose={() => setDatePickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.pickerModalHeader}>
                <MedText variant="h2">Select Date</MedText>
                <Pressable onPress={() => setDatePickerVisible(false)} hitSlop={10}>
                  <Ionicons name="close" size={22} color={theme.text} />
                </Pressable>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                {scheduleDates.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedDateId(item.id);
                      setDatePickerVisible(false);
                    }}
                    style={[
                      styles.dateOption,
                      selectedDateId === item.id && { backgroundColor: '#EFF6FF' },
                    ]}
                  >
                    <MedText
                      style={{
                        fontSize: 15,
                        fontWeight: selectedDateId === item.id ? '700' : '500',
                        color: selectedDateId === item.id ? '#1E56A0' : theme.text,
                      }}
                    >
                      {item.label}
                    </MedText>
                    {selectedDateId === item.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#1E56A0" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ─── Step 2: Payment Summary Step ──────────────────────────────
  if (step === 'payment') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.formScroll}>
          <Pressable onPress={() => setStep('form')} style={styles.backLink}>
            <Ionicons name="arrow-back" size={20} color="#1E56A0" />
            <MedText style={styles.backLinkText}>Back</MedText>
          </Pressable>

          <View style={styles.paymentHeader}>
            <MedText variant="h1">Payment Summary</MedText>
            <MedText style={styles.paymentSubtitle}>
              Review details and proceed with Telebirr payment.
            </MedText>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.summaryRow}>
              <MedText style={styles.summaryLabel}>Doctor</MedText>
              <MedText style={styles.summaryValue}>{doctorName}</MedText>
            </View>

            <View style={styles.summaryRow}>
              <MedText style={styles.summaryLabel}>Date</MedText>
              <MedText style={styles.summaryValue}>
                {scheduleDates.find((d) => d.id === selectedDateId)?.label || selectedDateId}
              </MedText>
            </View>

            <View style={styles.summaryRow}>
              <MedText style={styles.summaryLabel}>Patient</MedText>
              <MedText style={styles.summaryValue}>
                {bookingFor === 'someone_else' ? otherName : 'Myself'}
              </MedText>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.summaryRow}>
              <MedText style={styles.summaryLabel}>App Service Fee</MedText>
              <MedText style={styles.summaryValue}>{serviceFeeAmount.toFixed(2)} ETB</MedText>
            </View>

            {cardFeeAmount > 0 && (
              <Pressable onPress={() => setIncludeCardFee(!includeCardFee)} style={styles.summaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="card-outline" size={16} color="#64748B" />
                  <MedText style={styles.summaryLabel}>Hospital Card Price</MedText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MedText style={styles.summaryValue}>{cardFeeAmount.toFixed(2)} ETB</MedText>
                  <View style={[styles.checkbox, { backgroundColor: includeCardFee ? '#1E56A0' : 'transparent', borderColor: includeCardFee ? '#1E56A0' : theme.border }]}>
                    {includeCardFee && <Ionicons name="checkmark" size={12} color="#FFF" />}
                  </View>
                </View>
              </Pressable>
            )}

            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12, marginTop: 6 }]}>
              <MedText style={[styles.summaryLabel, { fontWeight: '800', fontSize: 16, color: theme.text }]}>Total Amount</MedText>
              <MedText style={[styles.summaryValue, { fontWeight: '800', fontSize: 16, color: '#1E56A0' }]}>
                {totalPayable.toFixed(2)} ETB
              </MedText>
            </View>
          </View>

          <MedicalDisclaimer />

          <MedButton
            title={paymentLoading ? "Processing..." : `Pay ${totalPayable.toFixed(2)} ETB & Confirm`}
            onPress={handlePayAndConfirm}
            loading={paymentLoading}
            style={{ marginTop: 24 }}
          />
        </ScrollView>
      </View>
    );
  }

  // ─── Step 3: Success Screen ────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.successScroll}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark" size={40} color="#FFFFFF" />
        </View>

        <MedText variant="h1" style={[styles.successTitle, { color: theme.text }]}>
          Appointment Requested!
        </MedText>
        <MedText style={styles.successDesc}>
          Your appointment request has been submitted successfully.
        </MedText>

        <View style={[styles.successCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {createdAppointment?.id && (
            <MedText style={styles.successCardRow}>
              Appointment ID: <MedText style={{ fontWeight: '800' }}>#{createdAppointment.id}</MedText>
            </MedText>
          )}
          <MedText style={[styles.successCardRow, { marginTop: 6, color: theme.textSecondary }]}>
            With: <MedText style={{ fontWeight: '700', color: theme.text }}>{doctorName}</MedText>
          </MedText>
          <MedText style={[styles.successCardRow, { marginTop: 6, color: theme.textSecondary }]}>
            Date: {scheduleDates.find((d) => d.id === selectedDateId)?.label || selectedDateId}
          </MedText>
        </View>

        <MedButton
          title="View My Appointments"
          onPress={() => router.replace('/(tabs)/appointments')}
          style={{ width: '100%', marginTop: 24 }}
        />
        <MedButton
          title="Back to Home"
          type="outline"
          onPress={() => router.replace('/')}
          style={{ width: '100%', marginTop: 10 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  togglePill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 14,
  },
  otherFieldsContainer: {
    marginTop: 14,
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  phonePrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  uploadBox: {
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadContent: {
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  textArea: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    height: 90,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  noSlotsBox: {
    padding: 14,
    backgroundColor: '#FEF3F2',
    borderRadius: 12,
    alignItems: 'center',
  },
  noSlotsText: {
    color: '#B42318',
    fontSize: 13,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    width: '30%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  feeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  continueButton: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#1E56A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E56A0',
  },
  paymentHeader: {
    marginBottom: 20,
  },
  paymentSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successScroll: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  successCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  successCardRow: {
    fontSize: 14,
  },
});
