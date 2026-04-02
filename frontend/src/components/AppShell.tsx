import { House, Search, ShieldCheck, UserRound } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppFooter } from './AppFooter'
import { Button } from './Button'
import { useAppAuth } from '../context/AppAuthContext'
import { housingIntentValues, useHousingIntent } from '../context/HousingIntentContext'

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
  const { setIntent } = useHousingIntent()
  const location = useLocation()
  const navigate = useNavigate()
  const activeHeaderIntent =
    location.pathname.startsWith('/find-tenant/host')
      ? housingIntentValues.tenantReplacement
      : housingIntentValues.findRoom

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
              <small>Housing MVP</small>
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
                  data-intent={activeHeaderIntent}
                >
                  <button
                    className={`toggle-pill${activeHeaderIntent === housingIntentValues.findRoom ? ' active' : ''}`}
                    onClick={() => {
                      setIntent(housingIntentValues.findRoom)
                      navigate('/find-tenant')
                    }}
                    type="button"
                  >
                    Find room
                  </button>
                  <button
                    className={`toggle-pill${activeHeaderIntent === housingIntentValues.tenantReplacement ? ' active' : ''}`}
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
