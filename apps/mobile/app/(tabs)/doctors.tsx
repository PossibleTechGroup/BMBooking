import React, { useMemo, useState, useEffect, useCallback } from "react";
import { FlatList, Pressable, View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { MedText } from "../../components/medconnect/MedText";
import { DoctorCard } from "../../components/doctor/DoctorCard";
import { SearchSection } from "../../components/doctor/SearchSection";
import { BMHeader } from "../../components/BMHeader";
import { SERVICES } from "../../constants/services";

import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { useUserLocation } from "../../hooks/useUserLocation";
import { haversineKm } from "../../utils/location";
import { fetchDoctors } from "../../store/slices/doctorSlice";
import { AppDispatch, RootState } from "../../store";

export default function DoctorsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const params = useLocalSearchParams<{ service?: string }>();

  const { latitude, longitude } = useUserLocation();

  const { doctors, loading } = useSelector((state: RootState) => state.doctors);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeService, setActiveService] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"rating" | "az">("rating");

  const categories = useMemo(
    () => ["All", ...SERVICES.map((s) => s.label)],
    []
  );

  useEffect(() => {
    dispatch(fetchDoctors());
  }, [dispatch]);

  useEffect(() => {
    const svc = typeof params.service === "string" && params.service ? params.service : "";
    setActiveService(svc || null);
    if (!svc) setSearchQuery("");
  }, [params.service]);

  const onRefresh = useCallback(() => {
    dispatch(fetchDoctors());
  }, [dispatch]);

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (activeService) {
        setActiveService(null);
        router.setParams({ service: "" });
      }
    },
    [activeService, router]
  );

  const clearService = useCallback(() => {
    setActiveService(null);
    setSearchQuery("");
    router.setParams({ service: "" });
  }, [router]);

  const selectCategory = useCallback(
    (label: string) => {
      if (label === "All") {
        clearService();
        return;
      }
      setActiveService(label);
      router.setParams({ service: label });
    },
    [clearService, router]
  );

  const filteredDoctors = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const serviceDef = SERVICES.find((s) => s.label === activeService);
    const keywords = serviceDef ? serviceDef.match : [];
    const list = doctors.filter((doctor: any) => {
      const specs = (
        doctor.specializations?.length
          ? doctor.specializations.join(", ")
          : doctor.specialization || ""
      ).toLowerCase();
      const matchesService =
        keywords.length === 0 || keywords.some((k) => specs.includes(k));
      const matchesQuery =
        !query ||
        doctor.fullName?.toLowerCase().includes(query) ||
        specs.includes(query) ||
        (doctor.clinicName || "").toLowerCase().includes(query);
      return matchesService && matchesQuery;
    });
    return [...list].sort((a: any, b: any) =>
      sortBy === "az"
        ? (a.fullName || "").localeCompare(b.fullName || "")
        : (b.rating || 0) - (a.rating || 0)
    );
  }, [doctors, searchQuery, activeService, sortBy]);

  const distanceFor = (doctor: any): number | null => {
    if (latitude == null || longitude == null) return null;
    const lat = doctor?.hospital?.latitude;
    const lng = doctor?.hospital?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    return Math.round(haversineKm(latitude, longitude, lat, lng) * 10) / 10;
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* BM Branding Header */}
      <BMHeader />

      {/* Header Title */}
      <View style={styles.titleSection}>
        <MedText variant="h1" style={[styles.headerTitle, { color: theme.text }]}>
          {t("doctors") || "Doctors"}
        </MedText>
      </View>

      <View style={styles.searchWrap}>
        <SearchSection
          theme={theme}
          t={t}
          searchQuery={searchQuery}
          setSearchQuery={handleSearch}
        />
      </View>

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setSortBy("rating")}
          style={[
            styles.filterChip,
            sortBy === "rating"
              ? { backgroundColor: "#1E56A0", borderColor: "#1E56A0" }
              : { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="star" size={14} color={sortBy === "rating" ? "#FFF" : theme.textSecondary} />
          <MedText style={styles.filterChipLabel} color={sortBy === "rating" ? "#FFF" : theme.textSecondary}>
            Top Rated
          </MedText>
        </Pressable>
        <Pressable
          onPress={() => setSortBy("az")}
          style={[
            styles.filterChip,
            sortBy === "az"
              ? { backgroundColor: "#1E56A0", borderColor: "#1E56A0" }
              : { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="swap-vertical" size={14} color={sortBy === "az" ? "#FFF" : theme.textSecondary} />
          <MedText style={styles.filterChipLabel} color={sortBy === "az" ? "#FFF" : theme.textSecondary}>
            A-Z
          </MedText>
        </Pressable>
      </View>

      <View style={styles.catRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {categories.map((cat) => {
            const active = cat === "All" ? !activeService : activeService === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => selectCategory(cat)}
                style={[
                  styles.catChip,
                  active
                    ? { backgroundColor: theme.primary + "18", borderColor: theme.primary }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <MedText
                  style={[
                    styles.catChipText,
                    { color: active ? theme.primary : theme.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {cat}
                </MedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading && filteredDoctors.length === 0 ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 32 }} />
      ) : filteredDoctors.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.secondaryBg }]}>
            <Ionicons name="medical-outline" size={28} color={theme.textSecondary} />
          </View>
          <MedText style={[styles.emptyTitle, { color: theme.text }]}>{t("noDoctorsFound") || "No doctors found"}</MedText>
          <MedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {t("tryDifferentSearch") || "Try a different search term or browse all available doctors."}
          </MedText>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          renderItem={({ item }) => (
            <DoctorCard
              item={item}
              theme={theme}
              t={t}
              distanceKm={distanceFor(item)}
              onPress={() => router.push({ pathname: "/doctor/[id]", params: { id: item.id } })}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  catRow: {
    paddingBottom: 8,
  },
  catScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});