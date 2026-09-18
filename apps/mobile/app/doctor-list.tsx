import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { MedButton } from "../components/medconnect/MedButton";
import { MedCard } from "../components/medconnect/MedCard";
import { MedText } from "../components/medconnect/MedText";
import { getAssetUrl } from "../constants/api";
import { Colors } from "../constants/theme";
import { useColorScheme } from "../hooks/use-color-scheme";
import { useUserLocation } from "../hooks/useUserLocation";
import { haversineKm } from "../utils/location";
import { AppDispatch, RootState } from "../store";
import { fetchDoctors } from "../store/slices/doctorSlice";

const SPECIALTY_ALIASES: Record<string, string[]> = {
  "dental": ["Dental", "Dentist", "Oral Health"],
  "orthopedics": ["Orthopedics", "Orthopedics / Bone & Joint", "Bone"],
  "cardiology": ["Cardiology", "Cardiology / Heart", "Heart"],
  "dermatology": ["Dermatology", "Dermatology / Skin", "Skin"],
  "eye": ["Eye Care / Ophthalmology", "Ophthalmology", "Eye Care"],
  "neurology": ["Neurology", "Neurology / Brain & Nerves", "Brain"],
  "ent": ["ENT / Ear, Nose & Throat", "ENT", "Ear"],
  "gastroenterology": ["Gastroenterology", "Gastroenterology / Digestive"],
  "pediatrics": ["Pediatrics", "Pediatrics / Children", "Pediatrician"],
  "gynecology": ["Gynecology / Women's Health", "Gynecology", "Obstetrics"],
  "urology": ["Urology", "Urologist"],
  "psychiatry": ["Psychiatry", "Psychiatry / Mental Health", "Mental Health"],
  "pulmonology": ["Pulmonology", "Pulmonology / Lungs", "Lungs"],
  "laboratory": ["Laboratory / Lab Tests", "Laboratory", "Lab"],
  "pharmacy": ["Pharmacy"],
  "emergency": ["Emergency / 24/7", "Emergency"],
  "general": ["General Checkup", "General Practice", "Family Medicine"],
};

const matchCategory = (doctor: any, category: string): boolean => {
  if (!category) return true;
  const key = category.toLowerCase();
  const aliases = SPECIALTY_ALIASES[key] || [category];
  const haystack = [
    doctor.specialization,
    (doctor.specializations || []).join(" "),
    doctor.clinicName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return aliases.some((a) => haystack.includes(a.toLowerCase()));
};

export default function DoctorListScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const dispatch = useDispatch<AppDispatch>();
  const { doctors, loading } = useSelector((state: RootState) => state.doctors);
  const { latitude, longitude } = useUserLocation();

  const distanceFor = (doctor: any): number | null => {
    if (latitude == null || longitude == null) return null;
    const lat = doctor?.hospital?.latitude;
    const lng = doctor?.hospital?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    return Math.round(haversineKm(latitude, longitude, lat, lng) * 10) / 10;
  };

  const categoryKey = typeof category === "string" ? category : undefined;

  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    minRating: 0,
    minExperience: 0,
  });

  useFocusEffect(
    useCallback(() => {
      if (doctors.length === 0) dispatch(fetchDoctors());
    }, [doctors.length, dispatch]),
  );

  // Get real doctors for current category
  const categoryDoctors = useMemo(() => {
    if (!categoryKey) return doctors;
    return doctors.filter((d) => matchCategory(d, categoryKey));
  }, [doctors, categoryKey]);

  // Filter doctors based on current filters
  const filteredDoctors = useMemo(() => {
    return categoryDoctors.filter((doctor) => {
      const rating = parseFloat(String(doctor.rating || 0));
      const experience = doctor.experienceYears || 0;
      return (
        rating >= filters.minRating &&
        experience >= filters.minExperience
      );
    });
  }, [categoryDoctors, filters]);

  const updateFilter = (key: keyof typeof filters, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      minRating: 0,
      minExperience: 0,
    });
  };

  const renderDoctorItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/doctor/[id]", params: { id: item.id } })
      }
    >
      <MedCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatarPlaceholder}>
            {item.profilePicture ? (
              <View style={styles.avatarImgWrap}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image
                  source={{ uri: getAssetUrl(item.profilePicture) }}
                  style={styles.avatarImg}
                />
              </View>
            ) : (
              <Ionicons name="person" size={32} color={theme.border} />
            )}
          </View>
          <View style={styles.info}>
            <MedText variant="h2">{item.fullName}</MedText>
            <MedText variant="metadata">
              {item.specialization || (item.specializations || []).join(", ")}
              {item.hospital?.name ? ` • ${item.hospital.name}` : ""}
            </MedText>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <MedText variant="metadata" style={{ marginLeft: 4 }}>
                {item.rating ? item.rating.toFixed(1) : "0"} ({item.totalReviews || 0} reviews)
              </MedText>
              {distanceFor(item) != null ? (
                <View style={styles.ratingRow}>
                  <Ionicons name="navigate-outline" size={14} color={theme.primary} />
                  <MedText variant="metadata" style={{ marginLeft: 4, color: theme.primary }}>
                    {distanceFor(item)!.toFixed(1)} km
                  </MedText>
                </View>
              ) : null}
            </View>
            <View style={styles.doctorDetails}>
              <MedText variant="metadata" style={styles.detailText}>
                {item.experienceYears || 0} years exp
              </MedText>
            </View>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                router.push({
                  pathname: "/modal",
                  params: { doctorId: item.id },
                });
              }}
              style={[
                styles.bookButton,
                {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                },
              ]}
            >
              <MedText
                variant="metadata"
                color={colorScheme === "dark" ? "#101828" : "#FFFFFF"}
              >
                Book
              </MedText>
            </Pressable>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.muted} />
        </View>
      </MedCard>
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <MedText variant="h1">{category || "Specialists"}</MedText>
        <Pressable
          onPress={() => setShowFilterModal(true)}
          style={styles.filterButton}
        >
          <Ionicons name="filter" size={24} color={theme.text} />
        </Pressable>
      </View>

      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctorItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator color={theme.primary} size="large" />
            ) : (
              <MedText variant="body" style={{ color: theme.muted }}>
                No doctors match your filters
              </MedText>
            )}
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <View style={styles.modalHeader}>
              <MedText variant="h2">Filter Doctors</MedText>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.filterContent}>
              {/* Rating Filter */}
              <View style={styles.filterSection}>
                <MedText variant="h2" style={styles.filterTitle}>
                  Minimum Rating
                </MedText>
                <View style={styles.ratingOptions}>
                  {[0, 3.0, 4.0, 4.5, 4.8].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingOption,
                        filters.minRating === rating && {
                          backgroundColor: theme.primary,
                        },
                      ]}
                      onPress={() => updateFilter("minRating", rating)}
                    >
                      <MedText
                        variant="body"
                        style={{
                          color:
                            filters.minRating === rating ? "white" : theme.text,
                        }}
                      >
                        {rating === 0 ? "All" : `${rating}+`}
                      </MedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Experience Filter */}
              <View style={styles.filterSection}>
                <MedText variant="h2" style={styles.filterTitle}>
                  Minimum Experience (Years)
                </MedText>
                <View style={styles.experienceOptions}>
                  {[0, 5, 10, 15, 20].map((years) => (
                    <TouchableOpacity
                      key={years}
                      style={[
                        styles.experienceOption,
                        filters.minExperience === years && {
                          backgroundColor: theme.primary,
                        },
                      ]}
                      onPress={() => updateFilter("minExperience", years)}
                    >
                      <MedText
                        variant="body"
                        style={{
                          color:
                            filters.minExperience === years
                              ? "white"
                              : theme.text,
                        }}
                      >
                        {years === 0 ? "All" : `${years}+`}
                      </MedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            </ScrollView>

            <View style={styles.modalFooter}>
              <MedButton
                title="Apply"
                onPress={() => setShowFilterModal(false)}
                style={styles.applyButton}
              />
              <MedButton
                title="Reset"
                onPress={resetFilters}
                style={styles.resetButton}
                type="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    justifyContent: "space-between",
  },
  backButton: {
    marginRight: 16,
  },
  filterButton: {
    marginLeft: 16,
    padding: 8,
  },
  listContent: {
    padding: 20,
  },
  card: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarImgWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: 56,
    height: 56,
  },
  info: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  doctorDetails: {
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
  },
  bookButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  filterContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    marginBottom: 12,
  },
  ratingOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ratingOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 60,
    alignItems: "center",
  },
  experienceOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  experienceOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 60,
    alignItems: "center",
  },
  feeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  feeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 60,
    alignItems: "center",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  resetButton: {
    flex: 0,
  },
  applyButton: {
    flex: 0,
  },
});
