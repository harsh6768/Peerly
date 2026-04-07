import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import type { Listing } from '../lib/types'
import { Badge } from './Badge'

type Props = {
  listing: Listing
  onPress: () => void
}

function formatRent(amount: number | null): string {
  if (!amount) return 'Rent TBD'
  return `₹${amount.toLocaleString('en-IN')}/mo`
}

function getMatchBadgeTone(label: string) {
  if (label === 'BEST_MATCH') return 'green' as const
  if (label === 'GOOD_MATCH') return 'primary' as const
  return 'gray' as const
}

function getMatchLabel(label: string) {
  if (label === 'BEST_MATCH') return 'Best match'
  if (label === 'GOOD_MATCH') return 'Good match'
  return 'Possible'
}

export function ListingCard({ listing, onPress }: Props) {
  const coverImage = listing.images.find((img) => img.isCover) ?? listing.images[0]
  const location = [listing.locality, listing.city].filter(Boolean).join(', ')
  const propertyLabel = listing.propertyType
    ? listing.propertyType.charAt(0) + listing.propertyType.slice(1).toLowerCase()
    : null
  const occupancyLabel = listing.occupancyType
    ? listing.occupancyType.charAt(0) + listing.occupancyType.slice(1).toLowerCase()
    : null

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
      {coverImage ? (
        <Image
          resizeMode="cover"
          source={{ uri: coverImage.thumbnailUrl || coverImage.imageUrl }}
          style={styles.image}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>No photo</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.rent}>
            {formatRent(listing.rentAmount)}
          </Text>
          {listing.matchSummary && (
            <Badge tone={getMatchBadgeTone(listing.matchSummary.label)}>
              {getMatchLabel(listing.matchSummary.label)}
            </Badge>
          )}
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {listing.title}
        </Text>

        {location ? (
          <Text numberOfLines={1} style={styles.location}>
            {location}
          </Text>
        ) : null}

        <View style={styles.tags}>
          {propertyLabel && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{propertyLabel}</Text>
            </View>
          )}
          {occupancyLabel && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{occupancyLabel}</Text>
            </View>
          )}
          {listing.owner.isVerified && (
            <View style={[styles.tag, styles.tagVerified]}>
              <Text style={[styles.tagText, styles.tagVerifiedText]}>Verified</Text>
            </View>
          )}
          {listing.urgencyLevel === 'HIGH' && (
            <View style={[styles.tag, styles.tagUrgent]}>
              <Text style={[styles.tagText, styles.tagUrgentText]}>Urgent</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: colors.bgLight,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
  body: {
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  rent: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    letterSpacing: -0.3,
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  location: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  tagVerified: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  tagVerifiedText: {
    color: '#16a34a',
  },
  tagUrgent: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  tagUrgentText: {
    color: colors.urgent,
  },
})
