import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeInDown,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  Layout,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LanguagePicker } from "../../components/LanguagePicker";
import { MedButton } from "../../components/medconnect/MedButton";
import { MedText } from "../../components/medconnect/MedText";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { AppDispatch, RootState } from "../../store";
import { clearError, requestOtp, resetOtpStatus, verifyOtp } from "../../store/slices/authSlice";
import { SPRING_CONFIG, FadeInDownSpring } from "../../hooks/useAnimations";
import { phoneNationalAutofill, smsOtpAutofill } from "../../utils/autofill";
import { ethiopianPhoneDigits } from "../../utils/phone";
import { OnboardingPager } from "../../components/OnboardingPager";
import { storage } from "../../utils/storage";

type AuthStep = "phone" | "role" | "otp";

function useFieldShake() {
  const translateX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const shake = () => {
    translateX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };
  return { shakeStyle, shake };
}

function useDigitPop() {
  const s0 = useSharedValue(1);
  const s1 = useSharedValue(1);
  const s2 = useSharedValue(1);
  const s3 = useSharedValue(1);
  const s4 = useSharedValue(1);
  const s5 = useSharedValue(1);
  const scales = [s0, s1, s2, s3, s4, s5];

  const style0 = useAnimatedStyle(() => ({ transform: [{ scale: s0.value }] }));
  const style1 = useAnimatedStyle(() => ({ transform: [{ scale: s1.value }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ scale: s2.value }] }));
  const style3 = useAnimatedStyle(() => ({ transform: [{ scale: s3.value }] }));
  const style4 = useAnimatedStyle(() => ({ transform: [{ scale: s4.value }] }));
  const style5 = useAnimatedStyle(() => ({ transform: [{ scale: s5.value }] }));
  const popStyles = [style0, style1, style2, style3, style4, style5];

  const pop = (index: number) => {
    const sv = scales[index];
    if (sv) {
      sv.value = withSequence(
        withSpring(0.85, { mass: 0.5, stiffness: 300, damping: 10 }),
        withSpring(1, SPRING_CONFIG)
      );
    }
  };

  const getPopStyle = (index: number) => popStyles[index];

  return { pop, getPopStyle };
}

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const { loading, error, otpSent, user } = useSelector(
    (state: RootState) => state.auth
  );

  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [step, setStep] = useState<AuthStep>("phone");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"patient" | "doctor" | null>(null);
  const [otpText, setOtpText] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [errorKey, setErrorKey] = useState(0);
  const [mockCode, setMockCode] = useState("");
  const hiddenOtpInput = useRef<TextInput>(null);

  useEffect(() => {
    storage.getItem("onboarding-seen").then((val) => {
      setShowOnboarding(val !== "true");
    });
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    storage.setItem("onboarding-seen", "true");
    setShowOnboarding(false);
  }, []);

  const { shakeStyle: phoneShakeStyle, shake: shakePhone } = useFieldShake();
  const { shakeStyle: otpShakeStyle, shake: shakeOtp } = useFieldShake();
  const { pop: popDigit, getPopStyle } = useDigitPop();

  const containerScale = useSharedValue(1);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    if (otpSent && (step === "phone" || step === "role")) {
      setStep("otp");
    }
  }, [otpSent]);

  useEffect(() => {
    if (step === "otp") {
      const timer = setTimeout(() => hiddenOtpInput.current?.focus(), 400);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (error) setErrorKey(prev => prev + 1);
  }, [error]);

  useEffect(() => {
    if (user) {
      containerScale.value = withTiming(0.95, { duration: 200 });
      containerOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [user]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
    opacity: containerOpacity.value,
  }));

  const handleOtpChangeText = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    setOtpText(cleanText);
    if (error) dispatch(clearError());
    if (cleanText.length > 0) {
      popDigit(Math.min(cleanText.length - 1, 5));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (cleanText.length === 6) {
      dispatch(clearError());
      dispatch(
        verifyOtp({
          phone: `+251${phone}`,
          code: cleanText,
          role: role || undefined,
          isRegistration: authMode === 'signup',
        })
      );
    }
  };

  const isPhoneValid = /^[79]\d{8}$/.test(phone);

  const handleRequestOtp = async () => {
    if (!isPhoneValid) {
      shakePhone();
      setErrorKey(prev => prev + 1);
      return;
    }
    if (authMode === 'signup') {
      dispatch(clearError());
      setStep("role");
      return;
    }
    dispatch(clearError());
    const result = await dispatch(
      requestOtp({ phone: `+251${phone}`, isRegistration: false })
    );
    if (requestOtp.rejected.match(result)) {
      const errorPayload = result.payload as string;
      if (errorPayload === 'errorRoleRequired') {
        setAuthMode("signup");
        setStep("role");
      } else {
        shakePhone();
      }
    } else {
      const code = (result.payload as any)?.data?.mockCode || (phone === '912345678' ? '123456' : '');
      if (code) {
        setMockCode(code);
        setOtpText(code);
      }
    }
  };

  const handleRegisterWithRole = async () => {
    if (!role || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await dispatch(requestOtp({ phone: `+251${phone}`, role, isRegistration: true }));
    if (requestOtp.fulfilled.match(result)) {
      const code = (result.payload as any)?.data?.mockCode || (phone === '912345678' ? '123456' : '');
      if (code) {
        setMockCode(code);
        setOtpText(code);
      }
    }
  };

  const handleVerifyOtp = () => {
    dispatch(clearError());
    if (otpText.length < 6) {
      shakeOtp();
      return;
    }
    dispatch(
      verifyOtp({
        phone: `+251${phone}`,
        code: otpText,
        role: role || undefined,
        isRegistration: authMode === 'signup',
      })
    );
  };

  const handleRoleSelect = (selectedRole: "patient" | "doctor") => {
    setRole(selectedRole);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const ErrorText = ({ message }: { message: string }) => (
    <Animated.View
      key={errorKey}
      entering={FadeInDown.duration(250).springify()}
      style={{ alignItems: "center" }}
    >
      <MedText style={styles.errorText}>{t(message)}</MedText>
    </Animated.View>
  );

  const renderPhoneStep = () => (
    <Animated.View
      entering={FadeIn.duration(300).springify()}
      exiting={SlideOutLeft.duration(200)}
      style={styles.stepContainer}
    >
      <View style={styles.modeToggle}>
        <Pressable
          style={[styles.modeBtn, authMode === "login" && { backgroundColor: theme.primary }]}
          onPress={() => { if (authMode !== "login") { setAuthMode("login"); dispatch(clearError()); } }}
          disabled={loading}
        >
          <MedText variant="body" style={[styles.modeBtnText, { color: authMode === "login" ? "#FFF" : theme.textSecondary }]}>
            {t("loginTab")}
          </MedText>
        </Pressable>
        <Pressable
          style={[styles.modeBtn, authMode === "signup" && { backgroundColor: theme.primary }]}
          onPress={() => { if (authMode !== "signup") { setAuthMode("signup"); dispatch(clearError()); } }}
          disabled={loading}
        >
          <MedText variant="body" style={[styles.modeBtnText, { color: authMode === "signup" ? "#FFF" : theme.textSecondary }]}>
            {t("signupTab")}
          </MedText>
        </Pressable>
      </View>

      <MedText variant="h1" style={styles.heading}>{t("login")}</MedText>
      <MedText variant="body" style={[styles.subtitle, { color: theme.muted }]}>
        {authMode === "signup" ? t("signupTabSubtitle") : t("loginTabSubtitle")}
      </MedText>

      <Animated.View style={phoneShakeStyle}>
        <View
          style={[
            styles.phoneInputContainer,
            {
              backgroundColor: theme.surface,
              borderColor: error && error !== 'errorRoleRequired' ? "#D92D20" : theme.border,
            },
          ]}
        >
          <View style={[styles.countryCode, { borderColor: theme.border }]}>
            <MedText variant="body" style={{ fontWeight: "700" }}>+251</MedText>
          </View>
          <TextInput
            style={[styles.phoneInput, { color: theme.text }]}
            placeholder="912 345 678"
            placeholderTextColor={theme.muted}
            value={phone}
            onChangeText={(v) => {
              const digits = ethiopianPhoneDigits(v);
              setPhone(digits);
              if (error) dispatch(clearError());
            }}
            keyboardType="phone-pad"
            maxLength={9}
            autoCorrect={false}
            {...phoneNationalAutofill}
          />
        </View>
      </Animated.View>

      {error && error !== 'errorRoleRequired' && <ErrorText message={error} />}

      <MedButton
        title={t("continue")}
        onPress={handleRequestOtp}
        disabled={!isPhoneValid}
        loading={loading}
      />
    </Animated.View>
  );

  const renderRoleStep = () => (
    <Animated.View
      entering={SlideInRight.duration(300).springify()}
      exiting={SlideOutLeft.duration(200)}
      style={styles.stepContainer}
    >
      <MedText variant="h1" style={styles.heading}>{t("register")}</MedText>
      <MedText variant="body" style={[styles.subtitle, { color: theme.muted }]}>
        {t("selectRole")}
      </MedText>

      <View style={styles.roleGrid}>
        <Pressable
          onPress={() => handleRoleSelect("patient")}
          style={[styles.roleCard, { borderColor: theme.border, backgroundColor: theme.surface }, role === "patient" && { borderColor: theme.primary }]}
        >
          <Ionicons name="person-outline" size={28} color={role === "patient" ? theme.primary : theme.muted} />
          <MedText variant="h2" style={styles.roleTitle}>{t("patientRole")}</MedText>
          <MedText variant="metadata">{t("patientDesc")}</MedText>
        </Pressable>
        <Pressable
          onPress={() => handleRoleSelect("doctor")}
          style={[styles.roleCard, { borderColor: theme.border, backgroundColor: theme.surface }, role === "doctor" && { borderColor: theme.primary }]}
        >
          <Ionicons name="medkit-outline" size={28} color={role === "doctor" ? theme.primary : theme.muted} />
          <MedText variant="h2" style={styles.roleTitle}>{t("doctorRole")}</MedText>
          <MedText variant="metadata">{t("doctorDesc")}</MedText>
        </Pressable>
      </View>

      {error && <ErrorText message={error} />}

      <MedButton
        title={t("continue")}
        onPress={handleRegisterWithRole}
        disabled={!role}
        loading={loading}
      />

      <Pressable style={styles.linkButton} onPress={() => { setStep("phone"); setRole(null); setAuthMode("login"); dispatch(clearError()); }}>
        <MedText variant="metadata" color={theme.primary}>{t("switchToLogin")}</MedText>
      </Pressable>
    </Animated.View>
  );

  const renderOtpStep = () => {
    const digits = otpText.split("");
    const boxes = Array.from({ length: 6 }, (_, i) => digits[i] || "");

    return (
      <Animated.View
        entering={SlideInRight.duration(300).springify()}
        exiting={FadeOut.duration(200)}
        style={styles.stepContainer}
      >
        <MedText variant="h1" style={styles.heading}>{t("otp")}</MedText>
        <MedText variant="body" style={[styles.subtitle, { color: theme.muted }]}>
          {t("otpSubtitle")}
        </MedText>

        {mockCode ? (
          <View style={styles.mockCodeBanner}>
            <MedText style={styles.mockCodeText}>
              Dev OTP: {mockCode}
            </MedText>
          </View>
        ) : null}

        <Animated.View style={otpShakeStyle}>
          <Pressable
            onPress={() => hiddenOtpInput.current?.focus()}
            style={styles.otpContainer}
          >
            {boxes.map((digit, index) => {
              const DigitAnimated = Animated.View;
              const isFocused = isInputFocused && (otpText.length === index || (otpText.length === 6 && index === 5));
              return (
                <DigitAnimated key={index} style={getPopStyle(index)}>
                  <View
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor: theme.surface,
                        borderColor: error ? "#D92D20" : isFocused ? theme.primary : digit ? theme.primary : theme.border,
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <MedText
                      variant="h2"
                      style={{
                        fontSize: 24,
                        fontWeight: "700",
                        color: theme.text,
                      }}
                    >
                      {digit}
                    </MedText>
                  </View>
                </DigitAnimated>
              );
            })}
            <TextInput
              ref={hiddenOtpInput}
              style={styles.hiddenTextInput}
              maxLength={6}
              keyboardType="number-pad"
              value={otpText}
              onChangeText={handleOtpChangeText}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              caretHidden
              autoCorrect={false}
              {...smsOtpAutofill}
            />
          </Pressable>
        </Animated.View>

        {error && <ErrorText message={error} />}

        <MedButton
          title={t("continue")}
          onPress={handleVerifyOtp}
          disabled={otpText.length < 6}
          loading={loading}
        />

        <Pressable
          style={styles.linkButton}
          onPress={() => {
            dispatch(resetOtpStatus());
            setOtpText("");
            setStep("phone");
          }}
        >
          <MedText variant="metadata" color={theme.primary}>{t("changePhone")}</MedText>
        </Pressable>
      </Animated.View>
    );
  };

  if (showOnboarding === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <Animated.View entering={FadeIn.duration(300)}>
          <Animated.Image
            source={require("../../assets/images/bm-booking-logo.png")}
            resizeMode="contain"
            style={{ width: 80, height: 80, opacity: 0.6 }}
          />
        </Animated.View>
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingPager onComplete={handleOnboardingComplete} />;
  }

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: theme.background }, containerAnimatedStyle]}>
      <SafeAreaView style={[{ flex: 1, backgroundColor: theme.background }]}>
        <View style={styles.topHeader}>
          <LanguagePicker />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === "phone"
              ? renderPhoneStep()
              : step === "role"
                ? renderRoleStep()
                : renderOtpStep()}
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <MedText variant="metadata" style={{ color: theme.muted, textAlign: 'center' }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </MedText>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topHeader: { paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' },
  scrollContent: { padding: 24, flexGrow: 1, justifyContent: "flex-start" },
  stepContainer: { width: "100%", marginTop: 20 },
  modeToggle: { flexDirection: "row", marginBottom: 24, borderRadius: 12, padding: 4, backgroundColor: "rgba(148,163,184,0.15)" },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  modeBtnText: { fontSize: 15, fontWeight: "600" },
  heading: { marginBottom: 8 },
  subtitle: { marginBottom: 32 },
  mockCodeBanner: { backgroundColor: "#FFF4E5", borderColor: "#F59E0B", borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 20, alignItems: "center" },
  mockCodeText: { color: "#B45309", fontSize: 14, fontWeight: "600" },
  phoneInputContainer: { flexDirection: "row", height: 60, borderRadius: 12, borderWidth: 1.5, overflow: "hidden", alignItems: "center", marginBottom: 24 },
  countryCode: { paddingHorizontal: 18, borderRightWidth: 1, height: "100%", justifyContent: "center" },
  phoneInput: { flex: 1, fontSize: 18, fontWeight: "600", paddingHorizontal: 16, letterSpacing: 0.3 },
  roleGrid: { gap: 16, marginBottom: 32 },
  roleCard: { padding: 20, borderRadius: 16, borderWidth: 2 },
  roleTitle: { marginTop: 12, marginBottom: 4 },
  otpContainer: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 24, position: "relative" },
  otpBox: { width: 48, height: 60, borderRadius: 12, borderWidth: 2 },
  hiddenTextInput: { position: "absolute", width: "100%", height: "100%", opacity: 0 },
  errorText: { color: "#D92D20", fontSize: 14, fontWeight: "600", marginTop: 8, marginBottom: 16, textAlign: 'center' },
  linkButton: { marginTop: 24, alignItems: "center" },
  footer: { paddingHorizontal: 40, paddingBottom: 24, alignItems: "center" },
});
