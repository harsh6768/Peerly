import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import { useAuth } from '../lib/auth'

export function ProfileScreen() {
  const { user, isLoading, isSyncing, error, signInWithGoogle, signOut, configured, updateProfile } =
    useAuth()
  const insets = useSafeAreaInsets()
  const [phoneDraft, setPhoneDraft] = useState('')
  const [phoneSavedHint, setPhoneSavedHint] = useState(false)

  useEffect(() => {
    if (user?.phone !== undefined) {
      setPhoneDraft(user.phone ?? '')
    }
  }, [user?.phone])

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ])
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (!user) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom + 80 }]}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Welcome to Cirvo</Text>
          <Text style={styles.authSubtitle}>
            Sign in to post listings, send inquiries, and track your housing journey.
          </Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button
            disabled={!configured || isSyncing}
            fullWidth
            loading={isSyncing}
            onPress={() => void signInWithGoogle()}
          >
            Continue with Google
          </Button>
          <Text style={styles.browseNote}>
            You can browse listings without signing in.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <View style={styles.badgeRow}>
            {user.isVerified ? (
              <Badge tone="green">Verified</Badge>
            ) : (
              <Badge tone="amber">Not verified</Badge>
            )}
            {user.companyName ? <Badge tone="gray">{user.companyName}</Badge> : null}
          </View>
        </View>
      </View>

      {!user.isVerified && (
        <View style={styles.verifyBanner}>
          <Text style={styles.verifyBannerTitle}>Get verified</Text>
          <Text style={styles.verifyBannerText}>
            Verified profiles get more responses from hosts and stand out in the inquiry list.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.phoneBlock}>
          <Text style={styles.phoneLabel}>Phone (for enquiries)</Text>
          <Text style={styles.phoneHint}>
            Hosts see this when you send an inquiry in Find room. Required before messaging.
          </Text>
          <TextInput
            keyboardType="phone-pad"
            onChangeText={(t) => {
              setPhoneDraft(t)
              setPhoneSavedHint(false)
            }}
            placeholder="e.g. +91 98765 43210"
            placeholderTextColor={colors.textTertiary}
            style={styles.phoneInput}
            value={phoneDraft}
          />
          <Button
            disabled={isSyncing || phoneDraft.trim() === (user.phone ?? '').trim()}
            fullWidth
            loading={isSyncing}
            onPress={() => {
              void (async () => {
                try {
                  await updateProfile({ phone: phoneDraft.trim() })
                  setPhoneSavedHint(true)
                } catch {
                  // error surfaced via auth context
                }
              })()
            }}
            variant="secondary"
          >
            Save phone number
          </Button>
          {phoneSavedHint ? <Text style={styles.savedNote}>Saved. You can send enquiries now.</Text> : null}
        </View>
        {user.verificationType ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Verification</Text>
            <Text style={styles.infoValue}>
              {user.verificationType === 'WORK_EMAIL' ? 'Work email' : 'LinkedIn'}
              {user.verificationStatus ? ` · ${user.verificationStatus.toLowerCase()}` : ''}
            </Text>
          </View>
        ) : null}
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Member since</Text>
          <Text style={styles.infoValue}>
            {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </View>

      <View style={styles.signOutRow}>
        <Button fullWidth onPress={() => void handleSignOut()} variant="secondary">
          Sign out
        </Button>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  authCard: {
    width: '100%',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    gap: spacing.md,
  },
  authTitle: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.textPrimary, textAlign: 'center' },
  authSubtitle: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  errorText: { color: colors.urgent, fontSize: fontSizes.sm, textAlign: 'center' },
  browseNote: { fontSize: fontSizes.sm, color: colors.textSecondary, textAlign: 'center' },
  content: { padding: spacing.md, gap: spacing.md },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    gap: spacing.md,
  },
  avatarPlaceholder: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold, color: colors.primary },
  profileInfo: { flex: 1, gap: spacing.xs },
  profileName: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.textPrimary },
  profileEmail: { fontSize: fontSizes.sm, color: colors.textSecondary },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  verifyBanner: {
    padding: spacing.md, backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  verifyBannerTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: '#b45309', marginBottom: spacing.xs },
  verifyBannerText: { fontSize: fontSizes.sm, color: '#92400e', lineHeight: 20 },
  section: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: {
    fontSize: fontSizes.sm, fontWeight: fontWeights.bold, color: colors.textSecondary,
    letterSpacing: 0.6, textTransform: 'uppercase',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  phoneBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  phoneLabel: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  phoneHint: { fontSize: fontSizes.xs, color: colors.textSecondary, lineHeight: 18 },
  phoneInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  savedNote: { fontSize: fontSizes.xs, color: '#16a34a', fontWeight: fontWeights.medium },
  infoLabel: { fontSize: fontSizes.sm, color: colors.textSecondary, fontWeight: fontWeights.medium },
  infoValue: { fontSize: fontSizes.sm, color: colors.textPrimary, fontWeight: fontWeights.medium, flex: 1, textAlign: 'right' },
  signOutRow: { marginTop: spacing.sm },
})
