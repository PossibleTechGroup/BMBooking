import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { MedCard } from "../../components/medconnect/MedCard";
import { MedText } from "../../components/medconnect/MedText";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { AppDispatch, RootState } from "../../store";
import {
  fetchDoctorStats,
  fetchDoctorAppointments,
} from "../../store/slices/appointmentSlice";
import { toLocalDateString } from "../../utils/dateUtils";
import { formatDate, formatEthiopianLocalTime } from "../../utils/ethiopianDate";
import { useTimeFormat } from "../../utils/timeFormat";

type UpcomingItem = {
  id: string;
  date: Date;
  title: string;
  subtitle: string;
  kind: "appointment" | "schedule";
};

export default function DoctorDashboardScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { isEthiopian } = useTimeFormat();
  const fmtTime = (d: Date) => isEthiopian ? formatEthiopianLocalTime(d) : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const { stats, appointments, loading } = useSelector(
    (state: RootState) => state.appointment,
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const loadData = useCallback(() => {
    dispatch(fetchDoctorStats());
    dispatch(fetchDoctorAppointments({}));
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = () => loadData();

  const dashboardStats = [
    {
      label: t("today"),
      value: stats?.todayAppointments?.toString() || "0",
      helper: t("appointments"),
    },
    {
      label: t("pending"),
      value: stats?.pendingRequests?.toString() || "0",
      helper: t("requests"),
    },
    {
      label: t("upcoming"),
      value: stats?.upcomingTotal?.toString() || "0",
      helper: t("scheduled"),
    },
  ];

  const upcomingItems = useMemo(() => {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const items: UpcomingItem[] = [];

    appointments
      .filter(
        (a) =>
          !["declined", "completed", "cancelled"].includes(a.status) &&
          new Date(a.dateTime) >= todayStart,
      )
      .forEach((apt) => {
        items.push({
          id: `apt-${apt.id}`,
          date: new Date(apt.dateTime),
          title: apt.patient?.patientProfile?.fullName || t("patient"),
          subtitle: apt.reason || apt.status,
          kind: "appointment",
        });
      });

    const seen = new Set<string>();
    return items
      .filter((item) => {
        const key = `${item.kind}-${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [appointments, t]);

  return (
    <SafeAreaView edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <MedText variant="metadata">{t("doctorWorkspace")}</MedText>
          <MedText variant="h1">
            {t("goodMorning")}, Dr.{" "}
            {user?.doctorProfile?.fullName?.split(" ")[0] || "Doctor"}
          </MedText>
        </View>

        <View style={styles.statsGrid}>
          {dashboardStats.map((stat) => (
            <MedCard key={stat.label} style={styles.statCard}>
              <MedText variant="metadata">{stat.label}</MedText>
              <MedText variant="h1" style={styles.statValue}>
                {stat.value}
              </MedText>
              <MedText variant="metadata">{stat.helper}</MedText>
            </MedCard>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <MedText variant="h2">{t("upcomingTasks")}</MedText>
        </View>

        {upcomingItems.length === 0 ? (
          <MedCard style={styles.appointmentCard}>
            <MedText
              variant="body"
              style={{ textAlign: "center", marginVertical: 20 }}
            >
              {t("noUpcomingTasks")}
            </MedText>
          </MedCard>
        ) : (
          upcomingItems.map((item) => (
            <MedCard key={item.id} style={styles.appointmentCard}>
              <View style={styles.appointmentRow}>
                <View style={styles.timeBadge}>
                  <Ionicons
                    name={
                      item.kind === "schedule"
                        ? "business-outline"
                        : "time-outline"
                    }
                    size={16}
                    color={theme.text}
                  />
                  <MedText variant="metadata" style={styles.timeText}>
                    {formatDate(item.date, 'month-day')}
                  </MedText>
                  <MedText variant="metadata" style={styles.timeText}>
                    {fmtTime(item.date)}
                  </MedText>
                </View>
                <View style={styles.appointmentDetails}>
                  <MedText variant="h2">{item.title}</MedText>
                  <MedText variant="metadata" style={{ marginTop: 4 }}>
                    {item.subtitle}
                  </MedText>
                </View>
              </View>
            </MedCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 12,
  },
  statValue: {
    marginVertical: 6,
    fontSize: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  appointmentCard: {
    marginBottom: 12,
  },
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeBadge: {
    width: 72,
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  timeText: {
    marginTop: 4,
    fontSize: 10,
  },
  appointmentDetails: {
    flex: 1,
  },
});
