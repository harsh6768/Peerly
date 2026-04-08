/** Premium Cirvo mobile theme — indigo primary, soft lavender canvas (aligned with web PWA). */
export const colors = {
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryMuted: '#6366F1',
  primaryLight: 'rgba(79, 70, 229, 0.12)',
  canvas: '#F3F0FF',
  bg: '#FFFFFF',
  bgLight: '#F8F7FC',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: 'rgba(226, 232, 240, 0.95)',
  borderStrong: '#E2E8F0',
  success: '#16A34A',
  successSoft: 'rgba(22, 163, 74, 0.12)',
  urgent: '#EF4444',
  warning: '#D97706',
  white: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
  tabBarBg: 'rgba(255, 255, 255, 0.96)',
  findRoomTint: 'rgba(79, 70, 229, 0.08)',
  hostTint: 'rgba(22, 163, 74, 0.08)',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const radius = {
  sm: 10,
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
} as const

export const fontSizes = {
  xs: 12,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 32,
} as const

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

export const shadows = {
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 6,
  },
  tabBar: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 16,
  },
}
