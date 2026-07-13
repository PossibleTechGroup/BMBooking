import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { MedButton } from "../../components/medconnect/MedButton";
import { MedCard } from "../../components/medconnect/MedCard";
import { MedInput } from "../../components/medconnect/MedInput";
import { MedLoadingOverlay } from "../../components/medconnect/MedLoadingOverlay";
import { MedText } from "../../components/medconnect/MedText";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { AppDispatch, RootState } from "../../store";
import { updateDoctorAvailability } from "../../store/slices/authSlice";
import { useTimeFormat } from "../../utils/timeFormat";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type ScheduleEntry = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hasOverlap(entries: ScheduleEntry[]): boolean {
  const grouped: Record<string, ScheduleEntry[]> = {};
  for (const e of entries) {
    if (!grouped[e.day]) grouped[e.day] = [];
    grouped[e.day].push(e);
  }
  for (const day of Object.keys(grouped)) {
    const slots = grouped[day].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
    for (let i = 1; i < slots.length; i++) {
      if (timeToMinutes(slots[i].startTime) < timeToMinutes(slots[i - 1].endTime)) {
        return true;
      }
    }
  }
  return false;
}

export default function DoctorAvailabilityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { isEthiopian } = useTimeFormat();

  const { user, loading } = useSelector((state: RootState) => state.auth);
  const existingAvailability: ScheduleEntry[] =
    user?.doctorProfile?.availability || [];

  const [schedules, setSchedules] = useState<ScheduleEntry[]>(
    existingAvailability.map((s: any) => ({
      ...s,
      startTime: s.startTime || "09:00",
      endTime: s.endTime || "17:00",
      location: s.location || "",
      id: s.id || generateId(),
    }))
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);

  const createTimeDate = (h: number, m: number) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const [formDay, setFormDay] = useState("Monday");
  const [formStartTime, setFormStartTime] = useState(createTimeDate(9, 0));
  const [formEndTime, setFormEndTime] = useState(createTimeDate(17, 0));
  const [formLocation, setFormLocation] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const formatTime = (date: Date): string => {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const formatDisplayTime = (time: string, eth?: boolean): string => {
    const [h, m] = time.split(":").map(Number);
    if (eth) {
      const ethHour = ((h + 6) % 12) || 12;
      const period = (h >= 6 && h < 18) ? 'ቀን' : 'ሌሊት';
      return `${ethHour}:${m.toString().padStart(2, "0")} ${period}`;
    }
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const openAddModal = () => {
    setEditingEntry(null);
    setFormDay("Monday");
    setFormStartTime(createTimeDate(9, 0));
    setFormEndTime(createTimeDate(17, 0));
    setFormLocation("");
    setFormErrors({});
    setModalVisible(true);
  };

  const openEditModal = (entry: ScheduleEntry) => {
    setEditingEntry(entry);
    setFormDay(entry.day);
    const [sh, sm] = entry.startTime.split(":").map(Number);
    const [eh, em] = entry.endTime.split(":").map(Number);
    setFormStartTime(createTimeDate(sh, sm));
    setFormEndTime(createTimeDate(eh, em));
    setFormLocation(entry.location);
    setFormErrors({});
    setModalVisible(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const startStr = formatTime(formStartTime);
    const endStr = formatTime(formEndTime);
    if (timeToMinutes(endStr) <= timeToMinutes(startStr)) {
      errors.endTime = t("valEndAfterStart");
    }
    if (!formLocation.trim()) {
      errors.location = t("valLocationRequired");
    }
    const tempEntry: ScheduleEntry = {
      id: editingEntry?.id || "temp",
      day: formDay,
      startTime: startStr,
      endTime: endStr,
      location: formLocation.trim(),
    };
    const otherSchedules = editingEntry
      ? schedules.filter((s) => s.id !== editingEntry.id)
      : schedules;
    const testSchedules = [...otherSchedules, tempEntry];
    if (hasOverlap(testSchedules)) {
      errors.overlap = t("valScheduleOverlap");
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEntry = () => {
    if (!validateForm()) return;
    const startStr = formatTime(formStartTime);
    const endStr = formatTime(formEndTime);
    const entry: ScheduleEntry = {
      id: editingEntry?.id || generateId(),
      day: formDay,
      startTime: startStr,
      endTime: endStr,
      location: formLocation.trim(),
    };
    if (editingEntry) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === editingEntry.id ? entry : s))
      );
    } else {
      setSchedules((prev) => [...prev, entry]);
    }
    setModalVisible(false);
  };

  const handleRemoveEntry = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveAll = async () => {
    const cleaned = schedules.map(({ id, day, startTime, endTime, location }) => ({
      id,
      day,
      startTime,
      endTime,
      location,
    }));
    const result = await dispatch(updateDoctorAvailability(cleaned));
    if (updateDoctorAvailability.fulfilled.match(result)) {
      Alert.alert(t("success"), t("availabilitySaved"));
      router.back();
    }
  };

  const onStartTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowStartPicker(Platform.OS === "ios");
    if (date) setFormStartTime(date);
  };

  const onEndTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowEndPicker(Platform.OS === "ios");
    if (date) setFormEndTime(date);
  };

  const groupedByDay = DAYS.map((day) => ({
    day,
    entries: schedules.filter((s) => s.day === day),
  }));

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <MedLoadingOverlay visible={loading} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <MedText variant="h2">{t("availabilitySchedule")}</MedText>
        <Pressable onPress={openAddModal} style={styles.addBtn}>
          <Ionicons name="add-circle" size={28} color={theme.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {schedules.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={theme.muted} />
            <MedText variant="body" color={theme.muted} style={{ marginTop: 16, textAlign: "center" }}>
              {t("noScheduleYet")}
            </MedText>
            <MedButton
              title={t("addSchedule")}
              onPress={openAddModal}
              style={{ marginTop: 20 }}
            />
          </View>
        ) : (
          <>
            {groupedByDay.map(({ day, entries }) => {
              if (entries.length === 0) return null;
              return (
                <View key={day} style={{ marginBottom: 20 }}>
                  <MedText
                    variant="metadata"
                    style={{
                      fontWeight: "700",
                      marginBottom: 8,
                      marginLeft: 4,
                      color: theme.primary,
                    }}
                  >
                    {day}
                  </MedText>
                  {entries.map((entry) => (
                    <MedCard key={entry.id} style={styles.scheduleCard}>
                      <Pressable
                        onPress={() => openEditModal(entry)}
                        style={{ flex: 1 }}
                      >
                        <View style={styles.scheduleRow}>
                          <View style={styles.timeBadge}>
                            <Ionicons name="time-outline" size={14} color={theme.primary} />
                            <MedText
                              variant="metadata"
                              style={{ color: theme.primary, fontWeight: "700", marginLeft: 4 }}
                            >
                              {formatDisplayTime(entry.startTime, isEthiopian)} - {formatDisplayTime(entry.endTime, isEthiopian)}
                            </MedText>
                          </View>
                          <Pressable
                            onPress={() => handleRemoveEntry(entry.id)}
                            hitSlop={10}
                          >
                            <Ionicons name="trash-outline" size={18} color="#D92D20" />
                          </Pressable>
                        </View>
                        {entry.location ? (
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                            <Ionicons name="location-outline" size={14} color={theme.muted} />
                            <MedText variant="metadata" color={theme.muted} style={{ marginLeft: 4 }}>
                              {entry.location}
                            </MedText>
                          </View>
                        ) : null}
                      </Pressable>
                    </MedCard>
                  ))}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {schedules.length > 0 && (
        <View style={styles.footer}>
          <MedButton title={t("addSchedule")} onPress={openAddModal} type="outline" style={{ flex: 1 }} />
          <MedButton title={t("saveAndContinue")} onPress={handleSaveAll} loading={loading} style={{ flex: 2 }} />
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={28} color={theme.text} />
              </Pressable>
              <MedText variant="h2">
                {editingEntry ? t("editSchedule") : t("addSchedule")}
              </MedText>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              <MedText variant="metadata" style={{ marginBottom: 8, marginLeft: 4 }}>
                {t("day")}
              </MedText>
              <View style={styles.dayGrid}>
                {DAYS.map((day) => {
                  const isSelected = formDay === day;
                  return (
                    <Pressable
                      key={day}
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.surface,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setFormDay(day)}
                    >
                      <MedText
                        variant="metadata"
                        style={{
                          color: isSelected ? "#FFF" : theme.text,
                          fontWeight: isSelected ? "700" : "400",
                        }}
                      >
                        {day.substring(0, 3)}
                      </MedText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ marginTop: 20 }}>
                <MedText variant="metadata" style={{ marginBottom: 8, marginLeft: 4 }}>
                  {t("startTime")}
                </MedText>
                <Pressable
                  style={[styles.timePickerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={theme.muted} />
                  <MedText style={{ marginLeft: 8 }}>{formatDisplayTime(formatTime(formStartTime), isEthiopian)}</MedText>
                </Pressable>
                {showStartPicker && (
                  <DateTimePicker
                    value={formStartTime}
                    mode="time"
                    is24Hour
                    onChange={onStartTimeChange}
                  />
                )}
              </View>

              <View style={{ marginTop: 20 }}>
                <MedText variant="metadata" style={{ marginBottom: 8, marginLeft: 4 }}>
                  {t("endTime")}
                </MedText>
                <Pressable
                  style={[styles.timePickerBtn, { backgroundColor: theme.surface, borderColor: formErrors.endTime ? "#D92D20" : theme.border }]}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={theme.muted} />
                  <MedText style={{ marginLeft: 8 }}>{formatDisplayTime(formatTime(formEndTime), isEthiopian)}</MedText>
                </Pressable>
                {showEndPicker && (
                  <DateTimePicker
                    value={formEndTime}
                    mode="time"
                    is24Hour
                    onChange={onEndTimeChange}
                  />
                )}
                {formErrors.endTime && (
                  <MedText variant="metadata" style={{ color: "#D92D20", marginTop: 6, marginLeft: 4 }}>
                    {formErrors.endTime}
                  </MedText>
                )}
              </View>

              <View style={{ marginTop: 20 }}>
                <MedInput
                  label={t("location")}
                  placeholder={t("locationPlaceholder")}
                  value={formLocation}
                  onChangeText={setFormLocation}
                  error={!!formErrors.location}
                  errorText={formErrors.location}
                />
              </View>

              {formErrors.overlap && (
                <View style={[styles.errorBanner, { backgroundColor: "#FCEBEB", borderColor: "#D92D20" }]}>
                  <Ionicons name="alert-circle" size={20} color="#D92D20" />
                  <MedText style={{ color: "#D92D20", flex: 1, fontSize: 14 }}>
                    {formErrors.overlap}
                  </MedText>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <MedButton title={t("save")} onPress={handleSaveEntry} />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
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
  addBtn: { padding: 4 },
  content: { padding: 24, paddingBottom: 120 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  scheduleCard: { padding: 16, marginBottom: 8 },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { flex: 1, marginTop: 60, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  timePickerBtn: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  errorBanner: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
  },
  modalFooter: { padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24 },
});
