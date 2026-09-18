import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  MapViewComponent as MapView,
  MarkerComponent as Marker,
  PROVIDER_GOOGLE,
} from "../components/MapViewWrapper";
import { MedButton } from "../components/medconnect/MedButton";
import { MedCard } from "../components/medconnect/MedCard";
import { MedText } from "../components/medconnect/MedText";
import { getAssetUrl } from "../constants/api";
import { Colors } from "../constants/theme";
import { useColorScheme } from "../hooks/use-color-scheme";
import { AppDispatch, RootState } from "../store";
import { fetchHospitals } from "../store/slices/hospitalSlice";
import { haversineKm } from "../utils/location";

const ADDIS_ABABA = { latitude: 9.0355, longitude: 38.739995 };

export default function HospitalsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { hospitals, loading } = useSelector((state: RootState) => state.hospitals);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (hospitals.length === 0) dispatch(fetchHospitals());
    }, [hospitals.length, dispatch]),
  );

  useEffect(() => {
    if (Platform.OS === "web") return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch {}
    })();
  }, []);

  const withDistance = useMemo(() => {
    return hospitals.map((h: any) => {
      if (userLocation && h.latitude != null && h.longitude != null) {
        return { ...h, distanceKm: Math.round(haversineKm(userLocation.lat, userLocation.lng, h.latitude, h.longitude) * 10) / 10 };
      }
      return { ...h, distanceKm: h.distanceKm ?? null };
    });
  }, [hospitals, userLocation]);

  const topRated = useMemo(() => {
    return [...withDistance].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
  }, [withDistance]);

  const nearMe = useMemo(() => {
    if (!userLocation) return [];
    return [...withDistance]
      .filter((h: any) => h.distanceKm != null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
  }, [withDistance, userLocation]);

  const mapRegion = useMemo(() => {
    const first = withDistance.find((h: any) => h.latitude != null && h.longitude != null);
    if (first) {
      return {
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };
    }
    return { ...ADDIS_ABABA, latitudeDelta: 0.12, longitudeDelta: 0.12 };
  }, [withDistance]);

  const mappedHospitals = withDistance.filter((h: any) => h.latitude != null && h.longitude != null);

  const goToHospital = (id: number) => router.push({ pathname: "/hospital-detail", params: { id } });

  const renderPanelItem = (item: any, index: number, showDistance: boolean) => (
    <Pressable key={item.id} onPress={() => goToHospital(item.id)} style={styles.panelItem}>
      <MedText variant="metadata" style={styles.panelRank}>
        {String(index + 1).padStart(2, "0")}
      </MedText>
      <View style={{ flex: 1 }}>
        <MedText variant="body" style={{ fontSize: 13, lineHeight: 18 }} numberOfLines={1}>
          {item.name}
        </MedText>
        <View style={styles.panelMeta}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <MedText variant="metadata" style={{ marginLeft: 3 }}>
            {(item.rating || 0).toFixed(1)}
          </MedText>
          {showDistance && item.distanceKm != null ? (
            <>
              <MedText variant="metadata" style={{ marginHorizontal: 5 }}>•</MedText>
              <Ionicons name="navigate-outline" size={11} color={theme.muted} />
              <MedText variant="metadata" style={{ marginLeft: 3 }}>{item.distanceKm} km</MedText>
            </>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={14} color={theme.muted} />
    </Pressable>
  );

  const renderNearMe = () => {
    if (!userLocation) {
      return (
        <View style={styles.panelEmpty}>
          <Ionicons name="location-outline" size={22} color={theme.muted} />
          <MedText variant="metadata" style={{ marginTop: 6, textAlign: "center" }}>
            Enable location to see hospitals near you
          </MedText>
          <MedButton
            title="Use My Location"
            type="outline"
            size="small"
            style={{ marginTop: 10, paddingHorizontal: 12 }}
            onPress={async () => {
              try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                  setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
                }
              } catch {}
            }}
          />
        </View>
      );
    }
    if (nearMe.length === 0) {
      return (
        <View style={styles.panelEmpty}>
          <Ionicons name="navigate-outline" size={22} color={theme.muted} />
          <MedText variant="metadata" style={{ marginTop: 6, textAlign: "center" }}>
            No hospitals with location nearby
          </MedText>
        </View>
      );
    }
    return nearMe.map((item, index) => renderPanelItem(item, index, true));
  };

  const listHeader = (
    <View>
      {/* Map */}
      {mappedHospitals.length > 0 && (
        <MedCard style={styles.mapCard}>
          <MapView
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            style={styles.map}
            initialRegion={mapRegion}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            {userLocation ? (
              <Marker
                coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
                title="You"
                pinColor="#3B82F6"
              />
            ) : null}
            {mappedHospitals.map((h: any) => (
              <Marker
                key={h.id}
                coordinate={{ latitude: h.latitude, longitude: h.longitude }}
                title={h.name}
              />
            ))}
          </MapView>
        </MedCard>
      )}

      {/* Top Rated & Near Me side by side */}
      <View style={styles.panelsRow}>
        <MedCard style={styles.panel}>
          <View style={styles.panelHeader}>
            <Ionicons name="star" size={15} color="#F59E0B" />
            <MedText variant="h2" style={{ marginLeft: 6, fontSize: 15 }}>Top Rated</MedText>
          </View>
          <View style={{ marginTop: 6 }}>
            {topRated.length > 0 ? (
              topRated.map((item, index) => renderPanelItem(item, index, false))
            ) : (
              <MedText variant="metadata" style={styles.panelEmpty}>
                No hospitals yet
              </MedText>
            )}
          </View>
        </MedCard>

        <MedCard style={styles.panel}>
          <View style={styles.panelHeader}>
            <Ionicons name="navigate" size={15} color={theme.primary} />
            <MedText variant="h2" style={{ marginLeft: 6, fontSize: 15 }}>Near Me</MedText>
          </View>
          <View style={{ marginTop: 6 }}>{renderNearMe()}</View>
        </MedCard>
      </View>

      <MedText variant="h2" style={styles.allTitle}>All Hospitals</MedText>
    </View>
  );

  const renderHospital = ({ item }: { item: any }) => (
    <Pressable onPress={() => goToHospital(item.id)}>
      <MedCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.logoWrap}>
            {item.image ? (
              <Image source={{ uri: getAssetUrl(item.image) }} style={styles.logo} />
            ) : (
              <Ionicons name="business-outline" size={28} color={theme.muted} />
            )}
          </View>
          <View style={styles.info}>
            <MedText variant="h2">{item.name}</MedText>
            {item.address ? (
              <MedText variant="metadata" style={{ marginTop: 2 }}>
                <Ionicons name="location-outline" size={12} color={theme.muted} /> {item.address}
              </MedText>
            ) : null}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={12} color={theme.muted} />
                <MedText variant="metadata" style={{ marginLeft: 4 }}>
                  {item.doctorCount || 0} doctors
                </MedText>
              </View>
              {item.rating ? (
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <MedText variant="metadata" style={{ marginLeft: 4 }}>
                    {Number(item.rating).toFixed(1)}
                    {item.totalReviews ? ` (${item.totalReviews})` : ""}
                  </MedText>
                </View>
              ) : null}
              {item.distanceKm != null ? (
                <View style={styles.metaItem}>
                  <Ionicons name="navigate-outline" size={12} color={theme.muted} />
                  <MedText variant="metadata" style={{ marginLeft: 4 }}>
                    {item.distanceKm} km
                  </MedText>
                </View>
              ) : null}
            </View>
            {item.services && item.services.length > 0 ? (
              <MedText variant="metadata" style={{ marginTop: 6, color: theme.primary }}>
                {item.services.join(" • ")}
              </MedText>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.muted} />
        </View>
      </MedCard>
    </Pressable>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <MedText variant="h1" style={{ flex: 1 }}>Hospitals</MedText>
        <Pressable onPress={() => dispatch(fetchHospitals())} style={styles.refreshBtn} hitSlop={8}>
          <Ionicons name="refresh" size={20} color={theme.text} />
        </Pressable>
      </View>

      <FlatList
        data={withDistance}
        renderItem={renderHospital}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator color={theme.primary} size="large" />
            ) : (
              <>
                <Ionicons name="business-outline" size={48} color={theme.muted} />
                <MedText variant="body" color={theme.muted} style={{ marginTop: 12, textAlign: "center" }}>
                  No hospitals available
                </MedText>
                <MedButton title="Retry" type="outline" onPress={() => dispatch(fetchHospitals())} style={{ marginTop: 16 }} />
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  backBtn: { padding: 4, marginRight: 12 },
  refreshBtn: { padding: 4 },
  list: { padding: 20, paddingBottom: 40 },
  card: { padding: 16 },
  row: { flexDirection: "row", alignItems: "center" },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  logo: { width: 52, height: 52 },
  info: { flex: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 6 },
  metaItem: { flexDirection: "row", alignItems: "center" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  mapCard: { padding: 0, overflow: "hidden", height: 190, borderRadius: 16, marginBottom: 16 },
  map: { ...StyleSheet.absoluteFillObject },
  panelsRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  panel: { flex: 1, padding: 12 },
  panelHeader: { flexDirection: "row", alignItems: "center" },
  panelItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  panelRank: { width: 18, marginRight: 8, color: "#F59E0B", fontWeight: "700" },
  panelMeta: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  panelEmpty: { color: "#8CA3BD", textAlign: "center", paddingVertical: 18 },
  allTitle: { marginTop: 22, marginBottom: 4 },
});