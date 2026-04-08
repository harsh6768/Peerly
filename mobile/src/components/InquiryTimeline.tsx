import { StyleSheet, Text, View } from 'react-native'
import { colors, fontSizes, fontWeights, spacing } from '../constants/theme'
import {
  type InquiryTimelineEvent,
  formatTimelineDate,
} from '../lib/inquiryTimeline'

type Props = {
  events: InquiryTimelineEvent[]
  /** Highlight the last step as "current" when inquiry is still active */
  emphasizeLatest?: boolean
}

export function InquiryTimeline({ events, emphasizeLatest = true }: Props) {
  if (events.length === 0) return null

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Progress</Text>
      {events.map((ev, index) => {
        const isLast = index === events.length - 1
        const active = emphasizeLatest && isLast
        return (
          <View key={ev.id} style={styles.row}>
            <View style={styles.track}>
              <View style={[styles.dot, active && styles.dotActive]} />
              {!isLast ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.body}>
              <Text style={styles.date}>{formatTimelineDate(ev.at)}</Text>
              <Text style={[styles.title, active && styles.titleActive]}>{ev.title}</Text>
              {ev.subtitle ? (
                <Text numberOfLines={3} style={styles.subtitle}>
                  {ev.subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 0,
  },
  heading: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  track: {
    width: 20,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    borderWidth: 2,
    borderColor: colors.white,
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: 2,
    backgroundColor: colors.border,
    minHeight: 24,
  },
  body: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  date: {
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  title: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  titleActive: {
    color: colors.primaryDark,
  },
  subtitle: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
})
