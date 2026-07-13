import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, Pressable, TextInput, View, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInUp,
  ZoomIn,
  ZoomOut,
  Layout,
  BounceIn,
} from "react-native-reanimated";
import { MedText } from "../medconnect/MedText";
import { MEDICAL_SPECIALIZATIONS } from "../../constants/specializations";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onClose: () => void;
  specializations: string[];
  onToggle: (item: string) => void;
  theme: any;
};



export function SpecializationModal({ visible, onClose, specializations, onToggle, theme }: Props) {
  const { t } = useTranslation();
  const [specSearch, setSpecSearch] = useState("");

  const filteredSpecializations = useMemo(() => {
    return MEDICAL_SPECIALIZATIONS.filter(s =>
      s.toLowerCase().includes(specSearch.toLowerCase())
    );
  }, [specSearch]);

  const handleToggle = useCallback((item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(item);
  }, [onToggle]);

  const handleClose = useCallback(() => {
    setSpecSearch("");
    onClose();
  }, [onClose]);

  const renderItem = useCallback(({ item, index }: { item: string; index: number }) => {
    const isSelected = specializations.includes(item);
    const isMaxed = !isSelected && specializations.length >= 2;
    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 30, 300)).duration(300).springify()}
        layout={Layout.springify().damping(18)}
      >
        <Pressable
          style={[
            styles.specItem,
            {
              backgroundColor: isSelected ? theme.primary + "0D" : theme.surface,
              borderColor: isSelected ? theme.primary + "40" : theme.border + "60",
              opacity: isMaxed ? 0.45 : 1,
            },
          ]}
          onPress={() => { if (!isMaxed) handleToggle(item); }}
        >
          <View style={styles.specItemLeft}>
            <View style={[
              styles.specDot,
              {
                backgroundColor: isSelected ? theme.primary : theme.border,
                transform: [{ scale: isSelected ? 1.2 : 1 }],
              }
            ]} />
            <MedText
              variant="body"
              style={{
                fontWeight: isSelected ? "700" : "400",
                color: isSelected ? theme.primary : theme.text,
                fontSize: 15,
              }}
            >
              {item}
            </MedText>
          </View>
          {isSelected ? (
            <Animated.View entering={ZoomIn.duration(200).springify()} exiting={ZoomOut.duration(150)}>
              <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                <Ionicons name="checkmark" size={14} color="#FFF" />
              </View>
            </Animated.View>
          ) : (
            <View style={[styles.uncheckCircle, { borderColor: theme.border }]} />
          )}
        </Pressable>
      </Animated.View>
    );
  }, [specializations, theme, handleToggle]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalFullOverlay}>
        <Animated.View
          entering={SlideInUp.duration(400).springify()}
          style={[styles.modalFullContent, { backgroundColor: theme.background }]}
        >
          <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border + "40" }]}>
              <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
                <View style={[styles.closeBtnCircle, { backgroundColor: theme.surface }]}>
                  <Ionicons name="close" size={20} color={theme.text} />
                </View>
              </Pressable>
              <View style={styles.headerCenter}>
                <MedText variant="h2" style={{ fontSize: 18, fontWeight: "700" }}>
                  {t("specialization")}
                </MedText>
                <MedText variant="metadata" color={theme.muted} style={{ marginTop: 2, fontSize: 12 }}>
                  {t("selectUpToTwo")}
                </MedText>
              </View>
              <Pressable onPress={handleClose} hitSlop={12}>
                <MedText variant="body" style={{ color: theme.primary, fontWeight: "700", fontSize: 15 }}>
                  {t("done")}
                </MedText>
              </Pressable>
            </View>

            {/* Selected Chips */}
            {specializations.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(250).springify()}
                style={[styles.selectedChipsRow, { borderBottomColor: theme.border + "30" }]}
              >
                {specializations.map((s, i) => (
                  <Animated.View
                    key={s}
                    entering={BounceIn.delay(i * 100).duration(400)}
                    exiting={ZoomOut.duration(200)}
                    layout={Layout.springify()}
                  >
                    <Pressable
                      onPress={() => handleToggle(s)}
                      style={[styles.selectedChip, { backgroundColor: theme.primary + "15", borderColor: theme.primary + "30" }]}
                    >
                      <MedText variant="metadata" style={{ color: theme.primary, fontWeight: "700", fontSize: 13 }}>
                        {s}
                      </MedText>
                      <Ionicons name="close-circle" size={16} color={theme.primary} style={{ marginLeft: 6 }} />
                    </Pressable>
                  </Animated.View>
                ))}
                <View style={[styles.countBadge, { backgroundColor: theme.primary }]}>
                  <MedText variant="metadata" style={{ color: "#FFF", fontWeight: "800", fontSize: 11 }}>
                    {specializations.length}/2
                  </MedText>
                </View>
              </Animated.View>
            )}

            {/* Search Bar */}
            <Animated.View
              entering={FadeIn.duration(300).delay(100)}
              style={[styles.searchContainer]}
            >
              <View style={[styles.searchWrapper, { backgroundColor: theme.surface, borderColor: theme.border + "80" }]}>
                <Ionicons name="search" size={18} color={theme.muted} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder={t("searchSpecialization")}
                  placeholderTextColor={theme.muted}
                  value={specSearch}
                  onChangeText={setSpecSearch}
                  autoCorrect={false}
                />
                {specSearch.length > 0 && (
                  <Pressable onPress={() => setSpecSearch("")} hitSlop={10}>
                    <Animated.View entering={ZoomIn.duration(150)}>
                      <Ionicons name="close-circle" size={18} color={theme.muted} />
                    </Animated.View>
                  </Pressable>
                )}
              </View>
            </Animated.View>

            {/* Results count */}
            <View style={styles.resultsHeader}>
              <MedText variant="metadata" color={theme.muted} style={{ fontSize: 12, marginLeft: 4 }}>
                {filteredSpecializations.length} {filteredSpecializations.length === 1 ? "specialization" : "specializations"}
              </MedText>
            </View>

            {/* List */}
            <FlatList
              data={filteredSpecializations}
              keyExtractor={item => item}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={renderItem}
              ListEmptyComponent={
                <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
                  <Ionicons name="search-outline" size={40} color={theme.muted} />
                  <MedText variant="body" color={theme.muted} style={{ marginTop: 12, textAlign: "center" }}>
                    No specializations found
                  </MedText>
                </Animated.View>
              }
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalFullOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalFullContent: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  closeBtn: {
    padding: 2,
  },
  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: "auto",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    height: "100%",
  },
  resultsHeader: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    paddingTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 6,
  },
  specItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  specItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  specDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  uncheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
});
