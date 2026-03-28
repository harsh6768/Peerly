import { BedDouble, CalendarRange, Heart, MessageCircle, ShieldCheck, SquareArrowOutUpRight, UserRoundCheck, Wifi } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { liveListings, tenantFilters } from '../designSystem'

export function FindTenantPage() {
  const [activeFilter, setActiveFilter] = useState(tenantFilters[0])
  const [selectedListingId, setSelectedListingId] = useState(liveListings[0]?.id ?? '')

  const selectedListing = useMemo(
    () => liveListings.find((listing) => listing.id === selectedListingId) ?? liveListings[0],
    [selectedListingId],
  )

  return (
    <div className="page">
      <section className="section">
        <div className="page-inner">
          <div className="section-head reveal">
            <div className="eyebrow">Find tenant</div>
            <h1 className="page-title">Browse trusted homes with quick, mobile-friendly actions.</h1>
            <p className="page-subtitle">
              This flow mirrors the card-heavy experience from your reference screens: fast
              filters, featured property cards, and a detail view with direct contact always
              within reach.
            </p>
          </div>

          <div className="filter-row">
            {tenantFilters.map((filter) => (
              <button
                className={`filter-chip${activeFilter === filter ? ' active' : ''}`}
                key={filter}
                onClick={() => setActiveFilter(filter)}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="tenant-grid">
            <div className="tenant-listings">
              {liveListings.map((listing) => (
                <Card className="listing-card" key={listing.id}>
                  <div className="listing-media">
                    <div className="media-actions">
                      {listing.urgent ? <Badge tone="red">Urgent</Badge> : <Badge tone="gray">Featured</Badge>}
                      {listing.verified && <Badge tone="green">Verified</Badge>}
                    </div>
                  </div>
                  <div className="listing-meta">
                    <div className="listing-copy">
                      <h3>{listing.title}</h3>
                      <p>{listing.location}</p>
                    </div>
                    <button
                      aria-label="Save listing"
                      className="circle-button"
                      type="button"
                    >
                      <Heart size={18} />
                    </button>
                  </div>
                  <div className="metric-row" style={{ marginTop: 12 }}>
                    <Badge tone="purple">{listing.rent}</Badge>
                    <Badge tone="gray">{listing.moveIn}</Badge>
                    <Badge tone="green">{listing.matchScore}</Badge>
                  </div>
                  <p className="muted" style={{ marginTop: 12 }}>
                    {listing.description}
                  </p>
                  <div className="meta-list">
                    {listing.stats.map((stat) => (
                      <span className="meta-item" key={stat}>
                        <span className="eyebrow-dot" />
                        {stat}
                      </span>
                    ))}
                  </div>
                  <div className="detail-actions" style={{ marginTop: 18 }}>
                    <Button
                      fullWidth
                      onClick={() => setSelectedListingId(listing.id)}
                    >
                      View details
                    </Button>
                    <Button fullWidth variant="secondary">
                      Contact
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div>
              <div className="surface detail-card">
                <div className="detail-media">
                  <div className="media-actions">
                    <button aria-label="Go back" className="circle-button" type="button">
                      <SquareArrowOutUpRight size={16} />
                    </button>
                    <div className="mini-row">
                      <button aria-label="Share listing" className="circle-button" type="button">
                        <MessageCircle size={16} />
                      </button>
                      <button aria-label="Save listing" className="circle-button" type="button">
                        <Heart size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="metric-row">
                  <Badge tone="green">Verified owner</Badge>
                  {selectedListing.urgent ? <Badge tone="red">Urgent move-in</Badge> : <Badge tone="gray">Stable listing</Badge>}
                </div>

                <div className="listing-meta" style={{ marginTop: 16 }}>
                  <div className="listing-copy">
                    <h2>{selectedListing.title}</h2>
                    <p>{selectedListing.location}</p>
                  </div>
                  <span className="price">{selectedListing.rent}</span>
                </div>

                <div className="host-card">
                  <div className="avatar">{selectedListing.hostName.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{selectedListing.hostName}</strong>
                    <p className="muted">{selectedListing.hostRole}</p>
                  </div>
                  <Badge tone="green">{selectedListing.responseTime}</Badge>
                </div>

                <p className="detail-description">{selectedListing.description}</p>

                <div className="detail-specs">
                  <div className="spec-card">
                    <div className="spec-item">
                      <BedDouble size={18} />
                      {selectedListing.type}
                    </div>
                  </div>
                  <div className="spec-card">
                    <div className="spec-item">
                      <CalendarRange size={18} />
                      {selectedListing.moveIn}
                    </div>
                  </div>
                  <div className="spec-card">
                    <div className="spec-item">
                      <Wifi size={18} />
                      Wi-Fi and power backup
                    </div>
                  </div>
                  <div className="spec-card">
                    <div className="spec-item">
                      <UserRoundCheck size={18} />
                      {selectedListing.occupancy}
                    </div>
                  </div>
                  <div className="spec-card">
                    <div className="spec-item">
                      <ShieldCheck size={18} />
                      {selectedListing.deposit}
                    </div>
                  </div>
                  <div className="spec-card">
                    <div className="spec-item">
                      <CalendarRange size={18} />
                      {selectedListing.availability}
                    </div>
                  </div>
                </div>

                <div className="amenities">
                  {selectedListing.amenities.map((item) => (
                    <span className="meta-item" key={item}>
                      <ShieldCheck size={16} />
                      {item}
                    </span>
                  ))}
                </div>

                <div className="chat-preview">
                  <div className="message outgoing">
                    Hi {selectedListing.hostName.split(' ')[0]}, is this room still available? I’m looking to move in this week.
                  </div>
                  <div className="message incoming">
                    Yes, it is. I can arrange a visit tomorrow and share the agreement details plus photos of the common areas.
                  </div>
                  <div className="message outgoing">
                    Perfect. Please send the location pin and your preferred viewing time.
                  </div>
                </div>

                <div className="sticky-submit">
                  <div className="detail-actions">
                    <Button fullWidth>Request visit</Button>
                    <Button fullWidth variant="secondary">
                      Chat on WhatsApp
                    </Button>
                  </div>
                </div>
              </div>

              <div className="support-card surface" style={{ marginTop: 18 }}>
                <h3>Why this detail page works</h3>
                <ul className="support-list">
                  <li>Large touch targets stay reachable on mobile and stay aligned on desktop.</li>
                  <li>Trust badges sit near the title instead of being buried in a secondary panel.</li>
                  <li>The CTA stack remains visually attached to the selected property detail.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
