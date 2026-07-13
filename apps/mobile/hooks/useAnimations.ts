import { useCallback } from 'react';
import {
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeInDown,
  FadeInUp,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  FadeOut,
  SlideOutLeft,
  SlideOutDown,
  LightSpeedOutLeft,
  Layout,
} from 'react-native-reanimated';

export const SPRING_CONFIG = {
  mass: 1.0,
  stiffness: 190.0,
  damping: 14.0,
};

export const SPRING_SNAPPY = {
  mass: 0.8,
  stiffness: 250,
  damping: 18,
};

export const SPRING_GENTLE = {
  mass: 1.2,
  stiffness: 150,
  damping: 20,
};

export function usePopAnimation() {
  const scale = useSharedValue(1);

  const popIn = useCallback(() => {
    scale.value = withSpring(1, SPRING_SNAPPY);
  }, [scale]);

  const popOut = useCallback((onFinished?: () => void) => {
    scale.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished && onFinished) onFinished();
    });
  }, [scale]);

  return { scale, popIn, popOut };
}

export function useSlideAnimation() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const slideInRight = useCallback(() => {
    translateX.value = withSpring(0, SPRING_CONFIG);
    opacity.value = withTiming(1, { duration: 300 });
  }, [translateX, opacity]);

  const slideOutLeft = useCallback(() => {
    translateX.value = withTiming(-100, { duration: 250 });
    opacity.value = withTiming(0, { duration: 200 });
  }, [translateX, opacity]);

  const slideInUp = useCallback((from = 100) => {
    translateY.value = withSpring(0, SPRING_CONFIG);
    opacity.value = withTiming(1, { duration: 300 });
  }, [translateY, opacity]);

  return { translateX, translateY, opacity, slideInRight, slideOutLeft, slideInUp };
}

export function useShakeAnimation() {
  const translateX = useSharedValue(0);

  const shake = useCallback(() => {
    translateX.value = withSequence(
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [translateX]);

  return { translateX, shake };
}

export function usePulseAnimation(intensity = 1.05, period = 3000) {
  const scale = useSharedValue(1);

  const startPulse = useCallback(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(intensity, { duration: period / 2 }),
        withTiming(1, { duration: period / 2 })
      ),
      -1,
      true
    );
  }, [scale, intensity, period]);

  const stopPulse = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  return { scale, startPulse, stopPulse };
}

export const ReanimatedLayout = Layout.springify(SPRING_CONFIG);

export const FadeInDownSpring = FadeInDown.springify(SPRING_CONFIG);
export const FadeInUpSpring = FadeInUp.springify(SPRING_CONFIG);
export const SlideInDownSpring = SlideInDown.springify(SPRING_CONFIG);
export const SlideInLeftSpring = SlideInLeft.springify(SPRING_CONFIG);
export const SlideInRightSpring = SlideInRight.springify(SPRING_CONFIG);

export const FadeOutFast = FadeOut.duration(150);
export const SlideOutLeftFast = SlideOutLeft.duration(200);
export const SlideOutDownSpring = SlideOutDown.springify(SPRING_CONFIG);
