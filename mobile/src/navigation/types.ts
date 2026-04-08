import type { NavigatorScreenParams } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps } from '@react-navigation/native'
import type { Listing } from '../lib/types'

/** Tab routes differ by flow mode; union covers both navigators. */
export type TabParamList = {
  Discover: undefined
  Sent: undefined
  RoomNeed: undefined
  MyListings: undefined
  HostInquiries: undefined
  Post: undefined
  Profile: undefined
}

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined
  ListingDetail: { listingId: string; listing?: Listing }
  InquiryDetail: { inquiryId: string }
  Notifications: undefined
  PostListing: { editListingId?: string }
  Auth: undefined
}

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  RootStackScreenProps<'Main'>
>
