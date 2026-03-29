import { CalendarRange, MapPinned, Package, Plane, ShieldCheck, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useAppAuth } from '../context/AppAuthContext'
import { apiRequest } from '../lib/api'

type ShipmentRequest = {
  id: string
  sourceCity: string
  sourceArea: string | null
  destinationCity: string
  destinationArea: string | null
  requiredBy: string
  itemType: string
  itemSize: string
  urgencyLevel: string
  quotedBudget: number | null
  specialHandlingNotes: string | null
  user: {
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
  sourceCity: string
  sourceArea: string
  destinationCity: string
  destinationArea: string
  requiredBy: string
  itemType: string
  itemSize: string
  quotedBudget: string
  specialHandlingNotes: string
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

const itemTypes = ['DOCUMENTS', 'ELECTRONICS', 'CLOTHING', 'FOOD', 'MEDICINE', 'OTHER']
const itemSizes = ['SMALL', 'MEDIUM', 'LARGE']
const capacityTypes = ['DOCUMENTS_ONLY', 'SMALL_BAG', 'CABIN_LUGGAGE', 'CHECK_IN_LUGGAGE']

export function SendItemPage() {
  const { user } = useAppAuth()
  const [activeWorkflow, setActiveWorkflow] = useState<'send' | 'travel'>('send')
  const [shipmentRequests, setShipmentRequests] = useState<ShipmentRequest[]>([])
  const [travelerRoutes, setTravelerRoutes] = useState<TravelerRoute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [sendItemForm, setSendItemForm] = useState<SendItemForm>({
    sourceCity: '',
    sourceArea: '',
    destinationCity: '',
    destinationArea: '',
    requiredBy: '',
    itemType: 'DOCUMENTS',
    itemSize: 'SMALL',
    quotedBudget: '',
    specialHandlingNotes: '',
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

  const liveRequests = useMemo(() => shipmentRequests.slice(0, 6), [shipmentRequests])
  const liveRoutes = useMemo(() => travelerRoutes.slice(0, 6), [travelerRoutes])

  async function loadDeliveryData() {
    try {
      setIsLoading(true)
      setFeedback(null)
      const [requestsPayload, routesPayload] = await Promise.all([
        apiRequest<ShipmentRequest[]>('/shipment-requests?status=OPEN'),
        apiRequest<TravelerRoute[]>('/traveler-routes?status=PUBLISHED'),
      ])

      setShipmentRequests(requestsPayload)
      setTravelerRoutes(routesPayload)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to load delivery posts.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user) {
      setFeedback('Please sign in with Google before creating a delivery request.')
      return
    }

    try {
      setFeedback(null)
      await apiRequest('/shipment-requests', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          sourceCity: sendItemForm.sourceCity,
          sourceArea: sendItemForm.sourceArea || undefined,
          destinationCity: sendItemForm.destinationCity,
          destinationArea: sendItemForm.destinationArea || undefined,
          requiredBy: toIsoDate(sendItemForm.requiredBy),
          itemType: sendItemForm.itemType,
          itemSize: sendItemForm.itemSize,
          quotedBudget: sendItemForm.quotedBudget ? Number(sendItemForm.quotedBudget) : undefined,
          specialHandlingNotes: sendItemForm.specialHandlingNotes || undefined,
          prohibitedItemConfirmed: true,
          status: 'OPEN',
        }),
      })

      setSendItemForm({
        sourceCity: '',
        sourceArea: '',
        destinationCity: '',
        destinationArea: '',
        requiredBy: '',
        itemType: 'DOCUMENTS',
        itemSize: 'SMALL',
        quotedBudget: '',
        specialHandlingNotes: '',
      })
      setFeedback('Delivery request posted successfully.')
      await loadDeliveryData()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to post delivery request.')
    }
  }

  async function handleTravelSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user) {
      setFeedback('Please sign in with Google before offering travel capacity.')
      return
    }

    try {
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
      setFeedback('Travel capacity posted successfully.')
      await loadDeliveryData()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to post travel route.')
    }
  }

  function openWhatsappDraft(message: string) {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="page">
      <section className="section">
        <div className="page-inner">
          <div className="section-head reveal">
            <div className="eyebrow">Delivery</div>
            <h1 className="page-title">Create requests, offer capacity, and connect directly with the people already traveling.</h1>
            <p className="page-subtitle">
              Send Item and Traveling now work like live delivery flows: view requests, post a new
              one, offer route capacity, and move the conversation to WhatsApp.
            </p>
          </div>

          <div className="workflow-entry-grid reveal reveal-delay">
            <Card className="workflow-entry-card">
              <div className="workflow-entry-icon">
                <Package size={28} />
              </div>
              <strong>Send Item</strong>
              <p>Create a city-to-city delivery request with item and urgency details.</p>
              <Button onClick={() => setActiveWorkflow('send')} variant="secondary">
                Create request
              </Button>
            </Card>

            <Card className="workflow-entry-card">
              <div className="workflow-entry-icon">
                <Plane size={28} />
              </div>
              <strong>Traveling</strong>
              <p>Offer spare travel capacity and help or earn through your route.</p>
              <Button onClick={() => setActiveWorkflow('travel')} variant="secondary">
                Offer capacity
              </Button>
            </Card>
          </div>

          <div className="hub-layout">
            <div className="hub-panel">
              <div className="hub-panel-head">
                <div>
                  <span className="muted">Live requests</span>
                  <h2>People who need an item delivered</h2>
                </div>
                <Badge tone="green">{isLoading ? 'Loading' : `${liveRequests.length} live`}</Badge>
              </div>

              <div className="feed-grid">
                {liveRequests.map((request) => (
                  <Card className="feed-card" key={request.id}>
                    <div className="feed-card-top">
                      <div>
                        <strong>
                          {request.sourceCity} → {request.destinationCity}
                        </strong>
                        <p>
                          {formatEnum(request.itemType)} · {formatEnum(request.itemSize)}
                        </p>
                      </div>
                      <Badge tone={request.user.isVerified ? 'green' : 'gray'}>
                        {request.user.isVerified ? 'Verified' : 'Open'}
                      </Badge>
                    </div>

                    <div className="feed-meta-row">
                      <span>
                        <MapPinned size={16} />
                        Needed by {formatShortDate(request.requiredBy)}
                      </span>
                      <span>
                        <WalletCards size={16} />
                        {request.quotedBudget ? formatMoney(request.quotedBudget) : 'Budget flexible'}
                      </span>
                    </div>

                    <p className="feed-copy">
                      {request.specialHandlingNotes ?? 'Urgent delivery request posted on Trusted Network.'}
                    </p>

                    <div className="feed-owner-row">
                      <div>
                        <strong>{request.user.fullName}</strong>
                        <span>{request.user.companyName ?? 'Trusted Network member'}</span>
                      </div>
                      <span className="pill">{formatEnum(request.urgencyLevel)}</span>
                    </div>

                    <div className="detail-actions">
                      <Button
                        onClick={() =>
                          openWhatsappDraft(
                            `Hi ${request.user.fullName}, I saw your delivery request from ${request.sourceCity} to ${request.destinationCity} on Trusted Network and can discuss helping with it.`,
                          )
                        }
                      >
                        WhatsApp requester
                      </Button>
                    </div>
                  </Card>
                ))}

                {!isLoading && liveRequests.length === 0 && (
                  <Card className="feed-card">
                    <strong>No open delivery requests yet</strong>
                    <p className="feed-copy">
                      The first send-item request will appear here with route, budget, and urgency details.
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
                      <Button
                        onClick={() =>
                          openWhatsappDraft(
                            `Hi ${route.user.fullName}, I saw your travel route from ${route.sourceCity} to ${route.destinationCity} on Trusted Network and wanted to discuss a delivery request.`,
                          )
                        }
                        variant="secondary"
                      >
                        WhatsApp traveler
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
                Sign in with Google to create a delivery request or offer travel capacity. You can still browse live posts.
              </div>
            )}

            {feedback && <div className="feedback-banner">{feedback}</div>}

            {activeWorkflow === 'send' ? (
              <Card className="post-form-card">
                <div className="hub-panel-head">
                  <div>
                    <span className="muted">Create post</span>
                    <h2>Create delivery request</h2>
                  </div>
                  <Badge tone="purple">Workflow 3</Badge>
                </div>

                <form className="form-grid" onSubmit={handleSendItemSubmit}>
                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="request-source-city">From city</label>
                      <input
                        id="request-source-city"
                        onChange={(event) =>
                          setSendItemForm((current) => ({ ...current, sourceCity: event.target.value }))
                        }
                        placeholder="Mumbai"
                        value={sendItemForm.sourceCity}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="request-destination-city">To city</label>
                      <input
                        id="request-destination-city"
                        onChange={(event) =>
                          setSendItemForm((current) => ({ ...current, destinationCity: event.target.value }))
                        }
                        placeholder="Pune"
                        value={sendItemForm.destinationCity}
                      />
                    </div>
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="request-source-area">Pickup area</label>
                      <input
                        id="request-source-area"
                        onChange={(event) =>
                          setSendItemForm((current) => ({ ...current, sourceArea: event.target.value }))
                        }
                        placeholder="Andheri East"
                        value={sendItemForm.sourceArea}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="request-destination-area">Drop-off area</label>
                      <input
                        id="request-destination-area"
                        onChange={(event) =>
                          setSendItemForm((current) => ({ ...current, destinationArea: event.target.value }))
                        }
                        placeholder="Koregaon Park"
                        value={sendItemForm.destinationArea}
                      />
                    </div>
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="request-required-by">Required by</label>
                      <input
                        id="request-required-by"
                        onChange={(event) =>
                          setSendItemForm((current) => ({ ...current, requiredBy: event.target.value }))
                        }
                        type="date"
                        value={sendItemForm.requiredBy}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="request-budget">Budget</label>
                      <input
                        id="request-budget"
                        inputMode="numeric"
                        onChange={(event) =>
                          setSendItemForm((current) => ({ ...current, quotedBudget: event.target.value }))
                        }
                        placeholder="500"
                        value={sendItemForm.quotedBudget}
                      />
                    </div>
                  </div>

                  <div className="split-form-grid">
                    <div className="field">
                      <label htmlFor="request-item-type">Item type</label>
                      <select
                        id="request-item-type"
                        onChange={(event) =>
                          setSendItemForm((current) => ({ ...current, itemType: event.target.value }))
                        }
                        value={sendItemForm.itemType}
                      >
                        {itemTypes.map((item) => (
                          <option key={item} value={item}>
                            {formatEnum(item)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="request-item-size">Item size</label>
                      <select
                        id="request-item-size"
                        onChange={(event) =>
                          setSendItemForm((current) => ({ ...current, itemSize: event.target.value }))
                        }
                        value={sendItemForm.itemSize}
                      >
                        {itemSizes.map((item) => (
                          <option key={item} value={item}>
                            {formatEnum(item)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="request-notes">Notes</label>
                    <textarea
                      id="request-notes"
                      onChange={(event) =>
                        setSendItemForm((current) => ({
                          ...current,
                          specialHandlingNotes: event.target.value,
                        }))
                      }
                      placeholder="Urgency, handling instructions, pickup details, or what needs to be coordinated."
                      value={sendItemForm.specialHandlingNotes}
                    />
                  </div>

                  <Button fullWidth type="submit">
                    Create delivery request
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
                  <Badge tone="purple">Workflow 4</Badge>
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
                          setTravelForm((current) => ({
                            ...current,
                            travelTimeWindow: event.target.value,
                          }))
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
                          setTravelForm((current) => ({
                            ...current,
                            allowedItemType: event.target.value,
                          }))
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

                  <Button fullWidth type="submit">
                    Offer travel capacity
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
