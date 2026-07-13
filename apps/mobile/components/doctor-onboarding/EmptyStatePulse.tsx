import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from "react-native-reanimated";

type Props = { theme: any };

export function EmptyStatePulse({ theme }: Props) {
  const scale = useSharedValue(1);
  const opacitySv = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
    opacitySv.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.6, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacitySv.value,
  }));

  return (
    <Animated.View style={iconStyle}>
      <View style={[styles.emptyCalIcon, { backgroundColor: theme.primary + "10" }]}>
        <Ionicons name="calendar" size={32} color={theme.primary + "60"} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  emptyCalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
