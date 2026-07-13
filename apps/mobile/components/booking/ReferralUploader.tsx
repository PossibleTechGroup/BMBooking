import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { MedText } from '../medconnect/MedText';
import { MedCard } from '../medconnect/MedCard';
import { MedButton } from '../medconnect/MedButton';
import { RootState } from '../../store';
import { BASE_URL } from '../../constants/api';

interface ReferralUploaderProps {
  attachments: string[];
  onAttachmentsChange: (urls: string[]) => void;
  onContinue: () => void;
  onSkip: () => void;
}

export default function ReferralUploader({
  attachments,
  onAttachmentsChange,
  onContinue,
  onSkip,
}: ReferralUploaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const token = useSelector((state: RootState) => state.auth.token);

  const [uploading, setUploading] = useState(false);
  const [pickedUris, setPickedUris] = useState<string[]>([]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map((a) => a.uri);
      setPickedUris((prev) => [...prev, ...uris]);
    }
  };

  const removePicked = (uri: string) => {
    setPickedUris((prev) => prev.filter((u) => u !== uri));
  };

  const removeUploaded = (url: string) => {
    onAttachmentsChange(attachments.filter((a) => a !== url));
  };

  const uploadAll = async () => {
    if (pickedUris.length === 0) {
      onContinue();
      return;
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const uri of pickedUris) {
        const filename = uri.split('/').pop() || 'referral.jpg';
        const ext = filename.split('.').pop() || 'jpg';

        const formData = new FormData();
        formData.append('file', {
          uri,
          name: `referral-${Date.now()}.${ext}`,
          type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        } as any);

        const resp = await fetch(`${BASE_URL}/api/appointments/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const json = await resp.json();
        if (json.status === 'success' && json.data?.url) {
          uploaded.push(json.data.url);
        }
      }
      onAttachmentsChange([...attachments, ...uploaded]);
      setPickedUris([]);
      onContinue();
    } catch (err: any) {
      console.error('[REFERRAL] Upload failed:', err.message);
      Alert.alert(
        'Upload Failed',
        'Could not upload referral images. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(false);
    }
  };

  const hasPending = pickedUris.length > 0;
  const totalCount = attachments.length + pickedUris.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MedText variant="h1">Referral Documents</MedText>
          <MedText variant="body" style={{ marginTop: 8, lineHeight: 22 }}>
            If you have referral documents from another hospital, you can attach them here. This is optional.
          </MedText>
        </View>

        <MedCard style={{ marginTop: 24, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primary + '10' }]}>
              <Ionicons name="document-attach" size={22} color={theme.primary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <MedText variant="body" style={{ fontSize: 16, fontWeight: '500' }}>Referral Images</MedText>
              <MedText variant="metadata" style={{ color: theme.muted, marginTop: 2 }}>
                {totalCount > 0 ? `${totalCount} file${totalCount !== 1 ? 's' : ''} selected` : 'No files attached'}
              </MedText>
            </View>
          </View>

          {attachments.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <MedText variant="metadata" style={{ marginBottom: 8 }}>Uploaded</MedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {attachments.map((url, i) => (
                  <View key={i} style={styles.thumbnailWrapper}>
                    <Image source={{ uri: `${BASE_URL}${url}` }} style={styles.thumbnail} />
                    <Pressable
                      onPress={() => removeUploaded(url)}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="close-circle" size={22} color="#B42318" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {pickedUris.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <MedText variant="metadata" style={{ marginBottom: 8, color: theme.muted, fontWeight: '600' }}>PENDING UPLOAD</MedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {pickedUris.map((uri, i) => (
                  <View key={i} style={styles.thumbnailWrapper}>
                    <Image source={{ uri }} style={styles.thumbnail} />
                    <Pressable
                      onPress={() => removePicked(uri)}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="close-circle" size={22} color="#B42318" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Pressable
            onPress={pickImages}
            style={[styles.addBtn, { borderColor: theme.border }]}
          >
            <Ionicons name="camera-outline" size={20} color={theme.primary} />
            <MedText variant="body" style={{ marginLeft: 8, color: theme.primary, fontWeight: '600' }}>
              Add Referral Images
            </MedText>
          </Pressable>

          {hasPending && (
            <MedButton
              title={uploading ? 'Uploading...' : `Upload ${pickedUris.length} File${pickedUris.length !== 1 ? 's' : ''}`}
              onPress={uploadAll}
              loading={uploading}
              style={{ marginTop: 16 }}
            />
          )}

          {uploading && (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 12 }} />
          )}
        </MedCard>

        <MedButton
          title={totalCount > 0 ? 'Continue with Referrals' : 'Skip — No Referrals'}
          onPress={totalCount > 0 && hasPending ? uploadAll : onContinue}
          disabled={uploading}
          style={{ marginTop: 24 }}
        />
        <Pressable onPress={onSkip} style={{ alignItems: 'center', marginTop: 16, padding: 8 }}>
          <MedText variant="body" style={{ color: theme.muted }}>Skip this step</MedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 11,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
});
