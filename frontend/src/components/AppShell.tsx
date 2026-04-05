import { House, Search, UserRound } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AppFooter } from './AppFooter'
import { Button } from './Button'
import { useAppAuth } from '../context/AppAuthContext'
import { housingIntentValues, useHousingIntent } from '../context/HousingIntentContext'
import cirvoLogo from '../assets/cirvo_black.png'

const desktopLinks = [
  { to: '/', label: 'Home' },
  { to: '/find-tenant', label: 'Housing' },
  { to: '/profile', label: 'Profile' },
]

const mobileLinks = [
  { to: '/', label: 'Home', icon: House },
  { to: '/find-tenant', label: 'Housing', icon: Search },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function AppShell() {
  const { configured, isLoading, isSyncing, signInWithGoogle, user } = useAppAuth()
  const { intent, setIntent } = useHousingIntent()
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <NavLink className="brand" to="/">
            <span className="brand-mark brand-mark-header">
              <img alt="Cirvo" className="brand-mark-image" src={cirvoLogo} />
            </span>
            <span className="brand-copy">
              Cirvo
              <small>Find room · Replace tenant</small>
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
                <div
                  aria-label="Housing intent"
                  className="toggle-wrap header-intent-toggle"
                  data-intent={intent}
                >
                  <button
                    className={`toggle-pill${intent === housingIntentValues.findRoom ? ' active' : ''}`}
                    onClick={() => {
                      setIntent(housingIntentValues.findRoom)
                      navigate('/find-tenant')
                    }}
                    type="button"
                  >
                    Find room
                  </button>
                  <button
                    className={`toggle-pill${intent === housingIntentValues.tenantReplacement ? ' active' : ''}`}
                    onClick={() => {
                      setIntent(housingIntentValues.tenantReplacement)
                      navigate('/find-tenant/host')
                    }}
                    type="button"
                  >
                    Tenant replacement
                  </button>
                </div>
                <NavLink className="header-user-chip" to="/profile">
                  <span className={`header-user-status${user.isVerified ? ' verified' : ''}`} />
                  <span>{user.name}</span>
                </NavLink>
              </>
            ) : (
              <>
                <Button to="/profile" variant="ghost">
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
