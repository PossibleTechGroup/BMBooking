import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeInUp, SlideOutLeft, Layout } from "react-native-reanimated";
import { MedText } from "../medconnect/MedText";
import { MedCard } from "../medconnect/MedCard";
import { MedButton } from "../medconnect/MedButton";
import { useTimeFormat } from "../../utils/timeFormat";
import { ScheduleEntry, formatDisplayTime, formatDateDisplay, getDayColor } from "../../types/schedule";
import { EmptyStatePulse } from "./EmptyStatePulse";

type Props = {
  theme: any;
  schedules: ScheduleEntry[];
  onAdd: () => void;
  onEdit: (entry: ScheduleEntry) => void;
  onRemove: (id: string) => void;
};

export function Step3Schedule({ theme, schedules, onAdd, onEdit, onRemove }: Props) {
  const { t } = useTranslation();
  const { isEthiopian } = useTimeFormat();

  return (
    <View>
      <Animated.View entering={FadeInUp.duration(300)}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
          borderRadius: 12,
          backgroundColor: theme.primary + "08",
          borderWidth: 1,
          borderColor: theme.primary + "30",
          marginBottom: 16,
          gap: 10
        }}>
          <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
          <MedText variant="metadata" style={{ flex: 1, color: theme.primary, fontWeight: "600", lineHeight: 18 }}>
            If you don't want to fill this data, the receptionist can configure it for you later.
          </MedText>
        </View>
      </Animated.View>

      <MedText variant="body" color={theme.muted} style={{ marginBottom: 20 }}>{t("setWorkingHours")}</MedText>

      {schedules.length > 0 ? (
        <View style={{ marginBottom: 20, gap: 10 }}>
          {schedules.map(entry => {
            const dayColor = entry.isRecurring ? getDayColor(entry.day || "Monday") : "#1E5A8A";
            return (
              <Animated.View
                key={entry.id}
                entering={FadeInUp.duration(300).springify()}
                exiting={SlideOutLeft.duration(250)}
                layout={Layout.springify().damping(16)}
              >
                <Pressable onPress={() => onEdit(entry)}>
                  <View style={{
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1.5,
                    borderColor: "#D8E3F0",
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    shadowColor: "#101828",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 2,
                    marginBottom: 0
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                      {/* Left circular badge representing day */}
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: dayColor + "10",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: dayColor + "20"
                      }}>
                        <MedText variant="metadata" style={{ color: dayColor, fontWeight: "800", fontSize: 12 }}>
                          {entry.isRecurring ? (entry.day || "").substring(0, 3).toUpperCase() : "ONCE"}
                        </MedText>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <MedText variant="body" style={{ color: "#101828", fontWeight: "700" }}>
                            {formatDisplayTime(entry.startTime, isEthiopian)} – {formatDisplayTime(entry.endTime, isEthiopian)}
                          </MedText>
                          {!entry.isRecurring && (
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "#1565C0" }}>
                              <MedText variant="metadata" style={{ color: "#FFF", fontSize: 8, fontWeight: "800" }}>ONE-TIME</MedText>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Ionicons name={entry.hospitalId ? "business-outline" : "home-outline"} size={13} color="#5A6B80" />
                          <MedText variant="metadata" style={{ color: "#5A6B80", fontWeight: "500" }}>
                            {entry.hospitalName || "Private Practice"}
                          </MedText>
                        </View>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => onRemove(entry.id)}
                      hitSlop={12}
                      style={{
                        padding: 8,
                        borderRadius: 10,
                        backgroundColor: "#FEF2F2",
                        borderWidth: 1,
                        borderColor: "#FEE2E2",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: "center", paddingVertical: 40 }}>
          <EmptyStatePulse theme={theme} />
          <MedText variant="body" color={theme.muted} style={{ marginTop: 12, textAlign: "center", fontWeight: "600" }}>{t("noScheduleYet")}</MedText>
          <MedText variant="metadata" color={theme.muted} style={{ textAlign: "center", marginTop: 4 }}>Tap the button below to add your first time slot</MedText>
        </Animated.View>
      )}

      <MedButton
        title={t("addSchedule")}
        onPress={onAdd}
        type="outline"
        icon={<Ionicons name="add-circle-outline" size={20} color={theme.primary} />}
      />
    </View>
  );
}
