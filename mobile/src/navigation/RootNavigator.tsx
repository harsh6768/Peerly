import { Ionicons } from '@expo/vector-icons'
import type { ComponentType } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlowSwitch } from '../components/FlowSwitch'
import { NotificationBell } from '../components/NotificationBell'
import { colors, fontSizes, fontWeights, radius, shadows, spacing } from '../constants/theme'
import { useFlow } from '../context/FlowContext'
import { FeedScreen } from '../screens/FeedScreen'
import { HostInquiriesScreen } from '../screens/HostInquiriesScreen'
import { InquiryDetailScreen } from '../screens/InquiryDetailScreen'
import { NotificationsScreen } from '../screens/NotificationsScreen'
import { ListingDetailScreen } from '../screens/ListingDetailScreen'
import { MyListingsScreen } from '../screens/MyListingsScreen'
import { PostListingScreen } from '../screens/PostListingScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { RoomNeedScreen } from '../screens/RoomNeedScreen'
import { SentInquiriesScreen } from '../screens/SentInquiriesScreen'
import type { RootStackParamList, TabParamList } from './types'

const Tab = createBottomTabNavigator<TabParamList>()
const Stack = createNativeStackNavigator<RootStackParamList>()

function seekerTabScreens() {
  return [
    <Tab.Screen
      component={FeedScreen}
      key="Discover"
      name="Discover"
      options={{
        tabBarLabel: 'Discover',
        tabBarIcon: ({ color, size }) => <Ionicons color={color} name="compass-outline" size={size} />,
      }}
    />,
    <Tab.Screen
      component={SentInquiriesScreen}
      key="Sent"
      name="Sent"
      options={{
        tabBarLabel: 'Sent',
        tabBarIcon: ({ color, size }) => <Ionicons color={color} name="paper-plane-outline" size={size} />,
      }}
    />,
    <Tab.Screen
      component={RoomNeedScreen}
      key="RoomNeed"
      name="RoomNeed"
      options={{
        tabBarLabel: 'Room need',
        tabBarIcon: ({ color, size }) => <Ionicons color={color} name="clipboard-outline" size={size} />,
      }}
    />,
    <Tab.Screen
      component={ProfileScreen}
      key="ProfileSeeker"
      name="Profile"
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-circle-outline" size={size} />,
      }}
    />,
  ]
}

function hostTabScreens() {
  return [
    <Tab.Screen
      component={MyListingsScreen}
      key="MyListings"
      name="MyListings"
      options={{
        tabBarLabel: 'Listings',
        tabBarIcon: ({ color, size }) => <Ionicons color={color} name="grid-outline" size={size} />,
      }}
    />,
    <Tab.Screen
      component={HostInquiriesScreen}
      key="HostInquiries"
      name="HostInquiries"
      options={{
        tabBarLabel: 'Inbox',
        tabBarIcon: ({ color, size }) => <Ionicons color={color} name="mail-unread-outline" size={size} />,
      }}
    />,
    <Tab.Screen
      component={PostListingScreen as unknown as ComponentType}
      key="Post"
      name="Post"
      options={{
        tabBarLabel: 'Post',
        tabBarIcon: ({ color, size }) => <Ionicons color={color} name="add-circle-outline" size={size} />,
      }}
    />,
    <Tab.Screen
      component={ProfileScreen}
      key="ProfileHost"
      name="Profile"
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-circle-outline" size={size} />,
      }}
    />,
  ]
}

function MainTabs() {
  const insets = useSafeAreaInsets()
  const { flowMode, isHydrated } = useFlow()

  if (!isHydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />
  }

  return (
    <View style={styles.mainShell}>
      <View style={[styles.flowHeader, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.flowHeaderRow}>
          <View style={styles.flowHeaderSwitch}>
            <FlowSwitch />
          </View>
          <NotificationBell />
        </View>
      </View>
      <Tab.Navigator
        key={flowMode}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: {
            fontSize: fontSizes.xs,
            fontWeight: fontWeights.semibold,
          },
          tabBarStyle: {
            position: 'absolute',
            left: spacing.md,
            right: spacing.md,
            bottom: Math.max(insets.bottom, 12),
            height: 62,
            paddingBottom: 8,
            paddingTop: 6,
            borderRadius: radius.xl,
            backgroundColor: colors.tabBarBg,
            borderWidth: 1,
            borderColor: colors.border,
            ...shadows.tabBar,
          },
          tabBarItemStyle: { paddingVertical: 4 },
        }}
      >
        {flowMode === 'find_room' ? seekerTabScreens() : hostTabScreens()}
      </Tab.Navigator>
    </View>
  )
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: fontWeights.semibold,
          fontSize: fontSizes.md,
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen component={MainTabs} name="Main" options={{ headerShown: false }} />
      <Stack.Screen
        component={ListingDetailScreen}
        name="ListingDetail"
        options={{ title: 'Listing', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        component={PostListingScreen}
        name="PostListing"
        options={{ title: 'Post a listing', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        component={InquiryDetailScreen}
        name="InquiryDetail"
        options={{ title: 'Inquiry', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        component={NotificationsScreen}
        name="Notifications"
        options={{ title: 'Notifications', headerBackTitle: 'Back' }}
      />
      <Stack.Screen component={ProfileScreen} name="Auth" options={{ title: 'Sign in', headerBackTitle: 'Back' }} />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  mainShell: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flowHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  flowHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  flowHeaderSwitch: {
    flex: 1,
    minWidth: 0,
  },
})
