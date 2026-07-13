import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MedText } from './MedText';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface MedLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const MedLoadingOverlay: React.FC<MedLoadingOverlayProps> = ({ visible, message }) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Reanimated shared values for physics-based spring loop
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const translateY = useSharedValue(0);
  const iconPulse = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Physical spring animations with distinct stiffness/damping for organic look
      scale1.value = withRepeat(
        withSequence(
          withSpring(1.18, { damping: 6, stiffness: 45 }),
          withSpring(0.82, { damping: 6, stiffness: 45 }),
          withSpring(1, { damping: 8, stiffness: 50 })
        ),
        -1,
        false
      );

      scale2.value = withRepeat(
        withDelay(
          200,
          withSequence(
            withSpring(1.22, { damping: 5, stiffness: 40 }),
            withSpring(0.78, { damping: 5, stiffness: 40 }),
            withSpring(1, { damping: 7, stiffness: 45 })
          )
        ),
        -1,
        false
      );

      scale3.value = withRepeat(
        withDelay(
          400,
          withSequence(
            withSpring(1.28, { damping: 4, stiffness: 35 }),
            withSpring(0.72, { damping: 4, stiffness: 35 }),
            withSpring(1, { damping: 6, stiffness: 40 })
          )
        ),
        -1,
        false
      );

      translateY.value = withRepeat(
        withSequence(
          withSpring(-15, { damping: 10, stiffness: 45 }),
          withSpring(10, { damping: 10, stiffness: 45 }),
          withSpring(0, { damping: 12, stiffness: 50 })
        ),
        -1,
        true
      );

      iconPulse.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600, easing: Easing.bezier(0.25, 1, 0.5, 1) }),
          withTiming(1.0, { duration: 600, easing: Easing.bezier(0.25, 1, 0.5, 1) })
        ),
        -1,
        true
      );
    } else {
      scale1.value = 1;
      scale2.value = 1;
      scale3.value = 1;
      translateY.value = 0;
      iconPulse.value = 1;
    }
  }, [visible]);

  // Animated styles mapping
  const bubble1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }, { translateY: translateY.value }],
  }));

  const bubble2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }, { translateY: translateY.value * -0.6 }],
  }));

  const bubble3Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }, { translateY: translateY.value * 0.4 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconPulse.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: '#F9F7F2', borderColor: 'rgba(26, 26, 26, 0.08)' }]}>
          
          {/* Physics Liquid Glass Animation Container */}
          <View style={styles.animationContainer}>
            <Animated.View style={[styles.bubble, styles.bubble1, bubble1Style]} />
            <Animated.View style={[styles.bubble, styles.bubble2, bubble2Style]} />
            <Animated.View style={[styles.bubble, styles.bubble3, bubble3Style]}>
              <Animated.View style={iconStyle}>
                <Ionicons name="cloud-upload-outline" size={28} color="#FFFFFF" />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Text/Status Indicator */}
          <MedText variant="h2" style={{ marginTop: 24, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' }}>
            {message || t('submitProfile')}
          </MedText>
          
          <MedText variant="metadata" style={{ marginTop: 8, color: '#667085', textAlign: 'center', lineHeight: 18 }}>
            Uploading your profile details & media. Please wait...
          </MedText>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    paddingVertical: 44,
    paddingHorizontal: 32,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  animationContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  bubble1: {
    width: 104,
    height: 104,
    backgroundColor: 'rgba(62, 92, 118, 0.12)', // slate blue translucent
  },
  bubble2: {
    width: 82,
    height: 82,
    backgroundColor: 'rgba(26, 26, 26, 0.08)', // dark charcoal translucent
  },
  bubble3: {
    width: 56,
    height: 56,
    backgroundColor: '#1A1A1A', // deep solid charcoal
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
