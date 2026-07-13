import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView, StyleSheet, View, Pressable, RefreshControl,
  Modal, TextInput, Alert, Dimensions, PanResponder, TouchableOpacity, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import Animated, { FadeIn, FadeInDown, SlideInRight, SlideInUp, SlideOutDown, FadeOut, SlideInDown, Layout } from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerModal from "../../components/DatePickerModal";
import { MedCard } from "../../components/medconnect/MedCard";
import { MedText } from "../../components/medconnect/MedText";
import { MedButton } from "../../components/medconnect/MedButton";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { AppDispatch, RootState } from "../../store";
import {
  fetchDoctorAppointments,
  fetchDoctorOwnSchedules,
  acceptAppointment, declineAppointment,
  completeAppointment, createFollowUp,
  createDoctorSchedule,
} from "../../store/slices/appointmentSlice";
import { ScheduleEntry, DAYS, formatTime, formatDisplayTime, formatDateDisplay, getDayColor, hasOverlap, timeToMinutes, generateId, formatDateISO } from "../../types/schedule";
import { formatScheduleText, shareViaSMS, shareViaWhatsApp, shareViaTelegram, shareAsFile } from "../../utils/shareUtils";
import { toLocalDateString, scheduleDayKey, startOfWeek, endOfWeek } from "../../utils/dateUtils";
import { formatDate, formatEthiopianLocalTime } from "../../utils/ethiopianDate";
import { useTimeFormat } from "../../utils/timeFormat";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HOUR_HEIGHT = 60;
const TIME_COL_WIDTH = 52;
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM - 9 PM
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Event color palette
const EVENT_COLORS = [
  { bg: "#E8F0FE", border: "#1A73E8", text: "#1A73E8" },
  { bg: "#E6F4EA", border: "#137333", text: "#137333" },
  { bg: "#FEF7E0", border: "#E37400", text: "#B06000" },
  { bg: "#FCE8E6", border: "#C5221F", text: "#C5221F" },
  { bg: "#F3E8FD", border: "#8430CE", text: "#7627BB" },
  { bg: "#E0F7FA", border: "#00838F", text: "#006064" },
];

function getEventColor(index: number) {
  return EVENT_COLORS[index % EVENT_COLORS.length];
}

function formatAmPm(hour: number, eth?: boolean): string {
  if (eth) {
    const ethHour = ((hour + 6) % 12) || 12;
    const period = (hour >= 6 && hour < 18) ? 'ቀን' : 'ሌሊት';
    return `${ethHour} ${period}`;
  }
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function timeStringToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatMinutes12(min: number, eth?: boolean): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (eth) {
    const ethHour = ((h + 6) % 12) || 12;
    const period = (h >= 6 && h < 18) ? 'ቀን' : 'ሌሊት';
    return `${ethHour}:${String(m).padStart(2, "0")} ${period}`;
  }
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending": return { bg: "#FEF3C7", text: "#B45309", border: "#F59E0B" };
    case "accepted": return { bg: "#E0F2FE", text: "#0369A1", border: "#0EA5E9" };
    case "completed": return { bg: "#DCFCE7", text: "#15803D", border: "#22C55E" };
    case "declined": return { bg: "#FEE2E2", text: "#B91C1C", border: "#EF4444" };
    default: return { bg: "#F3F4F6", text: "#6B7280", border: "#9CA3AF" };
  }
}

export default function DoctorScheduleScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { isEthiopian, isEthiopianCalendar } = useTimeFormat();
  const fmtTime = (d: Date) => isEthiopian ? formatEthiopianLocalTime(d) : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const scrollRef = useRef<ScrollView>(null);

  const { appointments, doctorSchedules, loading, loadingSchedules } = useSelector((state: RootState) => state.appointment);
  const { user } = useSelector((state: RootState) => state.auth);
  const availability = user?.doctorProfile?.availability || [];

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "3day">("day");
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [selectedAptId, setSelectedAptId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(new Date());
  const [followUpTime, setFollowUpTime] = useState(new Date());
  const [followUpReason, setFollowUpReason] = useState("");
  const [followUpAptId, setFollowUpAptId] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ── Schedule Creation State ──
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [schedIsRecurring, setSchedIsRecurring] = useState(true);
  const [schedDay, setSchedDay] = useState("Monday");
  const [schedDate, setSchedDate] = useState(new Date());
  const [schedStartTime, setSchedStartTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [schedEndTime, setSchedEndTime] = useState(new Date(new Date().setHours(17, 0, 0, 0)));
  const [schedSlotDuration, setSchedSlotDuration] = useState(30);
  const [schedHospitalId, setSchedHospitalId] = useState<number | null>(null);
  const [schedHospitalName, setSchedHospitalName] = useState<string | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showSchedDatePicker, setShowSchedDatePicker] = useState(false);
  const [schedErrors, setSchedErrors] = useState<Record<string, string>>({});
  const [selectedDays, setSelectedDays] = useState<string[]>(["Monday"]);
  const [schedNotes, setSchedNotes] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedDateRef = useRef(selectedDate);
  useEffect(() => { selectedDateRef.current = selectedDate; }, [selectedDate]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5 && Math.abs(gs.dx) > 10,
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) > 60) {
          const dir = gs.dx > 0 ? -1 : 1;
          setSelectedDate((prev) => {
            const d = new Date(prev);
            d.setDate(d.getDate() + dir);
            return d;
          });
        }
      },
    })
  ).current;

  useEffect(() => { loadData(); }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      intervalRef.current = setInterval(loadData, 30000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [selectedDate])
  );

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: (8 - 6) * HOUR_HEIGHT, animated: false }), 100);
  }, []);

  const loadData = () => {
    const dateStr = toLocalDateString(selectedDate);
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = endOfWeek(selectedDate);
    dispatch(fetchDoctorAppointments({ status: "pending" }));
    dispatch(fetchDoctorOwnSchedules({
      from: toLocalDateString(weekStart),
      to: toLocalDateString(weekEnd),
    }));
  };

  // Build week dates centered on selected
  const weekDates = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const selectedDayKey = toLocalDateString(selectedDate);

  // Map schedules to current day (compare calendar days, not local clock on UTC instants)
  const daySchedules = useMemo(() => {
    return doctorSchedules.filter((s: any) => scheduleDayKey(s.date) === selectedDayKey);
  }, [doctorSchedules, selectedDayKey]);

  const schedulesByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    doctorSchedules.forEach((s: any) => {
      const key = scheduleDayKey(s.date);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [doctorSchedules]);

  // Map availability to current day
  const dayAvailability = useMemo(() => {
    const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][selectedDate.getDay()];
    return availability.filter((a: any) => a.day === dayName);
  }, [selectedDate, availability]);

  // Map appointments to current day
  const dayAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.dateTime);
      return isSameDay(aptDate, selectedDate) && apt.status === "accepted";
    });
  }, [appointments, selectedDate]);

  const pendingCount = appointments.filter(a => a.status === "pending").length;

  const availableSchedule = useMemo(() => {
    const dayKey = toLocalDateString(followUpDate);
    const dayScheds = doctorSchedules.filter((s: any) => scheduleDayKey(s.date) === dayKey);
    if (dayScheds.length === 0) return null;
    let minStart = Infinity, maxEnd = -Infinity;
    let slotDuration = 30;
    dayScheds.forEach((s: any) => {
      const startMin = new Date(s.startTime).getHours() * 60 + new Date(s.startTime).getMinutes();
      const endMin = new Date(s.endTime).getHours() * 60 + new Date(s.endTime).getMinutes();
      if (startMin < minStart) minStart = startMin;
      if (endMin > maxEnd) maxEnd = endMin;
      if (s.slotDuration && s.slotDuration > 0) slotDuration = s.slotDuration;
    });
    return { startMinutes: minStart, endMinutes: maxEnd, slotDuration };
  }, [followUpDate, doctorSchedules]);

  const generatedSlots = useMemo(() => {
    if (!availableSchedule) return [];
    const followUpKey = toLocalDateString(followUpDate);
    const bookedMinSet = new Set<number>();
    appointments.forEach((a: any) => {
      if (["declined", "cancelled"].includes(a.status)) return;
      const aDate = new Date(a.dateTime);
      if (toLocalDateString(aDate) !== followUpKey) return;
      const aMin = aDate.getHours() * 60 + aDate.getMinutes();
      for (let m = availableSchedule.startMinutes; m < availableSchedule.endMinutes; m += availableSchedule.slotDuration) {
        if (aMin >= m && aMin < m + availableSchedule.slotDuration) {
          bookedMinSet.add(m);
        }
      }
    });
    const slots: { label: string; minutes: number; booked: boolean }[] = [];
    for (let m = availableSchedule.startMinutes; m < availableSchedule.endMinutes; m += availableSchedule.slotDuration) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const label = isEthiopian
        ? `${((h + 6) % 12) || 12}:${String(min).padStart(2, "0")} ${h >= 6 && h < 18 ? 'ቀን' : 'ሌሊት'}`
        : `${h % 12 || 12}:${String(min).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
      slots.push({ label, minutes: m, booked: bookedMinSet.has(m) });
    }
    return slots;
  }, [availableSchedule, followUpDate, appointments, isEthiopian]);

  const navigateDate = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  };

  const goToToday = () => setSelectedDate(new Date());

  const handleAccept = (id: number) => dispatch(acceptAppointment(id));
  const openDeclineModal = (id: number) => { setSelectedAptId(id); setDeclineModalVisible(true); };
  const handleDecline = () => {
    if (selectedAptId && declineReason) {
      dispatch(declineAppointment({ id: selectedAptId, reason: declineReason }));
      setDeclineModalVisible(false);
      setDeclineReason("");
    }
  };
  const handleComplete = (id: number) => {
    Alert.alert("Complete Appointment", "Mark this appointment as completed?", [
      { text: "Cancel", style: "cancel" },
      { text: "Complete", onPress: () => dispatch(completeAppointment(id)) },
    ]);
  };
  const handleScheduleFollowUp = () => {
    if (!followUpAptId) return;
    if (availableSchedule) {
      const selectedMin = followUpTime.getHours() * 60 + followUpTime.getMinutes();
      if (selectedMin < availableSchedule.startMinutes || selectedMin >= availableSchedule.endMinutes) {
        Alert.alert("Outside Schedule", `Please select a time between ${formatMinutes12(availableSchedule.startMinutes, isEthiopian)} and ${formatMinutes12(availableSchedule.endMinutes, isEthiopian)}.`);
        return;
      }
    }
    const dt = new Date(followUpDate);
    dt.setHours(followUpTime.getHours(), followUpTime.getMinutes(), 0, 0);
    dispatch(createFollowUp({ parentId: followUpAptId, dateTime: dt.toISOString(), reason: followUpReason || undefined }));
    setShowFollowUpModal(false);
    setFollowUpAptId(null);
    setFollowUpReason("");
  };

  const createTimeDate = (h: number, m: number) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const dayNameToNum = (day: string): number => {
    const map: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    return map[day.toLowerCase()] ?? 1;
  };

  const openAddSchedule = () => {
    setSchedIsRecurring(true);
    setSchedDay("Monday");
    setSchedDate(new Date());
    setSchedStartTime(createTimeDate(9, 0));
    setSchedEndTime(createTimeDate(17, 0));
    setSchedHospitalId(null);
    setSchedHospitalName(null);
    setSchedErrors({});
    setSelectedDays(["Monday"]);
    setSchedNotes("");
    setShowCreateSchedule(true);
  };

  const handleSaveSchedule = () => {
    const startStr = formatTime(schedStartTime);
    const endStr = formatTime(schedEndTime);
    const errors: Record<string, string> = {};
    if (timeToMinutes(endStr) <= timeToMinutes(startStr)) errors.endTime = "End time must be after start time";

    setSchedErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const entries: ScheduleEntry[] = [];
    if (schedIsRecurring) {
      selectedDays.forEach(day => {
        entries.push({
          id: generateId(),
          isRecurring: true,
          day,
          startTime: startStr,
          endTime: endStr,
          hospitalId: schedHospitalId,
          hospitalName: schedHospitalName,
        });
      });
    } else {
      entries.push({
        id: generateId(),
        isRecurring: false,
        date: formatDateISO(schedDate),
        startTime: startStr,
        endTime: endStr,
        hospitalId: schedHospitalId,
        hospitalName: schedHospitalName,
      });
    }

    // Send each entry to backend
    const todayStr = formatDateISO(new Date());
    const eightWeeksLater = new Date();
    eightWeeksLater.setDate(eightWeeksLater.getDate() + 56);
    const repeatEndStr = formatDateISO(eightWeeksLater);

    entries.forEach(entry => {
      const baseDate = entry.isRecurring ? todayStr : entry.date!;
      const [sh, sm] = entry.startTime.split(":").map(Number);
      const [eh, em] = entry.endTime.split(":").map(Number);
      const startISO = new Date(`${baseDate}T${String(sh).padStart(2,"0")}:${String(sm).padStart(2,"0")}:00+03:00`).toISOString();
      const endISO = new Date(`${baseDate}T${String(eh).padStart(2,"0")}:${String(em).padStart(2,"0")}:00+03:00`).toISOString();
      
      const data: any = {
        date: baseDate,
        startTime: startISO,
        endTime: endISO,
        slotDuration: entry.slotDuration || schedSlotDuration,
        maxPatientsPerSlot: 1,
        notes: schedNotes || undefined,
        hospitalId: entry.hospitalId,
      };
      if (entry.isRecurring) {
        data.repeatEndDate = repeatEndStr;
        data.daysOfWeek = [dayNameToNum(entry.day!)];
      }
      dispatch(createDoctorSchedule(data));
    });

    setShowCreateSchedule(false);
    setSchedNotes("");
  };

  const handleShare = (type: "sms" | "whatsapp" | "telegram" | "excel") => {
    const dateLabel = formatDate(selectedDate, 'medium');
    const text = formatScheduleText(dayAppointments, dateLabel, isEthiopian);
    switch (type) {
      case "sms": shareViaSMS(text); break;
      case "whatsapp": shareViaWhatsApp(text); break;
      case "telegram": shareViaTelegram(text); break;
      case "excel": {
        let csv = "Time,Patient,Phone,Issue\n";
        dayAppointments.forEach(apt => {
          const time = new Date(apt.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const patient = apt.patient?.patientProfile?.fullName || "N/A";
          csv += `"${time}","${patient}","${apt.patient?.phone}","${apt.reason}"\n`;
        });
        shareAsFile(csv, `appointments_${dateLabel.replace(/ /g, "_")}.csv`);
        break;
      }
    }
  };

  const isToday = isSameDay(selectedDate, new Date());
  const gridWidth = SCREEN_WIDTH - TIME_COL_WIDTH - 16;

  // Current time indicator position
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowY = ((nowMinutes - 6 * 60) / 60) * HOUR_HEIGHT;
  const showNowLine = isToday && now.getHours() >= 6 && now.getHours() <= 21;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <View {...panResponder.panHandlers} style={{ flex: 1 }}>
        {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable onPress={() => navigateDate(-1)} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </Pressable>
            <MedText variant="h2" style={{ fontSize: 20 }}>
              {formatDate(selectedDate, 'medium')}
            </MedText>
            <Pressable onPress={() => navigateDate(1)} hitSlop={12}>
              <Ionicons name="chevron-forward" size={22} color={theme.text} />
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {!isToday && (
              <Pressable onPress={goToToday} style={[styles.todayBtn, { borderColor: theme.primary }]}>
                <MedText variant="metadata" style={{ color: theme.primary, fontWeight: "700" }}>Today</MedText>
              </Pressable>
            )}
            <Pressable onPress={() => handleShare("whatsapp")} style={styles.iconBtn}>
              <Ionicons name="logo-whatsapp" size={18} color={theme.success} />
            </Pressable>
            <Pressable onPress={() => handleShare("excel")} style={styles.iconBtn}>
              <Ionicons name="download-outline" size={18} color={theme.text} />
            </Pressable>
          </View>
        </View>

        {/* Week strip */}
        <View style={styles.weekStrip}>
          {weekDates.map((date, idx) => {
            const isSelected = isSameDay(date, selectedDate);
            const isDayToday = isSameDay(date, new Date());
            const dayKey = toLocalDateString(date);
            const hasEvents =
              dayAppointments.some(apt => toLocalDateString(new Date(apt.dateTime)) === dayKey) ||
              (schedulesByDay[dayKey]?.length || 0) > 0;
            return (
              <Pressable
                key={idx}
                onPress={() => setSelectedDate(date)}
                style={[
                  styles.weekDay,
                  isSelected && { backgroundColor: theme.primary + "15" },
                ]}
              >
                <MedText variant="metadata" style={{
                  color: isSelected ? theme.primary : theme.muted,
                  fontSize: 10, fontWeight: "700", letterSpacing: 0.5,
                }}>
                  {DAYS_SHORT[date.getDay()]}
                </MedText>
                <View style={[
                  styles.weekDateCircle,
                  isSelected && { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
                  isDayToday && !isSelected && { borderWidth: 2, borderColor: theme.primary },
                ]}>
                  <MedText variant="body" style={{
                    fontWeight: "800", fontSize: 16,
                    color: isSelected ? "#FFF" : isDayToday ? theme.primary : theme.text,
                  }}>
                    {date.getDate()}
                  </MedText>
                </View>
                {hasEvents && (
                  <View style={[styles.dotIndicator, { backgroundColor: isSelected ? "#FFF" : theme.primary }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Pending requests banner ── */}
      {pendingCount > 0 && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Pressable onPress={() => setSelectedEvent("pending")} style={[styles.pendingBanner, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
            <Ionicons name="notifications" size={18} color="#B45309" />
            <MedText variant="body" style={{ color: "#92400E", fontWeight: "600", flex: 1, marginLeft: 10 }}>
              {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
            </MedText>
            <Ionicons name="chevron-forward" size={18} color="#B45309" />
          </Pressable>
        </Animated.View>
      )}

      {/* ── Calendar Time Grid ── */}
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        >
        <View style={styles.gridContainer}>
          {/* Time labels column */}
          <View style={styles.timeColumn}>
            {HOURS.map(hour => (
              <View key={hour} style={[styles.timeLabel, { height: HOUR_HEIGHT }]}>
                <MedText variant="metadata" style={{ color: theme.muted, fontSize: 11 }}>
                  {formatAmPm(hour, isEthiopian)}
                </MedText>
              </View>
            ))}
          </View>

          {/* Grid area */}
          <View style={[styles.gridArea, { width: gridWidth }]}>
            {/* Hour grid lines */}
            {HOURS.map(hour => (
              <View key={hour} style={[styles.hourLine, { top: (hour - 6) * HOUR_HEIGHT, borderBottomColor: theme.border + "60" }]} />
            ))}

            {/* Half-hour grid lines (subtle) */}
            {HOURS.map(hour => (
              <View key={`half-${hour}`} style={[styles.hourLine, { top: (hour - 6) * HOUR_HEIGHT + HOUR_HEIGHT / 2, borderBottomColor: theme.border + "30", borderStyle: "dashed" }]} />
            ))}

            {/* Schedule blocks (from reception) */}
            {daySchedules.map((s: any, idx: number) => {
              const sStart = new Date(s.startTime);
              const sEnd = new Date(s.endTime);
              const startMin = sStart.getHours() * 60 + sStart.getMinutes();
              const endMin = sEnd.getHours() * 60 + sEnd.getMinutes();
              const top = ((startMin - 6 * 60) / 60) * HOUR_HEIGHT;
              const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
              const location = s.hospital?.name || s.doctor?.hospital?.name || s.doctor?.clinicName || s.doctor?.fullName || s.clinicRoom || "";
              const createdByName = s.createdBy?.user?.username || "";
              return (
                <Animated.View key={`schedule-${s.id}`} entering={FadeIn.duration(400).delay(idx * 100)} style={[styles.availBlock, { top, height, backgroundColor: "#E3F2FD" + "CC", borderLeftColor: "#1565C0" }]}>
                  <MedText variant="metadata" style={{ color: "#1565C0", fontSize: 10, fontWeight: "600" }} numberOfLines={1}>
                    {location ? `Scheduled • ${location}` : "Scheduled"}{createdByName ? ` by ${createdByName}` : ""}
                  </MedText>
                </Animated.View>
              );
            })}

            {/* Availability blocks */}
            {dayAvailability.map((slot: any, idx: number) => {
              const startMin = timeStringToMinutes(slot.startTime || "09:00");
              const endMin = timeStringToMinutes(slot.endTime || "17:00");
              const top = ((startMin - 6 * 60) / 60) * HOUR_HEIGHT;
              const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
              return (
                <Animated.View key={`avail-${idx}`} entering={FadeIn.duration(400).delay(idx * 100)} style={[styles.availBlock, { top, height, backgroundColor: "#E8F5E9" + "80", borderLeftColor: "#4CAF50" }]}>
                  <MedText variant="metadata" style={{ color: "#2E7D32", fontSize: 10, fontWeight: "600" }}>
                    Available {slot.hospitalName ? `• ${slot.hospitalName}` : ""}
                  </MedText>
                </Animated.View>
              );
            })}

            {/* Appointment event cards */}
            {dayAppointments.map((apt, idx) => {
              const aptDate = new Date(apt.dateTime);
              const startMin = aptDate.getHours() * 60 + aptDate.getMinutes();
              const duration = 30; // Default 30 min
              const top = ((startMin - 6 * 60) / 60) * HOUR_HEIGHT;
              const height = Math.max((duration / 60) * HOUR_HEIGHT, 36);
              const color = getEventColor(idx);
              return (
                <Animated.View key={apt.id} entering={SlideInRight.duration(300).delay(idx * 80)}>
                  <Pressable
                    onPress={() => setSelectedEvent(apt)}
                    style={[styles.eventCard, {
                      top, height: Math.max(height, 44),
                      backgroundColor: color.bg,
                      borderLeftColor: color.border,
                      right: 4, left: 4,
                    }]}
                  >
                    <MedText variant="metadata" style={{ color: color.text, fontWeight: "700", fontSize: 12 }} numberOfLines={1}>
                      {apt.patient?.patientProfile?.fullName || "Patient"}
                    </MedText>
                    <MedText variant="metadata" style={{ color: color.text + "BB", fontSize: 10 }} numberOfLines={1}>
                      {fmtTime(aptDate)}
                    </MedText>
                  </Pressable>
                </Animated.View>
              );
            })}

            {/* Current time red line */}
            {showNowLine && (
              <View style={[styles.nowLine, { top: nowY }]}>
                <View style={styles.nowDot} />
                <View style={styles.nowLineBar} />
              </View>
            )}

            {/* Empty state */}
            {dayAppointments.length === 0 && daySchedules.length === 0 && dayAvailability.length === 0 && (
              <View style={[styles.emptyOverlay]}>
                <Ionicons name="calendar-outline" size={40} color={theme.border} />
                <MedText variant="metadata" style={{ color: theme.muted, marginTop: 8 }}>No events today</MedText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  </View>

      {/* ── FAB: Create Schedule ── */}
      <Pressable
        onPress={openAddSchedule}
        style={[styles.fab, { backgroundColor: theme.primary }]}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>

    {/* ── Compact Appointment Detail Dropdown ── */}
      <Modal visible={selectedEvent !== null && selectedEvent !== "pending"} transparent animationType="slide" onRequestClose={() => setSelectedEvent(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdropClose} onPress={() => setSelectedEvent(null)} />
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.eventModal, { backgroundColor: theme.surface }]}>
            {selectedEvent && selectedEvent !== "pending" && (() => {
              const apt = selectedEvent;
              const aptDate = new Date(apt.dateTime);
              const statusColor = getStatusColor(apt.status);
              const patientInitials = (apt.patient?.patientProfile?.fullName || "P").substring(0, 1).toUpperCase();
              const patientName = apt.patient?.patientProfile?.fullName;
              const patientPhone = apt.patient?.phone;
              const hasFollowUp = apt.status === "completed" && (apt.followUps?.length > 0 || appointments.some((a: any) => a.parentAppointmentId === apt.id));
              
              return (
                <View style={[styles.dropdownContent]}>
                  {/* Handle bar */}
                  <View style={[styles.dropdownHandle, { backgroundColor: theme.border }]} />

                  {/* Close button */}
                  <Pressable onPress={() => setSelectedEvent(null)} style={styles.dropdownClose}>
                    <Ionicons name="close" size={20} color={theme.muted} />
                  </Pressable>

                  {/* Patient row */}
                  <View style={styles.dropdownPatientRow}>
                    <View style={[styles.dropdownAvatar, { backgroundColor: statusColor.bg }]}>
                      <MedText style={{ fontSize: 18, fontWeight: "700", color: statusColor.text }}>{patientInitials}</MedText>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <MedText style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{patientName || "Patient"}</MedText>
                      {patientPhone && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <Ionicons name="call-outline" size={12} color={theme.muted} />
                          <MedText style={{ fontSize: 13, color: theme.muted }}>{patientPhone}</MedText>
                        </View>
                      )}
                    </View>
                    <View style={[styles.dropdownBadge, { backgroundColor: statusColor.bg, borderColor: statusColor.border }]}>
                      <MedText style={{ fontSize: 10, fontWeight: "800", color: statusColor.text, letterSpacing: 0.5 }}>{apt.status.toUpperCase()}</MedText>
                    </View>
                  </View>

                  {/* Date & time row */}
                  <View style={[styles.dropdownInfoRow, { backgroundColor: theme.background }]}>
                    <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                    <MedText style={{ fontSize: 14, color: theme.text, marginLeft: 8, flex: 1 }}>
                      {formatDate(aptDate, 'medium')} {' '}
                      <MedText style={{ fontSize: 14, color: theme.muted }}>
{fmtTime(aptDate)}
                      </MedText>
                    </MedText>
                  </View>

                  {/* Reason */}
                  {apt.reason && (
                    <View style={[styles.dropdownReasonBox, { backgroundColor: theme.background }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <Ionicons name="document-text-outline" size={14} color={theme.muted} />
                        <MedText style={{ fontSize: 11, color: theme.muted, fontWeight: "600" }}>Reason</MedText>
                      </View>
                      <MedText style={{ fontSize: 13, color: theme.text, lineHeight: 18 }}>{apt.reason}</MedText>
                    </View>
                  )}

                  {/* Actions */}
                  <View style={{ marginTop: 14, gap: 10 }}>
                    {apt.status === "pending" && (
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity onPress={() => { setSelectedEvent(null); handleAccept(apt.id); }}
                          style={{ flex: 1, backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 10, alignItems: "center" }}>
                          <MedText style={{ fontSize: 15, fontWeight: "600", color: colorScheme === "dark" ? "#101828" : "#FFF" }}>Accept</MedText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setSelectedEvent(null); openDeclineModal(apt.id); }}
                          style={{ flex: 1, borderWidth: 1.5, borderColor: "#B91C1C", borderRadius: 10, paddingVertical: 14, alignItems: "center" }}>
                          <MedText style={{ fontSize: 15, fontWeight: "600", color: "#B91C1C" }}>Decline</MedText>
                        </TouchableOpacity>
                      </View>
                    )}
                    {apt.status === "accepted" && (
                      <TouchableOpacity onPress={() => { setSelectedEvent(null); handleComplete(apt.id); }}
                        style={{ backgroundColor: theme.success, paddingVertical: 14, borderRadius: 10, alignItems: "center" }}>
                        <MedText style={{ fontSize: 15, fontWeight: "600", color: colorScheme === "dark" ? "#101828" : "#FFF" }}>Complete</MedText>
                      </TouchableOpacity>
                    )}
                    {apt.status === "completed" && (
                      <TouchableOpacity
                        disabled={hasFollowUp}
                        onPress={() => {
                          if (hasFollowUp) return;
                          setSelectedEvent(null);
                          setFollowUpAptId(apt.id);
                          const today = new Date();
                          setFollowUpDate(today);
                          const todayKey = toLocalDateString(today);
                          const todayScheds = doctorSchedules.filter((s: any) => scheduleDayKey(s.date) === todayKey);
                          if (todayScheds.length > 0) {
                            const startMin = new Date(todayScheds[0].startTime).getHours() * 60 + new Date(todayScheds[0].startTime).getMinutes();
                            const t = new Date(today);
                            t.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
                            setFollowUpTime(t);
                          }
                          setShowFollowUpModal(true);
                        }}
                        style={{ backgroundColor: hasFollowUp ? theme.border : theme.primary, paddingVertical: 14, borderRadius: 10, alignItems: "center", opacity: hasFollowUp ? 0.6 : 1 }}>
                        <MedText style={{ fontSize: 15, fontWeight: "600", color: hasFollowUp ? theme.muted : (colorScheme === "dark" ? "#101828" : "#FFF") }}>
                          {hasFollowUp ? "Follow-Up Scheduled" : "Schedule Follow-Up"}
                        </MedText>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })()}
          </Animated.View>
        </View>
      </Modal>

      {/* ── Pending Requests Modal ── */}
      <Modal visible={selectedEvent === "pending"} transparent animationType="slide" onRequestClose={() => setSelectedEvent(null)}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={[styles.pendingModal, { backgroundColor: theme.background }]}>
            <View style={styles.pendingModalHeader}>
              <MedText variant="h2">Pending Requests</MedText>
              <Pressable onPress={() => setSelectedEvent(null)} hitSlop={12}>
                <Ionicons name="close" size={26} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              {appointments.filter(a => a.status === "pending").map(apt => (
                <MedCard key={apt.id} style={styles.pendingCard}>
                  <View style={styles.aptHeader}>
                    <MedText variant="h2">{apt.patient?.patientProfile?.fullName || "Patient"}</MedText>
                    <MedText variant="metadata">{fmtTime(new Date(apt.dateTime))}</MedText>
                  </View>
                  <MedText variant="body" style={{ marginTop: 4, color: theme.muted }}>{apt.reason}</MedText>
                  <View style={styles.actionRow}>
                    <MedButton title="Accept" onPress={() => handleAccept(apt.id)} style={{ flex: 1 }} />
                    <MedButton title="Decline" onPress={() => openDeclineModal(apt.id)} type="outline" style={{ flex: 1 }} />
                  </View>
                </MedCard>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Decline Reason Modal ── */}
      <Modal visible={declineModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <MedCard style={styles.declineModal}>
            <MedText variant="h2">Decline Appointment</MedText>
            <MedText variant="body" style={{ marginTop: 8, color: theme.muted }}>Please provide a reason.</MedText>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. Schedule conflict..."
              placeholderTextColor={theme.muted}
              value={declineReason}
              onChangeText={setDeclineReason}
              multiline
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <MedButton title="Decline" onPress={handleDecline} style={{ flex: 1 }} />
              <MedButton title="Cancel" onPress={() => setDeclineModalVisible(false)} type="outline" style={{ flex: 1 }} />
            </View>
          </MedCard>
        </View>
      </Modal>

      {/* ── Follow-Up Modal ── */}
      <Modal visible={showFollowUpModal} transparent animationType="slide" onRequestClose={() => setShowFollowUpModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdropClose} onPress={() => setShowFollowUpModal(false)} />
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.eventModal, { backgroundColor: theme.surface }]}>
            <View style={styles.modalContent}>
              <View style={[styles.modalAccentBar, { backgroundColor: theme.primary }]} />

              <View style={styles.modalHeader}>
                <MedText variant="h2" style={styles.modalTitle}>Schedule Follow-Up</MedText>
                <Pressable style={styles.closeIconBtn} onPress={() => setShowFollowUpModal(false)} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              <MedText variant="body" style={{ color: theme.muted, marginBottom: 8, marginTop: -8 }}>
                Select date and time for the follow-up appointment.
              </MedText>

              {/* Schedule info banner */}
              {availableSchedule ? (
                <View style={{ backgroundColor: theme.primary + "12", padding: 12, borderRadius: 12, marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="time-outline" size={16} color={theme.primary} />
                  <MedText variant="metadata" style={{ color: theme.primary, fontWeight: "600", flex: 1 }}>
                    Available: {formatMinutes12(availableSchedule.startMinutes, isEthiopian)} – {formatMinutes12(availableSchedule.endMinutes, isEthiopian)}
                  </MedText>
                </View>
              ) : doctorSchedules.length > 0 ? (
                <View style={{ backgroundColor: "#FEF3C7", padding: 12, borderRadius: 12, marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="alert-circle-outline" size={16} color="#B45309" />
                  <MedText variant="metadata" style={{ color: "#B45309", fontWeight: "600", flex: 1 }}>
                    No schedule set for this day
                  </MedText>
                </View>
              ) : null}

              {/* Date picker */}
              <MedText variant="metadata" style={{ fontWeight: "600", color: theme.text, marginBottom: 6 }}>DATE</MedText>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ borderWidth: 1.5, borderColor: theme.border, borderRadius: 12, height: 52, justifyContent: 'center', paddingHorizontal: 14, flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="calendar-outline" size={18} color={theme.muted} style={{ marginRight: 10 }} />
                <MedText variant="body" style={{ color: theme.text, flex: 1 }}>{formatDate(followUpDate, 'medium')}</MedText>
                <Ionicons name="chevron-down" size={16} color={theme.muted} />
              </TouchableOpacity>
              <DatePickerModal
                visible={showDatePicker}
                value={followUpDate}
                onConfirm={(d) => { 
                  setFollowUpDate(d);
                  const dayKey = toLocalDateString(d);
                  const dayScheds = doctorSchedules.filter((s: any) => scheduleDayKey(s.date) === dayKey);
                  if (dayScheds.length > 0) {
                    const startMin = new Date(dayScheds[0].startTime).getHours() * 60 + new Date(dayScheds[0].startTime).getMinutes();
                    const t = new Date(d);
                    t.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
                    setFollowUpTime(t);
                  }
                  setShowDatePicker(false); 
                }}
                onCancel={() => setShowDatePicker(false)}
                calendar={isEthiopianCalendar ? 'ethiopian' : 'gregorian'}
              />

              {/* Time slots */}
              <MedText variant="metadata" style={{ fontWeight: "600", color: theme.text, marginBottom: 6, marginTop: 14 }}>TIME</MedText>
              {generatedSlots.length > 0 ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {generatedSlots.map((slot: any) => {
                    const selectedMin = followUpTime.getHours() * 60 + followUpTime.getMinutes();
                    const isActive = !slot.booked && slot.minutes === selectedMin;
                    return (
                      <TouchableOpacity
                        key={slot.minutes}
                        disabled={slot.booked}
                        onPress={() => {
                          const t = new Date(followUpDate);
                          t.setHours(Math.floor(slot.minutes / 60), slot.minutes % 60, 0, 0);
                          setFollowUpTime(t);
                        }}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5,
                          opacity: slot.booked ? 0.5 : 1,
                          backgroundColor: slot.booked ? theme.border : (isActive ? theme.primary : "transparent"),
                          borderColor: slot.booked ? theme.border : (isActive ? theme.primary : theme.border),
                        }}
                      >
                        <MedText variant="metadata" style={{
                          fontWeight: "600", fontSize: 13,
                          color: slot.booked ? theme.muted : (isActive ? "#FFF" : theme.text),
                        }}>
                          {slot.booked ? "Booked" : slot.label}
                        </MedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <>
                  <TouchableOpacity onPress={() => setShowTimePicker(true)} style={{ borderWidth: 1.5, borderColor: theme.border, borderRadius: 12, height: 52, justifyContent: 'center', paddingHorizontal: 14, flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="time-outline" size={18} color={theme.muted} style={{ marginRight: 10 }} />
                    <MedText variant="body" style={{ color: theme.text, flex: 1 }}>
                      {fmtTime(followUpTime)}
                    </MedText>
                    <Ionicons name="chevron-down" size={16} color={theme.muted} />
                  </TouchableOpacity>
                  {showTimePicker && (
                    <DateTimePicker
                      value={followUpTime}
                      mode="time"
                      display="default"
                      onChange={(event, t) => { setShowTimePicker(false); if (t) setFollowUpTime(t); }}
                    />
                  )}
                </>
              )}

              {/* Reason */}
              <MedText variant="metadata" style={{ fontWeight: "600", color: theme.text, marginBottom: 6, marginTop: 14 }}>REASON (optional)</MedText>
              <TextInput
                style={{ borderWidth: 1.5, borderColor: theme.border, borderRadius: 12, padding: 14, height: 80, textAlignVertical: "top", color: theme.text }}
                placeholder="Add a reason for the follow-up..."
                placeholderTextColor={theme.muted}
                value={followUpReason}
                onChangeText={setFollowUpReason}
                multiline
              />

              <View style={{ flexDirection: "row", gap: 12, marginTop: 22 }}>
                <TouchableOpacity onPress={handleScheduleFollowUp} style={{ flex: 1, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
                  <MedText variant="body" style={{ color: colorScheme === "dark" ? "#101828" : "#FFFFFF", fontWeight: "600" }}>Schedule</MedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFollowUpModal(false)} style={{ flex: 1, borderWidth: 1.5, borderColor: theme.border, borderRadius: 12, paddingVertical: 16, alignItems: "center", justifyContent: "center" }}>
                  <MedText variant="body" style={{ color: theme.text, fontWeight: "600" }}>Cancel</MedText>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ── Create Schedule Modal (onboarding-style) ── */}
      <Modal visible={showCreateSchedule} animationType="slide" transparent onRequestClose={() => setShowCreateSchedule(false)}>
        <Animated.View entering={SlideInUp.duration(400).springify()} exiting={SlideOutDown.duration(250)} style={styles.schedFullOverlay}>
          <SafeAreaView style={[styles.schedFullContent, { backgroundColor: theme.background }]}>
            <View style={styles.schedModalHeader}>
              <Pressable onPress={() => setShowCreateSchedule(false)} style={styles.schedCloseBtn}><Ionicons name="close" size={28} color={theme.text} /></Pressable>
              <MedText variant="h2">New Time Slot</MedText>
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
                        const isSel = selectedDays.includes(day);
                        return (
                          <Pressable
                            key={day}
                            style={{
                              paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5,
                              backgroundColor: isSel ? getDayColor(day) : theme.surface,
                              borderColor: isSel ? getDayColor(day) : theme.border,
                            }}
                            onPress={() => {
                              setSelectedDays(prev => {
                                const next = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
                                return next.length > 0 ? next : prev;
                              });
                            }}
                          >
                            <MedText variant="metadata" style={{ color: isSel ? "#FFF" : theme.text, fontWeight: isSel ? "700" : "500" }}>
                              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][idx]}
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
                      onPress={() => setShowSchedDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color={theme.muted} />
                      <MedText style={{ marginLeft: 8 }}>{formatDateDisplay(schedDate)}</MedText>
                    </Pressable>
                    <DatePickerModal
                      visible={showSchedDatePicker}
                      value={schedDate}
                      onConfirm={(date) => { setSchedDate(date); setShowSchedDatePicker(false); }}
                      onCancel={() => setShowSchedDatePicker(false)}
                      minimumDate={new Date()}
                      calendar={isEthiopianCalendar ? 'ethiopian' : 'gregorian'}
                    />
                  </Animated.View>
                )}
              </Animated.View>

              <View style={{ marginTop: 24 }}>
                <MedText variant="metadata" style={{ marginBottom: 10, marginLeft: 4, fontWeight: "600", color: theme.text }}>HOSPITAL</MedText>
                <View style={{ gap: 8 }}>
                  {[
                    { id: null as number | null, name: "Private Practice (No Hospital)" },
                    ...(user?.doctorProfile?.hospital ? [{ id: user.doctorProfile.hospital.id, name: user.doctorProfile.hospital.name }] : []),
                  ].map(opt => {
                    const isSelected = schedHospitalId === opt.id;
                    return (
                      <Pressable
                        key={opt.id === null ? "none" : `h-${opt.id}`}
                        style={{
                          flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1.5,
                          backgroundColor: isSelected ? theme.primary + "10" : theme.surface,
                          borderColor: isSelected ? theme.primary : theme.border,
                        }}
                        onPress={() => { setSchedHospitalId(opt.id); setSchedHospitalName(opt.id === null ? null : opt.name); }}
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
                  {showStartPicker && <DateTimePicker value={schedStartTime} mode="time" onChange={(event, date) => { setShowStartPicker(Platform.OS === "ios"); if (date) setSchedStartTime(date); }} />}
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
                  {showEndPicker && <DateTimePicker value={schedEndTime} mode="time" onChange={(event, date) => { setShowEndPicker(Platform.OS === "ios"); if (date) setSchedEndTime(date); }} />}
                  {schedErrors.endTime && (
                    <MedText variant="metadata" style={{ color: "#D92D20", marginTop: 6, marginLeft: 4 }}>{schedErrors.endTime}</MedText>
                  )}
                </View>
              </View>

              <View style={{ marginTop: 16 }}>
                <MedText variant="metadata" style={{ marginBottom: 6, marginLeft: 4, fontWeight: "600", color: theme.text }}>NOTES (optional)</MedText>
                <TextInput
                  style={{ borderWidth: 1.5, borderRadius: 12, padding: 14, height: 60, textAlignVertical: "top", borderColor: theme.border, color: theme.text }}
                  placeholder="Add notes..."
                  placeholderTextColor={theme.muted}
                  value={schedNotes} onChangeText={setSchedNotes}
                />
              </View>

              {schedErrors.overlap && (
                <Animated.View entering={SlideInDown.duration(250).springify()} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12, borderWidth: 1, backgroundColor: "#FCEBEB", borderColor: "#D92D20", marginTop: 20 }}>
                  <Ionicons name="alert-circle" size={20} color="#D92D20" />
                  <MedText style={{ color: "#D92D20", flex: 1, fontSize: 14 }}>{schedErrors.overlap}</MedText>
                </Animated.View>
              )}
            </ScrollView>

            <View style={{ padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24 }}>
              <MedButton title="Save" onPress={handleSaveSchedule} />
            </View>
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingBottom: 4 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  todayBtn: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  weekStrip: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 4, paddingVertical: 10 },
  weekDay: { alignItems: "center", gap: 4, width: 44, borderRadius: 12, paddingVertical: 6 },
  weekDateCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  dotIndicator: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  pendingBanner: { flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginTop: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  gridContainer: { flexDirection: "row", paddingTop: 8 },
  timeColumn: { width: TIME_COL_WIDTH, paddingTop: 0 },
  timeLabel: { justifyContent: "flex-start", alignItems: "flex-end", paddingRight: 8, paddingTop: 0 },
  gridArea: { position: "relative", minHeight: HOURS.length * HOUR_HEIGHT },
  hourLine: { position: "absolute", left: 0, right: 0, height: 0, borderBottomWidth: 1 },
  availBlock: { position: "absolute", left: 0, right: 0, borderLeftWidth: 3, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  eventCard: { position: "absolute", borderLeftWidth: 4, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  nowLine: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", zIndex: 100 },
  nowDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EA4335", marginLeft: -5 },
  nowLineBar: { flex: 1, height: 2, backgroundColor: "#EA4335" },
  emptyOverlay: { position: "absolute", top: 120, left: 0, right: 0, alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBackdropClose: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  eventModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 12 },
  modalContent: { padding: 24, paddingBottom: 32 },
  modalAccentBar: { width: 60, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  closeIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" },
  profileCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, marginBottom: 18 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "800" },
  profileDetails: { flex: 1, marginLeft: 14 },
  patientName: { fontSize: 17, fontWeight: "700" },
  phoneRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  patientPhone: { fontSize: 13, color: "#6B7280" },
  statusBadgeLarge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  detailsGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  detailGridCell: { flex: 1, flexDirection: "row", padding: 12, backgroundColor: "rgba(0,0,0,0.02)", borderRadius: 12, alignItems: "center", gap: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  cellIconWrapper: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.03)", alignItems: "center", justifyContent: "center" },
  cellContent: { flex: 1 },
  cellLabel: { fontSize: 10, color: "#6B7280", fontWeight: "700" },
  cellValue: { fontSize: 13, color: "#1F2937", fontWeight: "600", marginTop: 1 },
  cellSubValue: { fontSize: 10, color: "#9CA3AF" },
  reasonContainer: { padding: 14, borderRadius: 14, marginBottom: 20 },
  reasonHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  reasonTitle: { fontSize: 11, color: "#6B7280", fontWeight: "700" },
  reasonText: { fontSize: 13, lineHeight: 18, color: "#374151" },
  actionsContainer: { marginTop: 10, alignItems: "center" },
  bottomCloseLabel: { alignSelf: "center", marginTop: 16, padding: 8 },
  pendingModal: { flex: 1, marginTop: 60, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  pendingModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  pendingCard: { marginBottom: 12, padding: 16 },
  aptHeader: { flexDirection: "row", justifyContent: "space-between" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  declineModal: { padding: 24 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 16, height: 80, textAlignVertical: "top" },
  fab: { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, zIndex: 50 },

  // Dropdown detail styles
  dropdownContent: { padding: 20, paddingBottom: 28 },
  dropdownHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  dropdownClose: { position: "absolute", top: 6, right: 16, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", zIndex: 10 },
  dropdownPatientRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  dropdownAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  dropdownBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dropdownInfoRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 8 },
  dropdownReasonBox: { padding: 12, borderRadius: 10, marginBottom: 4 },
  schedFullOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  schedFullContent: { flex: 1, marginTop: 60, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden" },
  schedModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 24 },
  schedCloseBtn: { padding: 4 },
  segmentedControl: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 12, padding: 4 },
  segment: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10 },
});
