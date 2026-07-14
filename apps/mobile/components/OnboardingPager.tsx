import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeOut,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
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
import { SPRING_CONFIG } from "../hooks/useAnimations";
import { LanguagePicker } from "./LanguagePicker";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

interface OnboardingPagerProps {
  onComplete: () => void;
}

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OnboardingPager({ onComplete }: OnboardingPagerProps) {
  const [step, setStep] = useState(0);
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { t } = useTranslation();

  const logoScale = useSharedValue(0);
  const logoY = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const bgShift = useSharedValue(0);
  const contentX = useSharedValue(width);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12, stiffness: 80 });
  }, []);

  useEffect(() => {
    if (step === 0) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );
      logoRotate.value = withRepeat(
        withTiming(360, { duration: 20000 }),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      logoRotate.value = withTiming(0, { duration: 300 });
    }
  }, [step]);

  useEffect(() => {
    const targetScale = step === 0 ? 1 : 0.65;
    const targetY = step === 0 ? 0 : -height * 0.18;
    logoScale.value = withSpring(targetScale, { damping: 14, stiffness: 80 });
    logoY.value = withSpring(targetY, { damping: 14, stiffness: 80 });
    progressWidth.value = withSpring(((step + 1) / 3) * (width - 48), {
      damping: 18,
      stiffness: 100,
    });
    bgShift.value = withTiming(step * 0.03, { duration: 800 });
  }, [step]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value * pulseScale.value },
      { translateY: logoY.value },
    ],
  }));

  const goNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => Math.min(s + 1, 2));
  }, []);

  const goPrev = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

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

  const dynamicBg = {
    backgroundColor:
      step === 2
        ? theme.success + "06"
        : step === 1
          ? theme.primary + "03"
          : theme.background,
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, dynamicBg]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.topBar}>
            {step < 2 ? (
              <Pressable onPress={handleSkip} style={styles.skipBtn}>
                <MedText variant="body" style={{ color: theme.muted, fontWeight: "500" }}>
                  {t("onboardingSkip")}
                </MedText>
              </Pressable>
            ) : (
              <View style={styles.skipBtn} />
            )}
            <LanguagePicker />
          </View>

          <View style={styles.logoArea}>
            <Animated.Image
              source={require("../assets/images/bm-booking-logo.png")}
              resizeMode="contain"
              style={[styles.logo, logoAnimatedStyle]}
            />
          </View>

          <View style={styles.contentArea}>
            {step === 0 && (
              <Animated.View
                key="step0"
                entering={FadeInUp.duration(600).delay(400)}
                exiting={FadeOut.duration(200)}
                style={styles.stepContent}
              >
                <MedText variant="h1" style={[styles.heroTitle, { color: theme.text }]}>
                  {t("onboardingStep1Title")}
                </MedText>

                <Animated.View entering={FadeInUp.duration(500).delay(600)}>
                  <MedText
                    variant="body"
                    style={[styles.heroDesc, { color: theme.textSecondary }]}
                  >
                    {t("onboardingStep1Desc")}
                  </MedText>
                </Animated.View>

                <View style={styles.miniCardsRow}>
                  <MiniFeature
                    icon="search-outline"
                    text={t("findDoctors")}
                    color={theme.success}
                    delay={800}
                  />
                  <MiniFeature
                    icon="calendar-outline"
                    text={t("bookAppointment")}
                    color="#3E5C76"
                    delay={1000}
                  />
                  <MiniFeature
                    icon="star-outline"
                    text={t("reviews")}
                    color="#F59E0B"
                    delay={1200}
                  />
                </View>
              </Animated.View>
            )}

            {step === 1 && (
              <Animated.View
                key="step1"
                entering={FadeInUp.duration(600).delay(100)}
                exiting={FadeOut.duration(200)}
                style={styles.stepContent}
              >
                <MedText variant="h1" style={[styles.heroTitle, { color: theme.text, fontSize: 28 }]}>
                  {t("onboardingStep2Title")}
                </MedText>

                <MedText
                  variant="body"
                  style={[styles.heroDesc, { color: theme.textSecondary, marginBottom: 24 }]}
                >
                  {t("onboardingFeatureDesc")}
                </MedText>

                <View style={styles.featureCardsArea}>
                  <GlassFeatureCard
                    icon="medkit-outline"
                    title={t("onboardingDoctors")}
                    desc={t("onboardingDoctorsDesc")}
                    delay={200}
                    accentColor="#0F4C81"
                  />
                  <GlassFeatureCard
                    icon="scan-outline"
                    title={t("onboardingEquipment")}
                    desc={t("onboardingEquipmentDesc")}
                    delay={450}
                    accentColor="#0F4C81"
                  />
                  <GlassFeatureCard
                    icon="wallet-outline"
                    title={t("onboardingTelebirr")}
                    desc={t("onboardingTelebirrDesc")}
                    delay={700}
                    accentColor="#0F4C81"
                  />
                </View>
              </Animated.View>
            )}

            {step === 2 && (
              <Animated.View
                key="step2"
                entering={FadeInUp.duration(600).delay(100)}
                exiting={FadeOut.duration(200)}
                style={styles.stepContent}
              >
                <MedText variant="h1" style={[styles.heroTitle, { color: theme.text }]}>
                  {t("onboardingStep3Title")}
                </MedText>
                <MedText
                  variant="body"
                  style={[styles.heroDesc, { color: theme.textSecondary }]}
                >
                  {t("onboardingStep3Desc")}
                </MedText>

                <View style={styles.calendarContainer}>
                  <View
                    style={[
                      styles.calendarCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.calendarIconRow}>
                      <Ionicons name="globe-outline" size={16} color={theme.muted} />
                      <MedText variant="metadata" style={{ color: theme.muted }}>
                        Gregorian
                      </MedText>
                    </View>
                    <MedText variant="h2" style={{ color: theme.text, marginVertical: 6 }}>
                      Jul 9, 2025
                    </MedText>
                    <MedText variant="body" style={{ color: theme.textSecondary }}>
                      3:30 PM
                    </MedText>
                  </View>

                  <Animated.View
                    entering={ZoomIn.duration(500).delay(400)}
                    style={[
                      styles.calendarDivider,
                      { backgroundColor: theme.success + "15" },
                    ]}
                  >
                    <Ionicons name="swap-horizontal" size={20} color={theme.success} />
                  </Animated.View>

                  <View
                    style={[
                      styles.calendarCard,
                      {
                        backgroundColor: theme.success + "08",
                        borderColor: theme.success + "40",
                      },
                    ]}
                  >
                    <View style={styles.calendarIconRow}>
                      <Ionicons name="location-outline" size={16} color={theme.success} />
                      <MedText variant="metadata" style={{ color: theme.success }}>
                        {t("onboardingCalendarTitle")}
                      </MedText>
                    </View>
                    <MedText variant="h2" style={{ color: theme.text, marginVertical: 6 }}>
                      ሰኔ 9, 2017
                    </MedText>
                    <MedText variant="body" style={{ color: theme.textSecondary }}>
                      3:30 ሌሊት
                    </MedText>
                  </View>
                </View>

                <Animated.View
                  entering={FadeInUp.duration(400).delay(600)}
                  style={[
                    styles.trustBadge,
                    { backgroundColor: theme.success + "10", borderColor: theme.success + "30" },
                  ]}
                >
                  <Ionicons name="shield-checkmark-outline" size={18} color={theme.success} />
                  <MedText variant="metadata" style={{ color: theme.success, marginLeft: 6 }}>
                    Trusted by 10,000+ Ethiopian users
                  </MedText>
                </Animated.View>
              </Animated.View>
            )}
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { width: progressWidth, backgroundColor: "#0F4C81" },
                ]}
              />
            </View>

            <View style={styles.buttonRow}>
              {step > 0 && (
                <Animated.View entering={FadeIn.duration(200)}>
                  <Pressable onPress={goPrev} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={theme.muted} />
                  </Pressable>
                </Animated.View>
              )}
              <View style={{ flex: 1 }}>
                {step < 2 ? (
                  <MedButton
                    title={t("onboardingNext")}
                    onPress={goNext}
                    type="primary"
                    icon={
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#FFF"
                      />
                    }
                  />
                ) : (
                  <MedButton
                    title={t("onboardingGetStarted")}
                    onPress={handleGetStarted}
                    type="primary"
                    icon={
                      <Ionicons
                        name="rocket-outline"
                        size={18}
                        color="#FFF"
                      />
                    }
                  />
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </GestureDetector>
  );
}

function MiniFeature({
  icon,
  text,
  color,
  delay,
}: {
  icon: string;
  text: string;
  color: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(delay)}
      style={styles.miniFeature}
    >
      <View style={[styles.miniIconWrap, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <MedText variant="metadata" style={{ color, marginTop: 4, textAlign: "center" }}>
        {text}
      </MedText>
    </Animated.View>
  );
}

function GlassFeatureCard({
  icon,
  title,
  desc,
  delay,
  accentColor,
}: {
  icon: string;
  title: string;
  desc: string;
  delay: number;
  accentColor: string;
}) {
  const pressScale = useSharedValue(1);
  const pressBg = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const bgAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(255,255,255,${0.4 + pressBg.value * 0.55})`,
  }));

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    pressBg.value = withTiming(1, { duration: 150 });
  }, []);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    pressBg.value = withTiming(0, { duration: 200 });
  }, []);

  return (
    <Animated.View
      entering={SlideInRight.duration(500).delay(delay)}
      style={styles.featureCard}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.glassCard, animatedStyle]}
      >
        <Animated.View style={[styles.glassCardInner, bgAnimatedStyle]}>
          <View style={styles.glassCardIconWrap}>
            <Ionicons name={icon as any} size={24} color={accentColor} />
          </View>
          <View style={styles.glassCardContent}>
            <MedText variant="h2" style={{ color: "#0A2540", fontWeight: "600", fontSize: 16 }}>
              {title}
            </MedText>
            <MedText variant="metadata" style={{ color: "#64748B", marginTop: 2, lineHeight: 17, fontSize: 13 }}>
              {desc}
            </MedText>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginRight: 4 }} />
        </Animated.View>
      </AnimatedPressable>
    </Animated.View>
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
  logoArea: {
    alignItems: "center",
    justifyContent: "center",
    height: 180,
    marginTop: 10,
  },
  logo: {
    width: 130,
    height: 130,
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
  miniCardsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 8,
  },
  miniFeature: {
    alignItems: "center",
    width: 80,
  },
  miniIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  featureCardsArea: {
    width: "100%",
    gap: 12,
    marginTop: 4,
  },
  featureCard: {
    width: "100%",
  },
  glassCard: {
    borderRadius: 18,
  },
  glassCardInner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(228,231,236,0.7)",
  },
  glassCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(15,76,129,0.08)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  glassCardContent: {
    flex: 1,
  },
  calendarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  calendarCard: {
    width: (width - 110) / 2,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
  },
  calendarIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  calendarDivider: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(0,0,0,0.06)",
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
    borderColor: "rgba(0,0,0,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
});
