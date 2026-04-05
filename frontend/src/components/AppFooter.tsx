import { NavLink } from 'react-router-dom'
import cirvoLogo from '../assets/cirvo_white.png'
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
      { label: 'hello@cirvo.in' },
      { label: 'Mumbai · Bengaluru · Gurugram' },
      { label: 'Built for fast, trusted housing moves' },
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
                <img alt="Cirvo" className="brand-mark-image" src={cirvoLogo} />
              </span>
              <div>
                <strong>Cirvo</strong>
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
            <span>Cirvo helps people discover rooms faster and manage tenant replacements with less friction.</span>
            <span>Find room is built for seekers, and tenant replacement is built for hosts managing live availability.</span>
          </div>
        </div>
      </div>

      <div className="footer-credit">
        Built for a clearer way to find a room or replace a tenant.
      </div>
    </footer>
  )
}
