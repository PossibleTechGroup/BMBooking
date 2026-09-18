import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import { MedText } from '../components/medconnect/MedText';
import { MedCard } from '../components/medconnect/MedCard';
import { MedButton } from '../components/medconnect/MedButton';
import EquipmentBookingCard from '../components/booking/EquipmentBookingCard';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { useUserLocation } from '../hooks/useUserLocation';
import { haversineKm } from '../utils/location';
import { AppDispatch, RootState } from '../store';
import { fetchHospitalDetail } from '../store/slices/equipmentSlice';

export default function CenterDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const equipmentHospitals = useSelector((state: RootState) => state.equipment.hospitals || []);
  const loading = useSelector((state: RootState) => state.equipment.loading);
  const { latitude, longitude } = useUserLocation();

  const [activeService, setActiveService] = useState<any>(null);

  const hospitalId = parseInt(id as string);

  const center = useMemo(
    () => equipmentHospitals.find((h: any) => String(h.id) === String(hospitalId)),
    [equipmentHospitals, hospitalId]
  );

  useEffect(() => {
    if (hospitalId && !center) {
      dispatch(fetchHospitalDetail(hospitalId));
    }
  }, [hospitalId, center, dispatch]);

  useEffect(() => {
    setActiveService(null);
  }, [hospitalId]);

  const distanceKm = useMemo(() => {
    if (latitude == null || longitude == null || !center) return null;
    const lat = center.latitude;
    const lng = center.longitude;
    if (!lat || !lng) return null;
    return Math.round(haversineKm(latitude, longitude, lat, lng) * 10) / 10;
  }, [latitude, longitude, center]);

  const services = useMemo(() => center?.equipment || [], [center]);

  if (loading && !center) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!center) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Ionicons name="cloud-offline-outline" size={40} color={theme.textSecondary} />
        <MedText variant="h2" style={{ marginTop: 12 }}>
          Diagnosis center not found
        </MedText>
        <MedButton
          title="Retry"
          onPress={() => dispatch(fetchHospitalDetail(hospitalId))}
          style={{ marginTop: 16 }}
        />
        <MedButton title="Go Back" type="outline" onPress={() => router.back()} style={{ marginTop: 8 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <MedText variant="h2" style={[styles.topTitle, { color: theme.text }]} numberOfLines={1}>
          {center.name}
        </MedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <MedText style={[styles.centerTag, { color: theme.primary }]}>DIAGNOSIS CENTER</MedText>

          {center.address ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={15} color={theme.primary} />
              <MedText variant="body" style={[styles.metaText, { color: theme.textSecondary }]}>
                {center.address}
              </MedText>
            </View>
          ) : null}

          {distanceKm != null ? (
            <View style={styles.metaRow}>
              <Ionicons name="navigate-outline" size={15} color={theme.primary} />
              <MedText variant="body" style={[styles.metaText, { color: theme.primary, fontWeight: '600' }]}>
                {distanceKm.toFixed(1)} km away
              </MedText>
            </View>
          ) : null}

          <MedText variant="h2" style={styles.sectionTitle}>
            Services
          </MedText>
          {services.length === 0 ? (
            <MedText variant="body" style={{ color: theme.muted, textAlign: 'center', marginTop: 10 }}>
              No services listed at this center yet.
            </MedText>
          ) : (
            services.map((item: any) => {
              const price = item.price != null ? `${item.price} ETB` : item.cardPrice != null ? `${item.cardPrice} ETB` : 'Contact center';
              const operational = item.isOperational !== false;
              const isActive = activeService?.id === item.id;
              return (
                <MedCard key={item.id} style={[styles.serviceCard, { backgroundColor: theme.secondaryBg }]}>
                  <View style={styles.serviceHeader}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <MedText variant="body" style={[styles.serviceName, { color: theme.text }]} numberOfLines={1}>
                        {item.name}
                      </MedText>
                      <MedText variant="metadata" numberOfLines={1} style={{ marginTop: 2, textTransform: 'capitalize' }}>
                        {(item.category || '').replace('_', ' ')} • {price} • {item.duration || 30} min
                      </MedText>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: operational ? '#ECFDF3' : '#FEF3F2' }]}>
                      <View style={[styles.statusDot, { backgroundColor: operational ? '#16A34A' : '#DC2626' }]} />
                      <MedText variant="metadata" style={{ color: operational ? '#027A48' : '#D92D20', fontWeight: '700' }}>
                        {operational ? 'Available' : 'Unavailable'}
                      </MedText>
                    </View>
                  </View>
                  <Pressable
                    disabled={!operational}
                    style={[
                      styles.bookBtn,
                      { backgroundColor: isActive ? '#0B3B6E' : operational ? '#1E56A0' : '#D1D5DB' },
                    ]}
                    onPress={() => {
                      if (isActive) { setActiveService(null); return; }
                      const svcFee = item.hospital?.serviceFee?.amount != null
                        ? Number(item.hospital.serviceFee.amount)
                        : typeof item.serviceFee === 'number'
                          ? item.serviceFee
                          : undefined;
                      setActiveService({
                        id: item.id,
                        name: item.name,
                        category: item.category,
                        price: Number(item.price ?? 0),
                        serviceFee: svcFee,
                      });
                    }}
                  >
                    <MedText style={styles.bookBtnText}>
                      {isActive ? 'Cancel Booking' : operational ? 'Book' : 'Unavailable'}
                    </MedText>
                  </Pressable>
                </MedCard>
              );
            })
          )}

          {activeService ? (
            <EquipmentBookingCard item={activeService} />
          ) : null}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { flex: 1 },
  content: { padding: 20 },
  centerTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaText: { fontSize: 14, flex: 1 },
  sectionTitle: { marginTop: 24, marginBottom: 12 },
  serviceCard: { marginBottom: 12, padding: 16 },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  serviceName: { fontSize: 16, fontWeight: '600' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  bookBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});