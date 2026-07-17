import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Colors } from '../../constants/theme';
import { BASE_URL } from '../../constants/api';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { MedText } from '../medconnect/MedText';
import { nameAutofill, phoneNationalAutofill } from '../../utils/autofill';
import { MedCard } from '../medconnect/MedCard';
import { MedButton } from '../medconnect/MedButton';
import { RootState, AppDispatch } from '../../store';
import { setBookingFor, setOtherPatientField, setOtherPatientDetails } from '../../store/slices/appointmentSlice';
import { formatDate } from '../../utils/ethiopianDate';
import DatePickerModal from '../DatePickerModal';
import { useTimeFormat } from '../../utils/timeFormat';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const PHONE_PREFIX = '+251';

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface SponsorPickerProps {
  onContinue: () => void;
}

export default function SponsorPicker({ onContinue }: SponsorPickerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isEthiopianCalendar } = useTimeFormat();

  const bookingFor = useSelector((state: RootState) => state.appointment.bookingFor);
  const otherPatient = useSelector((state: RootState) => state.appointment.otherPatientDetails);
  const token = useSelector((state: RootState) => state.auth.token);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (otherPatient.dateOfBirth) {
      const d = new Date(otherPatient.dateOfBirth);
      return isNaN(d.getTime()) ? new Date(2000, 0, 1) : d;
    }
    return new Date(2000, 0, 1);
  });

  const [phoneCheckStatus, setPhoneCheckStatus] = useState<'idle' | 'checking' | 'found' | 'not_found'>('idle');
  const [existingPatient, setExistingPatient] = useState<any>(null);
  const [registeredByMe, setRegisteredByMe] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const fullPhone = otherPatient.phone;

    if (fullPhone.startsWith(PHONE_PREFIX) && fullPhone.length === PHONE_PREFIX.length + 9) {
      if (fullPhone === checkingPhone) return;
      setCheckingPhone(fullPhone);
      setPhoneCheckStatus('checking');
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await axios.post(
            `${BASE_URL}/api/patients/check-phone`,
            { phone: fullPhone },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const data = res.data.data;
          if (data.exists) {
            setExistingPatient(data.patient);
            setRegisteredByMe(data.registeredByMe);
            setPhoneCheckStatus('found');
            const dob = data.patient.dateOfBirth
              ? formatDateISO(new Date(data.patient.dateOfBirth))
              : '';
            dispatch(setOtherPatientDetails({
              fullName: data.patient.fullName || '',
              phone: fullPhone,
              gender: data.patient.gender ? data.patient.gender.toLowerCase() : 'male',
              dateOfBirth: dob,
              bloodType: data.patient.bloodType || '',
            }));
          } else {
            setPhoneCheckStatus('not_found');
            setExistingPatient(null);
            setRegisteredByMe(false);
          }
        } catch {
          setPhoneCheckStatus('idle');
        }
      }, 600);
    } else {
      setPhoneCheckStatus('idle');
      setExistingPatient(null);
      setRegisteredByMe(false);
      setCheckingPhone('');
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [otherPatient.phone]);

  const handleFieldChange = (field: string, value: string) => {
    dispatch(setOtherPatientField({ field: field as any, value }));
  };

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 9) {
      handleFieldChange('phone', PHONE_PREFIX + digits);
    }
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    handleFieldChange('dateOfBirth', formatDateISO(date));
    setShowDatePicker(false);
  };

  const phoneDigits = otherPatient.phone.startsWith(PHONE_PREFIX)
    ? otherPatient.phone.slice(PHONE_PREFIX.length)
    : '';

  const displayDate = otherPatient.dateOfBirth
    ? (() => {
        const d = new Date(otherPatient.dateOfBirth);
        if (isNaN(d.getTime())) return 'Select date of birth';
        return formatDate(d, 'full');
      })()
    : 'Select date of birth';

  const showEditableFields = phoneCheckStatus !== 'found' || registeredByMe;
  const showReadOnlyFields = phoneCheckStatus === 'found' && !registeredByMe && existingPatient;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MedText variant="h1">Who is this for?</MedText>
          <MedText variant="body" style={{ marginTop: 8, lineHeight: 22 }}>
            Let us know who this appointment is for.
          </MedText>
        </View>

        <MedCard style={{ marginTop: 20, padding: 0, overflow: 'hidden' }}>
          <Pressable
            onPress={() => dispatch(setBookingFor('myself'))}
            style={[styles.sponsorOption, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
          >
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '10' }]}>
              <Ionicons name="person" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <MedText variant="body" style={{ fontSize: 16, fontWeight: bookingFor === 'myself' ? '500' : '400', color: theme.text }}>
                Book for Myself
              </MedText>
              <MedText variant="metadata" style={{ marginTop: 2 }}>Schedule your own appointment</MedText>
            </View>
            {bookingFor === 'myself' && (
              <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
            )}
          </Pressable>

          <Pressable
            onPress={() => dispatch(setBookingFor('someone_else'))}
            style={styles.sponsorOption}
          >
            <View style={[styles.avatarCircle, { backgroundColor: '#FEF3F2' }]}>
              <Ionicons name="people" size={20} color="#B42318" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <MedText variant="body" style={{ fontSize: 16, fontWeight: bookingFor === 'someone_else' ? '500' : '400', color: theme.text }}>
                Book for Someone Else
              </MedText>
              <MedText variant="metadata" style={{ marginTop: 2 }}>Family member, friend, or dependent</MedText>
            </View>
            {bookingFor === 'someone_else' && (
              <Ionicons name="checkmark-circle" size={20} color="#B42318" />
            )}
          </Pressable>
        </MedCard>

        {bookingFor === 'someone_else' && (
          <MedCard style={{ marginTop: 16, padding: 18 }}>
            <MedText variant="metadata" style={styles.sectionTitle}>Patient details</MedText>

            <View style={styles.field}>
              <MedText variant="metadata" style={styles.fieldLabel}>Phone Number</MedText>
              <View style={[styles.phoneRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <View style={[styles.phonePrefix, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <MedText variant="body" style={{ fontWeight: '500', color: theme.textSecondary }}>{PHONE_PREFIX}</MedText>
                </View>
                <TextInput
                  style={[styles.phoneInput, { color: theme.text }]}
                  placeholder="9X XXX XXXX"
                  placeholderTextColor={theme.muted}
                  keyboardType="phone-pad"
                  value={phoneDigits}
                  onChangeText={handlePhoneChange}
                  maxLength={9}
                  autoCorrect={false}
                  {...phoneNationalAutofill}
                />
              </View>
              {phoneCheckStatus === 'checking' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <MedText variant="metadata" style={{ marginLeft: 6, color: theme.muted }}>Checking...</MedText>
                </View>
              )}
            </View>

            {phoneCheckStatus === 'found' && existingPatient && (
              <View style={{
                marginBottom: 16, padding: 12, borderRadius: 10,
                backgroundColor: registeredByMe ? '#ECFDF5' : '#FEF3F2',
                borderWidth: 1, borderColor: registeredByMe ? '#A7F3D0' : '#FECDCA',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={registeredByMe ? 'information-circle' : 'warning'}
                    size={18}
                    color={registeredByMe ? '#059669' : '#B42318'}
                  />
                  <MedText
                    variant="metadata"
                    style={{
                      marginLeft: 8,
                      color: registeredByMe ? '#065F46' : '#B42318',
                      fontWeight: '500', flex: 1,
                    }}
                  >
                    {registeredByMe
                      ? `You previously registered ${existingPatient.fullName || 'this person'}. You can update their details below.`
                      : `This number belongs to ${existingPatient.fullName || 'a registered patient'}. Booking for them.`}
                  </MedText>
                </View>
              </View>
            )}

            {showEditableFields && (
              <>
                <View style={styles.field}>
                  <MedText variant="metadata" style={styles.fieldLabel}>Full Name</MedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    placeholder="e.g. Abebe Kebede"
                    placeholderTextColor={theme.muted}
                    value={otherPatient.fullName}
                    onChangeText={(v) => handleFieldChange('fullName', v)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    {...nameAutofill}
                  />
                </View>

                <View style={styles.field}>
                  <MedText variant="metadata" style={styles.fieldLabel}>Gender</MedText>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {(['male', 'female'] as const).map((g) => (
                      <Pressable
                        key={g}
                        onPress={() => handleFieldChange('gender', g)}
                        style={[
                          styles.genderOption,
                          {
                            borderColor: otherPatient.gender === g ? theme.primary : theme.border,
                            backgroundColor: otherPatient.gender === g ? `${theme.primary}12` : theme.surface,
                          },
                        ]}
                      >
                        <Ionicons name={g === 'male' ? 'male' : 'female'} size={16} color={otherPatient.gender === g ? theme.primary : theme.muted} />
                        <MedText variant="body" style={{ color: otherPatient.gender === g ? theme.primary : theme.textSecondary, fontWeight: otherPatient.gender === g ? '500' : '400' }}>
                          {g === 'male' ? 'Male' : 'Female'}
                        </MedText>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <MedText variant="metadata" style={styles.fieldLabel}>Date of Birth</MedText>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    style={[styles.datePickerButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  >
                    <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                    <MedText
                      variant="body"
                      style={{
                        flex: 1,
                        marginLeft: 10,
                        color: otherPatient.dateOfBirth ? theme.text : theme.muted,
                      }}
                    >
                      {displayDate}
                    </MedText>
                    <Ionicons name="chevron-down" size={16} color={theme.muted} />
                  </Pressable>
                  <DatePickerModal
                    visible={showDatePicker}
                    value={selectedDate}
                    onConfirm={handleDateConfirm}
                    onCancel={() => setShowDatePicker(false)}
                    maximumDate={new Date()}
                    calendar={isEthiopianCalendar ? 'ethiopian' : 'gregorian'}
                  />
                </View>

                <View style={styles.field}>
                  <MedText variant="metadata" style={styles.fieldLabel}>Blood Type (optional)</MedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {BLOOD_TYPES.map((bt) => (
                        <Pressable
                          key={bt}
                          onPress={() => handleFieldChange('bloodType', otherPatient.bloodType === bt ? '' : bt)}
                          style={[
                            styles.bloodTypeChip,
                            {
                              borderColor: otherPatient.bloodType === bt ? theme.primary : theme.border,
                              backgroundColor: otherPatient.bloodType === bt ? `${theme.primary}12` : theme.surface,
                            },
                          ]}
                        >
                          <MedText variant="metadata" style={{ color: otherPatient.bloodType === bt ? theme.primary : theme.muted }}>
                            {bt}
                          </MedText>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </>
            )}

            {showReadOnlyFields && (
              <>
                <View style={styles.field}>
                  <MedText variant="metadata" style={styles.fieldLabel}>Full Name</MedText>
                  <View style={[styles.readOnlyField, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <MedText variant="body" style={{ color: theme.text }}>{existingPatient.fullName || 'Not provided'}</MedText>
                  </View>
                </View>

                <View style={styles.field}>
                  <MedText variant="metadata" style={styles.fieldLabel}>Gender</MedText>
                  <View style={[styles.readOnlyField, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <MedText variant="body" style={{ color: theme.text }}>
                      {existingPatient.gender === 'male' ? 'Male' : existingPatient.gender === 'female' ? 'Female' : 'Not provided'}
                    </MedText>
                  </View>
                </View>

                <View style={styles.field}>
                  <MedText variant="metadata" style={styles.fieldLabel}>Date of Birth</MedText>
                  <View style={[styles.readOnlyField, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <MedText variant="body" style={{ color: theme.text }}>
                      {existingPatient.dateOfBirth
                        ? formatDate(new Date(existingPatient.dateOfBirth), 'full')
                        : 'Not provided'}
                    </MedText>
                  </View>
                </View>

                <View style={styles.field}>
                  <MedText variant="metadata" style={styles.fieldLabel}>Blood Type</MedText>
                  <View style={[styles.readOnlyField, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <MedText variant="body" style={{ color: theme.text }}>{existingPatient.bloodType || 'Not provided'}</MedText>
                  </View>
                </View>
              </>
            )}

            <MedButton title="Continue" onPress={onContinue} style={{ marginTop: 8 }} />
          </MedCard>
        )}

        {bookingFor === 'myself' && (
          <MedButton title="Continue" onPress={onContinue} style={{ marginTop: 20 }} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  header: { marginBottom: 8, paddingTop: 32 },
  sectionTitle: {
    marginBottom: 16,
    textTransform: 'none',
    letterSpacing: 0,
  },
  field: { marginBottom: 14 },
  fieldLabel: { marginBottom: 6 },
  sponsorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    fontWeight: '400',
  },
  readOnlyField: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  bloodTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    fontWeight: '400',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
});
