import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { MedText } from "../medconnect/MedText";
import { SPRING_CONFIG } from "../../hooks/useAnimations";

type Props = { message: string | null; visible: boolean };

export function ErrorSlideBanner({ message, visible }: Props) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(-20, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[style, {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginTop: 10,
      gap: 12,
      borderWidth: 1,
      backgroundColor: '#E7F1FF',
      borderColor: '#2E6ED4',
    }]}>
      <Ionicons name="alert-circle" size={20} color="#2563EB" />
      <MedText style={{ color: "#0F172A", fontSize: 14, fontWeight: "600", flex: 1 }}>{message}</MedText>
    </Animated.View>
  );
}
