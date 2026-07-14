import React, { useState, useCallback } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInUp,
  FadeOut,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { MedText } from "./medconnect/MedText";
import { MedButton } from "./medconnect/MedButton";
import { Colors } from "../constants/theme";
import { useColorScheme } from "../hooks/use-color-scheme";
import { useTranslation } from "react-i18next";
import { LanguagePicker } from "./LanguagePicker";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface OnboardingPagerProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

export function OnboardingPager({ onComplete }: OnboardingPagerProps) {
  const [step, setStep] = useState(0);
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { t } = useTranslation();

  const progressWidth = useSharedValue(0);

  const updateProgress = useCallback(
    (s: number) => {
      progressWidth.value = withSpring(((s + 1) / TOTAL_STEPS) * (width - 48), {
        damping: 18,
        stiffness: 100,
      });
    },
    [progressWidth]
  );

  const goNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => {
      const next = Math.min(s + 1, TOTAL_STEPS - 1);
      updateProgress(next);
      return next;
    });
  }, [updateProgress]);

  const goPrev = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => {
      const prev = Math.max(s - 1, 0);
      updateProgress(prev);
      return prev;
    });
  }, [updateProgress]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete();
  }, [onComplete]);

  const handleGetStarted = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onComplete();
  }, [onComplete]);

  const panGesture = Gesture.Pan()
    .onEnd((e) => {
      if (e.translationX < -50) {
        runOnJS(goNext)();
      } else if (e.translationX > 50) {
        runOnJS(goPrev)();
      }
    });

  const isLast = step === TOTAL_STEPS - 1;

  const slides = [
    {
      titleKey: "onboardingStep1Title",
      descKey: "onboardingStep1Desc",
      listKeys: null as null,
    },
    {
      titleKey: "onboardingStep2Title",
      descKey: null,
      listKeys: [
        "onboardingList1",
        "onboardingList2",
        "onboardingList3",
        "onboardingList4",
        "onboardingList5",
        "onboardingList6",
      ],
    },
    {
      titleKey: "onboardingStep3Title",
      descKey: null,
      listKeys: [
        "onboardingList7",
        "onboardingList8",
        "onboardingList9",
        "onboardingList10",
        "onboardingList11",
      ],
    },
    {
      titleKey: "onboardingStep4Title",
      descKey: null,
      listKeys: [
        "onboardingList12",
        "onboardingList13",
        "onboardingList14",
        "onboardingList15",
      ],
    },
  ];

  const currentSlide = slides[step];

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.topBar}>
            {!isLast ? (
              <Pressable onPress={handleSkip} style={styles.skipBtn}>
                <MedText
                  variant="body"
                  style={{ color: theme.muted, fontWeight: "500" }}
                >
                  {t("onboardingSkip")}
                </MedText>
              </Pressable>
            ) : (
              <View style={styles.skipBtn} />
            )}
            <LanguagePicker />
          </View>

          <View style={styles.contentArea}>
            <Animated.View
              key={`slide-${step}`}
              entering={FadeInUp.duration(500).delay(100)}
              exiting={FadeOut.duration(200)}
              style={styles.stepContent}
            >
              <MedText
                variant="h1"
                style={[styles.heroTitle, { color: theme.text }]}
              >
                {t(currentSlide.titleKey)}
              </MedText>

              {currentSlide.descKey && (
                <MedText
                  variant="body"
                  style={[styles.heroDesc, { color: theme.textSecondary }]}
                >
                  {t(currentSlide.descKey)}
                </MedText>
              )}

              {currentSlide.listKeys && (
                <View style={styles.listContainer}>
                  {currentSlide.listKeys.map((key, i) => (
                    <Animated.View
                      key={key}
                      entering={FadeInUp.duration(400).delay(200 + i * 80)}
                      style={[
                        styles.listItem,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.listDot,
                          { backgroundColor: theme.secondary },
                        ]}
                      />
                      <MedText
                        variant="body"
                        style={[
                          styles.listText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {t(key)}
                      </MedText>
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>
          </View>

          <View style={styles.bottomSection}>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: theme.border + "60" },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressBar,
                  { width: progressWidth, backgroundColor: theme.secondary },
                ]}
              />
            </View>

            <View style={styles.buttonRow}>
              {step > 0 && (
                <Animated.View entering={FadeInUp.duration(200)}>
                  <Pressable
                    onPress={goPrev}
                    style={[
                      styles.backBtn,
                      { borderColor: theme.border },
                    ]}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={20}
                      color={theme.muted}
                    />
                  </Pressable>
                </Animated.View>
              )}
              <View style={{ flex: 1 }}>
                {!isLast ? (
                  <MedButton
                    title={t("onboardingNext")}
                    onPress={goNext}
                    type="primary"
                  />
                ) : (
                  <MedButton
                    title={t("onboardingGetStarted")}
                    onPress={handleGetStarted}
                    type="primary"
                  />
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
    alignItems: "center",
  },
  contentArea: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stepContent: {
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroDesc: {
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 4,
    marginBottom: 28,
  },
  listContainer: {
    width: "100%",
    marginTop: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  listDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  listText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 8,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
