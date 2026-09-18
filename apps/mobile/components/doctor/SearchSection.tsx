import React from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchSectionProps {
  theme: any;
  t: (key: string) => string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  theme,
  t,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <View style={[styles.searchBar, { backgroundColor: theme.secondaryBg }]}>
      <Ionicons name="search-outline" size={18} color={theme.muted} />
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        placeholder={t("searchDoctorPlaceholder")}
        placeholderTextColor={theme.muted}
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
});