import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { MedText } from '../components/medconnect/MedText';
import { MedButton } from '../components/medconnect/MedButton';
import { MedCard } from '../components/medconnect/MedCard';
import { TelegramBubble } from '../components/medconnect/TelegramBubble';
import { AppDispatch, RootState } from '../store';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { BASE_URL, TELEBIRR_URL } from '../constants/api';
import {
  fetchCategories,
  fetchRecommendations,
  createAppointment,
  fetchDoctorScheduleSlots,
  resetRecommendations,
  resetBookingState,
} from '../store/slices/appointmentSlice';
import { fetchDoctors } from '../store/slices/doctorSlice';
import SponsorPicker from '../components/booking/SponsorPicker';
import ReferralUploader from '../components/booking/ReferralUploader';
import { formatDate, formatEthiopianLocalTime } from '../utils/ethiopianDate';
import { useTimeFormat } from '../utils/timeFormat';

interface ScheduleSlot {
  id: number;
  startTime: string;
  endTime: string;
  maxPatients: number;
  _count: { bookings: number };
}

interface DoctorSchedule {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  slots: ScheduleSlot[];
}

function fmtSlotTime(iso: string, eth?: boolean) {
  const d = new Date(iso);
  if (eth) return formatEthiopianLocalTime(d);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function BookingModal() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isEthiopian } = useTimeFormat();

  const { categories, recommendations, loading, error } = useSelector((state: RootState) => state.appointment);
  const { token } = useSelector((state: RootState) => state.auth);
  const { doctors } = useSelector((state: RootState) => state.doctors);

  const [step, setStep] = useState<'sponsor' | 'issue' | 'recommendations' | 'referrals' | 'datetime' | 'payment' | 'confirm' | 'success'>('sponsor');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [includeCardFee, setIncludeCardFee] = useState(false);

  const [attachmentsUrl, setAttachmentsUrl] = useState<string[]>([]);

  const bookingFor = useSelector((state: RootState) => state.appointment.bookingFor);
  const otherPatientDetails = useSelector((state: RootState) => state.appointment.otherPatientDetails);

  // Schedule state
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [scheduleDates, setScheduleDates] = useState<{ id: string; day: string; date: string; label: string }[]>([]);
  const [selectedDateId, setSelectedDateId] = useState('');
  const [slotsForDate, setSlotsForDate] = useState<ScheduleSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const doctorId = params.doctorId ? parseInt(params.doctorId as string) : null;
  const doctor = useMemo(() => doctors.find((d) => d.id === doctorId), [doctors, doctorId]);

  const doctorName = params.doctorName as string || 'Doctor';

  const doctorFee = useMemo(() => {
    if (doctor?.hospital?.cardPrice) {
      return parseFloat(doctor.hospital.cardPrice);
    }
    const rawFee = params.doctorFee as string;
    return (rawFee && rawFee !== 'null' && rawFee !== 'undefined') ? parseFloat(rawFee) : 0;
  }, [doctor, params.doctorFee]);

  // Deriving service fee and card fee from doctor hospital metadata
  const serviceFeeAmount = useMemo(() => {
    if (doctor?.hospital?.serviceFee?.amount) {
      return parseFloat(doctor.hospital.serviceFee.amount);
    }
    return 50.00; // Default service fee fallback
  }, [doctor]);

  const cardFeeAmount = useMemo(() => {
    // 1st Priority: Active cardTemplate (pre-ordered package) price
    if (doctor?.hospital?.cardTemplates && doctor.hospital.cardTemplates.length > 0) {
      const activeTemplate = doctor.hospital.cardTemplates.find(t => t.isActive !== false) || doctor.hospital.cardTemplates[0];
      if (activeTemplate) {
        return parseFloat(activeTemplate.price);
      }
    }
    // 2nd Priority: Base hospital cardPrice
    if (doctor?.hospital?.cardPrice) {
      return parseFloat(doctor.hospital.cardPrice);
    }
    return 100.00; // Default card price fallback
  }, [doctor]);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchDoctors());
    dispatch(resetBookingState());
  }, [dispatch]);

  const loadSchedules = async () => {
    if (!doctorId) return;
    setSlotsLoading(true);
    try {
      const result = await dispatch(fetchDoctorScheduleSlots({ doctorId })).unwrap();
      setSchedules(result || []);
      // Derive unique dates
      const dates = (result || []).map((s: DoctorSchedule) => {
        const d = new Date(s.date);
        return {
          id: d.toISOString().split('T')[0],
          day: formatDate(d, 'weekday-short'),
          date: formatDate(d, 'month-day'),
          label: formatDate(d, 'full'),
        };
      });
      // Deduplicate by id
      const unique = dates.filter((d: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === d.id) === i);
      setScheduleDates(unique);
      if (unique.length > 0) {
        setSelectedDateId(unique[0].id);
      }
    } catch { /* handled by UI */ }
    finally { setSlotsLoading(false); }
  };

  // When date changes, derive the slots for that date
  useEffect(() => {
    if (!selectedDateId || schedules.length === 0) { setSlotsForDate([]); return; }
    const daySchedules = schedules.filter((s: DoctorSchedule) =>
      new Date(s.date).toISOString().split('T')[0] === selectedDateId
    );
    const allSlots = daySchedules.flatMap((s: DoctorSchedule) => s.slots || []);
    allSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    setSlotsForDate(allSlots);
    setSelectedSlot(null);
  }, [selectedDateId, schedules]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    dispatch(fetchRecommendations(category));
    setStep('recommendations');
  };

  const toggleDoc = (key: string) => {
    setCheckedDocs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = async () => {
    if (!doctorId || !selectedSlot) return;

    try {
      const totalPayable = serviceFeeAmount + (includeCardFee ? cardFeeAmount : 0);
      const verifyRes = await axios.post(
        `${BASE_URL}/api/payments/verify-telebirr`,
        { amount: totalPayable },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (verifyRes.data.status !== 'success' || !verifyRes.data.data.paid) {
        alert('Payment verification failed. Please complete the payment first.');
        return;
      }

      const payload: any = {
        doctorId,
        dateTime: selectedSlot.startTime,
        fee: doctorFee,
        slotId: selectedSlot.id,
        issueCategory: selectedCategory,
        notes: notes,
        reason: categories.find(c => c.key === selectedCategory)?.label,
        paymentMethod: includeCardFee ? 'card' : 'service_fee',
        paidCardFee: includeCardFee,
        attachments: attachmentsUrl.length > 0 ? attachmentsUrl : undefined,
      };

      if (bookingFor === 'someone_else') {
        payload.otherPatientDetails = {
          fullName: otherPatientDetails.fullName,
          phone: otherPatientDetails.phone.replace(/\s+/g, ''),
          gender: otherPatientDetails.gender,
          dateOfBirth: otherPatientDetails.dateOfBirth || undefined,
          bloodType: otherPatientDetails.bloodType || undefined,
        };
      }

      const result = await dispatch(createAppointment(payload));

      if (createAppointment.fulfilled.match(result)) {
        setStep('success');
      }
    } catch (err: any) {
      console.error('Final booking failed:', err.message);
      alert('An error occurred while confirming your appointment.');
    }
  };

  const renderHeader = (title: string, subtitle: string) => (
    <View style={styles.header}>
      <MedText variant="h1">{title}</MedText>
      <MedText variant="body" style={{ marginTop: 6, lineHeight: 22 }}>
        {subtitle}
      </MedText>
    </View>
  );

  // ─── Step 1: Who is this for? ──────────────────────────────────
  if (step === 'sponsor') {
    return (
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 16, left: 20, zIndex: 10, padding: 4 }}
          hitSlop={12}
        >
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <SponsorPicker
          onContinue={() => {
            if (bookingFor === 'someone_else' && !otherPatientDetails.phone) {
              alert('Please enter the phone number of the person you are booking for.');
              return;
            }
            if (doctorId) loadSchedules();
            setStep(doctorId ? 'referrals' : 'issue');
          }}
        />
      </View>
    );
  }

  // ─── Step 2: Issue Selection ────────────────────────────────────
  if (step === 'issue') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Pressable
            onPress={() => setStep('sponsor')}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.primary} />
            <MedText variant="body" style={{ marginLeft: 6, color: theme.primary, fontWeight: '500' }}>Change who this is for</MedText>
          </Pressable>
          {renderHeader("How can we help you?", "Tell us what you're experiencing, and we'll guide you to the right care.")}

          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => handleCategorySelect(cat.key)}
                style={[styles.categoryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: theme.primary + '10' }]}>
                  <Ionicons name={cat.icon as any || 'medical'} size={24} color={theme.primary} />
                </View>
                <MedText variant="metadata" style={{ marginTop: 10, textAlign: 'center' }}>{cat.label}</MedText>
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 32 }}>
            <MedText variant="metadata" style={styles.sectionLabel}>Optional: describe your symptoms</MedText>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text, height: 80 }]}
              placeholder="e.g. I have a persistent headache and fever..."
              placeholderTextColor={theme.muted}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Step 2: Recommendations ────────────────────────────────────
  if (step === 'recommendations') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Pressable
            onPress={() => setStep('sponsor')}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.primary} />
            <MedText variant="body" style={{ marginLeft: 6, color: theme.primary, fontWeight: '500' }}>Change who this is for</MedText>
          </Pressable>
          {renderHeader("Recommendations", `For ${recommendations?.label || 'this issue'}, we recommend having these documents ready.`)}

          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={{ marginTop: 24 }}>
              <View style={[styles.infoBanner, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                <MedText variant="metadata" style={{ flex: 1, marginLeft: 10, color: theme.primary }}>
                  To make the most of your visit, we suggest having these ready for the doctor.
                </MedText>
              </View>

              {recommendations?.documents.map((doc: any) => (
                <View
                  key={doc.key}
                  style={[styles.docItem, { borderBottomColor: 'transparent' }]}
                >
                  <View style={[styles.infoIcon, { backgroundColor: '#F2F4F7' }]}>
                    <Ionicons name="document-text-outline" size={18} color={theme.muted} />
                  </View>
                  <View style={styles.docInfo}>
                    <MedText variant="body" style={{ fontSize: 15, fontWeight: '500' }}>{doc.label}</MedText>
                    <MedText variant="metadata" style={{ marginTop: 2 }}>{doc.description}</MedText>
                  </View>
                </View>
              ))}

              <MedButton 
                title="Got it, Continue" 
                onPress={() => { if (doctorId) loadSchedules(); setStep('referrals'); }} 
                style={{ marginTop: 32 }}
              />
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ─── Step 4: Referral Documents ───────────────────────────────
  if (step === 'referrals') {
    return (
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={() => setStep(doctorId ? 'sponsor' : 'recommendations')}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 }}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
          <MedText variant="body" style={{ marginLeft: 6, color: theme.primary, fontWeight: '500' }}>Back</MedText>
        </Pressable>
        <ReferralUploader
          attachments={attachmentsUrl}
          onAttachmentsChange={setAttachmentsUrl}
          onContinue={() => setStep('datetime')}
          onSkip={() => setStep('datetime')}
        />
      </View>
    );
  }

  // ─── Step 5: Date & Time (Real Schedule Slots) ──────────────────
  if (step === 'datetime') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Pressable
            onPress={() => setStep('referrals')}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.primary} />
            <MedText variant="body" style={{ marginLeft: 6, color: theme.primary, fontWeight: '500' }}>Back</MedText>
          </Pressable>
          {renderHeader("Pick a Time", `Select an available slot for your visit.`)}

          {bookingFor === 'someone_else' && (
            <Pressable
              onPress={() => setStep('sponsor')}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, padding: 14, backgroundColor: '#FEF3F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECDCA' }}
            >
              <Ionicons name="people" size={20} color="#B42318" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <MedText variant="body" style={{ color: '#B42318', fontWeight: '500' }}>
                  Booking for: {otherPatientDetails.fullName || 'Someone else'}
                </MedText>
              </View>
              <MedText variant="metadata" style={{ color: '#B42318', fontWeight: '500' }}>Change</MedText>
            </Pressable>
          )}

          <MedCard style={{ marginTop: 20, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '10', width: 48, height: 48, borderRadius: 24 }]}>
              <Ionicons name="medical" size={20} color={theme.primary} />
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <MedText variant="body" style={{ fontSize: 16, fontWeight: '500' }}>{doctorName}</MedText>
              <MedText variant="metadata" style={{ color: theme.muted, marginTop: 2 }}>
                {doctor?.specialization || params.doctorSpecialty || 'Specialist'} • {doctor?.hospital?.name || 'Clinic'}
              </MedText>
            </View>
            {doctorFee > 0 && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: theme.primary + '10' }}>
                <MedText variant="metadata" style={{ fontWeight: '500', color: theme.primary }}>{doctorFee} ETB</MedText>
              </View>
            )}
          </MedCard>

          {slotsLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 48 }} />
          ) : scheduleDates.length === 0 ? (
            <View style={{ marginTop: 40, alignItems: 'center', padding: 24 }}>
              <Ionicons name="calendar-outline" size={48} color={theme.muted} />
              <MedText variant="h2" style={{ marginTop: 16, textAlign: 'center' }}>No Available Schedules</MedText>
              <MedText variant="body" style={{ color: theme.muted, textAlign: 'center', marginTop: 8 }}>
                This doctor has no upcoming schedules yet. Please check back later.
              </MedText>
            </View>
          ) : (
            <>
              <View style={{ marginTop: 28 }}>
                <MedText variant="metadata" style={styles.sectionLabel}>SELECT DATE</MedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                  {scheduleDates.map((d) => (
                    <Pressable
                      key={d.id}
                      onPress={() => setSelectedDateId(d.id)}
                      style={[
                        styles.dateCard,
                        { borderColor: theme.border, backgroundColor: theme.surface },
                        selectedDateId === d.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                    >
                      <MedText variant="metadata" style={{ color: selectedDateId === d.id ? '#FFF' : theme.muted, fontWeight: '500' }}>
                        {d.day}
                      </MedText>
                      <MedText variant="body" style={{ color: selectedDateId === d.id ? '#FFF' : theme.text, marginTop: 4, fontSize: 14, fontWeight: '500' }}>
                        {d.date}
                      </MedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={{ marginTop: 28 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <MedText variant="metadata" style={[styles.sectionLabel, { marginBottom: 0 }]}>AVAILABLE SLOTS</MedText>
                  {selectedSlot && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="checkmark-circle" size={14} color={'#027A48'} />
                      <MedText variant="metadata" style={{ color: '#027A48', fontWeight: '500' }}>Slot selected</MedText>
                    </View>
                  )}
                </View>
                {slotsForDate.length === 0 ? (
                  <View style={{ padding: 16, backgroundColor: '#FEF3F2', borderRadius: 12 }}>
                    <MedText variant="body" style={{ color: '#B42318', fontSize: 13 }}>
                      No available slots for this date.
                    </MedText>
                  </View>
                ) : (
                  <View style={styles.timeGrid}>
                    {slotsForDate.map((slot) => {
                      const filled = slot._count.bookings;
                      const max = slot.maxPatients;
                      const isFull = filled >= max;
                      const isSelected = selectedSlot?.id === slot.id;
                      const spotsLeft = max - filled;
                      return (
                        <Pressable
                          key={slot.id}
                          disabled={isFull}
                          onPress={() => setSelectedSlot(isSelected ? null : slot)}
                          style={[
                            styles.timeChip,
                            {
                              borderColor: isSelected ? theme.primary : isFull ? '#FECDCA' : theme.border,
                              backgroundColor: isSelected ? theme.primary : isFull ? '#FEF3F2' : '#FFFFFF',
                              opacity: isFull ? 0.7 : 1,
                            }
                          ]}
                        >
                          <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <Ionicons
                                name="time-outline"
                                size={14}
                                color={isSelected ? '#FFFFFF' : theme.muted}
                              />
                              <MedText
                                variant="body"
                                style={{
                                  fontSize: 13,
                                  fontWeight: '500',
                                  color: isSelected ? '#FFFFFF' : theme.text,
                                }}
                              >
                                {fmtSlotTime(slot.startTime, isEthiopian)}
                              </MedText>
                            </View>
                            <MedText
                              variant="metadata"
                              style={{
                                fontSize: 10,
                                fontWeight: '400',
                                color: isFull ? '#B42318' : isSelected ? 'rgba(255, 255, 255, 0.8)' : '#067647',
                              }}
                            >
                              {isFull ? 'FULL' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                            </MedText>
                          </View>
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#FFFFFF"
                              style={{ position: 'absolute', top: 4, right: 4 }}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          )}

          <MedButton
            title="Next"
            onPress={() => setStep('payment')}
            disabled={!selectedSlot}
            style={{ marginTop: 32, opacity: selectedSlot ? 1 : 0.5 }}
          />
        </ScrollView>
      </View>
    );
  }

  // ─── Step 4: Payment (Telebirr H5 on port 8080) ─────────────────
  const handlePayment = async () => {
    if (!doctorId) {
      alert('Missing doctor information. Please try again.');
      return;
    }

    const totalPayable = serviceFeeAmount + (includeCardFee ? cardFeeAmount : 0);

    if (totalPayable <= 0) {
      alert('Invalid appointment fee.');
      return;
    }

    try {
      setPaymentLoading(true);
      const checkoutUrl = `${TELEBIRR_URL}/?amount=${encodeURIComponent(String(totalPayable))}`;

      await WebBrowser.openBrowserAsync(checkoutUrl);
      setStep('confirm');
    } catch (err: any) {
      console.error('Payment failed:', err.message);
      alert('Failed to open Telebirr checkout. Check that telebirr-h5 is running on port 8080.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (step === 'payment') {
    const totalPayable = serviceFeeAmount + (includeCardFee ? cardFeeAmount : 0);
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Pressable
            onPress={() => setStep('datetime')}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.primary} />
            <MedText variant="body" style={{ marginLeft: 6, color: theme.primary, fontWeight: '500' }}>Back</MedText>
          </Pressable>
          <View style={styles.header}>
            <MedText variant="h1">Payment Summary</MedText>
            <MedText variant="body" style={{ marginTop: 4, color: theme.muted, fontSize: 13 }}>
              Review charges and pay with Telebirr.
            </MedText>
          </View>

          <MedCard style={{ marginTop: 16, padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <View style={{ backgroundColor: theme.primary + '08', padding: 14, alignItems: 'center' }}>
              <View style={[styles.iconCircle, { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="receipt-outline" size={18} color={theme.primary} />
              </View>
              <MedText variant="body" style={{ marginTop: 6, fontSize: 13, fontWeight: '500' }}>Fee Breakdown</MedText>
              <MedText variant="metadata" style={{ color: theme.muted, marginTop: 2, fontSize: 11 }}>{doctorName}</MedText>
            </View>

            {/* Fee items */}
            <View style={{ padding: 14, gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="business-outline" size={12} color={'#067647'} />
                  </View>
                  <MedText variant="metadata" style={{ fontSize: 12 }}>Service Charge</MedText>
                </View>
                <MedText variant="metadata" style={{ fontWeight: '500', fontSize: 12 }}>{serviceFeeAmount.toFixed(2)} ETB</MedText>
              </View>

              {/* Card fee toggle */}
              <Pressable
                onPress={() => setIncludeCardFee(!includeCardFee)}
                style={[styles.cardFeeRow, {
                  borderColor: includeCardFee ? theme.primary : theme.border,
                  backgroundColor: includeCardFee ? theme.primary + '06' : theme.surface,
                }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: includeCardFee ? theme.primary + '15' : '#FEF3F2', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="card-outline" size={12} color={includeCardFee ? theme.primary : '#B42318'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <MedText variant="metadata" style={{ fontWeight: '500', fontSize: 12 }}>Hospital Card</MedText>
                    <MedText variant="metadata" style={{ color: theme.muted, marginTop: 1, fontSize: 11 }}>New patient registration card</MedText>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MedText variant="metadata" style={{ fontWeight: '500', fontSize: 12 }}>{cardFeeAmount.toFixed(2)} ETB</MedText>
                  <View style={[styles.toggleCircle, { borderColor: includeCardFee ? theme.primary : theme.border, backgroundColor: includeCardFee ? theme.primary : 'transparent' }]}>
                    {includeCardFee && <Ionicons name="checkmark" size={11} color="#FFF" />}
                  </View>
                </View>
              </Pressable>

              <View style={styles.divider} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <MedText variant="body" style={{ fontSize: 13, fontWeight: '500' }}>Total Amount</MedText>
                <MedText variant="body" style={{ fontSize: 14, fontWeight: '500' }} color={theme.primary}>{totalPayable.toFixed(2)} ETB</MedText>
              </View>
            </View>
          </MedCard>

          <MedText variant="metadata" style={{ marginTop: 14, textAlign: 'center', color: theme.muted, fontSize: 11 }}>
            You will be redirected to BM Telebirr checkout.
          </MedText>

          <MedButton
            title={paymentLoading ? "Processing..." : `Pay ${totalPayable.toFixed(2)} ETB`}
            onPress={handlePayment}
            loading={paymentLoading}
            style={{ marginTop: 16 }}
          />
        </ScrollView>
      </View>
    );
  }

  // ─── Step 5: Confirm ───────────────────────────────────────────
  if (step === 'confirm') {
    const selectedDate = scheduleDates.find(d => d.id === selectedDateId);
    const slotTimeLabel = selectedSlot ? `${fmtSlotTime(selectedSlot.startTime, isEthiopian)} – ${fmtSlotTime(selectedSlot.endTime, isEthiopian)}` : '';
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Pressable
            onPress={() => setStep('payment')}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.primary} />
            <MedText variant="body" style={{ marginLeft: 6, color: theme.primary, fontWeight: '500' }}>Back</MedText>
          </Pressable>
          {renderHeader("Final Step", "Review and submit your appointment.")}

          <MedCard style={{ marginTop: 24 }}>
            <MedText variant="metadata" style={styles.sectionLabel}>Appointment summary</MedText>
            <View style={{ marginTop: 12 }}>
              <MedText variant="body" style={{ fontSize: 16, fontWeight: '500' }}>{doctorName}</MedText>
              <MedText variant="body">{categories.find(c => c.key === selectedCategory)?.label}</MedText>
              <MedText variant="body" style={{ color: theme.muted }}>{selectedDate?.label} • {slotTimeLabel}</MedText>

              <View style={[styles.paymentBadge, { backgroundColor: theme.success + '10' }]}>
                <Ionicons name="checkmark-circle" size={14} color={theme.success} />
                <MedText variant="metadata" color={theme.success} style={{ fontWeight: '500', marginLeft: 4 }}>
                  PAID: {(serviceFeeAmount + (includeCardFee ? cardFeeAmount : 0)).toFixed(2)} ETB
                </MedText>
              </View>
            </View>
          </MedCard>

          <View style={{ marginTop: 24 }}>
            <View style={styles.sectionHeader}>
              <MedText variant="metadata" style={styles.sectionLabel}>Message to doctor (optional)</MedText>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.primary} />
            </View>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text, height: 100 }]}
              placeholder="e.g. Describe your symptoms or ask a question..."
              placeholderTextColor={theme.muted}
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <MedButton
            title={loading ? "Submitting..." : "Book Appointment"}
            onPress={handleConfirm}
            disabled={loading}
            style={{ marginTop: 32 }}
          />

          {error && <MedText variant="metadata" style={{ color: 'red', marginTop: 12, textAlign: 'center' }}>{error}</MedText>}
        </ScrollView>
      </View>
    );
  }

  // ─── Step 5: Success ───────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', padding: 20 }]}>
      <TelegramBubble
        content={`Success! Your appointment with ${doctorName} has been requested for ${scheduleDates.find(d => d.id === selectedDateId)?.label || selectedDateId}${selectedSlot ? ', ' + fmtSlotTime(selectedSlot.startTime, isEthiopian) : ''}.`}
        time="Just now"
        isIncoming={true}
      />
      <MedButton
        title="View My Appointments"
        onPress={() => router.replace('/(tabs)/appointments')}
        style={{ marginTop: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  docInfo: {
    flex: 1,
    paddingRight: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  option: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  textArea: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F4F7',
    marginVertical: 16,
    width: '100%',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  ticketCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 0,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  ticketContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  ticketDot: {
    position: 'absolute',
    top: '40%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EAF2FB', // Matches screen bg
    zIndex: 1,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketPrice: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8CA3BD',
    marginBottom: 12,
    letterSpacing: 0.2,
    textTransform: 'none',
  },
  dateScroll: {
    flexDirection: 'row',
  },
  dateCard: {
    width: 72,
    height: 90,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  timeChip: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    width: '48%',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
  },
  timeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
