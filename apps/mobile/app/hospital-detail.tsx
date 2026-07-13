import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';

import { MedText } from '../components/medconnect/MedText';
import { MedCard } from '../components/medconnect/MedCard';
import { MedButton } from '../components/medconnect/MedButton';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { AppDispatch, RootState } from '../store';
import { fetchHospitalDetail } from '../store/slices/equipmentSlice';
import { BASE_URL } from '../constants/api';

export default function HospitalDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const { hospitals, loading } = useSelector((state: RootState) => state.equipment);
  const hospital = hospitals.find((h) => h.id === parseInt(id as string));

  useEffect(() => {
    dispatch(fetchHospitalDetail(parseInt(id as string)));
  }, [dispatch, id]);

  const openInMaps = () => {
    if (!hospital) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${hospital.name}@${hospital.latitude},${hospital.longitude}`,
      android: `geo:0,0?q=${hospital.latitude},${hospital.longitude}(${hospital.name})`,
    });
    if (url) Linking.openURL(url);
  };

  const callHospital = () => {
    if (hospital?.phone) Linking.openURL(`tel:${hospital.phone}`);
  };

  if (!hospital && loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <MedText variant="body">Loading hospital details...</MedText>
      </View>
    );
  }

  if (!hospital) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <MedText variant="h2">Hospital not found</MedText>
        <MedButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ 
              uri: hospital.photo 
                ? `${BASE_URL}${hospital.photo}` 
                : 'https://images.unsplash.com/photo-1587350859728-117622bc93cf?q=80&w=800&auto=format&fit=crop' 
            }}
            style={styles.image}
          />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <MedText variant="h1">{hospital.name}</MedText>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={theme.primary} />
            <MedText variant="body" style={{ marginLeft: 4, flex: 1 }}>
              {hospital.address}, {hospital.city}
            </MedText>
          </View>

          <View style={styles.actionRow}>
            <MedButton 
              title="Call Now" 
              variant="outline" 
              style={{ flex: 1, marginRight: 8 }} 
              onPress={callHospital}
              icon={<Ionicons name="call-outline" size={18} color={theme.primary} />}
            />
            <MedButton 
              title="Directions" 
              style={{ flex: 1 }} 
              onPress={openInMaps}
              icon={<Ionicons name="map-outline" size={18} color="#FFF" />}
            />
          </View>

          <MedText variant="h2" style={styles.sectionTitle}>About</MedText>
          <MedText variant="body" style={{ color: theme.muted }}>
            {hospital.description || 'No description available for this facility.'}
          </MedText>

          <MedText variant="h2" style={styles.sectionTitle}>Location</MedText>
          <MedCard style={styles.mapCard}>
            {/* <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: hospital.latitude,
                longitude: hospital.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: hospital.latitude,
                  longitude: hospital.longitude,
                }}
                title={hospital.name}
              />
            </MapView> */}
            <Pressable style={styles.mapOverlay} onPress={openInMaps}>
              <MedText variant="body" style={{ textAlign: 'center', marginTop: 80 }}>Map disabled (Rebuild required)</MedText>
            </Pressable>
          </MedCard>

          <MedText variant="h2" style={styles.sectionTitle}>Medical Equipment</MedText>
          {hospital.equipment?.map((eq) => (
            <MedCard key={eq.id} style={styles.equipmentCard}>
              <View style={styles.eqHeader}>
                <MedText variant="h2" style={{ flex: 1 }}>{eq.name}</MedText>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: eq.isOperational ? '#ECFDF3' : '#FEF3F2' }
                ]}>
                  <MedText 
                    variant="metadata" 
                    style={{ color: eq.isOperational ? '#027A48' : '#D92D20', fontWeight: 'bold' }}
                  >
                    {eq.isOperational ? 'OPERATIONAL' : 'MAINTENANCE'}
                  </MedText>
                </View>
              </View>
              <MedText variant="metadata" style={{ color: theme.primary, marginBottom: 8 }}>
                {eq.category.replace('_', ' ')}
              </MedText>
              <MedText variant="body" style={{ color: theme.muted }}>
                {eq.description || 'Available for patients requiring specialized care.'}
              </MedText>
            </MedCard>
          ))}
          
          {(!hospital.equipment || hospital.equipment.length === 0) && (
            <MedText variant="body" style={{ color: theme.muted, textAlign: 'center', marginTop: 10 }}>
              No specialized equipment listed for this facility.
            </MedText>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    height: 250,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    marginTop: -20,
    backgroundColor: '#F9F7F2', // Match theme.background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    marginTop: 32,
    marginBottom: 12,
  },
  mapCard: {
    padding: 0,
    overflow: 'hidden',
    height: 200,
    borderRadius: 16,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  equipmentCard: {
    marginBottom: 12,
    padding: 16,
  },
  eqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
