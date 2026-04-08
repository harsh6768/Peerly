import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { ListingImage } from '../components/ListingImage'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import { formatInquiryActivitySummary } from '../lib/inquiryTimeline'
import { getListingCoverUri } from '../lib/listingImages'
import type { Inquiry } from '../lib/types'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList, TabParamList } from '../navigation/types'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Sent'>,
  NativeStackNavigationProp<RootStackParamList>
>

function statusBadgeTone(status: string) {
  if (status === 'NEW') return 'primary' as const
  if (status === 'CONTACTED') return 'amber' as const
  if (status === 'SCHEDULED') return 'green' as const
  if (status === 'CLOSED') return 'gray' as const
  if (status === 'DECLINED') return 'red' as const
  return 'gray' as const
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    NEW: 'Sent',
    CONTACTED: 'In review',
    SCHEDULED: 'Visit scheduled',
    CLOSED: 'Closed',
    DECLINED: 'Declined',
  }
  return map[status] ?? status
}

type InquiryCardProps = {
  inquiry: Inquiry
  onPress: () => void
}

function InquiryCard({ inquiry, onPress }: InquiryCardProps) {
  const coverUri = getListingCoverUri(inquiry.listing.images)
  const location = [inquiry.listing.locality, inquiry.listing.city].filter(Boolean).join(', ')
  const rent = inquiry.listing.rentAmount
    ? `₹${inquiry.listing.rentAmount.toLocaleString('en-IN')}/mo`
    : 'Rent TBD'

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        {coverUri ? (
          <ListingImage style={styles.cardThumb} uri={coverUri} />
        ) : (
          <View style={styles.cardThumbPlaceholder} />
        )}
        <View style={styles.cardLeft}>
          <Text numberOfLines={2} style={styles.cardTitle}>
            {inquiry.listing.title}
          </Text>
          {location ? <Text numberOfLines={1} style={styles.cardLocation}>{location}</Text> : null}
          <Text style={styles.cardRent}>{rent}</Text>
        </View>
        <Badge tone={statusBadgeTone(inquiry.status)}>{statusLabel(inquiry.status)}</Badge>
      </View>
      {inquiry.message ? (
        <Text numberOfLines={2} style={styles.cardMessage}>
          &ldquo;{inquiry.message}&rdquo;
        </Text>
      ) : null}
      <Text style={styles.cardDate}>
        {new Date(inquiry.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </Text>
      <Text numberOfLines={2} style={styles.progressLine}>
        {formatInquiryActivitySummary(inquiry, 'requester')}
      </Text>
    </TouchableOpacity>
  )
}

export function SentInquiriesScreen({ navigation }: { navigation: Nav }) {
  const { sessionToken, user } = useAuth()
  const insets = useSafeAreaInsets()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInquiries = useCallback(async () => {
    if (!sessionToken) return
    try {
      const data = await apiRequest<Inquiry[]>('/listing-inquiries?scope=requester', {
        token: sessionToken,
      })
      setInquiries(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiries.')
    }
  }, [sessionToken])

  useEffect(() => {
    setIsLoading(true)
    void fetchInquiries().finally(() => setIsLoading(false))
  }, [fetchInquiries])

  async function handleRefresh() {
    setIsRefreshing(true)
    await fetchInquiries()
    setIsRefreshing(false)
  }

  if (!user) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={styles.guestTitle}>Track your inquiries</Text>
        <Text style={styles.guestText}>Sign in to see inquiries you&apos;ve sent to hosts.</Text>
        <Button onPress={() => navigation.navigate('Profile')}>Sign in</Button>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={() => void fetchInquiries()} variant="secondary">
          Retry
        </Button>
      </View>
    )
  }

  return (
    <FlatList
      contentContainerStyle={[
        styles.list,
        inquiries.length === 0 && styles.listEmpty,
        { paddingBottom: insets.bottom + 100 },
      ]}
      data={inquiries}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <EmptyState
          description="When you send inquiries to hosts, they appear here with status updates."
          title="No sent inquiries yet"
        />
      }
      refreshControl={
        <RefreshControl
          colors={[colors.primary]}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          tintColor={colors.primary}
        />
      }
      renderItem={({ item }) => (
        <InquiryCard
          inquiry={item}
          onPress={() => navigation.navigate('InquiryDetail', { inquiryId: item.id })}
        />
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  guestTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.textPrimary, textAlign: 'center' },
  guestText: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  errorText: { color: colors.urgent, fontSize: fontSizes.base, textAlign: 'center' },
  list: { padding: spacing.md },
  listEmpty: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...{
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      elevation: 3,
    },
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs, gap: spacing.sm },
  cardThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.bgLight,
  },
  cardThumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.bgLight,
  },
  cardLeft: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.textPrimary, marginBottom: 2 },
  cardLocation: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: 2 },
  cardRent: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.primary },
  cardMessage: { fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.xs, fontStyle: 'italic' },
  cardDate: { fontSize: fontSizes.xs, color: colors.textTertiary },
  progressLine: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
})
