/**
 * Design tokens mirroring the Telegram mini-app (tg-mini-app/css/styles.css):
 * light = Telegram light theme (blue tint), dark = "Ink" design system.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B1E33',
    textSecondary: '#5A6B80',
    background: '#EAF2FB',
    surface: '#FFFFFF',
    secondaryBg: '#F2F4F7',
    primary: '#1565C0',
    secondary: '#1E5A8A',
    muted: '#5A6B80',
    hint: '#5A6B80',
    success: '#027A48',
    danger: '#E53935',
    tint: '#1565C0',
    icon: '#1565C0',
    tabIconDefault: '#8CA3BD',
    tabIconSelected: '#1565C0',
    border: '#D8E3F0',
  },
  dark: {
    // Ink design system (Telegram dark)
    text: '#F5F5F5',
    textSecondary: '#8E8E93',
    background: '#18191C',
    surface: '#1F2023',
    secondaryBg: '#26272B',
    primary: '#5AA9E6',
    secondary: '#5AA9E6',
    muted: '#8E8E93',
    hint: '#8E8E93',
    success: '#5FCB77',
    danger: '#F0645F',
    tint: '#5AA9E6',
    icon: '#5AA9E6',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#5AA9E6',
    border: 'rgba(255,255,255,0.08)',
  },
};

export const Fonts = {
  primary: Platform.select({
    ios: 'Inter',
    android: 'Inter',
    default: 'System',
  }),
  secondary: Platform.select({
    ios: 'Inter',
    android: 'sans-serif',
    default: 'System',
  }),
};