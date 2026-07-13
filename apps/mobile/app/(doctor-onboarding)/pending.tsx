import React, { useEffect } from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  FadeIn,
  FadeOut,
  SlideOutDown,
  runOnJS,
} from "react-native-reanimated";
import { MedText } from "../../components/medconnect/MedText";
import { MedButton } from "../../components/medconnect/MedButton";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { RootState, AppDispatch } from "../../store";
import { fetchDoctorProfileStatus, logout } from "../../store/slices/authSlice";
import { createOnboardingStyles } from "../../constants/onboardingStyles";
import { SPRING_CONFIG } from "../../hooks/useAnimations";

const APPROVAL_CHECK_DURATION = 2000;

export default function PendingReviewScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const styles = createOnboardingStyles(theme);

  const { loading, doctorProfileStatus } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();

  const [approved, setApproved] = React.useState(false);
  const [showDashboard, setShowDashboard] = React.useState(false);

  const hourglassRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(0);

  const hourglassStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${hourglassRotation.value}deg` }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: containerTranslateY.value }],
  }));

  useEffect(() => {
    hourglassRotation.value = withRepeat(
      withTiming(180, { duration: 3000 }),
      -1,
      true
    );
  }, [hourglassRotation]);

  useEffect(() => {
    if (doctorProfileStatus === "Approved" && !approved) {
      setApproved(true);
    }
  }, [doctorProfileStatus, approved]);

  useEffect(() => {
    if (!approved) return;

    hourglassRotation.value = withTiming(0, { duration: 150 });

    setTimeout(() => {
      checkScale.value = withSpring(1.2, SPRING_CONFIG);
      checkOpacity.value = withTiming(1, { duration: 400 });
      checkScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withSpring(1, SPRING_CONFIG)
      );
    }, 200);

    setTimeout(() => {
      containerTranslateY.value = withTiming(500, { duration: 600 }, (finished) => {
        if (finished) {
          runOnJS(setShowDashboard)(true);
        }
      });
    }, APPROVAL_CHECK_DURATION);
  }, [approved, hourglassRotation, checkScale, checkOpacity, containerTranslateY]);

  useEffect(() => {
    const interval = setInterval(() => {
      pulseScale.value = withSequence(
        withTiming(1.05, { duration: 500 }),
        withTiming(1, { duration: 500 })
      );
    }, 15000);
    return () => clearInterval(interval);
  }, [pulseScale]);

  if (showDashboard) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View />
        <Pressable onPress={() => dispatch(logout())} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#D92D20" />
          <MedText variant="metadata" style={{ color: "#D92D20", marginLeft: 4 }}>{t("logout")}</MedText>
        </Pressable>
      </View>

      <Animated.View style={[styles.pendingContent, containerStyle]}>
        {!approved ? (
          <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(150)}
            style={{ alignItems: "center" }}
          >
            <Animated.View
              style={[
                {
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 32,
                  backgroundColor: "#FAEEDA",
                },
                ringStyle,
              ]}
            >
              <Animated.View style={hourglassStyle}>
                <Ionicons name="time" size={60} color="#B54708" />
              </Animated.View>
            </Animated.View>

            <MedText variant="h1" style={styles.title}>{t("underReview")}</MedText>
            <MedText variant="body" style={[styles.subtitle, { color: theme.muted, textAlign: "center" }]}>
              {t("underReviewSubtitle")}
            </MedText>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
              <MedText variant="metadata" style={{ flex: 1, marginLeft: 12 }}>
                {t("notifyActivation")}
              </MedText>
            </View>

            <MedButton
              title={t("refreshStatus")}
              onPress={() => dispatch(fetchDoctorProfileStatus())}
              loading={loading}
              type="outline"
            />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{ alignItems: "center" }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 32,
                backgroundColor: "#ECFDF3",
              }}
            >
              <Animated.View style={checkStyle}>
                <Ionicons name="checkmark-circle" size={60} color="#027A48" />
              </Animated.View>
            </View>

            <MedText variant="h1" style={[styles.title, { color: "#027A48" }]}>
              Approved!
            </MedText>
            <MedText variant="body" style={[styles.subtitle, { color: theme.muted, textAlign: "center" }]}>
              Your profile has been verified. You're being redirected to your dashboard.
            </MedText>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}
