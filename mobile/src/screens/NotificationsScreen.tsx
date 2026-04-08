import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { NotificationListResponse, NotificationPayload, UserNotificationDto } from '../lib/notificationTypes'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function NotificationsScreen({ navigation }: Props) {
  const { sessionToken } = useAuth()
  const [items, setItems] = useState<UserNotificationDto[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(
    async (cursor?: string | null) => {
      if (!sessionToken) return
      setError(null)
      const params = new URLSearchParams()
      params.set('limit', '25')
      if (cursor) params.set('cursor', cursor)
      const data = await apiRequest<NotificationListResponse>(`/notifications?${params.toString()}`, {
        token: sessionToken,
      })
      if (cursor) {
        setItems((prev) => [...prev, ...data.items])
      } else {
        setItems(data.items)
      }
      setNextCursor(data.nextCursor)
    },
    [sessionToken],
  )

  useEffect(() => {
    if (!sessionToken) {
      setLoading(false)
      return
    }
    setLoading(true)
    void load(null)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load notifications.')
      })
      .finally(() => setLoading(false))
  }, [sessionToken, load])

  async function onRefresh() {
    if (!sessionToken) return
    setRefreshing(true)
    try {
      await load(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Refresh failed.')
    } finally {
      setRefreshing(false)
    }
  }

  function openPayload(payload: NotificationPayload) {
    if (!payload.inquiryId) return
    navigation.navigate('InquiryDetail', { inquiryId: payload.inquiryId })
  }

  async function onOpen(row: UserNotificationDto) {
    if (!sessionToken) return
    if (!row.readAt) {
      try {
        await apiRequest(`/notifications/${row.id}/read`, { method: 'PATCH', token: sessionToken })
        setItems((prev) =>
          prev.map((n) => (n.id === row.id ? { ...n, readAt: new Date().toISOString() } : n)),
        )
      } catch {
        // continue navigation
      }
    }
    openPayload(row.payload)
  }

  async function onMarkAllRead() {
    if (!sessionToken) return
    setMarkingAll(true)
    try {
      await apiRequest('/notifications/read-all', { method: 'POST', token: sessionToken })
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    } catch {
      // ignore
    } finally {
      setMarkingAll(false)
    }
  }

  if (!sessionToken) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Sign in to see notifications.</Text>
      </View>
    )
  }

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        {items.some((i) => !i.readAt) ? (
          <Pressable
            disabled={markingAll}
            onPress={() => void onMarkAllRead()}
            style={({ pressed }) => [styles.markAllBtn, pressed && styles.markAllBtnPressed]}
          >
            <Text style={styles.markAllText}>{markingAll ? '…' : 'Mark all read'}</Text>
          </Pressable>
        ) : (
          <View style={styles.toolbarSpacer} />
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !error ? <Text style={styles.muted}>You have no notifications yet.</Text> : null
        }
        refreshControl={
          <RefreshControl colors={[colors.primary]} onRefresh={() => void onRefresh()} refreshing={refreshing} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => void onOpen(item)}
            style={({ pressed }) => [
              styles.row,
              !item.readAt && styles.rowUnread,
              pressed && styles.rowPressed,
            ]}
          >
            <Text style={styles.rowTitle}>{item.payload.title}</Text>
            <Text style={styles.rowMeta}>{formatWhen(item.createdAt)}</Text>
          </Pressable>
        )}
      />

      {nextCursor ? (
        <View style={styles.more}>
          <Pressable
            onPress={() => {
              void load(nextCursor).catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Load failed.')
              })
            }}
            style={({ pressed }) => [styles.moreBtn, pressed && styles.moreBtnPressed]}
          >
            <Text style={styles.moreBtnText}>Load more</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  muted: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center' },
  error: { color: colors.urgent, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toolbarSpacer: { height: 36 },
  markAllBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  markAllBtnPressed: { opacity: 0.9 },
  markAllText: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.primary },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: 120, gap: spacing.sm },
  row: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  rowUnread: {
    borderColor: 'rgba(108, 99, 255, 0.35)',
  },
  rowPressed: { opacity: 0.92 },
  rowTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  rowMeta: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 6 },
  more: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, alignItems: 'center' },
  moreBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  moreBtnPressed: { opacity: 0.9 },
  moreBtnText: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.primary },
})
