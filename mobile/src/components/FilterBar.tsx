import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import type { PublicListingBudgetFilter } from '../lib/types'

export type FilterState = {
  city: string
  propertyType: string
  occupancyType: string
  budget: PublicListingBudgetFilter
}

type QuickFilter = {
  key: string
  label: string
  value: string
  filterKey: keyof FilterState
}

const budgetOptions: { label: string; value: PublicListingBudgetFilter }[] = [
  { label: 'Any budget', value: 'ANY' },
  { label: 'Under ₹20k', value: 'UNDER_20000' },
  { label: '₹20k–30k', value: 'BETWEEN_20000_AND_30000' },
  { label: '₹30k–45k', value: 'BETWEEN_30000_AND_45000' },
  { label: 'Above ₹45k', value: 'ABOVE_45000' },
]

const propertyOptions = [
  { label: 'Any type', value: '' },
  { label: 'Room', value: 'ROOM' },
  { label: 'Studio', value: 'STUDIO' },
  { label: 'Apartment', value: 'APARTMENT' },
  { label: 'PG', value: 'PG' },
]

const occupancyOptions = [
  { label: 'Any occupancy', value: '' },
  { label: 'Single', value: 'SINGLE' },
  { label: 'Double', value: 'DOUBLE' },
  { label: 'Shared', value: 'SHARED' },
]

type Props = {
  filters: FilterState
  onChange: (key: keyof FilterState, value: string) => void
  cities: string[]
}

type PillProps = {
  label: string
  active: boolean
  onPress: () => void
}

function Pill({ label, active, onPress }: PillProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

type SectionProps = {
  label: string
  options: { label: string; value: string }[]
  selected: string
  onSelect: (value: string) => void
}

function FilterSection({ label, options, selected, onSelect }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <ScrollView
        contentContainerStyle={styles.pillRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {options.map((opt) => (
          <Pill
            key={opt.value}
            active={selected === opt.value}
            label={opt.label}
            onPress={() => onSelect(opt.value)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

export function FilterBar({ filters, onChange, cities }: Props) {
  const cityOptions = [
    { label: 'All cities', value: '' },
    ...cities.map((c) => ({ label: c, value: c })),
  ]

  return (
    <View style={styles.container}>
      <FilterSection
        label="City"
        onSelect={(v) => onChange('city', v)}
        options={cityOptions}
        selected={filters.city}
      />
      <FilterSection
        label="Budget"
        onSelect={(v) => onChange('budget', v as PublicListingBudgetFilter)}
        options={budgetOptions}
        selected={filters.budget}
      />
      <FilterSection
        label="Property type"
        onSelect={(v) => onChange('propertyType', v)}
        options={propertyOptions}
        selected={filters.propertyType}
      />
      <FilterSection
        label="Occupancy"
        onSelect={(v) => onChange('occupancyType', v)}
        options={occupancyOptions}
        selected={filters.occupancyType}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  section: {
    paddingVertical: spacing.xs + 2,
  },
  sectionLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  pillRow: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  pillText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.primaryDark,
    fontWeight: fontWeights.semibold,
  },
})
