import { useState, useEffect, lazy, Suspense } from "react";
import {
  NavLink,
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Home,
  Map,
  Store,
  Bell,
  Sparkles,
  Settings,
  Menu,
  Search,
  ArrowUpRight,
  LogOut,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { useStore } from "../lib/store";
import { backend } from "../lib/supabase";
import { Butterfly, WaveDivider } from "./CulturalArt";
import { Avatar, Skeleton } from "./common";
import { Modal } from "./ui/dialog";
import { Button } from "./ui/button";
const nav = [
  { to: "/", label: "HOME", icon: Home },
  { to: "/map", label: "MAP", icon: Map },
  { to: "/hub", label: "TOURISM AND CULTURE HUB", icon: Store },
  { to: "/notifications", label: "NOTIFICATIONS", icon: Bell },
  { to: "/rini", label: "RINI", icon: Sparkles },
  { to: "/settings", label: "SETTINGS", icon: Settings },
];
const RiniWidget = lazy(() =>
  import("../features/Community").then((m) => ({ default: m.Rini })),
);
export function Layout() {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setChatOpen(false);
  }, [pathname]);
  const navigate = useNavigate();
  const unread = s.events.filter(
    (e) =>
      e.recipient_id === s.session?.user.id &&
      !e.read_at &&
      [
        "notification",
        "feedback_update",
        "moderation",
        "business_review",
      ].includes(e.event_type),
  ).length;
  function navigation() {
    return (
      <>
        <Link className="brand" to="/" onClick={() => setOpen(false)}>
          <img className="brand-logo" src="/daluyan-logo-transparent.png" alt="" aria-hidden="true" />
          <span className="brand-wordmark">
            <img src="/daluyan-wordmark-transparent.png" alt="DALUYAN" />
            <small>MARINDUQUE, PHILIPPINES</small>
          </span>
        </Link>
        <div className="nav-caption">YOUR ISLAND COMPANION</div>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                "nav-link " + (isActive ? "active" : "")
              }
            >
              <n.icon size={20} />
              <span>{n.label}</span>
              {n.to === "/notifications" && unread > 0 && (
                <b className="count">{unread}</b>
              )}
            </NavLink>
          ))}
          {s.role === "admin" && (
            <NavLink
              to="/admin"
              className="nav-link"
              onClick={() => setOpen(false)}
            >
              <ShieldCheck size={20} />
              ADMINISTRATION
            </NavLink>
          )}
        </nav>
        <div className="sidebar-invite">
          <Compass size={25} />
          <h3>
            A small island.
            <br />A world of stories.
          </h3>
          <p>
            Travel thoughtfully.
            <br />
            Let local journeys lead.
          </p>
          <Link to="/map" onClick={() => setOpen(false)}>
            Explore the map <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          {s.session ? (
            <>
              <Link
                to={"/profiles/" + s.session.user.id}
                onClick={() => setOpen(false)}
                className="row"
              >
                <Avatar name={s.profile?.display_name} url={s.profile?.avatar_url} avatarType={s.profile?.avatar_type} avatarId={s.profile?.avatar_id} />
                <span>
                  <strong>{s.profile?.display_name ?? "Traveler"}</strong>
                  <small>{s.role}</small>
                </span>
              </Link>
              <button
                className="icon-button"
                aria-label="Log out"
                onClick={() =>
                  void s.run(async () => {
                    const { error } = await backend().auth.signOut();
                    if (error) throw error;
                    setOpen(false);
                  }, "Logged out")
                }
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Button asChild variant="outline">
              <Link to="/auth" onClick={() => setOpen(false)}>
                Sign in / Register
              </Link>
            </Button>
          )}
        </div>
      </>
    );
  }
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">{navigation()}</aside>
      <Modal title="Explore DALUYAN" open={open} onOpenChange={setOpen} drawer>
        <div className="drawer-navigation">{navigation()}</div>
      </Modal>
      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <form
            className="global-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/discover?q=" + encodeURIComponent(query));
            }}
          >
            <Search size={17} />
            <input
              aria-label="Search Marinduque"
              placeholder="Search places, experiences…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <div className="topbar-greeting">
            Your next story starts here <span>✦</span>
          </div>
          <Link
            to="/notifications"
            className="notification-button"
            aria-label={`Notifications, ${unread} unread`}
          >
            <Bell size={21} />
            {unread > 0 && <span>{unread}</span>}
          </Link>
          <Link
            to={s.session ? "/profile" : "/auth"}
            aria-label="Your account"
          >
            <Avatar name={s.profile?.display_name ?? "Guest"} url={s.profile?.avatar_url} avatarType={s.profile?.avatar_type} avatarId={s.profile?.avatar_id} small />
          </Link>
        </header>
        {s.needsMfa && (
          <div className="preview-banner">
            Finish your secure login:{" "}
            <Link to="/auth">verify your authenticator</Link>.
          </div>
        )}
        {s.error && (
          <div className="error-banner" role="alert">
            {s.error}{" "}
            <button onClick={() => void s.refresh()}>Retry connection</button>
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <WaveDivider />
        <footer>
          <strong className="footer-brand">
            DALUYAN<small>ROOTED IN MARINDUQUE</small>
          </strong>{" "}
          <span>
            Explore Marinduque. Share Your Journey. Shape Better Tourism.
          </span>
          <Link to="/settings">Privacy & account</Link>
        </footer>
      </div>
      <button
        className="assistant-float"
        onClick={() => setChatOpen(true)}
        aria-label="Chat with RINI"
      >
        <Sparkles size={19} />
        <span>Ask RINI</span>
      </button>
      <Modal title="Ask RINI" open={chatOpen} onOpenChange={setChatOpen}>
        <div className="widget-content">
          <Suspense fallback={<Skeleton />}>
            <RiniWidget />
          </Suspense>
        </div>
      </Modal>
      {s.toast && (
        <div className="toast" role="status">
          <Butterfly className="success-butterfly" />
          {s.toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => s.notify("")}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
