import {
  Bell,
  ClipboardList,
  LayoutGrid,
  MessageCircle,
  PlusSquare,
  Search,
  UserRound,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppFooter } from "./AppFooter";
import { Button } from "./Button";
import { useAppAuth } from "../context/AppAuthContext";
import { apiRequest } from "../lib/api";
import {
  housingIntentValues,
  useHousingIntent,
} from "../context/HousingIntentContext";
import cirvoLogo from "../assets/cirvo_black.png";

const desktopLinks = [
  { to: "/", label: "Home" },
  { to: "/find-tenant", label: "Housing" },
  { to: "/profile", label: "Profile" },
];

export function AppShell() {
  const {
    configured,
    isLoading,
    isSyncing,
    sessionToken,
    signInWithGoogle,
    user,
  } = useAppAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { intent, setIntent } = useHousingIntent();
  const navigate = useNavigate();
  const location = useLocation();

  const isTenantReplacement = intent === housingIntentValues.tenantReplacement;

  const inboxTo = isTenantReplacement
    ? "/find-tenant/host/inquiries"
    : "/find-tenant/inquiries";

  /** Tenant replacement: compose new listing. Find room: room-need form (never /find-tenant/host — that path forces TR intent). */
  const postTo =
    user && isTenantReplacement
      ? "/find-tenant/host/listings/new"
      : user
        ? "/find-tenant/needs"
        : "/profile";

  const findRoomPostsTo = user ? "/find-tenant/posts" : "/profile";
  const findRoomInquiriesTo = user ? "/find-tenant/inquiries" : "/profile";

  const mobileFirstTabTo = isTenantReplacement
    ? user
      ? "/find-tenant/host"
      : "/profile"
    : "/find-tenant";

  const isMobileFirstTabActive = isTenantReplacement
    ? user
      ? location.pathname === "/find-tenant/host"
      : location.pathname.startsWith("/profile")
    : location.pathname === "/find-tenant" ||
      location.pathname.startsWith("/find-tenant/listings/");

  const findRoomBrowseActive =
    !isTenantReplacement &&
    (location.pathname === "/find-tenant" ||
      location.pathname.startsWith("/find-tenant/listings/"));

  const isHousingRoute = location.pathname.startsWith("/find-tenant");

  useEffect(() => {
    if (!sessionToken) {
      setUnreadNotifications(0);
      return;
    }
    const load = () => {
      void apiRequest<{ unreadCount: number }>("/notifications/unread-count", {
        token: sessionToken,
      })
        .then((r) => setUnreadNotifications(r.unreadCount))
        .catch(() => {
          setUnreadNotifications(0);
        });
    };
    void load();
    const interval = window.setInterval(load, 60_000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [sessionToken, location.pathname]);

  return (
    <div className="app-shell">
      <div className="site-header-group">
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
                    `nav-link${isActive ? " active" : ""}`
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
                  {isHousingRoute ? (
                    <div
                      aria-label="Housing intent"
                      className="toggle-wrap header-intent-toggle"
                      data-intent={intent}
                    >
                      <button
                        className={`toggle-pill${!isTenantReplacement ? " active" : ""}`}
                        onClick={() => {
                          setIntent(housingIntentValues.findRoom);
                          navigate("/find-tenant");
                        }}
                        type="button"
                      >
                        Find room
                      </button>
                      <button
                        className={`toggle-pill${isTenantReplacement ? " active" : ""}`}
                        onClick={() => {
                          setIntent(housingIntentValues.tenantReplacement);
                          navigate("/find-tenant/host");
                        }}
                        type="button"
                      >
                        Tenant replacement
                      </button>
                    </div>
                  ) : null}
                  <NavLink
                    aria-label="Notifications"
                    className="header-notifications"
                    to="/notifications"
                  >
                    <Bell size={20} strokeWidth={2} />
                    {unreadNotifications > 0 ? (
                      <span className="header-notifications-badge">
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </span>
                    ) : null}
                  </NavLink>
                  <NavLink className="header-user-chip" to="/profile">
                    <span
                      className={`header-user-status${user.isVerified ? " verified" : ""}`}
                    />
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
                  <NavLink
                    aria-label="Notifications"
                    className="header-notifications"
                    to="/notifications"
                  >
                    <Bell size={20} strokeWidth={2} />
                    {unreadNotifications > 0 ? (
                      <span className="header-notifications-badge">
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </span>
                    ) : null}
                  </NavLink>
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

        {user && isHousingRoute ? (
          <div
            aria-label="Housing workspace"
            className="housing-intent-strip"
            role="region"
          >
            <div className="housing-intent-strip-inner">
              <div className="mobile-intent-toggle" data-intent={intent}>
                <button
                  className={`toggle-pill${!isTenantReplacement ? " active" : ""}`}
                  onClick={() => {
                    setIntent(housingIntentValues.findRoom);
                    navigate("/find-tenant");
                  }}
                  type="button"
                >
                  Find room
                </button>
                <button
                  className={`toggle-pill${isTenantReplacement ? " active" : ""}`}
                  onClick={() => {
                    setIntent(housingIntentValues.tenantReplacement);
                    navigate("/find-tenant/host");
                  }}
                  type="button"
                >
                  Replace tenant
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <main className="page-main">
        <div className="page-route-enter" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      <AppFooter />

      <nav
        aria-label="Mobile navigation"
        className={`mobile-nav${isTenantReplacement ? "" : " mobile-nav-find-room"}`}
      >
        {isTenantReplacement ? (
          <>
            <NavLink
              className={() => (isMobileFirstTabActive ? "active" : "")}
              end
              to={mobileFirstTabTo}
            >
              <LayoutGrid size={20} />
              <span>Listings</span>
            </NavLink>
            <NavLink
              className={() =>
                user &&
                location.pathname.startsWith("/find-tenant/host/listings")
                  ? "active"
                  : ""
              }
              to={postTo}
            >
              <PlusSquare size={20} />
              <span>Post</span>
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive ||
                location.pathname.startsWith("/find-tenant/host/inquiries")
                  ? "active"
                  : ""
              }
              to={inboxTo}
            >
              <MessageCircle size={20} />
              <span>Inquiry</span>
            </NavLink>
            <NavLink
              className={({ isActive }) => (isActive ? "active" : "")}
              to="/profile"
            >
              <UserRound size={20} />
              <span>Profile</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              className={() => (findRoomBrowseActive ? "active" : "")}
              to="/find-tenant"
            >
              <Search size={20} />
              <span>Browse</span>
            </NavLink>
            <NavLink
              className={() =>
                location.pathname.startsWith("/find-tenant/needs")
                  ? "active"
                  : ""
              }
              to={postTo}
            >
              <PlusSquare size={20} />
              <span>Room need</span>
            </NavLink>
            <NavLink
              className={() =>
                location.pathname.startsWith("/find-tenant/posts")
                  ? "active"
                  : ""
              }
              to={findRoomPostsTo}
            >
              <ClipboardList size={20} />
              <span>Room posts</span>
            </NavLink>
            <NavLink
              className={() =>
                location.pathname.startsWith("/find-tenant/inquiries")
                  ? "active"
                  : ""
              }
              to={findRoomInquiriesTo}
            >
              <MessageCircle size={20} />
              <span>Inquiry</span>
            </NavLink>
            <NavLink
              className={({ isActive }) => (isActive ? "active" : "")}
              to="/profile"
            >
              <UserRound size={20} />
              <span>Profile</span>
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
}
