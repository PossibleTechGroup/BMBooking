import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LanguagePicker } from "../../components/LanguagePicker";
import { BMHeader } from "../../components/BMHeader";
import { MedText } from "../../components/medconnect/MedText";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchHospitals } from "../../store/slices/hospitalSlice";
import { getAssetUrl } from "../../constants/api";
import { useTranslation } from "react-i18next";
import { SERVICES } from "../../constants/services";

const EARTH_RADIUS_KM = 6371;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { user } = useSelector((state: RootState) => state.auth);
  const { hospitals, loading: hospitalsLoading } = useSelector((state: RootState) => state.hospitals);

  const [search, setSearch] = useState("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);

  React.useEffect(() => {
    dispatch(fetchHospitals());
  }, [dispatch]);

  const firstName = user?.patientProfile?.fullName
    ? user.patientProfile.fullName.split(" ")[0]
    : user?.phone || t("guest");

  const handleNearMe = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("nearMe"), t("nearMeError"));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    } catch {
      Alert.alert(t("nearMe"), t("nearMeError"));
    } finally {
      setLocating(false);
    }
  };

  const handleShowAll = () => {
    setUserCoords(null);
    setSearch("");
  };

  const filteredHospitals = useMemo(() => {
    const withDist = hospitals.map((h) => {
      if (
        userCoords &&
        typeof h.latitude === "number" &&
        typeof h.longitude === "number"
      ) {
        return {
          ...h,
          __distance: haversineKm(
            userCoords.lat,
            userCoords.lon,
            h.latitude,
            h.longitude
          ),
        };
      }
      return { ...h, __distance: null as number | null };
    });

    if (userCoords) {
      return withDist
        .filter((h) => h.__distance !== null)
        .sort((a, b) => (a.__distance! - b.__distance!));
    }

    const q = search.trim().toLowerCase();
    if (!q) return withDist;
    return withDist.filter(
      (h) =>
        (h.name || "").toLowerCase().includes(q) ||
        (h.address || "").toLowerCase().includes(q)
    );
  }, [hospitals, search, userCoords]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <BMHeader rightAction={<LanguagePicker />} />

        {/* Greeting */}
        <MedText
          variant="body"
          style={[styles.greeting, { color: theme.text }]}
          numberOfLines={1}
        >
          {t("welcomeBack") + " "}
          <MedText variant="body" style={[styles.greetingName, { color: theme.text }]}>
            {firstName}
          </MedText>
        </MedText>

        {/* Hospital search */}
        {!userCoords ? (
          <View style={styles.searchRow}>
            <View style={[styles.searchBar, { backgroundColor: theme.secondaryBg }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={t("searchHospitals")}
                placeholderTextColor={theme.textSecondary}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
            </View>
            <Pressable
              style={[styles.nearMeBtn, { backgroundColor: theme.primary }]}
              onPress={handleNearMe}
              disabled={locating}
            >
              <Ionicons
                name={locating ? "hourglass-outline" : "navigate"}
                size={16}
                color="#fff"
              />
              <MedText variant="metadata" style={styles.nearMeText}>
                {locating ? t("nearMeLoading").split(" ")[0] : t("nearMe")}
              </MedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.nearActiveRow}>
            <View
              style={[
                styles.nearActiveBadge,
                { backgroundColor: theme.primary + "1A" },
              ]}
            >
              <Ionicons name="navigate" size={14} color={theme.primary} />
              <MedText
                variant="metadata"
                style={[styles.nearActiveText, { color: theme.primary }]}
                numberOfLines={1}
              >
                {t("nearMeLoading")}
              </MedText>
            </View>
            <Pressable onPress={handleShowAll} hitSlop={8}>
              <MedText
                variant="metadata"
                style={[styles.showAllText, { color: theme.primary }]}
              >
                {t("showAll")}
              </MedText>
            </Pressable>
          </View>
        )}

        {/* Services */}
        <MedText
          variant="body"
          style={[styles.sectionTitle, { color: theme.text }]}
        >
          {t("services")}
        </MedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.servicesRow}
        >
          {SERVICES.map((s) => (
            <Pressable
              key={s.key}
              style={styles.serviceTile}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/doctors",
                  params: { service: s.label },
                })
              }
            >
              <View
                style={[
                  styles.serviceIcon,
                  { backgroundColor: theme.secondaryBg },
                ]}
              >
                <Ionicons name={s.icon} size={22} color={theme.textSecondary} />
              </View>
              <MedText
                variant="metadata"
                style={[styles.serviceLabel, { color: theme.text }]}
                numberOfLines={1}
              >
                {s.label}
              </MedText>
            </Pressable>
          ))}
          <Pressable
            style={styles.serviceTile}
            onPress={() => router.push("/(tabs)/doctors")}
          >
            <View
              style={[styles.serviceIcon, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
            >
              <Ionicons name="grid-outline" size={22} color={theme.textSecondary} />
            </View>
            <MedText
              variant="metadata"
              style={[styles.serviceLabel, { color: theme.text }]}
              numberOfLines={1}
            >
              {t("more")}
            </MedText>
          </Pressable>
        </ScrollView>

        {/* Hospitals */}
        <MedText
          variant="body"
          style={[styles.sectionTitle, { color: theme.text }]}
        >
          {t("hospitals")}
        </MedText>

        {hospitalsLoading && hospitals.length === 0 ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 8, marginBottom: 8 }} />
        ) : filteredHospitals.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[styles.emptyIcon, { backgroundColor: theme.secondaryBg }]}
            >
              <Ionicons
                name="business-outline"
                size={28}
                color={theme.textSecondary}
              />
            </View>
            <MedText variant="h2">{t("noHospitalsFound")}</MedText>
          </View>
        ) : (
          filteredHospitals.map((hospital) => {
            const doctorCount =
              (hospital as any)?.doctorCount ?? hospital.doctors?.length ?? 0;
            return (
              <>
              <Pressable
                key={`${hospital.id}-${(hospital as any)?.__distance ?? "all"}`}
                style={[
                  styles.hospitalCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() =>
                  router.push({ pathname: "/hospital-detail", params: { id: hospital.id } })
                }
              >
                <View
                  style={[
                    styles.hospitalAvatar,
                    {
                      backgroundColor: theme.secondaryBg,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {hospital.image ? (
                    <Image
                      source={{ uri: getAssetUrl(hospital.image) }}
                      style={styles.hospitalAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name="business-outline"
                      size={24}
                      color={theme.textSecondary}
                    />
                  )}
                </View>
                <View style={styles.doctorInfo}>
                  <MedText
                    variant="body"
                    style={[styles.doctorName, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {hospital.name}
                  </MedText>
                  <MedText
                    variant="metadata"
                    numberOfLines={1}
                    style={{ marginTop: 2 }}
                  >
                    {hospital.address || "—"}
                  </MedText>
                  <View style={styles.meta}>
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="medical-outline"
                        size={12}
                        color={theme.textSecondary}
                      />
                      <MedText variant="metadata" style={styles.metaText}>
                        {t("doctorsCount", { n: doctorCount })}
                      </MedText>
                    </View>
                    {(hospital as any)?.__distance != null ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="navigate" size={12} color={theme.primary} />
                        <MedText
                          variant="metadata"
                          style={[styles.metaText, { color: theme.primary }]}
                        >
                          {t("distanceKm", {
                            km: (hospital as any).__distance.toFixed(1),
                          })}
                        </MedText>
                      </View>
                    ) : null}
                    {hospital.rating ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <MedText variant="metadata" style={styles.metaText}>
                          {hospital.rating}
                        </MedText>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={styles.hospitalRight}>
                  <MedText
                    variant="metadata"
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: theme.primary,
                    }}
                  >
                    {t("viewHospital")}
                  </MedText>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={theme.primary}
                  />
                </View>
              </Pressable>
              {hospital.phone ? (
                <View style={styles.hospitalFooter}>
                  <MedText variant="metadata" style={styles.metaText}>
                    {hospital.phone}
                  </MedText>
                </View>
              ) : null}
            </>);
          })
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
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  imagingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    marginRight: 8,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  greetingName: {
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    flex: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nearMeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  nearMeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  nearActiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  nearActiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  nearActiveText: {
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  showAllText: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  servicesRow: {
    gap: 12,
    paddingBottom: 8,
    marginBottom: 8,
  },
  serviceTile: {
    width: 72,
    alignItems: "center",
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  hospitalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  hospitalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  hospitalAvatarImage: {
    width: "100%",
    height: "100%",
  },
  doctorInfo: {
    flex: 1,
    minWidth: 0,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: "#5A6B80",
  },
  hospitalRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hospitalFooter: {
    alignItems: "flex-end",
    marginTop: -6,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
});