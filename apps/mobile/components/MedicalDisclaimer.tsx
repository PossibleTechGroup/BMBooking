import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MedText } from './medconnect/MedText';
import { useColorScheme } from '../hooks/use-color-scheme';
import { Colors } from '../constants/theme';

interface Props {
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function MedicalDisclaimer({ style, compact = false }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F8FAFC',
          borderColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
        },
        style,
      ]}
    >
      <Ionicons
        name="information-circle-outline"
        size={18}
        color={theme.primary}
        style={styles.icon}
      />
      <View style={styles.content}>
        <MedText variant="metadata" style={[styles.title, { color: theme.text }]}>
          Medical Disclaimer
        </MedText>
        <MedText variant="metadata" style={[styles.body, { color: theme.textSecondary }]}>
          BM Booking is strictly an appointment booking platform for physical healthcare facilities. We do not provide medical advice, diagnosis, or clinical treatments. Always consult a qualified physician for any health questions.
        </MedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 12,
    gap: 10,
  },
  icon: {
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 12,
    lineHeight: 17,
  },
});
