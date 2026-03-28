import { ArrowRightLeft, ShieldCheck, Truck, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { processHighlights, sendModes, travelOptions } from '../designSystem'

export function SendItemPage() {
  const [mode, setMode] = useState<(typeof sendModes)[number]['id']>('send')

  return (
    <div className="page">
      <section className="section">
        <div className="page-inner delivery-grid">
          <div className="reveal">
            <div className="section-head">
              <div className="eyebrow">Send item</div>
              <h1 className="page-title">Post delivery needs or share a route in a few quick taps.</h1>
              <p className="page-subtitle">
                The flow is built for speed: a pill toggle, a minimal form, clear trust notes,
                and route cards that stay readable whether users are on mobile or desktop.
              </p>
            </div>

            <div className="surface form-card">
              <div className="toggle-row">
                <div className="toggle-wrap">
                  {sendModes.map((item) => (
                    <button
                      className={`toggle-pill${mode === item.id ? ' active' : ''}`}
                      key={item.id}
                      onClick={() => setMode(item.id)}
                      type="button"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-row" style={{ marginBottom: 18 }}>
                {sendModes.map(({ description, icon: Icon, id, title }) => (
                  <Badge key={id} tone={mode === id ? 'purple' : 'gray'}>
                    <Icon size={14} />
                    {title}
                    {' · '}
                    {description}
                  </Badge>
                ))}
              </div>

              <form
                className="form-grid"
                onSubmit={(event) => event.preventDefault()}
              >
                <div className="field">
                  <label htmlFor="pickup">Pickup location</label>
                  <input id="pickup" placeholder="Andheri East, Mumbai" />
                </div>
                <div className="field">
                  <label htmlFor="dropoff">Drop-off location</label>
                  <input id="dropoff" placeholder="Koregaon Park, Pune" />
                </div>
                <div className="field">
                  <label htmlFor="item-type">Item type</label>
                  <select defaultValue="documents" id="item-type">
                    <option value="documents">Documents</option>
                    <option value="electronics">Electronics</option>
                    <option value="food">Food / care package</option>
                    <option value="fragile">Fragile item</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="window">Delivery window</label>
                  <input id="window" placeholder="Today, before 8 PM" />
                </div>
                <div className="field">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    placeholder="Security gate instructions, item size, or preferred contact method."
                  />
                </div>
                <div className="sticky-submit">
                  <Button fullWidth icon={<ArrowRightLeft size={18} />} type="submit">
                    {mode === 'send' ? 'Publish request' : 'Share travel route'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="reveal reveal-delay">
            <div className="section-head">
              <div className="eyebrow">Live routes</div>
              <h2>Match requests against real travel capacity.</h2>
              <p>
                Travel cards condense route, timing, item type, and pricing into a compact
                interaction pattern that still feels roomy on smaller devices.
              </p>
            </div>

            <div className="options-grid">
              {travelOptions.map((option) => (
                <Card className="travel-card" key={option.id}>
                  <div className="travel-visual">
                    <div className="route-line">
                      <span className="route-node" />
                      <span className="route-dash" />
                      <span className="route-node" />
                    </div>
                  </div>
                  <div className="route-card">
                    <div>
                      <strong>{option.route}</strong>
                      <p className="route-meta">{option.date}</p>
                    </div>
                    <span className="price">{option.rate}</span>
                  </div>
                  <div className="metric-row">
                    <Badge tone="purple">{option.itemType}</Badge>
                    <Badge tone="gray">{option.eta}</Badge>
                  </div>
                  <Button fullWidth variant="secondary">
                    Contact traveller
                  </Button>
                </Card>
              ))}
            </div>

            <div className="process-grid" style={{ marginTop: 20 }}>
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

            <div className="support-card surface" style={{ marginTop: 20 }}>
              <h3>Trust layer for logistics</h3>
              <ul className="support-list">
                <li>
                  <ShieldCheck size={16} />
                  Verified travellers and senders can be surfaced with the same badge language.
                </li>
                <li>
                  <WalletCards size={16} />
                  Clear pricing chips make trade-offs visible without adding clutter.
                </li>
                <li>
                  <Truck size={16} />
                  The layout supports quick route scanning and bottom-sheet style actions later.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
