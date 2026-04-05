import {
  CalendarRange,
  LoaderCircle,
  Package,
  Plane,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useAppAuth } from '../context/AppAuthContext'
import { apiRequest } from '../lib/api'
import { cleanupUploadedListingImages, type ListingImageUploadPayload, uploadListingImageToCloudinary } from '../lib/cloudinary'
import { majorCities, otherCityOptionValue } from '../lib/majorCities'

type ListingImage = {
  id: string
  imageUrl: string
  thumbnailUrl: string
  detailUrl: string
  isCover: boolean
  sortOrder: number
}

type SendRequestListing = {
  id: string
  type: string
  title: string
  description: string | null
  fromCity: string | null
  toCity: string | null
  itemType: string | null
  requiredDate: string | null
  urgencyLevel: string
  contactMode: string
  contactPhone: string | null
  isBoosted: boolean
  images: ListingImage[]
  owner: {
    id: string
    fullName: string
    companyName: string | null
    isVerified: boolean
  }
}

type TravelerRoute = {
  id: string
  sourceCity: string
  sourceArea: string | null
  destinationCity: string
  destinationArea: string | null
  travelDate: string
  travelTimeWindow: string | null
  capacityType: string
  capacityNotes: string | null
  allowedItemTypes: string[]
  user: {
    id: string
    fullName: string
    companyName: string | null
    isVerified: boolean
  }
}

type SendItemForm = {
  title: string
  fromCity: string
  toCity: string
  requiredDate: string
  itemType: string
  customItemType: string
  urgencyLevel: string
  description: string
  contactMode: string
  contactPhone: string
}

type TravelForm = {
  sourceCity: string
  sourceArea: string
  destinationCity: string
  destinationArea: string
  travelDate: string
  travelTimeWindow: string
  capacityType: string
  allowedItemType: string
  capacityNotes: string
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

type SendRequestFilters = {
  fromCity: string
  toCity: string
  itemType: string
  urgencyLevel: string
}

const itemTypes = ['DOCUMENTS', 'ELECTRONICS', 'CLOTHING', 'FOOD', 'MEDICINE', 'OTHER']
const capacityTypes = ['DOCUMENTS_ONLY', 'SMALL_BAG', 'CABIN_LUGGAGE', 'CHECK_IN_LUGGAGE']
const sendRequestImageSuggestions = [
  'Package front',
  'Label / document',
  'Close-up',
  'Packaging',
  'Pickup proof',
  'Extra angle',
]

export function SendItemPage() {
  const { sessionToken, user } = useAppAuth()
  const [activeWorkflow, setActiveWorkflow] = useState<'send' | 'travel'>('send')
  const [sendRequests, setSendRequests] = useState<SendRequestListing[]>([])
  const [travelerRoutes, setTravelerRoutes] = useState<TravelerRoute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [isSubmittingSendRequest, setIsSubmittingSendRequest] = useState(false)
  const [isSubmittingTravel, setIsSubmittingTravel] = useState(false)
  const [listingImages, setListingImages] = useState<DraftListingImage[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [uploadSummary, setUploadSummary] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [sendRequestFilters, setSendRequestFilters] = useState<SendRequestFilters>({
    fromCity: '',
    toCity: '',
    itemType: '',
    urgencyLevel: '',
  })
  const [fromCityOption, setFromCityOption] = useState('')
  const [fromCityCustom, setFromCityCustom] = useState('')
  const [toCityOption, setToCityOption] = useState('')
  const [toCityCustom, setToCityCustom] = useState('')
  const [sendItemForm, setSendItemForm] = useState<SendItemForm>({
    title: '',
    fromCity: '',
    toCity: '',
    requiredDate: '',
    itemType: 'DOCUMENTS',
    customItemType: '',
    urgencyLevel: 'FLEXIBLE',
    description: '',
    contactMode: 'WHATSAPP',
    contactPhone: '',
  })
  const [travelForm, setTravelForm] = useState<TravelForm>({
    sourceCity: '',
    sourceArea: '',
    destinationCity: '',
    destinationArea: '',
    travelDate: '',
    travelTimeWindow: '',
    capacityType: 'SMALL_BAG',
    allowedItemType: 'DOCUMENTS',
    capacityNotes: '',
  })

  useEffect(() => {
    void loadDeliveryData()
  }, [])

  const filteredSendRequests = useMemo(
    () =>
      sendRequests.filter((request) => {
        if (sendRequestFilters.fromCity && request.fromCity !== sendRequestFilters.fromCity) {
          return false
        }

        if (sendRequestFilters.toCity && request.toCity !== sendRequestFilters.toCity) {
          return false
        }

        if (sendRequestFilters.itemType && request.itemType !== sendRequestFilters.itemType) {
          return false
        }

        if (sendRequestFilters.urgencyLevel && request.urgencyLevel !== sendRequestFilters.urgencyLevel) {
          return false
        }

        return true
      }),
    [sendRequests, sendRequestFilters],
  )
  const liveRequests = useMemo(() => filteredSendRequests.slice(0, 6), [filteredSendRequests])
  const liveRoutes = useMemo(() => travelerRoutes.slice(0, 6), [travelerRoutes])
  const sendRequestFromCityOptions = useMemo(
    () =>
      Array.from(new Set(sendRequests.map((request) => request.fromCity).filter((city): city is string => Boolean(city)))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [sendRequests],
  )
  const sendRequestToCityOptions = useMemo(
    () =>
      Array.from(new Set(sendRequests.map((request) => request.toCity).filter((city): city is string => Boolean(city)))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [sendRequests],
  )
  const sendRequestItemTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(sendRequests.map((request) => request.itemType).filter((itemType): itemType is string => Boolean(itemType))),
      ).sort((left, right) => left.localeCompare(right)),
    [sendRequests],
  )
  const hasSendRequestFilters = Boolean(
    sendRequestFilters.fromCity ||
      sendRequestFilters.toCity ||
      sendRequestFilters.itemType ||
      sendRequestFilters.urgencyLevel,
  )

  async function loadDeliveryData() {
    try {
      setIsLoading(true)
      setFeedback(null)
      const [requestsPayload, routesPayload] = await Promise.all([
        apiRequest<SendRequestListing[]>('/listings?status=PUBLISHED&type=send_request'),
        apiRequest<TravelerRoute[]>('/traveler-routes?status=PUBLISHED'),
      ])

      setSendRequests(normalizeSendRequestListings(requestsPayload))
      setTravelerRoutes(routesPayload)
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to load delivery posts.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user) {
      setFeedback({
        tone: 'error',
        message: 'Please sign in with Google before creating a send item request.',
      })
      return
    }

    if (!sendItemForm.contactPhone.trim()) {
      setFeedback({
        tone: 'error',
        message: 'Add a WhatsApp number or phone number so travelers can contact you.',
      })
      return
    }

    if (sendItemForm.itemType === 'OTHER' && !sendItemForm.customItemType.trim()) {
      setFeedback({
        tone: 'error',
        message: 'Enter the item type when you select Other.',
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

    const normalizedTitle = buildSendRequestTitle(sendItemForm)

    try {
      setIsSubmittingSendRequest(true)
      setFeedback(null)
      await apiRequest('/listings', {
        method: 'POST',
        body: JSON.stringify({
          ownerUserId: user.id,
          type: 'send_request',
          title: normalizedTitle,
          description: sendItemForm.description || undefined,
          fromCity: sendItemForm.fromCity,
          toCity: sendItemForm.toCity,
          itemType: sendItemForm.itemType,
          requiredDate: toIsoDate(sendItemForm.requiredDate),
          urgencyLevel: sendItemForm.urgencyLevel,
          contactMode: sendItemForm.contactMode,
          contactPhone: sendItemForm.contactPhone.trim(),
          status: 'PUBLISHED',
          images: uploadedImages.length > 0 ? uploadedImages : undefined,
        }),
      })

      setSendItemForm({
        title: '',
        fromCity: '',
        toCity: '',
        requiredDate: '',
        itemType: 'DOCUMENTS',
        customItemType: '',
        urgencyLevel: 'FLEXIBLE',
        description: '',
        contactMode: 'WHATSAPP',
        contactPhone: '',
      })
      setFromCityOption('')
      setFromCityCustom('')
      setToCityOption('')
      setToCityCustom('')
      clearListingImages()
      setUploadSummary(null)
      setFeedback({
        tone: 'success',
        message: 'Send item request posted successfully.',
      })
      await loadDeliveryData()
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to post send item request.',
      })
    } finally {
      setIsSubmittingSendRequest(false)
    }
  }

  async function handleTravelSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user) {
      setFeedback({
        tone: 'error',
        message: 'Please sign in with Google before offering travel capacity.',
      })
      return
    }

    try {
      setIsSubmittingTravel(true)
      setFeedback(null)
      await apiRequest('/traveler-routes', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          sourceCity: travelForm.sourceCity,
          sourceArea: travelForm.sourceArea || undefined,
          destinationCity: travelForm.destinationCity,
          destinationArea: travelForm.destinationArea || undefined,
          travelDate: toIsoDate(travelForm.travelDate),
          travelTimeWindow: travelForm.travelTimeWindow || undefined,
          capacityType: travelForm.capacityType,
          allowedItemTypes: [travelForm.allowedItemType],
          capacityNotes: travelForm.capacityNotes || undefined,
          status: 'PUBLISHED',
        }),
      })

      setTravelForm({
        sourceCity: '',
        sourceArea: '',
        destinationCity: '',
        destinationArea: '',
        travelDate: '',
        travelTimeWindow: '',
        capacityType: 'SMALL_BAG',
        allowedItemType: 'DOCUMENTS',
        capacityNotes: '',
      })
      setFeedback({
        tone: 'success',
        message: 'Travel capacity posted successfully.',
      })
      await loadDeliveryData()
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to post travel route.',
      })
    } finally {
      setIsSubmittingTravel(false)
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
        message: 'Please sign in with Google before uploading request images.',
      })
      return
    }

    if (listingImages.length + files.length > 8) {
      setFeedback({
        tone: 'error',
        message: 'You can upload a maximum of 8 request images.',
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
      setUploadSummary(`${successCount} image${successCount > 1 ? 's' : ''} uploaded.`)
    } else {
      setUploadSummary(`${successCount} uploaded. ${failureCount} failed.`)
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

  async function removeListingImage(id: string) {
    const imageToRemove = listingImages.find((image) => image.id === id)

    setListingImages((current) => {
      const next = current.filter((image) => image.id !== id)
      if (imageToRemove?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.previewUrl)
      }
      return next
    })

    if (imageToRemove?.upload && sessionToken) {
      try {
        await cleanupUploadedListingImages([imageToRemove.upload.providerAssetId], sessionToken)
      } catch {
        // Ignore cleanup failure here so the user can continue editing the post.
      }
    }
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

  function handleContactSender(request: SendRequestListing) {
    if (!user) {
      setFeedback({
        tone: 'info',
        message: 'Sign in to contact the sender directly.',
      })
      return
    }

    if (!request.contactPhone) {
      setFeedback({
        tone: 'info',
        message: 'This request does not have contact details yet.',
      })
      return
    }

    window.open(
      request.contactMode === 'CALL' ? buildCallLink(request.contactPhone) : buildWhatsappLink(request.contactPhone),
      '_blank',
      'noopener,noreferrer',
    )
  }

  function handleContactTraveler(route: TravelerRoute) {
    if (!user) {
      setFeedback({
        tone: 'info',
        message: 'Sign in to contact the traveler directly.',
      })
      return
    }

    openWhatsappDraft(
      `Hi ${route.user.fullName}, I saw your travel route from ${route.sourceCity} to ${route.destinationCity} on Cirvo and wanted to discuss a delivery request.`,
    )
  }

  function openWhatsappDraft(message: string) {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  function clearSendRequestFilters() {
    setSendRequestFilters({
      fromCity: '',
      toCity: '',
      itemType: '',
      urgencyLevel: '',
    })
  }

  return (
    <div className="page">
      <section className="section">
        <div className="page-inner">
          <div className="section-head reveal">
            <div className="eyebrow">Delivery</div>
            <h1 className="page-title">Post a send-item request or offer travel capacity inside the same trusted flow.</h1>
            <p className="page-subtitle">
              Send item requests now reuse the listings stack, so requests, images, contact details, and feed cards
              all live in one marketplace model.
            </p>
          </div>

          <div className="workflow-entry-grid reveal reveal-delay">
            <Card className="workflow-entry-card">
              <div className="workflow-entry-icon">
                <Package size={28} />
              </div>
              <strong>Send Item</strong>
              <p>Create a city-to-city request with urgency, optional photos, and direct contact details.</p>
              <Button onClick={() => setActiveWorkflow('send')} variant="secondary">
                Create request
              </Button>
            </Card>

            <Card className="workflow-entry-card">
              <div className="workflow-entry-icon">
                <Plane size={28} />
              </div>
              <strong>Traveling</strong>
              <p>Offer spare travel capacity and help trusted members along your route.</p>
              <Button onClick={() => setActiveWorkflow('travel')} variant="secondary">
                Offer capacity
              </Button>
            </Card>
          </div>

          <div className="hub-layout">
            <div className="hub-panel">
              <div className="hub-panel-head">
                <div>
                  <span className="muted">Send requests</span>
                  <h2>People who need an item delivered</h2>
                </div>
                <div className="hub-panel-actions">
                  <Badge tone="green">{isLoading ? 'Loading' : `${liveRequests.length} live`}</Badge>
                  {hasSendRequestFilters && (
                    <Button onClick={clearSendRequestFilters} variant="ghost">
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>

              <div className="listing-filter-grid">
                <div className="field">
                  <label htmlFor="send-request-filter-from-city">From city</label>
                  <select
                    id="send-request-filter-from-city"
                    onChange={(event) =>
                      setSendRequestFilters((current) => ({
                        ...current,
                        fromCity: event.target.value,
                      }))
                    }
                    value={sendRequestFilters.fromCity}
                  >
                    <option value="">All source cities</option>
                    {sendRequestFromCityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="send-request-filter-to-city">To city</label>
                  <select
                    id="send-request-filter-to-city"
                    onChange={(event) =>
                      setSendRequestFilters((current) => ({
                        ...current,
                        toCity: event.target.value,
                      }))
                    }
                    value={sendRequestFilters.toCity}
                  >
                    <option value="">All destination cities</option>
                    {sendRequestToCityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="send-request-filter-item-type">Item category</label>
                  <select
                    id="send-request-filter-item-type"
                    onChange={(event) =>
                      setSendRequestFilters((current) => ({
                        ...current,
                        itemType: event.target.value,
                      }))
                    }
                    value={sendRequestFilters.itemType}
                  >
                    <option value="">All categories</option>
                    {sendRequestItemTypeOptions.map((itemType) => (
                      <option key={itemType} value={itemType}>
                        {formatEnum(itemType)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="send-request-filter-urgency">Urgency</label>
                  <select
                    id="send-request-filter-urgency"
                    onChange={(event) =>
                      setSendRequestFilters((current) => ({
                        ...current,
                        urgencyLevel: event.target.value,
                      }))
                    }
                    value={sendRequestFilters.urgencyLevel}
                  >
                    <option value="">All urgency levels</option>
                    <option value="FLEXIBLE">Normal</option>
                    <option value="THIS_WEEK">This week</option>
                    <option value="IMMEDIATE">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="feed-grid">
                {liveRequests.map((request) => (
                  <Card className="feed-card" key={request.id}>
                    {request.images[0] && (
                      <div className="feed-media">
                        <img
                          alt={request.title}
                          src={request.images[0].thumbnailUrl || request.images[0].imageUrl}
                        />
                      </div>
                    )}

                    <div className="feed-card-top">
                      <div>
                        <strong>{request.title}</strong>
                        <p>
                          {request.fromCity ?? 'Unknown'} → {request.toCity ?? 'Unknown'}
                        </p>
                      </div>
                      <Badge tone={request.owner.isVerified ? 'green' : 'gray'}>
                        {request.owner.isVerified ? 'Verified' : 'Open'}
                      </Badge>
                    </div>

                    <div className="feed-meta-row">
                      <span>
                        <CalendarRange size={16} />
                        Needed by {request.requiredDate ? formatShortDate(request.requiredDate) : 'Flexible'}
                      </span>
                      <span>
                        <ShieldCheck size={16} />
                        {request.itemType ? formatEnum(request.itemType) : 'General item'}
                      </span>
                    </div>

                    <p className="feed-copy">
                      {request.description ?? 'Send item request posted on Cirvo.'}
                    </p>

                    <div className="feed-owner-row">
                      <div>
                        <strong>{request.owner.fullName}</strong>
                        <span>{request.owner.companyName ?? 'Cirvo member'}</span>
                      </div>
                      <span className="pill">{formatEnum(request.urgencyLevel)}</span>
                    </div>

                    {user ? (
                      <div className="listing-contact-card">
                        <div className="listing-contact-head">
                          <strong>{request.contactMode === 'CALL' ? 'Phone contact' : 'WhatsApp contact'}</strong>
                          <span className="muted">
                            {request.contactPhone ? formatContactPhone(request.contactPhone) : 'Contact unavailable'}
                          </span>
                        </div>

                        <div className="detail-actions">
                          {request.images[0] && (
                            <Button
                              onClick={() =>
                                window.open(request.images[0].detailUrl || request.images[0].imageUrl, '_blank', 'noopener,noreferrer')
                              }
                              variant="secondary"
                            >
                              View image
                            </Button>
                          )}
                          <Button onClick={() => handleContactSender(request)}>Contact sender</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="detail-actions">
                        {request.images[0] && (
                          <Button
                            onClick={() => window.open(request.images[0].detailUrl || request.images[0].imageUrl, '_blank', 'noopener,noreferrer')}
                            variant="secondary"
                          >
                            View image
                          </Button>
                        )}
                        <Button onClick={() => handleContactSender(request)}>Sign in to contact</Button>
                      </div>
                    )}
                  </Card>
                ))}

                {!isLoading && liveRequests.length === 0 && (
                  <Card className="feed-card">
                    <strong>No send item requests yet</strong>
                    <p className="feed-copy">
                      The first request will appear here with route, urgency, contact details, and optional images.
                    </p>
                  </Card>
                )}
              </div>
            </div>

            <div className="hub-panel">
              <div className="hub-panel-head">
                <div>
                  <span className="muted">Traveler feed</span>
                  <h2>Routes posted by travelers</h2>
                </div>
                <Badge tone="purple">{isLoading ? 'Loading' : `${liveRoutes.length} active`}</Badge>
              </div>

              <div className="feed-grid">
                {liveRoutes.map((route) => (
                  <Card className="feed-card" key={route.id}>
                    <div className="feed-card-top">
                      <div>
                        <strong>
                          {route.sourceCity} → {route.destinationCity}
                        </strong>
                        <p>{formatEnum(route.capacityType)}</p>
                      </div>
                      <Badge tone={route.user.isVerified ? 'green' : 'gray'}>
                        {route.user.isVerified ? 'Verified' : 'Live'}
                      </Badge>
                    </div>

                    <div className="feed-meta-row">
                      <span>
                        <CalendarRange size={16} />
                        Travel on {formatShortDate(route.travelDate)}
                      </span>
                      <span>
                        <ShieldCheck size={16} />
                        {route.allowedItemTypes.map(formatEnum).join(', ')}
                      </span>
                    </div>

                    <p className="feed-copy">
                      {route.capacityNotes ?? 'Traveler is open to helping with trusted hand-carry requests.'}
                    </p>

                    <div className="feed-owner-row">
                      <div>
                        <strong>{route.user.fullName}</strong>
                        <span>{route.user.companyName ?? 'Traveler in the network'}</span>
                      </div>
                      <span className="pill">{route.travelTimeWindow ?? 'Flexible time'}</span>
                    </div>

                    <div className="detail-actions">
                      <Button onClick={() => handleContactTraveler(route)} variant="secondary">
                        {user ? 'Contact traveler' : 'Sign in to contact'}
                      </Button>
                    </div>
                  </Card>
                ))}

                {!isLoading && liveRoutes.length === 0 && (
                  <Card className="feed-card">
                    <strong>No traveler routes yet</strong>
                    <p className="feed-copy">
                      As soon as travelers post their route capacity, it will be visible here for senders.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>

          <div className="hub-post-wrap">
            <div className="toggle-wrap">
              <button
                className={`toggle-pill${activeWorkflow === 'send' ? ' active' : ''}`}
                onClick={() => setActiveWorkflow('send')}
                type="button"
              >
                Send Item
              </button>
              <button
                className={`toggle-pill${activeWorkflow === 'travel' ? ' active' : ''}`}
                onClick={() => setActiveWorkflow('travel')}
                type="button"
              >
                Traveling
              </button>
            </div>

            {!user && (
              <div className="feedback-banner">
                Sign in with Google to create a send request, upload images, or contact members directly.
              </div>
            )}

            {feedback && <div className={`feedback-banner feedback-${feedback.tone}`}>{feedback.message}</div>}

            {activeWorkflow === 'send' ? (
              <Card className="post-form-card">
                <div className="hub-panel-head">
                  <div>
                    <span className="muted">Create post</span>
                    <h2>Create send item request</h2>
                  </div>
                  <Badge tone="purple">Use case: Send item</Badge>
                </div>

                <form className="form-grid" onSubmit={handleSendItemSubmit}>
                  <div className="field">
                    <label htmlFor="send-request-title">What do you want to send?</label>
                    <input
                      id="send-request-title"
                      onChange={(event) => setSendItemForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Aadhaar document, laptop charger, medicines..."
                      value={sendItemForm.title}
                    />
                    <span className="muted">
                      Add the exact item name here so travelers can understand the request quickly.
                    </span>
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="send-request-from-city">From city</label>
                      <select
                        id="send-request-from-city"
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setFromCityOption(nextValue)

                          if (nextValue === otherCityOptionValue) {
                            setSendItemForm((current) => ({ ...current, fromCity: fromCityCustom }))
                            return
                          }

                          setFromCityCustom('')
                          setSendItemForm((current) => ({ ...current, fromCity: nextValue }))
                        }}
                        value={fromCityOption}
                      >
                        <option value="">Select a city</option>
                        {majorCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                        <option value={otherCityOptionValue}>Other city</option>
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="send-request-to-city">To city</label>
                      <select
                        id="send-request-to-city"
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setToCityOption(nextValue)

                          if (nextValue === otherCityOptionValue) {
                            setSendItemForm((current) => ({ ...current, toCity: toCityCustom }))
                            return
                          }

                          setToCityCustom('')
                          setSendItemForm((current) => ({ ...current, toCity: nextValue }))
                        }}
                        value={toCityOption}
                      >
                        <option value="">Select a city</option>
                        {majorCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                        <option value={otherCityOptionValue}>Other city</option>
                      </select>
                    </div>
                  </div>

                  {fromCityOption === otherCityOptionValue && (
                    <div className="field">
                      <label htmlFor="send-request-from-city-custom">Enter from city</label>
                      <input
                        id="send-request-from-city-custom"
                        onChange={(event) => {
                          setFromCityCustom(event.target.value)
                          setSendItemForm((current) => ({ ...current, fromCity: event.target.value }))
                        }}
                        placeholder="Enter pickup city"
                        value={fromCityCustom}
                      />
                    </div>
                  )}

                  {toCityOption === otherCityOptionValue && (
                    <div className="field">
                      <label htmlFor="send-request-to-city-custom">Enter to city</label>
                      <input
                        id="send-request-to-city-custom"
                        onChange={(event) => {
                          setToCityCustom(event.target.value)
                          setSendItemForm((current) => ({ ...current, toCity: event.target.value }))
                        }}
                        placeholder="Enter destination city"
                        value={toCityCustom}
                      />
                    </div>
                  )}

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="send-request-required-date">Required by</label>
                      <input
                        id="send-request-required-date"
                        onChange={(event) =>
                          setSendItemForm((current) => ({ ...current, requiredDate: event.target.value }))
                        }
                        type="date"
                        value={sendItemForm.requiredDate}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="send-request-item-type">Item category</label>
                      <select
                        id="send-request-item-type"
                        onChange={(event) =>
                          setSendItemForm((current) => ({
                            ...current,
                            itemType: event.target.value,
                            customItemType: event.target.value === 'OTHER' ? current.customItemType : '',
                          }))
                        }
                        value={sendItemForm.itemType}
                      >
                        {itemTypes.map((item) => (
                          <option key={item} value={item}>
                            {formatEnum(item)}
                          </option>
                        ))}
                      </select>
                      <span className="muted">
                        Pick the closest standard type. Choose `Other` if it does not fit.
                      </span>
                    </div>
                  </div>

                  {sendItemForm.itemType === 'OTHER' && (
                    <div className="field">
                      <label htmlFor="send-request-custom-item-type">Custom item type</label>
                      <input
                        id="send-request-custom-item-type"
                        onChange={(event) =>
                          setSendItemForm((current) => ({ ...current, customItemType: event.target.value }))
                        }
                        placeholder="Passport, legal papers, gift box..."
                        value={sendItemForm.customItemType}
                      />
                    </div>
                  )}

                  <div className="field">
                    <label htmlFor="send-request-urgency">Urgency</label>
                    <select
                      id="send-request-urgency"
                      onChange={(event) => setSendItemForm((current) => ({ ...current, urgencyLevel: event.target.value }))}
                      value={sendItemForm.urgencyLevel}
                    >
                      <option value="FLEXIBLE">Normal</option>
                      <option value="THIS_WEEK">This week</option>
                      <option value="IMMEDIATE">Urgent</option>
                    </select>
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="send-request-contact-mode">Contact method</label>
                      <select
                        id="send-request-contact-mode"
                        onChange={(event) => setSendItemForm((current) => ({ ...current, contactMode: event.target.value }))}
                        value={sendItemForm.contactMode}
                      >
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="CALL">Phone call</option>
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="send-request-contact-phone">
                        {sendItemForm.contactMode === 'CALL' ? 'Phone number' : 'WhatsApp number'}
                      </label>
                      <input
                        id="send-request-contact-phone"
                        inputMode="tel"
                        onChange={(event) =>
                          setSendItemForm((current) => ({ ...current, contactPhone: event.target.value }))
                        }
                        placeholder="+91 98765 43210"
                        value={sendItemForm.contactPhone}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="send-request-description">Description</label>
                    <textarea
                      id="send-request-description"
                      onChange={(event) => setSendItemForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Any handling notes, handoff context, or extra details for travelers."
                      value={sendItemForm.description}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="send-request-images">Request images</label>
                    <div className="uploader-meta-row">
                      <span>Optional but helpful</span>
                      <span>Maximum 8 images</span>
                      <span>First image becomes cover</span>
                    </div>

                    {(isUploadingImages || uploadSummary) && (
                      <div className="inline-loader-banner">
                        {isUploadingImages ? <LoaderCircle className="spin" size={16} /> : <Upload size={16} />}
                        <span>{isUploadingImages ? 'Uploading request images...' : uploadSummary}</span>
                      </div>
                    )}

                    <div className="suggested-order-grid">
                      {sendRequestImageSuggestions.map((label) => (
                        <span className="suggested-order-chip" key={label}>
                          {label}
                        </span>
                      ))}
                    </div>

                    <label
                      className={`listing-upload-dropzone${isDragActive ? ' active' : ''}${isUploadingImages ? ' uploading' : ''}`}
                      htmlFor="send-request-images"
                      onDragEnter={() => setIsDragActive(true)}
                      onDragLeave={() => setIsDragActive(false)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleListingImageDrop}
                    >
                      <input
                        accept="image/*"
                        disabled={isUploadingImages || isSubmittingSendRequest}
                        id="send-request-images"
                        multiple
                        onChange={handleListingImageSelection}
                        type="file"
                      />
                      <Upload size={20} />
                      <strong>Upload request photos</strong>
                      <p>
                        {isUploadingImages
                          ? 'Uploading images to Cloudinary...'
                          : 'Drag and drop images here or choose files from your device.'}
                      </p>
                      <span className="muted">Optional photos help travelers understand the item faster.</span>
                    </label>

                    <div className="listing-image-grid">
                      {listingImages.map((image, index) => (
                        <div className="listing-image-card" key={image.id}>
                          <div className="listing-image-frame">
                            <img alt={image.fileName} src={image.previewUrl} />
                            {index === 0 && <span className="listing-image-cover-badge">Cover</span>}
                          </div>
                          <div className="listing-image-body">
                            <strong>{image.fileName}</strong>
                            <span className="muted">
                              {image.status === 'uploaded'
                                ? 'Uploaded'
                                : image.status === 'uploading'
                                  ? 'Uploading...'
                                  : image.error ?? 'Upload failed'}
                            </span>
                          </div>
                          <div className="listing-image-actions">
                            <Button onClick={() => void removeListingImage(image.id)} type="button" variant="ghost">
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button fullWidth disabled={isSubmittingSendRequest || isUploadingImages} type="submit">
                    {isSubmittingSendRequest ? 'Posting request...' : 'Post request'}
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="post-form-card">
                <div className="hub-panel-head">
                  <div>
                    <span className="muted">Create post</span>
                    <h2>Offer travel capacity</h2>
                  </div>
                  <Badge tone="purple">Use case: Travel route</Badge>
                </div>

                <form className="form-grid" onSubmit={handleTravelSubmit}>
                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="travel-source-city">From city</label>
                      <input
                        id="travel-source-city"
                        onChange={(event) =>
                          setTravelForm((current) => ({ ...current, sourceCity: event.target.value }))
                        }
                        placeholder="Mumbai"
                        value={travelForm.sourceCity}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="travel-destination-city">To city</label>
                      <input
                        id="travel-destination-city"
                        onChange={(event) =>
                          setTravelForm((current) => ({ ...current, destinationCity: event.target.value }))
                        }
                        placeholder="Pune"
                        value={travelForm.destinationCity}
                      />
                    </div>
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="travel-source-area">From area</label>
                      <input
                        id="travel-source-area"
                        onChange={(event) =>
                          setTravelForm((current) => ({ ...current, sourceArea: event.target.value }))
                        }
                        placeholder="Andheri East"
                        value={travelForm.sourceArea}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="travel-destination-area">To area</label>
                      <input
                        id="travel-destination-area"
                        onChange={(event) =>
                          setTravelForm((current) => ({ ...current, destinationArea: event.target.value }))
                        }
                        placeholder="Shivajinagar"
                        value={travelForm.destinationArea}
                      />
                    </div>
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="travel-date">Travel date</label>
                      <input
                        id="travel-date"
                        onChange={(event) =>
                          setTravelForm((current) => ({ ...current, travelDate: event.target.value }))
                        }
                        type="date"
                        value={travelForm.travelDate}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="travel-time-window">Travel window</label>
                      <input
                        id="travel-time-window"
                        onChange={(event) =>
                          setTravelForm((current) => ({ ...current, travelTimeWindow: event.target.value }))
                        }
                        placeholder="Evening flight"
                        value={travelForm.travelTimeWindow}
                      />
                    </div>
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="travel-capacity-type">Capacity</label>
                      <select
                        id="travel-capacity-type"
                        onChange={(event) =>
                          setTravelForm((current) => ({ ...current, capacityType: event.target.value }))
                        }
                        value={travelForm.capacityType}
                      >
                        {capacityTypes.map((item) => (
                          <option key={item} value={item}>
                            {formatEnum(item)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="travel-allowed-item">Allowed item type</label>
                      <select
                        id="travel-allowed-item"
                        onChange={(event) =>
                          setTravelForm((current) => ({ ...current, allowedItemType: event.target.value }))
                        }
                        value={travelForm.allowedItemType}
                      >
                        {itemTypes.map((item) => (
                          <option key={item} value={item}>
                            {formatEnum(item)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="travel-notes">Capacity notes</label>
                    <textarea
                      id="travel-notes"
                      onChange={(event) =>
                        setTravelForm((current) => ({ ...current, capacityNotes: event.target.value }))
                      }
                      placeholder="Mention bag space, item restrictions, or handoff notes."
                      value={travelForm.capacityNotes}
                    />
                  </div>

                  <Button fullWidth disabled={isSubmittingTravel} type="submit">
                    {isSubmittingTravel ? 'Posting route...' : 'Offer travel capacity'}
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

function normalizeSendRequestListings(listingsPayload: SendRequestListing[]) {
  return listingsPayload.map((listing) => ({
    ...listing,
    images: Array.isArray(listing.images) ? listing.images : [],
  }))
}

function buildSendRequestTitle(form: SendItemForm) {
  const directTitle = form.title.trim()

  if (directTitle) {
    return directTitle
  }

  if (form.itemType === 'OTHER' && form.customItemType.trim()) {
    return form.customItemType.trim()
  }

  return `Need to send ${formatEnum(form.itemType).toLowerCase()}`
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function formatContactPhone(value: string | null) {
  if (!value) {
    return 'Contact unavailable'
  }

  return value.startsWith('+') ? value : `+${value}`
}

function toIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString()
}

function buildWhatsappLink(value: string) {
  const normalizedNumber = value.replace(/[^\d+]/g, '').replace(/^\+/, '')
  return `https://wa.me/${normalizedNumber}`
}

function buildCallLink(value: string) {
  return `tel:${value.replace(/\s+/g, '')}`
}
