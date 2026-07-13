import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { MedText } from "../medconnect/MedText";
import { SPRING_CONFIG } from "../../hooks/useAnimations";

type Props = { reason: string; theme: any };

export function RejectionBanner({ reason, theme }: Props) {
  const scaleY = useSharedValue(0);
  const opacity = useSharedValue(0);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    scaleY.value = withSpring(1, { ...SPRING_CONFIG, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  return (
    <Animated.View style={[bannerStyle, {
      backgroundColor: "#FCEBEB",
      padding: 16,
      marginHorizontal: 24,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: "#FEE4E2",
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    }]}>
      <Ionicons name="alert-circle" size={24} color="#D92D20" />
      <View style={{ flex: 1 }}>
        <MedText variant="metadata" style={{ color: "#D92D20", fontWeight: "700" }}>Correction Required</MedText>
        <MedText variant="metadata" style={{ color: "#D92D20" }}>{reason}</MedText>
      </View>
    </Animated.View>
  );
}
