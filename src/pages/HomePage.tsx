import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  MessageSquareMore,
  Sparkles,
} from 'lucide-react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { homeFeatures, liveListings, processHighlights, supportHighlights, trustStats } from '../designSystem'

export function HomePage() {
  return (
    <div className="page">
      <section className="section">
        <div className="page-inner hero-grid">
          <div className="hero-copy reveal">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              Live trust layer for housing and deliveries
            </div>
            <h1>Move faster with a marketplace that feels safe on every screen.</h1>
            <p>
              Trusted Network brings verified housing, item delivery, and direct contact
              into one mobile-first system. The UI stays minimal, the CTA is always close,
              and the experience scales cleanly from phones to desktop dashboards.
            </p>
            <div className="hero-actions">
              <Button icon={<ArrowRight size={18} />} to="/find-tenant">
                Explore the product
              </Button>
              <Button to="/send-item" variant="secondary">
                Preview components
              </Button>
            </div>
            <div className="hero-signals">
              <span className="pill">
                <BadgeCheck size={16} />
                Verified by default
              </span>
              <span className="pill">
                <Clock3 size={16} />
                Fast interactions
              </span>
              <span className="pill">
                <MessageSquareMore size={16} />
                Direct contact flows
              </span>
            </div>
          </div>

          <div className="surface hero-preview reveal reveal-delay">
            <div className="preview-stack">
              <div className="preview-panel">
                <div className="preview-topbar">
                  <div className="mini-row">
                    <div className="avatar">TN</div>
                    <div>
                      <strong>Hey Jane</strong>
                      <p className="muted">Welcome back to your trusted network.</p>
                    </div>
                  </div>
                  <Badge tone="green">Verified</Badge>
                </div>

                <div className="mini-grid" style={{ marginTop: 18 }}>
                  <div className="mini-card">
                    <Badge tone="purple">Find Tenant</Badge>
                    <strong>Ready-to-move spaces</strong>
                    <p>Search verified rooms, furnished flats, and company-backed homes.</p>
                  </div>
                  <div className="mini-card">
                    <Badge tone="gray">Send Item</Badge>
                    <strong>Route matching</strong>
                    <p>Pair travel routes with urgent parcel requests in just a few taps.</p>
                  </div>
                </div>
              </div>

              <div className="preview-panel">
                <div className="summary-grid">
                  <div className="mini-card">
                    <MapPin size={18} />
                    <strong>Mumbai → Pune</strong>
                    <p>Tonight, 6:40 PM</p>
                  </div>
                  <div className="mini-card">
                    <Building2 size={18} />
                    <strong>HSR Layout</strong>
                    <p>2 new tenant leads</p>
                  </div>
                  <div className="mini-card">
                    <Sparkles size={18} />
                    <strong>Priority match</strong>
                    <p>Urgent verified request</p>
                  </div>
                  <div className="mini-card">
                    <CalendarDays size={18} />
                    <strong>Move in this week</strong>
                    <p>12 curated options</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-inner">
          <div className="section-head reveal">
            <div className="eyebrow">Core components</div>
            <h2>Reusable building blocks mapped from your JSON design system.</h2>
            <p>
              Buttons, chips, cards, sticky navigation, and trust badges are all reusable
              across the landing experience and the product flows.
            </p>
          </div>

          <div className="feature-grid">
            {homeFeatures.map(({ badge, description, icon: Icon, title }, index) => (
              <Card
                className={`feature-card reveal${index === 1 ? ' reveal-delay' : index === 2 ? ' reveal-delay-2' : ''}`}
                key={title}
              >
                <div className="feature-card-icon">
                  <Icon size={22} />
                </div>
                <Badge tone="purple">{badge}</Badge>
                <h3>{title}</h3>
                <p>{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-inner">
          <div className="section-head">
            <div className="eyebrow">Live listings</div>
            <h2>Card-first discovery that works beautifully on touch devices.</h2>
            <p>
              The listing rail stays horizontally scrollable on phones and naturally fans out
              into a wider browsing layout on larger screens.
            </p>
          </div>

          <div className="horizontal-scroll">
            {liveListings.map((listing) => (
              <Card className="listing-card" key={listing.id}>
                <div className="listing-media">
                  <div className="media-actions">
                    {listing.urgent ? <Badge tone="red">Urgent</Badge> : <Badge tone="gray">New</Badge>}
                    {listing.verified && <Badge tone="green">Verified</Badge>}
                  </div>
                </div>
                <div className="listing-meta">
                  <div className="listing-copy">
                    <h3>{listing.title}</h3>
                    <p>{listing.location}</p>
                  </div>
                  <span className="price">{listing.rent}</span>
                </div>
                <div className="metric-row" style={{ marginTop: 14 }}>
                  <Badge tone="purple">{listing.type}</Badge>
                  <Badge tone="gray">{listing.moveIn}</Badge>
                </div>
                <div className="meta-list">
                  {listing.stats.map((stat) => (
                    <span className="meta-item" key={stat}>
                      <span className="eyebrow-dot" />
                      {stat}
                    </span>
                  ))}
                </div>
                <div className="detail-actions" style={{ marginTop: 18 }}>
                  <Button fullWidth>View listing</Button>
                  <Button fullWidth variant="secondary">
                    WhatsApp
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-inner">
          <div className="surface trust-banner">
            <div className="section-head" style={{ marginBottom: 0 }}>
              <div className="eyebrow">Trust signals</div>
              <h2>High-trust UI language without visual noise.</h2>
              <p>
                The system leans on calm surfaces, clear labels, and status colors to make
                urgency and verification obvious at a glance.
              </p>
            </div>
            <div className="stats-grid">
              {trustStats.map((stat) => (
                <div className="stat-card" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <p className="muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-inner support-grid">
          <div className="summary-grid">
            {processHighlights.map(({ description, icon: Icon, title }) => (
              <Card className="info-card" key={title}>
                <div className="info-icon">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </Card>
            ))}
          </div>

          <div className="surface cta-band">
            <h2>Ready to continue?</h2>
            <p className="page-subtitle">
              The product shell is ready for deeper feature work, real data, authentication,
              and backend integrations. For now, this gives you a production-style responsive
              starting point for the full experience.
            </p>
            <div className="cta-actions" style={{ marginTop: 18 }}>
              <Button to="/find-tenant">Open tenant flow</Button>
              <Button to="/send-item" variant="secondary">
                Open send flow
              </Button>
            </div>
            <ul className="summary-list" style={{ marginTop: 18 }}>
              {supportHighlights.map((item) => (
                <li key={item.title}>{item.description}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
