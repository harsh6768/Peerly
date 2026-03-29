import {
  Building2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Home,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Trash2,
  Upload,
  UserRoundSearch,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useAppAuth } from '../context/AppAuthContext'
import { apiRequest } from '../lib/api'
import {
  cleanupUploadedListingImages,
  type ListingImageUploadPayload,
  uploadListingImageToCloudinary,
} from '../lib/cloudinary'

type ListingImage = {
  id: string
  imageUrl: string
  thumbnailUrl: string
  detailUrl: string
  isCover: boolean
  sortOrder: number
}

type Listing = {
  id: string
  title: string
  description: string
  city: string
  locality: string
  rentAmount: number
  depositAmount: number | null
  propertyType: string
  occupancyType: string
  moveInDate: string
  moveOutDate: string | null
  urgencyLevel: string
  contactMode: string
  isBoosted: boolean
  images: ListingImage[]
  owner: {
    id: string
    fullName: string
    companyName: string | null
    isVerified: boolean
  }
}

type HousingNeed = {
  id: string
  city: string
  locality: string | null
  preferredPropertyType: string
  preferredOccupancy: string
  maxRentAmount: number | null
  moveInDate: string
  urgencyLevel: string
  preferredContactMode: string
  notes: string | null
  user: {
    id: string
    fullName: string
    companyName: string | null
    isVerified: boolean
  }
}

type ReplaceTenantForm = {
  title: string
  description: string
  city: string
  locality: string
  rentAmount: string
  depositAmount: string
  propertyType: string
  occupancyType: string
  moveInDate: string
}

type FindRoomForm = {
  city: string
  locality: string
  preferredPropertyType: string
  preferredOccupancy: string
  maxRentAmount: string
  moveInDate: string
  notes: string
}

type DraftListingImage = {
  id: string
  fileName: string
  previewUrl: string
  status: 'uploading' | 'uploaded' | 'error'
  upload?: ListingImageUploadPayload
  error?: string
}

type FeedbackState = {
  tone: 'success' | 'error' | 'info'
  message: string
}

const propertyTypes = ['ROOM', 'STUDIO', 'APARTMENT', 'PG', 'HOUSE']
const occupancyTypes = ['SINGLE', 'DOUBLE', 'SHARED']
const listingImageSuggestions = [
  'Living room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Balcony / view',
  'Building exterior',
  'Extra angle 1',
  'Extra angle 2',
]

export function FindTenantPage() {
  const { sessionToken, user } = useAppAuth()
  const [activeWorkflow, setActiveWorkflow] = useState<'replace' | 'room'>('replace')
  const [showAllListings, setShowAllListings] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [housingNeeds, setHousingNeeds] = useState<HousingNeed[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [listingImages, setListingImages] = useState<DraftListingImage[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [isSubmittingListing, setIsSubmittingListing] = useState(false)
  const [isCleaningUpUploads, setIsCleaningUpUploads] = useState(false)
  const [isSubmittingRoomNeed, setIsSubmittingRoomNeed] = useState(false)
  const [uploadSummary, setUploadSummary] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const listingImagesRef = useRef<DraftListingImage[]>([])
  const [replaceTenantForm, setReplaceTenantForm] = useState<ReplaceTenantForm>({
    title: '',
    description: '',
    city: '',
    locality: '',
    rentAmount: '',
    depositAmount: '',
    propertyType: 'APARTMENT',
    occupancyType: 'SHARED',
    moveInDate: '',
  })
  const [findRoomForm, setFindRoomForm] = useState<FindRoomForm>({
    city: '',
    locality: '',
    preferredPropertyType: 'APARTMENT',
    preferredOccupancy: 'SHARED',
    maxRentAmount: '',
    moveInDate: '',
    notes: '',
  })

  useEffect(() => {
    void loadHousingData()
  }, [])

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

  const myListings = useMemo(
    () => (user ? listings.filter((listing) => listing.owner.id === user.id) : []),
    [listings, user],
  )
  const featuredListings = useMemo(
    () => (showAllListings ? listings : listings.slice(0, 8)),
    [listings, showAllListings],
  )
  const featuredNeeds = useMemo(() => housingNeeds.slice(0, 6), [housingNeeds])

  async function loadHousingData() {
    try {
      setIsLoading(true)
      setFeedback(null)
      const [listingsPayload, needsPayload] = await Promise.all([
        apiRequest<Listing[]>('/listings?status=PUBLISHED'),
        apiRequest<HousingNeed[]>('/housing-needs?status=OPEN'),
      ])

      setListings(
        listingsPayload.map((listing) => ({
          ...listing,
          images: Array.isArray(listing.images) ? listing.images : [],
        })),
      )
      setHousingNeeds(needsPayload)
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to load housing posts.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReplaceTenantSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user) {
      setFeedback({
        tone: 'error',
        message: 'Please sign in with Google before posting a replacement tenant listing.',
      })
      return
    }

    if (isUploadingImages) {
      setFeedback({
        tone: 'info',
        message: 'Please wait for all listing images to finish uploading.',
      })
      return
    }

    const uploadedImages = listingImages
      .filter((image) => image.status === 'uploaded' && image.upload)
      .map((image, index) => ({
        ...image.upload,
        isCover: index === 0,
        sortOrder: index,
      }))

    if (uploadedImages.length < 2) {
      setFeedback({
        tone: 'error',
        message: 'Please upload at least 2 flat images before posting.',
      })
      return
    }

    try {
      setIsSubmittingListing(true)
      setFeedback(null)
      await apiRequest('/listings', {
        method: 'POST',
        body: JSON.stringify({
          ownerUserId: user.id,
          title: replaceTenantForm.title,
          description: replaceTenantForm.description,
          city: replaceTenantForm.city,
          locality: replaceTenantForm.locality,
          rentAmount: Number(replaceTenantForm.rentAmount),
          depositAmount: replaceTenantForm.depositAmount
            ? Number(replaceTenantForm.depositAmount)
            : undefined,
          propertyType: replaceTenantForm.propertyType,
          occupancyType: replaceTenantForm.occupancyType,
          moveInDate: toIsoDate(replaceTenantForm.moveInDate),
          status: 'PUBLISHED',
          images: uploadedImages,
        }),
      })

      setReplaceTenantForm({
        title: '',
        description: '',
        city: '',
        locality: '',
        rentAmount: '',
        depositAmount: '',
        propertyType: 'APARTMENT',
        occupancyType: 'SHARED',
        moveInDate: '',
      })
      clearListingImages()
      setUploadSummary(null)
      await loadHousingData()
      setFeedback({
        tone: 'success',
        message: 'Replacement tenant listing posted successfully.',
      })
    } catch (error) {
      if (sessionToken && uploadedImages.length > 0) {
        try {
          setIsCleaningUpUploads(true)
          setUploadSummary('Listing failed. Cleaning up uploaded images...')
          await cleanupUploadedListingImages(
            uploadedImages
              .map((image) => image.providerAssetId)
              .filter((assetId): assetId is string => Boolean(assetId)),
            sessionToken,
          )
          clearListingImages()
          setUploadSummary(null)
          setFeedback({
            tone: 'error',
            message:
              (error instanceof Error ? error.message : 'Unable to post replacement listing.') +
              ' Uploaded images were cleaned up.',
          })
          return
        } catch {
          setFeedback({
            tone: 'error',
            message:
              (error instanceof Error ? error.message : 'Unable to post replacement listing.') +
              ' Cleanup failed, so the uploaded images may still exist in storage.',
          })
          return
        } finally {
          setIsCleaningUpUploads(false)
        }
      }

      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to post replacement listing.',
      })
    } finally {
      setIsSubmittingListing(false)
    }
  }

  async function handleFindRoomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user) {
      setFeedback({
        tone: 'error',
        message: 'Please sign in with Google before posting a room requirement.',
      })
      return
    }

    try {
      setIsSubmittingRoomNeed(true)
      setFeedback(null)
      await apiRequest('/housing-needs', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          city: findRoomForm.city,
          locality: findRoomForm.locality || undefined,
          preferredPropertyType: findRoomForm.preferredPropertyType,
          preferredOccupancy: findRoomForm.preferredOccupancy,
          maxRentAmount: findRoomForm.maxRentAmount ? Number(findRoomForm.maxRentAmount) : undefined,
          moveInDate: toIsoDate(findRoomForm.moveInDate),
          notes: findRoomForm.notes || undefined,
          status: 'OPEN',
        }),
      })

      setFindRoomForm({
        city: '',
        locality: '',
        preferredPropertyType: 'APARTMENT',
        preferredOccupancy: 'SHARED',
        maxRentAmount: '',
        moveInDate: '',
        notes: '',
      })
      await loadHousingData()
      setFeedback({
        tone: 'success',
        message: 'Room requirement posted successfully.',
      })
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to post room requirement.',
      })
    } finally {
      setIsSubmittingRoomNeed(false)
    }
  }

  function openWhatsappDraft(message: string) {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
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
        message: 'Please sign in with Google before uploading flat images.',
      })
      return
    }

    if (listingImages.length + files.length > 8) {
      setFeedback({
        tone: 'error',
        message: 'You can upload a maximum of 8 flat images.',
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
                ? (() => {
                    if (image.previewUrl.startsWith('blob:')) {
                      URL.revokeObjectURL(image.previewUrl)
                    }

                    return {
                      ...image,
                      status: 'uploaded',
                      upload,
                      previewUrl: upload.thumbnailUrl,
                    }
                  })()
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
      setUploadSummary(`${successCount} image${successCount > 1 ? 's' : ''} uploaded and optimized.`)
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

  function removeListingImage(id: string) {
    setListingImages((current) => {
      const imageToRemove = current.find((image) => image.id === id)
      if (imageToRemove?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.previewUrl)
      }

      return current.filter((image) => image.id !== id)
    })
  }

  function clearListingImages() {
    setListingImages((current) => {
      current.forEach((image) => {
        if (image.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(image.previewUrl)
        }
      })

      return []
    })
  }

  return (
    <div className="page">
      <section className="section">
        <div className="page-inner">
          <div className="section-head reveal">
            <div className="eyebrow">Housing</div>
            <h1 className="page-title">Browse real housing posts or create one for the exact workflow you need.</h1>
            <p className="page-subtitle">
              Replace Tenant and Find Room now work like real product flows: live posts, direct
              actions, and posting forms built around the backend models.
            </p>
          </div>

          <div className="workflow-entry-grid reveal reveal-delay">
            <Card className="workflow-entry-card">
              <div className="workflow-entry-icon">
                <Home size={28} />
              </div>
              <strong>Replace Tenant</strong>
              <p>Post your flat details and fill a vacancy faster.</p>
              <Button onClick={() => setActiveWorkflow('replace')} variant="secondary">
                Post replacement
              </Button>
            </Card>

            <Card className="workflow-entry-card">
              <div className="workflow-entry-icon">
                <UserRoundSearch size={28} />
              </div>
              <strong>Find Room</strong>
              <p>Post your budget, location, and move-in requirement.</p>
              <Button onClick={() => setActiveWorkflow('room')} variant="secondary">
                Post room need
              </Button>
            </Card>
          </div>

          {user && (
            <div className="hub-panel hub-panel-wide">
              <div className="hub-panel-head">
                <div>
                  <span className="muted">My listings</span>
                  <h2>Your posted replacement listings</h2>
                </div>
                <Badge tone="purple">{isLoading ? 'Loading' : `${myListings.length} posted`}</Badge>
              </div>

              <div className="feed-grid listing-feed-grid">
                {myListings.map((listing) => (
                  <Card className="feed-card" key={`my-${listing.id}`}>
                    {listing.images?.[0] && (
                      <div className="feed-media">
                        <img
                          alt={listing.title}
                          src={listing.images[0].thumbnailUrl || listing.images[0].imageUrl}
                        />
                      </div>
                    )}

                    <div className="feed-card-top">
                      <div>
                        <strong>{listing.title}</strong>
                        <p>
                          {listing.city}, {listing.locality}
                        </p>
                      </div>
                      <Badge tone={listing.isBoosted ? 'purple' : 'green'}>
                        {listing.isBoosted ? 'Boosted' : 'Published'}
                      </Badge>
                    </div>

                    <div className="feed-meta-row">
                      <span>
                        <Building2 size={16} />
                        {formatMoney(listing.rentAmount)} / month
                      </span>
                      <span>
                        <CalendarRange size={16} />
                        Move in {formatShortDate(listing.moveInDate)}
                      </span>
                    </div>

                    <p className="feed-copy">{listing.description}</p>

                    <div className="feed-owner-row">
                      <div>
                        <strong>{listing.owner.fullName}</strong>
                        <span>{listing.owner.companyName ?? 'Independent owner'}</span>
                      </div>
                      <span className="pill">Visible in housing feed</span>
                    </div>
                  </Card>
                ))}

                {!isLoading && myListings.length === 0 && (
                  <Card className="feed-card">
                    <strong>You have not posted any listings yet</strong>
                    <p className="feed-copy">
                      Your replacement tenant posts will appear here after they are created successfully.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}

          <div className="hub-layout">
            <div className="hub-panel">
              <div className="hub-panel-head">
                <div>
                  <span className="muted">Live feed</span>
                  <h2>Flats posted on the portal</h2>
                </div>
                <div className="hub-panel-actions">
                  <Badge tone="green">
                    {isLoading ? 'Loading' : `${featuredListings.length}${showAllListings ? '' : ` of ${listings.length}`} live`}
                  </Badge>
                  {listings.length > 8 && (
                    <Button onClick={() => setShowAllListings((current) => !current)} variant="ghost">
                      {showAllListings ? 'Show 8 listings' : 'Show all listings'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="feed-grid listing-feed-grid">
                {featuredListings.map((listing) => (
                  <Card className="feed-card" key={listing.id}>
                    {listing.images?.[0] && (
                      <div className="feed-media">
                        <img
                          alt={listing.title}
                          src={listing.images[0].thumbnailUrl || listing.images[0].imageUrl}
                        />
                      </div>
                    )}

                    <div className="feed-card-top">
                      <div>
                        <strong>{listing.title}</strong>
                        <p>
                          {listing.city}, {listing.locality}
                        </p>
                      </div>
                      <Badge tone={listing.isBoosted ? 'purple' : listing.owner.isVerified ? 'green' : 'gray'}>
                        {listing.isBoosted ? 'Boosted' : listing.owner.isVerified ? 'Verified' : 'Live'}
                      </Badge>
                    </div>

                    <div className="feed-meta-row">
                      <span>
                        <Building2 size={16} />
                        {formatMoney(listing.rentAmount)} / month
                      </span>
                      <span>
                        <CalendarRange size={16} />
                        Move in {formatShortDate(listing.moveInDate)}
                      </span>
                    </div>

                    <p className="feed-copy">{listing.description}</p>

                    <div className="feed-owner-row">
                      <div>
                        <strong>{listing.owner.fullName}</strong>
                        <span>{listing.owner.companyName ?? 'Independent owner'}</span>
                      </div>
                      {listing.owner.isVerified && (
                        <span className="pill">
                          <ShieldCheck size={14} />
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="detail-actions">
                      <Button
                        onClick={() =>
                          openWhatsappDraft(
                            `Hi ${listing.owner.fullName}, I saw your listing "${listing.title}" on Trusted Network and wanted to know if it is still available.`,
                          )
                        }
                      >
                        WhatsApp lister
                      </Button>
                    </div>
                  </Card>
                ))}

                {!isLoading && featuredListings.length === 0 && (
                  <Card className="feed-card">
                    <strong>No live flat posts yet</strong>
                    <p className="feed-copy">
                      Be the first to post a replacement tenant listing for your area.
                    </p>
                  </Card>
                )}
              </div>
            </div>

            <div className="hub-panel">
              <div className="hub-panel-head">
                <div>
                  <span className="muted">Room seekers</span>
                  <h2>People looking for housing</h2>
                </div>
                <Badge tone="purple">{isLoading ? 'Loading' : `${featuredNeeds.length} active`}</Badge>
              </div>

              <div className="feed-grid">
                {featuredNeeds.map((need) => (
                  <Card className="feed-card" key={need.id}>
                    <div className="feed-card-top">
                      <div>
                        <strong>
                          {need.city}
                          {need.locality ? ` · ${need.locality}` : ''}
                        </strong>
                        <p>
                          {formatEnum(need.preferredPropertyType)} · {formatEnum(need.preferredOccupancy)}
                        </p>
                      </div>
                      <Badge tone={need.user.isVerified ? 'green' : 'gray'}>
                        {need.user.isVerified ? 'Verified' : 'Open'}
                      </Badge>
                    </div>

                    <div className="feed-meta-row">
                      <span>
                        <MapPin size={16} />
                        Budget {need.maxRentAmount ? formatMoney(need.maxRentAmount) : 'Flexible'}
                      </span>
                      <span>
                        <CalendarRange size={16} />
                        Move in {formatShortDate(need.moveInDate)}
                      </span>
                    </div>

                    <p className="feed-copy">{need.notes ?? 'Looking for a trusted housing option.'}</p>

                    <div className="feed-owner-row">
                      <div>
                        <strong>{need.user.fullName}</strong>
                        <span>{need.user.companyName ?? 'Member of the network'}</span>
                      </div>
                      <span className="pill">{formatEnum(need.urgencyLevel)}</span>
                    </div>

                    <div className="detail-actions">
                      <Button
                        onClick={() =>
                          openWhatsappDraft(
                            `Hi ${need.user.fullName}, I saw your room requirement on Trusted Network and wanted to discuss a housing option.`,
                          )
                        }
                        variant="secondary"
                      >
                        WhatsApp seeker
                      </Button>
                    </div>
                  </Card>
                ))}

                {!isLoading && featuredNeeds.length === 0 && (
                  <Card className="feed-card">
                    <strong>No active room requirements yet</strong>
                    <p className="feed-copy">
                      Once seekers post budgets and locations, they will appear here for direct outreach.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>

          <div className="hub-post-wrap">
            <div className="toggle-wrap">
              <button
                className={`toggle-pill${activeWorkflow === 'replace' ? ' active' : ''}`}
                onClick={() => setActiveWorkflow('replace')}
                type="button"
              >
                Replace Tenant
              </button>
              <button
                className={`toggle-pill${activeWorkflow === 'room' ? ' active' : ''}`}
                onClick={() => setActiveWorkflow('room')}
                type="button"
              >
                Find Room
              </button>
            </div>

            {!user && (
              <div className="feedback-banner">
                Sign in with Google to create housing posts. You can still browse live listings and room needs.
              </div>
            )}

            {feedback && <div className={`feedback-banner feedback-${feedback.tone}`}>{feedback.message}</div>}

            {activeWorkflow === 'replace' ? (
              <Card className="post-form-card">
                <div className="hub-panel-head">
                  <div>
                    <span className="muted">Create post</span>
                    <h2>Post replacement tenant listing</h2>
                  </div>
                  <Badge tone="purple">Workflow 1</Badge>
                </div>

                <form className="form-grid" onSubmit={handleReplaceTenantSubmit}>
                  <div className="field">
                    <label htmlFor="listing-title">Listing title</label>
                    <input
                      id="listing-title"
                      onChange={(event) =>
                        setReplaceTenantForm((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="Replacement tenant needed for 2BHK in HSR Layout"
                      value={replaceTenantForm.title}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="listing-description">Description</label>
                    <textarea
                      id="listing-description"
                      onChange={(event) =>
                        setReplaceTenantForm((current) => ({ ...current, description: event.target.value }))
                      }
                      placeholder="Rent, move-out context, flat condition, and who this is ideal for."
                      value={replaceTenantForm.description}
                    />
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="listing-city">City</label>
                      <input
                        id="listing-city"
                        onChange={(event) =>
                          setReplaceTenantForm((current) => ({ ...current, city: event.target.value }))
                        }
                        placeholder="Bengaluru"
                        value={replaceTenantForm.city}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="listing-locality">Locality</label>
                      <input
                        id="listing-locality"
                        onChange={(event) =>
                          setReplaceTenantForm((current) => ({ ...current, locality: event.target.value }))
                        }
                        placeholder="HSR Layout"
                        value={replaceTenantForm.locality}
                      />
                    </div>
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="listing-rent">Rent amount</label>
                      <input
                        id="listing-rent"
                        inputMode="numeric"
                        onChange={(event) =>
                          setReplaceTenantForm((current) => ({ ...current, rentAmount: event.target.value }))
                        }
                        placeholder="25000"
                        value={replaceTenantForm.rentAmount}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="listing-deposit">Deposit amount</label>
                      <input
                        id="listing-deposit"
                        inputMode="numeric"
                        onChange={(event) =>
                          setReplaceTenantForm((current) => ({ ...current, depositAmount: event.target.value }))
                        }
                        placeholder="50000"
                        value={replaceTenantForm.depositAmount}
                      />
                    </div>
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="listing-property-type">Room type</label>
                      <select
                        id="listing-property-type"
                        onChange={(event) =>
                          setReplaceTenantForm((current) => ({ ...current, propertyType: event.target.value }))
                        }
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
                        onChange={(event) =>
                          setReplaceTenantForm((current) => ({ ...current, occupancyType: event.target.value }))
                        }
                        value={replaceTenantForm.occupancyType}
                      >
                        {occupancyTypes.map((type) => (
                          <option key={type} value={type}>
                            {formatEnum(type)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="listing-move-in-date">Move-in date</label>
                    <input
                      id="listing-move-in-date"
                      onChange={(event) =>
                        setReplaceTenantForm((current) => ({ ...current, moveInDate: event.target.value }))
                      }
                      type="date"
                      value={replaceTenantForm.moveInDate}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="listing-images">Flat images</label>
                    <div className="uploader-meta-row">
                      <span>Minimum 2 images</span>
                      <span>Maximum 8 images</span>
                      <span>First image becomes cover</span>
                    </div>

                    {(isUploadingImages || isCleaningUpUploads || uploadSummary) && (
                      <div className="inline-loader-banner">
                        {isUploadingImages || isCleaningUpUploads ? (
                          <LoaderCircle className="spin" size={16} />
                        ) : (
                          <Upload size={16} />
                        )}
                        <span>
                          {isCleaningUpUploads
                            ? 'Cleaning up uploaded images...'
                            : isUploadingImages
                              ? 'Uploading images securely...'
                              : uploadSummary}
                        </span>
                      </div>
                    )}

                    <div className="suggested-order-grid">
                      {listingImageSuggestions.map((label) => (
                        <span className="suggested-order-chip" key={label}>
                          {label}
                        </span>
                      ))}
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
                        disabled={isUploadingImages || isSubmittingListing || isCleaningUpUploads}
                        id="listing-images"
                        multiple
                        onChange={handleListingImageSelection}
                        type="file"
                      />
                      <Upload size={20} />
                      <strong>Upload flat photos</strong>
                      <p>
                        {isUploadingImages
                          ? 'Uploading images to Cloudinary...'
                          : 'Drag and drop images here or choose files from your device.'}
                      </p>
                      <span className="muted">
                        Backend-signed Cloudinary upload with thumbnail and detail-size optimization.
                      </span>
                    </label>

                    <div className="listing-image-grid">
                      {listingImages.map((image, index) => (
                        <div className="listing-image-card" key={image.id}>
                          <div className="listing-image-preview">
                            <img alt={image.fileName} src={image.previewUrl} />
                            {index === 0 && <span className="cover-badge">Cover</span>}
                          </div>

                          <div className="listing-image-copy">
                            <strong>{listingImageSuggestions[index] ?? `Image ${index + 1}`}</strong>
                            <span>{image.fileName}</span>
                            <span>
                              {image.status === 'uploading'
                                ? 'Uploading to Cloudinary...'
                                : image.status === 'error'
                                  ? image.error ?? 'Upload failed.'
                                  : 'Uploaded and optimized'}
                            </span>
                          </div>

                          <div className="listing-image-actions">
                            <button
                              aria-label="Move image left"
                              disabled={index === 0}
                              onClick={() => moveListingImage(index, -1)}
                              type="button"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button
                              aria-label="Move image right"
                              disabled={index === listingImages.length - 1}
                              onClick={() => moveListingImage(index, 1)}
                              type="button"
                            >
                              <ChevronRight size={16} />
                            </button>
                            <button
                              aria-label="Remove image"
                              onClick={() => removeListingImage(image.id)}
                              type="button"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="helper-copy">
                      Cover image should usually be the living room or best wide shot. Detail views
                      are optimized for roughly 800–1200px display.
                    </p>
                  </div>

                  <Button
                    fullWidth
                    type="submit"
                    disabled={isSubmittingListing || isUploadingImages || isCleaningUpUploads}
                  >
                    {isCleaningUpUploads
                      ? 'Cleaning up images...'
                      : isSubmittingListing
                        ? 'Posting replacement listing...'
                        : 'Post replacement listing'}
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="post-form-card">
                <div className="hub-panel-head">
                  <div>
                    <span className="muted">Create post</span>
                    <h2>Post room requirement</h2>
                  </div>
                  <Badge tone="purple">Workflow 2</Badge>
                </div>

                <form className="form-grid" onSubmit={handleFindRoomSubmit}>
                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="need-city">City</label>
                      <input
                        id="need-city"
                        onChange={(event) =>
                          setFindRoomForm((current) => ({ ...current, city: event.target.value }))
                        }
                        placeholder="Bengaluru"
                        value={findRoomForm.city}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="need-locality">Preferred locality</label>
                      <input
                        id="need-locality"
                        onChange={(event) =>
                          setFindRoomForm((current) => ({ ...current, locality: event.target.value }))
                        }
                        placeholder="Koramangala"
                        value={findRoomForm.locality}
                      />
                    </div>
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="need-property-type">Property type</label>
                      <select
                        id="need-property-type"
                        onChange={(event) =>
                          setFindRoomForm((current) => ({
                            ...current,
                            preferredPropertyType: event.target.value,
                          }))
                        }
                        value={findRoomForm.preferredPropertyType}
                      >
                        {propertyTypes.map((type) => (
                          <option key={type} value={type}>
                            {formatEnum(type)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="need-occupancy-type">Occupancy</label>
                      <select
                        id="need-occupancy-type"
                        onChange={(event) =>
                          setFindRoomForm((current) => ({
                            ...current,
                            preferredOccupancy: event.target.value,
                          }))
                        }
                        value={findRoomForm.preferredOccupancy}
                      >
                        {occupancyTypes.map((type) => (
                          <option key={type} value={type}>
                            {formatEnum(type)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="need-budget">Budget</label>
                      <input
                        id="need-budget"
                        inputMode="numeric"
                        onChange={(event) =>
                          setFindRoomForm((current) => ({ ...current, maxRentAmount: event.target.value }))
                        }
                        placeholder="25000"
                        value={findRoomForm.maxRentAmount}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="need-move-in-date">Move-in date</label>
                      <input
                        id="need-move-in-date"
                        onChange={(event) =>
                          setFindRoomForm((current) => ({ ...current, moveInDate: event.target.value }))
                        }
                        type="date"
                        value={findRoomForm.moveInDate}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="need-notes">Preferences</label>
                    <textarea
                      id="need-notes"
                      onChange={(event) =>
                        setFindRoomForm((current) => ({ ...current, notes: event.target.value }))
                      }
                      placeholder="Preferred flat setup, co-living preference, near office, or metro access."
                      value={findRoomForm.notes}
                    />
                  </div>

                  <Button fullWidth type="submit" disabled={isSubmittingRoomNeed}>
                    {isSubmittingRoomNeed ? 'Posting room requirement...' : 'Post room requirement'}
                  </Button>
                </form>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function toIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString()
}
