import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { Platform } from "react-native";

export function useUserLocation(): {
  latitude: number | null;
  longitude: number | null;
  requestLocation: () => Promise<void>;
} {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const requestLocation = async () => {
    if (Platform.OS === "web") return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
    } catch {
      // ignore permission/location errors
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return { latitude, longitude, requestLocation };
}