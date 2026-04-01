import { ShieldCheck } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { FooterWave } from './FooterWave'

const footerColumns = [
  {
    heading: 'Platform',
    items: [
      { label: 'Home', to: '/' },
      { label: 'Housing', to: '/find-tenant' },
      { label: 'Profile', to: '/profile' },
    ],
  },
  {
    heading: 'Use Cases',
    items: [
      { label: 'Find a room' },
      { label: 'List a replacement' },
      { label: 'Verified profiles' },
    ],
  },
  {
    heading: 'Contact',
    items: [
      { label: 'hello@trustednetwork.app' },
      { label: 'Mumbai · Bengaluru · Gurugram' },
      { label: 'Demo environment with seeded data' },
    ],
  },
] as const

const footerBadges = [
  'Mobile-first UX',
  'Verified marketplace',
  'Fast direct contact',
] as const

export function AppFooter() {
  return (
    <footer className="footer">
      <div className="footer-wave-wrap">
        <FooterWave />
      </div>

      <div className="footer-surface">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-brand-row">
              <span className="brand-mark footer-brand-mark">
                <ShieldCheck size={18} />
              </span>
              <div>
                <strong>Trusted Network</strong>
                <p>
                  Housing-first tenant replacement marketplace with a simple intent-driven flow.
                </p>
              </div>
            </div>

            <div className="footer-badges">
              {footerBadges.map((badge) => (
                <span className="footer-chip" key={badge}>
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="footer-links">
            {footerColumns.map((column) => (
              <div className="footer-column" key={column.heading}>
                <span className="footer-heading">{column.heading}</span>
                {column.items.map((item) =>
                  'to' in item ? (
                    <NavLink key={item.label} to={item.to}>
                      {item.label}
                    </NavLink>
                  ) : (
                    <span key={item.label}>{item.label}</span>
                  ),
                )}
              </div>
            ))}
          </div>

          <div className="footer-bottom">
            <span>Housing MVP is live first. Delivery flows are documented and parked for a later phase.</span>
            <span>Find room helps seekers browse listings, and find replacement helps owners publish and manage listings.</span>
          </div>
        </div>
      </div>

      <div className="footer-credit">
        Built for a clearer way to find a room or replace a tenant.
      </div>
    </footer>
  )
}
