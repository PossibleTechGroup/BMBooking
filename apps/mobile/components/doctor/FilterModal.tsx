import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MedText } from "../medconnect/MedText";

const RATING_OPTIONS = ["All", "4.5+", "4.0+", "3.5+", "3.0+"];
const PRICE_OPTIONS = [
  { label: "All", value: "All" },
  { label: "50 ETB & Under", value: "50" },
  { label: "100 ETB & Under", value: "100" },
  { label: "200 ETB & Under", value: "200" },
  { label: "500 ETB & Under", value: "500" },
];

interface FilterModalProps {
  visible: boolean;
  theme: any;
  t: (key: string) => string;
  onClose: () => void;
  selectedRating: string;
  setSelectedRating: (val: string) => void;
  selectedPriceRange: string;
  setSelectedPriceRange: (val: string) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  theme,
  t,
  onClose,
  selectedRating,
  setSelectedRating,
  selectedPriceRange,
  setSelectedPriceRange,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <MedText variant="h2">{t("filters") || "Filters"}</MedText>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>
          <ScrollView style={{ padding: 20 }}>
            <MedText variant="metadata" style={[styles.filterLabel, { color: theme.text }]}>Minimum Rating</MedText>
            <View style={styles.chipsContainer}>
              {RATING_OPTIONS.map(opt => (
                <Pressable
                  key={opt}
                  onPress={() => setSelectedRating(opt)}
                  style={[
                    styles.filterChip,
                    selectedRating === opt
                      ? { backgroundColor: theme.primary, borderColor: theme.primary }
                      : { borderColor: theme.border },
                  ]}
                >
                  <MedText variant="metadata" color={selectedRating === opt ? "#FFF" : theme.text}>
                    {opt}
                  </MedText>
                </Pressable>
              ))}
            </View>

            <MedText variant="metadata" style={[styles.filterLabel, { color: theme.text, marginTop: 24 }]}>Max Consultation Fee</MedText>
            <View style={styles.chipsContainer}>
              {PRICE_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  onPress={() => setSelectedPriceRange(opt.value)}
                  style={[
                    styles.filterChip,
                    selectedPriceRange === opt.value
                      ? { backgroundColor: theme.primary, borderColor: theme.primary }
                      : { borderColor: theme.border },
                  ]}
                >
                  <MedText variant="metadata" color={selectedPriceRange === opt.value ? "#FFF" : theme.text}>
                    {opt.label}
                  </MedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <Pressable onPress={onClose} style={[styles.applyBtn, { backgroundColor: theme.primary }]}>
              <MedText variant="body" color="#FFF" style={{ fontWeight: "600" }}>
                Apply Filters
              </MedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
  },
  applyBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipsContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
});
