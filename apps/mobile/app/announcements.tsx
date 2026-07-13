import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { MedCard } from "../components/medconnect/MedCard";
import { MedLoadingOverlay } from "../components/medconnect/MedLoadingOverlay";
import { MedText } from "../components/medconnect/MedText";
import { Colors } from "../constants/theme";
import { useColorScheme } from "../hooks/use-color-scheme";
import { AppDispatch, RootState } from "../store";
import { fetchAnnouncements } from "../store/slices/announcementSlice";
import { formatDate, formatEthiopianCalendarDate } from "../utils/ethiopianDate";
import { useTimeFormat } from "../utils/timeFormat";

export default function AnnouncementsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { items, loading } = useSelector((state: RootState) => state.announcements);
  const { isEthiopianCalendar } = useTimeFormat();

  useEffect(() => {
    dispatch(fetchAnnouncements());
  }, [dispatch]);

  const getDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const greg = formatDate(d, 'medium');
    if (isEthiopianCalendar) {
      const eth = formatEthiopianCalendarDate(d, 'medium');
      return `${greg} {${eth}}`;
    }
    return greg;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <MedLoadingOverlay visible={loading} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <MedText variant="h2">Announcements</MedText>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={48} color={theme.muted} />
            <MedText variant="body" color={theme.muted} style={{ marginTop: 12, textAlign: "center" }}>
              No announcements yet
            </MedText>
          </View>
        }
        renderItem={({ item }) => (
          <MedCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="megaphone" size={18} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <MedText variant="body" style={{ fontWeight: "700" }}>{item.title}</MedText>
                <MedText variant="metadata" color={theme.muted}>{getDisplayDate(item.createdAt)}</MedText>
              </View>
            </View>
            <MedText variant="body" color={theme.text} style={{ marginTop: 8, lineHeight: 20 }}>
              {item.message}
            </MedText>
          </MedCard>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  backBtn: { padding: 4 },
  list: { padding: 24, paddingBottom: 40 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  card: { padding: 20, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});
