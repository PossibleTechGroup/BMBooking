import React from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { MedText } from "../medconnect/MedText";

interface SpecialtyChipsProps {
  theme: any;
  t: (key: string) => string;
  selectedSpecialty: string;
  setSelectedSpecialty: (val: string) => void;
  specialties: string[];
}

export const SpecialtyChips: React.FC<SpecialtyChipsProps> = ({
  theme,
  t,
  selectedSpecialty,
  setSelectedSpecialty,
  specialties,
}) => {
  return (
    <View style={styles.specRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {specialties.map(spec => (
          <Pressable
            key={spec}
            onPress={() => setSelectedSpecialty(spec)}
            style={[
              styles.specChip,
              selectedSpecialty === spec
                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                : { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <MedText variant="metadata" color={selectedSpecialty === spec ? "#FFF" : theme.text} style={styles.chipText}>
              {spec === "All" ? t("all") : spec}
            </MedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  specRow: {
    paddingBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: "center",
  },
  specChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
  },
});
