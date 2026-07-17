import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import Animated, { FadeIn, FadeOutLeft, SlideInRight } from "react-native-reanimated";
import axios from "axios";
import { LanguagePicker } from "../../components/LanguagePicker";
import { MedButton } from "../../components/medconnect/MedButton";
import { MedLoadingOverlay } from "../../components/medconnect/MedLoadingOverlay";
import { MedText } from "../../components/medconnect/MedText";
import { createOnboardingStyles } from "../../constants/onboardingStyles";
import { Colors } from "../../constants/theme";
import { BASE_URL } from "../../constants/api";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { AppDispatch, RootState } from "../../store";
import { clearError, logout, submitDoctorProfile } from "../../store/slices/authSlice";
import { fetchHospitals } from "../../store/slices/hospitalSlice";
import { SPRING_CONFIG } from "../../hooks/useAnimations";
import { ScheduleEntry } from "../../types/schedule";
import { RejectionBanner } from "../../components/doctor-onboarding/RejectionBanner";
import { ErrorSlideBanner } from "../../components/doctor-onboarding/ErrorSlideBanner";
import { Step1Professional } from "../../components/doctor-onboarding/Step1Professional";
import { Step2Media } from "../../components/doctor-onboarding/Step2Media";
import { Step3Schedule } from "../../components/doctor-onboarding/Step3Schedule";
import { SpecializationModal } from "../../components/doctor-onboarding/SpecializationModal";
import { ScheduleModal } from "../../components/doctor-onboarding/ScheduleModal";
import { MediaPickerModal } from "../../components/doctor-onboarding/MediaPickerModal";

import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";

type Step = 1 | 2 | 3;

export default function DoctorSetupScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const styles = createOnboardingStyles(theme);

  const { loading, error, rejectionReason } = useSelector(
    (state: RootState) => state.auth
  );

  const [step, setStep] = useState<Step>(1);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const hasShownFeeAlert = useRef(false);

  const handleBioFocus = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  // Step 1 state
  const [fullName, setFullName] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [specModalVisible, setSpecModalVisible] = useState(false);

  // Step 2 state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [introVideo, setIntroVideo] = useState<string | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
  const [pickingType, setPickingType] = useState<"image" | "video">("image");

  const imageScale = useSharedValue(1);
  const imageOpacity = useSharedValue(0);

  useEffect(() => {
    if (profileImage) {
      imageScale.value = withSequence(withTiming(0.8, { duration: 150 }), withSpring(1, SPRING_CONFIG));
      imageOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [profileImage]);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
    opacity: imageOpacity.value,
  }));

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

  const createTimeDate = (h: number, m: number) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  // Step 3 state
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [schedModalVisible, setSchedModalVisible] = useState(false);
  const [editingSched, setEditingSched] = useState<ScheduleEntry | null>(null);
  const [schedIsRecurring, setSchedIsRecurring] = useState(true);
  const [schedDay, setSchedDay] = useState("Monday");
  const [schedDate, setSchedDate] = useState(new Date());
  const [schedStartTime, setSchedStartTime] = useState(createTimeDate(9, 0));
  const [schedEndTime, setSchedEndTime] = useState(createTimeDate(17, 0));
  const [schedSlotDuration, setSchedSlotDuration] = useState(30);
  const [schedHospitalId, setSchedHospitalId] = useState<number | null>(null);
  const [schedHospitalName, setSchedHospitalName] = useState<string | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [schedErrors, setSchedErrors] = useState<Record<string, string>>({});
  const { hospitals, loading: hospitalsLoading } = useSelector((state: RootState) => state.hospitals);

  useEffect(() => {
    dispatch(fetchHospitals());
  }, [dispatch]);

  useEffect(() => {
    if (schedModalVisible && hospitals.length === 0) {
      dispatch(fetchHospitals());
    }
  }, [schedModalVisible, hospitals.length, dispatch]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!hasShownFeeAlert.current) {
      hasShownFeeAlert.current = true;
      Alert.alert(
        "Appointment Fee",
        "Your consultation fee as a new doctor is set to 50 Birr. You can update this later from your profile.",
        [{ text: "Got it" }]
      );
    }
  }, []);

  // Validation
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = t("valNameRequired");
    if (specializations.length === 0) errors.specializations = t("valSpecRequired");
    
    if (!experience.trim()) {
      errors.experience = t("valExpRequired");
    } else {
      const expNum = Number(experience);
      if (isNaN(expNum) || expNum < 0 || expNum > 60) {
        errors.experience = t("valExpRange") || "Experience must be between 0 and 60 years";
      }
    }

    if (!licenseNumber.trim()) errors.licenseNumber = t("valLicenseRequired");

    if (bio.trim().length < 10) {
      errors.bio = t("valBioShort");
    } else if (bio.trim().length > 1000) {
      errors.bio = t("valBioLong") || "Bio must be less than 1000 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!profileImage) errors.profileImage = t("valPhotoRequired");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation - dismiss keyboard and scroll to top on step change
  const navigateToStep = (newStep: Step) => {
    Keyboard.dismiss();
    setStep(newStep);
    // Scroll to top after a brief delay so the new content renders first
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const handleNext = () => {
    if (validateStep1()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigateToStep(2);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNextToStep3 = () => {
    if (validateStep2()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigateToStep(3);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 2) { navigateToStep(1); dispatch(clearError()); }
    else if (step === 3) navigateToStep(2);
  };

  // Media picker
  const handlePickMedia = async (useCamera: boolean) => {
    setMediaPickerVisible(false);
    setFileSizeError(null);
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: pickingType === "image" ? ['images'] : ['videos'],
      allowsEditing: pickingType === "image",
      aspect: [1, 1],
      quality: 0.5,
    };
    let result;
    if (useCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const limit = pickingType === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
      const label = pickingType === "image" ? "Image" : "Video";
      if (asset.fileSize && asset.fileSize > limit) {
        setFileSizeError(`${label} must not be greater than ${limit / (1024 * 1024)}MB`);
        return;
      }
      if (pickingType === "image") {
        setProfileImage(asset.uri);
        setFieldErrors(prev => { const n = { ...prev }; delete n.profileImage; return n; });
      } else {
        setIntroVideo(asset.uri);
      }
    }
  };

  // Schedule handlers
  const openAddSchedule = () => {
    setEditingSched(null);
    setSchedIsRecurring(true);
    setSchedDay("Monday");
    setSchedDate(new Date());
    setSchedStartTime(createTimeDate(9, 0));
    setSchedEndTime(createTimeDate(17, 0));
    setSchedSlotDuration(30);
    setSchedHospitalId(null);
    setSchedHospitalName(null);
    setSchedErrors({});
    setSchedModalVisible(true);
  };

  const openEditSchedule = (entry: ScheduleEntry) => {
    setEditingSched(entry);
    setSchedIsRecurring(entry.isRecurring);
    if (entry.isRecurring) setSchedDay(entry.day || "Monday");
    else setSchedDate(new Date(entry.date || new Date()));
    const [sh, sm] = entry.startTime.split(":").map(Number);
    const [eh, em] = entry.endTime.split(":").map(Number);
    setSchedStartTime(createTimeDate(sh, sm));
    setSchedEndTime(createTimeDate(eh, em));
    setSchedSlotDuration(entry.slotDuration || 30);
    setSchedHospitalId(entry.hospitalId);
    setSchedHospitalName(entry.hospitalName);
    setSchedErrors({});
    setSchedModalVisible(true);
  };

  const handleSaveSchedule = (newEntries: ScheduleEntry[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (editingSched) {
      setSchedules(prev => prev.map(s => s.id === editingSched.id ? newEntries[0] : s));
    } else {
      setSchedules(prev => [...prev, ...newEntries]);
    }
    setSchedModalVisible(false);
  };

  const handleRemoveSchedule = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  // Submit
  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("specialization", specializations[0] || "");
    formData.append("specializations", JSON.stringify(specializations));
    formData.append("experienceYears", experience);
    formData.append("bio", bio);
    formData.append("licenseNumber", licenseNumber);
    if (schedules.length > 0) formData.append("availability", JSON.stringify(schedules));
    if (profileImage) {
      const filename = profileImage.split('/').pop() || 'photo.jpg';
      formData.append("profilePicture", { uri: profileImage, name: filename, type: `image/${filename.split('.').pop()}` } as any);
    }
    if (introVideo) {
      const filename = introVideo.split('/').pop() || 'video.mp4';
      formData.append("introVideo", { uri: introVideo, name: filename, type: `video/${filename.split('.').pop()}` } as any);
    }
    dispatch(submitDoctorProfile(formData));
  };

  // Shared
  const handleInputChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    if (error) dispatch(clearError());
  };

  const toggleSpecialization = (item: string) => {
    setSpecializations(prev => {
      if (prev.includes(item)) return prev.filter(s => s !== item);
      if (prev.length >= 2) return prev;
      return [...prev, item];
    });
    setFieldErrors(prev => { const n = { ...prev }; delete n.specializations; return n; });
  };

  const getDisplayError = (errorMessage: string | null) => {
    if (!errorMessage) return null;
    if (errorMessage.startsWith('Upload Error:')) return errorMessage.replace(/^Upload Error:\s*/, '');
    const translated = t(errorMessage);
    return translated === errorMessage ? errorMessage : translated;
  };

  const displayError = getDisplayError(error);
  const insets = useSafeAreaInsets();

  // Step indicator
  const totalSteps = 3;
  const stepProgress = step / totalSteps;

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Animated.View
            key="step1"
            entering={FadeIn.duration(300)}
            exiting={FadeOutLeft.duration(200)}
          >
            <Step1Professional
              theme={theme} styles={styles}
              fullName={fullName} specializations={specializations}
              experience={experience}
              licenseNumber={licenseNumber} bio={bio}
              fieldErrors={fieldErrors}
              onInputChange={handleInputChange}
              setFullName={setFullName} setExperience={setExperience}
              setLicenseNumber={setLicenseNumber}
              setBio={setBio}
              onToggleSpecialization={toggleSpecialization}
              onOpenSpecializationModal={() => setSpecModalVisible(true)}
              onBioFocus={handleBioFocus}
            />
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View
            key="step2"
            entering={SlideInRight.duration(300).springify()}
            exiting={FadeOutLeft.duration(200)}
          >
            <Step2Media
              theme={theme} styles={styles}
              profileImage={profileImage} introVideo={introVideo}
              fileSizeError={fileSizeError} fieldErrors={fieldErrors}
              imageAnimatedStyle={imageAnimatedStyle}
              onPickImage={() => { setPickingType("image"); setMediaPickerVisible(true); }}
              onPickVideo={() => { setPickingType("video"); setMediaPickerVisible(true); }}
              onRemoveVideo={() => setIntroVideo(null)}
            />
          </Animated.View>
        );
      case 3:
        return (
          <Animated.View
            key="step3"
            entering={SlideInRight.duration(300).springify()}
            exiting={FadeOutLeft.duration(200)}
          >
            <Step3Schedule
              theme={theme}
              schedules={schedules}
              onAdd={openAddSchedule}
              onEdit={openEditSchedule}
              onRemove={handleRemoveSchedule}
            />
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: 0 }]}>
      <MedLoadingOverlay visible={loading} />

      <View style={styles.header}>
        <LanguagePicker />
        <Pressable onPress={() => dispatch(logout())} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#D92D20" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
            <MedText variant="h1">{step === 1 ? t("professionalDetails") : step === 2 ? t("identityMedia") : t("availabilitySchedule")}</MedText>
            <MedText variant="metadata" color={theme.muted}>{t("stepOf", { step })}</MedText>

            {/* Step progress bar */}
            <View style={[localStyles.progressBar, { backgroundColor: theme.border + "40" }]}>
              <Animated.View
                style={[
                  localStyles.progressFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${stepProgress * 100}%`,
                  },
                ]}
              />
            </View>
          </View>

          {rejectionReason && step === 1 && (
            <RejectionBanner reason={rejectionReason} theme={theme} />
          )}

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: isKeyboardVisible ? 280 : 120 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderStepContent()}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <ErrorSlideBanner message={displayError} visible={!!displayError} />

      {!isKeyboardVisible && (
        <View style={[localStyles.fixedFooter, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <View style={localStyles.footerInner}>
            {(step === 2 || step === 3) && (
              <MedButton title={t("back")} onPress={handleBack} type="outline" style={{ flex: 1 }} />
            )}
            <MedButton
              title={step === 1 ? t("nextStep") : step === 2 ? t("nextStep") : t("submitProfile")}
              onPress={step === 1 ? handleNext : step === 2 ? handleNextToStep3 : handleSubmit}
              loading={loading}
              style={{ flex: 2 }}
            />
          </View>
          <View style={localStyles.legalRow}>
            <MedText variant="metadata" style={localStyles.legalText}>By continuing you agree to our </MedText>
            <Pressable onPress={() => Linking.openURL(`${BASE_URL}/api/legal/terms`)}>
              <MedText variant="metadata" style={[localStyles.legalLink, { color: theme.secondary }]}>Terms of Service</MedText>
            </Pressable>
            <MedText variant="metadata" style={localStyles.legalText}> and </MedText>
            <Pressable onPress={() => Linking.openURL(`${BASE_URL}/api/legal/privacy`)}>
              <MedText variant="metadata" style={[localStyles.legalLink, { color: theme.secondary }]}>Privacy Policy</MedText>
            </Pressable>
          </View>
        </View>
      )}

      <SpecializationModal
        visible={specModalVisible}
        onClose={() => setSpecModalVisible(false)}
        specializations={specializations}
        onToggle={toggleSpecialization}
        theme={theme}
      />

      <ScheduleModal
        visible={schedModalVisible}
        onClose={() => setSchedModalVisible(false)}
        onSave={handleSaveSchedule}
        editingSched={editingSched}
        schedules={schedules}
        theme={theme}
        schedIsRecurring={schedIsRecurring}
        schedDay={schedDay}
        schedDate={schedDate}
        schedSlotDuration={schedSlotDuration}
        schedStartTime={schedStartTime}
        schedEndTime={schedEndTime}
        schedHospitalId={schedHospitalId}
        schedHospitalName={schedHospitalName}
        showStartPicker={showStartPicker}
        showEndPicker={showEndPicker}
        showDatePicker={showDatePicker}
        schedErrors={schedErrors}
        hospitals={hospitals}
        setSchedIsRecurring={setSchedIsRecurring}
        setSchedDay={setSchedDay}
        setSchedDate={setSchedDate}
        setSchedSlotDuration={setSchedSlotDuration}
        setSchedStartTime={setSchedStartTime}
        setSchedEndTime={setSchedEndTime}
        setSchedHospitalId={setSchedHospitalId}
        setSchedHospitalName={setSchedHospitalName}
        setShowStartPicker={setShowStartPicker}
        setShowEndPicker={setShowEndPicker}
        setShowDatePicker={setShowDatePicker}
        setSchedErrors={setSchedErrors}
      />

      <MediaPickerModal
        visible={mediaPickerVisible}
        pickingType={pickingType}
        onClose={() => setMediaPickerVisible(false)}
        onPick={handlePickMedia}
        theme={theme}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  fixedFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 34 : 24, paddingTop: 16 },
  footerInner: { flexDirection: "row", gap: 12, paddingHorizontal: 24 },
  progressBar: { height: 4, borderRadius: 2, marginTop: 12, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  legalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10, paddingHorizontal: 24 },
  legalText: { fontSize: 11, opacity: 0.6 },
  legalLink: { fontSize: 11, fontWeight: '600', textDecorationLine: 'underline' },
});
