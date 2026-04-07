export const colors = {
  primary: '#6c63ff',
  primaryDark: '#5a52e0',
  primaryLight: 'rgba(108, 99, 255, 0.1)',
  bg: '#ffffff',
  bgLight: '#f7f8fc',
  textPrimary: '#1a1a1a',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  success: '#22c55e',
  urgent: '#ff6b6b',
  warning: '#f59e0b',
  white: '#ffffff',
  overlay: 'rgba(0,0,0,0.4)',
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
  sm: 8,
  md: 12,
  lg: 20,
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
} as const

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}
