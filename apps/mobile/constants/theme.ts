/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#101828',
    textSecondary: '#667085',
    background: '#F9F7F2', // Warm, paper-like off-white
    surface: '#FFFFFF',    // Pure white for elevation
    primary: '#1A1A1A',    // Deep charcoal
    secondary: '#3E5C76',  // Muted slate blue
    muted: '#98A2B3',
    success: '#027A48',    // Clinical emerald green
    tint: '#1A1A1A',
    icon: '#1A1A1A',
    tabIconDefault: '#98A2B3',
    tabIconSelected: '#1A1A1A',
    border: '#E4E7EC',
  },
  dark: {
    // Keeping dark mode for completeness, though spec focuses on light
    text: '#F9F7F2',
    textSecondary: '#98A2B3',
    background: '#1A1A1A',
    surface: '#262626',
    primary: '#F9F7F2',
    secondary: '#3E5C76',
    muted: '#667085',
    success: '#027A48',
    tint: '#F9F7F2',
    icon: '#F9F7F2',
    tabIconDefault: '#667085',
    tabIconSelected: '#F9F7F2',
    border: '#344054',
  },
};

export const Fonts = {
  primary: Platform.select({
    ios: 'Inter',
    android: 'Inter',
    default: 'System',
  }),
  secondary: Platform.select({
    ios: 'SF Pro Display',
    android: 'sans-serif',
    default: 'System',
  }),
};
