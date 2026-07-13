import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { MedButton } from "../../components/medconnect/MedButton";
import { MedCard } from "../../components/medconnect/MedCard";
import { MedText } from "../../components/medconnect/MedText";
import { MedInput } from "../../components/medconnect/MedInput";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { RootState } from "../../store";
import { BASE_URL } from "../../constants/api";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";

export default function DoctorProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const { doctors } = useSelector((state: RootState) => state.doctors);
  const { token } = useSelector((state: RootState) => state.auth);
  const doctor = useMemo(() => doctors.find((d) => d.id.toString() === id), [doctors, id]);

  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [completedAppointmentId, setCompletedAppointmentId] = useState<number | null>(null);

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await axios.get(`${BASE_URL}/api/reviews/doctor/${id}`);
      setReviews(response.data.data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  React.useEffect(() => {
    loadReviews();
  }, [id]);

  React.useEffect(() => {
    if (!token || !id) return;
    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/appointments/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const appts: any[] = res.data.data || [];
        const completed = appts.find(
          (a: any) => a.doctorId === parseInt(id as string) && a.status === "completed"
        );
        if (completed) {
          setCompletedAppointmentId(completed.id);
        }
      } catch (_) {}
    })();
  }, [token, id]);

  const existingReview = useMemo(() => {
    if (!completedAppointmentId) return null;
    return reviews.find((r: any) => r.appointmentId === completedAppointmentId) || null;
  }, [reviews, completedAppointmentId]);

  React.useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    }
  }, [existingReview]);

  const handleSubmitReview = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!token) {
      setErrorMessage(t('loginToSubmitReview'));
      return;
    }
    try {
      setSubmitting(true);
      await axios.post(`${BASE_URL}/api/reviews`, {
        doctorId: id,
        rating,
        comment,
        appointmentId: completedAppointmentId || undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComment('');
      setRating(5);
      setSuccessMessage(existingReview ? 'Your review has been updated.' : 'Thank you! Your review has been submitted.');
      loadReviews();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit review';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const anonymizeName = (fullName: string) => {
    if (!fullName) return "Patient";
    const parts = fullName.split(" ");
    if (parts.length < 2) return fullName;
    return `${parts[0]} ${parts[1][0]}.`;
  };

  if (!doctor) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <MedText variant="h2">{t('doctorNotFound')}</MedText>
        <MedButton title={t('goBack')} onPress={() => router.back()} style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <MedText variant="h2">{t('doctorProfile')}</MedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Intro Video Section */}
        <View style={styles.videoContainer}>
          {doctor.introVideo ? (
            <Video
              source={{ uri: `${BASE_URL}${doctor.introVideo}` }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={false}
            />
          ) : (
            <View style={[styles.videoPlaceholder, { backgroundColor: theme.surface }]}>
              <Ionicons name="videocam-outline" size={48} color={theme.muted} />
              <MedText variant="metadata" color={theme.muted}>{t('noVideoAvailable')}</MedText>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Profile Basic Info */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {doctor.profilePicture ? (
                <Image 
                  source={{ uri: `${BASE_URL}${doctor.profilePicture}` }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface }]}>
                  <Ionicons name="person" size={40} color={theme.muted} />
                </View>
              )}
            </View>
            <View style={styles.basicInfo}>
              <MedText variant="h1">{doctor.fullName}</MedText>
              <MedText variant="body" color={theme.primary} style={{ fontWeight: '600' }}>
                {(doctor.specializations && doctor.specializations.length > 0) ? doctor.specializations.join(", ") : doctor.specialization}
              </MedText>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <MedText variant="body" style={{ marginLeft: 4, fontWeight: '700' }}>
                  {doctor.rating || '0.0'}
                </MedText>
                <MedText variant="metadata" color={theme.muted} style={{ marginLeft: 4 }}>
                  ({doctor.totalReviews || 0} {t('reviews')})
                </MedText>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { borderColor: theme.border }]}>
              <MedText variant="h2" color={theme.primary}>{doctor.experienceYears}+</MedText>
              <MedText variant="metadata" color={theme.muted}>{t('yearsExpLabel')}</MedText>
            </View>
            {doctor.hospital?.cardPrice && (
              <View style={[styles.statBox, { borderColor: theme.border }]}>
                <MedText variant="h2" color={theme.primary}>{doctor.hospital.cardPrice}</MedText>
                <MedText variant="metadata" color={theme.muted}>{t('etbVisit')}</MedText>
              </View>
            )}
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <MedText variant="h2" style={styles.sectionTitle}>{t('aboutDoctor')}</MedText>
            <MedText variant="body" color={theme.muted}>
              {doctor.bio || t('noBioAvailable')}
            </MedText>
          </View>

          {/* Clinic Details — show hospital */}
          {doctor.hospital?.name && (
            <View style={styles.section}>
              <MedText variant="h2" style={styles.sectionTitle}>{t('clinicDetails')}</MedText>
              <MedCard style={styles.clinicCard}>
                <View style={styles.clinicRow}>
                  <Ionicons name="business-outline" size={20} color={theme.primary} />
                  <MedText variant="body" color={theme.muted} style={{ marginLeft: 12 }}>
                    {doctor.hospital.name}
                  </MedText>
                </View>
              </MedCard>
            </View>
          )}

          {/* Availability Summary */}
          {doctor.availability && doctor.availability.length > 0 && (
            <View style={styles.section}>
              <MedText variant="h2" style={styles.sectionTitle}>{t('availability')}</MedText>
              {doctor.availability.map((slot: any, idx: number) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ width: 90 }}>
                    <MedText variant="body" style={{ fontWeight: '600' }}>{slot.day}</MedText>
                  </View>
                  <MedText variant="body" color={theme.muted}>
                    {slot.startTime?.substring(0, 5)} - {slot.endTime?.substring(0, 5)}
                  </MedText>
                </View>
              ))}
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <MedText variant="h2">{t('patientExperiences')}</MedText>
                <MedText variant="metadata" color={theme.primary}>
                  {reviews.length} {t('all')}
                </MedText>
              </View>
            </View>

            {/* Quick Add Review Section */}
            {token ? (
              <MedCard style={styles.quickReviewCard}>
                <MedText variant="h2" style={{ fontSize: 18, marginBottom: 4 }}>{t('howWasExperience')}</MedText>
                <MedText variant="body" color={theme.muted} style={{ marginBottom: 16 }}>{t('shareFeedback')}</MedText>
                
                {existingReview ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FEF3C7', borderRadius: 8, alignSelf: 'flex-start' }}>
                    <Ionicons name="create-outline" size={14} color="#92400E" />
                    <MedText variant="metadata" style={{ color: '#92400E', marginLeft: 4, fontWeight: '500' }}>{t('editingReview')}</MedText>
                  </View>
                ) : null}

                {errorMessage ? (
                  <View style={{ padding: 12, backgroundColor: '#FEF3F2', borderRadius: 12, marginBottom: 12 }}>
                    <MedText variant="body" style={{ color: '#B42318', fontSize: 13 }}>{errorMessage}</MedText>
                  </View>
                ) : null}

                {successMessage ? (
                  <View style={{ padding: 12, backgroundColor: '#ECFDF3', borderRadius: 12, marginBottom: 12 }}>
                    <MedText variant="body" style={{ color: '#027A48', fontSize: 13 }}>{successMessage}</MedText>
                    <MedButton
                      title="View My Appointments"
                      onPress={() => router.push('/(tabs)/appointments')}
                      style={{ marginTop: 8 }}
                    />
                  </View>
                ) : null}

                <View style={styles.inlineStarRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)} style={{ padding: 4 }}>
                      <Ionicons 
                        name={s <= rating ? "star" : "star-outline"} 
                        size={32} 
                        color={s <= rating ? "#F59E0B" : theme.border} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <MedInput
                  label={t('yourComment')}
                  placeholder={t('tellUsVisit')}
                  multiline
                  value={comment}
                  onChangeText={setComment}
                />

                <MedButton 
                  title={existingReview ? t('updateReview') || 'Update Review' : t('submitFeedback')} 
                  onPress={handleSubmitReview}
                  loading={submitting}
                  style={{ marginTop: 8 }}
                  disabled={!comment.trim()}
                />
              </MedCard>
            ) : (
              <MedCard style={[styles.quickReviewCard, { alignItems: 'center', paddingVertical: 24 }]}>
                <Ionicons name="lock-closed-outline" size={32} color={theme.muted} />
                <MedText variant="body" color={theme.muted} style={{ marginTop: 12, textAlign: 'center' }}>
                  {t('loginToShare')}
                </MedText>
                <MedButton 
                  title={t('loginNow')} 
                  onPress={() => router.push('/login')} 
                  variant="outline"
                  size="small"
                  style={{ marginTop: 16 }}
                />
              </MedCard>
            )}
            
            {loadingReviews ? (
              <ActivityIndicator color={theme.primary} />
            ) : reviews.length > 0 ? (
              reviews.map((rev) => (
                <MedCard key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <MedText variant="h2" style={{ fontSize: 16 }}>
                      {anonymizeName(rev.patient?.patientProfile?.fullName)}
                    </MedText>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons 
                          key={s} 
                          name="star" 
                          size={12} 
                          color={s <= rev.rating ? "#F59E0B" : theme.border} 
                        />
                      ))}
                    </View>
                  </View>
                  <MedText variant="body" color={theme.text} style={{ marginTop: 8 }}>
                    {rev.comment}
                  </MedText>
                  <MedText variant="metadata" color={theme.muted} style={{ marginTop: 12 }}>
                    {formatDistanceToNow(new Date(rev.createdAt))} ago
                  </MedText>
                </MedCard>
              ))
            ) : (
              <MedText variant="body" color={theme.muted}>{t('noReviewsYet')}</MedText>
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Book Button */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <MedButton 
          title={doctor.hospital?.cardPrice ? `${t('bookAppointment')} - ${doctor.hospital.cardPrice} ETB` : t('bookAppointment')}
          onPress={() => {
            router.push({
              pathname: "/modal",
              params: { 
                doctorId: doctor.id,
                doctorName: doctor.fullName,
                doctorFee: doctor.hospital?.cardPrice
              },
            });
          }} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  videoContainer: {
    width: '100%',
    height: 240,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  content: {
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  basicInfo: {
    flex: 1,
    gap: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  clinicCard: {
    padding: 16,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    borderTopWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewCard: {
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  quickReviewCard: {
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  inlineStarRow: {
    flexDirection: 'row',
    marginBottom: 16,
    marginLeft: -4,
  },
});
