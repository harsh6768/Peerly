import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import { FeedScreen } from '../screens/FeedScreen'
import { InquiryDetailScreen } from '../screens/InquiryDetailScreen'
import { ListingDetailScreen } from '../screens/ListingDetailScreen'
import { MyInquiriesScreen } from '../screens/MyInquiriesScreen'
import { PostListingScreen } from '../screens/PostListingScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import type { RootStackParamList, TabParamList } from './types'

// Auth is a stack-level screen so deep links from listing detail / post screens
// can push the sign-in view without leaving their context. ProfileScreen handles
// both the unauthenticated (sign-in) and authenticated (profile) states.

const Tab = createBottomTabNavigator<TabParamList>()
const Stack = createNativeStackNavigator<RootStackParamList>()

type TabIconProps = {
  label: string
  active: boolean
  emoji: string
}

function TabIcon({ label, active, emoji }: TabIconProps) {
  return (
    <View style={tabStyles.icon}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      <Text style={[tabStyles.label, active && tabStyles.labelActive]}>{label}</Text>
    </View>
  )
}

const tabStyles = StyleSheet.create({
  icon: { alignItems: 'center', gap: 2 },
  emoji: { fontSize: 20 },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primaryDark,
    fontWeight: fontWeights.semibold,
  },
})

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 14,
          left: 12,
          right: 12,
          borderRadius: radius.lg + 4,
          height: 76,
          paddingBottom: spacing.sm,
          paddingTop: spacing.sm,
          borderWidth: 1,
          borderColor: 'rgba(229, 231, 235, 0.88)',
          backgroundColor: 'rgba(255,255,255,0.95)',
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 12,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        component={FeedScreen}
        name="Feed"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon active={focused} emoji="🔍" label="Browse" />
          ),
        }}
      />
      <Tab.Screen
        component={MyInquiriesScreen}
        name="MyInquiries"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon active={focused} emoji="💬" label="Inquiries" />
          ),
        }}
      />
      <Tab.Screen
        component={PostListingScreen as unknown as React.ComponentType}
        name="Post"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon active={focused} emoji="🏠" label="Post" />
          ),
        }}
      />
      <Tab.Screen
        component={ProfileScreen}
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon active={focused} emoji="👤" label="Profile" />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: 'rgba(255,255,255,0.95)',
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: fontWeights.semibold,
          fontSize: fontSizes.md,
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        component={TabNavigator}
        name="Main"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={ListingDetailScreen}
        name="ListingDetail"
        options={{ title: 'Listing', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        component={PostListingScreen}
        name="PostListing"
        options={{ title: 'Post a Listing', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        component={InquiryDetailScreen}
        name="InquiryDetail"
        options={{ title: 'Inquiry', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        component={ProfileScreen}
        name="Auth"
        options={{ title: 'Sign in', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  )
}
