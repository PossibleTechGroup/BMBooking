import React from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";
import { Colors, Fonts } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

interface MedTextProps {
  children: React.ReactNode;
  variant?: "h1" | "h2" | "body" | "metadata";
  style?: StyleProp<TextStyle> | TextStyle[];
  color?: string;
  numberOfLines?: number;
}

export const MedText: React.FC<MedTextProps> = ({
  children,
  variant = "body",
  style,
  color,
  numberOfLines,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const getVariantStyle = () => {
    switch (variant) {
      case "h1":
        return styles.h1;
      case "h2":
        return styles.h2;
      case "body":
        return styles.body;
      case "metadata":
        return styles.metadata;
      default:
        return styles.body;
    }
  };

  const getDefaultColor = () => {
    if (color) return color;
    switch (variant) {
      case "metadata":
        return theme.muted;
      case "body":
        return theme.textSecondary || theme.text;
      default:
        return theme.text;
    }
  };

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[getVariantStyle(), { color: getDefaultColor() }, style]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontFamily: Fonts.primary,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  h2: {
    fontFamily: Fonts.primary,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  body: {
    fontFamily: Fonts.primary,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  metadata: {
    fontFamily: Fonts.secondary,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
});
