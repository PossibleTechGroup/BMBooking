import React, { useMemo, useState, useEffect, useCallback } from "react";
import { FlatList, View, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";

import { MedText } from "../../components/medconnect/MedText";
import { DoctorCard } from "../../components/doctor/DoctorCard";
import { SearchSection } from "../../components/doctor/SearchSection";
import { SortRow } from "../../components/doctor/SortRow";
import { SpecialtyChips } from "../../components/doctor/SpecialtyChips";
import { FilterModal } from "../../components/doctor/FilterModal";

import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { fetchDoctors } from "../../store/slices/doctorSlice";
import { AppDispatch, RootState } from "../../store";
import { haversineKm } from "../../utils/location";

const SPECIALTIES = [
  "All", "Cardiology", "Neurology", "Dermatology", "Pediatrics", "Orthopedics",
  "Ophthalmology", "Gynecology", "Internal Medicine", "General Surgery",
];

export default function DoctorsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const { doctors, loading } = useSelector((state: RootState) => state.doctors);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [sortBy, setSortBy] = useState<"rating" | "distance">("rating");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState("All");

  useEffect(() => {
    dispatch(fetchDoctors());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchDoctors());
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  const getDistance = (d: any): number | null => {
    if (!userLocation) return null;
    const lat = d.hospital?.latitude || d.latitude;
    const lng = d.hospital?.longitude || d.longitude;
    if (!lat || !lng) return null;
    return haversineKm(userLocation.lat, userLocation.lng, lat, lng);
  };

  const getPrice = (doctor: any): number => {
    const cardPrice = doctor.hospital?.cardPrice;
    return cardPrice ? parseFloat(cardPrice) : 0;
  };

  const filteredDoctors = useMemo(() => {
    let result = doctors.filter((doctor: any) => {
      const allSpecs = (
        doctor.specializations?.length
          ? doctor.specializations.join(", ")
          : doctor.specialization || ""
      ).toLowerCase();
      const matchesSearch =
        doctor.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        allSpecs.includes(searchQuery.toLowerCase()) ||
        (doctor.clinicAddress || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpec = selectedSpecialty === "All" || allSpecs.includes(selectedSpecialty.toLowerCase());
      const matchesRating = selectedRating === "All" || (doctor.rating || 0) >= parseFloat(selectedRating.replace("+", ""));
      const matchesPrice = selectedPriceRange === "All" || getPrice(doctor) <= parseFloat(selectedPriceRange);
      return matchesSearch && matchesSpec && matchesRating && matchesPrice;
    });

    if (sortBy === "distance" && userLocation) {
      result = [...result].sort((a, b) => (getDistance(a) ?? 999) - (getDistance(b) ?? 999));
    } else if (sortBy === "rating") {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return result;
  }, [doctors, searchQuery, selectedSpecialty, selectedRating, selectedPriceRange, sortBy, userLocation]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <MedText variant="h2" style={{ fontSize: 20 }}>{t("findDoctors")}</MedText>
      </View>

      {/* Search Input and Location Display directly under the search bar */}
      <SearchSection
        theme={theme}
        t={t}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onFilterPress={() => setIsFilterVisible(true)}
        userLocation={userLocation}
      />

      {/* Sorting Tabs/Pills */}
      <SortRow theme={theme} sortBy={sortBy} setSortBy={setSortBy} />

      {/* Specialty Filter Chips */}
      <SpecialtyChips
        theme={theme}
        t={t}
        selectedSpecialty={selectedSpecialty}
        setSelectedSpecialty={setSelectedSpecialty}
        specialties={SPECIALTIES}
      />

      {/* Counter */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <MedText variant="metadata" color={theme.muted}>{filteredDoctors.length} doctors found</MedText>
      </View>

      {/* List */}
      <FlatList
        data={filteredDoctors}
        renderItem={({ item }) => (
          <DoctorCard
            item={item}
            theme={theme}
            t={t}
            distance={getDistance(item)}
            onPress={() => router.push({ pathname: "/doctor/[id]", params: { id: item.id } })}
            onBook={() =>
              router.push({
                pathname: "/modal",
                params: {
                  doctorId: item.id,
                  doctorName: item.fullName,
                  doctorSpecialty: item.specialization,
                },
              })
            }
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      />

      {/* Filters Modal */}
      <FilterModal
        visible={isFilterVisible}
        theme={theme}
        t={t}
        onClose={() => setIsFilterVisible(false)}
        selectedRating={selectedRating}
        setSelectedRating={setSelectedRating}
        selectedPriceRange={selectedPriceRange}
        setSelectedPriceRange={setSelectedPriceRange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
