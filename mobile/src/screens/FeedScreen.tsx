import { useCallback, useEffect, useRef, useState } from 'react'
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
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Listing } from '../lib/types'

// Backend GET /listings returns a plain Listing[]
// Budget and property filters are applied client-side
// (backend only accepts: city, status, nearby, ownerUserId)

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

function applyClientFilters(listings: Listing[], filters: FilterState): Listing[] {
  return listings.filter((listing) => {
    // Budget filter (client-side)
    if (filters.budget !== 'ANY') {
      const rent = listing.rentAmount ?? 0
      if (filters.budget === 'UNDER_20000' && rent >= 20000) return false
      if (filters.budget === 'BETWEEN_20000_AND_30000' && (rent < 20000 || rent > 30000)) return false
      if (filters.budget === 'BETWEEN_30000_AND_45000' && (rent < 30000 || rent > 45000)) return false
      if (filters.budget === 'ABOVE_45000' && rent <= 45000) return false
    }

    // Property type filter (client-side)
    if (filters.propertyType && listing.propertyType !== filters.propertyType) return false

    // Occupancy filter (client-side)
    if (filters.occupancyType && listing.occupancyType !== filters.occupancyType) return false

    return true
  })
}

export function FeedScreen({ navigation }: { navigation: { navigate: (screen: string, params?: unknown) => void } }) {
  const { sessionToken } = useAuth()
  const insets = useSafeAreaInsets()

  const [allListings, setAllListings] = useState<Listing[]>([])
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const fetchListings = useCallback(
    async (cityFilter: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const params = new URLSearchParams({ status: 'PUBLISHED' })
        if (cityFilter) params.set('city', cityFilter)

        const data = await apiRequest<Listing[]>(`/listings?${params.toString()}`, {
          token: sessionToken,
        })

        if (!controller.signal.aborted) {
          setAllListings(Array.isArray(data) ? data : [])
          setError(null)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load listings.')
        }
      }
    },
    [sessionToken],
  )

  useEffect(() => {
    setIsLoading(true)
    void fetchListings(filters.city).finally(() => setIsLoading(false))
  }, [filters.city, fetchListings])

  function handleFilterChange(key: keyof FilterState, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    await fetchListings(filters.city)
    setIsRefreshing(false)
  }

  const filteredListings = applyClientFilters(allListings, filters)

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'budget') return v !== 'ANY'
    return Boolean(v)
  }).length

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Sticky filter toggle bar */}
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
      ) : filteredListings.length === 0 ? (
        <EmptyState
          description={
            allListings.length > 0
              ? 'No listings match your current filters. Try clearing some filters.'
              : 'No listings available right now. Check back later.'
          }
          title="No listings found"
        />
      ) : (
        <FlatList
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          data={filteredListings}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={handleRefresh}
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

      {/* Result count footer */}
      {!error && allListings.length > 0 && (
        <View style={styles.resultBadge}>
          <Text style={styles.resultBadgeText}>
            {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
            {activeFilterCount > 0 ? ` of ${allListings.length}` : ''}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
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
