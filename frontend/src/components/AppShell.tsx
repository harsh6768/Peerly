import { MessageCircle, PlusSquare, Search, UserRound } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
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

export function AppShell() {
  const { configured, isLoading, isSyncing, signInWithGoogle, user } = useAppAuth()
  const { intent, setIntent } = useHousingIntent()
  const navigate = useNavigate()
  const location = useLocation()

  const inboxTo = intent === housingIntentValues.tenantReplacement
    ? '/find-tenant/host/inquiries'
    : '/find-tenant/inquiries'

  const postTo = user ? '/find-tenant/host' : '/profile'

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

          {/* Mobile-only: intent toggle + auth — hidden on desktop via CSS */}
          <div className="mobile-header-actions">
            {user ? (
              <div
                aria-label="Housing intent"
                className="toggle-wrap mobile-intent-toggle"
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
                  Replace tenant
                </button>
              </div>
            ) : (
              <Button
                className="mobile-signin-btn"
                disabled={!configured || isLoading || isSyncing}
                onClick={() => void signInWithGoogle()}
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="page-main">
        <div className="page-route-enter" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      <AppFooter />

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink
          className={({ isActive }) => (isActive ? 'active' : '')}
          end
          to="/find-tenant"
        >
          <Search size={20} />
          <span>Browse</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => (isActive ? 'active' : '')}
          to={postTo}
        >
          <PlusSquare size={20} />
          <span>Post</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            (isActive || location.pathname.includes('/inquiries') ? 'active' : '')
          }
          to={inboxTo}
        >
          <MessageCircle size={20} />
          <span>Inbox</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => (isActive ? 'active' : '')}
          to="/profile"
        >
          <UserRound size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  )
}
