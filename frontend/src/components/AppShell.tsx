import { House, LogOut, MessageSquareText, PlusSquare, ShieldCheck, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { AppFooter } from './AppFooter'
import { Button } from './Button'
import { useAppAuth } from '../context/AppAuthContext'

const desktopLinks = [
  { to: '/', label: 'Home' },
  { to: '/auth', label: 'Trust Center' },
  { to: '/find-tenant', label: 'Housing' },
  { to: '/send-item', label: 'Delivery' },
]

const mobileLinks = [
  { to: '/', label: 'Home', icon: House },
  { to: '/find-tenant', label: 'Housing', icon: UserRound },
  { to: '/send-item', label: 'Delivery', icon: PlusSquare },
  { to: '/auth', label: 'Trust', icon: MessageSquareText },
]

export function AppShell() {
  const { configured, isLoading, isSyncing, signInWithGoogle, signOut, user } = useAppAuth()

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
            {user ? (
              <>
                <NavLink className="header-user-chip" to="/auth">
                  <span className={`header-user-status${user.isVerified ? ' verified' : ''}`} />
                  <span>{user.name}</span>
                </NavLink>
                <Button icon={<LogOut size={16} />} onClick={() => void signOut()} variant="ghost">
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button to="/auth" variant="ghost">
                  Login
                </Button>
                <Button
                  disabled={!configured || isLoading || isSyncing}
                  onClick={() => void signInWithGoogle()}
                >
                  Continue with Google
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="page-main">
        <Outlet />
      </main>

      <AppFooter />

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
