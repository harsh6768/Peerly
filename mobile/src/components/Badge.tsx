import { StyleSheet, Text, View } from 'react-native'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'

type BadgeTone = 'primary' | 'green' | 'amber' | 'red' | 'gray'

const toneStyles: Record<BadgeTone, { bg: string; text: string }> = {
  primary: { bg: 'rgba(108, 99, 255, 0.12)', text: colors.primaryDark },
  green: { bg: 'rgba(34, 197, 94, 0.12)', text: '#16a34a' },
  amber: { bg: 'rgba(245, 158, 11, 0.14)', text: '#b45309' },
  red: { bg: 'rgba(255, 107, 107, 0.14)', text: '#dc2626' },
  gray: { bg: colors.bgLight, text: colors.textSecondary },
}

type Props = {
  tone?: BadgeTone
  children: string
}

export function Badge({ tone = 'primary', children }: Props) {
  const { bg, text } = toneStyles[tone]
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  text: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.2,
  },
})
