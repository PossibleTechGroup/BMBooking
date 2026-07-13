import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import * as Haptics from 'expo-haptics';
import { MedButton } from "../../components/medconnect/MedButton";
import { MedCard } from "../../components/medconnect/MedCard";
import { MedText } from "../../components/medconnect/MedText";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { AppDispatch, RootState } from "../../store";
import { logout } from "../../store/slices/authSlice";
import { fetchPatientProfile, submitPatientProfile, clearPatientError } from "../../store/slices/patientSlice";
import { useTimeFormat } from "../../utils/timeFormat";
import { formatDate } from "../../utils/ethiopianDate";
import DatePickerModal from "../../components/DatePickerModal";
import { BASE_URL } from "../../constants/api";

function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function ProfilesScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const user = useSelector((state: RootState) => state.auth.user);
  const patientProfile = useSelector((state: RootState) => state.patient.profile);

  const [profileName, setProfileName] = useState('');
  const [profileGender, setProfileGender] = useState('Male');
  const [profileDob, setProfileDob] = useState<Date | null>(null);
  const [profileBloodType, setProfileBloodType] = useState('');
  const [profileEmergency, setProfileEmergency] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    dispatch(fetchPatientProfile());
  }, [dispatch]);

  useEffect(() => {
    if (patientProfile) {
      setProfileName(patientProfile.fullName || '');
      setProfileGender(patientProfile.gender || 'Male');
      if (patientProfile.dateOfBirth) {
        setProfileDob(new Date(patientProfile.dateOfBirth));
      }
      setProfileBloodType(patientProfile.bloodType || '');
      setProfileEmergency(patientProfile.emergencyContact || '');
    }
  }, [patientProfile]);

  const [settingsModal, setSettingsModal] = useState<"profile" | "notifications" | "privacy" | "timeformat" | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    appointmentReminders: true,
    doctorMessages: true,
    healthTips: false,
  });
  const [privacySettings, setPrivacySettings] = useState({
    shareMedicalHistory: true,
    showProfileToDoctors: true,
    analytics: false,
  });

  const { isEthiopian, toggle: toggleTimeFormat, isEthiopianCalendar, toggleCalendar } = useTimeFormat();

  const displayName = patientProfile?.fullName || user?.fullName || 'User';
  const displayPhone = user?.phone || '';

  const renderSettingRow = (
    title: string,
    subtitle: string,
    icon: keyof typeof Ionicons.glyphMap,
    onPress: () => void,
  ) => (
    <Pressable onPress={onPress}>
      <MedCard style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: "#F3F4F6" }]}>
            <Ionicons name={icon} size={20} color={theme.secondary} />
          </View>
          <View style={styles.settingContent}>
            <MedText variant="body">{title}</MedText>
            <MedText variant="metadata" style={{ marginTop: 4 }}>
              {subtitle}
            </MedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.muted} />
        </View>
      </MedCard>
    </Pressable>
  );

  const renderTextField = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    placeholder?: string,
  ) => (
    <View style={styles.fieldGroup}>
      <MedText variant="metadata">{label}</MedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        style={[
          styles.settingsInput,
          {
            borderColor: theme.border,
            color: theme.text,
            backgroundColor: theme.surface,
          },
        ]}
      />
    </View>
  );

  const renderSwitchRow = (
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
  ) => (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <MedText variant="body" style={styles.switchTitle}>
          {title}
        </MedText>
        <MedText variant="metadata" style={{ marginTop: 4 }}>
          {subtitle}
        </MedText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#E4E7EC", true: "#A6F4C5" }}
        thumbColor={value ? theme.success : "#FFFFFF"}
      />
    </View>
  );

  const renderSettingsModalContent = () => {
    switch (settingsModal) {
      case "profile":
        return (
          <>
            {renderTextField("FULL NAME", profileName, setProfileName)}
            {renderTextField("PHONE", displayPhone, () => {}, "Phone number (read-only)")}
            <View style={styles.fieldGroup}>
              <MedText variant="metadata">GENDER</MedText>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                {['Male', 'Female'].map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => {
                      setProfileGender(g);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: profileGender === g ? theme.primary : theme.border,
                      backgroundColor: profileGender === g ? `${theme.primary}14` : theme.surface,
                      alignItems: 'center',
                    }}
                  >
                    <MedText
                      variant="body"
                      style={{
                        fontWeight: profileGender === g ? '600' : '400',
                        color: profileGender === g ? theme.primary : theme.textSecondary,
                      }}
                    >
                      {g}
                    </MedText>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <MedText variant="metadata">DATE OF BIRTH</MedText>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                }}
              >
                <Ionicons name="calendar-outline" size={18} color={profileDob ? theme.text : theme.muted} />
                <MedText
                  variant="body"
                  style={{
                    marginLeft: 8,
                    color: profileDob ? theme.text : theme.muted,
                    fontWeight: profileDob ? '500' : '400',
                  }}
                >
                  {profileDob ? formatDate(profileDob, 'full') : 'Select date of birth'}
                </MedText>
              </Pressable>
            </View>
            {renderTextField("BLOOD TYPE (optional)", profileBloodType, setProfileBloodType, "e.g. A+")}
            {renderTextField("EMERGENCY CONTACT (optional)", profileEmergency, setProfileEmergency, "+251...")}
            <MedButton
              title="Save Profile"
              onPress={async () => {
                if (!profileName.trim()) return;
                await dispatch(submitPatientProfile({
                  fullName: profileName.trim(),
                  dateOfBirth: profileDob ? formatDate(profileDob) : '',
                  gender: profileGender,
                  bloodType: profileBloodType || undefined,
                  emergencyContact: profileEmergency || undefined,
                }));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setSettingsModal(null);
              }}
              style={{ marginTop: 24 }}
            />
            <DatePickerModal
              visible={showDatePicker}
              value={profileDob || new Date(2000, 0, 1)}
              onConfirm={(date) => {
                setProfileDob(date);
                setShowDatePicker(false);
                if (patientProfile?.dateOfBirth) dispatch(clearPatientError());
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onCancel={() => setShowDatePicker(false)}
              calendar={isEthiopianCalendar ? 'ethiopian' : 'gregorian'}
            />
          </>
        );
      case "notifications":
        return (
          <>
            {renderSwitchRow(
              "Appointment reminders",
              "Get alerts before upcoming appointments.",
              notificationSettings.appointmentReminders,
              (appointmentReminders) =>
                setNotificationSettings((current) => ({
                  ...current,
                  appointmentReminders,
                })),
            )}
            {renderSwitchRow(
              "Doctor messages",
              "Notify me when a doctor sends an update.",
              notificationSettings.doctorMessages,
              (doctorMessages) =>
                setNotificationSettings((current) => ({
                  ...current,
                  doctorMessages,
                })),
            )}
            {renderSwitchRow(
              "Health tips",
              "Receive occasional care tips and reminders.",
              notificationSettings.healthTips,
              (healthTips) =>
                setNotificationSettings((current) => ({
                  ...current,
                  healthTips,
                })),
            )}
          </>
        );
      case "timeformat":
        return (
          <>
            <MedText variant="body" style={{ marginBottom: 16, color: theme.muted }}>
              Choose how times are displayed throughout the app.
            </MedText>
            <Pressable
              onPress={() => { if (isEthiopian) toggleTimeFormat(); }}
              style={[styles.settingCard, { borderWidth: 1.5, borderColor: !isEthiopian ? theme.primary : theme.border, backgroundColor: !isEthiopian ? (colorScheme === 'dark' ? '#1E293B' : '#EFF6FF') : 'transparent' }]}
            >
              <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: !isEthiopian ? (colorScheme === 'dark' ? '#1E293B' : '#DBEAFE') : theme.surface }]}>
                  <Ionicons name="time-outline" size={20} color={!isEthiopian ? theme.primary : theme.muted} />
                </View>
                <View style={styles.settingContent}>
                  <MedText variant="body" style={{ fontWeight: !isEthiopian ? '700' : '400' }}>Standard (AM/PM)</MedText>
                  <MedText variant="metadata">Example: 9:30 PM</MedText>
                </View>
                {!isEthiopian && <Ionicons name="checkmark-circle" size={22} color={theme.success} />}
              </View>
            </Pressable>
            <Pressable
              onPress={() => { if (!isEthiopian) toggleTimeFormat(); }}
              style={[styles.settingCard, { marginTop: 8, borderWidth: 1.5, borderColor: isEthiopian ? '#7C3AED' : theme.border, backgroundColor: isEthiopian ? (colorScheme === 'dark' ? '#2E1065' : '#F3E8FF') : 'transparent' }]}
            >
              <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: isEthiopian ? (colorScheme === 'dark' ? '#2E1065' : '#EDE9FE') : theme.surface }]}>
                  <Ionicons name="time-outline" size={20} color={isEthiopian ? '#7C3AED' : theme.muted} />
                </View>
                <View style={styles.settingContent}>
                  <MedText variant="body" style={{ fontWeight: isEthiopian ? '700' : '400' }}>Ethiopian (ቀን/ሌሊት)</MedText>
                  <MedText variant="metadata">Example: 3:30 ሌሊት</MedText>
                </View>
                {isEthiopian && <Ionicons name="checkmark-circle" size={22} color="#7C3AED" />}
              </View>
            </Pressable>

            <MedText variant="body" style={{ marginTop: 24, marginBottom: 16, color: theme.muted }}>
              Choose how dates are displayed throughout the app.
            </MedText>
            <Pressable
              onPress={() => { if (isEthiopianCalendar) toggleCalendar(); }}
              style={[styles.settingCard, { borderWidth: 1.5, borderColor: !isEthiopianCalendar ? theme.primary : theme.border, backgroundColor: !isEthiopianCalendar ? (colorScheme === 'dark' ? '#1E293B' : '#EFF6FF') : 'transparent' }]}
            >
              <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: !isEthiopianCalendar ? (colorScheme === 'dark' ? '#1E293B' : '#DBEAFE') : theme.surface }]}>
                  <Ionicons name="calendar-outline" size={20} color={!isEthiopianCalendar ? theme.primary : theme.muted} />
                </View>
                <View style={styles.settingContent}>
                  <MedText variant="body" style={{ fontWeight: !isEthiopianCalendar ? '700' : '400' }}>Gregorian</MedText>
                  <MedText variant="metadata">Example: June 16, 2026</MedText>
                </View>
                {!isEthiopianCalendar && <Ionicons name="checkmark-circle" size={22} color={theme.success} />}
              </View>
            </Pressable>
            <Pressable
              onPress={() => { if (!isEthiopianCalendar) toggleCalendar(); }}
              style={[styles.settingCard, { marginTop: 8, borderWidth: 1.5, borderColor: isEthiopianCalendar ? '#7C3AED' : theme.border, backgroundColor: isEthiopianCalendar ? (colorScheme === 'dark' ? '#2E1065' : '#F3E8FF') : 'transparent' }]}
            >
              <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: isEthiopianCalendar ? (colorScheme === 'dark' ? '#2E1065' : '#EDE9FE') : theme.surface }]}>
                  <Ionicons name="calendar-outline" size={20} color={isEthiopianCalendar ? '#7C3AED' : theme.muted} />
                </View>
                <View style={styles.settingContent}>
                  <MedText variant="body" style={{ fontWeight: isEthiopianCalendar ? '700' : '400' }}>Ethiopian</MedText>
                  <MedText variant="metadata">Example: ሰኔ 9, 2018</MedText>
                </View>
                {isEthiopianCalendar && <Ionicons name="checkmark-circle" size={22} color="#7C3AED" />}
              </View>
            </Pressable>
          </>
        );
      case "privacy":
        return (
          <>
            {renderSwitchRow(
              "Share medical history",
              "Allow doctors you book with to see saved health details.",
              privacySettings.shareMedicalHistory,
              (shareMedicalHistory) =>
                setPrivacySettings((current) => ({
                  ...current,
                  shareMedicalHistory,
                })),
            )}
            {renderSwitchRow(
              "Doctor profile access",
              "Let doctors view your profile before appointments.",
              privacySettings.showProfileToDoctors,
              (showProfileToDoctors) =>
                setPrivacySettings((current) => ({
                  ...current,
                  showProfileToDoctors,
                })),
            )}
            {renderSwitchRow(
              "Usage analytics",
              "Help improve MedConnect with anonymous app analytics.",
              privacySettings.analytics,
              (analytics) =>
                setPrivacySettings((current) => ({
                  ...current,
                  analytics,
                })),
            )}
            <View style={{ marginTop: 24 }}>
              <MedText variant="metadata" style={{ marginBottom: 12, opacity: 0.6 }}>LEGAL</MedText>
              {renderSettingRow(
                "Privacy Policy",
                "Read how we handle your data",
                "shield-checkmark-outline",
                () => Linking.openURL(`${BASE_URL}/api/legal/privacy`),
              )}
              {renderSettingRow(
                "Terms of Service",
                "Read our terms and conditions",
                "document-text-outline",
                () => Linking.openURL(`${BASE_URL}/api/legal/terms`),
              )}
            </View>
          </>
        );
      default:
        return null;
    }
  };

  const getSettingsModalTitle = () => {
    switch (settingsModal) {
      case "profile":
        return "Profile Information";
      case "notifications":
        return "Notifications";
      case "timeformat":
        return "Date & Time";
      case "privacy":
        return "Privacy";
      default:
        return "";
    }
  };

  const renderSettingsModal = () => (
    <Modal
      visible={settingsModal !== null}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSettingsModal(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <MedText variant="h2">{getSettingsModalTitle()}</MedText>
            <Pressable onPress={() => setSettingsModal(null)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {renderSettingsModalContent()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <MedText variant="h1">Profile</MedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View>
            <MedText variant="h2" style={styles.sectionTitle}>
              Account Settings
            </MedText>
            {renderSettingRow(
              "Profile Information",
              `${displayName} • ${displayPhone}`,
              "person-circle-outline",
              () => setSettingsModal("profile"),
            )}
            {renderSettingRow(
              "Notifications",
              notificationSettings.appointmentReminders
                ? "Appointment reminders are on"
                : "Appointment reminders are off",
              "notifications-outline",
              () => setSettingsModal("notifications"),
            )}
            {renderSettingRow(
              "Privacy",
              privacySettings.shareMedicalHistory
                ? "Medical history sharing is on"
                : "Medical history sharing is off",
              "lock-closed-outline",
              () => setSettingsModal("privacy"),
            )}
            {renderSettingRow(
              "Date & Time",
              isEthiopianCalendar
                ? (isEthiopian ? "Ethiopian calendar · ቀን/ሌሊት" : "Ethiopian calendar · AM/PM")
                : (isEthiopian ? "Gregorian calendar · ቀን/ሌሊት" : "Gregorian calendar · AM/PM"),
              "time-outline",
              () => setSettingsModal("timeformat"),
            )}


            {/* Logout Button */}
            <View style={{ marginTop: 32 }}>
              <Pressable
                onPress={() => dispatch(logout())}
                style={({ pressed }) => [
                  styles.logoutBtn,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Ionicons name="log-out-outline" size={20} color="#D92D20" />
                <MedText style={styles.logoutText}>Sign Out Account</MedText>
              </Pressable>
            </View>

            <View style={styles.versionInfo}>
              <MedText variant="metadata" style={{ opacity: 0.4 }}>BM Hub v1.0.4</MedText>
            </View>
          </View>
      </ScrollView>
      {renderSettingsModal()}
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
  content: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  settingCard: {
    padding: 16,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  settingsInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 14,
  },
  switchText: {
    flex: 1,
    paddingRight: 16,
  },
  switchTitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalBody: {
    padding: 20,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCEBEB",
    padding: 18,
    borderRadius: 20,
    gap: 10,
  },
  logoutText: {
    color: "#D92D20",
    fontWeight: "700",
    fontSize: 16,
  },
  versionInfo: {
    marginTop: 40,
    alignItems: "center",
    marginBottom: 20,
  },
});
