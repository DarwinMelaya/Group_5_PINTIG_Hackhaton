import React, { Suspense, lazy, useLayoutEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { StoreProvider } from "./lib/store";
import { useStore } from "./lib/store";
import { Layout } from "./components/Layout";
import { Empty, Skeleton } from "./components/common";
import { Home, PostPage, ProfilePage, Discover } from "./features/Home";
import { Hub, Detail } from "./features/Hub";
import { Auth, Settings } from "./features/Auth";
const Notifications = lazy(() =>
  import("./features/Community").then((m) => ({ default: m.Notifications })),
);
const Rini = lazy(() =>
  import("./features/Community").then((m) => ({ default: m.Rini })),
);
const Feedback = lazy(() =>
  import("./features/Community").then((m) => ({ default: m.Feedback })),
);
const Admin = lazy(() =>
  import("./features/Community").then((m) => ({ default: m.Admin })),
);
import "leaflet/dist/leaflet.css";
import "./styles.css";
import "./design-system.css";
import "./social-theme.css";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

const MapPage = lazy(() =>
  import("./features/Map").then((m) => ({ default: m.MapPage })),
);
function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authReady, session } = useStore();
  const location = useLocation();
  if (!authReady) return <Skeleton />;
  if (!session) return <Navigate to="/auth" replace state={{ from: location }} />;
  return <>{children}</>;
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="page">
        <Empty title="This page could not load">
          <button onClick={() => window.location.reload()}>
            Reload DALUYAN
          </button>
        </Empty>
      </div>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <StoreProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<Skeleton />}>
            <Routes>
              <Route path="auth" element={<Auth />} />
              <Route
                element={
                  <RequireAuth>
                    <Layout />
                  </RequireAuth>
                }
              >
                <Route index element={<Home />} />
                <Route path="map" element={<MapPage />} />
                <Route path="hub" element={<Hub />} />
                <Route path="places/:id" element={<Detail />} />
                <Route path="posts/:id" element={<PostPage />} />
                <Route path="profiles/:id" element={<ProfilePage />} />
                <Route path="discover" element={<Discover />} />
                <Route path="settings" element={<Settings />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="rini" element={<Rini />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="admin" element={<Admin />} />
                <Route
                  path="__not-found"
                  element={
                    <Empty title="This trail doesn’t lead anywhere">
                      <Link to="/">Return to HOME</Link>
                    </Empty>
                  }
                />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </StoreProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
