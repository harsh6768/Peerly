export type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED' | 'FILLED'
export type ListingInquiryStatus = 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'CLOSED' | 'DECLINED'
export type ListingVisitStatus = 'NONE' | 'PROPOSED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
export type PublicListingBudgetFilter =
  | 'ANY'
  | 'UNDER_20000'
  | 'BETWEEN_20000_AND_30000'
  | 'BETWEEN_30000_AND_45000'
  | 'ABOVE_45000'

export type ListingImage = {
  id: string
  providerAssetId: string
  isCover: boolean
  sortOrder: number
  width?: number
  height?: number
  bytes?: number
}

export type NearbyPlace = {
  id?: string
  name: string
  type: 'tech_park' | 'company'
}

export type ListingMatchSummary = {
  matchScore: number
  qualityScore: number
  finalScore: number
  label: 'BEST_MATCH' | 'GOOD_MATCH' | 'POSSIBLE'
  reasons: string[]
}

export type ListingOwner = {
  id: string
  fullName: string
  companyName: string | null
  isVerified: boolean
}

export type Listing = {
  id: string
  type: string
  title: string
  description: string
  city: string | null
  locality: string | null
  locationName: string | null
  latitude: number | null
  longitude: number | null
  contactPhone: string | null
  rentAmount: number | null
  depositAmount: number | null
  maintenanceAmount: number | null
  miscCharges: string | null
  amenities: string[]
  propertyType: string | null
  occupancyType: string | null
  moveInDate: string | null
  moveOutDate: string | null
  urgencyLevel: string
  contactMode: string
  isBoosted: boolean
  status: ListingStatus
  createdAt: string
  updatedAt: string
  images: ListingImage[]
  nearbyPlaces: NearbyPlace[]
  owner: ListingOwner
  matchSummary?: ListingMatchSummary | null
}

export type InquiryPerson = {
  id: string
  fullName: string
  email: string
  phone: string | null
  homeCity: string | null
  isVerified: boolean
  companyName: string | null
  verificationType: string | null
  verificationStatus: string | null
}

export type InquiryMessage = {
  id: string
  body: string
  messageType: 'TEXT' | 'SYSTEM'
  createdAt: string
  sender: InquiryPerson | null
}

export type HousingNeedStatus = 'OPEN' | 'MATCHED' | 'CLOSED' | 'ARCHIVED'

export type HousingNeed = {
  id: string
  city: string
  locality: string | null
  preferredPropertyType: string
  preferredOccupancy: string
  maxRentAmount: number | null
  maxDepositAmount: number | null
  maxMaintenanceAmount: number | null
  preferredAmenities: string[]
  moveInDate: string
  urgencyLevel: string
  notes: string | null
  status: HousingNeedStatus
  createdAt: string
  updatedAt: string
  nearbyPlaces: Array<{ id: string; name: string; type: string }>
}

export type Inquiry = {
  id: string
  listingId: string
  requesterUserId: string
  listingOwnerUserId: string
  message: string | null
  budgetAmount: number | null
  preferredMoveInDate: string | null
  preferredOccupancy: string | null
  visitStatus: ListingVisitStatus
  status: ListingInquiryStatus
  scheduledVisitAt?: string | null
  scheduledVisitNote?: string | null
  visitConfirmedAt?: string | null
  visitCancelledAt?: string | null
  visitCompletedAt?: string | null
  createdAt: string
  updatedAt: string
  listing: Listing
  requester: InquiryPerson
  listingOwner: InquiryPerson
  conversation?: { id: string; messages: InquiryMessage[] } | null
}

export type PublicListingFilters = {
  city: string
  propertyType: string
  occupancyType: string
  budget: PublicListingBudgetFilter
}
