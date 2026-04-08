import { useNavigation } from '@react-navigation/native'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { EmptyState } from '../components/EmptyState'
import { FilterBar, type FilterState } from '../components/FilterBar'
import { ListingCard } from '../components/ListingCard'
import { colors, fontSizes, fontWeights, spacing } from '../constants/theme'
import { useFlow } from '../context/FlowContext'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import { asListingsPage } from '../lib/listingsResponse'
import type { Listing } from '../lib/types'
import type { RootStackParamList, TabParamList } from '../navigation/types'

type FeedNav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Discover'>,
  NativeStackNavigationProp<RootStackParamList>
>

const defaultFilters: FilterState = {
  city: '',
  propertyType: '',
  occupancyType: '',
  budget: 'ANY',
}

const majorCities = [
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Gurgaon',
  'Noida',
]

function budgetToRentRange(budget: FilterState['budget']): { rentMin?: number; rentMax?: number } {
  switch (budget) {
    case 'UNDER_20000':
      return { rentMax: 19_999 }
    case 'BETWEEN_20000_AND_30000':
      return { rentMin: 20_000, rentMax: 30_000 }
    case 'BETWEEN_30000_AND_45000':
      return { rentMin: 30_000, rentMax: 45_000 }
    case 'ABOVE_45000':
      return { rentMin: 45_001 }
    default:
      return {}
  }
}

function buildListingsQuery(
  filters: FilterState,
  opts: { cursor?: string | null; excludeOwnerUserId?: string },
) {
  const params = new URLSearchParams({ status: 'PUBLISHED' })
  params.set('limit', '20')
  if (filters.city) params.set('city', filters.city)
  if (filters.propertyType) params.set('propertyType', filters.propertyType)
  if (filters.occupancyType) params.set('occupancyType', filters.occupancyType)
  const { rentMin, rentMax } = budgetToRentRange(filters.budget)
  if (rentMin !== undefined) params.set('rentMin', String(rentMin))
  if (rentMax !== undefined) params.set('rentMax', String(rentMax))
  if (opts.excludeOwnerUserId) params.set('excludeOwnerUserId', opts.excludeOwnerUserId)
  if (opts.cursor) params.set('cursor', opts.cursor)
  return params.toString()
}

export function FeedScreen() {
  const navigation = useNavigation<FeedNav>()
  const { flowMode } = useFlow()
  const { sessionToken, user } = useAuth()
  const insets = useSafeAreaInsets()

  const [listings, setListings] = useState<Listing[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const excludeOwner = flowMode === 'find_room' && user?.id ? user.id : undefined

  const fetchPage = useCallback(
    async (append: boolean, cursor: string | null) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const qs = buildListingsQuery(filters, {
        cursor: append ? cursor : null,
        excludeOwnerUserId: excludeOwner,
      })

      const data = await apiRequest<unknown>(`/listings?${qs}`, {
        token: sessionToken,
      })

      if (controller.signal.aborted) return

      const page = asListingsPage<Listing>(data)
      if (append) {
        setListings((prev) => [...prev, ...page.items])
      } else {
        setListings(page.items)
      }
      setNextCursor(page.nextCursor)
      setError(null)
    },
    [excludeOwner, filters, sessionToken],
  )

  function handleFilterChange(key: keyof FilterState, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    setIsLoading(true)
    void fetchPage(false, null)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load listings.')
      })
      .finally(() => setIsLoading(false))
  }, [fetchPage])

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await fetchPage(false, null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load listings.')
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMore || isLoading) return
    setLoadingMore(true)
    try {
      await fetchPage(true, nextCursor)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load more.')
    } finally {
      setLoadingMore(false)
    }
  }

  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(([k, v]) => {
        if (k === 'budget') return v !== 'ANY'
        return Boolean(v)
      }).length,
    [filters],
  )

  if (isLoading && listings.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowFilters((prev) => !prev)}
          style={[styles.filterToggle, activeFilterCount > 0 && styles.filterToggleActive]}
        >
          <Text style={[styles.filterToggleText, activeFilterCount > 0 && styles.filterToggleTextActive]}>
            {activeFilterCount > 0 ? `Filters · ${activeFilterCount} active` : 'Filter listings'}
          </Text>
        </TouchableOpacity>

        {activeFilterCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setFilters(defaultFilters)}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {showFilters && (
        <FilterBar cities={majorCities} filters={filters} onChange={handleFilterChange} />
      )}

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : listings.length === 0 ? (
        <EmptyState
          description="No listings match your filters right now. Try adjusting filters or check back later."
          title="No listings found"
        />
      ) : (
        <FlatList
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          data={listings}
          keyExtractor={(item) => item.id}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : null
          }
          onEndReached={() => void handleLoadMore()}
          onEndReachedThreshold={0.35}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={() => void handleRefresh()}
              refreshing={isRefreshing}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() =>
                navigation.navigate('ListingDetail', { listingId: item.id, listing: item })
              }
            />
          )}
        />
      )}

      {!error && listings.length > 0 && (
        <View style={styles.resultBadge}>
          <Text style={styles.resultBadgeText}>
            {listings.length} listing{listings.length !== 1 ? 's' : ''}
            {nextCursor ? ' · scroll for more' : ''}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  filterToggle: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  filterToggleActive: {
    backgroundColor: colors.primaryLight,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  filterToggleText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  filterToggleTextActive: {
    color: colors.primaryDark,
  },
  clearBtn: {
    height: 44,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.urgent,
  },
  list: {
    paddingTop: spacing.md,
  },
  errorText: {
    color: colors.urgent,
    fontSize: fontSizes.base,
    textAlign: 'center',
    padding: spacing.lg,
  },
  resultBadge: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(108,99,255,0.9)',
  },
  resultBadgeText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
})
