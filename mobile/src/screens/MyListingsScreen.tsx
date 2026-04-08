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
import { asListingsPage } from '../lib/listingsResponse'
import { useAuth } from '../lib/auth'
import { getListingCoverUri } from '../lib/listingImages'
import type { Listing } from '../lib/types'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList, TabParamList } from '../navigation/types'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'MyListings'>,
  NativeStackNavigationProp<RootStackParamList>
>

function formatStatus(s: string) {
  const map: Record<string, string> = {
    PUBLISHED: 'Live',
    DRAFT: 'Draft',
    PAUSED: 'Paused',
    ARCHIVED: 'Archived',
    FILLED: 'Rented',
  }
  return map[s] ?? s
}

function statusTone(s: string): 'green' | 'amber' | 'gray' | 'primary' {
  if (s === 'PUBLISHED') return 'green'
  if (s === 'DRAFT') return 'amber'
  if (s === 'PAUSED') return 'gray'
  return 'gray'
}

function ListingRow({
  listing,
  onPress,
}: {
  listing: Listing
  onPress: () => void
}) {
  const coverUri = getListingCoverUri(listing.images)
  const loc = [listing.locality, listing.city].filter(Boolean).join(', ')

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.row}>
      {coverUri ? (
        <ListingImage style={styles.thumb} uri={coverUri} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}
      <View style={styles.rowBody}>
        <Text numberOfLines={2} style={styles.rowTitle}>
          {listing.title}
        </Text>
        {loc ? (
          <Text numberOfLines={1} style={styles.rowLoc}>
            {loc}
          </Text>
        ) : null}
        <Text style={styles.rowPrice}>
          {listing.rentAmount ? `₹${listing.rentAmount.toLocaleString('en-IN')}/mo` : 'Rent TBD'}
        </Text>
      </View>
      <Badge tone={statusTone(listing.status)}>{formatStatus(listing.status)}</Badge>
    </TouchableOpacity>
  )
}

export function MyListingsScreen({ navigation }: { navigation: Nav }) {
  const { sessionToken, user } = useAuth()
  const insets = useSafeAreaInsets()
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!sessionToken || !user) return
    try {
      const q = `/listings?ownerUserId=${encodeURIComponent(user.id)}&includeArchived=true`
      const data = await apiRequest<unknown>(q, { token: sessionToken })
      const page = asListingsPage<Listing>(data)
      setListings(page.items)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings.')
    }
  }, [sessionToken, user])

  useEffect(() => {
    setIsLoading(true)
    void load().finally(() => setIsLoading(false))
  }, [load])

  async function handleRefresh() {
    setIsRefreshing(true)
    await load()
    setIsRefreshing(false)
  }

  if (!user) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={styles.guestTitle}>Your listings</Text>
        <Text style={styles.guestText}>Sign in to manage replacement listings and see enquiries.</Text>
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
        <Button onPress={() => void load()} variant="secondary">
          Retry
        </Button>
      </View>
    )
  }

  return (
    <FlatList
      contentContainerStyle={[
        styles.list,
        listings.length === 0 && styles.listEmpty,
        { paddingBottom: insets.bottom + 100 },
      ]}
      data={listings}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <EmptyState
            description="Publish a listing so seekers can discover your room and send enquiries."
            title="No listings yet"
          />
          <Button fullWidth onPress={() => navigation.navigate('Post')}>
            Post a listing
          </Button>
        </View>
      }
      ListHeaderComponent={
        listings.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Post')}
            style={styles.ctaBanner}
          >
            <Text style={styles.ctaBannerText}>+ Post a new listing</Text>
          </TouchableOpacity>
        ) : null
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
        <ListingRow
          listing={item}
          onPress={() => navigation.navigate('ListingDetail', { listingId: item.id, listing: item })}
        />
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  guestTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.textPrimary, textAlign: 'center' },
  guestText: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  errorText: { color: colors.urgent, textAlign: 'center' },
  list: { padding: spacing.md },
  listEmpty: { flex: 1 },
  emptyWrap: { flex: 1, gap: spacing.lg, paddingTop: spacing.xl },
  ctaBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    alignItems: 'center',
  },
  ctaBannerText: { fontSize: fontSizes.sm, fontWeight: fontWeights.bold, color: colors.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.bgLight },
  thumbPlaceholder: { backgroundColor: colors.bgLight },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  rowLoc: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 2 },
  rowPrice: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.primary, marginTop: 4 },
})
