import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, { BounceIn, ZoomOut, FadeInDown } from "react-native-reanimated";
import { MedText } from "../medconnect/MedText";
import { MedInput } from "../medconnect/MedInput";
import { FadeInDownSpring } from "../../hooks/useAnimations";

type Props = {
  theme: any;
  styles: any;
  fullName: string;
  specializations: string[];
  experience: string;
  licenseNumber: string;
  bio: string;
  fieldErrors: Record<string, string>;
  onInputChange: (field: string, value: string, setter: (v: string) => void) => void;
  setFullName: (v: string) => void;
  setExperience: (v: string) => void;
  setLicenseNumber: (v: string) => void;
  setBio: (v: string) => void;
  onToggleSpecialization: (item: string) => void;
  onOpenSpecializationModal: () => void;
  onBioFocus?: () => void;
};

export function Step1Professional({
  theme, styles,
  fullName, specializations, experience, licenseNumber, bio,
  fieldErrors,
  onInputChange, setFullName, setExperience, setLicenseNumber, setBio,
  onToggleSpecialization, onOpenSpecializationModal,
  onBioFocus,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.formSection}>
      <MedInput
        label={t("fullName")}
        placeholder="Abel Tesfaye"
        value={fullName}
        onChangeText={v => onInputChange("fullName", v, setFullName)}
        error={!!fieldErrors.fullName}
        errorText={fieldErrors.fullName}
      />
      <View style={{ marginBottom: 20 }}>
        <MedText variant="metadata" style={[!!fieldErrors.specializations && { color: "#D92D20" }, { marginBottom: 8, marginLeft: 4 }]}>
          {t("specialization")} {t("selectUpToTwo")}
        </MedText>
        <Pressable
          onPress={onOpenSpecializationModal}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 16, paddingVertical: 10, minHeight: 56,
            borderWidth: 1.5, borderRadius: 12,
            backgroundColor: theme.surface,
            borderColor: fieldErrors.specializations ? "#D92D20" : theme.border,
          }}
        >
          <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6, rowGap: 8, alignItems: "center", minHeight: 30, paddingVertical: 2 }}>
            {specializations.length > 0 ? specializations.map(s => (
              <Animated.View key={s} entering={BounceIn.duration(300).springify()} exiting={ZoomOut.duration(200)}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: theme.primary + "15" }}>
                  <MedText variant="metadata" style={{ color: theme.primary, fontWeight: "600" }}>{s}</MedText>
                  <Pressable onPress={() => onToggleSpecialization(s)} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={theme.primary} />
                  </Pressable>
                </View>
              </Animated.View>
            )) : (
              <MedText color={theme.muted}>{t("selectSpecialization")}</MedText>
            )}
          </View>
          <Ionicons name="chevron-down" size={20} color={theme.muted} />
        </Pressable>
        {fieldErrors.specializations && (
          <Animated.View entering={FadeInDownSpring}>
            <MedText variant="metadata" style={{ color: "#D92D20", marginTop: 6, marginLeft: 4, fontSize: 12 }}>{fieldErrors.specializations}</MedText>
          </Animated.View>
        )}
      </View>
      <MedInput
        label={t("experienceYears")}
        placeholder="10"
        value={experience}
        onChangeText={v => onInputChange("experience", v, setExperience)}
        keyboardType="numeric"
        error={!!fieldErrors.experience}
        errorText={fieldErrors.experience}
      />
      <MedInput
        label={t("licenseNumber")}
        placeholder="LC-123456"
        value={licenseNumber}
        onChangeText={v => onInputChange("licenseNumber", v, setLicenseNumber)}
        error={!!fieldErrors.licenseNumber}
        errorText={fieldErrors.licenseNumber}
      />
      <MedInput
        label={t("professionalBio")}
        placeholder={t("bioPlaceholder")}
        value={bio}
        onChangeText={v => onInputChange("bio", v, setBio)}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        error={!!fieldErrors.bio}
        errorText={fieldErrors.bio}
        onFocus={onBioFocus}
      />
    </View>
  );
}
