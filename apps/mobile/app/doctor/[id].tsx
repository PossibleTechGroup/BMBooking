import React, { useMemo, useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { MedButton } from "../../components/medconnect/MedButton";
import { MedText } from "../../components/medconnect/MedText";
import { DoctorAvatar } from "../../components/doctor/DoctorAvatar";
import { BMHeader } from "../../components/BMHeader";
import { MedicalDisclaimer } from "../../components/MedicalDisclaimer";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { RootState, AppDispatch } from "../../store";
import { getAssetUrl } from "../../constants/api";
import { fetchDoctorScheduleSlots } from "../../store/slices/appointmentSlice";
import { formatDate } from "../../utils/ethiopianDate";
import { computeAvailability } from "../../utils/availability";
import { useUserLocation } from "../../hooks/useUserLocation";
import { haversineKm } from "../../utils/location";

export default function DoctorProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const { doctors } = useSelector((state: RootState) => state.doctors);
  const doctor = useMemo(() => doctors.find((d) => d.id.toString() === id), [doctors, id]);

  const { latitude, longitude } = useUserLocation();

  const distanceKm = useMemo(() => {
    if (latitude == null || longitude == null || !doctor) return null;
    const lat = doctor?.hospital?.latitude;
    const lng = doctor?.hospital?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    return Math.round(haversineKm(latitude, longitude, lat, lng) * 10) / 10;
  }, [latitude, longitude, doctor]);

  const openInMaps = () => {
    const hospital = doctor?.hospital;
    if (!hospital || typeof hospital.latitude !== "number" || typeof hospital.longitude !== "number") return;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(hospital.name || '')}@${hospital.latitude},${hospital.longitude}`,
      android: `geo:0,0?q=${hospital.latitude},${hospital.longitude}(${encodeURIComponent(hospital.name || '')})`,
    });
    if (url) Linking.openURL(url);
  };

  const callHospital = () => {
    const phone = doctor?.hospital?.phone;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const doctorId = id ? parseInt(id as string) : null;

  useEffect(() => {
    if (doctorId) {
      setLoadingSchedules(true);
      dispatch(fetchDoctorScheduleSlots({ doctorId }))
        .unwrap()
        .then((data) => setSchedules(data || []))
        .catch(() => setSchedules([]))
        .finally(() => setLoadingSchedules(false));
    }
  }, [doctorId, dispatch]);

  const doctorInitials = useMemo(() => {
    if (!doctor?.fullName) return "";
    return doctor.fullName
      .split(" ")
      .filter(Boolean)
      .map((w: string) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }, [doctor]);

  const specs = useMemo(() => {
    if (!doctor) return "";
    if (doctor.specializations?.length) return doctor.specializations.join(", ");
    return doctor.specialization || "";
  }, [doctor]);

  const appFee = doctor?.hospital?.serviceFee?.amount
    ? `ETB ${doctor.hospital.serviceFee.amount}`
    : "ETB 1";

  const cardPrice = doctor?.hospital?.cardPrice != null
    ? `ETB ${doctor.hospital.cardPrice}`
    : "ETB 0";

  const availability = useMemo(() => {
    if (schedules && schedules.length > 0) {
      return computeAvailability(schedules);
    }
    if (doctor && typeof doctor.isAvailable === 'boolean') {
      return {
        isAvailable: doctor.isAvailable,
        nextAvailableSlot: doctor.nextAvailableSlot ?? null,
      };
    }
    return null;
  }, [schedules, doctor]);

  // Parse schedule items for display
  const scheduleItems = useMemo(() => {
    if (schedules && schedules.length > 0) {
      return schedules.map((s) => {
        const d = s.date ? new Date(s.date) : new Date();
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        const dayNum = d.getDate();
        const monthName = d.toLocaleDateString("en-US", { month: "short" });
        const start = s.startTime ? s.startTime.substring(0, 5) : "08:00";
        const end = s.endTime ? s.endTime.substring(0, 5) : "17:00";
        const room = s.clinicRoom ? `(Room ${s.clinicRoom})` : "(Room 122)";
        return {
          id: s.id,
          dayName,
          dayNum,
          monthName,
          timeRange: `${start} - ${end} ${room}`,
        };
      });
    }

    if (doctor?.availability && doctor.availability.length > 0) {
      return doctor.availability.map((s: any, idx: number) => {
        const d = s.date ? new Date(s.date) : new Date();
        const dayName = s.day || d.toLocaleDateString("en-US", { weekday: "short" });
        const dayNum = d.getDate();
        const monthName = d.toLocaleDateString("en-US", { month: "short" });
        const start = s.startTime ? s.startTime.substring(0, 5) : "08:00";
        const end = s.endTime ? s.endTime.substring(0, 5) : "17:00";
        const room = s.clinicRoom ? `(Room ${s.clinicRoom})` : "(Room 122)";
        return {
          id: idx,
          dayName,
          dayNum,
          monthName,
          timeRange: `${start} - ${end} ${room}`,
        };
      });
    }

    // Default upcoming 5 days fallback
    const mockDays = [];
    const baseDate = new Date();
    for (let i = 1; i <= 5; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      mockDays.push({
        id: i,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString("en-US", { month: "short" }),
        timeRange: "08:00 - 17:00 (Room 122)",
      });
    }
    return mockDays;
  }, [schedules, doctor]);

  if (!doctor) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <MedText variant="h2">{t('doctorNotFound') || "Doctor not found"}</MedText>
        <MedButton title={t('goBack') || "Go Back"} onPress={() => router.back()} style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* BM Brand Header */}
      <BMHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Back Link & Doctor Summary */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
            <MedText style={[styles.backText, { color: theme.text }]}>
              {t("doctors") || "Doctors"}
            </MedText>
          </TouchableOpacity>
        </View>

        {/* Doctor Header Profile */}
        <View style={styles.profileHeader}>
          <DoctorAvatar
            uri={doctor.profilePicture ? getAssetUrl(doctor.profilePicture) : null}
            initials={doctorInitials}
            theme={theme}
            style={[styles.avatar, { backgroundColor: theme.secondaryBg }]}
            imageStyle={styles.avatarImage}
            initialsStyle={styles.initials}
          />
          <MedText variant="h2" style={[styles.detailName, { color: theme.text }]}>{doctor.fullName}</MedText>
          <MedText style={styles.specialty}>{specs}</MedText>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <MedText style={[styles.ratingText, { color: theme.textSecondary }]}>
              {doctor.rating || "0"} ({doctor.totalReviews || 0} {t("reviews") || "reviews"})
            </MedText>
          </View>

          {availability ? (
            <View
              style={[
                styles.availPill,
                {
                  backgroundColor: availability.isAvailable
                    ? `${theme.success}18`
                    : `${theme.textSecondary}18`,
                },
              ]}
            >
              <View
                style={[
                  styles.availDot,
                  {
                    backgroundColor: availability.isAvailable
                      ? theme.success
                      : theme.textSecondary,
                  },
                ]}
              />
              <MedText
                style={[
                  styles.availText,
                  { color: availability.isAvailable ? theme.success : theme.textSecondary },
                ]}
              >
                {availability.isAvailable
                  ? t("availableNow") || "Available"
                  : t("busyNow") || "Busy"}
              </MedText>
            </View>
          ) : null}
        </View>

        {/* About */}
        <View style={[styles.scheduleBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MedText style={[styles.feesTitle, { color: theme.text }]}>About</MedText>
          <MedText style={[styles.aboutText, { color: theme.textSecondary }]}>
            {doctor.bio || 'No bio available for this doctor.'}
          </MedText>
        </View>

        {/* Hospital Location */}
        {doctor.hospital || doctor.clinicAddress ? (
          <View style={[styles.feesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MedText style={[styles.feesTitle, { color: theme.text }]}>Hospital Location</MedText>

            <View style={styles.feeRow}>
              <MedText style={[styles.feeLabel, { color: theme.textSecondary }]}>Facility</MedText>
              <MedText style={[styles.feeValue, { color: theme.text }]} numberOfLines={2}>
                {doctor.hospital?.name || doctor.clinicName || '—'}
              </MedText>
            </View>

            <View style={styles.feeRow}>
              <MedText style={[styles.feeLabel, { color: theme.textSecondary }]}>Address</MedText>
              <MedText style={[styles.feeValue, { color: theme.text }]} numberOfLines={2}>
                {doctor.hospital?.address || doctor.clinicAddress || '—'}
              </MedText>
            </View>

            {distanceKm != null && (
              <View style={styles.distanceRow}>
                <Ionicons name="navigate-outline" size={16} color={theme.primary} />
                <MedText style={[styles.distanceText, { color: theme.primary }]}>
                  {distanceKm.toFixed(1)} km away
                </MedText>
              </View>
            )}

            {(doctor.hospital?.phone || typeof doctor.hospital?.latitude === 'number') && (
              <View style={styles.locationActions}>
                {doctor.hospital?.phone ? (
                  <Pressable style={[styles.locationBtn, { borderColor: theme.border }]} onPress={callHospital}>
                    <Ionicons name="call-outline" size={15} color={theme.primary} />
                    <MedText style={[styles.locationBtnText, { color: theme.primary }]}>Call</MedText>
                  </Pressable>
                ) : null}
                {typeof doctor.hospital?.latitude === 'number' && typeof doctor.hospital?.longitude === 'number' ? (
                  <Pressable style={[styles.locationBtn, { borderColor: theme.border }]} onPress={openInMaps}>
                    <Ionicons name="map-outline" size={15} color={theme.primary} />
                    <MedText style={[styles.locationBtnText, { color: theme.primary }]}>Directions</MedText>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        ) : null}

        {/* Profile & Details */}
        <View style={[styles.feesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MedText style={[styles.feesTitle, { color: theme.text }]}>Profile & Details</MedText>

          <View style={styles.feeRow}>
            <MedText style={[styles.feeLabel, { color: theme.textSecondary }]}>Hospital / Clinic</MedText>
            <MedText style={[styles.feeValue, { color: theme.text }]} numberOfLines={2}>
              {doctor.hospital?.name || doctor.clinicName || '—'}
            </MedText>
          </View>

          <View style={styles.feeRow}>
            <MedText style={[styles.feeLabel, { color: theme.textSecondary }]}>Experience</MedText>
            <MedText style={[styles.feeValue, { color: theme.text }]}>
              {doctor.experienceYears != null ? `${doctor.experienceYears} Years` : '—'}
            </MedText>
          </View>

          <View style={styles.feeRow}>
            <MedText style={[styles.feeLabel, { color: theme.textSecondary }]}>Languages</MedText>
            <MedText style={[styles.feeValue, { color: theme.text }]} numberOfLines={2}>
              {doctor.languages && doctor.languages.length
                ? doctor.languages.join(', ')
                : '—'}
            </MedText>
          </View>

          <View style={styles.feeRow}>
            <MedText style={[styles.feeLabel, { color: theme.textSecondary }]}>Total Reviews</MedText>
            <MedText style={[styles.feeValue, { color: theme.text }]}>
              {doctor.totalReviews || 0}
            </MedText>
          </View>
        </View>

        {/* Schedule List Box */}
        <View style={[styles.scheduleBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {loadingSchedules ? (
            <ActivityIndicator color={theme.primary} style={{ padding: 24 }} />
          ) : (
            <ScrollView style={styles.scheduleScroll} nestedScrollEnabled showsVerticalScrollIndicator={true}>
              {scheduleItems.map((item: any) => (
                <View key={item.id} style={styles.scheduleRow}>
                  {/* Left Date Badge */}
                  <View style={styles.dateBadge}>
                    <MedText style={styles.dateDayText}>{item.dayName}</MedText>
                    <MedText style={styles.dateNumText}>{item.dayNum}</MedText>
                    <MedText style={styles.dateMonthText}>{item.monthName}</MedText>
                  </View>

                  {/* Right Time info */}
                  <View style={styles.timeInfoRow}>
                    <Ionicons name="time-outline" size={16} color="#64748B" />
                    <MedText style={[styles.timeText, { color: theme.text }]}>{item.timeRange}</MedText>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Fees Box */}
        <View style={[styles.feesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MedText style={[styles.feesTitle, { color: theme.text }]}>Fees</MedText>
          
          <View style={styles.feeRow}>
            <MedText style={[styles.feeLabel, { color: theme.textSecondary }]}>App Fee</MedText>
            <MedText style={[styles.feeValue, { color: theme.text }]}>{appFee}</MedText>
          </View>

          <View style={styles.feeRow}>
            <MedText style={[styles.feeLabel, { color: theme.textSecondary }]}>Hospital Card Price</MedText>
            <MedText style={[styles.feeValue, { color: theme.text }]}>{cardPrice}</MedText>
          </View>
        </View>

        {/* Medical Disclaimer */}
        <MedicalDisclaimer />

        {/* Action Button */}
        <Pressable
          style={[styles.bookMainButton, { backgroundColor: "#1E56A0" }]}
          onPress={() => {
            router.push({
              pathname: "/modal",
              params: {
                doctorId: doctor.id,
                doctorName: doctor.fullName,
                doctorSpecialty: specs,
                doctorFee: doctor.hospital?.cardPrice,
              },
            });
          }}
        >
          <MedText style={styles.bookMainButtonText}>Book Appointment</MedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  initials: {
    fontSize: 28,
    fontWeight: "700",
    color: "#64748B",
  },
  detailName: {
    fontSize: 20,
    fontWeight: "800",
  },
  specialty: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  availPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  availDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  availText: {
    fontSize: 12,
    fontWeight: "700",
  },
  scheduleBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduleScroll: {
    maxHeight: 250,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  dateBadge: {
    width: 60,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  dateDayText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E56A0",
  },
  dateNumText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E56A0",
  },
  dateMonthText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E56A0",
  },
  timeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  feesCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  feesTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 14,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 21,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  feeLabel: {
    fontSize: 14,
  },
  feeValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 2,
  },
  locationActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  locationBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  bookMainButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: '#1E56A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  bookMainButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});