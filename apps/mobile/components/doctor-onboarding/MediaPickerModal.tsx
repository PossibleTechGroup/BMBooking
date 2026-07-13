import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, View, StyleSheet } from "react-native";
import { MedText } from "../medconnect/MedText";

type Props = {
  visible: boolean;
  pickingType: "image" | "video";
  onClose: () => void;
  onPick: (useCamera: boolean) => void;
  theme: any;
};

export function MediaPickerModal({ visible, pickingType, onClose, onPick, theme }: Props) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <MedText variant="h2" style={styles.modalTitle}>
            {t("selectSource", { type: pickingType === "image" ? t("camera") : t("gallery") })}
          </MedText>
          <View style={styles.modalGrid}>
            <Pressable style={styles.modalOption} onPress={() => onPick(true)}>
              <Ionicons name="camera" size={32} color={theme.primary} />
              <MedText variant="body" style={{ marginTop: 8 }}>{t("camera")}</MedText>
            </Pressable>
            <Pressable style={styles.modalOption} onPress={() => onPick(false)}>
              <Ionicons name="images" size={32} color={theme.primary} />
              <MedText variant="body" style={{ marginTop: 8 }}>{t("gallery")}</MedText>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
  },
  modalTitle: {
    marginBottom: 24,
  },
  modalGrid: {
    flexDirection: "row",
    gap: 40,
  },
  modalOption: {
    alignItems: "center",
  },
});
