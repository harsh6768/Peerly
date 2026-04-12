import {
  ArrowRight,
  Building2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
  MoreHorizontal,
  PencilLine,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type DragEvent,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { DatePickerInput } from '../components/DatePickerInput'
import { LocationSummaryCard, PlaceAutocompleteField } from '../components/PlaceAutocompleteField'
import { useAppAuth } from '../context/AppAuthContext'
import { housingIntentValues, useHousingIntent, type HousingIntent } from '../context/HousingIntentContext'
import { apiRequest } from '../lib/api'
import { getListingImageUrl } from '../lib/listingImageUrl'
import { asListingsPage } from '../lib/listingsResponse'
import {
  cleanupUploadedListingImages,
  type ListingImageUploadPayload,
  uploadListingImageToCloudinary,
} from '../lib/cloudinary'
import type { SelectedPlaceLocation } from '../lib/googleMaps'
import { majorCities, otherCityOptionValue } from '../lib/majorCities'

type ListingImageRecord = {
  id: string
  providerAssetId: string
  isCover: boolean
  sortOrder: number
  width?: number
  height?: number
  bytes?: number
}

type NearbyPlaceType = 'tech_park' | 'company'

type NearbyPlace = {
  id?: string
  name: string
  type: NearbyPlaceType
}

type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED' | 'FILLED'
type HostListingFilter = 'ACTIVE' | 'PUBLISHED' | 'DRAFT' | 'PAUSED' | 'FILLED' | 'ARCHIVED' | 'ALL'
type ListingInquiryStatus = 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'CLOSED' | 'DECLINED'
type ListingVisitStatus = 'NONE' | 'PROPOSED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
type ListingInquiryFilter = 'ACTIVE' | ListingInquiryStatus | 'ALL'
type ListingInquirySort = 'RECENT' | 'OLDEST' | 'NEW_FIRST'
type PublicListingBudgetFilter =
  | 'ANY'
  | 'UNDER_20000'
  | 'BETWEEN_20000_AND_30000'
  | 'BETWEEN_30000_AND_45000'
  | 'ABOVE_45000'

type Listing = {
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
  images: ListingImageRecord[]
  nearbyPlaces: NearbyPlace[]
  owner: {
    id: string
    fullName: string
    companyName: string | null
    isVerified: boolean
  }
  matchSummary?: ListingMatchSummary | null
}

type ListingInquiryPerson = {
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

type ListingInquiryMessage = {
  id: string
  body: string
  messageType: 'TEXT' | 'SYSTEM'
  createdAt: string
  sender: ListingInquiryPerson | null
}

type ListingInquiry = {
  id: string
  listingId: string
  requesterUserId: string
  listingOwnerUserId: string
  message: string | null
  ownerNotes: string | null
  budgetAmount: number | null
  preferredMoveInDate: string | null
  preferredOccupancy: string | null
  preferredVisitAt: string | null
  preferredVisitNote: string | null
  scheduledVisitAt: string | null
  scheduledVisitNote: string | null
  visitStatus: ListingVisitStatus
  visitConfirmedAt: string | null
  visitCancelledAt: string | null
  visitCompletedAt: string | null
  status: ListingInquiryStatus
  createdAt: string
  updatedAt: string
  listing: Listing
  requester: ListingInquiryPerson
  listingOwner: ListingInquiryPerson
  conversation?: {
    id: string
    messages: ListingInquiryMessage[]
  } | null
}

type InquiryForm = {
  message: string
  budgetAmount: string
  preferredMoveInDate: string
  preferredOccupancy: string
  preferredVisitAt: string
  preferredVisitNote: string
}

type ReplaceTenantForm = {
  title: string
  city: string
  locality: string
  locationName: string
  latitude: number | null
  longitude: number | null
  moveInDate: string
  rentAmount: string
  depositAmount: string
  maintenanceAmount: string
  amenities: string[]
  nearbyPlaces: NearbyPlace[]
  propertyType: string
  occupancyType: string
  contactMode: string
  contactPhone: string
  description: string
  miscCharges: string
}

type DraftListingImage = {
  id: string
  fileName: string
  previewUrl: string
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
  file?: File
  upload?: ListingImageUploadPayload
  error?: string
  persisted?: boolean
}

type FeedbackState = {
  tone: 'success' | 'error' | 'info'
  message: string
}

type ListingDetailsRouteState = {
  listing?: Listing
  backLabel?: string
  backTo?: string
  sourceIntent?: HousingIntent
}

type ListingComposerRouteState = {
  listing?: Listing
  sourceIntent?: HousingIntent
}

type InquiryDetailsRouteState = {
  inquiry?: ListingInquiry
  backLabel?: string
  backTo?: string
  sourceIntent?: HousingIntent
}

type HousingNeedForm = {
  city: string
  locality: string
  maxRentAmount: string
  maxDepositAmount: string
  maxMaintenanceAmount: string
  preferredPropertyType: string
  preferredOccupancy: string
  preferredAmenities: string[]
  nearbyPlaces: NearbyPlace[]
  moveInDate: string
  urgencyLevel: string
  preferredContactMode: string
  notes: string
}

type HousingNeedStatus = 'OPEN' | 'MATCHED' | 'CLOSED' | 'ARCHIVED'

type HousingNeed = {
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

type ListingMatchLabel = 'BEST_MATCH' | 'GOOD_MATCH' | 'POSSIBLE'
type ListingMatchSummary = {
  matchScore: number
  qualityScore: number
  finalScore: number
  label: ListingMatchLabel
  reasons: string[]
}

type LocalFeedbackState = {
  tone: 'success' | 'error' | 'info'
  message: string
}

type HousingPageMode =
  | 'root'
  | 'seeker-needs'
  | 'seeker-posted-listings'
  | 'seeker-inquiries'
  | 'host-dashboard'
  | 'host-compose'
  | 'host-inquiries'
type PublicListingFilters = {
  city: string
  propertyType: string
  occupancyType: string
  amenity: string
  budget: PublicListingBudgetFilter
  verifiedOnly: boolean
}
type ListingActionConfirmation = {
  listing: Listing
  nextStatus: Extract<ListingStatus, 'ARCHIVED' | 'FILLED' | 'PAUSED' | 'PUBLISHED'>
}
type PublicListingFilterKey =
  | 'search'
  | 'city'
  | 'propertyType'
  | 'occupancyType'
  | 'amenity'
  | 'budget'
  | 'verifiedOnly'

const propertyTypes = ['ROOM', 'STUDIO', 'APARTMENT', 'PG', 'HOUSE']
const occupancyTypes = ['SINGLE', 'DOUBLE', 'SHARED']
const standardAmenities = [
  'Wifi',
  'Parking',
  'Washing machine',
  'Fridge',
  'Power backup',
  'Lift',
  'Gated security',
  'Gym',
  'Housekeeping',
  'Air conditioning',
  'Balcony',
  'Pet friendly',
] as const
const listingImageSuggestions = [
  'Living room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Balcony / view',
  'Building exterior',
  'Extra angle 1',
  'Extra angle 2',
] as const
const hostSteps = [
  'Basic info',
  'Pricing',
  'Amenities',
  'Room details',
  'Images',
  'Description',
  'Review',
] as const
const hostListingFilters: Array<{ label: string; value: HostListingFilter }> = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Drafts', value: 'DRAFT' },
  { label: 'On hold', value: 'PAUSED' },
  { label: 'Rented', value: 'FILLED' },
  { label: 'Archived', value: 'ARCHIVED' },
  { label: 'All', value: 'ALL' },
]
const listingInquiryFilters: Array<{ label: string; value: ListingInquiryFilter }> = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'New', value: 'NEW' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Declined', value: 'DECLINED' },
  { label: 'All', value: 'ALL' },
]
const listingInquirySortOptions: Array<{ label: string; value: ListingInquirySort }> = [
  { label: 'Newest first', value: 'RECENT' },
  { label: 'Needs action first', value: 'NEW_FIRST' },
  { label: 'Oldest first', value: 'OLDEST' },
]

function getHostListingFilterTone(value: HostListingFilter) {
  if (value === 'ACTIVE' || value === 'PUBLISHED') return 'mint'
  if (value === 'DRAFT' || value === 'ALL') return 'violet'
  return 'amber'
}

function getInquiryFilterTone(value: ListingInquiryFilter) {
  if (value === 'ACTIVE' || value === 'NEW' || value === 'CONTACTED') return 'mint'
  if (value === 'ALL') return 'violet'
  return 'amber'
}
const publicListingBudgetFilters: Array<{ label: string; value: PublicListingBudgetFilter }> = [
  { label: 'Any budget', value: 'ANY' },
  { label: 'Under 20k', value: 'UNDER_20000' },
  { label: '20k - 30k', value: 'BETWEEN_20000_AND_30000' },
  { label: '30k - 45k', value: 'BETWEEN_30000_AND_45000' },
  { label: '45k+', value: 'ABOVE_45000' },
]
const popularTechParks = [
  'Bagmane Tech Park',
  'Embassy Tech Village',
  'Ecospace',
  'ITPL',
  'Manyata Tech Park',
  'RMZ Ecoworld',
  'RMZ Ecosystem',
  'DLF Cyber City',
  'Cyber City Hyderabad',
  'HITEC City',
] as const
const popularOffices = [
  'Google',
  'Microsoft',
  'Amazon',
  'Flipkart',
  'Uber',
  'Adobe',
  'Goldman Sachs',
  'Accenture',
  'Infosys',
  'TCS',
] as const
const listingIntentStorageKey = 'cirvo.listing-intents'

function readListingIntentAssignments(): Record<string, HousingIntent> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const rawAssignments = window.localStorage.getItem(listingIntentStorageKey)
    if (!rawAssignments) {
      return {}
    }

    const parsedAssignments = JSON.parse(rawAssignments) as Record<string, unknown>
    return Object.entries(parsedAssignments).reduce<Record<string, HousingIntent>>((accumulator, [listingId, intent]) => {
      if (intent === housingIntentValues.findRoom || intent === housingIntentValues.tenantReplacement) {
        accumulator[listingId] = intent
      }

      return accumulator
    }, {})
  } catch {
    return {}
  }
}

function persistListingIntentAssignments(assignments: Record<string, HousingIntent>) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(listingIntentStorageKey, JSON.stringify(assignments))
}

function getListingIntentForDisplay(
  listingId: string,
  assignments: Record<string, HousingIntent>,
): HousingIntent {
  return assignments[listingId] ?? housingIntentValues.tenantReplacement
}

function shouldUseListingComposerRouteState(value: unknown): value is ListingComposerRouteState {
  if (!value || typeof value !== 'object') {
    return false
  }

  return 'listing' in value || 'sourceIntent' in value
}

function SearchListingCard({
  existingInquiry,
  listing,
  matchSummary,
}: {
  existingInquiry?: ListingInquiry | null
  listing: Listing
  matchSummary?: ListingMatchSummary | null
}) {
  const navigate = useNavigate()
  const [showInlineDetails, setShowInlineDetails] = useState(false)
  const contactActionLabel = listing.contactMode === 'CALL' ? 'Call owner' : 'WhatsApp owner'

  function handleViewDetails() {
    if (isDesktopViewport()) {
      navigate(`/find-tenant/listings/${listing.id}`, {
        state: {
          listing,
          backLabel: 'Back to live listings',
          backTo: '/find-tenant',
          sourceIntent: housingIntentValues.findRoom,
        } as ListingDetailsRouteState,
      })
      return
    }

    setShowInlineDetails((current) => !current)
  }

  return (
    <Card className={`feed-card${showInlineDetails ? ' expanded' : ''}`}>
      {/* Clean image — no overlaid badges */}
      <div className="feed-card-media-wrap">
        {renderListingCoverImage(listing)}
      </div>

      {/* Title + single-line truncated short location */}
      <div className="feed-card-heading">
        <strong className="feed-card-title">{listing.title}</strong>
        <p className="feed-card-location">
          <MapPin size={13} />
          <span>{formatListingLocationShort(listing)}</span>
        </p>
      </div>

      {/* Status badges: match, inquiry, verified — always readable in card body */}
      <div className="feed-card-badges">
        {matchSummary ? (
          <Badge tone={getListingMatchTone(matchSummary.label)}>
            {formatListingMatchLabel(matchSummary.label)}
          </Badge>
        ) : null}
        {existingInquiry ? (
          <Badge tone={getListingInquiryStatusTone(existingInquiry.status)}>Inquiry sent</Badge>
        ) : null}
        {listing.owner.isVerified ? (
          <Badge tone="green">Verified host</Badge>
        ) : null}
      </div>

      {/* Price · Move-in · Fit score all in one row */}
      <div className="feed-meta-row">
        <span>
          <Building2 size={15} />
          {formatPriceLine(listing)}
        </span>
        <span>
          <CalendarRange size={15} />
          {formatMoveInLabel(listing.moveInDate)}
        </span>
        {matchSummary ? (
          <span className="feed-fit-score">{formatMatchFitPercent(matchSummary)}% fit</span>
        ) : null}
      </div>

      {/* Amenity chips — cap at 3 to keep card height consistent */}
      {(() => {
        const typeChips = [
          listing.propertyType ? formatEnum(listing.propertyType) : null,
          listing.occupancyType ? formatEnum(listing.occupancyType) : null,
        ].filter(Boolean) as string[]
        const amenityChips = getVisibleAmenities(listing.amenities)
        const allChips = [...typeChips, ...amenityChips]
        const visible = allChips.slice(0, 3)
        const extra = allChips.length - visible.length
        return (
          <div className="nearby-place-chip-row compact">
            {visible.map((chip) => (
              <span className="nearby-place-chip static" key={`${listing.id}-${chip}`}>{chip}</span>
            ))}
            {extra > 0 ? (
              <span className="nearby-place-chip static muted">+{extra}</span>
            ) : null}
          </div>
        )
      })()}

      {/* Match reasons — cap at 2 pills to avoid wrapping */}
      {matchSummary?.reasons.length ? (
        <div className="listing-match-reason-row">
          {matchSummary.reasons.slice(0, 2).map((reason) => (
            <span className="listing-match-reason-pill" key={`${listing.id}-${reason}`}>
              {reason}
            </span>
          ))}
          {matchSummary.reasons.length > 2 ? (
            <span className="listing-match-reason-pill listing-match-reason-pill--more">
              +{matchSummary.reasons.length - 2} more
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Owner + action buttons in a single footer row */}
      <div className="feed-card-footer">
        <div className="feed-card-owner">
          <strong>{listing.owner.fullName}</strong>
          <span>{listing.owner.companyName ?? (listing.owner.isVerified ? 'Verified host' : 'Host')}</span>
        </div>
        <div className="feed-card-actions">
          <Button onClick={handleViewDetails} variant="secondary">
            {showInlineDetails ? 'Hide details' : 'View details'}
          </Button>
        </div>
      </div>

      {showInlineDetails ? (
        <div className="listing-details-panel">
          {listing.images.length > 1 ? (
            <div className="listing-details-section">
              <span className="muted">Apartment photos</span>
              {renderListingImageGallery(listing, { className: 'feed-media feed-media-expanded', hideCount: true })}
            </div>
          ) : null}

          <div className="listing-details-fact-grid">
            <div className="listing-details-fact">
              <span className="muted">Rent</span>
              <strong>{formatPriceLine(listing)}</strong>
            </div>
            {listing.depositAmount ? (
              <div className="listing-details-fact">
                <span className="muted">Deposit</span>
                <strong>{formatMoney(listing.depositAmount)}</strong>
              </div>
            ) : null}
            {listing.maintenanceAmount ? (
              <div className="listing-details-fact">
                <span className="muted">Maintenance</span>
                <strong>{formatMoney(listing.maintenanceAmount)}</strong>
              </div>
            ) : null}
            <div className="listing-details-fact">
              <span className="muted">Move in</span>
              <strong>{formatMoveInLabel(listing.moveInDate).replace('Move in ', '')}</strong>
            </div>
          </div>

          {listing.description ? (
            <div className="listing-details-section">
              <strong>About this apartment</strong>
              <p className="feed-copy">{listing.description}</p>
              {listing.miscCharges ? <p className="feed-copy feed-copy-compact">Extras: {listing.miscCharges}</p> : null}
            </div>
          ) : null}

          {listing.amenities.length > 0 ? (
            <div className="listing-amenities">
              <strong>Amenities</strong>
              <div className="nearby-place-chip-row compact">
                {listing.amenities.map((amenity) => (
                  <span className="nearby-place-chip static" key={`${listing.id}-${amenity}`}>
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="listing-details-section">
            <strong>Location</strong>
            <LocationSummaryCard
              compact
              location={toSelectedPlaceLocation(
                listing.locationName,
                listing.latitude,
                listing.longitude,
              )}
              showCoordinates={false}
            />
          </div>

          <div className="listing-contact-card">
            <div className="listing-contact-head">
              <strong>Contact owner</strong>
              <span className="muted">{formatContactPhone(listing.contactPhone)}</span>
            </div>

            {listing.contactPhone ? (
              <Button
                onClick={() =>
                  window.open(
                    listing.contactMode === 'CALL'
                      ? buildCallLink(listing.contactPhone)
                      : buildWhatsappLink(listing.contactPhone),
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
                variant="secondary"
              >
                {contactActionLabel}
              </Button>
            ) : (
              <div className="listing-contact-lock">
                <MapPin size={16} />
                <span>Contact number has not been added to this listing yet.</span>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function HostListingCard({
  listing,
  busyAction,
  onArchive,
  onEdit,
  onMarkAsRented,
  onResume,
  onToggleHold,
  onViewDetails,
}: {
  listing: Listing
  busyAction: string | null
  onArchive: (listing: Listing) => void
  onEdit: (listing: Listing) => void
  onMarkAsRented: (listing: Listing) => void
  onResume: (listing: Listing) => void
  onToggleHold: (listing: Listing) => void
  onViewDetails: (listing: Listing) => void
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <Card className="host-listing-card">
      {renderListingCoverImage(listing, {
        className: 'feed-media host-listing-cover',
        emptyLabel: 'Add a cover image to help this listing look complete in the dashboard.',
      })}

      <div className="feed-card-top">
        <div>
          <strong>{listing.title}</strong>
          <p>{formatListingLocation(listing)}</p>
        </div>
        <span className="host-listing-status-badge-desktop">
          <Badge tone={getListingStatusTone(listing.status)}>{formatListingStatus(listing.status)}</Badge>
        </span>
      </div>

      <div className="nearby-place-chip-row compact">
        {listing.propertyType ? <span className="nearby-place-chip static">{formatEnum(listing.propertyType)}</span> : null}
        {listing.occupancyType ? <span className="nearby-place-chip static">{formatEnum(listing.occupancyType)}</span> : null}
        {getVisibleAmenities(listing.amenities).map((amenity) => (
          <span className="nearby-place-chip static" key={`${listing.id}-${amenity}`}>
            {amenity}
          </span>
        ))}
      </div>

      <div className="host-listing-meta">
        <span>{formatPriceLine(listing)}</span>
        <span>
          Created {formatShortDate(listing.createdAt)}
          <span className="host-listing-status-inline-mobile"> · {formatListingStatus(listing.status)}</span>
        </span>
      </div>

      {/* Native-feeling card actions: primary CTA + ⋯ context menu */}
      <div className="host-listing-card-actions">
        <Button
          className="host-listing-primary-action"
          onClick={() => onViewDetails(listing)}
          variant="secondary"
        >
          View details
        </Button>
        <button
          aria-expanded={isMenuOpen}
          aria-label="More actions"
          className={`circle-button host-listing-menu-trigger${isMenuOpen ? ' active' : ''}`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          type="button"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {isMenuOpen && (
        <div className="host-listing-menu" role="menu">
          <button
            onClick={() => { onEdit(listing); setIsMenuOpen(false) }}
            role="menuitem"
            type="button"
          >
            <PencilLine size={16} />
            Edit listing
          </button>
          {listing.status === 'PAUSED' ? (
            <button
              disabled={busyAction === `PUBLISHED-${listing.id}`}
              onClick={() => { onResume(listing); setIsMenuOpen(false) }}
              role="menuitem"
              type="button"
            >
              {busyAction === `PUBLISHED-${listing.id}` ? 'Resuming…' : 'Resume listing'}
            </button>
          ) : listing.status === 'PUBLISHED' ? (
            <button
              disabled={busyAction === `PAUSED-${listing.id}`}
              onClick={() => { onToggleHold(listing); setIsMenuOpen(false) }}
              role="menuitem"
              type="button"
            >
              {busyAction === `PAUSED-${listing.id}` ? 'Updating…' : 'Put on hold'}
            </button>
          ) : null}
          <button
            disabled={busyAction === `FILLED-${listing.id}` || listing.status === 'FILLED'}
            onClick={() => { onMarkAsRented(listing); setIsMenuOpen(false) }}
            role="menuitem"
            type="button"
          >
            {busyAction === `FILLED-${listing.id}`
              ? 'Updating…'
              : listing.status === 'FILLED'
                ? 'Already marked as rented'
                : 'Mark as rented'}
          </button>
          <button
            className="host-menu-destructive"
            disabled={busyAction === `ARCHIVED-${listing.id}`}
            onClick={() => { onArchive(listing); setIsMenuOpen(false) }}
            role="menuitem"
            type="button"
          >
            <Trash2 size={16} />
            {busyAction === `ARCHIVED-${listing.id}` ? 'Removing…' : 'Delete listing'}
          </button>
        </div>
      )}
    </Card>
  )
}

function ListingActionDialog({
  action,
  busyAction,
  onCancel,
  onConfirm,
}: {
  action: ListingActionConfirmation
  busyAction: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  const isArchiveAction = action.nextStatus === 'ARCHIVED'
  const isPauseAction = action.nextStatus === 'PAUSED'
  const isResumeAction = action.nextStatus === 'PUBLISHED'
  const actionKey = `${action.nextStatus}-${action.listing.id}`
  const isBusy = busyAction === actionKey

  return (
    <div
      aria-modal="true"
      className="action-dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onCancel()
        }
      }}
      role="dialog"
    >
      <div className="action-dialog">
        <div className="action-dialog-header">
          <Badge tone={isArchiveAction ? 'red' : isPauseAction ? 'purple' : 'green'}>
            {isArchiveAction
              ? 'Delete listing'
              : isPauseAction
                ? 'Put listing on hold'
                : isResumeAction
                  ? 'Resume listing'
                  : 'Mark as rented'}
          </Badge>
          <strong>
            {isArchiveAction
              ? 'Delete this listing from your active view?'
              : isPauseAction
                ? 'Put this listing on hold?'
                : isResumeAction
                  ? 'Resume this listing publicly?'
                  : 'Mark this listing as rented?'}
          </strong>
          <p>
            {isArchiveAction
              ? 'This post will move out of the default listings view and remain available under archived filters whenever you need it.'
              : isPauseAction
                ? 'This post will be hidden from the public feed until you resume it, while keeping all existing inquiries intact.'
                : isResumeAction
                  ? 'This post will return to the public feed so seekers can discover it again.'
                  : 'This post will be removed from active listings and remain visible under rented filters for future reference. Active inquiries will be closed automatically.'}
          </p>
        </div>

        <div className="action-dialog-summary">
          <strong>{action.listing.title}</strong>
          <span>{formatListingLocation(action.listing)}</span>
          <span>{formatPriceLine(action.listing)}</span>
        </div>

        <div className="action-dialog-footer">
          <Button disabled={isBusy} onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button
            className={
              isArchiveAction
                ? 'listing-action-button listing-action-delete'
                : isPauseAction
                  ? 'listing-action-button listing-action-hold'
                  : isResumeAction
                    ? 'listing-action-button listing-action-resume'
                    : 'listing-action-button listing-action-rented'
            }
            disabled={isBusy}
            onClick={onConfirm}
            variant="ghost"
          >
            {isBusy
              ? isArchiveAction
                ? 'Deleting...'
                : isResumeAction
                  ? 'Resuming...'
                  : 'Updating...'
              : isArchiveAction
                ? 'Yes, delete listing'
                : isPauseAction
                  ? 'Yes, put on hold'
                  : isResumeAction
                    ? 'Yes, resume listing'
                    : 'Yes, mark as rented'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ListingImageCarousel({ listing }: { listing: Listing }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const images = listing.images
  const activeImage = images[activeImageIndex] ?? images[0]
  const hasMultipleImages = images.length > 1

  useEffect(() => {
    setActiveImageIndex(0)
  }, [listing.id])

  if (!activeImage) {
    return null
  }

  function showPreviousImage() {
    setActiveImageIndex((current) => (current === 0 ? images.length - 1 : current - 1))
  }

  function showNextImage() {
    setActiveImageIndex((current) => (current === images.length - 1 ? 0 : current + 1))
  }

  return (
    <div className="listing-carousel">
      <div className="listing-carousel-stage">
        <img
          alt={`${listing.title} photo ${activeImageIndex + 1}`}
          className="listing-carousel-image"
          loading="lazy"
          src={getListingImageUrl(activeImage.providerAssetId, 'detail')}
        />

        {hasMultipleImages ? (
          <>
            <button
              aria-label="Show previous apartment photo"
              className="circle-button listing-carousel-nav listing-carousel-nav-prev"
              onClick={showPreviousImage}
              type="button"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              aria-label="Show next apartment photo"
              className="circle-button listing-carousel-nav listing-carousel-nav-next"
              onClick={showNextImage}
              type="button"
            >
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}

        <span className="feed-media-count listing-carousel-count">
          {activeImageIndex + 1} / {images.length}
        </span>
      </div>

      {hasMultipleImages ? (
        <div aria-label={`${listing.title} photo thumbnails`} className="listing-carousel-thumbnails" role="list">
          {images.map((image, index) => (
            <button
              aria-label={`Show apartment photo ${index + 1}`}
              aria-pressed={index === activeImageIndex}
              className={`listing-carousel-thumb${index === activeImageIndex ? ' active' : ''}`}
              key={image.id}
              onClick={() => setActiveImageIndex(index)}
              role="listitem"
              type="button"
            >
              <img
                alt={`${listing.title} thumbnail ${index + 1}`}
                loading="lazy"
                src={getListingImageUrl(image.providerAssetId, 'thumb')}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ListingInquiryPanel({
  feedback,
  inquiry,
  isLoading,
  isSubmitting,
  listing,
  onChange,
  onSubmit,
  onViewProfile,
  sessionUserPhone,
  sessionUserId,
  values,
}: {
  feedback: LocalFeedbackState | null
  inquiry: ListingInquiry | null
  isLoading: boolean
  isSubmitting: boolean
  listing: Listing
  onChange: Dispatch<SetStateAction<InquiryForm>>
  onSubmit: () => void
  onViewProfile: () => void
  sessionUserPhone: string | null
  sessionUserId: string | null
  values: InquiryForm
}) {
  const [isComposerOpen, setIsComposerOpen] = useState(false)

  if (!sessionUserId) {
    return (
      <Card className="listing-inquiry-card">
        <strong>Interested in this listing?</strong>
        <p className="feed-copy">
          Sign in first to unlock the inquiry flow. Once logged in, you can click `Interested` and share your move-in preference, budget, and visit availability with the owner.
        </p>
        <div className="feed-card-actions">
          <Button disabled variant="secondary">
            Interested
          </Button>
          <Button onClick={onViewProfile} variant="ghost">
            Sign in to continue
          </Button>
        </div>
      </Card>
    )
  }

  if (sessionUserId === listing.owner.id) {
    return (
      <Card className="listing-inquiry-card">
        <strong>This is your listing</strong>
        <p className="feed-copy">
          Incoming inquiries for this apartment will appear in your tenant replacement dashboard.
        </p>
      </Card>
    )
  }

  if (!sessionUserPhone?.trim()) {
    return (
      <Card className="listing-inquiry-card">
        <strong>Add your phone number before sending an inquiry</strong>
        <p className="feed-copy">
          Owners need a working phone or WhatsApp number to contact you after you click `Interested`.
        </p>
        <div className="feed-card-actions">
          <Button disabled variant="secondary">
            Interested
          </Button>
          <Button onClick={onViewProfile} variant="ghost">
            Add phone in profile
          </Button>
        </div>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="listing-inquiry-card">
        <strong>Checking your inquiry status</strong>
        <p className="feed-copy">We’re looking for any active inquiry you may already have for this listing.</p>
      </Card>
    )
  }

  if (inquiry) {
    return (
      <Card className="listing-inquiry-card">
        <div className="inquiry-card-top">
          <div>
            <strong>Inquiry already sent</strong>
            <p>Submitted {formatDateTime(inquiry.createdAt)}</p>
          </div>
          <div className="listing-card-badges">
            <Badge tone={getListingInquiryStatusTone(inquiry.status)}>
              {formatListingInquiryStatus(inquiry.status)}
            </Badge>
            {inquiry.visitStatus !== 'NONE' ? (
              <Badge tone={getListingVisitTone(inquiry.visitStatus)}>{formatListingVisitStatus(inquiry.visitStatus)}</Badge>
            ) : null}
          </div>
        </div>

        <div className="inquiry-fact-grid">
          {inquiry.budgetAmount ? (
            <div className="listing-details-fact">
              <span className="muted">Budget</span>
              <strong>{formatMoney(inquiry.budgetAmount)}</strong>
            </div>
          ) : null}
          {inquiry.preferredMoveInDate ? (
            <div className="listing-details-fact">
              <span className="muted">Preferred move-in</span>
              <strong>{formatShortDate(inquiry.preferredMoveInDate)}</strong>
            </div>
          ) : null}
          {inquiry.preferredOccupancy ? (
            <div className="listing-details-fact">
              <span className="muted">Occupancy</span>
              <strong>{formatEnum(inquiry.preferredOccupancy)}</strong>
            </div>
          ) : null}
          {inquiry.scheduledVisitAt ? (
            <div className="listing-details-fact">
              <span className="muted">Scheduled visit</span>
              <strong>{formatDateTime(inquiry.scheduledVisitAt)}</strong>
            </div>
          ) : inquiry.preferredVisitAt ? (
            <div className="listing-details-fact">
              <span className="muted">Preferred visit</span>
              <strong>{formatDateTime(inquiry.preferredVisitAt)}</strong>
            </div>
          ) : null}
        </div>

        {inquiry.message ? (
          <div className="listing-details-section">
            <strong>Your note</strong>
            <p className="feed-copy">{inquiry.message}</p>
          </div>
        ) : null}

        {inquiry.scheduledVisitNote || inquiry.preferredVisitNote ? (
          <p className="feed-copy feed-copy-compact">
            {inquiry.scheduledVisitAt ? 'Visit notes' : 'Visit preference'}:{' '}
            {inquiry.scheduledVisitNote ?? inquiry.preferredVisitNote}
          </p>
        ) : null}
      </Card>
    )
  }

  if (!isComposerOpen) {
    return (
      <Card className="listing-inquiry-card">
        <div className="inquiry-card-top">
          <div>
            <strong>Interested in this listing?</strong>
            <p>Start a structured inquiry so the owner can review your move-in timing, budget, and visit preference quickly.</p>
          </div>
          <Badge tone="purple">Structured lead</Badge>
        </div>

        {feedback ? <div className={`feedback-banner feedback-${feedback.tone}`}>{feedback.message}</div> : null}

        <div className="feed-card-actions">
          <Button onClick={() => setIsComposerOpen(true)}>
            Interested
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="listing-inquiry-card">
      <div className="inquiry-card-top">
        <div>
          <strong>Send inquiry</strong>
          <p>Share your move-in timing, budget, and visit preference so the owner can respond faster.</p>
        </div>
        <Badge tone="purple">Structured lead</Badge>
      </div>

      {feedback ? <div className={`feedback-banner feedback-${feedback.tone}`}>{feedback.message}</div> : null}

      <div className="field">
        <label htmlFor="listing-inquiry-message">Message</label>
        <textarea
          id="listing-inquiry-message"
          onChange={(event) => onChange((current) => ({ ...current, message: event.target.value }))}
          placeholder="Tell the owner why this listing fits your requirement."
          rows={4}
          value={values.message}
        />
      </div>

      <div className="form-grid two-column">
        <div className="field">
          <label htmlFor="listing-inquiry-move-in">Preferred move-in date</label>
          <DatePickerInput
            id="listing-inquiry-move-in"
            min={getTodayDateInputValue()}
            onChange={(v) => onChange((current) => ({ ...current, preferredMoveInDate: v }))}
            value={values.preferredMoveInDate}
          />
        </div>
        <div className="field">
          <label htmlFor="listing-inquiry-budget">Budget</label>
          <input
            id="listing-inquiry-budget"
            inputMode="numeric"
            onChange={(event) => onChange((current) => ({ ...current, budgetAmount: event.target.value }))}
            placeholder="22000"
            value={values.budgetAmount}
          />
        </div>
      </div>

      <div className="form-grid two-column">
        <div className="field">
          <label htmlFor="listing-inquiry-occupancy">Preferred occupancy</label>
          <select
            id="listing-inquiry-occupancy"
            onChange={(event) => onChange((current) => ({ ...current, preferredOccupancy: event.target.value }))}
            value={values.preferredOccupancy}
          >
            <option value="">Select occupancy</option>
            {occupancyTypes.map((type) => (
              <option key={type} value={type}>
                {formatEnum(type)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="listing-inquiry-visit-at">Preferred visit time</label>
          <input
            id="listing-inquiry-visit-at"
            min={getTodayDateTimeInputValue()}
            onChange={(event) => onChange((current) => ({ ...current, preferredVisitAt: event.target.value }))}
            type="datetime-local"
            value={values.preferredVisitAt}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="listing-inquiry-visit-note">Visit note</label>
        <input
          id="listing-inquiry-visit-note"
          onChange={(event) => onChange((current) => ({ ...current, preferredVisitNote: event.target.value }))}
          placeholder="Example: Available after 7 PM on weekdays."
          value={values.preferredVisitNote}
        />
      </div>

      <div className="feed-card-actions">
        <Button disabled={isSubmitting} onClick={onSubmit}>
          {isSubmitting ? 'Sending inquiry...' : 'Send inquiry'}
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={() => setIsComposerOpen(false)}
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </Card>
  )
}

function OwnerInquiryCard({
  busyAction,
  inquiry,
  isScheduleOpen,
  onClose,
  onDecline,
  onOpenInquiry,
  onMarkContacted,
  onOpenListing,
  onOpenSchedule,
  onSaveSchedule,
  onScheduleVisitAtChange,
  onScheduleVisitNoteChange,
  onStopScheduling,
  scheduleVisitAt,
  scheduleVisitNote,
}: {
  busyAction: string | null
  inquiry: ListingInquiry
  isScheduleOpen: boolean
  onClose: () => void
  onDecline: () => void
  onOpenInquiry: () => void
  onMarkContacted: () => void
  onOpenListing: (listing: Listing) => void
  onOpenSchedule: () => void
  onSaveSchedule: () => void
  onScheduleVisitAtChange: (value: string) => void
  onScheduleVisitNoteChange: (value: string) => void
  onStopScheduling: () => void
  scheduleVisitAt: string
  scheduleVisitNote: string
}) {
  const canManage = inquiry.status !== 'CLOSED' && inquiry.status !== 'DECLINED'
  const contactSeekerLabel = inquiry.requester.phone ? 'Contact seeker on WhatsApp' : 'Contact seeker by email'
  const contactSeekerSummary = inquiry.requester.phone
    ? 'Use the saved phone number to message the interested seeker directly.'
    : 'No phone number was added yet, so email is the best available contact method.'

  return (
    <Card className="listing-inquiry-card owner-inquiry-card">
      <div className="inquiry-card-top">
        <div>
          <strong>{inquiry.requester.fullName}</strong>
          <p>
            Interested in {inquiry.listing.title}
            {inquiry.requester.companyName ? ` · ${inquiry.requester.companyName}` : ''}
          </p>
        </div>
        <div className="listing-card-badges">
          <Badge tone={getListingInquiryStatusTone(inquiry.status)}>
            {formatListingInquiryStatus(inquiry.status)}
          </Badge>
          {inquiry.visitStatus !== 'NONE' ? (
            <Badge tone={getListingVisitTone(inquiry.visitStatus)}>{formatListingVisitStatus(inquiry.visitStatus)}</Badge>
          ) : null}
        </div>
      </div>

      <div className="inquiry-meta-row">
        <span>Sent {formatDateTime(inquiry.createdAt)}</span>
        {inquiry.requester.homeCity ? <span>{inquiry.requester.homeCity}</span> : null}
      </div>

      <div className="inquiry-fact-grid">
        {inquiry.budgetAmount ? (
          <div className="listing-details-fact">
            <span className="muted">Budget</span>
            <strong>{formatMoney(inquiry.budgetAmount)}</strong>
          </div>
        ) : null}
        {inquiry.preferredMoveInDate ? (
          <div className="listing-details-fact">
            <span className="muted">Move-in</span>
            <strong>{formatShortDate(inquiry.preferredMoveInDate)}</strong>
          </div>
        ) : null}
        {inquiry.preferredOccupancy ? (
          <div className="listing-details-fact">
            <span className="muted">Occupancy</span>
            <strong>{formatEnum(inquiry.preferredOccupancy)}</strong>
          </div>
        ) : null}
        {inquiry.scheduledVisitAt ? (
          <div className="listing-details-fact">
            <span className="muted">Scheduled visit</span>
            <strong>{formatDateTime(inquiry.scheduledVisitAt)}</strong>
          </div>
        ) : inquiry.preferredVisitAt ? (
          <div className="listing-details-fact">
            <span className="muted">Preferred visit</span>
            <strong>{formatDateTime(inquiry.preferredVisitAt)}</strong>
          </div>
        ) : null}
      </div>

      {inquiry.message ? (
        <div className="listing-details-section">
          <strong>Message</strong>
          <p className="feed-copy">{inquiry.message}</p>
        </div>
      ) : null}

      {inquiry.preferredVisitNote || inquiry.scheduledVisitNote ? (
        <p className="feed-copy feed-copy-compact">
          {inquiry.scheduledVisitAt ? 'Visit notes' : 'Visit preference'}:{' '}
          {inquiry.scheduledVisitNote ?? inquiry.preferredVisitNote}
        </p>
      ) : null}

      <div className="inquiry-contact-card">
        <div className="inquiry-contact-head">
          <div>
            <strong>Seeker contact</strong>
            <p>{contactSeekerSummary}</p>
          </div>
          <Badge tone={inquiry.requester.phone ? 'green' : 'gray'}>
            {inquiry.requester.phone ? 'Phone available' : 'Email only'}
          </Badge>
        </div>

        <div className="inquiry-contact-grid">
          <div className="listing-details-fact">
            <span className="muted">Email</span>
            <strong>{inquiry.requester.email}</strong>
          </div>
          <div className="listing-details-fact">
            <span className="muted">Phone</span>
            <strong>{formatContactPhone(inquiry.requester.phone)}</strong>
          </div>
        </div>

        <div className="feed-card-actions">
          <Button
            className="listing-action-button listing-action-contact"
            onClick={() =>
              window.open(
                inquiry.requester.phone
                  ? buildWhatsappLink(inquiry.requester.phone)
                  : buildMailtoLink(inquiry.requester.email, inquiry.listing.title),
                '_blank',
                'noopener,noreferrer',
              )
            }
            variant="secondary"
          >
            {contactSeekerLabel}
          </Button>
          <Button
            className="listing-action-button listing-action-details"
            onClick={() => window.open(buildMailtoLink(inquiry.requester.email, inquiry.listing.title), '_blank', 'noopener,noreferrer')}
            variant="ghost"
          >
            Email seeker
          </Button>
          {inquiry.requester.phone ? (
            <Button
              className="listing-action-button listing-action-edit"
              onClick={() => window.open(buildCallLink(inquiry.requester.phone), '_self')}
              variant="ghost"
            >
              Call seeker
            </Button>
          ) : null}
        </div>
      </div>

      <div className="inquiry-actions">
        <Button onClick={onOpenInquiry}>Review inquiry</Button>
        <Button onClick={() => onOpenListing(inquiry.listing)} variant="secondary">
          Open listing
        </Button>

        {canManage && inquiry.status === 'NEW' ? (
          <Button
            disabled={busyAction === `CONTACTED-${inquiry.id}`}
            onClick={onMarkContacted}
            variant="ghost"
          >
            {busyAction === `CONTACTED-${inquiry.id}` ? 'Updating...' : 'Mark contacted'}
          </Button>
        ) : null}

        {canManage ? (
          <Button
            disabled={busyAction === `SCHEDULED-${inquiry.id}`}
            onClick={isScheduleOpen ? onStopScheduling : onOpenSchedule}
            variant="ghost"
          >
            {isScheduleOpen
              ? 'Cancel schedule'
              : inquiry.visitStatus === 'CONFIRMED'
                ? 'Reschedule visit'
                : inquiry.visitStatus === 'PROPOSED'
                  ? 'Update proposal'
                  : 'Schedule visit'}
          </Button>
        ) : null}

        {canManage ? (
          <Button
            disabled={busyAction === `DECLINED-${inquiry.id}`}
            onClick={onDecline}
            variant="ghost"
          >
            {busyAction === `DECLINED-${inquiry.id}` ? 'Updating...' : 'Decline'}
          </Button>
        ) : null}

        {canManage ? (
          <Button
            disabled={busyAction === `CLOSED-${inquiry.id}`}
            onClick={onClose}
            variant="ghost"
          >
            {busyAction === `CLOSED-${inquiry.id}` ? 'Updating...' : 'Close'}
          </Button>
        ) : null}
      </div>

      {isScheduleOpen ? (
        <div className="inquiry-schedule-form">
          <div className="field">
            <label htmlFor={`schedule-visit-${inquiry.id}`}>Visit date and time</label>
            <input
              id={`schedule-visit-${inquiry.id}`}
              min={getTodayDateTimeInputValue()}
              onChange={(event) => onScheduleVisitAtChange(event.target.value)}
              type="datetime-local"
              value={scheduleVisitAt}
            />
          </div>

          <div className="field">
            <label htmlFor={`schedule-note-${inquiry.id}`}>Visit note</label>
            <input
              id={`schedule-note-${inquiry.id}`}
              onChange={(event) => onScheduleVisitNoteChange(event.target.value)}
              placeholder="Share instructions, gate details, or preferred arrival buffer."
              value={scheduleVisitNote}
            />
          </div>

          <div className="feed-card-actions">
            <Button
              disabled={!scheduleVisitAt || busyAction === `SCHEDULED-${inquiry.id}`}
              onClick={onSaveSchedule}
            >
              {busyAction === `SCHEDULED-${inquiry.id}` ? 'Scheduling...' : 'Save visit'}
            </Button>
            <Button onClick={onStopScheduling} variant="ghost">
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function InquiryActivityTimeline({ inquiry }: { inquiry: ListingInquiry }) {
  const timelineEntries = useMemo(() => buildInquiryTimelineEntries(inquiry), [inquiry])

  return (
    <div className="listing-details-section">
      <strong>Inquiry timeline</strong>
      <div className="inquiry-timeline">
        {timelineEntries.map((entry) => (
          <div className="inquiry-timeline-item" key={entry.id}>
            <div className={`inquiry-timeline-dot inquiry-timeline-dot-${entry.tone}`} />
            <div className="inquiry-timeline-copy">
              <div className="inquiry-timeline-head">
                <strong>{entry.title}</strong>
                <span>{formatDateTime(entry.createdAt)}</span>
              </div>
              <p className="feed-copy">{entry.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InquiryDetailsPage({ scope }: { scope: 'owner' | 'requester' }) {
  const { inquiryId } = useParams<{ inquiryId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionToken, user } = useAppAuth()
  const routeState = location.state as InquiryDetailsRouteState | null
  const initialInquiry = useMemo(
    () =>
      routeState?.inquiry && routeState.inquiry.id === inquiryId
        ? normalizeListingInquiry(routeState.inquiry)
        : null,
    [inquiryId, routeState],
  )
  const [inquiry, setInquiry] = useState<ListingInquiry | null>(initialInquiry)
  const [isLoading, setIsLoading] = useState(initialInquiry === null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<LocalFeedbackState | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [scheduleVisitAtInput, setScheduleVisitAtInput] = useState('')
  const [scheduleVisitNoteInput, setScheduleVisitNoteInput] = useState('')
  const [ownerNotesInput, setOwnerNotesInput] = useState('')
  const [isSavingOwnerNotes, setIsSavingOwnerNotes] = useState(false)

  const isOwnerView = scope === 'owner'
  const counterpart = isOwnerView ? inquiry?.requester ?? null : inquiry?.listingOwner ?? null
  const canManageInquiry = Boolean(
    isOwnerView && inquiry && inquiry.status !== 'CLOSED' && inquiry.status !== 'DECLINED',
  )

  useEffect(() => {
    if (!inquiryId || !sessionToken) {
      setError('Inquiry not found.')
      setIsLoading(false)
      return
    }

    let isCancelled = false

    async function loadInquiry() {
      try {
        setIsLoading(true)
        setError(null)
        const inquiryPayload = await apiRequest<ListingInquiry>(`/listing-inquiries/${inquiryId}`, {
          token: sessionToken,
        })

        if (!isCancelled) {
          const normalizedInquiry = normalizeListingInquiry(inquiryPayload)
          setInquiry(normalizedInquiry)
          setOwnerNotesInput(normalizedInquiry.ownerNotes ?? '')
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load this inquiry right now.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInquiry()

    return () => {
      isCancelled = true
    }
  }, [inquiryId, sessionToken])

  useEffect(() => {
    if (inquiry) {
      setOwnerNotesInput(inquiry.ownerNotes ?? '')
    }
  }, [inquiry])

  function handleBack() {
    navigate(routeState?.backTo ?? (isOwnerView ? '/find-tenant/host/inquiries' : '/find-tenant/inquiries'))
  }

  async function reloadInquiry() {
    if (!inquiryId || !sessionToken) {
      return
    }

    const inquiryPayload = await apiRequest<ListingInquiry>(`/listing-inquiries/${inquiryId}`, {
      token: sessionToken,
    })
    const normalizedInquiry = normalizeListingInquiry(inquiryPayload)
    setInquiry(normalizedInquiry)
    setOwnerNotesInput(normalizedInquiry.ownerNotes ?? '')
  }

  async function handleInquiryStatusUpdate(
    nextStatus: ListingInquiryStatus,
    options?: {
      scheduledVisitAt?: string
      scheduledVisitNote?: string
    },
  ) {
    if (!sessionToken || !inquiry) {
      return
    }

    try {
      setBusyAction(nextStatus)
      setFeedback(null)

      await apiRequest(`/listing-inquiries/${inquiry.id}/status`, {
        method: 'PATCH',
        token: sessionToken,
        body: JSON.stringify({
          status: nextStatus,
          scheduledVisitAt: options?.scheduledVisitAt ? toIsoDateTime(options.scheduledVisitAt) : undefined,
          scheduledVisitNote: options?.scheduledVisitNote?.trim() || undefined,
        }),
      })

      await reloadInquiry()
      setIsScheduleOpen(false)
      setScheduleVisitAtInput('')
      setScheduleVisitNoteInput('')
      setFeedback({
        tone: 'success',
        message:
          nextStatus === 'CONTACTED'
            ? 'Inquiry marked as contacted.'
            : nextStatus === 'SCHEDULED'
              ? 'Visit scheduled successfully.'
              : nextStatus === 'DECLINED'
                ? 'Inquiry declined.'
                : 'Inquiry closed.',
      })
    } catch (updateError) {
      setFeedback({
        tone: 'error',
        message: updateError instanceof Error ? updateError.message : 'Unable to update this inquiry.',
      })
    } finally {
      setBusyAction(null)
    }
  }

  async function handleVisitUpdate(
    action: 'CONFIRM' | 'CANCEL' | 'COMPLETE',
    note?: string,
  ) {
    if (!sessionToken || !inquiry) {
      return
    }

    try {
      setBusyAction(action)
      setFeedback(null)

      await apiRequest(`/listing-inquiries/${inquiry.id}/visit`, {
        method: 'PATCH',
        token: sessionToken,
        body: JSON.stringify({
          action,
          note: note?.trim() || undefined,
        }),
      })

      await reloadInquiry()
      setFeedback({
        tone: 'success',
        message:
          action === 'CONFIRM'
            ? 'Visit confirmed.'
            : action === 'COMPLETE'
              ? 'Visit marked as completed.'
              : 'Visit cancelled.',
      })
    } catch (updateError) {
      setFeedback({
        tone: 'error',
        message: updateError instanceof Error ? updateError.message : 'Unable to update the visit right now.',
      })
    } finally {
      setBusyAction(null)
    }
  }

  async function handleSaveOwnerNotes() {
    if (!sessionToken || !inquiry || !isOwnerView) {
      return
    }

    try {
      setIsSavingOwnerNotes(true)
      setFeedback(null)

      const updatedInquiry = await apiRequest<ListingInquiry>(`/listing-inquiries/${inquiry.id}/owner-notes`, {
        method: 'PATCH',
        token: sessionToken,
        body: JSON.stringify({
          ownerNotes: ownerNotesInput.trim() || undefined,
        }),
      })

      setInquiry(normalizeListingInquiry(updatedInquiry))
      setFeedback({
        tone: 'success',
        message: ownerNotesInput.trim() ? 'Owner notes saved.' : 'Owner notes cleared.',
      })
    } catch (saveError) {
      setFeedback({
        tone: 'error',
        message: saveError instanceof Error ? saveError.message : 'Unable to save owner notes right now.',
      })
    } finally {
      setIsSavingOwnerNotes(false)
    }
  }

  function openListing() {
    if (!inquiry) {
      return
    }

    navigate(`/find-tenant/listings/${inquiry.listing.id}`, {
      state: {
        listing: inquiry.listing,
        backLabel: 'Back to inquiry',
        backTo: isOwnerView ? `/find-tenant/host/inquiries/${inquiry.id}` : `/find-tenant/inquiries/${inquiry.id}`,
        sourceIntent: isOwnerView ? housingIntentValues.tenantReplacement : housingIntentValues.findRoom,
      } as ListingDetailsRouteState,
    })
  }

  if (!sessionToken || !user) {
    return (
      <div className="page">
        <section className="section">
          <div className="page-inner">
            <Card className="feed-card">
              <strong>Sign in to view inquiry details</strong>
              <p className="feed-copy">Inquiry details are available only after signing in.</p>
              <Button to="/profile" variant="secondary">
                Open profile
              </Button>
            </Card>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <section className="section">
        <div className="page-inner">
          <div className="hub-panel hub-panel-wide inquiry-details-screen">
            <div className="listing-details-topbar">
              <Button onClick={handleBack} variant="ghost">
                {routeState?.backLabel ?? (isOwnerView ? 'Back to inquiries' : 'Back to sent inquiries')}
              </Button>
              {inquiry ? (
                <div className="listing-details-badges">
                  <Badge tone={getListingInquiryStatusTone(inquiry.status)}>
                    {formatListingInquiryStatus(inquiry.status)}
                  </Badge>
                  {inquiry.visitStatus !== 'NONE' ? (
                    <Badge tone={getListingVisitTone(inquiry.visitStatus)}>
                      {formatListingVisitStatus(inquiry.visitStatus)}
                    </Badge>
                  ) : null}
                  <Badge tone={isOwnerView ? 'purple' : 'green'}>
                    {isOwnerView ? 'Owner view' : 'Seeker view'}
                  </Badge>
                </div>
              ) : null}
            </div>

            {feedback ? <div className={`feedback-banner feedback-${feedback.tone}`}>{feedback.message}</div> : null}

            {isLoading ? (
              <Card className="feed-card">
                <strong>Loading inquiry details</strong>
                <p className="feed-copy">Pulling the latest status, contact details, and activity timeline now.</p>
              </Card>
            ) : error || !inquiry || !counterpart ? (
              <Card className="feed-card">
                <strong>Inquiry unavailable</strong>
                <p className="feed-copy">{error ?? 'We could not find this inquiry.'}</p>
              </Card>
            ) : (
              <div className="inquiry-details-layout">
                <div className="inquiry-details-main">
                  <div className="listing-details-section">
                    <span className="muted">{isOwnerView ? 'Incoming inquiry' : 'Sent inquiry'}</span>
                    <h1 className="inquiry-details-title">{inquiry.listing.title}</h1>
                    <p className="feed-copy">
                      {isOwnerView ? counterpart.fullName : inquiry.listing.owner.fullName} · {formatListingLocation(inquiry.listing)}
                    </p>
                  </div>

                  <div className="inquiry-fact-grid">
                    <div className="listing-details-fact">
                      <span className="muted">Sent</span>
                      <strong>{formatDateTime(inquiry.createdAt)}</strong>
                    </div>
                    {inquiry.budgetAmount ? (
                      <div className="listing-details-fact">
                        <span className="muted">Budget</span>
                        <strong>{formatMoney(inquiry.budgetAmount)}</strong>
                      </div>
                    ) : null}
                    {inquiry.preferredMoveInDate ? (
                      <div className="listing-details-fact">
                        <span className="muted">Preferred move-in</span>
                        <strong>{formatShortDate(inquiry.preferredMoveInDate)}</strong>
                      </div>
                    ) : null}
                    {inquiry.preferredOccupancy ? (
                      <div className="listing-details-fact">
                        <span className="muted">Occupancy</span>
                        <strong>{formatEnum(inquiry.preferredOccupancy)}</strong>
                      </div>
                    ) : null}
                    {inquiry.preferredVisitAt ? (
                      <div className="listing-details-fact">
                        <span className="muted">Preferred visit</span>
                        <strong>{formatDateTime(inquiry.preferredVisitAt)}</strong>
                      </div>
                    ) : null}
                    {inquiry.scheduledVisitAt ? (
                      <div className="listing-details-fact">
                        <span className="muted">Scheduled visit</span>
                        <strong>{formatDateTime(inquiry.scheduledVisitAt)}</strong>
                      </div>
                    ) : null}
                    {inquiry.visitStatus !== 'NONE' ? (
                      <div className="listing-details-fact">
                        <span className="muted">Visit state</span>
                        <strong>{formatListingVisitStatus(inquiry.visitStatus)}</strong>
                      </div>
                    ) : null}
                  </div>

                  {inquiry.message ? (
                    <div className="listing-details-section">
                      <strong>{isOwnerView ? 'Seeker note' : 'Your note'}</strong>
                      <p className="feed-copy">{inquiry.message}</p>
                    </div>
                  ) : null}

                  {inquiry.preferredVisitNote || inquiry.scheduledVisitNote ? (
                    <div className="listing-details-section">
                      <strong>{inquiry.scheduledVisitNote ? 'Visit instructions' : 'Visit preference'}</strong>
                      <p className="feed-copy">{inquiry.scheduledVisitNote ?? inquiry.preferredVisitNote}</p>
                    </div>
                  ) : null}

                  {isOwnerView ? (
                    <div className="listing-details-section inquiry-notes-card">
                      <div className="inquiry-section-head">
                        <div>
                          <strong>Private owner notes</strong>
                          <p className="feed-copy">Visible only to you. Use this to track fit, next steps, or follow-up reminders.</p>
                        </div>
                      </div>
                      <textarea
                        onChange={(event) => setOwnerNotesInput(event.target.value)}
                        placeholder="Example: Good fit for move-in timing. Follow up after evening call."
                        rows={5}
                        value={ownerNotesInput}
                      />
                      <div className="feed-card-actions">
                        <Button disabled={isSavingOwnerNotes} onClick={() => void handleSaveOwnerNotes()}>
                          {isSavingOwnerNotes ? 'Saving...' : 'Save notes'}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <InquiryActivityTimeline inquiry={inquiry} />
                </div>

                <div className="inquiry-details-sidebar">
                  <Card className="listing-inquiry-card inquiry-counterpart-card">
                    <div className="inquiry-card-top">
                      <div>
                        <strong>{counterpart.fullName}</strong>
                        <p>{counterpart.companyName ?? (isOwnerView ? 'Interested seeker' : 'Listing owner')}</p>
                      </div>
                      <Badge tone={counterpart.isVerified ? 'green' : 'gray'}>
                        {counterpart.isVerified ? 'Verified' : 'Profile'}
                      </Badge>
                    </div>

                    <div className="inquiry-contact-grid">
                      <div className="listing-details-fact">
                        <span className="muted">Email</span>
                        <strong>{counterpart.email}</strong>
                      </div>
                      <div className="listing-details-fact">
                        <span className="muted">Phone</span>
                        <strong>{formatContactPhone(counterpart.phone)}</strong>
                      </div>
                      {counterpart.homeCity ? (
                        <div className="listing-details-fact">
                          <span className="muted">City</span>
                          <strong>{counterpart.homeCity}</strong>
                        </div>
                      ) : null}
                    </div>

                    <div className="feed-card-actions">
                      <Button
                        className="listing-action-button listing-action-contact"
                        onClick={() =>
                          window.open(
                            counterpart.phone
                              ? buildWhatsappLink(counterpart.phone)
                              : buildMailtoLink(counterpart.email, inquiry.listing.title),
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                        variant="secondary"
                      >
                        {counterpart.phone ? 'Contact on WhatsApp' : 'Send email'}
                      </Button>
                      <Button className="listing-action-button listing-action-details" onClick={openListing} variant="ghost">
                        Open listing
                      </Button>
                    </div>
                  </Card>

                  {isOwnerView ? (
                    <Card className="listing-inquiry-card inquiry-management-card">
                      <div className="inquiry-card-top">
                        <div>
                          <strong>Manage this inquiry</strong>
                          <p>Update lead progress and keep scheduling decisions in one place.</p>
                        </div>
                      </div>

                      <div className="inquiry-actions inquiry-actions-stacked">
                        {canManageInquiry && inquiry.status === 'NEW' ? (
                          <Button
                            disabled={busyAction === 'CONTACTED'}
                            onClick={() => void handleInquiryStatusUpdate('CONTACTED')}
                            variant="ghost"
                          >
                            {busyAction === 'CONTACTED' ? 'Updating...' : 'Mark contacted'}
                          </Button>
                        ) : null}

                        {canManageInquiry ? (
                          <Button
                            disabled={busyAction === 'SCHEDULED'}
                            onClick={() => {
                              setIsScheduleOpen((current) => !current)
                              setScheduleVisitAtInput(
                                toDateTimeLocalInput(inquiry.scheduledVisitAt ?? inquiry.preferredVisitAt),
                              )
                              setScheduleVisitNoteInput(
                                inquiry.scheduledVisitNote ?? inquiry.preferredVisitNote ?? '',
                              )
                            }}
                            variant="ghost"
                          >
                            {isScheduleOpen ? 'Cancel scheduling' : 'Schedule visit'}
                          </Button>
                        ) : null}

                        {inquiry.visitStatus === 'CONFIRMED' ? (
                          <Button
                            disabled={busyAction === 'COMPLETE'}
                            onClick={() => void handleVisitUpdate('COMPLETE')}
                            variant="ghost"
                          >
                            {busyAction === 'COMPLETE' ? 'Updating...' : 'Mark visit completed'}
                          </Button>
                        ) : null}

                        {(inquiry.visitStatus === 'PROPOSED' || inquiry.visitStatus === 'CONFIRMED') ? (
                          <Button
                            disabled={busyAction === 'CANCEL'}
                            onClick={() => void handleVisitUpdate('CANCEL')}
                            variant="ghost"
                          >
                            {busyAction === 'CANCEL' ? 'Updating...' : 'Cancel visit'}
                          </Button>
                        ) : null}

                        {canManageInquiry ? (
                          <Button
                            disabled={busyAction === 'DECLINED'}
                            onClick={() => void handleInquiryStatusUpdate('DECLINED')}
                            variant="ghost"
                          >
                            {busyAction === 'DECLINED' ? 'Updating...' : 'Decline inquiry'}
                          </Button>
                        ) : null}

                        {canManageInquiry ? (
                          <Button
                            disabled={busyAction === 'CLOSED'}
                            onClick={() => void handleInquiryStatusUpdate('CLOSED')}
                            variant="ghost"
                          >
                            {busyAction === 'CLOSED' ? 'Updating...' : 'Close inquiry'}
                          </Button>
                        ) : null}
                      </div>

                      {isScheduleOpen ? (
                        <div className="inquiry-schedule-form">
                          <div className="field">
                            <label htmlFor="inquiry-detail-schedule-visit">Visit date and time</label>
                            <input
                              id="inquiry-detail-schedule-visit"
                              min={getTodayDateTimeInputValue()}
                              onChange={(event) => setScheduleVisitAtInput(event.target.value)}
                              type="datetime-local"
                              value={scheduleVisitAtInput}
                            />
                          </div>

                          <div className="field">
                            <label htmlFor="inquiry-detail-schedule-note">Visit note</label>
                            <input
                              id="inquiry-detail-schedule-note"
                              onChange={(event) => setScheduleVisitNoteInput(event.target.value)}
                              placeholder="Share gate details or arrival instructions."
                              value={scheduleVisitNoteInput}
                            />
                          </div>

                          <div className="feed-card-actions">
                            <Button
                              disabled={!scheduleVisitAtInput || busyAction === 'SCHEDULED'}
                              onClick={() =>
                                void handleInquiryStatusUpdate('SCHEDULED', {
                                  scheduledVisitAt: scheduleVisitAtInput,
                                  scheduledVisitNote: scheduleVisitNoteInput,
                                })
                              }
                            >
                              {busyAction === 'SCHEDULED' ? 'Scheduling...' : 'Save visit'}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </Card>
                  ) : (
                    <Card className="listing-inquiry-card inquiry-management-card">
                      <div className="inquiry-card-top">
                        <div>
                          <strong>What happens next</strong>
                          <p>The owner can contact you, propose a visit, or close this inquiry after review.</p>
                        </div>
                      </div>
                      <div className="inquiry-status-summary">
                        <div className="listing-details-fact">
                          <span className="muted">Current status</span>
                          <strong>{formatListingInquiryStatus(inquiry.status)}</strong>
                        </div>
                        {inquiry.scheduledVisitAt ? (
                          <div className="listing-details-fact">
                            <span className="muted">Visit planned</span>
                            <strong>{formatDateTime(inquiry.scheduledVisitAt)}</strong>
                          </div>
                        ) : null}
                        {inquiry.visitStatus !== 'NONE' ? (
                          <div className="listing-details-fact">
                            <span className="muted">Visit state</span>
                            <strong>{formatListingVisitStatus(inquiry.visitStatus)}</strong>
                          </div>
                        ) : null}
                      </div>

                      {inquiry.visitStatus === 'PROPOSED' ? (
                        <div className="feed-card-actions">
                          <Button
                            disabled={busyAction === 'CONFIRM'}
                            onClick={() => void handleVisitUpdate('CONFIRM')}
                          >
                            {busyAction === 'CONFIRM' ? 'Updating...' : 'Confirm visit'}
                          </Button>
                          <Button
                            className="listing-action-button listing-action-delete"
                            disabled={busyAction === 'CANCEL'}
                            onClick={() => void handleVisitUpdate('CANCEL')}
                            variant="ghost"
                          >
                            {busyAction === 'CANCEL' ? 'Updating...' : 'Cannot make it'}
                          </Button>
                        </div>
                      ) : null}

                      {inquiry.visitStatus === 'CONFIRMED' ? (
                        <div className="feed-card-actions">
                          <Button
                            className="listing-action-button listing-action-delete"
                            disabled={busyAction === 'CANCEL'}
                            onClick={() => void handleVisitUpdate('CANCEL')}
                            variant="ghost"
                          >
                            {busyAction === 'CANCEL' ? 'Updating...' : 'Cancel visit'}
                          </Button>
                        </div>
                      ) : null}
                    </Card>
                  )}

                  <Card className="listing-inquiry-card inquiry-listing-card">
                    {renderListingCoverImage(inquiry.listing, {
                      className: 'feed-media inquiry-listing-cover',
                      emptyLabel: 'Add a cover image so seekers and owners can recognize this listing faster.',
                    })}
                    <div className="feed-card-top">
                      <div>
                        <strong>{inquiry.listing.title}</strong>
                        <p>{formatListingLocation(inquiry.listing)}</p>
                      </div>
                      <Badge tone={getListingStatusTone(inquiry.listing.status)}>
                        {formatListingStatus(inquiry.listing.status)}
                      </Badge>
                    </div>
                    <div className="inquiry-fact-grid">
                      <div className="listing-details-fact">
                        <span className="muted">Rent</span>
                        <strong>{formatPriceLine(inquiry.listing)}</strong>
                      </div>
                      <div className="listing-details-fact">
                        <span className="muted">Move in</span>
                        <strong>{formatMoveInLabel(inquiry.listing.moveInDate).replace('Move in ', '')}</strong>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export function FindTenantListingDetailsPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionToken, user } = useAppAuth()
  const routeState = location.state as ListingDetailsRouteState | null
  const initialListing = useMemo(
    () => (routeState?.listing && routeState.listing.id === listingId ? normalizeListing(routeState.listing) : null),
    [listingId, routeState],
  )
  const [listing, setListing] = useState<Listing | null>(initialListing)
  const [isLoading, setIsLoading] = useState(initialListing === null)
  const [error, setError] = useState<string | null>(null)
  const [existingInquiry, setExistingInquiry] = useState<ListingInquiry | null>(null)
  const [isLoadingInquiry, setIsLoadingInquiry] = useState(false)
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false)
  const [inquiryFeedback, setInquiryFeedback] = useState<LocalFeedbackState | null>(null)
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>(makeEmptyInquiryForm())

  useEffect(() => {
    if (!listingId) {
      setError('Listing not found.')
      setIsLoading(false)
      return
    }

    if (initialListing) {
      return
    }

    let isCancelled = false

    async function loadListing() {
      try {
        setIsLoading(true)
        setError(null)
        const listingPayload = await apiRequest<Listing>(`/listings/${listingId}`)

        if (!isCancelled) {
          setListing(normalizeListing(listingPayload))
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load this listing right now.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadListing()

    return () => {
      isCancelled = true
    }
  }, [initialListing, listingId])

  useEffect(() => {
    if (!listingId || !sessionToken || !user || (listing && listing.owner.id === user.id)) {
      setExistingInquiry(null)
      return
    }

    const currentListingId = listingId
    let isCancelled = false

    async function loadExistingInquiry() {
      try {
        setIsLoadingInquiry(true)
        const inquiries = await apiRequest<ListingInquiry[]>(
          `/listing-inquiries?scope=requester&listingId=${encodeURIComponent(currentListingId)}`,
          {
            token: sessionToken,
          },
        )

        if (!isCancelled) {
          const currentInquiry = inquiries[0] ? normalizeListingInquiry(inquiries[0]) : null
          setExistingInquiry(currentInquiry)

          if (currentInquiry) {
            setInquiryForm(makeEmptyInquiryForm())
          }
        }
      } catch (loadError) {
        if (!isCancelled) {
          setInquiryFeedback({
            tone: 'error',
            message: loadError instanceof Error ? loadError.message : 'Unable to load your inquiry for this listing.',
          })
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingInquiry(false)
        }
      }
    }

    void loadExistingInquiry()

    return () => {
      isCancelled = true
    }
  }, [listing, listingId, sessionToken, user])

  const badgeTone = listing?.owner.isVerified ? 'green' : 'gray'
  const badgeLabel = listing?.owner.isVerified ? 'Verified owner' : 'Live listing'

  function handleBack() {
    navigate(routeState?.backTo ?? '/find-tenant')
  }

  async function handleCreateInquiry() {
    if (!listingId || !sessionToken || !user) {
      setInquiryFeedback({
        tone: 'error',
        message: 'Please sign in before sending an inquiry.',
      })
      return
    }

    if (!user.phone?.trim()) {
      setInquiryFeedback({
        tone: 'error',
        message: 'Add your phone number in profile before sending an inquiry.',
      })
      return
    }

    try {
      setIsSubmittingInquiry(true)
      setInquiryFeedback(null)

      const createdInquiry = await apiRequest<ListingInquiry>('/listing-inquiries', {
        method: 'POST',
        token: sessionToken,
        body: JSON.stringify({
          listingId,
          message: inquiryForm.message.trim() || undefined,
          budgetAmount: inquiryForm.budgetAmount ? Number(inquiryForm.budgetAmount) : undefined,
          preferredMoveInDate: inquiryForm.preferredMoveInDate
            ? toIsoDate(inquiryForm.preferredMoveInDate)
            : undefined,
          preferredOccupancy: inquiryForm.preferredOccupancy || undefined,
          preferredVisitAt: inquiryForm.preferredVisitAt
            ? toIsoDateTime(inquiryForm.preferredVisitAt)
            : undefined,
          preferredVisitNote: inquiryForm.preferredVisitNote.trim() || undefined,
        }),
      })

      setExistingInquiry(normalizeListingInquiry(createdInquiry))
      setInquiryForm(makeEmptyInquiryForm())
      setInquiryFeedback({
        tone: 'success',
        message: 'Inquiry sent. The owner can now review your move-in and visit preferences.',
      })
    } catch (submitError) {
      setInquiryFeedback({
        tone: 'error',
        message: submitError instanceof Error ? submitError.message : 'Unable to send your inquiry right now.',
      })
    } finally {
      setIsSubmittingInquiry(false)
    }
  }

  return (
    <div className="page">
      <section className="section">
        <div className="page-inner">
          <div className="hub-panel hub-panel-wide listing-details-screen">
            <div className="listing-details-topbar">
              <Button onClick={handleBack} variant="ghost">
                {routeState?.backLabel ?? 'Back to listings'}
              </Button>
              {listing ? (
                <div className="listing-details-badges">
                  <Badge tone={getListingStatusTone(listing.status)}>{formatListingStatus(listing.status)}</Badge>
                  <Badge tone={badgeTone}>{badgeLabel}</Badge>
                </div>
              ) : null}
            </div>

            {isLoading ? (
              <Card className="feed-card">
                <strong>Loading listing details</strong>
                <p className="feed-copy">Pulling the apartment photos and latest details now.</p>
              </Card>
            ) : error || !listing ? (
              <Card className="feed-card">
                <strong>Listing unavailable</strong>
                <p className="feed-copy">{error ?? 'We could not find this apartment listing.'}</p>
              </Card>
            ) : (
              <>
                <div className="listing-details-hero">
                  <ListingImageCarousel listing={listing} />

                  <div className="listing-details-sidebar">
                    <div className="listing-details-heading">
                      <span className="muted">Apartment details</span>
                      <h1>{listing.title}</h1>
                      <p>{formatListingLocation(listing)}</p>
                    </div>

                    <div className="nearby-place-chip-row compact">
                      {listing.propertyType ? <span className="nearby-place-chip static">{formatEnum(listing.propertyType)}</span> : null}
                      {listing.occupancyType ? <span className="nearby-place-chip static">{formatEnum(listing.occupancyType)}</span> : null}
                      {listing.owner.isVerified ? <span className="nearby-place-chip static">Verified owner</span> : null}
                    </div>

                    <div className="listing-details-fact-grid">
                      <div className="listing-details-fact">
                        <span className="muted">Rent</span>
                        <strong>{formatPriceLine(listing)}</strong>
                      </div>
                      {listing.depositAmount ? (
                        <div className="listing-details-fact">
                          <span className="muted">Deposit</span>
                          <strong>{formatMoney(listing.depositAmount)}</strong>
                        </div>
                      ) : null}
                      {listing.maintenanceAmount ? (
                        <div className="listing-details-fact">
                          <span className="muted">Maintenance</span>
                          <strong>{formatMoney(listing.maintenanceAmount)}</strong>
                        </div>
                      ) : null}
                      <div className="listing-details-fact">
                        <span className="muted">Move in</span>
                        <strong>{formatMoveInLabel(listing.moveInDate).replace('Move in ', '')}</strong>
                      </div>
                    </div>

                    <div className="feed-owner-row listing-details-owner">
                      <div>
                        <strong>{listing.owner.fullName}</strong>
                        <span>{listing.owner.companyName ?? 'Independent owner'}</span>
                      </div>
                      {listing.owner.isVerified ? (
                        <span className="pill">
                          <ShieldCheck size={14} />
                          Verified
                        </span>
                      ) : null}
                    </div>

                    <div className="listing-contact-card">
                      <div className="listing-contact-head">
                        <strong>Contact owner</strong>
                        <span className="muted">{formatContactPhone(listing.contactPhone)}</span>
                      </div>

                      {listing.contactPhone ? (
                        <Button
                          onClick={() =>
                            window.open(
                              listing.contactMode === 'CALL'
                                ? buildCallLink(listing.contactPhone)
                                : buildWhatsappLink(listing.contactPhone),
                              '_blank',
                              'noopener,noreferrer',
                            )
                          }
                          variant="secondary"
                        >
                          {listing.contactMode === 'CALL' ? 'Call owner' : 'Contact owner'}
                        </Button>
                      ) : (
                        <div className="listing-contact-lock">
                          <MapPin size={16} />
                          <span>Contact number has not been added to this listing yet.</span>
                        </div>
                      )}
                    </div>

                    <ListingInquiryPanel
                      feedback={inquiryFeedback}
                      inquiry={existingInquiry}
                      isLoading={isLoadingInquiry}
                      isSubmitting={isSubmittingInquiry}
                      listing={listing}
                      onChange={setInquiryForm}
                      onSubmit={() => void handleCreateInquiry()}
                      onViewProfile={() => navigate('/profile')}
                      sessionUserPhone={user?.phone ?? null}
                      sessionUserId={user?.id ?? null}
                      values={inquiryForm}
                    />
                  </div>
                </div>

                <div className="listing-details-content">
                  {listing.description ? (
                    <div className="listing-details-section">
                      <strong>About this apartment</strong>
                      <p className="feed-copy">{listing.description}</p>
                      {listing.miscCharges ? <p className="feed-copy feed-copy-compact">Extras: {listing.miscCharges}</p> : null}
                    </div>
                  ) : null}

                  {listing.amenities.length > 0 ? (
                    <div className="listing-amenities">
                      <strong>Amenities</strong>
                      <div className="nearby-place-chip-row compact">
                        {listing.amenities.map((amenity) => (
                          <span className="nearby-place-chip static" key={`${listing.id}-${amenity}`}>
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {listing.nearbyPlaces.length > 0 ? (
                    <div className="listing-nearby-places">
                      <strong>Nearby places</strong>
                      <div className="nearby-place-chip-row compact">
                        {listing.nearbyPlaces.map((place) => (
                          <span className="nearby-place-chip static" key={`${listing.id}-${place.name}`}>
                            {place.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="listing-details-section">
                    <strong>Location</strong>
                    <LocationSummaryCard
                      compact
                      location={toSelectedPlaceLocation(
                        listing.locationName,
                        listing.latitude,
                        listing.longitude,
                      )}
                      showCoordinates={false}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export function FindTenantPage() {
  return <HousingExperiencePage mode="root" />
}

export function FindTenantHostDashboardPage() {
  return <HousingExperiencePage mode="host-dashboard" />
}

export function FindTenantRequesterInquiriesPage() {
  return <HousingExperiencePage mode="seeker-inquiries" />
}

export function FindTenantNeedsPage() {
  return <HousingExperiencePage mode="seeker-needs" />
}

export function FindTenantPostedListingsPage() {
  return <HousingExperiencePage mode="seeker-posted-listings" />
}

export function FindTenantRequesterInquiryDetailsPage() {
  return <InquiryDetailsPage scope="requester" />
}

export function FindTenantHostComposePage() {
  return <HousingExperiencePage mode="host-compose" />
}

export function FindTenantHostInquiriesPage() {
  return <HousingExperiencePage mode="host-inquiries" />
}

export function FindTenantOwnerInquiryDetailsPage() {
  return <InquiryDetailsPage scope="owner" />
}

function HousingExperiencePage({ mode }: { mode: HousingPageMode }) {
  const { sessionToken, user } = useAppAuth()
  const { intent, setIntent } = useHousingIntent()
  const navigate = useNavigate()
  const location = useLocation()
  const { editListingId } = useParams<{ editListingId?: string }>()
  const composerRouteState = shouldUseListingComposerRouteState(location.state)
    ? location.state
    : null
  const [publicListings, setPublicListings] = useState<Listing[]>([])
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myHousingNeeds, setMyHousingNeeds] = useState<HousingNeed[]>([])
  const [expandedNeedId, setExpandedNeedId] = useState<string | null>(null)
  const [editingNeedId, setEditingNeedId] = useState<string | null>(null)
  const [editNeedDraft, setEditNeedDraft] = useState<{
    city: string; locality: string; maxRentAmount: string; maxDepositAmount: string
    maxMaintenanceAmount: string; preferredPropertyType: string; preferredOccupancy: string
    preferredAmenities: string[]; moveInDate: string; urgencyLevel: string; notes: string; status: HousingNeedStatus
  }>({
    city: '', locality: '', maxRentAmount: '', maxDepositAmount: '', maxMaintenanceAmount: '',
    preferredPropertyType: '', preferredOccupancy: '', preferredAmenities: [],
    moveInDate: '', urgencyLevel: '', notes: '', status: 'OPEN',
  })
  const [isSavingNeedEdit, setIsSavingNeedEdit] = useState(false)
  const [requesterInquiries, setRequesterInquiries] = useState<ListingInquiry[]>([])
  const [ownerInquiries, setOwnerInquiries] = useState<ListingInquiry[]>([])
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [publicListingFilters, setPublicListingFilters] = useState<PublicListingFilters>(
    makeEmptyPublicListingFilters(),
  )
  const [showAdvancedPublicFilters, setShowAdvancedPublicFilters] = useState(false)
  const [hostStep, setHostStep] = useState(0)
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  const [listingImages, setListingImages] = useState<DraftListingImage[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [isSavingListing, setIsSavingListing] = useState(false)
  const [isCleaningUpUploads, setIsCleaningUpUploads] = useState(false)
  const [uploadSummary, setUploadSummary] = useState<string | null>(null)
  const [amenityInput, setAmenityInput] = useState('')
  const [housingNeedAmenityInput, setHousingNeedAmenityInput] = useState('')
  const [listingNearbyPlaceInput, setListingNearbyPlaceInput] = useState('')
  const [listingNearbyPlaceType, setListingNearbyPlaceType] = useState<NearbyPlaceType>('tech_park')
  const [housingNeedNearbyPlaceInput, setHousingNeedNearbyPlaceInput] = useState('')
  const [housingNeedNearbyPlaceType, setHousingNeedNearbyPlaceType] = useState<NearbyPlaceType>('tech_park')
  const [isDragActive, setIsDragActive] = useState(false)
  const [busyListingAction, setBusyListingAction] = useState<string | null>(null)
  const [busyInquiryAction, setBusyInquiryAction] = useState<string | null>(null)
  const [listingActionConfirmation, setListingActionConfirmation] =
    useState<ListingActionConfirmation | null>(null)
  const [myListingFilter, setMyListingFilter] = useState<HostListingFilter>('ACTIVE')
  const [isHostFilterMenuOpenOnMobile, setIsHostFilterMenuOpenOnMobile] = useState(false)
  const [isHostInquiryFilterMenuOpenOnMobile, setIsHostInquiryFilterMenuOpenOnMobile] = useState(false)
  const [isRequesterInquiryFilterMenuOpenOnMobile, setIsRequesterInquiryFilterMenuOpenOnMobile] = useState(false)
  const [isHostMetricsExpandedOnMobile, setIsHostMetricsExpandedOnMobile] = useState(false)
  const [requesterInquiryFilter, setRequesterInquiryFilter] = useState<ListingInquiryFilter>('ALL')
  const [ownerInquiryFilter, setOwnerInquiryFilter] = useState<ListingInquiryFilter>('ACTIVE')
  const [ownerInquirySort, setOwnerInquirySort] = useState<ListingInquirySort>('NEW_FIRST')
  const [schedulingInquiryId, setSchedulingInquiryId] = useState<string | null>(null)
  const [scheduleVisitAtInput, setScheduleVisitAtInput] = useState('')
  const [scheduleVisitNoteInput, setScheduleVisitNoteInput] = useState('')
  const [replaceTenantCityOption, setReplaceTenantCityOption] = useState('')
  const [replaceTenantCustomCity, setReplaceTenantCustomCity] = useState('')
  const [housingNeedCityOption, setHousingNeedCityOption] = useState('')
  const [housingNeedCustomCity, setHousingNeedCustomCity] = useState('')
  const [replaceTenantForm, setReplaceTenantForm] = useState<ReplaceTenantForm>(makeEmptyReplaceTenantForm())
  const [housingNeedForm, setHousingNeedForm] = useState<HousingNeedForm>(makeEmptyHousingNeedForm())
  const [isSavingHousingNeed, setIsSavingHousingNeed] = useState(false)
  const [listingIntentAssignments, setListingIntentAssignments] = useState<Record<string, HousingIntent>>(
    () => readListingIntentAssignments(),
  )
  const listingImagesRef = useRef<DraftListingImage[]>([])
  const queryClient = useQueryClient()

  const excludeOwnerForPublic =
    Boolean(sessionToken && user && intent === housingIntentValues.findRoom) ? user!.id : null

  const publicListingsQuery = useQuery({
    queryKey: ['listings', 'public', excludeOwnerForPublic ?? 'include-self'],
    queryFn: async () => {
      const pubParams = new URLSearchParams()
      pubParams.set('status', 'PUBLISHED')
      pubParams.set('limit', '50')
      if (excludeOwnerForPublic) {
        pubParams.set('excludeOwnerUserId', excludeOwnerForPublic)
      }
      const publicRaw = await apiRequest<unknown>(`/listings?${pubParams.toString()}`, {
        token: sessionToken,
      })
      return asListingsPage<Listing>(publicRaw)
    },
  })

  const myListingsQuery = useQuery({
    queryKey: ['listings', 'mine', user?.id],
    queryFn: async () => {
      if (!sessionToken || !user) {
        return { items: [] as Listing[], nextCursor: null as string | null }
      }
      const myRaw = await apiRequest<unknown>(
        `/listings?ownerUserId=${encodeURIComponent(user.id)}&includeArchived=true&limit=50`,
        { token: sessionToken },
      )
      return asListingsPage<Listing>(myRaw)
    },
    enabled: Boolean(sessionToken && user),
  })

  const housingNeedsMineQuery = useQuery({
    queryKey: ['housing-needs', 'mine', user?.id],
    queryFn: () => apiRequest<HousingNeed[]>('/housing-needs/mine', { token: sessionToken! }),
    enabled: Boolean(sessionToken && user),
  })

  const requesterInquiriesQuery = useQuery({
    queryKey: ['listing-inquiries', 'requester', user?.id],
    queryFn: () =>
      apiRequest<ListingInquiry[]>('/listing-inquiries?scope=requester', { token: sessionToken! }),
    enabled: Boolean(sessionToken && user),
  })

  const ownerInquiriesQuery = useQuery({
    queryKey: ['listing-inquiries', 'owner', user?.id],
    queryFn: () =>
      apiRequest<ListingInquiry[]>('/listing-inquiries?scope=owner', { token: sessionToken! }),
    enabled: Boolean(sessionToken && user),
  })

  const composerListingId = useMemo(
    () => editingListingId ?? (editListingId && editListingId !== 'new' ? editListingId : null),
    [editingListingId, editListingId],
  )

  const isLoading =
    publicListingsQuery.isPending ||
    (Boolean(sessionToken && user) &&
      (myListingsQuery.isPending ||
        housingNeedsMineQuery.isPending ||
        requesterInquiriesQuery.isPending ||
        ownerInquiriesQuery.isPending))

  useEffect(() => {
    if (publicListingsQuery.data) {
      setPublicListings(normalizeListings(publicListingsQuery.data.items))
    }
  }, [publicListingsQuery.data])

  useEffect(() => {
    if (!sessionToken || !user) {
      setMyListings([])
      setMyHousingNeeds([])
      setRequesterInquiries([])
      setOwnerInquiries([])
      return
    }
    if (myListingsQuery.data) {
      setMyListings(normalizeListings(myListingsQuery.data.items))
    }
    if (housingNeedsMineQuery.data) {
      setMyHousingNeeds(Array.isArray(housingNeedsMineQuery.data) ? housingNeedsMineQuery.data : [])
    }
    if (requesterInquiriesQuery.data) {
      setRequesterInquiries(normalizeListingInquiries(requesterInquiriesQuery.data))
    }
    if (ownerInquiriesQuery.data) {
      setOwnerInquiries(normalizeListingInquiries(ownerInquiriesQuery.data))
    }
  }, [
    sessionToken,
    user,
    myListingsQuery.data,
    housingNeedsMineQuery.data,
    requesterInquiriesQuery.data,
    ownerInquiriesQuery.data,
  ])

  async function refetchHousingData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['listings'] }),
      queryClient.invalidateQueries({ queryKey: ['housing-needs'] }),
      queryClient.invalidateQueries({ queryKey: ['listing-inquiries'] }),
    ])
  }

  const selectedListingLocation = useMemo(
    () =>
      toSelectedPlaceLocation(
        replaceTenantForm.locationName,
        replaceTenantForm.latitude,
        replaceTenantForm.longitude,
      ),
    [replaceTenantForm.latitude, replaceTenantForm.locationName, replaceTenantForm.longitude],
  )
  const shouldShowHostDashboard = mode === 'host-dashboard'
  const shouldShowSeekerNeeds = mode === 'seeker-needs'
  const shouldShowSeekerPostedListings = mode === 'seeker-posted-listings'
  const shouldShowRequesterInquiries = mode === 'seeker-inquiries'
  const shouldShowHostComposer = mode === 'host-compose'
  const shouldShowHostInquiries = mode === 'host-inquiries'
  const discoverablePublicListings = useMemo(
    () => publicListings.filter((listing) => !(user && listing.owner.id === user.id)),
    [publicListings, user],
  )
  const publicCityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          discoverablePublicListings
            .map((listing) => listing.city?.trim())
            .filter((city): city is string => Boolean(city)),
        ),
      )
        .sort((left, right) => left.localeCompare(right))
        .slice(0, 6),
    [discoverablePublicListings],
  )
  const publicAmenityOptions = useMemo(() => {
    const amenityCounts = new Map<string, number>()

    discoverablePublicListings.forEach((listing) => {
      listing.amenities.forEach((amenity) => {
        amenityCounts.set(amenity, (amenityCounts.get(amenity) ?? 0) + 1)
      })
    })

    return Array.from(amenityCounts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 6)
      .map(([amenity]) => amenity)
  }, [discoverablePublicListings])
  const quickPublicCityOptions = useMemo(() => publicCityOptions.slice(0, 4), [publicCityOptions])
  const hasActiveRoomNeed = useMemo(
    () => publicListings.some((listing) => Boolean(listing.matchSummary)),
    [publicListings],
  )
  const activeRoomNeedCount = hasActiveRoomNeed ? 1 : 0
  const filteredPublicListings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return discoverablePublicListings.filter((listing) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          listing.title,
          listing.city ?? '',
          listing.locality ?? '',
          listing.locationName ?? '',
          ...(listing.amenities ?? []),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)

      if (!matchesQuery) {
        return false
      }

      if (publicListingFilters.city && listing.city !== publicListingFilters.city) {
        return false
      }

      if (
        publicListingFilters.propertyType &&
        listing.propertyType !== publicListingFilters.propertyType
      ) {
        return false
      }

      if (
        publicListingFilters.occupancyType &&
        listing.occupancyType !== publicListingFilters.occupancyType
      ) {
        return false
      }

      if (
        publicListingFilters.amenity &&
        !listing.amenities.includes(publicListingFilters.amenity)
      ) {
        return false
      }

      if (!matchesPublicListingBudget(listing.rentAmount, publicListingFilters.budget)) {
        return false
      }

      if (publicListingFilters.verifiedOnly && !listing.owner.isVerified) {
        return false
      }

      return true
    })
  }, [discoverablePublicListings, publicListingFilters, searchQuery])
  const rankedPublicListings = useMemo(() => {
    return filteredPublicListings.map((listing) => ({
      listing,
      matchSummary: listing.matchSummary ?? null,
    }))
  }, [filteredPublicListings])
  const hostModeListings = useMemo(
    () =>
      myListings.filter(
        (listing) => getListingIntentForDisplay(listing.id, listingIntentAssignments) === housingIntentValues.tenantReplacement,
      ),
    [listingIntentAssignments, myListings],
  )
  const activePublicListingFilterTokens = useMemo(() => {
    const tokens: Array<{ key: PublicListingFilterKey; label: string }> = []

    if (searchQuery.trim()) {
      tokens.push({ key: 'search', label: `Search: ${searchQuery.trim()}` })
    }

    if (publicListingFilters.city) {
      tokens.push({ key: 'city', label: `City: ${publicListingFilters.city}` })
    }

    if (publicListingFilters.propertyType) {
      tokens.push({
        key: 'propertyType',
        label: `Type: ${formatEnum(publicListingFilters.propertyType)}`,
      })
    }

    if (publicListingFilters.occupancyType) {
      tokens.push({
        key: 'occupancyType',
        label: `Occupancy: ${formatEnum(publicListingFilters.occupancyType)}`,
      })
    }

    if (publicListingFilters.amenity) {
      tokens.push({ key: 'amenity', label: `Amenity: ${publicListingFilters.amenity}` })
    }

    if (publicListingFilters.budget !== 'ANY') {
      tokens.push({
        key: 'budget',
        label: `Budget: ${formatPublicListingBudget(publicListingFilters.budget)}`,
      })
    }

    if (publicListingFilters.verifiedOnly) {
      tokens.push({ key: 'verifiedOnly', label: 'Verified owners' })
    }

    return tokens
  }, [publicListingFilters, searchQuery])
  const hasActivePublicListingFilters = activePublicListingFilterTokens.length > 0
  const activeAdvancedPublicFiltersCount = useMemo(
    () =>
      [
        publicListingFilters.propertyType,
        publicListingFilters.occupancyType,
        publicListingFilters.amenity,
      ].filter(Boolean).length,
    [publicListingFilters.amenity, publicListingFilters.occupancyType, publicListingFilters.propertyType],
  )
  const filteredHostListings = useMemo(
    () => filterHostListings(hostModeListings, myListingFilter),
    [hostModeListings, myListingFilter],
  )
  const activeHostListingsCount = useMemo(
    () => filterHostListings(hostModeListings, 'ACTIVE').length,
    [hostModeListings],
  )
  const pausedHostListingsCount = useMemo(
    () => filterHostListings(hostModeListings, 'PAUSED').length,
    [hostModeListings],
  )
  const activeRequesterInquiriesCount = useMemo(
    () => filterListingInquiries(requesterInquiries, 'ACTIVE').length,
    [requesterInquiries],
  )
  const activeHousingNeedsCount = useMemo(
    () => myHousingNeeds.filter((n) => n.status === 'OPEN' || n.status === 'MATCHED').length,
    [myHousingNeeds],
  )
  const filteredRequesterInquiries = useMemo(
    () => filterListingInquiries(requesterInquiries, requesterInquiryFilter),
    [requesterInquiries, requesterInquiryFilter],
  )
  const requesterInquiryByListingId = useMemo(
    () =>
      requesterInquiries.reduce<Record<string, ListingInquiry>>((accumulator, inquiry) => {
        if (
          inquiry.status !== 'DECLINED' &&
          inquiry.status !== 'CLOSED' &&
          !accumulator[inquiry.listingId]
        ) {
          accumulator[inquiry.listingId] = inquiry
        }

        return accumulator
      }, {}),
    [requesterInquiries],
  )
  const filteredOwnerInquiries = useMemo(
    () => sortListingInquiries(filterListingInquiries(ownerInquiries, ownerInquiryFilter), ownerInquirySort),
    [ownerInquiries, ownerInquiryFilter, ownerInquirySort],
  )
  const activeOwnerInquiriesCount = useMemo(
    () => filterListingInquiries(ownerInquiries, 'ACTIVE').length,
    [ownerInquiries],
  )
  const newOwnerInquiriesCount = useMemo(
    () => ownerInquiries.filter((inquiry) => inquiry.status === 'NEW').length,
    [ownerInquiries],
  )
  const proposedVisitsCount = useMemo(
    () => ownerInquiries.filter((inquiry) => inquiry.visitStatus === 'PROPOSED').length,
    [ownerInquiries],
  )
  const confirmedVisitsCount = useMemo(
    () => ownerInquiries.filter((inquiry) => inquiry.visitStatus === 'CONFIRMED').length,
    [ownerInquiries],
  )
  const composerSourceIntent = useMemo(() => {
    if (composerRouteState?.sourceIntent) {
      return composerRouteState.sourceIntent
    }

    if (editListingId) {
      return getListingIntentForDisplay(editListingId, listingIntentAssignments)
    }

    return housingIntentValues.tenantReplacement
  }, [composerRouteState, editListingId, listingIntentAssignments])

  useEffect(() => {
    listingImagesRef.current = listingImages
  }, [listingImages])

  useEffect(() => {
    return () => {
      listingImagesRef.current.forEach((image) => {
        if (image.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(image.previewUrl)
        }
      })
    }
  }, [])

  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/find-tenant/host')) {
      if (intent !== housingIntentValues.tenantReplacement) {
        setIntent(housingIntentValues.tenantReplacement)
      }
      return
    }
    if (
      path === '/find-tenant' ||
      path.startsWith('/find-tenant/needs') ||
      path.startsWith('/find-tenant/posts') ||
      path.startsWith('/find-tenant/inquiries')
    ) {
      if (intent !== housingIntentValues.findRoom) {
        setIntent(housingIntentValues.findRoom)
      }
    }
  }, [intent, location.pathname, setIntent])

  useEffect(() => {
    if (
      publicListingFilters.propertyType ||
      publicListingFilters.occupancyType ||
      publicListingFilters.amenity
    ) {
      setShowAdvancedPublicFilters(true)
    }
  }, [
    publicListingFilters.amenity,
    publicListingFilters.occupancyType,
    publicListingFilters.propertyType,
  ])

  useEffect(() => {
    if (!listingActionConfirmation) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyListingAction) {
        setListingActionConfirmation(null)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [busyListingAction, listingActionConfirmation])

  useEffect(() => {
    if (!shouldShowHostComposer) {
      return
    }

    const routeListing =
      composerRouteState?.listing && composerRouteState.listing.id === editListingId
        ? normalizeListing(composerRouteState.listing)
        : null

    if (routeListing && editingListingId !== routeListing.id) {
      applyListingForEditing(routeListing)
      return
    }

    if (!editListingId) {
      return
    }

    const existingListing = myListings.find((listing) => listing.id === editListingId)
    if (existingListing && editingListingId !== existingListing.id) {
      applyListingForEditing(existingListing)
    }
  }, [composerRouteState, editListingId, editingListingId, myListings, shouldShowHostComposer])

  function rememberListingIntent(listingId: string, sourceIntent: HousingIntent) {
    setListingIntentAssignments((current) => {
      if (current[listingId] === sourceIntent) {
        return current
      }

      const nextAssignments = {
        ...current,
        [listingId]: sourceIntent,
      }

      persistListingIntentAssignments(nextAssignments)
      return nextAssignments
    })
  }

  function startCreateListing(sourceIntent: HousingIntent = housingIntentValues.tenantReplacement) {
    resetListingComposer()
    setHostStep(0)
    setIntent(sourceIntent)
    navigate('/find-tenant/host/listings/new', {
      state: { sourceIntent } as ListingComposerRouteState,
    })
  }

  function applyListingForEditing(listing: Listing) {
    clearListingImages(false)
    setEditingListingId(listing.id)
    setReplaceTenantForm({
      title: listing.title,
      city: listing.city ?? '',
      locality: listing.locality ?? '',
      locationName: listing.locationName ?? '',
      latitude: listing.latitude,
      longitude: listing.longitude,
      moveInDate: toInputDate(listing.moveInDate),
      rentAmount: listing.rentAmount ? String(listing.rentAmount) : '',
      depositAmount: listing.depositAmount ? String(listing.depositAmount) : '',
      maintenanceAmount: listing.maintenanceAmount ? String(listing.maintenanceAmount) : '',
      amenities: listing.amenities,
      nearbyPlaces: listing.nearbyPlaces,
      propertyType: listing.propertyType ?? 'APARTMENT',
      occupancyType: listing.occupancyType ?? 'SHARED',
      contactMode: listing.contactMode || 'WHATSAPP',
      contactPhone: listing.contactPhone ?? '',
      description: listing.description ?? '',
      miscCharges: listing.miscCharges ?? '',
    })
    setReplaceTenantCityOption(
      listing.city && majorCities.includes(listing.city) ? listing.city : listing.city ? otherCityOptionValue : '',
    )
    setReplaceTenantCustomCity(
      listing.city && !majorCities.includes(listing.city) ? listing.city : '',
    )
    setListingImages(
      listing.images.map((image, index) => ({
        id: image.id,
        fileName: listingImageSuggestions[index] ?? `Image ${index + 1}`,
        previewUrl: getListingImageUrl(image.providerAssetId, 'thumb'),
        status: 'uploaded',
        persisted: true,
        upload: {
          assetProvider: 'CLOUDINARY',
          providerAssetId: image.providerAssetId,
          width: image.width,
          height: image.height,
          bytes: image.bytes,
          isCover: image.isCover,
          sortOrder: image.sortOrder,
        },
      })),
    )
    setHostStep(0)
    setFeedback(null)
  }

  function startEditingListing(
    listing: Listing,
    sourceIntent: HousingIntent = getListingIntentForDisplay(listing.id, listingIntentAssignments),
  ) {
    setIntent(sourceIntent)
    navigate(`/find-tenant/host/listings/${listing.id}/edit`, {
      state: { listing, sourceIntent } as ListingComposerRouteState,
    })
  }

  function resetListingComposer() {
    setEditingListingId(null)
    setReplaceTenantForm(makeEmptyReplaceTenantForm())
    setReplaceTenantCityOption('')
    setReplaceTenantCustomCity('')
    setAmenityInput('')
    setListingNearbyPlaceInput('')
    setListingNearbyPlaceType('tech_park')
    setUploadSummary(null)
    clearListingImages(false)
  }

  function clearPublicListingFilters() {
    setSearchQuery('')
    setPublicListingFilters(makeEmptyPublicListingFilters())
    setShowAdvancedPublicFilters(false)
  }

  function resetHousingNeedForm() {
    setHousingNeedForm(makeEmptyHousingNeedForm())
    setHousingNeedCityOption('')
    setHousingNeedCustomCity('')
    setHousingNeedAmenityInput('')
    setHousingNeedNearbyPlaceInput('')
    setHousingNeedNearbyPlaceType('tech_park')
  }

  function clearSinglePublicListingFilter(key: PublicListingFilterKey) {
    if (key === 'search') {
      setSearchQuery('')
      return
    }

    setPublicListingFilters((current) => {
      switch (key) {
        case 'city':
          return { ...current, city: '' }
        case 'propertyType':
          return { ...current, propertyType: '' }
        case 'occupancyType':
          return { ...current, occupancyType: '' }
        case 'amenity':
          return { ...current, amenity: '' }
        case 'budget':
          return { ...current, budget: 'ANY' }
        case 'verifiedOnly':
          return { ...current, verifiedOnly: false }
        default:
          return current
      }
    })
  }

  async function handleSaveHousingNeed() {
    if (!sessionToken || !user) {
      setFeedback({
        tone: 'error',
        message: 'Please sign in before posting what you are looking for.',
      })
      return
    }

    const city = resolveCityValue(housingNeedCityOption, housingNeedCustomCity)

    if (!city || !housingNeedForm.moveInDate) {
      setFeedback({
        tone: 'error',
        message: 'City and move-in date are required to post your room need.',
      })
      return
    }

    try {
      setIsSavingHousingNeed(true)
      setFeedback(null)

      await apiRequest('/housing-needs', {
        method: 'POST',
        token: sessionToken,
        body: JSON.stringify({
          city,
          locality: housingNeedForm.locality.trim() || undefined,
          preferredPropertyType: housingNeedForm.preferredPropertyType,
          preferredOccupancy: housingNeedForm.preferredOccupancy,
          maxRentAmount: housingNeedForm.maxRentAmount ? Number(housingNeedForm.maxRentAmount) : undefined,
          maxDepositAmount: housingNeedForm.maxDepositAmount ? Number(housingNeedForm.maxDepositAmount) : undefined,
          maxMaintenanceAmount: housingNeedForm.maxMaintenanceAmount
            ? Number(housingNeedForm.maxMaintenanceAmount)
            : undefined,
          preferredAmenities: housingNeedForm.preferredAmenities,
          nearbyPlaces: housingNeedForm.nearbyPlaces,
          moveInDate: toIsoDate(housingNeedForm.moveInDate),
          urgencyLevel: housingNeedForm.urgencyLevel,
          preferredContactMode: housingNeedForm.preferredContactMode,
          notes: housingNeedForm.notes.trim() || undefined,
          status: 'OPEN',
        }),
      })

      resetHousingNeedForm()
      await refetchHousingData()
      navigate('/find-tenant')
      setFeedback({
        tone: 'success',
        message: 'Your room need is live. We updated the feed to show your strongest matches first.',
      })
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to post your room need right now.',
      })
    } finally {
      setIsSavingHousingNeed(false)
    }
  }

  async function flushPendingListingUploads(listingId: string): Promise<ListingImageUploadPayload[]> {
    if (!sessionToken) {
      return []
    }

    const orderedPayloads: ListingImageUploadPayload[] = []

    const snapshot = [...listingImagesRef.current]
    for (const row of snapshot) {
      if (row.status === 'uploaded' && row.upload) {
        orderedPayloads.push(row.upload)
        continue
      }
      if (row.status !== 'pending' || !row.file) {
        continue
      }

      const draftId = row.id
      setListingImages((current) =>
        current.map((image) =>
          image.id === draftId ? { ...image, status: 'uploading' as const } : image,
        ),
      )
      try {
        const upload = await uploadListingImageToCloudinary(row.file, sessionToken, listingId)
        orderedPayloads.push(upload)
        setListingImages((current) =>
          current.map((image) =>
            image.id === draftId
              ? {
                  ...image,
                  status: 'uploaded' as const,
                  upload,
                  file: undefined,
                  previewUrl: getListingImageUrl(upload.providerAssetId, 'thumb'),
                }
              : image,
          ),
        )
      } catch (uploadError) {
        setListingImages((current) =>
          current.map((image) =>
            image.id === draftId
              ? {
                  ...image,
                  status: 'error' as const,
                  error:
                    uploadError instanceof Error ? uploadError.message : 'Unable to upload this image.',
                }
              : image,
          ),
        )
        throw uploadError
      }
    }

    return orderedPayloads.map((payload, index) => ({
      ...payload,
      isCover: index === 0,
      sortOrder: index,
    }))
  }

  async function handleSaveListing(targetStatus: 'DRAFT' | 'PUBLISHED') {
    if (!user) {
      setFeedback({
        tone: 'error',
        message: 'Please sign in with Google before managing housing listings.',
      })
      return
    }

    if (isUploadingImages) {
      setFeedback({
        tone: 'info',
        message: 'Please wait for all apartment images to finish uploading.',
      })
      return
    }

    const city = resolveCityValue(replaceTenantCityOption, replaceTenantCustomCity)
    const sourceIntent =
      composerRouteState?.sourceIntent ??
      (composerListingId
        ? getListingIntentForDisplay(composerListingId, listingIntentAssignments)
        : housingIntentValues.tenantReplacement)

    const imageRowsReady =
      listingImages.filter((image) => image.status === 'pending' || (image.status === 'uploaded' && image.upload))
        .length

    if (targetStatus === 'PUBLISHED' && imageRowsReady < 2) {
      setFeedback({
        tone: 'error',
        message: 'Add at least two photos before publishing. Save a draft first if you still need to upload.',
      })
      return
    }

    const buildPayload = (
      status: 'DRAFT' | 'PUBLISHED',
      images?: ListingImageUploadPayload[],
    ) => ({
      ownerUserId: user.id,
      type: 'tenant_replacement' as const,
      title: replaceTenantForm.title.trim(),
      city: city || undefined,
      locality: replaceTenantForm.locality.trim() || undefined,
      locationName: selectedListingLocation?.locationName,
      latitude: selectedListingLocation?.latitude,
      longitude: selectedListingLocation?.longitude,
      moveInDate: replaceTenantForm.moveInDate ? toIsoDate(replaceTenantForm.moveInDate) : undefined,
      rentAmount: replaceTenantForm.rentAmount ? Number(replaceTenantForm.rentAmount) : undefined,
      depositAmount: replaceTenantForm.depositAmount ? Number(replaceTenantForm.depositAmount) : undefined,
      maintenanceAmount: replaceTenantForm.maintenanceAmount
        ? Number(replaceTenantForm.maintenanceAmount)
        : undefined,
      amenities: replaceTenantForm.amenities,
      nearbyPlaces: replaceTenantForm.nearbyPlaces,
      propertyType: replaceTenantForm.propertyType,
      occupancyType: replaceTenantForm.occupancyType,
      contactMode: replaceTenantForm.contactMode,
      contactPhone: replaceTenantForm.contactPhone.trim() || undefined,
      description: replaceTenantForm.description.trim() || undefined,
      miscCharges: replaceTenantForm.miscCharges.trim() || undefined,
      status,
      images: images && images.length > 0 ? images : undefined,
    })

    let workingListingId = composerListingId
    const wasNewListing = !composerListingId

    try {
      setIsSavingListing(true)
      setFeedback(null)

      if (!workingListingId) {
        const createdListing = await apiRequest<Listing>('/listings', {
          method: 'POST',
          token: sessionToken,
          body: JSON.stringify(buildPayload('DRAFT', undefined)),
        })
        workingListingId = createdListing.id
        setEditingListingId(createdListing.id)
        rememberListingIntent(createdListing.id, sourceIntent)
        navigate(`/find-tenant/host/listings/${createdListing.id}/edit`, {
          replace: true,
          state: { listing: createdListing, sourceIntent } as ListingComposerRouteState,
        })
      }

      const orderedImages = await flushPendingListingUploads(workingListingId)
      const finalPayload = buildPayload(targetStatus, orderedImages)

      const savedListing = await apiRequest<Listing>(`/listings/${workingListingId}`, {
        method: 'PATCH',
        token: sessionToken,
        body: JSON.stringify(finalPayload),
      })

      rememberListingIntent(savedListing.id, sourceIntent)
      await refetchHousingData()

      if (targetStatus === 'PUBLISHED') {
        resetListingComposer()
        setHostStep(0)
        navigate('/find-tenant/host')
        setFeedback({
          tone: 'success',
          message: wasNewListing ? 'Listing published successfully.' : 'Listing updated and published.',
        })
      } else {
        applyListingForEditing(savedListing)
        setFeedback({
          tone: 'success',
          message: 'Listing saved as draft.',
        })
      }
    } catch (error) {
      const uploadedIds = listingImagesRef.current
        .filter((image) => !image.persisted && image.upload?.providerAssetId)
        .map((image) => image.upload!.providerAssetId)
      if (uploadedIds.length > 0 && sessionToken) {
        try {
          await cleanupUploadedListingImages(uploadedIds, sessionToken)
        } catch {
          // best-effort cleanup
        }
      }
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to save this listing right now.',
      })
    } finally {
      setIsSavingListing(false)
    }
  }

  async function handleListingStatusChange(listing: Listing, nextStatus: ListingStatus) {
    const actionKey = `${nextStatus}-${listing.id}`

    try {
      setBusyListingAction(actionKey)
      setFeedback(null)

      await apiRequest(`/listings/${listing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
        }),
      })

      await refetchHousingData()
      setFeedback({
        tone: 'success',
        message:
          nextStatus === 'FILLED'
            ? 'Listing marked as rented and active inquiries were closed.'
            : nextStatus === 'PAUSED'
              ? 'Listing moved to on hold and hidden from the public feed.'
              : nextStatus === 'PUBLISHED'
                ? 'Listing resumed and is live again.'
                : 'Listing removed from your active dashboard.',
      })
      return true
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to update listing status.',
      })
      return false
    } finally {
      setBusyListingAction(null)
    }
  }

  function requestListingStatusChange(
    listing: Listing,
    nextStatus: Extract<ListingStatus, 'ARCHIVED' | 'FILLED' | 'PAUSED' | 'PUBLISHED'>,
  ) {
    setListingActionConfirmation({ listing, nextStatus })
  }

  async function confirmListingStatusChange() {
    if (!listingActionConfirmation) {
      return
    }

    const didSucceed = await handleListingStatusChange(
      listingActionConfirmation.listing,
      listingActionConfirmation.nextStatus,
    )

    if (didSucceed) {
      setListingActionConfirmation(null)
    }
  }

  function openListingDetails(listing: Listing) {
    navigate(`/find-tenant/listings/${listing.id}`, {
      state: {
        listing,
        backLabel: 'Back to your listings',
        backTo: '/find-tenant/host',
        sourceIntent: housingIntentValues.tenantReplacement,
      } as ListingDetailsRouteState,
    })
  }

  function openOwnerInquiryDetails(inquiry: ListingInquiry) {
    navigate(`/find-tenant/host/inquiries/${inquiry.id}`, {
      state: {
        inquiry,
        backLabel: 'Back to inquiries',
        backTo: '/find-tenant/host/inquiries',
        sourceIntent: housingIntentValues.tenantReplacement,
      } as InquiryDetailsRouteState,
    })
  }

  function openRequesterInquiryDetails(inquiry: ListingInquiry) {
    navigate(`/find-tenant/inquiries/${inquiry.id}`, {
      state: {
        inquiry,
        backLabel: 'Back to sent inquiries',
        backTo: '/find-tenant/inquiries',
        sourceIntent: housingIntentValues.findRoom,
      } as InquiryDetailsRouteState,
    })
  }

  function startSchedulingInquiry(inquiry: ListingInquiry) {
    setSchedulingInquiryId(inquiry.id)
    setScheduleVisitAtInput(toDateTimeLocalInput(inquiry.scheduledVisitAt ?? inquiry.preferredVisitAt))
    setScheduleVisitNoteInput(inquiry.scheduledVisitNote ?? inquiry.preferredVisitNote ?? '')
  }

  function cancelSchedulingInquiry() {
    setSchedulingInquiryId(null)
    setScheduleVisitAtInput('')
    setScheduleVisitNoteInput('')
  }

  async function handleInquiryStatusUpdate(
    inquiry: ListingInquiry,
    nextStatus: ListingInquiryStatus,
    options?: {
      scheduledVisitAt?: string
      scheduledVisitNote?: string
    },
  ) {
    if (!sessionToken) {
      setFeedback({
        tone: 'error',
        message: 'Please sign in before managing listing inquiries.',
      })
      return
    }

    const actionKey = `${nextStatus}-${inquiry.id}`

    try {
      setBusyInquiryAction(actionKey)
      setFeedback(null)

      await apiRequest(`/listing-inquiries/${inquiry.id}/status`, {
        method: 'PATCH',
        token: sessionToken,
        body: JSON.stringify({
          status: nextStatus,
          scheduledVisitAt: options?.scheduledVisitAt
            ? toIsoDateTime(options.scheduledVisitAt)
            : undefined,
          scheduledVisitNote: options?.scheduledVisitNote?.trim() || undefined,
        }),
      })

      cancelSchedulingInquiry()
      await refetchHousingData()
      setFeedback({
        tone: 'success',
        message:
          nextStatus === 'CONTACTED'
            ? 'Inquiry marked as contacted.'
            : nextStatus === 'SCHEDULED'
              ? 'Visit scheduled successfully.'
              : nextStatus === 'DECLINED'
                ? 'Inquiry declined.'
                : 'Inquiry closed.',
      })
    } catch (updateError) {
      setFeedback({
        tone: 'error',
        message: updateError instanceof Error ? updateError.message : 'Unable to update the inquiry.',
      })
    } finally {
      setBusyInquiryAction(null)
    }
  }

  async function handleListingImageSelection(event: ChangeEvent<HTMLInputElement>) {
    await uploadSelectedListingImages(event.target.files)
    event.target.value = ''
  }

  async function uploadSelectedListingImages(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (files.length === 0) {
      return
    }

    if (!sessionToken) {
      setFeedback({
        tone: 'error',
        message: 'Please sign in before uploading apartment images.',
      })
      return
    }

    if (!composerListingId) {
      if (listingImages.length + files.length > 8) {
        setFeedback({
          tone: 'error',
          message: 'You can upload a maximum of 8 apartment images.',
        })
        return
      }
      setFeedback({
        tone: 'info',
        message: 'Photos are stored locally until you save a draft or publish (we then attach them to your listing).',
      })
      const nextDrafts = files.map((file) => ({
        id: window.crypto.randomUUID(),
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
        status: 'pending' as const,
        file,
      }))
      setListingImages((current) => [...current, ...nextDrafts])
      setUploadSummary(`${nextDrafts.length} photo${nextDrafts.length === 1 ? '' : 's'} ready — save draft or publish to upload.`)
      return
    }

    if (listingImages.length + files.length > 8) {
      setFeedback({
        tone: 'error',
        message: 'You can upload a maximum of 8 apartment images.',
      })
      return
    }

    setFeedback(null)
    setIsUploadingImages(true)
    setUploadSummary(`Uploading ${files.length} image${files.length > 1 ? 's' : ''}...`)

    const nextDrafts = files.map((file) => ({
      id: window.crypto.randomUUID(),
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading' as const,
    }))

    setListingImages((current) => [...current, ...nextDrafts])

    const uploadResults = await Promise.all(
      files.map(async (file, index) => {
        const draftId = nextDrafts[index].id

        try {
          const upload = await uploadListingImageToCloudinary(file, sessionToken, composerListingId)
          setListingImages((current) =>
            current.map((image) =>
              image.id === draftId
                ? {
                    ...image,
                    status: 'uploaded',
                    upload,
                    previewUrl: getListingImageUrl(upload.providerAssetId, 'thumb'),
                  }
                : image,
            ),
          )
          return { success: true as const }
        } catch (error) {
          setListingImages((current) =>
            current.map((image) =>
              image.id === draftId
                ? {
                    ...image,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Upload failed.',
                  }
                : image,
            ),
          )
          return {
            success: false as const,
            message: error instanceof Error ? error.message : 'Upload failed.',
          }
        }
      }),
    )

    const successCount = uploadResults.filter((result) => result.success).length
    const failureCount = uploadResults.length - successCount

    if (failureCount === 0) {
      setUploadSummary(`${successCount} image${successCount === 1 ? '' : 's'} uploaded.`)
    } else {
      setUploadSummary(
        `${successCount} image${successCount === 1 ? '' : 's'} uploaded. ${failureCount} failed.`,
      )
      const firstFailure = uploadResults.find((result) => !result.success)
      setFeedback({
        tone: 'error',
        message: firstFailure?.message ?? 'Some images could not be uploaded.',
      })
    }

    setIsUploadingImages(false)
  }

  function handleListingImageDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragActive(false)
    void uploadSelectedListingImages(event.dataTransfer.files)
  }

  function moveListingImage(index: number, direction: -1 | 1) {
    setListingImages((current) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current
      }

      const next = [...current]
      const [image] = next.splice(index, 1)
      next.splice(nextIndex, 0, image)
      return next
    })
  }

  async function removeListingImage(id: string) {
    const imageToRemove = listingImages.find((image) => image.id === id)

    if (!imageToRemove) {
      return
    }

    if (imageToRemove.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.previewUrl)
    }

    if (!imageToRemove.persisted && imageToRemove.upload?.providerAssetId && sessionToken) {
      try {
        await cleanupUploadedListingImages([imageToRemove.upload.providerAssetId], sessionToken)
      } catch {
        // Keep removal resilient even if Cloudinary cleanup fails.
      }
    }

    setListingImages((current) => current.filter((image) => image.id !== id))
  }

  function clearListingImages(shouldCleanup = true) {
    const imagesToCleanup = listingImagesRef.current
      .filter((image) => !image.persisted && image.upload?.providerAssetId)
      .map((image) => image.upload!.providerAssetId)

    listingImagesRef.current.forEach((image) => {
      if (image.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(image.previewUrl)
      }
    })

    setListingImages([])

    if (!shouldCleanup || imagesToCleanup.length === 0 || !sessionToken) {
      return
    }

    setIsCleaningUpUploads(true)
    void cleanupUploadedListingImages(imagesToCleanup, sessionToken).finally(() => {
      setIsCleaningUpUploads(false)
    })
  }

  function toggleAmenity(amenity: string) {
    setReplaceTenantForm((current) => {
      const hasAmenity = current.amenities.some((item) => item.toLowerCase() === amenity.toLowerCase())

      return {
        ...current,
        amenities: hasAmenity
          ? current.amenities.filter((item) => item.toLowerCase() !== amenity.toLowerCase())
          : [...current.amenities, amenity],
      }
    })
  }

  function addCustomAmenity() {
    const normalizedAmenity = normalizeAmenityName(amenityInput)

    if (!normalizedAmenity) {
      return
    }

    setReplaceTenantForm((current) => {
      if (current.amenities.some((item) => item.toLowerCase() === normalizedAmenity.toLowerCase())) {
        return current
      }

      return {
        ...current,
        amenities: [...current.amenities, normalizedAmenity],
      }
    })
    setAmenityInput('')
  }

  function toggleHousingNeedAmenity(amenity: string) {
    setHousingNeedForm((current) => {
      const hasAmenity = current.preferredAmenities.some((item) => item.toLowerCase() === amenity.toLowerCase())

      return {
        ...current,
        preferredAmenities: hasAmenity
          ? current.preferredAmenities.filter((item) => item.toLowerCase() !== amenity.toLowerCase())
          : [...current.preferredAmenities, amenity],
      }
    })
  }

  function addCustomHousingNeedAmenity() {
    const normalizedAmenity = normalizeAmenityName(housingNeedAmenityInput)

    if (!normalizedAmenity) {
      return
    }

    setHousingNeedForm((current) => {
      if (current.preferredAmenities.some((item) => item.toLowerCase() === normalizedAmenity.toLowerCase())) {
        return current
      }

      return {
        ...current,
        preferredAmenities: [...current.preferredAmenities, normalizedAmenity],
      }
    })
    setHousingNeedAmenityInput('')
  }

  function addListingNearbyPlace() {
    const normalizedName = normalizeNearbyPlaceName(listingNearbyPlaceInput)

    if (!normalizedName) {
      return
    }

    setReplaceTenantForm((current) => {
      if (
        current.nearbyPlaces.some(
          (place) =>
            place.name.toLowerCase() === normalizedName.toLowerCase() && place.type === listingNearbyPlaceType,
        )
      ) {
        return current
      }

      if (current.nearbyPlaces.length >= 5) {
        return current
      }

      return {
        ...current,
        nearbyPlaces: [...current.nearbyPlaces, { name: normalizedName, type: listingNearbyPlaceType }],
      }
    })

    setListingNearbyPlaceInput('')
  }

  function removeListingNearbyPlace(placeToRemove: NearbyPlace) {
    setReplaceTenantForm((current) => ({
      ...current,
      nearbyPlaces: current.nearbyPlaces.filter(
        (place) => !(place.name === placeToRemove.name && place.type === placeToRemove.type),
      ),
    }))
  }

  function addHousingNeedNearbyPlace() {
    const normalizedName = normalizeNearbyPlaceName(housingNeedNearbyPlaceInput)

    if (!normalizedName) {
      return
    }

    setHousingNeedForm((current) => {
      if (
        current.nearbyPlaces.some(
          (place) =>
            place.name.toLowerCase() === normalizedName.toLowerCase() && place.type === housingNeedNearbyPlaceType,
        )
      ) {
        return current
      }

      if (current.nearbyPlaces.length >= 5) {
        return current
      }

      return {
        ...current,
        nearbyPlaces: [...current.nearbyPlaces, { name: normalizedName, type: housingNeedNearbyPlaceType }],
      }
    })

    setHousingNeedNearbyPlaceInput('')
  }

  function removeHousingNeedNearbyPlace(placeToRemove: NearbyPlace) {
    setHousingNeedForm((current) => ({
      ...current,
      nearbyPlaces: current.nearbyPlaces.filter(
        (place) => !(place.name === placeToRemove.name && place.type === placeToRemove.type),
      ),
    }))
  }

  const hostModeEmptyState =
    hostModeListings.length === 0 ? (
      <Card className="feed-card">
        <strong>You have no active listings yet</strong>
        <p className="feed-copy">
          Create your first replacement post from tenant replacement mode and keep future edits, draft saves, and rented updates in one place.
        </p>
      </Card>
    ) : (
      <Card className="feed-card">
        <strong>No {formatHostListingFilterLabel(myListingFilter).toLowerCase()} listings right now</strong>
        <p className="feed-copy">
          Switch the status filter to review a different group of listings, including archived posts when needed.
        </p>
      </Card>
    )

  function renderHostListingsPanel() {
    return (
      <div className="hub-panel host-dashboard-panel">
        <div className="hub-panel-head">
          <div>
            <span className="muted">Your listings</span>
          </div>
          <div className="hub-panel-actions">
            <span className="host-active-count-badge">
              <Badge tone="purple">{isLoading || !user ? 'Loading' : `${activeHostListingsCount} active`}</Badge>
            </span>
          </div>
        </div>

        {user ? (
          <>
            <div className="host-metrics-mobile-summary">
              <span className="muted">Active listings</span>
              <strong>{activeHostListingsCount}</strong>
              <button
                aria-expanded={isHostMetricsExpandedOnMobile}
                className="host-metrics-mobile-toggle"
                onClick={() => setIsHostMetricsExpandedOnMobile((current) => !current)}
                type="button"
              >
                {isHostMetricsExpandedOnMobile ? 'Hide metrics' : 'View metrics'}
              </button>
            </div>

            <div className={`host-metrics-grid${isHostMetricsExpandedOnMobile ? ' mobile-open' : ''}`}>
              <Card className="host-metric-card">
                <span className="muted">Live listings</span>
                <strong>{hostModeListings.filter((listing) => listing.status === 'PUBLISHED').length}</strong>
                <p className="feed-copy">Currently visible in the public feed.</p>
              </Card>
              <Card className="host-metric-card">
                <span className="muted">On hold</span>
                <strong>{pausedHostListingsCount}</strong>
                <p className="feed-copy">Temporarily hidden until you resume them.</p>
              </Card>
              <Card className="host-metric-card">
                <span className="muted">Proposed visits</span>
                <strong>{proposedVisitsCount}</strong>
                <p className="feed-copy">Waiting for seeker confirmation.</p>
              </Card>
              <Card className="host-metric-card">
                <span className="muted">Confirmed visits</span>
                <strong>{confirmedVisitsCount}</strong>
                <p className="feed-copy">Ready for in-person follow-up.</p>
              </Card>
            </div>
          </>
        ) : null}

        {user ? (
          <div className="host-listing-toolbar">
            <div className="host-mobile-filter-trigger">
              <button
                aria-expanded={isHostFilterMenuOpenOnMobile}
                className={`host-mobile-filter-button host-mobile-filter-button-${getHostListingFilterTone(myListingFilter)}`}
                onClick={() => setIsHostFilterMenuOpenOnMobile((current) => !current)}
                type="button"
              >
                Filters · {formatHostListingFilterLabel(myListingFilter)}
              </button>
              {isHostFilterMenuOpenOnMobile ? (
                <div className="host-mobile-filter-menu">
                  <div className="mobile-filter-dialog-head">
                    <strong>Select listing filter</strong>
                    <button onClick={() => setIsHostFilterMenuOpenOnMobile(false)} type="button">Done</button>
                  </div>
                  <div className="host-mobile-filter-sheet">
                    {hostListingFilters.map((filterOption) => (
                      <button
                        aria-pressed={myListingFilter === filterOption.value}
                        className={`host-mobile-filter-option host-mobile-filter-option-${getHostListingFilterTone(filterOption.value)}${myListingFilter === filterOption.value ? ' active' : ''}`}
                        key={filterOption.value}
                        onClick={() => {
                          setMyListingFilter(filterOption.value)
                          setIsHostFilterMenuOpenOnMobile(false)
                        }}
                        type="button"
                      >
                        <span>{filterOption.label}</span>
                        <strong>{filterHostListings(hostModeListings, filterOption.value).length}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="listing-filter-chip-row host-listing-filter-desktop">
              {hostListingFilters.map((filterOption) => (
                <button
                  aria-pressed={myListingFilter === filterOption.value}
                  className={`listing-filter-chip${myListingFilter === filterOption.value ? ' active' : ''}`}
                  key={filterOption.value}
                  onClick={() => setMyListingFilter(filterOption.value)}
                  type="button"
                >
                  {filterOption.label} ({filterHostListings(hostModeListings, filterOption.value).length})
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!user ? (
          <Card className="feed-card">
            <strong>Sign in to host a listing</strong>
            <p className="feed-copy">
              Tenant replacement mode is for creating drafts, publishing replacement listings, and managing rented status.
            </p>
            <Button to="/profile" variant="secondary">
              Open profile
            </Button>
          </Card>
        ) : filteredHostListings.length === 0 && !isLoading ? (
          hostModeEmptyState
        ) : (
          <div className="host-listing-grid">
            {filteredHostListings.map((listing) => (
              <HostListingCard
                busyAction={busyListingAction}
                key={listing.id}
                listing={listing}
                onArchive={(current) => requestListingStatusChange(current, 'ARCHIVED')}
                onEdit={(current) => startEditingListing(current, housingIntentValues.tenantReplacement)}
                onMarkAsRented={(current) => requestListingStatusChange(current, 'FILLED')}
                onResume={(current) => requestListingStatusChange(current, 'PUBLISHED')}
                onToggleHold={(current) => requestListingStatusChange(current, 'PAUSED')}
                onViewDetails={openListingDetails}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  function startEditingNeed(need: HousingNeed) {
    setEditingNeedId(need.id)
    setExpandedNeedId(need.id)
    setEditNeedDraft({
      city: need.city,
      locality: need.locality ?? '',
      maxRentAmount: need.maxRentAmount != null ? String(need.maxRentAmount) : '',
      maxDepositAmount: need.maxDepositAmount != null ? String(need.maxDepositAmount) : '',
      maxMaintenanceAmount: need.maxMaintenanceAmount != null ? String(need.maxMaintenanceAmount) : '',
      preferredPropertyType: need.preferredPropertyType,
      preferredOccupancy: need.preferredOccupancy,
      preferredAmenities: [...need.preferredAmenities],
      moveInDate: need.moveInDate ? need.moveInDate.split('T')[0] : '',
      urgencyLevel: need.urgencyLevel,
      notes: need.notes ?? '',
      status: need.status,
    })
  }

  async function saveNeedEdit(needId: string) {
    if (!sessionToken) return
    setIsSavingNeedEdit(true)
    try {
      const payload: Record<string, unknown> = {
        city: editNeedDraft.city,
        preferredPropertyType: editNeedDraft.preferredPropertyType,
        preferredOccupancy: editNeedDraft.preferredOccupancy,
        preferredAmenities: editNeedDraft.preferredAmenities,
        urgencyLevel: editNeedDraft.urgencyLevel,
        status: editNeedDraft.status,
      }
      if (editNeedDraft.locality) payload.locality = editNeedDraft.locality
      if (editNeedDraft.maxRentAmount) payload.maxRentAmount = Number(editNeedDraft.maxRentAmount)
      if (editNeedDraft.maxDepositAmount) payload.maxDepositAmount = Number(editNeedDraft.maxDepositAmount)
      if (editNeedDraft.maxMaintenanceAmount) payload.maxMaintenanceAmount = Number(editNeedDraft.maxMaintenanceAmount)
      if (editNeedDraft.moveInDate) payload.moveInDate = new Date(editNeedDraft.moveInDate).toISOString()
      if (editNeedDraft.notes) payload.notes = editNeedDraft.notes
      const updated = await apiRequest<HousingNeed>(`/housing-needs/${needId}`, {
        method: 'PATCH',
        token: sessionToken,
        body: JSON.stringify(payload),
      })
      setMyHousingNeeds((cur) => cur.map((n) => (n.id === needId ? updated : n)))
      setEditingNeedId(null)
    } catch {
      // Silently retain draft on error
    } finally {
      setIsSavingNeedEdit(false)
    }
  }

  function renderSeekerPostedListingsPanel() {
    const housingNeedStatusTone = (status: HousingNeedStatus) => {
      if (status === 'OPEN') return 'green'
      if (status === 'MATCHED') return 'purple'
      if (status === 'CLOSED') return 'gray'
      return 'gray'
    }

    return (
      <div className="hub-panel host-dashboard-panel room-posts-hub-panel">
        <div className="hub-panel-head">
          <div>
            <span className="muted">Your room posts</span>
            <h2>Your room requirements</h2>
            <p className="panel-subtitle room-posts-panel-subtitle-desktop-only">
              These are the room needs you posted. Each post tells Cirvo what you are looking for so it can rank better matches first.
            </p>
          </div>
          <Badge tone="green">{isLoading ? 'Loading' : `${activeHousingNeedsCount} active`}</Badge>
        </div>

        {!user ? (
          <Card className="feed-card">
            <strong>Sign in to see your room posts</strong>
            <p className="feed-copy">
              Once you sign in, every room requirement you have posted will appear here so you can manage and update it.
            </p>
            <Button to="/profile" variant="secondary">Open profile</Button>
          </Card>
        ) : myHousingNeeds.length === 0 && !isLoading ? (
          <Card className="feed-card">
            <strong>No room requirements posted yet</strong>
            <p className="feed-copy">
              Go to <em>Your room need</em> and fill in your preferences — city, budget, move-in date, and what you are looking for. Once saved it will appear here.
            </p>
            <Button to="/find-tenant/needs" variant="secondary">Post your room need</Button>
          </Card>
        ) : (
          <div className="room-posts-grid">
            {myHousingNeeds.map((need) => {
              const isExpanded = expandedNeedId === need.id
              const isEditing = editingNeedId === need.id
              const allChips = [
                need.preferredPropertyType ? formatEnum(need.preferredPropertyType) : null,
                need.preferredOccupancy ? formatEnum(need.preferredOccupancy) : null,
                ...need.preferredAmenities.map(formatEnum),
              ].filter(Boolean) as string[]
              const summaryChips = allChips.slice(0, 4)
              const extraChips = allChips.length - summaryChips.length

              return (
                <Card className={`room-post-card need-post-card${isExpanded ? ' need-post-card--expanded' : ''}`} key={need.id}>
                  {/* ── Collapsed header ── */}
                  <div className="need-post-head">
                    <div className="need-post-location">
                      <MapPin size={14} />
                      <strong>{need.locality ? `${need.locality}, ${need.city}` : need.city}</strong>
                    </div>
                    <Badge tone={housingNeedStatusTone(need.status)}>
                      {need.status === 'OPEN' ? 'Active' : need.status === 'MATCHED' ? 'Matched' : need.status === 'CLOSED' ? 'Closed' : 'Archived'}
                    </Badge>
                  </div>

                  {/* ── Summary facts (always visible) ── */}
                  <div className="need-post-facts">
                    {need.maxRentAmount ? (
                      <div className="listing-details-fact">
                        <span className="muted">Max rent</span>
                        <strong>{formatMoney(need.maxRentAmount)} / mo</strong>
                      </div>
                    ) : null}
                    {need.maxDepositAmount ? (
                      <div className="listing-details-fact">
                        <span className="muted">Max deposit</span>
                        <strong>{formatMoney(need.maxDepositAmount)}</strong>
                      </div>
                    ) : null}
                    <div className="listing-details-fact">
                      <span className="muted">Move-in</span>
                      <strong>{formatShortDate(need.moveInDate)}</strong>
                    </div>
                  </div>

                  {summaryChips.length > 0 ? (
                    <div className="nearby-place-chip-row compact">
                      {summaryChips.map((chip) => (
                        <span className="nearby-place-chip static" key={`need-${need.id}-${chip}`}>{chip}</span>
                      ))}
                      {extraChips > 0 && !isExpanded ? (
                        <span className="nearby-place-chip static muted">+{extraChips} more</span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* ── Expanded details / edit form ── */}
                  {isExpanded && (
                    <div className="need-post-expanded">
                      {isEditing ? (
                        <div className="need-edit-form">
                          <div className="need-edit-section-label">Edit your room requirement</div>

                          <div className="need-edit-grid">
                            <label className="need-edit-field">
                              <span>City</span>
                              <input
                                className="input"
                                value={editNeedDraft.city}
                                onChange={(e) => setEditNeedDraft((d) => ({ ...d, city: e.target.value }))}
                                placeholder="City"
                              />
                            </label>
                            <label className="need-edit-field">
                              <span>Locality / area</span>
                              <input
                                className="input"
                                value={editNeedDraft.locality}
                                onChange={(e) => setEditNeedDraft((d) => ({ ...d, locality: e.target.value }))}
                                placeholder="e.g. Koramangala"
                              />
                            </label>
                            <label className="need-edit-field">
                              <span>Max rent (₹ / mo)</span>
                              <input
                                className="input"
                                type="number"
                                value={editNeedDraft.maxRentAmount}
                                onChange={(e) => setEditNeedDraft((d) => ({ ...d, maxRentAmount: e.target.value }))}
                                placeholder="e.g. 20000"
                              />
                            </label>
                            <label className="need-edit-field">
                              <span>Max deposit (₹)</span>
                              <input
                                className="input"
                                type="number"
                                value={editNeedDraft.maxDepositAmount}
                                onChange={(e) => setEditNeedDraft((d) => ({ ...d, maxDepositAmount: e.target.value }))}
                                placeholder="e.g. 50000"
                              />
                            </label>
                            <label className="need-edit-field">
                              <span>Max maintenance (₹)</span>
                              <input
                                className="input"
                                type="number"
                                value={editNeedDraft.maxMaintenanceAmount}
                                onChange={(e) => setEditNeedDraft((d) => ({ ...d, maxMaintenanceAmount: e.target.value }))}
                                placeholder="e.g. 2000"
                              />
                            </label>
                            <label className="need-edit-field">
                              <span>Move-in date</span>
                              <DatePickerInput
                                className="need-edit-date"
                                onChange={(v) => setEditNeedDraft((d) => ({ ...d, moveInDate: v }))}
                                value={editNeedDraft.moveInDate}
                              />
                            </label>
                            <label className="need-edit-field">
                              <span>Property type</span>
                              <select
                                className="input"
                                value={editNeedDraft.preferredPropertyType}
                                onChange={(e) => setEditNeedDraft((d) => ({ ...d, preferredPropertyType: e.target.value }))}
                              >
                                <option value="">Any</option>
                                <option value="apartment">Apartment</option>
                                <option value="independent_house">Independent house</option>
                                <option value="pg">PG</option>
                                <option value="villa">Villa</option>
                              </select>
                            </label>
                            <label className="need-edit-field">
                              <span>Occupancy</span>
                              <select
                                className="input"
                                value={editNeedDraft.preferredOccupancy}
                                onChange={(e) => setEditNeedDraft((d) => ({ ...d, preferredOccupancy: e.target.value }))}
                              >
                                <option value="">Any</option>
                                <option value="single">Single</option>
                                <option value="double">Double sharing</option>
                                <option value="triple">Triple sharing</option>
                              </select>
                            </label>
                            <label className="need-edit-field">
                              <span>Urgency</span>
                              <select
                                className="input"
                                value={editNeedDraft.urgencyLevel}
                                onChange={(e) => setEditNeedDraft((d) => ({ ...d, urgencyLevel: e.target.value }))}
                              >
                                <option value="flexible">Flexible</option>
                                <option value="within_a_month">Within a month</option>
                                <option value="within_a_week">Within a week</option>
                                <option value="immediate">Immediate</option>
                              </select>
                            </label>
                            <label className="need-edit-field">
                              <span>Status</span>
                              <select
                                className="input"
                                value={editNeedDraft.status}
                                onChange={(e) => setEditNeedDraft((d) => ({ ...d, status: e.target.value as HousingNeedStatus }))}
                              >
                                <option value="OPEN">Active</option>
                                <option value="MATCHED">Matched</option>
                                <option value="CLOSED">Closed</option>
                                <option value="ARCHIVED">Archived</option>
                              </select>
                            </label>
                          </div>

                          <label className="need-edit-field need-edit-field--full">
                            <span>Notes</span>
                            <textarea
                              className="input"
                              rows={3}
                              value={editNeedDraft.notes}
                              onChange={(e) => setEditNeedDraft((d) => ({ ...d, notes: e.target.value }))}
                              placeholder="Any additional details about what you are looking for…"
                            />
                          </label>

                          <div className="need-edit-actions">
                            <Button
                              variant="secondary"
                              onClick={() => setEditingNeedId(null)}
                              disabled={isSavingNeedEdit}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => saveNeedEdit(need.id)}
                              disabled={isSavingNeedEdit}
                            >
                              {isSavingNeedEdit ? 'Saving…' : 'Save changes'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="need-post-full-details">
                          {need.maxMaintenanceAmount ? (
                            <div className="need-post-facts">
                              <div className="listing-details-fact">
                                <span className="muted">Max maintenance</span>
                                <strong>{formatMoney(need.maxMaintenanceAmount)} / mo</strong>
                              </div>
                            </div>
                          ) : null}

                          {need.urgencyLevel ? (
                            <div className="need-detail-row">
                              <span className="muted">Urgency</span>
                              <span>{formatEnum(need.urgencyLevel)}</span>
                            </div>
                          ) : null}

                          {allChips.length > 4 ? (
                            <div>
                              <p className="muted" style={{ fontSize: '0.78rem', marginBottom: 6 }}>All preferences</p>
                              <div className="nearby-place-chip-row compact">
                                {allChips.map((chip) => (
                                  <span className="nearby-place-chip static" key={`full-${need.id}-${chip}`}>{chip}</span>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {need.nearbyPlaces?.length > 0 ? (
                            <div>
                              <p className="muted" style={{ fontSize: '0.78rem', marginBottom: 6 }}>Nearby places wanted</p>
                              <div className="nearby-place-chip-row compact">
                                {need.nearbyPlaces.map((place) => (
                                  <span className="nearby-place-chip static" key={place.id}>{place.name}</span>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {need.notes ? (
                            <p className="feed-copy need-post-notes">{need.notes}</p>
                          ) : null}

                          <div className="need-detail-row need-detail-row--meta">
                            <span className="muted" style={{ fontSize: '0.78rem' }}>Last updated {formatShortDate(need.updatedAt)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Footer ── */}
                  <div className="need-post-footer">
                    <span className="muted" style={{ fontSize: '0.78rem' }}>Posted {formatShortDate(need.createdAt)}</span>
                    <div className="need-post-footer-actions">
                      <button
                        className="need-show-more-btn"
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedNeedId(null)
                            setEditingNeedId(null)
                          } else {
                            setExpandedNeedId(need.id)
                          }
                        }}
                      >
                        {isExpanded ? 'Hide details' : 'Show details'}
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {isExpanded && !isEditing ? (
                        <Button variant="secondary" onClick={() => startEditingNeed(need)}>
                          Edit
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  function renderHostInquiriesPanel() {
    return (
      <div className="hub-panel host-dashboard-panel">
        <div className="hub-panel-head">
          <div>
            <span className="muted">Lead management</span>
            <h2>Incoming inquiries</h2>
            <p className="panel-subtitle">
              Review seeker preferences, mark outreach progress, and schedule visits from one queue.
            </p>
          </div>
          <div className="hub-panel-actions">
            <Badge tone="green">
              {isLoading ? 'Loading' : `${activeOwnerInquiriesCount} active`}
            </Badge>
            {!isLoading && newOwnerInquiriesCount > 0 ? (
              <Badge tone="purple">{newOwnerInquiriesCount} new</Badge>
            ) : null}
          </div>
        </div>

        {!user ? (
          <Card className="feed-card">
            <strong>Sign in to manage inquiries</strong>
            <p className="feed-copy">
              Incoming interest from seekers will appear here once your published listings start receiving inquiries.
            </p>
            <Button to="/profile" variant="secondary">
              Open profile
            </Button>
          </Card>
        ) : (
          <>
            <div className="host-mobile-filter-trigger">
              <button
                aria-expanded={isHostInquiryFilterMenuOpenOnMobile}
                className={`host-mobile-filter-button host-mobile-filter-button-${getInquiryFilterTone(ownerInquiryFilter)}`}
                onClick={() => setIsHostInquiryFilterMenuOpenOnMobile((current) => !current)}
                type="button"
              >
                Filters · {formatListingInquiryFilterLabel(ownerInquiryFilter)} · {listingInquirySortOptions.find((option) => option.value === ownerInquirySort)?.label ?? 'Needs action first'}
              </button>
              {isHostInquiryFilterMenuOpenOnMobile ? (
                <div className="host-mobile-filter-menu">
                  <div className="mobile-filter-dialog-head">
                    <strong>Inquiry filters</strong>
                    <button onClick={() => setIsHostInquiryFilterMenuOpenOnMobile(false)} type="button">Done</button>
                  </div>
                  <div className="mobile-filter-section">
                    <span className="muted">Status</span>
                    <div className="host-mobile-filter-sheet">
                      {listingInquiryFilters.map((filterOption) => (
                        <button
                          aria-pressed={ownerInquiryFilter === filterOption.value}
                          className={`host-mobile-filter-option host-mobile-filter-option-${getInquiryFilterTone(filterOption.value)}${ownerInquiryFilter === filterOption.value ? ' active' : ''}`}
                          key={filterOption.value}
                          onClick={() => setOwnerInquiryFilter(filterOption.value)}
                          type="button"
                        >
                          <span>{filterOption.label}</span>
                          <strong>{filterListingInquiries(ownerInquiries, filterOption.value).length}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mobile-filter-section">
                    <span className="muted">Sort</span>
                    <div className="host-mobile-filter-sheet">
                      {listingInquirySortOptions.map((sortOption) => (
                        <button
                          aria-pressed={ownerInquirySort === sortOption.value}
                          className={`host-mobile-filter-option host-mobile-filter-option-violet${ownerInquirySort === sortOption.value ? ' active' : ''}`}
                          key={sortOption.value}
                          onClick={() => setOwnerInquirySort(sortOption.value)}
                          type="button"
                        >
                          <span>{sortOption.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="listing-filter-chip-row host-listing-filter-desktop">
              {listingInquiryFilters.map((filterOption) => (
                <button
                  aria-pressed={ownerInquiryFilter === filterOption.value}
                  className={`listing-filter-chip${ownerInquiryFilter === filterOption.value ? ' active' : ''}`}
                  key={filterOption.value}
                  onClick={() => setOwnerInquiryFilter(filterOption.value)}
                  type="button"
                >
                  {filterOption.label} ({filterListingInquiries(ownerInquiries, filterOption.value).length})
                </button>
              ))}
            </div>

            <div className="listing-filter-chip-row listing-filter-chip-row-muted host-listing-filter-desktop">
              {listingInquirySortOptions.map((sortOption) => (
                <button
                  aria-pressed={ownerInquirySort === sortOption.value}
                  className={`listing-filter-chip${ownerInquirySort === sortOption.value ? ' active' : ''}`}
                  key={sortOption.value}
                  onClick={() => setOwnerInquirySort(sortOption.value)}
                  type="button"
                >
                  {sortOption.label}
                </button>
              ))}
            </div>

            {filteredOwnerInquiries.length === 0 && !isLoading ? (
              <Card className="feed-card">
                <strong>No {formatListingInquiryFilterLabel(ownerInquiryFilter).toLowerCase()} inquiries yet</strong>
                <p className="feed-copy">
                  New inquiries will appear here as soon as seekers express interest in your published listings.
                </p>
              </Card>
            ) : (
              <div className="host-inquiry-grid">
                {filteredOwnerInquiries.map((inquiry) => (
                  <OwnerInquiryCard
                    busyAction={busyInquiryAction}
                    inquiry={inquiry}
                    isScheduleOpen={schedulingInquiryId === inquiry.id}
                    key={inquiry.id}
                    onClose={() => void handleInquiryStatusUpdate(inquiry, 'CLOSED')}
                    onDecline={() => void handleInquiryStatusUpdate(inquiry, 'DECLINED')}
                    onOpenInquiry={() => openOwnerInquiryDetails(inquiry)}
                    onMarkContacted={() => void handleInquiryStatusUpdate(inquiry, 'CONTACTED')}
                    onOpenListing={(listing) => openListingDetails(listing)}
                    onOpenSchedule={() => startSchedulingInquiry(inquiry)}
                    onSaveSchedule={() =>
                      void handleInquiryStatusUpdate(inquiry, 'SCHEDULED', {
                        scheduledVisitAt: scheduleVisitAtInput,
                        scheduledVisitNote: scheduleVisitNoteInput,
                      })
                    }
                    onScheduleVisitAtChange={setScheduleVisitAtInput}
                    onScheduleVisitNoteChange={setScheduleVisitNoteInput}
                    onStopScheduling={cancelSchedulingInquiry}
                    scheduleVisitAt={scheduleVisitAtInput}
                    scheduleVisitNote={scheduleVisitNoteInput}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  function renderHostComposerPanel() {
    const isFindRoomComposer = composerSourceIntent === housingIntentValues.findRoom

    return (
      <div
        className={`hub-panel host-composer-panel${isFindRoomComposer ? '' : ' host-composer-panel-replacement'}`}
      >
        <div className="hub-panel-head">
          <div>
            <span className={`muted${isFindRoomComposer ? '' : ' host-composer-listing-flow-label'}`}>
              {isFindRoomComposer ? 'Room post flow' : 'Listing flow'}
            </span>
            <h2>
              {editingListingId
                ? isFindRoomComposer
                  ? 'Edit room post'
                  : 'Edit replacement listing'
                : isFindRoomComposer
                  ? 'Create room post'
                  : 'Create replacement listing'}
            </h2>
            {isFindRoomComposer ? (
              <p className="panel-subtitle">
                Keep the room-post flow focused in its own page so you can publish without mixing it into the discovery feed.
              </p>
            ) : null}
          </div>
          {editingListingId ? (
            <Button onClick={() => startCreateListing(composerSourceIntent)} variant="ghost">
              Start fresh
            </Button>
          ) : null}
        </div>

        <div className="host-stepper">
          {hostSteps.map((step, index) => (
            <button
              aria-current={hostStep === index ? 'step' : undefined}
              className={`host-step-pill${hostStep === index ? ' active' : ''}`}
              key={step}
              onClick={() => setHostStep(index)}
              type="button"
            >
              <span>{index + 1}</span>
              {step}
            </button>
          ))}
        </div>

        <div className="host-step-section">
          {hostStep === 0 && (
            <>
              <div className="post-form-section-head">
                <strong>Step 1: Basic info</strong>
                <span className="muted">Start with the listing title, city, exact property location, and move-in date.</span>
              </div>

              <div className="field">
                <label htmlFor="listing-title">Listing title</label>
                <input
                  id="listing-title"
                  onChange={(event) => setReplaceTenantForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Private room in a furnished 2 BHK near ITPL"
                  value={replaceTenantForm.title}
                />
              </div>

              <div className="form-grid two-column">
                <div className="field">
                  <label htmlFor="listing-city-select">City</label>
                  <select
                    id="listing-city-select"
                    onChange={(event) => {
                      setReplaceTenantCityOption(event.target.value)
                      if (event.target.value !== otherCityOptionValue) {
                        setReplaceTenantCustomCity('')
                      }
                    }}
                    value={replaceTenantCityOption}
                  >
                    <option value="">Select city</option>
                    {majorCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                    <option value={otherCityOptionValue}>Other city</option>
                  </select>
                </div>

                {replaceTenantCityOption === otherCityOptionValue ? (
                  <div className="field">
                    <label htmlFor="listing-city-custom">Enter city</label>
                    <input
                      id="listing-city-custom"
                      onChange={(event) => setReplaceTenantCustomCity(event.target.value)}
                      placeholder="Enter the city"
                      value={replaceTenantCustomCity}
                    />
                  </div>
                ) : (
                  <div className="field">
                    <label htmlFor="listing-locality">Locality</label>
                    <input
                      id="listing-locality"
                      onChange={(event) => setReplaceTenantForm((current) => ({ ...current, locality: event.target.value }))}
                      placeholder="Brookefield, Whitefield, Koramangala..."
                      value={replaceTenantForm.locality}
                    />
                  </div>
                )}
              </div>

              {replaceTenantCityOption === otherCityOptionValue && (
                <div className="field">
                  <label htmlFor="listing-locality-alt">Locality</label>
                  <input
                    id="listing-locality-alt"
                    onChange={(event) => setReplaceTenantForm((current) => ({ ...current, locality: event.target.value }))}
                    placeholder="Apartment, street, or neighborhood"
                    value={replaceTenantForm.locality}
                  />
                </div>
              )}

              <PlaceAutocompleteField
                helperText="Pick the exact apartment or building on the map so seekers can understand the location instantly."
                inputValue={replaceTenantForm.locationName}
                label="Property location"
                onClear={() =>
                  setReplaceTenantForm((current) => ({
                    ...current,
                    locationName: '',
                    latitude: null,
                    longitude: null,
                  }))
                }
                onInputValueChange={(value) =>
                  setReplaceTenantForm((current) => ({
                    ...current,
                    locationName: value,
                  }))
                }
                onSelect={(location) =>
                  setReplaceTenantForm((current) => ({
                    ...current,
                    locationName: location.locationName,
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }))
                }
                value={selectedListingLocation}
              />

              <div className="field">
                <label htmlFor="listing-move-in-date">Move-in date</label>
                <DatePickerInput
                  id="listing-move-in-date"
                  min={getTodayDateInputValue()}
                  onChange={(v) => setReplaceTenantForm((current) => ({ ...current, moveInDate: v }))}
                  value={replaceTenantForm.moveInDate}
                />
              </div>
            </>
          )}

          {hostStep === 1 && (
            <>
              <div className="post-form-section-head">
                <strong>Step 2: Pricing</strong>
                <span className="muted">Rent is required for publishing. Deposit and maintenance stay optional.</span>
              </div>

              <div className="form-grid three-column">
                <div className="field">
                  <label htmlFor="listing-rent">Rent amount</label>
                  <input
                    id="listing-rent"
                    inputMode="numeric"
                    onChange={(event) => setReplaceTenantForm((current) => ({ ...current, rentAmount: event.target.value }))}
                    placeholder="20000"
                    value={replaceTenantForm.rentAmount}
                  />
                </div>

                <div className="field">
                  <label htmlFor="listing-deposit">Deposit amount</label>
                  <input
                    id="listing-deposit"
                    inputMode="numeric"
                    onChange={(event) => setReplaceTenantForm((current) => ({ ...current, depositAmount: event.target.value }))}
                    placeholder="75000"
                    value={replaceTenantForm.depositAmount}
                  />
                </div>

                <div className="field">
                  <label htmlFor="listing-maintenance">Maintenance amount</label>
                  <input
                    id="listing-maintenance"
                    inputMode="numeric"
                    onChange={(event) => setReplaceTenantForm((current) => ({ ...current, maintenanceAmount: event.target.value }))}
                    placeholder="2000"
                    value={replaceTenantForm.maintenanceAmount}
                  />
                </div>
              </div>
            </>
          )}

          {hostStep === 2 && (
            <>
              <div className="post-form-section-head">
                <strong>Step 3: Amenities</strong>
                <span className="muted">Choose the key amenities seekers use to compare rooms quickly.</span>
              </div>

              <div className="amenity-chip-grid">
                {standardAmenities.map((amenity) => (
                  <button
                    aria-pressed={replaceTenantForm.amenities.includes(amenity)}
                    className={`listing-filter-chip${replaceTenantForm.amenities.includes(amenity) ? ' active' : ''}`}
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    type="button"
                  >
                    {amenity}
                  </button>
                ))}
              </div>

              <div className="amenity-input-row">
                <input
                  onChange={(event) => setAmenityInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCustomAmenity()
                    }
                  }}
                  placeholder="Add a custom amenity"
                  value={amenityInput}
                />
                <Button onClick={addCustomAmenity} variant="secondary">
                  Add amenity
                </Button>
              </div>

              <div className="post-form-section-head">
                <strong>Nearby offices or tech parks</strong>
                <span className="muted">Add the workplaces this room is convenient for. You can add up to 5.</span>
              </div>

              <div className="form-grid two-column">
                <div className="field">
                  <label htmlFor="listing-nearby-suggestion">Popular picks</label>
                  <select
                    id="listing-nearby-suggestion"
                    onChange={(event) => setListingNearbyPlaceInput(event.target.value)}
                    value={getNearbyPlaceSuggestions(listingNearbyPlaceType).includes(listingNearbyPlaceInput) ? listingNearbyPlaceInput : ''}
                  >
                    <option value="">Choose a popular place</option>
                    {getNearbyPlaceSuggestions(listingNearbyPlaceType).map((place) => (
                      <option key={`listing-nearby-suggestion-${listingNearbyPlaceType}-${place}`} value={place}>
                        {place}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="listing-nearby-place">Office or tech park</label>
                  <input
                    id="listing-nearby-place"
                    onChange={(event) => setListingNearbyPlaceInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addListingNearbyPlace()
                      }
                    }}
                    placeholder="Ecospace, ITPL, Manyata..."
                    value={listingNearbyPlaceInput}
                  />
                </div>
                <div className="field">
                  <label htmlFor="listing-nearby-type">Type</label>
                  <select
                    id="listing-nearby-type"
                    onChange={(event) => setListingNearbyPlaceType(event.target.value as NearbyPlaceType)}
                    value={listingNearbyPlaceType}
                  >
                    <option value="tech_park">Tech park</option>
                    <option value="company">Office / company</option>
                  </select>
                </div>
              </div>

              <div className="amenity-input-row">
                <Button onClick={addListingNearbyPlace} variant="secondary">
                  Add nearby place
                </Button>
              </div>

              {replaceTenantForm.nearbyPlaces.length > 0 ? (
                <div className="nearby-place-chip-row">
                  {replaceTenantForm.nearbyPlaces.map((place) => (
                    <button
                      className="listing-filter-chip active"
                      key={`listing-nearby-${place.type}-${place.name}`}
                      onClick={() => removeListingNearbyPlace(place)}
                      type="button"
                    >
                      {place.name} · {place.type === 'tech_park' ? 'Tech park' : 'Office'}
                      <X size={14} />
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          )}

          {hostStep === 3 && (
            <>
              <div className="post-form-section-head">
                <strong>Step 4: Room details</strong>
                <span className="muted">Keep structured room information outside the description so seekers can scan it quickly.</span>
              </div>

              <div className="form-grid three-column">
                <div className="field">
                  <label htmlFor="listing-property-type">Room type</label>
                  <select
                    id="listing-property-type"
                    onChange={(event) => setReplaceTenantForm((current) => ({ ...current, propertyType: event.target.value }))}
                    value={replaceTenantForm.propertyType}
                  >
                    {propertyTypes.map((type) => (
                      <option key={type} value={type}>
                        {formatEnum(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="listing-occupancy-type">Occupancy</label>
                  <select
                    id="listing-occupancy-type"
                    onChange={(event) => setReplaceTenantForm((current) => ({ ...current, occupancyType: event.target.value }))}
                    value={replaceTenantForm.occupancyType}
                  >
                    {occupancyTypes.map((type) => (
                      <option key={type} value={type}>
                        {formatEnum(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="listing-contact-mode">Contact method</label>
                  <select
                    id="listing-contact-mode"
                    onChange={(event) => setReplaceTenantForm((current) => ({ ...current, contactMode: event.target.value }))}
                    value={replaceTenantForm.contactMode}
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="CALL">Phone call</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="listing-contact-phone">Contact number</label>
                <input
                  id="listing-contact-phone"
                  inputMode="tel"
                  onChange={(event) => setReplaceTenantForm((current) => ({ ...current, contactPhone: event.target.value }))}
                  placeholder="+91 98765 43210"
                  value={replaceTenantForm.contactPhone}
                />
              </div>
            </>
          )}

          {hostStep === 4 && (
            <>
              <div className="post-form-section-head">
                <strong>Step 5: Images</strong>
                <span className="muted">Upload multiple apartment images so seekers can review the space before contacting you.</span>
              </div>

              {!composerListingId ? (
                <p className="muted" style={{ marginBottom: '0.75rem' }}>
                  Pick photos anytime — they stay on this device until you <strong>save a draft</strong> or{' '}
                  <strong>publish</strong>, then we upload them to your listing folder.
                </p>
              ) : null}

              <label
                className={`listing-upload-dropzone${isDragActive ? ' active' : ''}${isUploadingImages ? ' uploading' : ''}`}
                htmlFor="listing-images"
                onDragEnter={() => setIsDragActive(true)}
                onDragLeave={() => setIsDragActive(false)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleListingImageDrop}
              >
                <input
                  accept="image/*"
                  id="listing-images"
                  multiple
                  onChange={(event) => void handleListingImageSelection(event)}
                  type="file"
                />
                <Upload size={22} />
                <strong>Upload apartment photos</strong>
                <span className="muted">Minimum 2 photos for a published listing, maximum 8.</span>
              </label>

              {uploadSummary ? <p className="helper-copy">{uploadSummary}</p> : null}
              {isCleaningUpUploads ? <p className="helper-copy">Cleaning up removed uploads...</p> : null}

              <div className="listing-image-grid">
                {listingImages.map((image, index) => (
                  <div className="listing-image-card" key={image.id}>
                    <div className="listing-image-preview">
                      <img alt={image.fileName} src={image.previewUrl} />
                    </div>
                    <div className="listing-image-copy">
                      <strong>{listingImageSuggestions[index] ?? `Image ${index + 1}`}</strong>
                      <span className="muted">
                        {image.status === 'pending'
                          ? 'Will upload when you save draft or publish'
                          : image.status === 'uploading'
                            ? 'Uploading...'
                            : image.status === 'error'
                              ? image.error ?? 'Upload failed'
                              : index === 0
                                ? 'Cover image'
                                : 'Apartment photo'}
                      </span>
                    </div>
                    <div className="listing-image-actions">
                      <Button
                        disabled={index === 0}
                        onClick={() => moveListingImage(index, -1)}
                        variant="ghost"
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <Button
                        disabled={index === listingImages.length - 1}
                        onClick={() => moveListingImage(index, 1)}
                        variant="ghost"
                      >
                        <ChevronRight size={16} />
                      </Button>
                      <Button onClick={() => void removeListingImage(image.id)} variant="ghost">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {hostStep === 5 && (
            <>
              <div className="post-form-section-head">
                <strong>Step 6: Description</strong>
                <span className="muted">Use this only for the extra context that does not already fit into the structured fields.</span>
              </div>

              <div className="field">
                <label htmlFor="listing-description">Description</label>
                <textarea
                  id="listing-description"
                  onChange={(event) => setReplaceTenantForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Share the apartment vibe, house rules, or anything else seekers should know."
                  rows={6}
                  value={replaceTenantForm.description}
                />
              </div>

              <div className="field">
                <label htmlFor="listing-misc-charges">Other pricing notes</label>
                <input
                  id="listing-misc-charges"
                  onChange={(event) => setReplaceTenantForm((current) => ({ ...current, miscCharges: event.target.value }))}
                  placeholder="Electricity extra, housekeeping split separately..."
                  value={replaceTenantForm.miscCharges}
                />
              </div>
            </>
          )}

          {hostStep === 6 && (
            <>
              <div className="post-form-section-head">
                <strong>Step 7: Review and publish</strong>
                <span className="muted">Review the essentials, then save as draft or publish the listing live.</span>
              </div>

              <div className="listing-review-grid">
                <div className="listing-details-fact">
                  <span className="muted">Title</span>
                  <strong>{replaceTenantForm.title || 'Add a listing title'}</strong>
                </div>
                <div className="listing-details-fact">
                  <span className="muted">Location</span>
                  <strong>
                    {resolveCityValue(replaceTenantCityOption, replaceTenantCustomCity) || 'City pending'}
                    {replaceTenantForm.locality ? `, ${replaceTenantForm.locality}` : ''}
                  </strong>
                </div>
                <div className="listing-details-fact">
                  <span className="muted">Rent</span>
                  <strong>{replaceTenantForm.rentAmount ? formatMoney(Number(replaceTenantForm.rentAmount)) : 'Pending'}</strong>
                </div>
                <div className="listing-details-fact">
                  <span className="muted">Images</span>
                  <strong>
                    {
                      listingImages.filter((image) => image.status === 'uploaded' || image.status === 'pending')
                        .length
                    }{' '}
                    photos
                  </strong>
                </div>
                <div className="listing-details-fact">
                  <span className="muted">Nearby workplaces</span>
                  <strong>
                    {replaceTenantForm.nearbyPlaces.length > 0
                      ? `${replaceTenantForm.nearbyPlaces.length} added`
                      : 'None added yet'}
                  </strong>
                </div>
              </div>

              {selectedListingLocation ? <LocationSummaryCard compact location={selectedListingLocation} /> : null}
            </>
          )}
        </div>

        <div className="host-step-actions">
          <Button
            disabled={hostStep === 0}
            onClick={() => setHostStep((current) => Math.max(0, current - 1))}
            variant="ghost"
          >
            Previous
          </Button>

          <div className="host-step-actions-right">
            <Button
              disabled={isSavingListing}
              onClick={() => void handleSaveListing('DRAFT')}
              variant="ghost"
            >
              {isSavingListing ? 'Saving...' : 'Save draft'}
            </Button>

            {hostStep < hostSteps.length - 1 ? (
              <Button onClick={() => setHostStep((current) => Math.min(hostSteps.length - 1, current + 1))}>
                Next step
              </Button>
            ) : (
              <Button
                disabled={isSavingListing}
                icon={isSavingListing ? <LoaderCircle className="spin" size={16} /> : <ArrowRight size={16} />}
                onClick={() => void handleSaveListing('PUBLISHED')}
              >
                {editingListingId ? 'Update and publish' : 'Publish listing'}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  function openRequesterInquiryListing(inquiry: ListingInquiry) {
    navigate(`/find-tenant/listings/${inquiry.listing.id}`, {
      state: {
        listing: inquiry.listing,
        backLabel: 'Back to sent inquiries',
        backTo: '/find-tenant/inquiries',
        sourceIntent: housingIntentValues.findRoom,
      } as ListingDetailsRouteState,
    })
  }

  function renderHousingNeedsPanel() {
    return (
      <div className="hub-panel host-dashboard-panel">
        <div className="hub-panel-head">
          <div>
            <span className="muted">Your room need</span>
            <h2>Post what you are looking for</h2>
            <p className="panel-subtitle">
              Keep this short and structured. Cirvo uses these preferences to sort the feed into stronger matches first.
            </p>
          </div>
          <Badge tone="green">{activeRoomNeedCount} active</Badge>
        </div>

        {!user ? (
          <Card className="feed-card">
            <strong>Sign in to post your room need</strong>
            <p className="feed-copy">
              Once you are signed in, you can post your preferences and Cirvo will start matching the feed around them.
            </p>
            <Button to="/profile" variant="secondary">
              Open profile
            </Button>
          </Card>
        ) : (
          <>
            <Card className="feed-card">
              <div className="listing-filter-grid">
                <div className="field">
                  <span>City</span>
                  <select
                    onChange={(event) => {
                      setHousingNeedCityOption(event.target.value)
                      if (event.target.value !== otherCityOptionValue) {
                        setHousingNeedCustomCity('')
                      }
                    }}
                    value={housingNeedCityOption}
                  >
                    <option value="">Select tier 1 city</option>
                    {majorCities.map((city) => (
                      <option key={`housing-need-city-${city}`} value={city}>
                        {city}
                      </option>
                    ))}
                    <option value={otherCityOptionValue}>Other city</option>
                  </select>
                </div>
                {housingNeedCityOption === otherCityOptionValue ? (
                  <label className="field">
                    <span>Enter city</span>
                    <input
                      onChange={(event) => setHousingNeedCustomCity(event.target.value)}
                      placeholder="Enter the city"
                      value={housingNeedCustomCity}
                    />
                  </label>
                ) : null}
                <label className="field">
                  <span>Locality</span>
                  <input
                    onChange={(event) =>
                      setHousingNeedForm((current) => ({ ...current, locality: event.target.value }))
                    }
                    placeholder="Whitefield, HSR Layout, Koramangala..."
                    value={housingNeedForm.locality}
                  />
                </label>
                <label className="field">
                  <span>Preferred monthly rent</span>
                  <input
                    inputMode="numeric"
                    onChange={(event) =>
                      setHousingNeedForm((current) => ({ ...current, maxRentAmount: event.target.value }))
                    }
                    placeholder="20000"
                    value={housingNeedForm.maxRentAmount}
                  />
                </label>
                <label className="field">
                  <span>Move-in date</span>
                  <DatePickerInput
                    onChange={(v) => setHousingNeedForm((current) => ({ ...current, moveInDate: v }))}
                    value={housingNeedForm.moveInDate}
                  />
                </label>
              </div>

              <div className="listing-filter-grid">
                <label className="field">
                  <span>Preferred deposit</span>
                  <input
                    inputMode="numeric"
                    onChange={(event) =>
                      setHousingNeedForm((current) => ({ ...current, maxDepositAmount: event.target.value }))
                    }
                    placeholder="80000"
                    value={housingNeedForm.maxDepositAmount}
                  />
                </label>
                <label className="field">
                  <span>Preferred maintenance</span>
                  <input
                    inputMode="numeric"
                    onChange={(event) =>
                      setHousingNeedForm((current) => ({ ...current, maxMaintenanceAmount: event.target.value }))
                    }
                    placeholder="2500"
                    value={housingNeedForm.maxMaintenanceAmount}
                  />
                </label>
              </div>

              <div className="listing-filter-grid">
                <label className="field">
                  <span>Property type</span>
                  <select
                    onChange={(event) =>
                      setHousingNeedForm((current) => ({
                        ...current,
                        preferredPropertyType: event.target.value,
                      }))
                    }
                    value={housingNeedForm.preferredPropertyType}
                  >
                    {propertyTypes.map((type) => (
                      <option key={type} value={type}>
                        {formatEnum(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Occupancy</span>
                  <select
                    onChange={(event) =>
                      setHousingNeedForm((current) => ({
                        ...current,
                        preferredOccupancy: event.target.value,
                      }))
                    }
                    value={housingNeedForm.preferredOccupancy}
                  >
                    {occupancyTypes.map((type) => (
                      <option key={type} value={type}>
                        {formatEnum(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Urgency</span>
                  <select
                    onChange={(event) =>
                      setHousingNeedForm((current) => ({ ...current, urgencyLevel: event.target.value }))
                    }
                    value={housingNeedForm.urgencyLevel}
                  >
                    <option value="FLEXIBLE">Flexible</option>
                    <option value="THIS_WEEK">This week</option>
                    <option value="IMMEDIATE">Immediate</option>
                  </select>
                </label>
                <label className="field">
                  <span>Preferred contact</span>
                  <select
                    onChange={(event) =>
                      setHousingNeedForm((current) => ({
                        ...current,
                        preferredContactMode: event.target.value,
                      }))
                    }
                    value={housingNeedForm.preferredContactMode}
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="CALL">Call</option>
                    <option value="CHAT">Chat</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Preferred amenities</span>
                <span className="muted">Select the must-have basics so Cirvo can surface tighter matches.</span>
              </label>

              <div className="amenity-chip-grid">
                {standardAmenities.map((amenity) => (
                  <button
                    aria-pressed={housingNeedForm.preferredAmenities.includes(amenity)}
                    className={`listing-filter-chip${housingNeedForm.preferredAmenities.includes(amenity) ? ' active' : ''}`}
                    key={`housing-need-amenity-${amenity}`}
                    onClick={() => toggleHousingNeedAmenity(amenity)}
                    type="button"
                  >
                    {amenity}
                  </button>
                ))}
              </div>

              <div className="amenity-input-row">
                <input
                  onChange={(event) => setHousingNeedAmenityInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCustomHousingNeedAmenity()
                    }
                  }}
                  placeholder="Add a custom amenity"
                  value={housingNeedAmenityInput}
                />
                <Button onClick={addCustomHousingNeedAmenity} variant="secondary">
                  Add amenity
                </Button>
              </div>

              <div className="post-form-section-head">
                <strong>Nearby offices or tech parks</strong>
                <span className="muted">Add the work hubs you want to stay close to. You can add up to 5.</span>
              </div>

              <div className="form-grid two-column">
                <label className="field">
                  <span>Popular picks</span>
                  <select
                    onChange={(event) => setHousingNeedNearbyPlaceInput(event.target.value)}
                    value={getNearbyPlaceSuggestions(housingNeedNearbyPlaceType).includes(housingNeedNearbyPlaceInput) ? housingNeedNearbyPlaceInput : ''}
                  >
                    <option value="">Choose a popular place</option>
                    {getNearbyPlaceSuggestions(housingNeedNearbyPlaceType).map((place) => (
                      <option key={`housing-need-nearby-suggestion-${housingNeedNearbyPlaceType}-${place}`} value={place}>
                        {place}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Office or tech park</span>
                  <input
                    onChange={(event) => setHousingNeedNearbyPlaceInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addHousingNeedNearbyPlace()
                      }
                    }}
                    placeholder="Ecospace, ITPL, RMZ Ecoworld..."
                    value={housingNeedNearbyPlaceInput}
                  />
                </label>
                <label className="field">
                  <span>Type</span>
                  <select
                    onChange={(event) => setHousingNeedNearbyPlaceType(event.target.value as NearbyPlaceType)}
                    value={housingNeedNearbyPlaceType}
                  >
                    <option value="tech_park">Tech park</option>
                    <option value="company">Office / company</option>
                  </select>
                </label>
              </div>

              <div className="amenity-input-row">
                <Button onClick={addHousingNeedNearbyPlace} variant="secondary">
                  Add workplace preference
                </Button>
              </div>

              {housingNeedForm.nearbyPlaces.length > 0 ? (
                <div className="nearby-place-chip-row">
                  {housingNeedForm.nearbyPlaces.map((place) => (
                    <button
                      className="listing-filter-chip active"
                      key={`housing-need-nearby-${place.type}-${place.name}`}
                      onClick={() => removeHousingNeedNearbyPlace(place)}
                      type="button"
                    >
                      {place.name} · {place.type === 'tech_park' ? 'Tech park' : 'Office'}
                      <X size={14} />
                    </button>
                  ))}
                </div>
              ) : null}

              <label className="field">
                <span>Description</span>
                <textarea
                  onChange={(event) =>
                    setHousingNeedForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Share your move-in context, flatmate preferences, budget flexibility, and any deal-breakers."
                  rows={4}
                  value={housingNeedForm.notes}
                />
              </label>

              <div className="feed-card-actions">
                <Button
                  disabled={isSavingHousingNeed}
                  onClick={() => void handleSaveHousingNeed()}
                >
                  {isSavingHousingNeed ? 'Posting...' : 'Post your need'}
                </Button>
                <Button
                  disabled={isSavingHousingNeed}
                  onClick={resetHousingNeedForm}
                  variant="ghost"
                >
                  Clear form
                </Button>
              </div>
            </Card>

          </>
        )}
      </div>
    )
  }

  function renderRequesterInquiriesPanel() {
    return (
      <div className="hub-panel host-dashboard-panel requester-inquiries-hub-panel">
        <div className="hub-panel-head">
          <div>
            <span className="muted">Your inquiries</span>
            <h2>Sent inquiries</h2>
            <p className="panel-subtitle requester-inquiries-panel-subtitle-desktop-only">
              Track the listings you expressed interest in, check their status, and contact the owner again when needed.
            </p>
          </div>
          <Badge tone="green">{isLoading ? 'Loading' : `${activeRequesterInquiriesCount} active`}</Badge>
        </div>

        {!user ? (
          <Card className="feed-card">
            <strong>Sign in to view your inquiries</strong>
            <p className="feed-copy">
              Any listing you mark as interested will appear here with its latest status and owner contact access.
            </p>
            <Button to="/profile" variant="secondary">
              Open profile
            </Button>
          </Card>
        ) : (
          <>
            <div className="host-mobile-filter-trigger">
              <button
                aria-expanded={isRequesterInquiryFilterMenuOpenOnMobile}
                className={`host-mobile-filter-button host-mobile-filter-button-${getInquiryFilterTone(requesterInquiryFilter)}`}
                onClick={() => setIsRequesterInquiryFilterMenuOpenOnMobile((current) => !current)}
                type="button"
              >
                Filters · {formatListingInquiryFilterLabel(requesterInquiryFilter)}
              </button>
              {isRequesterInquiryFilterMenuOpenOnMobile ? (
                <div className="host-mobile-filter-menu">
                  <div className="mobile-filter-dialog-head">
                    <strong>Sent inquiry filters</strong>
                    <button onClick={() => setIsRequesterInquiryFilterMenuOpenOnMobile(false)} type="button">Done</button>
                  </div>
                  <div className="host-mobile-filter-sheet">
                    {listingInquiryFilters.map((filterOption) => (
                      <button
                        aria-pressed={requesterInquiryFilter === filterOption.value}
                        className={`host-mobile-filter-option host-mobile-filter-option-${getInquiryFilterTone(filterOption.value)}${requesterInquiryFilter === filterOption.value ? ' active' : ''}`}
                        key={filterOption.value}
                        onClick={() => {
                          setRequesterInquiryFilter(filterOption.value)
                          setIsRequesterInquiryFilterMenuOpenOnMobile(false)
                        }}
                        type="button"
                      >
                        <span>{filterOption.label}</span>
                        <strong>{filterListingInquiries(requesterInquiries, filterOption.value).length}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="listing-filter-chip-row host-listing-filter-desktop">
              {listingInquiryFilters.map((filterOption) => (
                <button
                  aria-pressed={requesterInquiryFilter === filterOption.value}
                  className={`listing-filter-chip${requesterInquiryFilter === filterOption.value ? ' active' : ''}`}
                  key={filterOption.value}
                  onClick={() => setRequesterInquiryFilter(filterOption.value)}
                  type="button"
                >
                  {filterOption.label} ({filterListingInquiries(requesterInquiries, filterOption.value).length})
                </button>
              ))}
            </div>

            {requesterInquiries.length === 0 && !isLoading ? (
              <Card className="feed-card">
                <strong>No inquiries sent yet</strong>
                <p className="feed-copy">
                  Browse live room listings, click `Interested`, and your sent inquiries will start showing up here.
                </p>
              </Card>
            ) : filteredRequesterInquiries.length === 0 && !isLoading ? (
              <Card className="feed-card">
                <strong>No {formatListingInquiryFilterLabel(requesterInquiryFilter).toLowerCase()} inquiries right now</strong>
                <p className="feed-copy">
                  Switch the status filter to review declined, closed, or active inquiries whenever you need.
                </p>
              </Card>
            ) : (
              <div className="host-inquiry-grid">
                {filteredRequesterInquiries.map((inquiry) => (
                  <Card className="listing-inquiry-card requester-inquiry-card" key={inquiry.id}>
                    <div className="inquiry-card-top">
                      <div>
                        <strong>{inquiry.listing.title}</strong>
                        <p>
                          Owner: {inquiry.listing.owner.fullName}
                          {inquiry.listing.owner.companyName ? ` · ${inquiry.listing.owner.companyName}` : ''}
                        </p>
                      </div>
                      <div className="listing-card-badges">
                        <Badge tone={getListingInquiryStatusTone(inquiry.status)}>
                          {formatListingInquiryStatus(inquiry.status)}
                        </Badge>
                        {inquiry.visitStatus !== 'NONE' ? (
                          <Badge tone={getListingVisitTone(inquiry.visitStatus)}>
                            {formatListingVisitStatus(inquiry.visitStatus)}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="inquiry-meta-row">
                      <span>Sent {formatDateTime(inquiry.createdAt)}</span>
                      <span>{formatListingLocation(inquiry.listing)}</span>
                    </div>

                    <div className="inquiry-fact-grid">
                      <div className="listing-details-fact">
                        <span className="muted">Rent</span>
                        <strong>{formatPriceLine(inquiry.listing)}</strong>
                      </div>
                      {inquiry.preferredMoveInDate ? (
                        <div className="listing-details-fact">
                          <span className="muted">Preferred move-in</span>
                          <strong>{formatShortDate(inquiry.preferredMoveInDate)}</strong>
                        </div>
                      ) : null}
                      {inquiry.preferredVisitAt ? (
                        <div className="listing-details-fact">
                          <span className="muted">Preferred visit</span>
                          <strong>{formatDateTime(inquiry.preferredVisitAt)}</strong>
                        </div>
                      ) : null}
                      {inquiry.scheduledVisitAt ? (
                        <div className="listing-details-fact">
                          <span className="muted">Scheduled visit</span>
                          <strong>{formatDateTime(inquiry.scheduledVisitAt)}</strong>
                        </div>
                      ) : null}
                    </div>

                    {inquiry.message ? (
                      <div className="listing-details-section">
                        <strong>Your note</strong>
                        <p className="feed-copy">{inquiry.message}</p>
                      </div>
                    ) : null}

                    <div className="inquiry-actions">
                      <Button onClick={() => openRequesterInquiryDetails(inquiry)}>
                        View inquiry
                      </Button>
                      <Button onClick={() => openRequesterInquiryListing(inquiry)} variant="secondary">
                        Open listing
                      </Button>
                      {inquiry.listing.contactPhone ? (
                        <Button
                          className="listing-action-button listing-action-contact"
                          onClick={() =>
                            window.open(
                              inquiry.listing.contactMode === 'CALL'
                                ? buildCallLink(inquiry.listing.contactPhone)
                                : buildWhatsappLink(inquiry.listing.contactPhone),
                              '_blank',
                              'noopener,noreferrer',
                            )
                          }
                          variant="ghost"
                        >
                          {inquiry.listing.contactMode === 'CALL' ? 'Call owner' : 'Contact owner'}
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  function renderFindRoomPage(
    title: string,
    subtitle: string,
    content: ReactNode,
  ) {
    return (
      <>
        <div className="section-head reveal tenant-section-head">
          <div className="eyebrow">Find room</div>
          <h1 className="page-title">{title}</h1>
          {subtitle.trim() ? <p className="page-subtitle">{subtitle}</p> : null}
        </div>

        <div className="find-room-section-chips-desktop-only">
          <FindRoomSectionChips
            activeInquiryCount={activeRequesterInquiriesCount}
            activeNeedCount={activeRoomNeedCount}
            liveListingCount={rankedPublicListings.length}
            postedListingCount={activeHousingNeedsCount}
            user={user}
          />
        </div>

        <div className="tenant-route-stack">{content}</div>
      </>
    )
  }

  function renderTenantReplacementPage(
    title: string,
    subtitle: string,
    content: ReactNode,
    options?: {
      compactHostListingsTitleOnMobile?: boolean
      compactHostComposerTitleOnMobile?: boolean
      compactHostInquiriesTitleOnMobile?: boolean
    },
  ) {
    return (
      <>
        <div
          className={[
            'section-head reveal tenant-section-head',
            options?.compactHostListingsTitleOnMobile ? 'tenant-host-listings-head' : '',
            options?.compactHostComposerTitleOnMobile ? 'tenant-host-composer-head' : '',
            options?.compactHostInquiriesTitleOnMobile ? 'tenant-host-inquiries-head' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="eyebrow">Tenant replacement</div>
          <h1 className="page-title">{title}</h1>
          {subtitle.trim() ? <p className="page-subtitle">{subtitle}</p> : null}
        </div>

        <TenantReplacementSectionChips
          activeInquiryCount={activeOwnerInquiriesCount}
          activeListingsCount={activeHostListingsCount}
          newInquiryCount={newOwnerInquiriesCount}
          user={user}
        />

        <div className="tenant-route-stack">{content}</div>
      </>
    )
  }

  return (
    <div className="page">
      <section className="section">
        <div className="page-inner">
          {feedback && (
            <div className={`feedback-banner feedback-${feedback.tone}`}>
              <span>{feedback.message}</span>
            </div>
          )}

          {!shouldShowHostDashboard && !shouldShowHostComposer && !shouldShowHostInquiries && !shouldShowRequesterInquiries && !shouldShowSeekerNeeds && !shouldShowSeekerPostedListings ? (
            renderFindRoomPage(
              hasActiveRoomNeed
                ? 'Your best room matches are ranked first.'
                : 'Browse live rooms with a dedicated seeker workspace.',
              hasActiveRoomNeed
                ? ''
                : 'Use the chips to move between live listings, your room-need post, your room posts, and the inquiries you have already sent.',
              <div className="hub-panel hub-panel-wide live-feed-panel">
              <div className="hub-panel-head live-feed-head">
                <div>
                  <span className="muted">Intent: Find room</span>
                  <h2>Live room listings</h2>
                  <p className="panel-subtitle">
                    {hasActiveRoomNeed
                      ? 'Personalized scoring is active for your latest room need, so stronger fit and quality signals are ranking higher in the feed.'
                      : user
                        ? 'Explore published listings only. Post your room need to unlock personalized scoring and stronger ranking.'
                        : 'Explore published listings only. Sign in and post your room need to unlock personalized scoring; until then the feed stays ranked by listing quality and freshness.'}
                  </p>
                </div>
                <div className="hub-panel-actions">
                  <Badge tone="green">{isLoading ? 'Loading' : `${rankedPublicListings.length} live`}</Badge>
                  {!user ? (
                    <Button to="/profile" variant="secondary">
                      Sign in to host
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="live-feed-toolbar">
                {/* Search bar row — inline with result count + controls */}
                <div className="listing-search-bar-row">
                  <label className="listing-search-field listing-search-field-grow" htmlFor="find-room-search">
                    <Search size={18} />
                    <input
                      id="find-room-search"
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by locality, city, title, or amenity"
                      value={searchQuery}
                    />
                  </label>
                  <div className="listing-search-controls">
                    <span className="listing-filter-status listing-filter-status-compact">
                      {rankedPublicListings.length}
                    </span>
                    <button
                      className={`listing-filter-chip listing-advanced-toggle${showAdvancedPublicFilters ? ' active' : ''}`}
                      onClick={() => setShowAdvancedPublicFilters((current) => !current)}
                      type="button"
                    >
                      <SlidersHorizontal size={15} />
                      {activeAdvancedPublicFiltersCount > 0 ? `Filters (${activeAdvancedPublicFiltersCount})` : 'Filters'}
                    </button>
                    {hasActivePublicListingFilters ? (
                      <button
                        className="listing-filter-chip listing-clear-chip"
                        onClick={clearPublicListingFilters}
                        type="button"
                      >
                        <X size={14} />
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Flat single-row filter strip — all groups inline, separated by a dot */}
                <div className="listing-filter-bar">
                  <button
                    aria-pressed={publicListingFilters.city === ''}
                    className={`listing-filter-chip${publicListingFilters.city === '' ? ' active' : ''}`}
                    onClick={() => setPublicListingFilters((current) => ({ ...current, city: '' }))}
                    type="button"
                  >
                    All cities
                  </button>
                  {quickPublicCityOptions.map((city) => (
                    <button
                      aria-pressed={publicListingFilters.city === city}
                      className={`listing-filter-chip${publicListingFilters.city === city ? ' active' : ''}`}
                      key={city}
                      onClick={() => setPublicListingFilters((current) => ({ ...current, city }))}
                      type="button"
                    >
                      {city}
                    </button>
                  ))}

                  <span className="listing-filter-divider" aria-hidden="true" />

                  {publicListingBudgetFilters.map((filterOption) => (
                    <button
                      aria-pressed={publicListingFilters.budget === filterOption.value}
                      className={`listing-filter-chip${publicListingFilters.budget === filterOption.value ? ' active' : ''}`}
                      key={filterOption.value}
                      onClick={() =>
                        setPublicListingFilters((current) => ({
                          ...current,
                          budget: filterOption.value,
                        }))
                      }
                      type="button"
                    >
                      {filterOption.label}
                    </button>
                  ))}

                  <span className="listing-filter-divider" aria-hidden="true" />

                  <button
                    aria-pressed={!publicListingFilters.verifiedOnly}
                    className={`listing-filter-chip${!publicListingFilters.verifiedOnly ? ' active' : ''}`}
                    onClick={() =>
                      setPublicListingFilters((current) => ({ ...current, verifiedOnly: false }))
                    }
                    type="button"
                  >
                    All owners
                  </button>
                  <button
                    aria-pressed={publicListingFilters.verifiedOnly}
                    className={`listing-filter-chip${publicListingFilters.verifiedOnly ? ' active' : ''}`}
                    onClick={() =>
                      setPublicListingFilters((current) => ({ ...current, verifiedOnly: true }))
                    }
                    type="button"
                  >
                    Verified only
                  </button>
                </div>

                {showAdvancedPublicFilters ? (
                  <div className="listing-filter-grid public-listing-filter-grid listing-filter-grid-advanced">
                    <div className="listing-filter-grid-head">
                      <div>
                        <strong>Advanced filters</strong>
                        <span className="muted">Refine by property type, occupancy, and a must-have amenity.</span>
                      </div>
                    </div>

                    <div className="listing-filter-group">
                      <span className="muted">Property type</span>
                      <div className="listing-filter-chip-row">
                        <button
                          aria-pressed={publicListingFilters.propertyType === ''}
                          className={`listing-filter-chip${publicListingFilters.propertyType === '' ? ' active' : ''}`}
                          onClick={() =>
                            setPublicListingFilters((current) => ({ ...current, propertyType: '' }))
                          }
                          type="button"
                        >
                          All types
                        </button>
                        {propertyTypes.map((type) => (
                          <button
                            aria-pressed={publicListingFilters.propertyType === type}
                            className={`listing-filter-chip${publicListingFilters.propertyType === type ? ' active' : ''}`}
                            key={type}
                            onClick={() =>
                              setPublicListingFilters((current) => ({ ...current, propertyType: type }))
                            }
                            type="button"
                          >
                            {formatEnum(type)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="listing-filter-group">
                      <span className="muted">Occupancy</span>
                      <div className="listing-filter-chip-row">
                        <button
                          aria-pressed={publicListingFilters.occupancyType === ''}
                          className={`listing-filter-chip${publicListingFilters.occupancyType === '' ? ' active' : ''}`}
                          onClick={() =>
                            setPublicListingFilters((current) => ({ ...current, occupancyType: '' }))
                          }
                          type="button"
                        >
                          Any occupancy
                        </button>
                        {occupancyTypes.map((type) => (
                          <button
                            aria-pressed={publicListingFilters.occupancyType === type}
                            className={`listing-filter-chip${publicListingFilters.occupancyType === type ? ' active' : ''}`}
                            key={type}
                            onClick={() =>
                              setPublicListingFilters((current) => ({ ...current, occupancyType: type }))
                            }
                            type="button"
                          >
                            {formatEnum(type)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="listing-filter-group">
                      <span className="muted">Must-have amenity</span>
                      <div className="listing-filter-chip-row">
                        <button
                          aria-pressed={publicListingFilters.amenity === ''}
                          className={`listing-filter-chip${publicListingFilters.amenity === '' ? ' active' : ''}`}
                          onClick={() => setPublicListingFilters((current) => ({ ...current, amenity: '' }))}
                          type="button"
                        >
                          Any amenity
                        </button>
                        {publicAmenityOptions.map((amenity) => (
                          <button
                            aria-pressed={publicListingFilters.amenity === amenity}
                            className={`listing-filter-chip${publicListingFilters.amenity === amenity ? ' active' : ''}`}
                            key={amenity}
                            onClick={() =>
                              setPublicListingFilters((current) => ({ ...current, amenity }))
                            }
                            type="button"
                          >
                            {amenity}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {hasActivePublicListingFilters ? (
                  <div className="listing-filter-token-row">
                    {activePublicListingFilterTokens.map((token) => (
                      <button
                        className="listing-filter-token"
                        key={`${token.key}-${token.label}`}
                        onClick={() => clearSinglePublicListingFilter(token.key)}
                        type="button"
                      >
                        <span>{token.label}</span>
                        <X size={14} />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="feed-grid listing-feed-grid">
                {rankedPublicListings.map(({ listing, matchSummary }) => (
                  <SearchListingCard
                    existingInquiry={requesterInquiryByListingId[listing.id] ?? null}
                    key={listing.id}
                    listing={listing}
                    matchSummary={matchSummary}
                  />
                ))}

                {!isLoading && rankedPublicListings.length === 0 && (
                  <Card className="feed-card">
                    <strong>
                      {hasActiveRoomNeed
                        ? 'No strong matches for your current room need yet'
                        : 'No live listings match these filters yet'}
                    </strong>
                    <p className="feed-copy">
                      {hasActiveRoomNeed
                        ? 'Try broadening locality or budget, or update your room need to widen the matching window.'
                        : 'Try a broader locality, switch off one or two filters, or clear everything to widen the results.'}
                    </p>
                    {hasActivePublicListingFilters ? (
                      <div className="feed-card-actions">
                        <Button onClick={clearPublicListingFilters} variant="secondary">
                          Clear filters
                        </Button>
                      </div>
                    ) : null}
                  </Card>
                )}
              </div>
            </div>,
            )
          ) : shouldShowSeekerNeeds ? (
            renderFindRoomPage(
              'Post what you need in under a minute.',
              'Keep your room search structured so Cirvo can sort better matches to the top of the feed.',
              renderHousingNeedsPanel(),
            )
          ) : shouldShowSeekerPostedListings ? (
            renderFindRoomPage(
              'Rooms you have applied for.',
              'Every listing you sent an inquiry for is tracked here — check status, contact the owner, or re-open the listing.',
              renderSeekerPostedListingsPanel(),
            )
          ) : shouldShowRequesterInquiries ? (
            renderFindRoomPage(
              'Keep your room search and sent inquiries separate.',
              '',
              renderRequesterInquiriesPanel(),
            )
          ) : shouldShowHostComposer ? (
            composerSourceIntent === housingIntentValues.findRoom
              ? renderFindRoomPage(
                  editingListingId ? 'Edit your room post in a focused flow.' : 'Create a room post in a dedicated workspace.',
                  'Keep room posting separate from discovery so you can finish the form without mixing it into your listing feed.',
                  renderHostComposerPanel(),
                )
              : renderTenantReplacementPage(
                  editingListingId ? 'Edit your replacement listing in a focused flow.' : 'Create a replacement listing in a dedicated workspace.',
                  '',
                  renderHostComposerPanel(),
                  { compactHostComposerTitleOnMobile: true },
                )
          ) : shouldShowHostInquiries ? (
            renderTenantReplacementPage(
              'Manage incoming inquiries in their own queue.',
              '',
              renderHostInquiriesPanel(),
              { compactHostInquiriesTitleOnMobile: true },
            )
          ) : (
            renderTenantReplacementPage(
              'Keep tenant replacement focused with separate workspaces.',
              '',
              renderHostListingsPanel(),
              { compactHostListingsTitleOnMobile: true },
            )
          )}
        </div>
      </section>

      {listingActionConfirmation ? (
        <ListingActionDialog
          action={listingActionConfirmation}
          busyAction={busyListingAction}
          onCancel={() => setListingActionConfirmation(null)}
          onConfirm={() => void confirmListingStatusChange()}
        />
      ) : null}
    </div>
  )
}

function TenantReplacementSectionChips({
  activeInquiryCount,
  activeListingsCount,
  newInquiryCount,
  user,
}: {
  activeInquiryCount: number
  activeListingsCount: number
  newInquiryCount: number
  user: ReturnType<typeof useAppAuth>['user']
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileSelectorOpen, setIsMobileSelectorOpen] = useState(false)
  const sectionLinks = [
    {
      key: 'listings',
      label: 'Listings',
      meta: `${activeListingsCount} active`,
      alert: null,
      to: user ? '/find-tenant/host' : '/profile',
      tone: 'mint',
    },
    {
      key: 'composer',
      label: 'Create listing',
      meta: 'New post',
      alert: null,
      to: user ? '/find-tenant/host/listings/new' : '/profile',
      tone: 'violet',
    },
    {
      key: 'inquiries',
      label: 'Inquiries',
      meta: `${activeInquiryCount} active`,
      alert: newInquiryCount > 0 ? `${newInquiryCount} new` : null,
      to: user ? '/find-tenant/host/inquiries' : '/profile',
      tone: 'amber',
    },
  ] as const

  /** Mobile: listings live on the bottom nav; desktop chips unchanged. */
  const mobileSectionLinks = sectionLinks.filter((link) => link.key !== 'listings')

  const activeMobileSection =
    mobileSectionLinks.find((link) => {
      if (!user) {
        return false
      }
      if (link.key === 'composer') {
        return location.pathname.startsWith('/find-tenant/host/listings')
      }
      return location.pathname.startsWith('/find-tenant/host/inquiries')
    }) ?? mobileSectionLinks[0]

  const isHostListingsDashboard = location.pathname === '/find-tenant/host'
  const isHostComposeRoute = location.pathname.startsWith('/find-tenant/host/listings')
  const isHostInquiriesRoute = location.pathname.startsWith('/find-tenant/host/inquiries')
  /** Mobile: hide chip sheet when bottom nav / desktop chips already encode the section. */
  const showMobileSectionSelector =
    !isHostListingsDashboard && !isHostComposeRoute && !isHostInquiriesRoute

  return (
    <>
      {showMobileSectionSelector ? (
      <div className="tenant-section-mobile-selector">
        <button
          aria-expanded={isMobileSelectorOpen}
          className={`tenant-section-mobile-button tenant-section-mobile-button-${activeMobileSection.tone}`}
          onClick={() => setIsMobileSelectorOpen((current) => !current)}
          type="button"
        >
          {activeMobileSection.label} · {activeMobileSection.meta}
        </button>
        {isMobileSelectorOpen ? (
          <div className="tenant-section-mobile-menu">
            <div className="tenant-section-mobile-menu-head">
              <strong>Switch section</strong>
              <button onClick={() => setIsMobileSelectorOpen(false)} type="button">Done</button>
            </div>
            <div className="host-mobile-filter-sheet">
              {mobileSectionLinks.map((link) => {
                const isActive =
                  Boolean(user) &&
                  (link.key === 'composer'
                    ? location.pathname.startsWith('/find-tenant/host/listings')
                    : location.pathname.startsWith('/find-tenant/host/inquiries'))

                return (
                  <button
                    aria-pressed={isActive}
                    className={`host-mobile-filter-option host-mobile-filter-option-${link.tone}${isActive ? ' active' : ''}`}
                    key={link.label}
                    onClick={() => {
                      navigate(link.to)
                      setIsMobileSelectorOpen(false)
                    }}
                    type="button"
                  >
                    <span>{link.label}</span>
                    <strong>{link.meta}</strong>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
      ) : null}

      <div className="tenant-section-chip-row tenant-section-chip-row-desktop" aria-label="Tenant replacement sections">
        {sectionLinks.map((link) => {
          const isActive =
            user &&
            (link.key === 'listings'
              ? location.pathname === '/find-tenant/host'
              : link.key === 'composer'
                ? location.pathname.startsWith('/find-tenant/host/listings')
                : location.pathname.startsWith('/find-tenant/host/inquiries'))

          return (
            <NavLink
              className={`tenant-section-chip tenant-section-chip-${link.tone}${isActive ? ' active' : ''}`}
              key={link.label}
              to={link.to}
            >
              <div className="tenant-section-chip-copy">
                <strong>{link.label}</strong>
                <span>{link.meta}</span>
              </div>
              {isActive ? (
                <span className="tenant-section-chip-current">Current</span>
              ) : link.alert ? (
                <span className="tenant-section-chip-alert">{link.alert}</span>
              ) : null}
            </NavLink>
          )
        })}
      </div>
    </>
  )
}

function FindRoomSectionChips({
  activeNeedCount,
  activeInquiryCount,
  liveListingCount,
  postedListingCount,
  user,
}: {
  activeNeedCount: number
  activeInquiryCount: number
  liveListingCount: number
  postedListingCount: number
  user: ReturnType<typeof useAppAuth>['user']
}) {
  const location = useLocation()
  const sectionLinks = [
    {
      key: 'listings',
      label: 'Listings',
      meta: `${liveListingCount} live`,
      to: '/find-tenant',
      tone: 'mint',
    },
    {
      key: 'needs',
      label: 'Your room need',
      meta: user ? (activeNeedCount > 0 ? `${activeNeedCount} active post` : 'Create your first post') : 'Sign in to post',
      to: user ? '/find-tenant/needs' : '/profile',
      tone: 'amber',
    },
    {
      key: 'posts',
      label: 'Your room posts',
      meta: user ? (postedListingCount > 0 ? `${postedListingCount} active` : 'Post your needs') : 'Sign in to post',
      to: user ? '/find-tenant/posts' : '/profile',
      tone: 'violet',
    },
    {
      key: 'inquiries',
      label: 'Sent inquiries',
      meta: `${activeInquiryCount} active`,
      to: user ? '/find-tenant/inquiries' : '/profile',
      tone: 'mint',
    },
  ] as const

  return (
    <div className="tenant-section-chip-row" aria-label="Find room sections">
      {sectionLinks.map((link) => {
        const isActive =
          link.key === 'listings'
            ? location.pathname === '/find-tenant'
            : link.key === 'needs'
              ? location.pathname.startsWith('/find-tenant/needs')
              : link.key === 'posts'
                ? location.pathname.startsWith('/find-tenant/posts')
                : location.pathname.startsWith('/find-tenant/inquiries')

        return (
          <NavLink
            className={`tenant-section-chip tenant-section-chip-${link.tone}${isActive ? ' active' : ''}`}
            key={link.label}
            to={link.to}
          >
            <div className="tenant-section-chip-copy">
              <strong>{link.label}</strong>
              <span>{link.meta}</span>
            </div>
            {isActive ? <span className="tenant-section-chip-current">Current</span> : null}
          </NavLink>
        )
      })}
    </div>
  )
}

function makeEmptyPublicListingFilters(): PublicListingFilters {
  return {
    city: '',
    propertyType: '',
    occupancyType: '',
    amenity: '',
    budget: 'ANY',
    verifiedOnly: false,
  }
}

function makeEmptyReplaceTenantForm(): ReplaceTenantForm {
  return {
    title: '',
    city: '',
    locality: '',
    locationName: '',
    latitude: null,
    longitude: null,
    moveInDate: '',
    rentAmount: '',
    depositAmount: '',
    maintenanceAmount: '',
    amenities: [],
    nearbyPlaces: [],
    propertyType: 'APARTMENT',
    occupancyType: 'SHARED',
    contactMode: 'WHATSAPP',
    contactPhone: '',
    description: '',
    miscCharges: '',
  }
}

function makeEmptyHousingNeedForm(): HousingNeedForm {
  return {
    city: '',
    locality: '',
    maxRentAmount: '',
    maxDepositAmount: '',
    maxMaintenanceAmount: '',
    preferredPropertyType: 'APARTMENT',
    preferredOccupancy: 'SHARED',
    preferredAmenities: [],
    nearbyPlaces: [],
    moveInDate: '',
    urgencyLevel: 'FLEXIBLE',
    preferredContactMode: 'WHATSAPP',
    notes: '',
  }
}

function makeEmptyInquiryForm(): InquiryForm {
  return {
    message: '',
    budgetAmount: '',
    preferredMoveInDate: '',
    preferredOccupancy: '',
    preferredVisitAt: '',
    preferredVisitNote: '',
  }
}

function formatListingMatchLabel(label: ListingMatchLabel) {
  switch (label) {
    case 'BEST_MATCH':
      return 'Best match'
    case 'GOOD_MATCH':
      return 'Good match'
    case 'POSSIBLE':
      return 'Possible'
  }
}

function getListingMatchTone(label: ListingMatchLabel) {
  switch (label) {
    case 'BEST_MATCH':
      return 'green'
    case 'GOOD_MATCH':
      return 'purple'
    case 'POSSIBLE':
      return 'gray'
  }
}

function getVisibleAmenities(amenities: string[]) {
  return amenities.slice(0, 3)
}

function renderListingCoverImage(
  listing: Listing,
  options?: {
    className?: string
    emptyLabel?: string
  },
) {
  const coverImage = listing.images.find((image) => image.isCover) ?? listing.images[0]
  const className = options?.className ?? 'feed-media'

  if (!coverImage) {
    return (
      <div className={`${className} feed-media-empty`}>
        <div className="feed-media-empty-copy">
          <strong>No cover image yet</strong>
          <span>{options?.emptyLabel ?? 'Upload a photo to make this listing stand out in the feed.'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {listing.images.length > 1 ? <span className="feed-media-count">{listing.images.length} photos</span> : null}
      <div className="feed-media-slide">
        <img
          alt={`${listing.title} cover photo`}
          loading="lazy"
          src={getListingImageUrl(coverImage.providerAssetId, 'card')}
        />
      </div>
    </div>
  )
}

function renderListingImageGallery(
  listing: Listing,
  options?: { className?: string; hideCount?: boolean },
) {
  if (!listing.images.length) {
    return null
  }

  return (
    <div className={options?.className ?? 'feed-media'}>
      {!options?.hideCount && listing.images.length > 1 ? (
        <span className="feed-media-count">{listing.images.length} photos</span>
      ) : null}
      <div aria-label={`${listing.title} photos`} className="feed-media-track" role="list">
        {listing.images.map((image, index) => (
          <div className="feed-media-slide" key={image.id} role="listitem">
            <img
              alt={`${listing.title} photo ${index + 1}`}
              loading="lazy"
              src={getListingImageUrl(image.providerAssetId, 'card')}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function normalizeListings(listingsPayload: Listing[]) {
  return listingsPayload.map((listing) => normalizeListing(listing))
}

function normalizeListingInquiries(inquiriesPayload: ListingInquiry[]) {
  return inquiriesPayload.map((inquiry) => normalizeListingInquiry(inquiry))
}

function normalizeListing(listing: Listing): Listing {
  return {
    ...listing,
    city: typeof listing.city === 'string' ? listing.city : null,
    locality: typeof listing.locality === 'string' ? listing.locality : null,
    locationName: typeof listing.locationName === 'string' ? listing.locationName : null,
    moveInDate: typeof listing.moveInDate === 'string' ? listing.moveInDate : null,
    moveOutDate: typeof listing.moveOutDate === 'string' ? listing.moveOutDate : null,
    contactPhone: typeof listing.contactPhone === 'string' ? listing.contactPhone : null,
    rentAmount:
      typeof listing.rentAmount === 'number'
        ? listing.rentAmount
        : typeof listing.rentAmount === 'string'
          ? Number(listing.rentAmount)
          : null,
    depositAmount:
      typeof listing.depositAmount === 'number'
        ? listing.depositAmount
        : typeof listing.depositAmount === 'string'
          ? Number(listing.depositAmount)
          : null,
    maintenanceAmount:
      typeof listing.maintenanceAmount === 'number'
        ? listing.maintenanceAmount
        : typeof listing.maintenanceAmount === 'string'
          ? Number(listing.maintenanceAmount)
          : null,
    latitude:
      typeof listing.latitude === 'number'
        ? listing.latitude
        : typeof listing.latitude === 'string'
          ? Number(listing.latitude)
          : null,
    longitude:
      typeof listing.longitude === 'number'
        ? listing.longitude
        : typeof listing.longitude === 'string'
          ? Number(listing.longitude)
          : null,
    matchSummary: normalizeListingMatchSummary(listing.matchSummary),
    amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
    nearbyPlaces: Array.isArray(listing.nearbyPlaces) ? listing.nearbyPlaces : [],
    images: Array.isArray(listing.images) ? listing.images : [],
  }
}

function normalizeListingMatchSummary(matchSummary?: ListingMatchSummary | null): ListingMatchSummary | null {
  if (!matchSummary) {
    return null
  }

  return {
    matchScore:
      typeof matchSummary.matchScore === 'number' ? matchSummary.matchScore : Number(matchSummary.matchScore) || 0,
    qualityScore:
      typeof matchSummary.qualityScore === 'number'
        ? matchSummary.qualityScore
        : Number(matchSummary.qualityScore) || 0,
    finalScore:
      typeof matchSummary.finalScore === 'number' ? matchSummary.finalScore : Number(matchSummary.finalScore) || 0,
    label:
      matchSummary.label === 'BEST_MATCH' || matchSummary.label === 'GOOD_MATCH'
        ? matchSummary.label
        : 'POSSIBLE',
    reasons: Array.isArray(matchSummary.reasons)
      ? matchSummary.reasons.filter((reason): reason is string => typeof reason === 'string')
      : [],
  }
}

function normalizeListingInquiry(inquiry: ListingInquiry) {
  return {
    ...inquiry,
    message: typeof inquiry.message === 'string' ? inquiry.message : null,
    ownerNotes: typeof inquiry.ownerNotes === 'string' ? inquiry.ownerNotes : null,
    budgetAmount:
      typeof inquiry.budgetAmount === 'number'
        ? inquiry.budgetAmount
        : typeof inquiry.budgetAmount === 'string'
          ? Number(inquiry.budgetAmount)
          : null,
    preferredMoveInDate:
      typeof inquiry.preferredMoveInDate === 'string' ? inquiry.preferredMoveInDate : null,
    preferredOccupancy:
      typeof inquiry.preferredOccupancy === 'string' ? inquiry.preferredOccupancy : null,
    preferredVisitAt: typeof inquiry.preferredVisitAt === 'string' ? inquiry.preferredVisitAt : null,
    preferredVisitNote:
      typeof inquiry.preferredVisitNote === 'string' ? inquiry.preferredVisitNote : null,
    scheduledVisitAt: typeof inquiry.scheduledVisitAt === 'string' ? inquiry.scheduledVisitAt : null,
    scheduledVisitNote:
      typeof inquiry.scheduledVisitNote === 'string' ? inquiry.scheduledVisitNote : null,
    visitStatus: inquiry.visitStatus ?? 'NONE',
    visitConfirmedAt:
      typeof inquiry.visitConfirmedAt === 'string' ? inquiry.visitConfirmedAt : null,
    visitCancelledAt:
      typeof inquiry.visitCancelledAt === 'string' ? inquiry.visitCancelledAt : null,
    visitCompletedAt:
      typeof inquiry.visitCompletedAt === 'string' ? inquiry.visitCompletedAt : null,
    listing: normalizeListing(inquiry.listing),
    conversation: inquiry.conversation
      ? {
          ...inquiry.conversation,
          messages: Array.isArray(inquiry.conversation.messages)
            ? inquiry.conversation.messages.map((message) => ({
                ...message,
                sender: message.sender ?? null,
              }))
            : [],
        }
      : null,
  }
}

function formatListingLocation(listing: Listing) {
  return [listing.city, listing.locality].filter(Boolean).join(', ') || listing.locationName || 'Location pending'
}

/** Short version for cards: locality, city only. Falls back to first 2 segments of the full Google address. */
function formatListingLocationShort(listing: Listing) {
  if (listing.locality || listing.city) {
    return [listing.locality, listing.city].filter(Boolean).join(', ')
  }
  if (listing.locationName) {
    const parts = listing.locationName.split(',').map((p) => p.trim()).filter(Boolean)
    return parts.slice(0, 2).join(', ')
  }
  return 'Location pending'
}

function formatPriceLine(listing: Listing) {
  return listing.rentAmount ? `${formatMoney(listing.rentAmount)} / month` : 'Rent pending'
}

function formatMoveInLabel(moveInDate: string | null) {
  return moveInDate ? `Move in ${formatShortDate(moveInDate)}` : 'Move-in pending'
}

/** Display % uses blended final score (same signal as feed ranking), not raw component sum. */
function formatMatchFitPercent(summary: ListingMatchSummary): number {
  const raw =
    typeof summary.finalScore === 'number' && !Number.isNaN(summary.finalScore)
      ? summary.finalScore
      : typeof summary.matchScore === 'number'
        ? summary.matchScore
        : 0
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function getListingInquiryStatusTone(status: ListingInquiryStatus) {
  switch (status) {
    case 'NEW':
      return 'purple'
    case 'CONTACTED':
      return 'green'
    case 'SCHEDULED':
      return 'green'
    case 'DECLINED':
      return 'red'
    case 'CLOSED':
      return 'gray'
    default:
      return 'gray'
  }
}

function formatListingInquiryStatus(status: ListingInquiryStatus) {
  switch (status) {
    case 'NEW':
      return 'New'
    case 'CONTACTED':
      return 'Contacted'
    case 'SCHEDULED':
      return 'Visit scheduled'
    case 'DECLINED':
      return 'Declined'
    case 'CLOSED':
      return 'Closed'
    default:
      return status
  }
}

function getListingStatusTone(status: ListingStatus) {
  switch (status) {
    case 'DRAFT':
      return 'gray'
    case 'PUBLISHED':
      return 'green'
    case 'PAUSED':
      return 'purple'
    case 'FILLED':
      return 'purple'
    case 'ARCHIVED':
      return 'red'
    default:
      return 'gray'
  }
}

function getListingVisitTone(status: ListingVisitStatus) {
  switch (status) {
    case 'PROPOSED':
      return 'purple'
    case 'CONFIRMED':
      return 'green'
    case 'COMPLETED':
      return 'green'
    case 'CANCELLED':
      return 'red'
    default:
      return 'gray'
  }
}

function formatListingStatus(status: ListingStatus) {
  switch (status) {
    case 'DRAFT':
      return 'Draft'
    case 'PUBLISHED':
      return 'Published'
    case 'FILLED':
      return 'Rented'
    case 'PAUSED':
      return 'Paused'
    case 'ARCHIVED':
      return 'Archived'
    default:
      return status
  }
}

function formatListingVisitStatus(status: ListingVisitStatus) {
  switch (status) {
    case 'PROPOSED':
      return 'Visit proposed'
    case 'CONFIRMED':
      return 'Visit confirmed'
    case 'COMPLETED':
      return 'Visit completed'
    case 'CANCELLED':
      return 'Visit cancelled'
    default:
      return 'No visit planned'
  }
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPublicListingBudget(filter: PublicListingBudgetFilter) {
  switch (filter) {
    case 'UNDER_20000':
      return 'Under 20k'
    case 'BETWEEN_20000_AND_30000':
      return '20k - 30k'
    case 'BETWEEN_30000_AND_45000':
      return '30k - 45k'
    case 'ABOVE_45000':
      return '45k+'
    default:
      return 'Any budget'
  }
}

function matchesPublicListingBudget(
  rentAmount: number | null,
  filter: PublicListingBudgetFilter,
) {
  if (filter === 'ANY') {
    return true
  }

  if (rentAmount === null) {
    return false
  }

  switch (filter) {
    case 'UNDER_20000':
      return rentAmount < 20000
    case 'BETWEEN_20000_AND_30000':
      return rentAmount >= 20000 && rentAmount <= 30000
    case 'BETWEEN_30000_AND_45000':
      return rentAmount > 30000 && rentAmount <= 45000
    case 'ABOVE_45000':
      return rentAmount > 45000
    default:
      return true
  }
}

function formatShortDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'date pending'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'time pending'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'time pending'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function filterHostListings(listings: Listing[], filter: HostListingFilter) {
  switch (filter) {
    case 'ACTIVE':
      return listings.filter(
        (listing) =>
          listing.status === 'DRAFT' || listing.status === 'PUBLISHED' || listing.status === 'PAUSED',
      )
    case 'ALL':
      return listings
    default:
      return listings.filter((listing) => listing.status === filter)
  }
}

function filterListingInquiries(inquiries: ListingInquiry[], filter: ListingInquiryFilter) {
  switch (filter) {
    case 'ACTIVE':
      return inquiries.filter(
        (inquiry) => inquiry.status !== 'CLOSED' && inquiry.status !== 'DECLINED',
      )
    case 'ALL':
      return inquiries
    default:
      return inquiries.filter((inquiry) => inquiry.status === filter)
  }
}

function sortListingInquiries(inquiries: ListingInquiry[], sort: ListingInquirySort) {
  const next = [...inquiries]

  next.sort((left, right) => {
    if (sort === 'NEW_FIRST') {
      const leftPriority = getListingInquiryPriority(left)
      const rightPriority = getListingInquiryPriority(right)

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority
      }
    }

    const leftTime = new Date(left.updatedAt || left.createdAt).getTime()
    const rightTime = new Date(right.updatedAt || right.createdAt).getTime()

    if (sort === 'OLDEST') {
      return leftTime - rightTime
    }

    return rightTime - leftTime
  })

  return next
}

function getListingInquiryPriority(inquiry: ListingInquiry) {
  switch (inquiry.status) {
    case 'NEW':
      return 0
    case 'CONTACTED':
      return 1
    case 'SCHEDULED':
      return 2
    case 'DECLINED':
      return 3
    case 'CLOSED':
      return 4
    default:
      return 5
  }
}

function formatHostListingFilterLabel(filter: HostListingFilter) {
  switch (filter) {
    case 'ACTIVE':
      return 'Active'
    case 'DRAFT':
      return 'Draft'
    case 'PAUSED':
      return 'On hold'
    case 'FILLED':
      return 'Rented'
    case 'ARCHIVED':
      return 'Archived'
    case 'ALL':
      return 'All'
    default:
      return formatEnum(filter)
  }
}

function formatListingInquiryFilterLabel(filter: ListingInquiryFilter) {
  switch (filter) {
    case 'ACTIVE':
      return 'Active'
    case 'ALL':
      return 'All'
    default:
      return formatListingInquiryStatus(filter)
  }
}

function buildInquiryTimelineEntries(inquiry: ListingInquiry) {
  const systemMessages =
    inquiry.conversation?.messages.filter((message) => message.messageType === 'SYSTEM') ?? []

  const normalizedEntries = systemMessages
    .filter((message, index) => {
      if (index === 0 && message.body.toLowerCase().includes('sent an inquiry')) {
        return false
      }

      return true
    })
    .map((message) => ({
      id: message.id,
      title: inferInquiryTimelineTitle(message.body),
      body: message.body,
      createdAt: message.createdAt,
      tone: inferInquiryTimelineTone(message.body),
    }))

  return [
    {
      id: `submitted-${inquiry.id}`,
      title: 'Inquiry submitted',
      body: inquiry.message
        ? 'The seeker shared a personal note and structured preferences with the owner.'
        : 'Structured move-in and visit preferences were shared with the owner.',
      createdAt: inquiry.createdAt,
      tone: 'purple' as const,
    },
    ...normalizedEntries,
  ]
}

function inferInquiryTimelineTitle(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('contacted')) {
    return 'Owner contacted seeker'
  }

  if (normalizedMessage.includes('visit proposed')) {
    return 'Visit proposed'
  }

  if (normalizedMessage.includes('confirmed the visit')) {
    return 'Visit confirmed'
  }

  if (normalizedMessage.includes('cancelled the visit')) {
    return 'Visit cancelled'
  }

  if (normalizedMessage.includes('visit as completed')) {
    return 'Visit completed'
  }

  if (normalizedMessage.includes('declined')) {
    return 'Inquiry declined'
  }

  if (normalizedMessage.includes('closed')) {
    return 'Inquiry closed'
  }

  return 'Status updated'
}

function inferInquiryTimelineTone(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('declined')) {
    return 'red' as const
  }

  if (normalizedMessage.includes('cancelled')) {
    return 'red' as const
  }

  if (normalizedMessage.includes('closed')) {
    return 'gray' as const
  }

  if (
    normalizedMessage.includes('proposed') ||
    normalizedMessage.includes('confirmed') ||
    normalizedMessage.includes('completed') ||
    normalizedMessage.includes('contacted')
  ) {
    return 'green' as const
  }

  return 'purple' as const
}

function normalizeAmenityName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeNearbyPlaceName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function getNearbyPlaceSuggestions(type: NearbyPlaceType): readonly string[] {
  return type === 'tech_park' ? popularTechParks : popularOffices
}

function resolveCityValue(cityOption: string, customCity: string) {
  if (cityOption === otherCityOptionValue) {
    return customCity.trim()
  }

  return cityOption.trim()
}

function toIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString()
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString()
}

function toInputDate(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function toDateTimeLocalInput(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16)
}

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function getTodayDateTimeInputValue() {
  return toDateTimeLocalInput(new Date().toISOString())
}

function toSelectedPlaceLocation(
  locationName: string | null,
  latitude: number | null,
  longitude: number | null,
): SelectedPlaceLocation | null {
  if (!locationName || latitude === null || longitude === null) {
    return null
  }

  return {
    locationName,
    latitude,
    longitude,
  }
}

function buildWhatsappLink(phone: string | null) {
  const normalizedPhone = normalizePhoneForLink(phone)
  return `https://wa.me/${normalizedPhone}`
}

function buildCallLink(phone: string | null) {
  return `tel:${normalizePhoneForLink(phone)}`
}

function normalizePhoneForLink(phone: string | null) {
  return (phone ?? '').replace(/[^\d+]/g, '')
}

function formatContactPhone(phone: string | null) {
  return phone ?? 'Phone number not shared'
}

function buildMailtoLink(email: string, listingTitle?: string) {
  const subject = listingTitle ? `Regarding your interest in ${listingTitle}` : 'Regarding your housing inquiry'
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`
}

function isDesktopViewport() {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(min-width: 960px)').matches
}
