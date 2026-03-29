import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  HousePlus,
  LayoutGrid,
  MapPinned,
  MessageSquareMore,
  Package,
  PlaneTakeoff,
  Search,
  ShieldCheck,
  UserRoundSearch,
  Users,
} from 'lucide-react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { trustStats } from '../designSystem'

const workflowCards = [
  {
    title: 'Replace Tenant',
    description: 'Find a new room-mate or replacement.',
    cta: 'Post housing need',
    icon: HousePlus,
    to: '/find-tenant',
  },
  {
    title: 'Find Room',
    description: 'Post your ideal budget and location.',
    cta: 'Post housing need',
    icon: UserRoundSearch,
    to: '/find-tenant',
  },
  {
    title: 'Send Item',
    description: 'Urgent delivery request to a city.',
    cta: 'Create delivery request',
    icon: Package,
    to: '/send-item',
  },
  {
    title: 'Traveling',
    description: 'Offer capacity and earn or help.',
    cta: 'Offer capacity',
    icon: Users,
    to: '/send-item',
  },
] as const

export function HomePage() {
  return (
    <div className="page">
      <section className="section">
        <div className="page-inner landing-hero">
          <div className="hero-orb" />

          <div className="hero-copy hero-copy-centered reveal">
            <div className="hero-announcement">
              <Badge tone="purple">Trusted Network</Badge>
              <span>Housing + travel-based delivery for professionals</span>
              <ArrowRight size={14} />
            </div>

            <h1>
              Solve urgent problems with
              <span className="headline-accent"> a trusted hyperlocal network.</span>
            </h1>
            <p>
              Post a need, reach relevant people quickly, and move the conversation to direct
              contact without relying on scattered WhatsApp groups.
            </p>

            <div className="hero-actions hero-actions-centered">
              <Button icon={<ArrowRight size={18} />} to="/find-tenant">
                Get started
              </Button>
              <Button to="/send-item" variant="secondary">
                Open delivery hub
              </Button>
            </div>

            <div className="hero-kpi-row">
              {trustStats.slice(0, 4).map((stat) => (
                <div className="hero-kpi-card" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="workflow-entry-grid reveal reveal-delay">
            {workflowCards.map(({ cta, description, icon: Icon, title, to }) => (
              <Card className="workflow-entry-card" key={title}>
                <div className="workflow-entry-icon">
                  <Icon size={26} />
                </div>
                <strong>{title}</strong>
                <p>{description}</p>
                <Button to={to} variant="secondary">
                  {cta}
                </Button>
              </Card>
            ))}
          </div>

          <div className="surface dashboard-hero reveal reveal-delay-2">
            <div className="dashboard-shell">
              <aside className="dashboard-sidebar">
                <div className="mini-row">
                  <div className="avatar">TN</div>
                  <div>
                    <strong>Trusted Network</strong>
                    <p className="muted">Housing + delivery OS</p>
                  </div>
                </div>

                <div className="dashboard-menu">
                  <span className="dashboard-menu-item active">
                    <LayoutGrid size={16} />
                    Overview
                  </span>
                  <span className="dashboard-menu-item">
                    <Search size={16} />
                    Housing feed
                  </span>
                  <span className="dashboard-menu-item">
                    <MessageSquareMore size={16} />
                    Trust center
                  </span>
                  <span className="dashboard-menu-item">
                    <Package size={16} />
                    Delivery posts
                  </span>
                </div>
              </aside>

              <div className="dashboard-main">
                <div className="dashboard-topbar">
                  <div>
                    <strong>One platform, four urgent workflows</strong>
                    <p className="muted">
                      Replace tenant, find room, send item, or offer travel capacity without
                      jumping between brokers and referral threads.
                    </p>
                  </div>

                  <div className="progress-inline">
                    <span className="muted">Verified network coverage</span>
                    <div className="progress-track">
                      <span style={{ width: '78%' }} />
                    </div>
                  </div>
                </div>

                <div className="dashboard-grid">
                  <div className="dashboard-feature-card feature-coral">
                    <div className="mini-row">
                      <Badge tone="gray">Housing</Badge>
                      <HousePlus size={16} />
                    </div>
                    <strong>Replace tenant faster</strong>
                    <p>Structured listings reduce broker dependency and surface verified users first.</p>
                  </div>

                  <div className="dashboard-feature-card feature-violet">
                    <div className="mini-row">
                      <Badge tone="purple">Delivery</Badge>
                      <Package size={16} />
                    </div>
                    <strong>Travel-based delivery</strong>
                    <p>Senders match with real travelers and coordinate directly through WhatsApp.</p>
                  </div>

                  <div className="dashboard-schedule">
                    <div className="mini-row">
                      <strong>Today&apos;s activity</strong>
                      <Badge tone="green">Live</Badge>
                    </div>
                    <div className="schedule-card">
                      <p>Urgent requests posted this hour</p>
                      <strong>35 active</strong>
                    </div>
                    <div className="dashboard-stats">
                      <div>
                        <span className="muted">Housing</span>
                        <strong>114 live</strong>
                      </div>
                      <div>
                        <span className="muted">Travel</span>
                        <strong>24 routes</strong>
                      </div>
                      <div>
                        <span className="muted">Replies</span>
                        <strong>08 mins</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dashboard-footer">
                  <div className="summary-grid">
                    <div className="mini-card">
                      <HousePlus size={18} />
                      <strong>Replace Tenant</strong>
                      <p>Post rent, location, move-out date, deposit, and images.</p>
                    </div>
                    <div className="mini-card">
                      <Building2 size={18} />
                      <strong>Find Room</strong>
                      <p>Post budget, preferred location, and move-in timeline.</p>
                    </div>
                    <div className="mini-card">
                      <Package size={18} />
                      <strong>Send Item</strong>
                      <p>Post city-to-city requests with urgency and item details.</p>
                    </div>
                    <div className="mini-card">
                      <PlaneTakeoff size={18} />
                      <strong>Traveling</strong>
                      <p>Offer route capacity and connect directly with requesters.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-inner">
          <div className="section-head">
            <div className="eyebrow">Product structure</div>
            <h2>Each workflow is now a real surface, not a decorative preview.</h2>
            <p>
              Housing and delivery both let users browse live posts, create a post for the exact
              use case, and move the conversation to WhatsApp.
            </p>
          </div>

          <div className="product-surface-grid">
            <Card className="product-surface-card">
              <div className="product-surface-head">
                <div className="workflow-entry-icon">
                  <HousePlus size={24} />
                </div>
                <div>
                  <strong>Replace Tenant</strong>
                  <p>Outgoing tenants post a vacancy with rent, locality, and move-out timing.</p>
                </div>
              </div>
              <ul className="summary-list">
                <li>Live listing feed on the housing page</li>
                <li>Direct WhatsApp action for interested users</li>
                <li>Verified badge and company tag visible up front</li>
              </ul>
            </Card>

            <Card className="product-surface-card">
              <div className="product-surface-head">
                <div className="workflow-entry-icon">
                  <UserRoundSearch size={24} />
                </div>
                <div>
                  <strong>Find Room</strong>
                  <p>Room seekers post budget, preferred locality, and move-in timing in the same hub.</p>
                </div>
              </div>
              <ul className="summary-list">
                <li>Visible alongside replacement tenant listings</li>
                <li>Designed for fast comparison and direct outreach</li>
                <li>Built on the existing `housing-needs` model</li>
              </ul>
            </Card>

            <Card className="product-surface-card">
              <div className="product-surface-head">
                <div className="workflow-entry-icon">
                  <Package size={24} />
                </div>
                <div>
                  <strong>Send Item</strong>
                  <p>Users create delivery requests with route, urgency, and item details.</p>
                </div>
              </div>
              <ul className="summary-list">
                <li>Open request feed shows active delivery demand</li>
                <li>Budget and deadline are visible before contact</li>
                <li>Built on `shipment-requests` from the backend</li>
              </ul>
            </Card>

            <Card className="product-surface-card">
              <div className="product-surface-head">
                <div className="workflow-entry-icon">
                  <PlaneTakeoff size={24} />
                </div>
                <div>
                  <strong>Traveling</strong>
                  <p>Travelers offer capacity for routes they are already taking.</p>
                </div>
              </div>
              <ul className="summary-list">
                <li>Visible next to live send-item requests</li>
                <li>One tap to start WhatsApp coordination</li>
                <li>Built on the `traveler-routes` workflow</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-inner support-grid">
          <div className="surface cta-band">
            <div className="section-head" style={{ marginBottom: 20 }}>
              <div className="eyebrow">Trust layer</div>
              <h2>Google login gets users in. Verification improves ranking and response quality.</h2>
              <p>
                The homepage points users into the four real workflows, while Trust Center handles
                Google auth, work-email OTP, and LinkedIn review for badges and company tags.
              </p>
            </div>

            <div className="summary-grid">
              <div className="mini-card">
                <ShieldCheck size={18} />
                <strong>Google login</strong>
                <p>Users sign in with Google and get an app session in the backend.</p>
              </div>
              <div className="mini-card">
                <BadgeCheck size={18} />
                <strong>Verified profile</strong>
                <p>Verified members appear safer to contact and can rank above others.</p>
              </div>
              <div className="mini-card">
                <MapPinned size={18} />
                <strong>WhatsApp first</strong>
                <p>Current flows move conversations into WhatsApp while in-app chat comes later.</p>
              </div>
              <div className="mini-card">
                <CheckCircle2 size={18} />
                <strong>MVP ready</strong>
                <p>The core scope now covers create post, browse feed, and contact user.</p>
              </div>
            </div>

            <div className="cta-actions" style={{ marginTop: 18 }}>
              <Button to="/find-tenant">Open housing hub</Button>
              <Button to="/send-item" variant="secondary">
                Open delivery hub
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
