import React from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MedText } from "../medconnect/MedText";

interface SearchSectionProps {
  theme: any;
  t: (key: string) => string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onFilterPress: () => void;
  userLocation: { lat: number; lng: number } | null;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  theme,
  t,
  searchQuery,
  setSearchQuery,
  onFilterPress,
  userLocation,
}) => {
  return (
    <View style={styles.searchSection}>
      <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.muted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={t("searchDoctorPlaceholder")}
          placeholderTextColor={theme.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Pressable onPress={onFilterPress} style={[styles.filterBtn, { backgroundColor: theme.primary + "12" }]}>
          <Ionicons name="options-outline" size={18} color={theme.primary} />
        </Pressable>
      </View>

      <View style={styles.locationIndicatorRow}>
        <Ionicons
          name={userLocation ? "location" : "location-outline"}
          size={13}
          color={userLocation ? "#10B981" : theme.muted}
        />
        <MedText variant="metadata" color={userLocation ? "#10B981" : theme.muted} style={styles.locationText}>
          {userLocation
            ? "GPS Active — Showing nearest clinics first"
            : "Enable location permissions to sort by distance"}
        </MedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  locationIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "500",
  },
});
