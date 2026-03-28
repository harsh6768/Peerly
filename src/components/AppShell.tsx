import { House, MessageSquareText, PlusSquare, ShieldCheck, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Button } from './Button'

const desktopLinks = [
  { to: '/', label: 'Home' },
  { to: '/find-tenant', label: 'Find Tenant' },
  { to: '/send-item', label: 'Send Item' },
]

const mobileLinks = [
  { to: '/', label: 'Home', icon: House },
  { to: '/send-item', label: 'Post', icon: PlusSquare },
  { to: '/find-tenant', label: 'Messages', icon: MessageSquareText },
  { to: '/find-tenant', label: 'Profile', icon: UserRound },
]

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <NavLink className="brand" to="/">
            <span className="brand-mark">
              <ShieldCheck size={20} />
            </span>
            <span className="brand-copy">
              Trusted Network
              <small>Housing + delivery OS</small>
            </span>
          </NavLink>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {desktopLinks.map((link) => (
              <NavLink
                key={link.to}
                className={({ isActive }) =>
                  `nav-link${isActive ? ' active' : ''}`
                }
                to={link.to}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="desktop-actions">
            <Button variant="ghost">Login</Button>
            <Button to="/send-item">Post need</Button>
          </div>
        </div>
      </header>

      <main className="page-main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>Built mobile-first from your Trusted Network design tokens.</span>
          <span>Responsive shell, reusable cards, sticky CTAs, and fast navigation.</span>
        </div>
      </footer>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={`${to}-${label}`}
            className={({ isActive }) => (isActive ? 'active' : '')}
            to={to}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
