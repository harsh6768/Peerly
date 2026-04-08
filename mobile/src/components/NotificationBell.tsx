import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fontSizes, fontWeights, radius } from '../constants/theme'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { RootStackParamList } from '../navigation/types'

type Nav = NativeStackNavigationProp<RootStackParamList>

export function NotificationBell() {
  const navigation = useNavigation<Nav>()
  const { sessionToken } = useAuth()
  const [unread, setUnread] = useState(0)

  const load = useCallback(() => {
    if (!sessionToken) {
      setUnread(0)
      return
    }
    void apiRequest<{ unreadCount: number }>('/notifications/unread-count', { token: sessionToken })
      .then((r) => setUnread(r.unreadCount))
      .catch(() => setUnread(0))
  }, [sessionToken])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  useEffect(() => {
    if (!sessionToken) return
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [sessionToken, load])

  if (!sessionToken) {
    return null
  }

  return (
    <Pressable
      accessibilityLabel="Notifications"
      hitSlop={12}
      onPress={() => navigation.navigate('Notifications')}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <Ionicons color={colors.primary} name="notifications-outline" size={26} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
})
