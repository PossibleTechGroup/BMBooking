/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B1E33',
    textSecondary: '#5A6B80',
    background: '#EAF2FB', // Light hospital blue
    surface: '#FFFFFF',    // Pure white for elevation
    primary: '#1565C0',    // Hospital blue
    secondary: '#1E5A8A',  // Deep hospital blue
    muted: '#8CA3BD',
    success: '#027A48',    // Clinical emerald green
    tint: '#1565C0',
    icon: '#1565C0',
    tabIconDefault: '#8CA3BD',
    tabIconSelected: '#1565C0',
    border: '#D8E3F0',
  },
  dark: {
    // Keeping dark mode for completeness, though spec focuses on light
    text: '#EAF2FB',
    textSecondary: '#9DB4CF',
    background: '#0B1E33',
    surface: '#12304F',
    primary: '#4DA3FF',
    secondary: '#6FB1F2',
    muted: '#8CA3BD',
    success: '#4ADE80',
    tint: '#4DA3FF',
    icon: '#4DA3FF',
    tabIconDefault: '#8CA3BD',
    tabIconSelected: '#4DA3FF',
    border: '#1E4A78',
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
