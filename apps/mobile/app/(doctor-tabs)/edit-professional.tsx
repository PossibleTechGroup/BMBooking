import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { MedButton } from "../../components/medconnect/MedButton";
import { MedInput } from "../../components/medconnect/MedInput";
import { MedLoadingOverlay } from "../../components/medconnect/MedLoadingOverlay";
import { MedText } from "../../components/medconnect/MedText";
import { createOnboardingStyles } from "../../constants/onboardingStyles";
import { MEDICAL_SPECIALIZATIONS } from "../../constants/specializations";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { AppDispatch, RootState } from "../../store";
import { clearError, submitDoctorProfile } from "../../store/slices/authSlice";
import { BASE_URL } from "../../constants/api";

export default function EditProfessionalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const styles = createOnboardingStyles(theme);

  const { user, loading, error } = useSelector((state: RootState) => state.auth);
  const profile = user?.doctorProfile;

  // Form State initialized from current profile
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [specializations, setSpecializations] = useState<string[]>(
    profile?.specializations || (profile?.specialization ? [profile.specialization] : [])
  );
  const [experience, setExperience] = useState(profile?.experienceYears?.toString() || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [licenseNumber, setLicenseNumber] = useState(profile?.licenseNumber || "");

  // Media State
  const [profileImage, setProfileImage] = useState<string | null>(
    profile?.profilePicture ? `${BASE_URL}${profile.profilePicture}` : null
  );
  const [introVideo, setIntroVideo] = useState<string | null>(
    profile?.introVideo ? `${BASE_URL}${profile.introVideo}` : null
  );

  // Sync state if profile loads after initial render
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setSpecializations(profile?.specializations || (profile?.specialization ? [profile.specialization] : []));
      setExperience(profile.experienceYears?.toString() || "");
      setBio(profile.bio || "");
      setLicenseNumber(profile.licenseNumber || "");
      if (profile.profilePicture) setProfileImage(`${BASE_URL}${profile.profilePicture}`);
      if (profile.introVideo) setIntroVideo(`${BASE_URL}${profile.introVideo}`);
    }
  }, [profile]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // UI State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [specModalVisible, setSpecModalVisible] = useState(false);
  const [specSearch, setSpecSearch] = useState("");
  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
  const [pickingType, setPickingType] = useState<"image" | "video">("image");
  const [removedMsg, setRemovedMsg] = useState<string | null>(null);

  const filteredSpecializations = useMemo(() => {
    return MEDICAL_SPECIALIZATIONS.filter(s =>
      s.toLowerCase().includes(specSearch.toLowerCase())
    );
  }, [specSearch]);

  const toggleSpecialization = (item: string) => {
    setSpecializations(prev => {
      if (prev.includes(item)) return prev.filter(s => s !== item);
      if (prev.length >= 2) return prev;
      return [...prev, item];
    });
    setFieldErrors(prev => {
      const n = { ...prev };
      delete n.specializations;
      return n;
    });
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = t("valNameRequired");
    if (specializations.length === 0) errors.specializations = t("valSpecRequired");
    if (!experience.trim()) errors.experience = t("valExpRequired");
    if (!licenseNumber.trim()) errors.licenseNumber = t("valLicenseRequired");
    if (bio.trim().length < 10) errors.bio = t("valBioShort");
    if (!profileImage) errors.profileImage = t("valPhotoRequired");

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);

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
        const maxMB = limit / (1024 * 1024);
        setFileSizeError(`${label} must not be greater than ${maxMB}MB`);
        return;
      }

      if (pickingType === "image") {
        setProfileImage(asset.uri);
      } else {
        setIntroVideo(asset.uri);
      }
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("specialization", specializations[0] || "");
    formData.append("specializations", JSON.stringify(specializations));
    formData.append("experienceYears", experience);
    formData.append("bio", bio);
    formData.append("licenseNumber", licenseNumber);

    // Only append files if they are local URIs (newly picked)
    if (profileImage && !profileImage.startsWith('http')) {
      const filename = profileImage.split('/').pop() || 'photo.jpg';
      const type = `image/${filename.split('.').pop()}`;
      formData.append("profilePicture", { uri: profileImage, name: filename, type } as any);
    }

    if (introVideo && !introVideo.startsWith('http')) {
      const filename = introVideo.split('/').pop() || 'video.mp4';
      const type = `video/${filename.split('.').pop()}`;
      formData.append("introVideo", { uri: introVideo, name: filename, type } as any);
    } else if (!introVideo && profile?.introVideo) {
      formData.append("removeIntroVideo", "true");
    }

    // We use the same submit thunk as it handles POST /profile which also updates
    const result = await dispatch(submitDoctorProfile(formData));
    if (submitDoctorProfile.fulfilled.match(result)) {
      if (!introVideo && profile?.introVideo) {
        setRemovedMsg("Video removed");
        setTimeout(() => router.back(), 2000);
      } else {
        router.back();
      }
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <MedLoadingOverlay visible={loading} />
      
      <View style={localStyles.header}>
        <Pressable onPress={() => router.back()} style={localStyles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <MedText variant="h2">{t("professionalDetails")}</MedText>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formSection}>
            <MedInput label={t("fullName")} value={fullName} onChangeText={setFullName} error={!!fieldErrors.fullName} errorText={fieldErrors.fullName} />
            
            <View style={{ marginBottom: 20 }}>
                <MedText variant="metadata" style={{ marginBottom: 8, marginLeft: 4 }}>{t("specialization")} {t("selectUpToTwo")}</MedText>
                <Pressable onPress={() => setSpecModalVisible(true)} style={[localStyles.selectTrigger, { backgroundColor: theme.surface, borderColor: fieldErrors.specializations ? "#D92D20" : theme.border, minHeight: 56 }]}>
                  <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    {specializations.length > 0 ? specializations.map(s => (
                      <View key={s} style={[localStyles.specChip, { backgroundColor: theme.primary + "15" }]}>
                        <MedText variant="metadata" style={{ color: theme.primary, fontWeight: "600" }}>{s}</MedText>
                        <Pressable onPress={() => toggleSpecialization(s)} hitSlop={8}>
                          <Ionicons name="close-circle" size={16} color={theme.primary} />
                        </Pressable>
                      </View>
                    )) : (
                      <MedText color={theme.muted}>{t("selectSpecialization")}</MedText>
                    )}
                  </View>
                  <Ionicons name="chevron-down" size={20} color={theme.muted} />
                </Pressable>
                {fieldErrors.specializations && <MedText variant="metadata" style={{ color: "#D92D20", marginTop: 6, marginLeft: 4, fontSize: 12 }}>{fieldErrors.specializations}</MedText>}
            </View>

            <MedInput label={t("experienceYears")} value={experience} onChangeText={setExperience} keyboardType="numeric" error={!!fieldErrors.experience} errorText={fieldErrors.experience} />
            <MedInput label={t("licenseNumber")} value={licenseNumber} onChangeText={setLicenseNumber} error={!!fieldErrors.licenseNumber} errorText={fieldErrors.licenseNumber} />
            <MedInput label={t("professionalBio")} value={bio} onChangeText={setBio} multiline numberOfLines={4} textAlignVertical="top" error={!!fieldErrors.bio} errorText={fieldErrors.bio} />
          </View>

          <View style={styles.mediaGrid}>
              <View style={{ flex: 1 }}>
                <MedText variant="metadata" style={{ marginBottom: 12 }}>{t("profilePhoto")}</MedText>
                <Pressable style={styles.mediaCard} onPress={() => { setPickingType("image"); setMediaPickerVisible(true); }}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.mediaPreview} />
                  ) : (
                    <View style={styles.mediaPlaceholder}>
                      <Ionicons name="camera-outline" size={32} color={theme.muted} />
                    </View>
                  )}
                </Pressable>
              </View>

              <View style={{ flex: 1 }}>
                <MedText variant="metadata" style={{ marginBottom: 12 }}>{t("introVideo")}</MedText>
                <Pressable style={styles.mediaCard} onPress={() => { setPickingType("video"); setMediaPickerVisible(true); }}>
                  {introVideo ? (
                    <View style={styles.mediaPreview}>
                      <Video source={{ uri: introVideo }} resizeMode={ResizeMode.COVER} style={StyleSheet.absoluteFill} />
                      <Pressable
                        style={{ position: "absolute", top: 8, right: 8, zIndex: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}
                        onPress={() => setIntroVideo(null)}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={22} color="#FFF" />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.mediaPlaceholder}>
                      <Ionicons name="videocam-outline" size={32} color={theme.muted} />
                    </View>
                  )}
                </Pressable>
              </View>
          </View>

          {fileSizeError ? (
            <View style={[localStyles.errorBanner, { marginTop: 12 }]}>
              <Ionicons name="alert-circle" size={20} color="#D92D20" />
              <MedText style={{ color: "#D92D20", flex: 1, fontWeight: '600' }}>{fileSizeError}</MedText>
            </View>
          ) : null}

          {error && (
            <View style={localStyles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#D92D20" />
              <MedText style={{ color: "#D92D20", flex: 1 }}>{t(error)}</MedText>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={localStyles.footer}>
        <MedButton title={t("saveAndContinue")} onPress={handleSubmit} loading={loading} />
      </View>

      <Modal visible={specModalVisible} animationType="slide" transparent>
        <SafeAreaView style={[localStyles.modalContent, { backgroundColor: theme.background }]}>
            <View style={localStyles.modalHeader}>
              <Pressable onPress={() => setSpecModalVisible(false)} style={{ padding: 4 }}><Ionicons name="close" size={28} color={theme.text} /></Pressable>
              <MedText variant="h2">{t("specialization")}</MedText>
              <Pressable onPress={() => setSpecModalVisible(false)}><MedText variant="body" style={{ color: theme.primary, fontWeight: "700" }}>{t("done")}</MedText></Pressable>
            </View>
            <View style={{ paddingHorizontal: 24, marginBottom: 20, position: "relative" }}>
              <Ionicons name="search" size={20} color={theme.muted} style={{ position: "absolute", left: 40, top: 18, zIndex: 1 }} />
              <TextInput style={{ height: 56, borderRadius: 12, borderWidth: 1.5, paddingLeft: 48, paddingRight: 16, fontSize: 16, color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }} placeholder={t("searchSpecialization")} placeholderTextColor={theme.muted} value={specSearch} onChangeText={setSpecSearch} />
            </View>
            <FlatList
              data={filteredSpecializations}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
              renderItem={({ item }) => {
                const isSelected = specializations.includes(item);
                const isMaxed = !isSelected && specializations.length >= 2;
                return (
                  <Pressable style={[localStyles.specItem, { borderBottomColor: theme.border, opacity: isMaxed ? 0.4 : 1 }]} onPress={() => { if (!isMaxed) toggleSpecialization(item); }}>
                    <MedText variant="body" style={{ fontWeight: isSelected ? "700" : "400" }}>{item}</MedText>
                    {isSelected ? <Ionicons name="checkmark-circle" size={20} color={theme.primary} /> : null}
                  </Pressable>
                );
              }}
            />
        </SafeAreaView>
      </Modal>

      <Modal visible={mediaPickerVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setMediaPickerVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <MedText variant="h2" style={styles.modalTitle}>{t("selectSource", { type: pickingType === "image" ? t("camera") : t("gallery") })}</MedText>
            <View style={styles.modalGrid}>
              <Pressable style={styles.modalOption} onPress={() => handlePickMedia(true)}>
                <Ionicons name="camera" size={32} color={theme.primary} /><MedText variant="body">{t("camera")}</MedText>
              </Pressable>
              <Pressable style={styles.modalOption} onPress={() => handlePickMedia(false)}>
                <Ionicons name="images" size={32} color={theme.primary} /><MedText variant="body">{t("gallery")}</MedText>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {removedMsg && (
        <View style={{
          position: 'absolute', bottom: 100, left: 20, right: 20,
          backgroundColor: '#1F2937', borderRadius: 12, padding: 16,
          flexDirection: 'row', alignItems: 'center', gap: 8,
          shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
        }}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <MedText style={{ color: '#FFF', fontSize: 14, fontWeight: '500' }}>{removedMsg}</MedText>
        </View>
      )}
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { padding: 4 },
  selectTrigger: { height: 56, borderWidth: 1.5, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  errorBanner: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#FCEBEB', borderRadius: 12, marginTop: 20 },
  modalContent: { flex: 1, marginTop: 60, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 24 },
  specItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F2F4F7', flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  specChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }
});
