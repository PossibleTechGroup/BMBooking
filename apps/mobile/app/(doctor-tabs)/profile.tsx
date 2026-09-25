import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { MedButton } from "../../components/medconnect/MedButton";
import { MedCard } from "../../components/medconnect/MedCard";
import { MedText } from "../../components/medconnect/MedText";
import { YourPerformance } from "../../components/doctor/YourPerformance";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { AppDispatch, RootState } from "../../store";
import { logout } from "../../store/slices/authSlice";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { BASE_URL, getAssetUrl } from "../../constants/api";
import { useTimeFormat } from "../../utils/timeFormat";

const PROFILE_ITEMS = [
  {
    id: "professional",
    title: "professionalDetails",
    subtitle: "specialtyLicenseInfo",
    icon: "medical-outline",
    color: "#10B981",
    route: "/(doctor-tabs)/edit-professional"
  },
  {
    id: "wallet",
    title: "myWallet",
    subtitle: "payoutSubtitle",
    icon: "wallet-outline",
    color: "#1565C0",
    route: "/(doctor-tabs)/wallet"
  },
  {
    id: "announcements",
    title: "Announcements",
    subtitle: "Updates & notices",
    icon: "megaphone-outline",
    color: "#8B5CF6",
    route: "/announcements"
  },
  {
    id: "settings",
    title: "appSettings",
    subtitle: "securityPreferences",
    icon: "settings-outline",
    color: "#6B7280"
  },
  {
    id: "privacy",
    title: "privacyPolicy",
    subtitle: "privacyPolicySubtitle",
    icon: "shield-checkmark-outline",
    color: "#1E5A8A",
    url: "privacy"
  },
  {
    id: "terms",
    title: "termsOfService",
    subtitle: "termsOfServiceSubtitle",
    icon: "document-text-outline",
    color: "#5A6B80",
    url: "terms"
  },
];

export default function DoctorProfileScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { user } = useSelector((state: RootState) => state.auth);
  const profile = user?.doctorProfile;
  const { isEthiopian, toggle: toggleTimeFormat, isEthiopianCalendar, toggleCalendar } = useTimeFormat();
  const [showTimeModal, setShowTimeModal] = React.useState(false);

  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = React.useState(true);

  React.useEffect(() => {
    const loadReviews = async () => {
      if (!profile?.id) return;
      try {
        const response = await axios.get(`${BASE_URL}/api/reviews/doctor/${profile.id}`);
        setReviews(response.data.data);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };
    loadReviews();
  }, [profile?.id]);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account and all associated personal data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            dispatch(logout());
            Alert.alert("Account Deleted", "Your account and data have been removed.");
          },
        },
      ]
    );
  };

  const renderMenuItem = (item: any) => (
    <Pressable
      key={item.id}
      onPress={() => {
        if (item.route) router.push(item.route as any);
        else if (item.id === "settings") setShowTimeModal(true);
        else if (item.url) Linking.openURL(`${BASE_URL}/api/legal/${item.url}`);
      }}
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: theme.surface },
        pressed && styles.menuItemPressed
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: item.color + '10' }]}>
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <View style={styles.menuInfo}>
        <MedText variant="body" style={styles.menuTitle}>{t(item.title)}</MedText>
        <MedText variant="metadata" color={theme.muted}>{t(item.subtitle)}</MedText>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.border} />
    </Pressable>
  );

  // Profile picture or initials
  const hasPhoto = !!profile?.profilePicture;
  const initials = (profile?.fullName || "D")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Profile Header ── */}
        <View style={styles.profileHeader}>
          {hasPhoto ? (
            <Image
              source={{ uri: getAssetUrl(profile.profilePicture) }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.primary + "15" }]}>
              <MedText style={[styles.avatarText, { color: theme.primary }]}>{initials}</MedText>
            </View>
          )}
          <View style={styles.profileInfo}>
            <MedText variant="h2" style={styles.userName}>
              Dr. {profile?.fullName || user?.fullName || "Doctor"}
            </MedText>
            <MedText variant="metadata" color={theme.muted} style={{ marginTop: 2 }}>
              {Array.isArray(profile?.specializations)
                ? profile.specializations.join(" • ")
                : profile?.specialization || "General Practice"}
            </MedText>
            {profile?.clinicName ? (
              <View style={styles.clinicRow}>
                <Ionicons name="location-outline" size={12} color={theme.muted} />
                <MedText variant="metadata" color={theme.muted} style={{ marginLeft: 4 }}>
                  {profile.clinicName}
                </MedText>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Your Performance (standalone component) ── */}
        <YourPerformance
          rating={profile?.rating || 0}
          totalReviews={profile?.totalReviews || 0}
          reviews={reviews}
          loadingReviews={loadingReviews}
          theme={theme}
        />

        {/* ── Menu Items ── */}
        <MedText variant="metadata" style={[styles.sectionLabel, { color: theme.muted }]}>
          {t("accountManagement")}
        </MedText>
        <View style={[styles.menuGroup, { backgroundColor: theme.surface }]}>
          {PROFILE_ITEMS.map(renderMenuItem)}
        </View>

        {/* ── Sign Out & Delete Account ── */}
        <View style={{ marginTop: 28, gap: 12 }}>
          <Pressable
            onPress={() => dispatch(logout())}
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color="#D92D20" />
            <MedText style={styles.logoutText}>{t("signOut")}</MedText>
          </Pressable>

          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
            ]}
          >
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
            <MedText style={styles.deleteText}>Delete Account</MedText>
          </Pressable>
        </View>

        <View style={styles.versionInfo}>
          <MedText variant="metadata" color={theme.border}>BM Hub v1.0.4</MedText>
        </View>
      </ScrollView>

      {/* Time Format Modal */}
      <Modal visible={showTimeModal} transparent animationType="slide" onRequestClose={() => setShowTimeModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowTimeModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <MedText variant="h2">Date & Time</MedText>
              <Pressable onPress={() => setShowTimeModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <MedText variant="body" style={{ marginBottom: 16, color: theme.muted }}>
                Choose how times are displayed throughout the app.
              </MedText>
              <Pressable
                onPress={() => { if (isEthiopian) { toggleTimeFormat(); setShowTimeModal(false); } }}
                style={[styles.settingCard, { borderWidth: 1.5, borderColor: !isEthiopian ? theme.primary : theme.border, backgroundColor: !isEthiopian ? (colorScheme === 'dark' ? '#1E293B' : '#EFF6FF') : 'transparent' }]}
              >
                <View style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: !isEthiopian ? (colorScheme === 'dark' ? '#1E293B' : '#DBEAFE') : theme.surface }]}>
                    <Ionicons name="time-outline" size={20} color={!isEthiopian ? theme.primary : theme.muted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <MedText variant="body" style={{ fontWeight: !isEthiopian ? '700' : '400' }}>Standard (AM/PM)</MedText>
                    <MedText variant="metadata" style={{ marginTop: 2 }}>Example: 9:30 PM</MedText>
                  </View>
                  {!isEthiopian && <Ionicons name="checkmark-circle" size={22} color={theme.success} />}
                </View>
              </Pressable>
              <Pressable
                onPress={() => { if (!isEthiopian) { toggleTimeFormat(); setShowTimeModal(false); } }}
                style={[styles.settingCard, { marginTop: 8, borderWidth: 1.5, borderColor: isEthiopian ? '#7C3AED' : theme.border, backgroundColor: isEthiopian ? (colorScheme === 'dark' ? '#2E1065' : '#F3E8FF') : 'transparent' }]}
              >
                <View style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: isEthiopian ? (colorScheme === 'dark' ? '#2E1065' : '#EDE9FE') : theme.surface }]}>
                    <Ionicons name="time-outline" size={20} color={isEthiopian ? '#7C3AED' : theme.muted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <MedText variant="body" style={{ fontWeight: isEthiopian ? '700' : '400' }}>Ethiopian (ቀን/ሌሊት)</MedText>
                    <MedText variant="metadata" style={{ marginTop: 2 }}>Example: 3:30 ሌሊት</MedText>
                  </View>
                  {isEthiopian && <Ionicons name="checkmark-circle" size={22} color="#7C3AED" />}
                </View>
              </Pressable>

              <MedText variant="body" style={{ marginTop: 24, marginBottom: 16, color: theme.muted }}>
                Choose how dates are displayed throughout the app.
              </MedText>
              <Pressable
                onPress={() => { if (isEthiopianCalendar) { toggleCalendar(); setShowTimeModal(false); } }}
                style={[styles.settingCard, { borderWidth: 1.5, borderColor: !isEthiopianCalendar ? theme.primary : theme.border, backgroundColor: !isEthiopianCalendar ? (colorScheme === 'dark' ? '#1E293B' : '#EFF6FF') : 'transparent' }]}
              >
                <View style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: !isEthiopianCalendar ? (colorScheme === 'dark' ? '#1E293B' : '#DBEAFE') : theme.surface }]}>
                    <Ionicons name="calendar-outline" size={20} color={!isEthiopianCalendar ? theme.primary : theme.muted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <MedText variant="body" style={{ fontWeight: !isEthiopianCalendar ? '700' : '400' }}>Gregorian</MedText>
                    <MedText variant="metadata" style={{ marginTop: 2 }}>Example: June 16, 2026</MedText>
                  </View>
                  {!isEthiopianCalendar && <Ionicons name="checkmark-circle" size={22} color={theme.success} />}
                </View>
              </Pressable>
              <Pressable
                onPress={() => { if (!isEthiopianCalendar) { toggleCalendar(); setShowTimeModal(false); } }}
                style={[styles.settingCard, { marginTop: 8, borderWidth: 1.5, borderColor: isEthiopianCalendar ? '#7C3AED' : theme.border, backgroundColor: isEthiopianCalendar ? (colorScheme === 'dark' ? '#2E1065' : '#F3E8FF') : 'transparent' }]}
              >
                <View style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: isEthiopianCalendar ? (colorScheme === 'dark' ? '#2E1065' : '#EDE9FE') : theme.surface }]}>
                    <Ionicons name="calendar-outline" size={20} color={isEthiopianCalendar ? '#7C3AED' : theme.muted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <MedText variant="body" style={{ fontWeight: isEthiopianCalendar ? '700' : '400' }}>Ethiopian</MedText>
                    <MedText variant="metadata" style={{ marginTop: 2 }}>Example: ሰኔ 9, 2018</MedText>
                  </View>
                  {isEthiopianCalendar && <Ionicons name="checkmark-circle" size={22} color="#7C3AED" />}
                </View>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },

  // ─ Profile Header ─
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "600",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  clinicRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  // ─ Menu ─
  sectionLabel: {
    marginLeft: 4,
    marginBottom: 10,
    letterSpacing: 0.8,
    fontWeight: "600",
    fontSize: 10,
  },
  menuGroup: {
    borderRadius: 20,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  menuItemPressed: {
    opacity: 0.9,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuInfo: {
    flex: 1,
    marginLeft: 14,
  },
  menuTitle: {
    fontWeight: "500",
    fontSize: 15,
  },

  // ─ Sign Out ─
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCEBEB",
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  logoutText: {
    color: "#D92D20",
    fontWeight: "600",
    fontSize: 15,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  deleteText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  versionInfo: {
    marginTop: 32,
    alignItems: "center",
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  settingCard: {
    borderRadius: 12,
    padding: 14,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
