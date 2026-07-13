import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MedText } from "../medconnect/MedText";

interface SortRowProps {
  theme: any;
  sortBy: "rating" | "distance";
  setSortBy: (val: "rating" | "distance") => void;
}

export const SortRow: React.FC<SortRowProps> = ({ theme, sortBy, setSortBy }) => {
  const options = [
    { key: "rating", label: "Top Rated", icon: "star-outline" },
    { key: "distance", label: "Nearest", icon: "location-outline" },
  ] as const;

  return (
    <View style={styles.sortRow}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {options.map(s => (
          <Pressable
            key={s.key}
            onPress={() => setSortBy(s.key)}
            style={[
              styles.sortPill,
              sortBy === s.key
                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                : { borderColor: theme.border },
            ]}
          >
            <Ionicons name={s.icon as any} size={12} color={sortBy === s.key ? "#FFF" : theme.muted} />
            <MedText variant="metadata" color={sortBy === s.key ? "#FFF" : theme.text} style={styles.pillText}>
              {s.label}
            </MedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sortRow: {
    paddingBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  sortPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  pillText: {
    marginLeft: 4,
    fontSize: 11,
  },
});
