import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MedText } from "../medconnect/MedText";
import { DoctorAvatar } from "./DoctorAvatar";
import { getAssetUrl } from "../../constants/api";

interface DoctorCardProps {
  item: any;
  theme: any;
  t: (key: string) => string;
  onPress: () => void;
  distanceKm?: number | null;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ item, theme, t, onPress, distanceKm }) => {
  const getSpecs = (d: any): string => {
    if (d.specializations?.length) return d.specializations.join(", ");
    return d.specialization || "";
  };

  const initials = (item.fullName || "D")
    .split(" ")
    .filter(Boolean)
    .map((w: string) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const photoUri = item.profilePicture ? getAssetUrl(item.profilePicture) : null;

  const availabilityLabel =
    item.isAvailable === true
      ? t("availableNow") || "Available"
      : item.isAvailable === false
      ? t("busyNow") || "Busy"
      : null;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <DoctorAvatar
        uri={photoUri}
        initials={initials}
        theme={theme}
        style={[styles.avatar, { backgroundColor: theme.secondaryBg }]}
        imageStyle={styles.avatarImg}
        initialsStyle={styles.initials}
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <MedText variant="body" style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {item.fullName}
          </MedText>
          {availabilityLabel ? (
            <View
              style={[
                styles.availBadge,
                {
                  backgroundColor: item.isAvailable
                    ? `${theme.success}18`
                    : `${theme.textSecondary}18`,
                },
              ]}
            >
              <View
                style={[
                  styles.availDot,
                  {
                    backgroundColor: item.isAvailable ? theme.success : theme.textSecondary,
                  },
                ]}
              />
              <MedText
                variant="metadata"
                style={[
                  styles.availText,
                  { color: item.isAvailable ? theme.success : theme.textSecondary },
                ]}
              >
                {availabilityLabel}
              </MedText>
            </View>
          ) : null}
        </View>
        <MedText style={[styles.specialty, { color: theme.textSecondary }]} numberOfLines={1}>
          {getSpecs(item)}
        </MedText>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={12} color={theme.textSecondary} />
            <MedText variant="metadata" style={styles.metaText}>
              {item.rating || "0"}
            </MedText>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
            <MedText variant="metadata" style={styles.metaText}>
              {item.experienceYears || 0} {t("years")}
            </MedText>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="card-outline" size={12} color={theme.textSecondary} />
            <MedText variant="metadata" style={styles.metaText}>
              {item.hospital?.cardPrice || 0} ETB
            </MedText>
          </View>
          {distanceKm != null && distanceKm >= 0 ? (
            <View style={styles.metaItem}>
              <Ionicons name="navigate-outline" size={12} color={theme.primary} />
              <MedText variant="metadata" style={[styles.metaText, { color: theme.primary }]}>
                {distanceKm.toFixed(1)} km
              </MedText>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  initials: {
    fontSize: 18,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  availBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availText: {
    fontSize: 10,
    fontWeight: "700",
  },
  specialty: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: "#5A6B80",
  },
});