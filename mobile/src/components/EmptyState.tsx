import { StyleSheet, Text, View } from 'react-native'
import { colors, fontSizes, fontWeights, spacing } from '../constants/theme'

type Props = {
  title: string
  description?: string
}

export function EmptyState({ title, description }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
})
