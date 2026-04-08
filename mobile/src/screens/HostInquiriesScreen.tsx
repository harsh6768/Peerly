import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
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
import type { Inquiry, ListingInquiryStatus } from '../lib/types'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList, TabParamList } from '../navigation/types'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'HostInquiries'>,
  NativeStackNavigationProp<RootStackParamList>
>

type StatusFilter = ListingInquiryStatus | 'ALL'

const FILTER_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'DECLINED', label: 'Declined' },
]

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
    NEW: 'New',
    CONTACTED: 'Contacted',
    SCHEDULED: 'Scheduled',
    CLOSED: 'Closed',
    DECLINED: 'Declined',
  }
  return map[status] ?? status
}

function HostInquiryCard({
  inquiry,
  busy,
  onPress,
  onMarkContacted,
  onDecline,
  onClose,
}: {
  inquiry: Inquiry
  busy: boolean
  onPress: () => void
  onMarkContacted: () => void
  onDecline: () => void
  onClose: () => void
}) {
  const coverUri = getListingCoverUri(inquiry.listing.images)
  const rent = inquiry.listing.rentAmount
    ? `₹${inquiry.listing.rentAmount.toLocaleString('en-IN')}/mo`
    : 'Rent TBD'

  const s = inquiry.status
  const showContact = s === 'NEW'
  const showClose = s === 'CONTACTED' || s === 'SCHEDULED'
  const showDecline = s === 'NEW' || s === 'CONTACTED' || s === 'SCHEDULED'

  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <View style={styles.cardTop}>
          {coverUri ? (
            <ListingImage style={styles.cardThumb} uri={coverUri} />
          ) : (
            <View style={styles.cardThumbPlaceholder} />
          )}
          <View style={styles.cardLeft}>
            <Text style={styles.fromLabel}>From</Text>
            <Text numberOfLines={1} style={styles.requesterName}>
              {inquiry.requester.fullName}
            </Text>
            <Text numberOfLines={2} style={styles.cardTitle}>
              {inquiry.listing.title}
            </Text>
            <Text style={styles.cardRent}>{rent}</Text>
          </View>
          <Badge tone={statusBadgeTone(inquiry.status)}>{statusLabel(inquiry.status)}</Badge>
        </View>
        {inquiry.message ? (
          <Text numberOfLines={3} style={styles.cardMessage}>
            {inquiry.message}
          </Text>
        ) : null}
        <Text style={styles.cardDate}>
          {new Date(inquiry.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <Text numberOfLines={2} style={styles.progressLine}>
          {formatInquiryActivitySummary(inquiry, 'owner')}
        </Text>
      </TouchableOpacity>

      {showContact || showClose || showDecline ? (
        <View style={styles.cardActions}>
          {showContact ? (
            <Button
              disabled={busy}
              fullWidth
              loading={busy}
              onPress={onMarkContacted}
              variant="secondary"
            >
              Mark contacted
            </Button>
          ) : null}
          {showClose ? (
            <Button disabled={busy} fullWidth loading={busy} onPress={onClose} variant="secondary">
              Close
            </Button>
          ) : null}
          {showDecline ? (
            <Button disabled={busy} fullWidth loading={busy} onPress={onDecline} variant="ghost">
              Decline
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

export function HostInquiriesScreen({ navigation }: { navigation: Nav }) {
  const { sessionToken, user } = useAuth()
  const insets = useSafeAreaInsets()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchInquiries = useCallback(async () => {
    if (!sessionToken) return
    try {
      const params = new URLSearchParams({ scope: 'owner' })
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter)
      }
      const data = await apiRequest<Inquiry[]>(`/listing-inquiries?${params.toString()}`, {
        token: sessionToken,
      })
      setInquiries(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiries.')
    }
  }, [sessionToken, statusFilter])

  useEffect(() => {
    setIsLoading(true)
    void fetchInquiries().finally(() => setIsLoading(false))
  }, [fetchInquiries])

  async function handleRefresh() {
    setIsRefreshing(true)
    await fetchInquiries()
    setIsRefreshing(false)
  }

  async function patchInquiryStatus(inquiryId: string, status: ListingInquiryStatus) {
    if (!sessionToken) return
    setUpdatingId(inquiryId)
    try {
      await apiRequest(`/listing-inquiries/${inquiryId}/status`, {
        method: 'PATCH',
        token: sessionToken,
        body: JSON.stringify({ status }),
      })
      await fetchInquiries()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not update inquiry.')
    } finally {
      setUpdatingId(null)
    }
  }

  function confirmDecline(inquiryId: string) {
    Alert.alert(
      'Decline inquiry?',
      'The seeker will see this inquiry as declined.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => void patchInquiryStatus(inquiryId, 'DECLINED'),
        },
      ],
    )
  }

  function confirmClose(inquiryId: string) {
    Alert.alert('Close inquiry?', 'You can still find it under the Closed filter.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', onPress: () => void patchInquiryStatus(inquiryId, 'CLOSED') },
    ])
  }

  const filterHeader = useMemo(
    () => (
      <ScrollView
        contentContainerStyle={styles.filterRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {FILTER_CHIPS.map((chip) => {
          const active = statusFilter === chip.value
          return (
            <TouchableOpacity
              key={chip.value}
              activeOpacity={0.85}
              onPress={() => setStatusFilter(chip.value)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{chip.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    ),
    [statusFilter],
  )

  if (!user) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={styles.guestTitle}>Incoming leads</Text>
        <Text style={styles.guestText}>Sign in to see enquiries on your listings.</Text>
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
          description={
            statusFilter === 'ALL'
              ? 'When seekers message you about a listing, conversations show up here.'
              : 'No inquiries with this status. Try another filter.'
          }
          title={statusFilter === 'ALL' ? 'No incoming inquiries' : 'No matches'}
        />
      }
      ListHeaderComponent={
        <View style={styles.filterHeaderWrap}>
          <Text style={styles.filterTitle}>Filter by status</Text>
          {filterHeader}
        </View>
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
        <HostInquiryCard
          busy={updatingId === item.id}
          inquiry={item}
          onClose={() => confirmClose(item.id)}
          onDecline={() => confirmDecline(item.id)}
          onMarkContacted={() => void patchInquiryStatus(item.id, 'CONTACTED')}
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
  filterHeaderWrap: { marginBottom: spacing.md, gap: spacing.sm },
  filterTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  filterRow: { flexDirection: 'row', gap: spacing.xs, paddingBottom: spacing.xs },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  filterChipText: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.textSecondary },
  filterChipTextActive: { color: colors.primaryDark },
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
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
  fromLabel: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  requesterName: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.textPrimary, marginBottom: 4 },
  cardTitle: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: 4 },
  cardRent: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.primary },
  cardMessage: { fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.sm },
  cardDate: { fontSize: fontSizes.xs, color: colors.textTertiary, marginTop: spacing.sm },
  progressLine: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  cardActions: { marginTop: spacing.md, gap: spacing.sm },
})
