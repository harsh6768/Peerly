import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import { useFlow } from '../context/FlowContext'

export function FlowSwitch() {
  const { flowMode, setFlowMode } = useFlow()

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>Mode</Text>
      <View style={styles.track}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: flowMode === 'find_room' }}
          onPress={() => setFlowMode('find_room')}
          style={({ pressed }) => [
            styles.segment,
            flowMode === 'find_room' && styles.segmentActive,
            pressed && styles.segmentPressed,
          ]}
        >
          <Text style={[styles.segmentLabel, flowMode === 'find_room' && styles.segmentLabelActive]}>
            Find room
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: flowMode === 'tenant_replacement' }}
          onPress={() => setFlowMode('tenant_replacement')}
          style={({ pressed }) => [
            styles.segment,
            flowMode === 'tenant_replacement' && styles.segmentActive,
            pressed && styles.segmentPressed,
          ]}
        >
          <Text
            style={[styles.segmentLabel, flowMode === 'tenant_replacement' && styles.segmentLabelActive]}
          >
            Tenant replacement
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  hint: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textTertiary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  track: {
    flexDirection: 'row',
    backgroundColor: colors.bgLight,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.white,
    ...{
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
  },
  segmentPressed: {
    opacity: 0.92,
  },
  segmentLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  segmentLabelActive: {
    color: colors.primary,
  },
})
