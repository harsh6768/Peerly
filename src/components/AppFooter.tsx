import { ShieldCheck } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { FooterWave } from './FooterWave'

const footerColumns = [
  {
    heading: 'Platform',
    items: [
      { label: 'Home', to: '/' },
      { label: 'Find Tenant', to: '/find-tenant' },
      { label: 'Send Item', to: '/send-item' },
    ],
  },
  {
    heading: 'Use Cases',
    items: [
      { label: 'Tenant discovery' },
      { label: 'Parcel matching' },
      { label: 'Route coordination' },
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
                  Verified housing discovery and route-based delivery in one high-trust
                  product experience.
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
            <span>Built mobile-first from your Trusted Network design tokens.</span>
            <span>Responsive shell, reusable cards, sticky CTAs, and seeded product data.</span>
          </div>
        </div>
      </div>

      <div className="footer-credit">
        Made with love ❤️ for a more trusted way to move, stay, and connect.
      </div>
    </footer>
  )
}
