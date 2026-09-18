import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LanguagePicker } from '../../components/LanguagePicker';
import { MedButton } from '../../components/medconnect/MedButton';
import { MedText } from '../../components/medconnect/MedText';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { AppDispatch, RootState } from '../../store';
import { submitPatientProfile, clearPatientError } from '../../store/slices/patientSlice';
import { fetchPatientProfileStatus, logout } from '../../store/slices/authSlice';
import { nameAutofill, phoneNationalAutofill } from '../../utils/autofill';
import { formatDate } from '../../utils/ethiopianDate';
import DatePickerModal from '../../components/DatePickerModal';
import { useTimeFormat } from '../../utils/timeFormat';
import { BASE_URL } from '../../constants/api';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
  theme: (typeof Colors)['light'];
}

function SelectionChip({ label, selected, onPress, compact, theme }: ChipProps) {
  return (
    <Pressable
      onPress={() => {
        onPress();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      style={[
        styles.chip,
        compact && styles.chipCompact,
        {
          borderColor: selected ? theme.primary : theme.border,
          backgroundColor: selected ? `${theme.primary}14` : theme.surface,
        },
      ]}
    >
      <MedText
        variant="body"
        style={{
          fontSize: compact ? 13 : 14,
          fontWeight: selected ? '600' : '400',
          color: selected ? theme.primary : theme.textSecondary,
        }}
      >
        {label}
      </MedText>
    </Pressable>
  );
}

export default function PatientSetupScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isEthiopianCalendar } = useTimeFormat();

  const { loading, error: apiError } = useSelector((state: RootState) => state.patient);

  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('Male');
  const [bloodType, setBloodType] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  const toISODateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDisplayDate = (date: Date): string => formatDate(date, 'full');

  const handleDateConfirm = (date: Date) => {
    setDateOfBirth(date);
    setShowDatePicker(false);
    if (localError) setLocalError(null);
    if (apiError) dispatch(clearPatientError());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isNameValid = fullName.trim().length >= 3;
  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: isNameValid ? 1 : 0,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [isNameValid]);

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const handleSave = async () => {
    if (!fullName || !dateOfBirth) {
      setLocalError(t('valNameDobRequired'));
      triggerShake();
      return;
    }

    setLocalError(null);
    const result = await dispatch(submitPatientProfile({
      fullName,
      dateOfBirth: toISODateString(dateOfBirth),
      gender,
      bloodType: bloodType || undefined,
      emergencyContact: emergencyPhone ? `+251${emergencyPhone}` : undefined,
    }));

    if (submitPatientProfile.fulfilled.match(result)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await dispatch(fetchPatientProfileStatus());
    } else {
      triggerShake();
    }
  };

  const activeError = localError || apiError;

  const borderFor = (field: string, hasFieldError?: boolean) => {
    if (hasFieldError) return '#D92D20';
    if (focusedField === field) return theme.primary;
    return theme.border;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: theme.border }]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <LanguagePicker />
        </View>
        <Pressable
          onPress={() => dispatch(logout())}
          style={[styles.logoutBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.muted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <View style={styles.titleBlock}>
              <MedText variant="h1" style={{ color: theme.text, letterSpacing: -0.3 }}>
                {t('patientSetupTitle')}
              </MedText>
              <MedText variant="body" style={{ marginTop: 8, lineHeight: 22 }}>
                {t('patientSetupSubtitle')}
              </MedText>
            </View>

            {activeError ? (
              <View style={[styles.errorBanner, { backgroundColor: '#FEF3F2', borderColor: '#FEE4E2' }]}>
                <Ionicons name="alert-circle-outline" size={18} color="#D92D20" />
                <MedText style={styles.errorText}>{activeError}</MedText>
              </View>
            ) : null}

            <View style={styles.formSection}>
              <View style={styles.field}>
                <MedText variant="metadata" style={[styles.label, !!activeError && !fullName && styles.labelError]}>
                  {t('fullName')} *
                </MedText>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: theme.surface, borderColor: borderFor('name', !!activeError && !fullName) },
                  ]}
                >
                  <TextInput
                    style={[styles.textInput, { color: theme.text }]}
                    placeholder="Abebe Kebede"
                    placeholderTextColor={theme.muted}
                    value={fullName}
                    onChangeText={(v) => {
                      setFullName(v);
                      if (localError) setLocalError(null);
                      if (apiError) dispatch(clearPatientError());
                    }}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    {...nameAutofill}
                  />
                  <Animated.View style={{ transform: [{ scale: checkScale }], opacity: checkScale, marginRight: 12 }}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                  </Animated.View>
                </View>
              </View>

              <View style={styles.field}>
                <MedText variant="metadata" style={[styles.label, !!activeError && !dateOfBirth && styles.labelError]}>
                  {t('dateOfBirth')} *
                </MedText>
                <Pressable
                  onPress={() => {
                    setShowDatePicker(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: activeError && !dateOfBirth ? '#D92D20' : theme.border,
                    },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={18} color={dateOfBirth ? theme.text : theme.muted} />
                  <MedText
                    variant="body"
                    style={{
                      flex: 1,
                      color: dateOfBirth ? theme.text : theme.muted,
                      fontWeight: dateOfBirth ? '500' : '400',
                    }}
                  >
                    {dateOfBirth ? formatDisplayDate(dateOfBirth) : t('selectDate')}
                  </MedText>
                  <Ionicons name="chevron-down" size={16} color={theme.muted} />
                </Pressable>
              </View>

              <DatePickerModal
                visible={showDatePicker}
                value={dateOfBirth || new Date(2000, 0, 1)}
                onConfirm={handleDateConfirm}
                onCancel={() => setShowDatePicker(false)}
                maximumDate={new Date()}
                minimumDate={new Date(1920, 0, 1)}
                calendar={isEthiopianCalendar ? 'ethiopian' : 'gregorian'}
              />

              <View style={styles.field}>
                <MedText variant="metadata" style={styles.label}>{t('gender')}</MedText>
                <View style={styles.segmentedContainer}>
                  {[
                    { key: 'Male', label: t('genderMale') },
                    { key: 'Female', label: t('genderFemale') },
                    { key: 'Other', label: t('genderOther') },
                  ].map((g) => (
                    <SelectionChip
                      key={g.key}
                      label={g.label}
                      selected={gender === g.key}
                      onPress={() => setGender(g.key)}
                      theme={theme}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <MedText variant="metadata" style={styles.label}>{t('bloodTypeOptional')}</MedText>
                <View style={styles.bloodTypeRow}>
                  {BLOOD_TYPES.map((bt) => (
                    <SelectionChip
                      key={bt}
                      label={bt}
                      selected={bloodType === bt}
                      onPress={() => setBloodType(bloodType === bt ? '' : bt)}
                      compact
                      theme={theme}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <MedText variant="metadata" style={styles.label}>{t('emergencyContactOptional')}</MedText>
                <View
                  style={[
                    styles.phoneInputContainer,
                    { backgroundColor: theme.surface, borderColor: borderFor('phone') },
                  ]}
                >
                  <View style={[styles.countryCode, { borderColor: theme.border, backgroundColor: theme.background }]}>
                    <MedText variant="body" style={{ fontWeight: '500', color: theme.textSecondary }}>+251</MedText>
                  </View>
                  <TextInput
                    style={[styles.phoneInput, { color: theme.text }]}
                    placeholder="912 345 678"
                    placeholderTextColor={theme.muted}
                    value={emergencyPhone}
                    onChangeText={(v) => setEmergencyPhone(v.replace(/[^0-9]/g, ''))}
                    keyboardType="phone-pad"
                    maxLength={9}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    autoCorrect={false}
                    {...phoneNationalAutofill}
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.fixedFooter, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <MedButton
          title={t('saveAndContinue')}
          onPress={handleSave}
          loading={loading}
          style={{ width: '100%' }}
        />
        <View style={styles.legalRow}>
          <MedText variant="metadata" style={styles.legalText}>By continuing you agree to our </MedText>
          <Pressable onPress={() => Linking.openURL(`${BASE_URL}/api/legal/terms`)}>
            <MedText variant="metadata" style={[styles.legalLink, { color: theme.secondary }]}>Terms of Service</MedText>
          </Pressable>
          <MedText variant="metadata" style={styles.legalText}> and </MedText>
          <Pressable onPress={() => Linking.openURL(`${BASE_URL}/api/legal/privacy`)}>
            <MedText variant="metadata" style={[styles.legalLink, { color: theme.secondary }]}>Privacy Policy</MedText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
    flexGrow: 1,
  },
  titleBlock: {
    marginBottom: 28,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
  },
  errorText: {
    color: '#D92D20',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  formSection: {
    gap: 4,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 8,
    marginLeft: 2,
  },
  labelError: {
    color: '#D92D20',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '400',
  },
  dateButton: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  iosPickerContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  segmentedContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCompact: {
    flex: 0,
    minWidth: 52,
    paddingHorizontal: 10,
    height: 40,
  },
  bloodTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
  },
  countryCode: {
    paddingHorizontal: 14,
    borderRightWidth: 1,
    height: '100%',
    justifyContent: 'center',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '400',
    paddingHorizontal: 14,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    paddingTop: 14,
    paddingHorizontal: 20,
  },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    gap: 0,
  },
  legalText: {
    fontSize: 11,
    opacity: 0.6,
  },
  legalLink: {
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
