import * as Haptics from "expo-haptics";
import React from "react";
import { Animated, Pressable, StyleSheet, ActivityIndicator, ViewStyle, View } from "react-native";
import { Colors, Fonts } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { MedText } from "./MedText";

interface MedButtonProps {
  title: string;
  onPress: () => void;
  type?: "primary" | "secondary" | "outline";
  style?: ViewStyle;
  textStyle?: any;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const MedButton: React.FC<MedButtonProps> = ({
  title,
  onPress,
  type = "primary",
  style,
  textStyle,
  disabled = false,
  loading = false,
  icon,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const animatedScale = new Animated.Value(1);

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(animatedScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(animatedScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = () => {
    if (disabled && type === "primary") {
      return { backgroundColor: colorScheme === "dark" ? "#444" : "#D0D5DD" };
    }
    switch (type) {
      case "primary":
        return { 
          backgroundColor: theme.primary,
          shadowOpacity: 0.05,
          elevation: 2,
        };
      case "secondary":
        return { 
          backgroundColor: theme.secondary,
          shadowOpacity: 0.05,
          elevation: 2,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: theme.border,
          shadowOpacity: 0,
          elevation: 0,
        };
      default:
        return { backgroundColor: theme.primary };
    }
  };

  const getTextStyle = () => {
    if (disabled && type === "primary") {
      return { color: colorScheme === "dark" ? "#CCC" : "#5A6B80" };
    }
    switch (type) {
      case "primary":
        return { color: colorScheme === "dark" ? "#101828" : "#FFFFFF" };
      case "secondary":
        return { color: "#FFFFFF" };
      case "outline":
        return { color: theme.text };
      default:
        return { color: colorScheme === "dark" ? "#101828" : "#FFFFFF" };
    }
  };

  return (
    <Animated.View
      style={[styles.parent, { transform: [{ scale: animatedScale }] }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[styles.button, getButtonStyle(), style]}
      >
        {loading ? (
          <ActivityIndicator color={getTextStyle().color} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <MedText style={[styles.text, getTextStyle(), textStyle]}>{title}</MedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  parent: {
    borderRadius: 12,
    overflow: "hidden",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    // Base shadow style (overridden by getButtonStyle)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
  text: {
    fontFamily: Fonts.primary,
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: 10,
  },
});
