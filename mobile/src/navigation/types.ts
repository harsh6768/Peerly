import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps } from '@react-navigation/native'
import type { Listing } from '../lib/types'

export type RootStackParamList = {
  Main: undefined
  ListingDetail: { listingId: string; listing?: Listing }
  InquiryDetail: { inquiryId: string }
  PostListing: { editListingId?: string }
  Auth: undefined
}

export type TabParamList = {
  Feed: undefined
  MyInquiries: undefined
  Post: undefined
  Profile: undefined
}

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  RootStackScreenProps<'Main'>
>
