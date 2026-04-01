import {
  ArrowRight,
  Building2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Home,
  LoaderCircle,
  MapPin,
  PencilLine,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { LocationSummaryCard, PlaceAutocompleteField } from '../components/PlaceAutocompleteField'
import { useAppAuth } from '../context/AppAuthContext'
import { apiRequest } from '../lib/api'
import {
  cleanupUploadedListingImages,
  type ListingImageUploadPayload,
  uploadListingImageToCloudinary,
} from '../lib/cloudinary'
import type { SelectedPlaceLocation } from '../lib/googleMaps'
import { majorCities, otherCityOptionValue } from '../lib/majorCities'

type ListingImage = {
  id: string
  providerAssetId: string
  imageUrl: string
  thumbnailUrl: string
  detailUrl: string
  isCover: boolean
  sortOrder: number
}

type NearbyPlaceType = 'tech_park' | 'company'

type NearbyPlace = {
  id?: string
  name: string
  type: NearbyPlaceType
}

type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED' | 'FILLED'

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
  images: ListingImage[]
  nearbyPlaces: NearbyPlace[]
  owner: {
    id: string
    fullName: string
    companyName: string | null
    isVerified: boolean
  }
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
  status: 'uploading' | 'uploaded' | 'error'
  upload?: ListingImageUploadPayload
  error?: string
  persisted?: boolean
}

type FeedbackState = {
  tone: 'success' | 'error' | 'info'
  message: string
}

const housingIntentValues = {
  findRoom: 'FIND_ROOM',
  findReplacement: 'FIND_REPLACEMENT',
} as const

type HousingIntent = (typeof housingIntentValues)[keyof typeof housingIntentValues]

type ListingDetailsRouteState = {
  listing?: Listing
}

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

function SearchListingCard({ listing }: { listing: Listing }) {
  const navigate = useNavigate()
  const [showInlineDetails, setShowInlineDetails] = useState(false)
  const contactActionLabel = listing.contactMode === 'CALL' ? 'Call owner' : 'WhatsApp owner'

  function handleViewDetails() {
    if (isDesktopViewport()) {
      navigate(`/find-tenant/listings/${listing.id}`, {
        state: { listing } as ListingDetailsRouteState,
      })
      return
    }

    setShowInlineDetails((current) => !current)
  }

  return (
    <Card className={`feed-card${showInlineDetails ? ' expanded' : ''}`}>
      {renderListingCoverImage(listing)}

      <div className="feed-card-top">
        <div>
          <strong>{listing.title}</strong>
          <p>{formatListingLocation(listing)}</p>
        </div>
        <Badge tone={listing.owner.isVerified ? 'green' : 'gray'}>
          {listing.owner.isVerified ? 'Verified' : 'Live'}
        </Badge>
      </div>

      <div className="feed-meta-row">
        <span>
          <Building2 size={16} />
          {formatPriceLine(listing)}
        </span>
        <span>
          <CalendarRange size={16} />
          {formatMoveInLabel(listing.moveInDate)}
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

      <div className="feed-card-actions">
        <Button onClick={handleViewDetails} variant="secondary">
          {showInlineDetails ? 'Hide details' : 'View details'}
        </Button>
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

          <LocationSummaryCard
            compact
            location={toSelectedPlaceLocation(listing.locationName, listing.latitude, listing.longitude)}
          />

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
}: {
  listing: Listing
  busyAction: string | null
  onArchive: (listing: Listing) => void
  onEdit: (listing: Listing) => void
  onMarkAsRented: (listing: Listing) => void
}) {
  return (
    <Card className="host-listing-card" key={listing.id}>
      <div className="feed-card-top">
        <div>
          <strong>{listing.title}</strong>
          <p>{formatListingLocation(listing)}</p>
        </div>
        <Badge tone={getListingStatusTone(listing.status)}>{formatListingStatus(listing.status)}</Badge>
      </div>

      <div className="host-listing-meta">
        <span>{formatPriceLine(listing)}</span>
        <span>Created {formatShortDate(listing.createdAt)}</span>
      </div>

      <div className="host-listing-actions">
        <Button onClick={() => onEdit(listing)} variant="secondary">
          Edit
        </Button>
        <Button
          disabled={busyAction === `FILLED-${listing.id}` || listing.status === 'FILLED'}
          onClick={() => onMarkAsRented(listing)}
          variant="ghost"
        >
          {busyAction === `FILLED-${listing.id}` ? 'Updating...' : listing.status === 'FILLED' ? 'Marked as rented' : 'Mark as rented'}
        </Button>
        <Button
          disabled={busyAction === `ARCHIVED-${listing.id}`}
          onClick={() => onArchive(listing)}
          variant="ghost"
        >
          {busyAction === `ARCHIVED-${listing.id}` ? 'Removing...' : 'Delete'}
        </Button>
      </div>
    </Card>
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
          src={activeImage.detailUrl || activeImage.imageUrl || activeImage.thumbnailUrl}
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
              <img alt={`${listing.title} thumbnail ${index + 1}`} loading="lazy" src={image.thumbnailUrl || image.imageUrl} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function FindTenantListingDetailsPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as ListingDetailsRouteState | null
  const initialListing = useMemo(
    () => (routeState?.listing && routeState.listing.id === listingId ? normalizeListing(routeState.listing) : null),
    [listingId, routeState],
  )
  const [listing, setListing] = useState<Listing | null>(initialListing)
  const [isLoading, setIsLoading] = useState(initialListing === null)
  const [error, setError] = useState<string | null>(null)

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

  const badgeTone = listing?.owner.isVerified ? 'green' : 'gray'
  const badgeLabel = listing?.owner.isVerified ? 'Verified owner' : 'Live listing'

  return (
    <div className="page">
      <section className="section">
        <div className="page-inner">
          <div className="hub-panel hub-panel-wide listing-details-screen">
            <div className="listing-details-topbar">
              <Button onClick={() => navigate('/find-tenant?intent=find_room')} variant="ghost">
                Back to search
              </Button>
              {listing ? <Badge tone={badgeTone}>{badgeLabel}</Badge> : null}
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

                  <LocationSummaryCard location={toSelectedPlaceLocation(listing.locationName, listing.latitude, listing.longitude)} />
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
  const { sessionToken, user } = useAppAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [intent, setIntent] = useState<HousingIntent>(getIntentFromSearchParams(searchParams))
  const [publicListings, setPublicListings] = useState<Listing[]>([])
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [hostStep, setHostStep] = useState(0)
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  const [listingImages, setListingImages] = useState<DraftListingImage[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [isSavingListing, setIsSavingListing] = useState(false)
  const [isCleaningUpUploads, setIsCleaningUpUploads] = useState(false)
  const [uploadSummary, setUploadSummary] = useState<string | null>(null)
  const [amenityInput, setAmenityInput] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)
  const [busyListingAction, setBusyListingAction] = useState<string | null>(null)
  const [replaceTenantCityOption, setReplaceTenantCityOption] = useState('')
  const [replaceTenantCustomCity, setReplaceTenantCustomCity] = useState('')
  const [replaceTenantForm, setReplaceTenantForm] = useState<ReplaceTenantForm>(makeEmptyReplaceTenantForm())
  const listingImagesRef = useRef<DraftListingImage[]>([])

  const selectedListingLocation = useMemo(
    () =>
      toSelectedPlaceLocation(
        replaceTenantForm.locationName,
        replaceTenantForm.latitude,
        replaceTenantForm.longitude,
      ),
    [replaceTenantForm.latitude, replaceTenantForm.locationName, replaceTenantForm.longitude],
  )
  const filteredPublicListings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return publicListings.filter((listing) => {
      if (!normalizedQuery) {
        return true
      }

      return [
        listing.title,
        listing.city ?? '',
        listing.locality ?? '',
        listing.locationName ?? '',
        ...(listing.amenities ?? []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [publicListings, searchQuery])

  useEffect(() => {
    setIntent(getIntentFromSearchParams(searchParams))
  }, [searchParams])

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
    void loadHousingData()
  }, [sessionToken, user?.id])

  async function loadHousingData() {
    try {
      setIsLoading(true)
      setFeedback(null)

      const publicListingsPayload = await apiRequest<Listing[]>('/listings?status=PUBLISHED')
      setPublicListings(normalizeListings(publicListingsPayload))

      if (sessionToken && user) {
        const myListingsPayload = await apiRequest<Listing[]>(
          `/listings?ownerUserId=${encodeURIComponent(user.id)}`,
          {
            token: sessionToken,
          },
        )
        setMyListings(normalizeListings(myListingsPayload))
      } else {
        setMyListings([])
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to load housing listings.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleIntentChange(nextIntent: HousingIntent) {
    setIntent(nextIntent)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('intent', serializeIntent(nextIntent))
      return next
    })
  }

  function startCreateListing() {
    resetListingComposer()
    setHostStep(0)
    handleIntentChange(housingIntentValues.findReplacement)
  }

  function startEditingListing(listing: Listing) {
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
        previewUrl: image.thumbnailUrl || image.imageUrl,
        status: 'uploaded',
        persisted: true,
        upload: {
          assetProvider: 'CLOUDINARY',
          providerAssetId: image.providerAssetId,
          imageUrl: image.imageUrl,
          thumbnailUrl: image.thumbnailUrl,
          detailUrl: image.detailUrl,
          isCover: image.isCover,
          sortOrder: image.sortOrder,
        },
      })),
    )
    setHostStep(0)
    handleIntentChange(housingIntentValues.findReplacement)
    setFeedback(null)
  }

  function resetListingComposer() {
    setEditingListingId(null)
    setReplaceTenantForm(makeEmptyReplaceTenantForm())
    setReplaceTenantCityOption('')
    setReplaceTenantCustomCity('')
    setAmenityInput('')
    setUploadSummary(null)
    clearListingImages(false)
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
    const uploadedImages = listingImages
      .filter((image) => image.status === 'uploaded' && image.upload)
      .map((image) => image.upload!)
      .map((image, index) => ({
        ...image,
        isCover: index === 0,
        sortOrder: index,
      }))

    try {
      setIsSavingListing(true)
      setFeedback(null)

      const payload = {
        ownerUserId: user.id,
        type: 'tenant_replacement',
        title: replaceTenantForm.title.trim(),
        city: city || undefined,
        locality: replaceTenantForm.locality.trim() || undefined,
        locationName: selectedListingLocation?.locationName,
        latitude: selectedListingLocation?.latitude,
        longitude: selectedListingLocation?.longitude,
        moveInDate: replaceTenantForm.moveInDate ? toIsoDate(replaceTenantForm.moveInDate) : undefined,
        rentAmount: replaceTenantForm.rentAmount ? Number(replaceTenantForm.rentAmount) : undefined,
        depositAmount: replaceTenantForm.depositAmount ? Number(replaceTenantForm.depositAmount) : undefined,
        maintenanceAmount: replaceTenantForm.maintenanceAmount ? Number(replaceTenantForm.maintenanceAmount) : undefined,
        amenities: replaceTenantForm.amenities,
        propertyType: replaceTenantForm.propertyType,
        occupancyType: replaceTenantForm.occupancyType,
        contactMode: replaceTenantForm.contactMode,
        contactPhone: replaceTenantForm.contactPhone.trim() || undefined,
        description: replaceTenantForm.description.trim() || undefined,
        miscCharges: replaceTenantForm.miscCharges.trim() || undefined,
        status: targetStatus,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
      }

      if (editingListingId) {
        await apiRequest(`/listings/${editingListingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await apiRequest('/listings', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      resetListingComposer()
      setHostStep(0)
      await loadHousingData()
      setFeedback({
        tone: 'success',
        message:
          targetStatus === 'DRAFT'
            ? 'Listing saved as draft.'
            : editingListingId
              ? 'Listing updated and published.'
              : 'Listing published successfully.',
      })
    } catch (error) {
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

      await loadHousingData()
      setFeedback({
        tone: 'success',
        message:
          nextStatus === 'FILLED'
            ? 'Listing marked as rented.'
            : 'Listing removed from your active dashboard.',
      })
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to update listing status.',
      })
    } finally {
      setBusyListingAction(null)
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
          const upload = await uploadListingImageToCloudinary(file, sessionToken)
          setListingImages((current) =>
            current.map((image) =>
              image.id === draftId
                ? {
                    ...image,
                    status: 'uploaded',
                    upload,
                    previewUrl: upload.thumbnailUrl,
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

  const hostModeEmptyState = (
    <Card className="feed-card">
      <strong>You have no active listings yet</strong>
      <p className="feed-copy">
        Create your first replacement post from find replacement mode and keep future edits, draft saves, and rented updates in one place.
      </p>
    </Card>
  )

  return (
    <div className="page">
      <section className="section">
        <div className="page-inner">
          <div className="section-head reveal">
            <div className="eyebrow">Housing</div>
            <h1 className="page-title">Choose your housing intent first, then we keep the rest of the UI focused.</h1>
            <p className="page-subtitle">
              Find room is for seekers. Find replacement is for owners posting or managing replacement listings.
            </p>
          </div>

          <div className="housing-intent-switch reveal">
            <button
              aria-pressed={intent === housingIntentValues.findRoom}
              className={`housing-intent-card${intent === housingIntentValues.findRoom ? ' active' : ''}`}
              onClick={() => handleIntentChange(housingIntentValues.findRoom)}
              type="button"
            >
              <div className="workflow-entry-icon">
                <Search size={24} />
              </div>
              <strong>Find room</strong>
              <p>Browse live apartment listings with no replacement-management blocks mixed in.</p>
            </button>

            <button
              aria-pressed={intent === housingIntentValues.findReplacement}
              className={`housing-intent-card${intent === housingIntentValues.findReplacement ? ' active' : ''}`}
              onClick={() => handleIntentChange(housingIntentValues.findReplacement)}
              type="button"
            >
              <div className="workflow-entry-icon">
                <Home size={24} />
              </div>
              <strong>Find replacement</strong>
              <p>Manage only your own replacement listings and publish through a step-by-step flow.</p>
            </button>
          </div>

          {feedback && (
            <div className={`feedback-banner feedback-${feedback.tone}`}>
              <span>{feedback.message}</span>
            </div>
          )}

          {intent === housingIntentValues.findRoom ? (
            <div className="hub-panel hub-panel-wide live-feed-panel">
              <div className="hub-panel-head live-feed-head">
                <div>
                  <span className="muted">Intent: Find room</span>
                  <h2>Live room listings</h2>
                  <p className="panel-subtitle">
                    Explore published listings only. Open the desktop details screen to review the full apartment gallery, pricing, and owner contact.
                  </p>
                </div>
                <div className="hub-panel-actions">
                  <Badge tone="green">{isLoading ? 'Loading' : `${filteredPublicListings.length} live`}</Badge>
                  {user ? (
                    <Button onClick={() => handleIntentChange(housingIntentValues.findReplacement)} variant="secondary">
                      Switch to find replacement
                    </Button>
                  ) : (
                    <Button to="/profile" variant="secondary">
                      Sign in to host
                    </Button>
                  )}
                </div>
              </div>

              <div className="live-feed-toolbar">
                <div className="live-feed-summary">
                  <strong>Search published listings</strong>
                  <span>Use a quick text search for title, city, locality, or key amenities.</span>
                </div>
                <div className="housing-search-row">
                  <input
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by locality, city, title, or amenity"
                    value={searchQuery}
                  />
                </div>
              </div>

              <div className="feed-grid listing-feed-grid">
                {filteredPublicListings.map((listing) => (
                  <SearchListingCard key={listing.id} listing={listing} />
                ))}

                {!isLoading && filteredPublicListings.length === 0 && (
                  <Card className="feed-card">
                    <strong>No live listings match that search yet</strong>
                    <p className="feed-copy">Try a broader locality or clear the search input to widen the results.</p>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="housing-host-layout">
              <div className="hub-panel host-dashboard-panel">
                <div className="hub-panel-head">
                  <div>
                    <span className="muted">Intent: Find replacement</span>
                    <h2>Your replacement listings</h2>
                  </div>
                  <div className="hub-panel-actions">
                    <Badge tone="purple">
                      {isLoading || !user ? 'Loading' : `${myListings.length} active`}
                    </Badge>
                    <Button icon={<Plus size={16} />} onClick={startCreateListing} variant="secondary">
                      Create new listing
                    </Button>
                  </div>
                </div>

                {!user ? (
                  <Card className="feed-card">
                    <strong>Sign in to host a listing</strong>
                    <p className="feed-copy">
                      Find replacement mode is for creating drafts, publishing replacement listings, and managing rented status.
                    </p>
                    <Button to="/profile" variant="secondary">
                      Open profile
                    </Button>
                  </Card>
                ) : myListings.length === 0 && !isLoading ? (
                  hostModeEmptyState
                ) : (
                  <div className="host-listing-grid">
                    {myListings.map((listing) => (
                      <HostListingCard
                        busyAction={busyListingAction}
                        key={listing.id}
                        listing={listing}
                        onArchive={(current) => void handleListingStatusChange(current, 'ARCHIVED')}
                        onEdit={startEditingListing}
                        onMarkAsRented={(current) => void handleListingStatusChange(current, 'FILLED')}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="hub-panel host-composer-panel">
                <div className="hub-panel-head">
                  <div>
                    <span className="muted">Listing flow</span>
                    <h2>{editingListingId ? 'Edit replacement listing' : 'Create replacement listing'}</h2>
                  </div>
                  {editingListingId ? (
                    <Button onClick={resetListingComposer} variant="ghost">
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
                        <input
                          id="listing-move-in-date"
                          min={getTodayDateInputValue()}
                          onChange={(event) => setReplaceTenantForm((current) => ({ ...current, moveInDate: event.target.value }))}
                          type="date"
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
                                {image.status === 'uploading'
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
                          <strong>{listingImages.length} uploaded</strong>
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
            </div>
          )}

          <div className="housing-bottom-note">
            <p>
              Delivery has been intentionally removed from the active MVP flow. The parked routes and APIs are documented so we can restore them later without losing the earlier work.
            </p>
            <Button icon={<PencilLine size={16} />} onClick={() => navigate('/profile')} variant="ghost">
              Open profile and verification
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function getIntentFromSearchParams(searchParams: URLSearchParams): HousingIntent {
  const intent = searchParams.get('intent')

  if (intent === 'find_replacement') {
    return housingIntentValues.findReplacement
  }

  return housingIntentValues.findRoom
}

function serializeIntent(intent: HousingIntent) {
  return intent === housingIntentValues.findReplacement ? 'find_replacement' : 'find_room'
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
    propertyType: 'APARTMENT',
    occupancyType: 'SHARED',
    contactMode: 'WHATSAPP',
    contactPhone: '',
    description: '',
    miscCharges: '',
  }
}

function getVisibleAmenities(amenities: string[]) {
  return amenities.slice(0, 3)
}

function renderListingCoverImage(listing: Listing) {
  const coverImage = listing.images.find((image) => image.isCover) ?? listing.images[0]

  if (!coverImage) {
    return null
  }

  return (
    <div className="feed-media">
      {listing.images.length > 1 ? <span className="feed-media-count">{listing.images.length} photos</span> : null}
      <div className="feed-media-slide">
        <img alt={`${listing.title} cover photo`} loading="lazy" src={coverImage.thumbnailUrl || coverImage.imageUrl} />
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
            <img alt={`${listing.title} photo ${index + 1}`} loading="lazy" src={image.thumbnailUrl || image.imageUrl} />
          </div>
        ))}
      </div>
    </div>
  )
}

function normalizeListings(listingsPayload: Listing[]) {
  return listingsPayload.map((listing) => normalizeListing(listing))
}

function normalizeListing(listing: Listing) {
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
    amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
    nearbyPlaces: Array.isArray(listing.nearbyPlaces) ? listing.nearbyPlaces : [],
    images: Array.isArray(listing.images) ? listing.images : [],
  }
}

function formatListingLocation(listing: Listing) {
  return [listing.city, listing.locality].filter(Boolean).join(', ') || listing.locationName || 'Location pending'
}

function formatPriceLine(listing: Listing) {
  return listing.rentAmount ? `${formatMoney(listing.rentAmount)} / month` : 'Rent pending'
}

function formatMoveInLabel(moveInDate: string | null) {
  return moveInDate ? `Move in ${formatShortDate(moveInDate)}` : 'Move-in pending'
}

function getListingStatusTone(status: ListingStatus) {
  switch (status) {
    case 'DRAFT':
      return 'gray'
    case 'PUBLISHED':
      return 'green'
    case 'FILLED':
      return 'purple'
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

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
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

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizeAmenityName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
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

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10)
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

function isDesktopViewport() {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(min-width: 720px)').matches
}
