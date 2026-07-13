import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Platform, Pressable, ScrollView, View, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { SlideInUp, SlideOutDown, FadeInDown, FadeOut, SlideInDown, Layout } from "react-native-reanimated";
import { MedText } from "../medconnect/MedText";
import { MedButton } from "../medconnect/MedButton";
import DatePickerModal from "../DatePickerModal";
import { ScheduleEntry, DAYS, DAYS_SHORT, formatTime, formatDisplayTime, formatDateDisplay, getDayColor, hasOverlap, timeToMinutes, generateId, formatDateISO } from "../../types/schedule";
import { useTimeFormat } from "../../utils/timeFormat";
import { FadeInDownSpring } from "../../hooks/useAnimations";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (entries: ScheduleEntry[]) => void;
  editingSched: ScheduleEntry | null;
  schedules: ScheduleEntry[];
  theme: any;
  // Form state
  schedIsRecurring: boolean;
  schedDay: string;
  schedDate: Date;
  schedSlotDuration: number;
  schedStartTime: Date;
  schedEndTime: Date;
  schedHospitalId: number | null;
  schedHospitalName: string | null;
  showStartPicker: boolean;
  showEndPicker: boolean;
  showDatePicker: boolean;
  schedErrors: Record<string, string>;
  hospitals: { id: number; name: string }[];
  setSchedIsRecurring: (v: boolean) => void;
  setSchedDay: (v: string) => void;
  setSchedDate: (v: Date) => void;
  setSchedSlotDuration: (v: number) => void;
  setSchedStartTime: (v: Date) => void;
  setSchedEndTime: (v: Date) => void;
  setSchedHospitalId: (v: number | null) => void;
  setSchedHospitalName: (v: string | null) => void;
  setShowStartPicker: (v: boolean) => void;
  setShowEndPicker: (v: boolean) => void;
  setShowDatePicker: (v: boolean) => void;
  setSchedErrors: (v: Record<string, string>) => void;
};

export function ScheduleModal({
  visible, onClose, onSave, editingSched, schedules, theme,
  schedIsRecurring, schedDay, schedDate, schedSlotDuration, schedStartTime, schedEndTime,
  schedHospitalId, schedHospitalName, showStartPicker, showEndPicker, showDatePicker,
  schedErrors, hospitals,
  setSchedIsRecurring, setSchedDay, setSchedDate, setSchedSlotDuration, setSchedStartTime, setSchedEndTime,
  setSchedHospitalId, setSchedHospitalName, setShowStartPicker, setShowEndPicker, setShowDatePicker, setSchedErrors,
}: Props) {
  const { t } = useTranslation();
  const { isEthiopian, isEthiopianCalendar } = useTimeFormat();

  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setSelectedDays(editingSched ? [editingSched.day || "Monday"] : [schedDay]);
    }
  }, [visible, editingSched, schedDay]);

  const toggleDay = (day: string) => {
    if (editingSched) {
      setSelectedDays([day]);
      setSchedDay(day);
    } else {
      setSelectedDays(prev => {
        const next = prev.includes(day)
          ? prev.filter(d => d !== day)
          : [...prev, day];
        return next.length > 0 ? next : prev; // Keep at least one day selected
      });
    }
  };

  const hospitalOptions = useMemo(() => {
    const options: { id: number | null; name: string }[] = hospitals.map(h => ({ id: h.id, name: h.name }));
    options.unshift({ id: null, name: "Private Practice (No Hospital)" });
    return options;
  }, [hospitals]);

  const validateScheduleForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const startStr = formatTime(schedStartTime);
    const endStr = formatTime(schedEndTime);
    if (timeToMinutes(endStr) <= timeToMinutes(startStr)) errors.endTime = t("valEndAfterStart");
    
    const others = editingSched ? schedules.filter(s => s.id !== editingSched.id) : schedules;

    if (schedIsRecurring) {
      for (const day of selectedDays) {
        const tempEntry: ScheduleEntry = {
          id: editingSched?.id || "temp",
          isRecurring: true,
          day: day,
          startTime: startStr,
          endTime: endStr,
          hospitalId: schedHospitalId,
          hospitalName: schedHospitalName,
        };
        if (hasOverlap([...others, tempEntry])) {
          errors.overlap = `${t("valScheduleOverlap")} (${day})`;
          break;
        }
      }
    } else {
      const tempEntry: ScheduleEntry = {
        id: editingSched?.id || "temp",
        isRecurring: false,
        date: formatDateISO(schedDate),
        startTime: startStr,
        endTime: endStr,
        hospitalId: schedHospitalId,
        hospitalName: schedHospitalName,
      };
      if (hasOverlap([...others, tempEntry])) {
        errors.overlap = t("valScheduleOverlap");
      }
    }

    return errors;
  };

  const handleSave = () => {
    const errors = validateScheduleForm();
    setSchedErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const entries: ScheduleEntry[] = [];
    if (schedIsRecurring) {
      selectedDays.forEach((day, index) => {
          entries.push({
            id: index === 0 && editingSched ? editingSched.id : generateId(),
            isRecurring: true,
            day: day,
            startTime: formatTime(schedStartTime),
            endTime: formatTime(schedEndTime),
            hospitalId: schedHospitalId,
            hospitalName: schedHospitalName === "Private Practice (No Hospital)" ? null : schedHospitalName,
            slotDuration: schedSlotDuration,
          });
      });
    } else {
      entries.push({
        id: editingSched?.id || generateId(),
        isRecurring: false,
        date: formatDateISO(schedDate),
        startTime: formatTime(schedStartTime),
        endTime: formatTime(schedEndTime),
        hospitalId: schedHospitalId,
        hospitalName: schedHospitalName === "Private Practice (No Hospital)" ? null : schedHospitalName,
        slotDuration: schedSlotDuration,
      });
    }
    onSave(entries);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Animated.View
        entering={SlideInUp.duration(400).springify()}
        exiting={SlideOutDown.duration(250)}
        style={styles.modalFullOverlay}
      >
        <SafeAreaView style={[styles.modalFullContent, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={onClose} style={styles.closeBtn}><Ionicons name="close" size={28} color={theme.text} /></Pressable>
            <MedText variant="h2">{editingSched ? "Edit" : "New"} Time Slot</MedText>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <MedText variant="metadata" style={{ marginBottom: 10, marginLeft: 4, fontWeight: "600", color: theme.text }}>TYPE</MedText>
            <View style={styles.segmentedControl}>
              <Pressable
                style={[styles.segment, schedIsRecurring && { backgroundColor: theme.primary }]}
                onPress={() => setSchedIsRecurring(true)}
              >
                <Ionicons name="repeat" size={16} color={schedIsRecurring ? "#FFF" : theme.text} />
                <MedText variant="metadata" style={{ color: schedIsRecurring ? "#FFF" : theme.text, fontWeight: "700", marginLeft: 6 }}>Weekly</MedText>
              </Pressable>
              <Pressable
                style={[styles.segment, !schedIsRecurring && { backgroundColor: theme.primary }]}
                onPress={() => setSchedIsRecurring(false)}
              >
                <Ionicons name="calendar" size={16} color={!schedIsRecurring ? "#FFF" : theme.text} />
                <MedText variant="metadata" style={{ color: !schedIsRecurring ? "#FFF" : theme.text, fontWeight: "700", marginLeft: 6 }}>One-time</MedText>
              </Pressable>
            </View>

            <Animated.View layout={Layout.springify().damping(20)}>
              {schedIsRecurring ? (
                <Animated.View key="weekly" entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)} style={{ marginTop: 24 }}>
                  <MedText variant="metadata" style={{ marginBottom: 10, marginLeft: 4, fontWeight: "600", color: theme.text }}>DAY</MedText>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {DAYS.map((day, idx) => {
                      const isSelected = selectedDays.includes(day);
                      return (
                        <Pressable
                          key={day}
                          style={{
                            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5,
                            backgroundColor: isSelected ? getDayColor(day) : theme.surface,
                            borderColor: isSelected ? getDayColor(day) : theme.border,
                          }}
                          onPress={() => toggleDay(day)}
                        >
                          <MedText variant="metadata" style={{ color: isSelected ? "#FFF" : theme.text, fontWeight: isSelected ? "700" : "500" }}>
                            {DAYS_SHORT[idx]}
                          </MedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              ) : (
                <Animated.View key="date" entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)} style={{ marginTop: 24 }}>
                  <MedText variant="metadata" style={{ marginBottom: 8, marginLeft: 4, fontWeight: "600", color: theme.text }}>DATE</MedText>
                  <Pressable
                    style={{ height: 56, borderWidth: 1.5, borderRadius: 12, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, backgroundColor: theme.surface, borderColor: theme.border }}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={theme.muted} />
                    <MedText style={{ marginLeft: 8 }}>{formatDateDisplay(schedDate)}</MedText>
                  </Pressable>
                  <DatePickerModal
                    visible={showDatePicker}
                    value={schedDate}
                    onConfirm={(date) => { setSchedDate(date); setShowDatePicker(false); }}
                    onCancel={() => setShowDatePicker(false)}
                    minimumDate={new Date()}
                    calendar={isEthiopianCalendar ? 'ethiopian' : 'gregorian'}
                  />
                </Animated.View>
              )}
            </Animated.View>

            <View style={{ marginTop: 24 }}>
              <MedText variant="metadata" style={{ marginBottom: 10, marginLeft: 4, fontWeight: "600", color: theme.text }}>HOSPITAL</MedText>
              <View style={{ gap: 8 }}>
                {hospitalOptions.map(opt => {
                  const isSelected = schedHospitalId === opt.id && schedHospitalName === (opt.name === "Private Practice (No Hospital)" ? null : opt.name);
                  return (
                    <Pressable
                      key={opt.id === null ? "none" : `h-${opt.id}`}
                      style={{
                        flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1.5,
                        backgroundColor: isSelected ? theme.primary + "10" : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      }}
                      onPress={() => { setSchedHospitalId(opt.id); setSchedHospitalName(opt.name === "Private Practice (No Hospital)" ? null : opt.name); }}
                    >
                      <Ionicons name={opt.id === null ? "home-outline" : "business-outline"} size={18} color={isSelected ? theme.primary : theme.muted} />
                      <MedText variant="body" style={{ flex: 1, marginLeft: 12, color: isSelected ? theme.primary : theme.text, fontWeight: isSelected ? "700" : "400" }}>
                        {opt.name}
                      </MedText>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ marginTop: 24 }}>
              <MedText variant="metadata" style={{ marginBottom: 10, marginLeft: 4, fontWeight: "600", color: theme.text }}>SLOT DURATION (minutes)</MedText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Pressable
                  onPress={() => setSchedSlotDuration(Math.max(1, schedSlotDuration - 5))}
                  style={{ width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: theme.border, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface }}
                >
                  <Ionicons name="remove" size={22} color={theme.text} />
                </Pressable>
                <TextInput
                  value={String(schedSlotDuration)}
                  onChangeText={t => { const v = parseInt(t) || 1; setSchedSlotDuration(Math.max(1, Math.min(240, v))); }}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  style={{ flex: 1, height: 48, borderWidth: 1.5, borderRadius: 12, borderColor: theme.border, textAlign: "center", fontSize: 18, fontWeight: "700", color: theme.text, backgroundColor: theme.surface }}
                />
                <Pressable
                  onPress={() => setSchedSlotDuration(Math.min(240, schedSlotDuration + 5))}
                  style={{ width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: theme.border, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface }}
                >
                  <Ionicons name="add" size={22} color={theme.text} />
                </Pressable>
              </View>
            </View>

            <View style={{ marginTop: 24, flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <MedText variant="metadata" style={{ marginBottom: 8, marginLeft: 4, fontWeight: "600", color: theme.text }}>START</MedText>
                <Pressable
                  style={{ height: 56, borderWidth: 1.5, borderRadius: 12, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, backgroundColor: theme.surface, borderColor: theme.border }}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={theme.muted} />
                  <MedText style={{ marginLeft: 8 }}>{formatDisplayTime(formatTime(schedStartTime), isEthiopian)}</MedText>
                </Pressable>
                {showStartPicker && <DateTimePicker value={schedStartTime} mode="time" is24Hour onChange={(_: DateTimePickerEvent, date?: Date) => { setShowStartPicker(Platform.OS === "ios"); if (date) setSchedStartTime(date); }} />}
              </View>
              <View style={{ flex: 1 }}>
                <MedText variant="metadata" style={{ marginBottom: 8, marginLeft: 4, fontWeight: "600", color: theme.text }}>END</MedText>
                <Pressable
                  style={{ height: 56, borderWidth: 1.5, borderRadius: 12, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, backgroundColor: theme.surface, borderColor: schedErrors.endTime ? "#D92D20" : theme.border }}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={theme.muted} />
                  <MedText style={{ marginLeft: 8 }}>{formatDisplayTime(formatTime(schedEndTime), isEthiopian)}</MedText>
                </Pressable>
                {showEndPicker && <DateTimePicker value={schedEndTime} mode="time" is24Hour onChange={(_: DateTimePickerEvent, date?: Date) => { setShowEndPicker(Platform.OS === "ios"); if (date) setSchedEndTime(date); }} />}
                {schedErrors.endTime && (
                  <Animated.View entering={FadeInDownSpring}>
                    <MedText variant="metadata" style={{ color: "#D92D20", marginTop: 6, marginLeft: 4 }}>{schedErrors.endTime}</MedText>
                  </Animated.View>
                )}
              </View>
            </View>

            {schedErrors.overlap && (
              <Animated.View
                entering={SlideInDown.duration(250).springify()}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12, borderWidth: 1, backgroundColor: "#FCEBEB", borderColor: "#D92D20", marginTop: 20 }}
              >
                <Ionicons name="alert-circle" size={20} color="#D92D20" />
                <MedText style={{ color: "#D92D20", flex: 1, fontSize: 14 }}>{schedErrors.overlap}</MedText>
              </Animated.View>
            )}
          </ScrollView>

          <View style={{ padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24 }}>
            <MedButton title={t("save")} onPress={handleSave} />
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalFullOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalFullContent: { flex: 1, marginTop: 60, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 24 },
  closeBtn: { padding: 4 },
  segmentedControl: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 12, padding: 4 },
  segment: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10 },
});
