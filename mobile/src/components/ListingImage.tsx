import { Image, type ImageProps } from 'expo-image'
import { StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native'
import { colors } from '../constants/theme'

type Props = {
  uri: string | undefined
  style?: StyleProp<ImageStyle>
  /** Show a compact "No photo" state when uri is missing */
  showPlaceholder?: boolean
  accessibilityLabel?: string
} & Omit<ImageProps, 'source' | 'style'>

/**
 * Remote listing photo (Cloudinary). Prefer this over RN Image for HTTPS normalization + caching.
 */
export function ListingImage({
  uri,
  style,
  showPlaceholder = true,
  accessibilityLabel = 'Listing photo',
  contentFit = 'cover',
  ...rest
}: Props) {
  if (!uri) {
    return showPlaceholder ? (
      <View style={[styles.ph, style]}>
        <View style={styles.phInner}>
          <View style={styles.phIcon} />
        </View>
      </View>
    ) : (
      <View style={[styles.ph, style]} />
    )
  }

  return (
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel={accessibilityLabel}
      contentFit={contentFit}
      source={{ uri }}
      style={style}
      transition={180}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  ph: {
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phInner: {
    opacity: 0.35,
  },
  phIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textTertiary,
  },
})
