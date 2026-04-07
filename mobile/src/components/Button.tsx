import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from 'react-native'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

type Props = TouchableOpacityProps & {
  variant?: Variant
  loading?: boolean
  children: string
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  children,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} size="small" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{children}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  secondary: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderColor: 'rgba(220, 38, 38, 0.18)',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    lineHeight: 20,
  },
  primaryText: { color: colors.white },
  secondaryText: { color: colors.textPrimary },
  ghostText: { color: colors.textSecondary },
  dangerText: { color: '#dc2626' },
})
