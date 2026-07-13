import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import {
  ScrollView, StyleSheet, View, Pressable,
  Modal, TextInput, Alert, RefreshControl, Dimensions,
  PanResponder, TouchableOpacity, Image, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import Animated, { FadeIn, FadeInDown, SlideInRight } from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerModal from "../../components/DatePickerModal";
import { MedCard } from "../../components/medconnect/MedCard";
import { MedText } from "../../components/medconnect/MedText";
import { MedButton } from "../../components/medconnect/MedButton";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { AppDispatch, RootState } from "../../store";
import {
  fetchDoctorAppointments, fetchDoctorOwnSchedules,
  acceptAppointment, declineAppointment, completeAppointment, createFollowUp,
} from "../../store/slices/appointmentSlice";
import { toLocalDateString, scheduleDayKey, startOfWeek, endOfWeek } from "../../utils/dateUtils";
import { formatDate, formatEthiopianLocalTime } from "../../utils/ethiopianDate";
import { useTimeFormat } from "../../utils/timeFormat";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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
    case "accepted": return { bg: "#DCFCE7", text: "#15803D", border: "#22C55E" };
    case "completed": return { bg: "#E0F2FE", text: "#0369A1", border: "#0EA5E9" };
    case "declined": return { bg: "#FEE2E2", text: "#B91C1C", border: "#EF4444" };
    default: return { bg: "#F3F4F6", text: "#6B7280", border: "#9CA3AF" };
  }
}

export default function DoctorAppointmentsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { isEthiopian, isEthiopianCalendar } = useTimeFormat();
  const fmtTime = (d: Date) => isEthiopian ? formatEthiopianLocalTime(d) : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const { appointments, doctorSchedules, loading } = useSelector((state: RootState) => state.appointment);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [selectedAptId, setSelectedAptId] = useState<number | null>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(new Date());
  const [followUpTime, setFollowUpTime] = useState(new Date());
  const [followUpReason, setFollowUpReason] = useState("");
  const [followUpAptId, setFollowUpAptId] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const selectedDateRef = useRef(selectedDate);
  useEffect(() => { selectedDateRef.current = selectedDate; }, [selectedDate]);

  const loadData = useCallback(() => {
    dispatch(fetchDoctorAppointments({}));
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    dispatch(fetchDoctorOwnSchedules({
      from: toLocalDateString(monthStart),
      to: toLocalDateString(monthEnd),
    }));
  }, [dispatch, selectedDate]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Build week strip centered around selectedDate
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  // Map appointments to dates
  const aptMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    appointments.forEach((apt: any) => {
      const key = new Date(apt.dateTime).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    });
    return map;
  }, [appointments]);

  const dayAppointments = useMemo(() => {
    const key = selectedDate.toDateString();
    return (aptMap[key] || []).sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [aptMap, selectedDate]);

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
    Alert.alert("Complete", "Mark appointment as completed?", [
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

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Date Navigation & Week Strip Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable onPress={() => navigateDate(-1)} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </Pressable>
            <MedText variant="h2" style={{ fontSize: 18, fontWeight: "700" }}>
              {formatDate(selectedDate, 'full')}
            </MedText>
            <Pressable onPress={() => navigateDate(1)} hitSlop={12}>
              <Ionicons name="chevron-forward" size={22} color={theme.text} />
            </Pressable>
          </View>
          
          {!isToday && (
            <Pressable onPress={goToToday} style={[styles.todayBtn, { borderColor: theme.primary }]}>
              <MedText variant="metadata" style={{ color: theme.primary, fontWeight: "700" }}>Today</MedText>
            </Pressable>
          )}
        </View>

        {/* Week strip */}
        <View style={styles.weekStrip}>
          {weekDates.map((date, idx) => {
            const isSelected = isSameDay(date, selectedDate);
            const isDayToday = isSameDay(date, new Date());
            const dayKey = date.toDateString();
            const hasApts = (aptMap[dayKey]?.length || 0) > 0;
            const pendingCount = aptMap[dayKey]?.filter((a: any) => a.status === "pending").length || 0;

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
                  isSelected && { 
                    backgroundColor: theme.primary, 
                    shadowColor: theme.primary, 
                    shadowOffset: { width: 0, height: 2 }, 
                    shadowOpacity: 0.3, 
                    shadowRadius: 4, 
                    elevation: 4 
                  },
                  isDayToday && !isSelected && { borderWidth: 2, borderColor: theme.primary },
                ]}>
                  <MedText variant="body" style={{
                    fontWeight: "800", fontSize: 16,
                    color: isSelected ? "#FFF" : isDayToday ? theme.primary : theme.text,
                  }}>
                    {date.getDate()}
                  </MedText>
                </View>

                {pendingCount > 0 && (
                  <View style={styles.badgeIndicator} />
                )}
                {hasApts && pendingCount === 0 && (
                  <View style={[styles.dotIndicator, { backgroundColor: isSelected ? "#FFF" : theme.primary }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selected date quick label */}
      <View style={styles.dateLabel}>
        <MedText variant="metadata" style={{ color: theme.muted, fontWeight: "600", fontSize: 13 }}>
          {dayAppointments.length} Appointment{dayAppointments.length !== 1 ? "s" : ""}
        </MedText>
      </View>

      {/* Appointments list */}
      <View {...panResponder.panHandlers} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        >
          {dayAppointments.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={theme.border} />
              <MedText variant="h2" style={{ color: theme.muted, marginTop: 12, fontSize: 16 }}>No Appointments</MedText>
              <MedText variant="body" style={{ color: theme.muted + "AA", marginTop: 4, fontSize: 13 }}>Swipe left/right to browse other days</MedText>
            </View>
          ) : (
            dayAppointments.map((apt: any, i: number) => {
              const aptDate = new Date(apt.dateTime);
              const statusColor = getStatusColor(apt.status);
              return (
                <Animated.View key={apt.id} entering={SlideInRight.duration(250).delay(i * 60)}>
                  <Pressable onPress={() => setSelectedApt(apt)}>
                    <MedCard style={[styles.aptCard, { borderLeftColor: statusColor.border, borderLeftWidth: 4 }]}>
                      <View style={styles.aptRow}>
                        <View style={styles.aptTime}>
                          <MedText variant="h2" style={{ fontSize: 16, color: statusColor.text, fontWeight: "700" }}>
                            {fmtTime(aptDate)}
                          </MedText>
                        </View>
                        <View style={styles.aptInfo}>
                          <MedText variant="h2" style={{ fontSize: 15, fontWeight: "600" }}>
                            {apt.patient?.patientProfile?.fullName || "Patient"}
                          </MedText>
                          {apt.reason && (
                            <MedText variant="body" style={{ color: theme.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                              {apt.reason}
                            </MedText>
                          )}
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                          <MedText variant="metadata" style={{ color: statusColor.text, fontWeight: "800", fontSize: 10, textTransform: "uppercase" }}>
                            {apt.status}
                          </MedText>
                        </View>
                      </View>
                    </MedCard>
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Compact Appointment Detail Dropdown */}
      <Modal visible={selectedApt !== null} transparent animationType="slide" onRequestClose={() => setSelectedApt(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdropClose} onPress={() => setSelectedApt(null)} />
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.eventModal, { backgroundColor: theme.surface }]}>
            {selectedApt && (() => {
              const apt = selectedApt;
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
                  <Pressable onPress={() => setSelectedApt(null)} style={styles.dropdownClose}>
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
                    <Ionicons name="calendar-outline" size={16} color={statusColor.text} />
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
                        <Ionicons name="document-text-outline" size={14} color={statusColor.text} />
                        <MedText style={{ fontSize: 11, color: statusColor.text, fontWeight: "600" }}>Reason</MedText>
                      </View>
                      <MedText style={{ fontSize: 13, color: theme.text, lineHeight: 18 }}>{apt.reason}</MedText>
                    </View>
                  )}

                  {/* Referral attachments */}
                  {apt.attachments && apt.attachments.length > 0 && (
                    <View style={[styles.dropdownReasonBox, { backgroundColor: theme.background, marginTop: 10 }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <Ionicons name="document-attach" size={14} color={statusColor.text} />
                        <MedText style={{ fontSize: 11, color: statusColor.text, fontWeight: "600" }}>
                          Referral ({apt.attachments.length})
                        </MedText>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {apt.attachments.map((url: string, i: number) => (
                          <Pressable key={i} onPress={() => Linking.openURL(url)}>
                            <Image
                              source={{ uri: url }}
                              style={{ width: 72, height: 72, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
                            />
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Actions */}
                  <View style={{ marginTop: 14, gap: 10 }}>
                    {apt.status === "pending" && (
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity onPress={() => { setSelectedApt(null); handleAccept(apt.id); }}
                          style={{ flex: 1, backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 10, alignItems: "center" }}>
                          <MedText style={{ fontSize: 15, fontWeight: "600", color: colorScheme === "dark" ? "#101828" : "#FFF" }}>Accept</MedText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setSelectedApt(null); openDeclineModal(apt.id); }}
                          style={{ flex: 1, borderWidth: 1.5, borderColor: "#B91C1C", borderRadius: 10, paddingVertical: 14, alignItems: "center" }}>
                          <MedText style={{ fontSize: 15, fontWeight: "600", color: "#B91C1C" }}>Decline</MedText>
                        </TouchableOpacity>
                      </View>
                    )}
                    {apt.status === "accepted" && (
                      <TouchableOpacity onPress={() => { setSelectedApt(null); handleComplete(apt.id); }}
                        style={{ backgroundColor: theme.success, paddingVertical: 14, borderRadius: 10, alignItems: "center" }}>
                        <MedText style={{ fontSize: 15, fontWeight: "600", color: colorScheme === "dark" ? "#101828" : "#FFF" }}>Complete</MedText>
                      </TouchableOpacity>
                    )}
                    {apt.status === "completed" && (
                      <TouchableOpacity
                        disabled={hasFollowUp}
                        onPress={() => {
                          if (hasFollowUp) return;
                          setSelectedApt(null);
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

      {/* Decline reason modal */}
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

      {/* Follow-up modal */}
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
    </SafeAreaView>
  );
}

const CELL_SIZE = (SCREEN_WIDTH - 24) / 7;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingBottom: 10 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  todayBtn: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  weekStrip: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 4, paddingVertical: 10 },
  weekDay: { alignItems: "center", gap: 4, width: 44, borderRadius: 12, paddingVertical: 6 },
  weekDateCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  dotIndicator: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  badgeIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", position: "absolute", top: 4, right: 4 },
  dateLabel: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  list: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  aptCard: { marginBottom: 12, padding: 16, borderRadius: 12 },
  aptRow: { flexDirection: "row", alignItems: "center" },
  aptTime: { width: 88, alignItems: "center", marginRight: 12, flexShrink: 0 },
  aptInfo: { flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  
  // Redesigned Detail Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBackdropClose: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  eventModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 12 },
  modalContent: { padding: 24, paddingBottom: 32 },
  modalAccentBar: { width: 60, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  closeIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" },
  
  // Profile Section
  profileCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, marginBottom: 18 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "800" },
  profileDetails: { flex: 1, marginLeft: 14 },
  patientName: { fontSize: 17, fontWeight: "700" },
  phoneRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  patientPhone: { fontSize: 13, color: "#6B7280" },
  statusBadgeLarge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  
  // Grid layout
  detailsGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  detailGridCell: { flex: 1, flexDirection: "row", padding: 12, backgroundColor: "rgba(0,0,0,0.02)", borderRadius: 12, alignItems: "center", gap: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  cellIconWrapper: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.03)", alignItems: "center", justifyContent: "center" },
  cellContent: { flex: 1 },
  cellLabel: { fontSize: 10, color: "#6B7280", fontWeight: "700" },
  cellValue: { fontSize: 13, color: "#1F2937", fontWeight: "600", marginTop: 1 },
  cellSubValue: { fontSize: 10, color: "#9CA3AF" },
  
  // Reason Text Block
  reasonContainer: { padding: 14, borderRadius: 14, marginBottom: 20 },
  reasonHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  reasonTitle: { fontSize: 11, color: "#6B7280", fontWeight: "700" },
  reasonText: { fontSize: 13, lineHeight: 18, color: "#374151" },
  
  // Actions
  actionsContainer: { marginTop: 10, alignItems: "center" },
  modalActionBtn: { flex: 1, flexDirection: "row", height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  modalActionBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  modalActionBtnOutline: { flex: 1, flexDirection: "row", height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center", gap: 8 },
  modalActionBtnTextOutline: { fontSize: 14, fontWeight: "700" },
  bottomCloseLabel: { alignSelf: "center", marginTop: 16, padding: 8 },
  
  declineModal: { padding: 24 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 16, height: 80, textAlignVertical: "top" },

  // Dropdown detail styles
  dropdownContent: { padding: 20, paddingBottom: 28 },
  dropdownHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  dropdownClose: { position: "absolute", top: 6, right: 16, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", zIndex: 10 },
  dropdownPatientRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  dropdownAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  dropdownBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dropdownInfoRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 8 },
  dropdownReasonBox: { padding: 12, borderRadius: 10, marginBottom: 4 },
});
