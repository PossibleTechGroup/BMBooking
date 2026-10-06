import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import { MedText } from '../components/medconnect/MedText';
import { MedCard } from '../components/medconnect/MedCard';
import { MedButton } from '../components/medconnect/MedButton';
import { DoctorAvatar } from '../components/doctor/DoctorAvatar';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { AppDispatch, RootState } from '../store';
import { fetchHospitalById } from '../store/slices/hospitalSlice';
import { fetchDoctors } from '../store/slices/doctorSlice';
import { fetchHospitalDetail } from '../store/slices/equipmentSlice';
import { getAssetUrl } from '../constants/api';

export default function HospitalDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const hospital = useSelector((state: RootState) => state.hospitals.selected);
  const loading = useSelector((state: RootState) => state.hospitals.loading);
  const hospitalError = useSelector((state: RootState) => state.hospitals.error);
  const allDoctors = useSelector((state: RootState) => state.doctors.doctors);
  const equipmentHospitals = useSelector((state: RootState) => state.equipment?.hospitals || []);
  const equipmentLoading = useSelector((state: RootState) => state.equipment?.loading || false);

  useEffect(() => {
    const hospitalId = parseInt(id as string);
    dispatch(fetchHospitalById(hospitalId));
    dispatch(fetchHospitalDetail(hospitalId));
  }, [dispatch, id]);

  useEffect(() => {
    if (allDoctors.length === 0) dispatch(fetchDoctors());
  }, [dispatch, allDoctors.length]);

  const hospitalEquipment = useMemo(
    () => equipmentHospitals.find((h: any) => String(h.id) === String(id))?.equipment || [],
    [equipmentHospitals, id]
  );

  const doctors = useMemo(() => {
    if (hospital?.doctors && hospital.doctors.length > 0) return hospital.doctors;
    const hId = hospital?.id;
    if (hId == null) return [];
    return allDoctors.filter((d: any) => d.hospital?.id === hId);
  }, [hospital, allDoctors]);

  const openInMaps = () => {
    if (!hospital) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${hospital.name}@${hospital.latitude},${hospital.longitude}`,
      android: `geo:0,0?q=${hospital.latitude},${hospital.longitude}(${hospital.name})`,
    });
    if (url) Linking.openURL(url);
  };

  if (loading && !hospital) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!hospital) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Ionicons name="cloud-offline-outline" size={40} color={theme.textSecondary} />
        <MedText variant="h2" style={{ marginTop: 12 }}>
          {hospitalError || 'Hospital not found'}
        </MedText>
        <MedButton
          title="Retry"
          onPress={() => dispatch(fetchHospitalById(parseInt(id as string)))}
          style={{ marginTop: 16 }}
        />
        <MedButton title="Go Back" type="outline" onPress={() => router.back()} style={{ marginTop: 8 }} />
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
              uri: hospital.image
                ? getAssetUrl(hospital.image)
                : 'https://images.unsplash.com/photo-1587350859728-117622bc93cf?q=80&w=800&auto=format&fit=crop'
            }}
            style={styles.image}
          />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
        </View>

        <View style={[styles.content, { backgroundColor: theme.background }]}>
          <MedText variant="h1">{hospital.name}</MedText>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={theme.primary} />
            <MedText variant="body" style={{ marginLeft: 4, flex: 1 }}>
              {hospital.address}
            </MedText>
          </View>

          {(hospital.rating || 0) > 0 || (hospital.totalReviews || 0) > 0 ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <MedText variant="body" style={{ marginLeft: 4, fontWeight: '600' }}>
                {Number(hospital.rating).toFixed(1)}
              </MedText>
              <MedText variant="metadata" style={{ marginLeft: 6 }}>
                ({hospital.totalReviews || 0} reviews)
              </MedText>
            </View>
          ) : null}

          {hospital.services && hospital.services.length > 0 && (
            <View style={styles.chipsWrap}>
              {hospital.services.map((s, idx) => (
                <View key={idx} style={[styles.chip, { backgroundColor: theme.primary + '12' }]}>
                  <MedText style={{ color: theme.primary, fontWeight: '600' }}>{s}</MedText>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionRow}>
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

          <MedText variant="h2" style={styles.sectionTitle}>
            Doctors at {hospital.name}
          </MedText>
          {doctors.length > 0 ? (
            doctors.map((d: any) => (
              <Pressable
                key={d.id}
                onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: d.id } })}
              >
                <MedCard style={styles.doctorCard}>
                  <View style={styles.doctorTop}>
                    <DoctorAvatar
                      uri={d.profilePicture ? getAssetUrl(d.profilePicture) : null}
                      initials={(d.fullName || '')
                        .split(' ')
                        .map((w: string) => w[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                      theme={theme}
                      style={[styles.doctorAvatar, { backgroundColor: theme.secondaryBg }]}
                      imageStyle={styles.doctorAvatarImage}
                      initialsStyle={styles.doctorInitials}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <MedText variant="body" style={[styles.doctorName, { color: theme.text }]} numberOfLines={1}>
                        {d.fullName}
                      </MedText>
                      <MedText variant="metadata" numberOfLines={1} style={{ marginTop: 2 }}>
                        {d.specialization || (d.specializations || []).join(', ') || 'General'}
                      </MedText>
                      <View style={styles.doctorMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="star" size={13} color="#F59E0B" />
                          <MedText variant="metadata" style={styles.metaText}>
                            {d.rating ? Number(d.rating).toFixed(1) : '0.0'}{' '}
                            ({d.totalReviews || 0} reviews)
                          </MedText>
                        </View>
                        {d.experienceYears != null && (
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={13} color={theme.textSecondary} />
                            <MedText variant="metadata" style={styles.metaText}>
                              {d.experienceYears} yrs
                            </MedText>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={styles.doctorFooter}>
                    <MedText variant="body" style={styles.doctorFee}>
                      {d.baseHourlyRate != null ? `${d.baseHourlyRate} ETB` : 'Contact clinic'}
                    </MedText>
                    <View style={[styles.viewProfileBtn, { borderColor: theme.border }]}>
                      <MedText
                        variant="metadata"
                        style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}
                      >
                        View Profile & Book
                      </MedText>
                      <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                    </View>
                  </View>
                </MedCard>
              </Pressable>
            ))
          ) : (
            <MedText variant="body" style={{ color: theme.muted, textAlign: 'center', marginTop: 10 }}>
              No doctors available at this hospital yet.
            </MedText>
          )}

          <MedText variant="h2" style={styles.sectionTitle}>Services & Equipment</MedText>
          {equipmentLoading && hospitalEquipment.length === 0 ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: 12 }} />
          ) : hospitalEquipment.length > 0 ? (
            hospitalEquipment.map((item: any) => {
              const price = item.price != null ? `${item.price} ETB` : item.cardPrice != null ? `${item.cardPrice} ETB` : 'Contact hospital';
              const operational = item.isOperational !== false;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
                >
                  <MedCard style={[styles.equipmentCard, { backgroundColor: theme.secondaryBg }]}>
                    <View style={styles.eqHeader}>
                      <MedText variant="body" style={[styles.doctorName, { color: theme.text }]} numberOfLines={1}>
                        {item.name}
                      </MedText>
                      <View style={[styles.statusPill, { backgroundColor: operational ? '#ECFDF3' : '#FEF3F2' }]}>
                        <View style={[styles.statusDot, { backgroundColor: operational ? '#16A34A' : '#DC2626' }]} />
                        <MedText variant="metadata" style={{ color: operational ? '#027A48' : '#D92D20', fontWeight: '700' }}>
                          {operational ? 'Available' : 'Unavailable'}
                        </MedText>
                      </View>
                    </View>
                    <MedText variant="metadata" numberOfLines={1} style={{ marginTop: 2, textTransform: 'capitalize' }}>
                      {(item.category || '').replace('_', ' ')} • {price}
                    </MedText>
                  </MedCard>
                </Pressable>
              );
            })
          ) : (
            <MedText variant="body" style={{ color: theme.muted, textAlign: 'center', marginTop: 10 }}>
              No equipment listed at this hospital yet.
            </MedText>
          )}

          <MedText variant="h2" style={styles.sectionTitle}>Reviews</MedText>
          {hospital.reviews && hospital.reviews.length > 0 ? (
            hospital.reviews.map((rev) => (
              <MedCard key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <MedText variant="h2" style={{ flex: 1 }}>{rev.patientName}</MedText>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= rev.rating ? "star" : "star-outline"}
                        size={13}
                        color={s <= rev.rating ? "#F59E0B" : "#D1D5DB"}
                      />
                    ))}
                  </View>
                </View>
                {rev.comment ? (
                  <MedText variant="body" style={{ color: theme.muted, marginTop: 6 }}>
                    {rev.comment}
                  </MedText>
                ) : null}
              </MedCard>
            ))
          ) : (
            <MedText variant="body" style={{ color: theme.muted, textAlign: 'center', marginTop: 10 }}>
              No reviews yet. Complete an appointment here to leave a review.
            </MedText>
          )}

          <MedicalDisclaimer />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  imageContainer: { height: 250, width: '100%' },
  image: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: 20, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  actionRow: { flexDirection: 'row', marginTop: 24, marginBottom: 10 },
  sectionTitle: { marginTop: 32, marginBottom: 12 },
  equipmentCard: { marginBottom: 12, padding: 16 },
  eqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(245,158,11,0.1)' },
  doctorCard: { marginBottom: 12, padding: 14 },
  doctorTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  doctorAvatarImage: { width: '100%', height: '100%' },
  doctorInitials: { fontSize: 17, fontWeight: '700' },
  doctorName: { fontSize: 16, fontWeight: '600' },
  doctorMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: '#5A6B80' },
  doctorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  doctorFee: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  reviewCard: { marginBottom: 12, padding: 14 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  reviewStars: { flexDirection: 'row', gap: 2 },
});
