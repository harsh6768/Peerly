import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Badge } from '../components/Badge'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Inquiry } from '../lib/types'
import type { RootStackScreenProps } from '../navigation/types'

type Props = RootStackScreenProps<'InquiryDetail'>

function statusTone(status: string) {
  const map: Record<string, 'primary' | 'amber' | 'green' | 'gray' | 'red'> = {
    NEW: 'primary',
    CONTACTED: 'amber',
    SCHEDULED: 'green',
    CLOSED: 'gray',
    DECLINED: 'red',
  }
  return map[status] ?? 'gray'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    NEW: 'Inquiry sent',
    CONTACTED: 'In review',
    SCHEDULED: 'Visit scheduled',
    CLOSED: 'Closed',
    DECLINED: 'Declined',
  }
  return map[status] ?? status
}

function Section({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionValue}>{value}</Text>
    </View>
  )
}

export function InquiryDetailScreen({ route }: Props) {
  const { inquiryId } = route.params
  const { sessionToken } = useAuth()
  const insets = useSafeAreaInsets()

  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void apiRequest<Inquiry>(`/listing-inquiries/${inquiryId}`, { token: sessionToken })
      .then(setInquiry)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [inquiryId, sessionToken])

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (error || !inquiry) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Inquiry not found.'}</Text>
      </View>
    )
  }

  const location = [inquiry.listing.locality, inquiry.listing.city].filter(Boolean).join(', ')
  const rent = inquiry.listing.rentAmount
    ? `₹${inquiry.listing.rentAmount.toLocaleString('en-IN')}/mo`
    : 'Rent TBD'

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Status */}
      <View style={styles.statusRow}>
        <Badge tone={statusTone(inquiry.status)}>{statusLabel(inquiry.status)}</Badge>
        <Text style={styles.date}>
          {new Date(inquiry.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Listing summary */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Listing</Text>
        <Text style={styles.cardTitle}>{inquiry.listing.title}</Text>
        {location ? <Text style={styles.cardMeta}>{location}</Text> : null}
        <Text style={styles.cardRent}>{rent}</Text>
      </View>

      {/* Inquiry details */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Your inquiry</Text>
        {inquiry.message ? (
          <Text style={styles.message}>{inquiry.message}</Text>
        ) : (
          <Text style={styles.cardMeta}>No message provided.</Text>
        )}
      </View>

      {/* Facts */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Details</Text>
        {inquiry.budgetAmount ? (
          <Section
            label="Your budget"
            value={`₹${inquiry.budgetAmount.toLocaleString('en-IN')}/mo`}
          />
        ) : null}
        {inquiry.preferredMoveInDate ? (
          <Section
            label="Preferred move-in"
            value={new Date(inquiry.preferredMoveInDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          />
        ) : null}
        {inquiry.preferredOccupancy ? (
          <Section
            label="Occupancy preference"
            value={
              inquiry.preferredOccupancy.charAt(0) +
              inquiry.preferredOccupancy.slice(1).toLowerCase()
            }
          />
        ) : null}
      </View>

      {/* Host info */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Host</Text>
        <Text style={styles.cardTitle}>{inquiry.listingOwner.fullName}</Text>
        {inquiry.listingOwner.companyName ? (
          <Text style={styles.cardMeta}>{inquiry.listingOwner.companyName}</Text>
        ) : null}
        <View style={styles.verifyRow}>
          {inquiry.listingOwner.isVerified ? (
            <Badge tone="green">Verified host</Badge>
          ) : (
            <Badge tone="gray">Unverified</Badge>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.urgent, fontSize: fontSizes.base, textAlign: 'center', padding: spacing.lg },
  content: { padding: spacing.md, gap: spacing.md },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: { fontSize: fontSizes.sm, color: colors.textSecondary },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  cardTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  cardMeta: { fontSize: fontSizes.sm, color: colors.textSecondary },
  cardRent: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.primary, marginTop: spacing.xs },
  message: { fontSize: fontSizes.base, color: colors.textPrimary, lineHeight: 22 },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionLabel: { fontSize: fontSizes.sm, color: colors.textSecondary, fontWeight: fontWeights.medium },
  sectionValue: { fontSize: fontSizes.sm, color: colors.textPrimary, fontWeight: fontWeights.semibold },
  verifyRow: { marginTop: spacing.xs },
})
