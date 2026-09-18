import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MedText } from "./medconnect/MedText";
import { Colors } from "../constants/theme";
import { useColorScheme } from "../hooks/use-color-scheme";

interface BMHeaderProps {
  showMenu?: boolean;
  onMenuPress?: () => void;
  rightAction?: React.ReactNode;
}

export const BMHeader: React.FC<BMHeaderProps> = ({ showMenu = true, onMenuPress, rightAction }) => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      router.push("/(tabs)/profiles");
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoRow}>
        <Image
          source={require("../assets/images/bm-booking-logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <MedText style={styles.brandTitle}>BM</MedText>
      </View>
      <View style={styles.rightContainer}>
        {rightAction}
        {showMenu && (
          <Pressable onPress={handleMenuPress} hitSlop={10} style={styles.menuButton}>
            <Ionicons name="menu-outline" size={26} color={theme.text} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E56A0",
    letterSpacing: -0.5,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    padding: 4,
  },
});
