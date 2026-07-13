import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { MedText } from "../medconnect/MedText";
import { FadeInDownSpring } from "../../hooks/useAnimations";

type Props = {
  theme: any;
  styles: any;
  profileImage: string | null;
  introVideo: string | null;
  fileSizeError: string | null;
  fieldErrors: Record<string, string>;
  imageAnimatedStyle: any;
  onPickImage: () => void;
  onPickVideo: () => void;
  onRemoveVideo: () => void;
};

export function Step2Media({
  theme, styles, profileImage, introVideo, fileSizeError, fieldErrors,
  imageAnimatedStyle, onPickImage, onPickVideo, onRemoveVideo,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.mediaGrid}>
      <View>
        <MedText variant="metadata" style={[{ marginBottom: 12 }, fieldErrors.profileImage && { color: "#D92D20" }]}>
          {t("profilePhoto")}*
        </MedText>
        <Pressable
          style={[styles.mediaCard, fieldErrors.profileImage && { borderColor: "#D92D20" }]}
          onPress={onPickImage}
        >
          {profileImage ? (
            <Animated.View style={[{ width: "100%", height: "100%" }, imageAnimatedStyle]}>
              <Image source={{ uri: profileImage }} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(200)} style={styles.mediaPlaceholder}>
              <Ionicons name="camera-outline" size={32} color={fieldErrors.profileImage ? "#D92D20" : theme.muted} />
              <MedText variant="metadata" color={fieldErrors.profileImage ? "#D92D20" : theme.muted}>{t("uploadPhoto")}</MedText>
            </Animated.View>
          )}
        </Pressable>
        {fieldErrors.profileImage && (
          <Animated.View entering={FadeInDownSpring}>
            <MedText variant="metadata" style={{ color: "#D92D20", marginTop: 6, marginLeft: 4, fontSize: 12 }}>{fieldErrors.profileImage}</MedText>
          </Animated.View>
        )}
      </View>

      <View>
        <MedText variant="metadata" style={{ marginBottom: 12 }}>{t("introVideo")}</MedText>
        <Pressable style={styles.mediaCard} onPress={onPickVideo}>
          {introVideo ? (
            <View style={styles.mediaPreview}>
              <Video source={{ uri: introVideo }} resizeMode={ResizeMode.COVER} shouldPlay={false} useNativeControls style={StyleSheet.absoluteFill} />
              <Pressable
                style={localStyles.removeBtn}
                onPress={() => { onRemoveVideo(); }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={22} color="#FFF" />
              </Pressable>
              <View style={[localStyles.videoBadge, { position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }]}>
                <MedText variant="metadata" style={{ color: "#FFF" }}>{t("videoSelected")}</MedText>
              </View>
            </View>
          ) : (
            <View style={styles.mediaPlaceholder}>
              <Ionicons name="videocam-outline" size={32} color={theme.muted} />
              <MedText variant="metadata" color={theme.muted}>{t("uploadVideo")}</MedText>
            </View>
          )}
        </Pressable>
      </View>

      {fileSizeError ? (
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 10, gap: 12, borderWidth: 1, backgroundColor: '#FCEBEB', borderColor: '#D92D20' }}
        >
          <Ionicons name="alert-circle" size={20} color="#D92D20" />
          <MedText style={{ color: '#D92D20', flex: 1, fontSize: 14, fontWeight: '600' }}>{fileSizeError}</MedText>
        </Animated.View>
      ) : null}
    </View>
  );
}

const localStyles = StyleSheet.create({
  videoBadge: { position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  removeBtn: { position: "absolute", top: 8, right: 8, zIndex: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
});
