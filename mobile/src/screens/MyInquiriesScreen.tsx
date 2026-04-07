import { useEffect, useState } from 'react'
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
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Inquiry } from '../lib/types'

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
  const location = [inquiry.listing.locality, inquiry.listing.city].filter(Boolean).join(', ')
  const rent = inquiry.listing.rentAmount
    ? `₹${inquiry.listing.rentAmount.toLocaleString('en-IN')}/mo`
    : 'Rent TBD'

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {inquiry.listing.title}
          </Text>
          {location ? <Text style={styles.cardLocation}>{location}</Text> : null}
          <Text style={styles.cardRent}>{rent}</Text>
        </View>
        <Badge tone={statusBadgeTone(inquiry.status)}>{statusLabel(inquiry.status)}</Badge>
      </View>
      {inquiry.message ? (
        <Text numberOfLines={2} style={styles.cardMessage}>
          "{inquiry.message}"
        </Text>
      ) : null}
      <Text style={styles.cardDate}>
        {new Date(inquiry.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </Text>
    </TouchableOpacity>
  )
}

export function MyInquiriesScreen({ navigation }: { navigation: { navigate: (screen: string, params?: unknown) => void } }) {
  const { sessionToken, user } = useAuth()
  const insets = useSafeAreaInsets()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchInquiries() {
    if (!sessionToken) return
    try {
      const data = await apiRequest<Inquiry[]>('/listing-inquiries', { token: sessionToken })
      setInquiries(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiries.')
    }
  }

  useEffect(() => {
    setIsLoading(true)
    void fetchInquiries().finally(() => setIsLoading(false))
  }, [sessionToken])

  async function handleRefresh() {
    setIsRefreshing(true)
    await fetchInquiries()
    setIsRefreshing(false)
  }

  if (!user) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom + 80 }]}>
        <Text style={styles.guestTitle}>Track your inquiries</Text>
        <Text style={styles.guestText}>Sign in to see inquiries you've sent to hosts.</Text>
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
      </View>
    )
  }

  return (
    <FlatList
      contentContainerStyle={[
        styles.list,
        inquiries.length === 0 && styles.listEmpty,
        { paddingBottom: insets.bottom + 80 },
      ]}
      data={inquiries}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <EmptyState
          description="When you send inquiries to hosts, they'll appear here."
          title="No inquiries yet"
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
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs, gap: spacing.sm },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.textPrimary, marginBottom: 2 },
  cardLocation: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: 2 },
  cardRent: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.primary },
  cardMessage: { fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.xs, fontStyle: 'italic' },
  cardDate: { fontSize: fontSizes.xs, color: colors.textSecondary },
})
