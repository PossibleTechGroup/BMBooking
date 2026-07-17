import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MedCard } from "../medconnect/MedCard";
import { MedText } from "../medconnect/MedText";
import { getAssetUrl } from "../../constants/api";

interface DoctorCardProps {
  item: any;
  theme: any;
  t: (key: string) => string;
  distance: number | null;
  onPress: () => void;
  onBook: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  item,
  theme,
  t,
  distance,
  onPress,
  onBook,
}) => {
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

  const cardPrice = item.hospital?.cardPrice;
  const displayFee = cardPrice ? `${parseFloat(cardPrice).toLocaleString()} ETB` : null;

  return (
    <Pressable onPress={onPress}>
      <MedCard style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.row}>
          {item.profilePicture ? (
            <Image source={{ uri: getAssetUrl(item.profilePicture) }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.primary + "12" }]}>
              <MedText style={{ fontSize: 16, fontWeight: "600", color: theme.primary }}>{initials}</MedText>
            </View>
          )}
          <View style={styles.info}>
            <MedText variant="body" style={[styles.name, { color: theme.text }]}>{item.fullName}</MedText>
            <MedText variant="metadata" color={theme.muted} style={{ marginTop: 1 }}>
              {getSpecs(item)}
            </MedText>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <MedText variant="metadata" style={[styles.metaText, { color: theme.text }]}>
                {item.rating?.toFixed(1) || "0.0"}
              </MedText>
              <MedText variant="metadata" color={theme.border}> • </MedText>
              <MedText variant="metadata" style={[styles.metaText, { color: theme.text }]}>
                {item.experienceYears}yr
              </MedText>
              {distance !== null && (
                <>
                  <MedText variant="metadata" color={theme.border}> • </MedText>
                  <Ionicons name="location-outline" size={11} color={theme.muted} />
                  <MedText variant="metadata" style={[styles.metaText, { color: theme.text }]}>
                    {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                  </MedText>
                </>
              )}
              {displayFee && (
                <>
                  <MedText variant="metadata" color={theme.border}> • </MedText>
                  <MedText variant="metadata" style={[styles.metaText, { color: theme.text, fontWeight: "600" }]}>
                    {displayFee}
                  </MedText>
                </>
              )}
            </View>
          </View>
          <Pressable onPress={onBook} style={[styles.bookBtn, { backgroundColor: theme.primary }]}>
            <MedText variant="metadata" color="#FFF" style={{ fontWeight: "600", fontSize: 11 }}>
              {t("book")}
            </MedText>
          </Pressable>
        </View>
      </MedCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: "600",
    fontSize: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 3,
  },
  metaText: {
    fontSize: 11,
  },
  bookBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
});
