import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: Platform.OS === 'web' ? 76 : 64 + insets.bottom,
          paddingBottom: Platform.OS === 'web' ? 16 : insets.bottom + 10,
          paddingTop: 8,
          marginBottom: Platform.OS === 'web' ? 40 : 0,
          marginHorizontal: Platform.OS === 'web' ? 16 : 0,
          borderRadius: Platform.OS === 'web' ? 16 : 0,
          borderWidth: Platform.OS === 'web' ? 1 : 0,
          borderColor: theme.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Services",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: "Doctors",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="equipment"
        options={{
          title: "Equipments",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "hardware-chip" : "hardware-chip-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appointments",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profiles"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
