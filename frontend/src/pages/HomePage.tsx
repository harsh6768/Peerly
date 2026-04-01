import { ArrowRight, Home, HousePlus, Search, ShieldCheck } from 'lucide-react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'

const intentCards = [
  {
    title: 'Find room',
    description:
      'Browse live replacement listings with the essentials up front: photos, rent, location, move-in date, and amenities.',
    icon: Search,
    to: '/find-tenant?intent=find_room',
    cta: 'Start searching',
  },
  {
    title: 'Find replacement',
    description:
      'Create and manage your own room listing with a guided publishing flow built for fast action.',
    icon: HousePlus,
    to: '/find-tenant?intent=find_replacement',
    cta: 'Open replacement mode',
  },
] as const

const promisePoints = [
  'One app with two clear housing intents',
  'No mixed seeker and host feeds',
  'Desktop details page for full apartment review',
  'Host dashboard for draft, published, and rented states',
] as const

const workflowSteps = [
  'Choose your intent first: find room or find replacement',
  'Find room shows only live room listings and details',
  'Find replacement shows only your listings and the create flow',
  'Verification and profile remain available without distracting from housing',
] as const

export function HomePage() {
  return (
    <div className="page">
      <section className="section">
        <div className="page-inner landing-hero housing-home-shell">
          <div className="hero-copy hero-copy-centered reveal">
            <div className="hero-announcement">
              <Badge tone="green">Housing MVP</Badge>
              <span>Intent-driven tenant replacement marketplace</span>
              <ArrowRight size={14} />
            </div>

            <h1>
              Find room or find replacement
              <span className="headline-accent"> without a confusing marketplace.</span>
            </h1>
            <p>
              Trusted Network is now focused on the two housing jobs that matter for MVP: seekers
              browse live room listings, and hosts publish or manage their own apartments in a
              separate mode.
            </p>

            <div className="hero-actions hero-actions-centered">
              <Button icon={<ArrowRight size={18} />} to="/find-tenant?intent=find_room">
                Find room
              </Button>
              <Button to="/find-tenant?intent=find_replacement" variant="secondary">
                Find replacement
              </Button>
            </div>
          </div>

          <div className="workflow-entry-grid reveal reveal-delay">
            {intentCards.map(({ cta, description, icon: Icon, title, to }) => (
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

          <div className="product-surface-grid reveal reveal-delay-2">
            <Card className="product-surface-card">
              <div className="product-surface-head">
                <div className="workflow-entry-icon">
                  <Home size={22} />
                </div>
                <div>
                  <strong>What seekers see</strong>
                  <p>Only apartment listings, with simple cards and a dedicated details page on desktop.</p>
                </div>
              </div>
              <ul className="summary-list">
                {promisePoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </Card>

            <Card className="product-surface-card">
              <div className="product-surface-head">
                <div className="workflow-entry-icon">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <strong>How the housing flow works</strong>
                  <p>The app now respects intent first, then shows only the actions that fit that mode.</p>
                </div>
              </div>
              <ul className="summary-list">
                {workflowSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
