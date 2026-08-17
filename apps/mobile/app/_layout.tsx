import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "../hooks/use-color-scheme";
import "./../constants/i18n";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, RootState, AppDispatch } from "../store";
import { useEffect, useState } from "react";
import { loadStoredAuth, startProfilePolling, stopProfilePolling } from "../store/slices/authSlice";
import { ActivityIndicator, View, Platform } from "react-native";
import { useNotifications } from "../hooks/use-notifications";
import { loadTimeFormat, loadCalendarFormat } from "../utils/timeFormat";
import * as Font from "expo-font";
import Ionicons from "@expo/vector-icons/Ionicons";

function AppContent() {
  const colorScheme = useColorScheme() ?? "light";
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const segments = useSegments();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const { isCheckingAuth, user, token, doctorProfileStatus, patientProfileStatus } = useSelector(
    (state: RootState) => state.auth
  );

    // Initialize Push Notifications
    // useNotifications();

  useEffect(() => {
    Font.loadAsync(Ionicons.font).then(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    dispatch(loadStoredAuth());
    loadTimeFormat();
    loadCalendarFormat();
  }, []);

  // Register service worker for PWA on web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Polling Management (Doctor Only)
  useEffect(() => {
    if (doctorProfileStatus === "PendingReview") {
      dispatch(startProfilePolling());
    } else {
      dispatch(stopProfilePolling());
    }
    return () => {
      dispatch(stopProfilePolling());
    };
  }, [doctorProfileStatus]);

  // Navigation Logic
  useEffect(() => {
    if (isCheckingAuth || segments.length === 0) return;

    // Navigation Logic
    const currentSegment = segments[0];

    if (!token || !user) {
      if (currentSegment !== "(auth)") {
        router.replace("/(auth)/login");
      }
      return;
    }

    // Role-Based Routing
    if (user.role === "doctor") {
      const inDoctorTabs = currentSegment === "(doctor-tabs)";
      const inModal = currentSegment === "modal";
      const inOnboarding = currentSegment === "(doctor-onboarding)";
      
      if (doctorProfileStatus === "None") {
        if (!inOnboarding) {
          router.replace("/(doctor-onboarding)/setup");
        }
      } else if (doctorProfileStatus === "PendingReview") {
        if (!inOnboarding || segments[1] !== "pending") {
          router.replace("/(doctor-onboarding)/pending");
        }
      } else if (doctorProfileStatus === "Rejected") {
        if (!inOnboarding || segments[1] !== "setup") {
          router.replace("/(doctor-onboarding)/setup");
        }
      } else if (doctorProfileStatus === "Approved") {
        if (!inDoctorTabs && currentSegment !== "modal") {
          router.replace("/(doctor-tabs)");
        }
      }
    } else if (user.role === "patient") {
      const inPatientTabs = currentSegment === "(tabs)";
      const inPatientOnboarding = currentSegment === "(patient-onboarding)";
      const inAllowedPages = currentSegment === "doctor" || currentSegment === "modal" || currentSegment === "doctor-list" || currentSegment === "item-detail";

      if (patientProfileStatus === "None") {
        if (!inPatientOnboarding) {
          router.replace("/(patient-onboarding)/setup");
        }
      } else {
        if (!inPatientTabs && !inAllowedPages) {
          router.replace("/(tabs)");
        }
      }
    }
  }, [isCheckingAuth, token, user, doctorProfileStatus, patientProfileStatus, segments]);

  if (!fontsLoaded || isCheckingAuth) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colorScheme === "dark" ? "#0B1E33" : "#EAF2FB",
        }}
      >
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? "#4DA3FF" : "#1565C0"}
        />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(doctor-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(doctor-onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(patient-onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="doctor-list" options={{ headerShown: false }} />
        <Stack.Screen name="doctor/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="item-detail" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
