import { Bell, MessageCircle, PlusSquare, Search, UserRound } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppFooter } from './AppFooter'
import { Button } from './Button'
import { useAppAuth } from '../context/AppAuthContext'
import { apiRequest } from '../lib/api'
import { housingIntentValues, useHousingIntent } from '../context/HousingIntentContext'
import cirvoLogo from '../assets/cirvo_black.png'

const desktopLinks = [
  { to: '/', label: 'Home' },
  { to: '/find-tenant', label: 'Housing' },
  { to: '/profile', label: 'Profile' },
]

export function AppShell() {
  const { configured, isLoading, isSyncing, sessionToken, signInWithGoogle, user } = useAppAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const { intent, setIntent } = useHousingIntent()
  const navigate = useNavigate()
  const location = useLocation()

  const inboxTo = intent === housingIntentValues.tenantReplacement
    ? '/find-tenant/host/inquiries'
    : '/find-tenant/inquiries'

  const postTo = user ? '/find-tenant/host' : '/profile'

  useEffect(() => {
    if (!sessionToken) {
      setUnreadNotifications(0)
      return
    }
    const load = () => {
      void apiRequest<{ unreadCount: number }>('/notifications/unread-count', { token: sessionToken })
        .then((r) => setUnreadNotifications(r.unreadCount))
        .catch(() => {
          setUnreadNotifications(0)
        })
    }
    void load()
    const interval = window.setInterval(load, 60_000)
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [sessionToken, location.pathname])

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
                <NavLink aria-label="Notifications" className="header-notifications" to="/notifications">
                  <Bell size={20} strokeWidth={2} />
                  {unreadNotifications > 0 ? (
                    <span className="header-notifications-badge">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  ) : null}
                </NavLink>
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
              <>
                <NavLink aria-label="Notifications" className="header-notifications" to="/notifications">
                  <Bell size={20} strokeWidth={2} />
                  {unreadNotifications > 0 ? (
                    <span className="header-notifications-badge">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  ) : null}
                </NavLink>
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
              </>
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
