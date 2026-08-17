import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MedButton } from "../../components/medconnect/MedButton";
import { MedCard } from "../../components/medconnect/MedCard";
import { MedText } from "../../components/medconnect/MedText";
import { TelegramBubble } from "../../components/medconnect/TelegramBubble";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { LanguagePicker } from "../../components/LanguagePicker";

import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchDoctors } from "../../store/slices/doctorSlice";
import { fetchCategories } from "../../store/slices/appointmentSlice";
import { BASE_URL, getAssetUrl } from "../../constants/api";
import { Video, ResizeMode } from "expo-av";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

let recentUpdateDismissed = false;

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { user } = useSelector((state: RootState) => state.auth);
  const { doctors, loading } = useSelector((state: RootState) => state.doctors);
  const { categories } = useSelector((state: RootState) => state.appointment);

  const [showRecentUpdate, setShowRecentUpdate] = useState(
    !recentUpdateDismissed,
  );

  React.useEffect(() => {
    dispatch(fetchDoctors());
    dispatch(fetchCategories());
  }, [dispatch]);

  const serviceIconColor = colorScheme === "dark" ? "#101828" : theme.primary;

  // Get featured doctors (top 3)
  const featuredDoctors = useMemo(() => {
    return doctors.slice(0, 3);
  }, [doctors]);

  const renderServiceItem = ({ item }: { item: any }) => (
    <Pressable
      style={styles.serviceItem}
      onPress={() =>
        router.push({
          pathname: "/doctor-list",
          params: { category: item.label },
        })
      }
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
        <Ionicons name={item.icon as any || "medical-outline"} size={28} color={theme.primary} />
      </View>
      <MedText variant="metadata" style={styles.serviceTitle}>
        {item.label}
      </MedText>
    </Pressable>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <LanguagePicker />
          <View style={{ alignItems: 'flex-end', flex: 1, marginLeft: 12 }}>
            <MedText variant="metadata">{t('welcomeBack')}</MedText>
            <MedText variant="h2" style={{ marginTop: 2, textAlign: 'right' }}>
              {user?.patientProfile?.fullName || user?.phone || t('guest')}
            </MedText>
          </View>
        </View>

        {/* Search Bar (Clickable) */}
        <Pressable 
          onPress={() => router.push("/(tabs)/doctors")}
          style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
        >
          <Ionicons name="search" size={20} color={theme.muted} />
          <MedText
            variant="body"
            style={{ marginLeft: 12, color: theme.muted }}
          >
            {t('searchDoctorClinic')}
          </MedText>
        </Pressable>

        {/* Telegram-style Notification */}
        {showRecentUpdate ? (
          <View style={styles.section}>
            <MedText variant="metadata" style={[styles.sectionTitle, { color: theme.textSecondary, fontSize: 13, letterSpacing: 0.3 }]}>
              {t('recentUpdates')}
            </MedText>
            <TelegramBubble
              content={t('welcomeMessage')}
              time={t('justNow')}
              isIncoming={true}
              onClose={() => {
                recentUpdateDismissed = true;
                setShowRecentUpdate(false);
              }}
            />
          </View>
        ) : null}

        {/* Featured Doctors */}
        {featuredDoctors.length > 0 && (
          <View style={styles.section}>
            <MedText variant="metadata" style={[styles.sectionTitle, { color: theme.textSecondary, fontSize: 13, letterSpacing: 0.3 }]}>
              {t('topRatedDoctors')}
            </MedText>
          {featuredDoctors.length === 0 && !loading && (
            <MedText variant="body" color={theme.muted}>{t('noDoctorsAvailable')}</MedText>
          )}
          {featuredDoctors.map((doctor) => (
            <MedCard key={doctor.id} style={styles.doctorCard}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/doctor/[id]",
                    params: { id: doctor.id },
                  })
                }
              >
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorDetails}>
                    <MedText variant="body" style={{ fontSize: 16, fontWeight: '500', color: theme.text }}>
                      {doctor.fullName}
                    </MedText>
                    <MedText variant="metadata">
                      {(doctor.specializations && doctor.specializations.length > 0 ? doctor.specializations.join(", ") : doctor.specialization)} • {doctor.clinicName || 'Clinic'}
                    </MedText>
                    <View style={styles.rating}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <MedText variant="metadata" style={{ marginLeft: 4 }}>
                        {doctor.rating || '0.0'} ({doctor.totalReviews || 0} {t('reviews')})
                      </MedText>
                    </View>
                  </View>
                  <View style={styles.doctorImagePlaceholder}>
                    {doctor.profilePicture ? (
                      <View style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
                        <Video
                          source={{ uri: getAssetUrl(doctor.profilePicture) }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                        />
                      </View>
                    ) : (
                      <Ionicons name="person" size={32} color={theme.border} />
                    )}
                  </View>
                </View>
              </Pressable>
              <MedButton
                title={t('bookAppointment')}
                onPress={() =>
                  router.push({
                    pathname: "/modal",
                    params: { 
                      doctorId: doctor.id,
                      doctorName: doctor.fullName,
                      doctorFee: doctor.hospital?.cardPrice
                    },
                  })
                }
                style={{ marginTop: 16 }}
                textStyle={{ fontWeight: '500' }}
              />
            </MedCard>
          ))}
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 32,
    borderRadius: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 20,
  },
  serviceItem: {
    alignItems: "center",
    width: "30%",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceTitle: {
    textAlign: "center",
  },
  doctorCard: {
    padding: 16,
    marginBottom: 12,
  },
  doctorInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  doctorDetails: {
    flex: 1,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  doctorImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
});
