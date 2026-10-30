import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import {
  SlidersHorizontal,
  Route,
  ArrowDown,
  ArrowUp,
  Trash2,
  Bookmark,
  MapPin,
} from "lucide-react";
import { useStore } from "../lib/store";
import {
  congestion,
  recommend,
  sentimentSummary,
  type Scenario,
  type Preferences,
} from "../lib/intelligence";
import { municipalities, type Listing } from "../lib/types";
import scenarios from "../data/ferry_scenarios.json";
import { backend } from "../lib/supabase";
import { Badge, Empty, PageTitle } from "../components/common";
import { Button } from "../components/ui/button";
import { Simulation } from "./Simulation";
import { Modal } from "../components/ui/dialog";
function ItineraryPlanner({ scenario }: { scenario: Scenario }) {
  const s = useStore();
  const [params] = useSearchParams();
  const [p, setP] = useState<Preferences>({
    days: Math.max(1, Math.min(7, Number(params.get("days")) || 2)),
    municipality:
      municipalities.find((m) => m === params.get("municipality")) ?? "Boac",
    interests:
      params
        .get("interests")
        ?.split(",")
        .filter((i) =>
          [
            "beach",
            "heritage",
            "nature",
            "culture",
            "hiking",
            "photography",
          ].includes(i),
        ) ?? (s.interests.length ? s.interests : ["beach", "heritage"]),
    budget: 1500,
    activity: "",
    saved: [],
    date: "",
  });
  const [stops, setStops] = useState<Listing[]>([]);
  const [generated, setGenerated] = useState(false);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [name, setName] = useState("My Marinduque journey");
  const [alternatives, setAlternatives] = useState<Listing[]>([]);
  const saved = s.saved.flatMap((x) => {
    const l = s.listings.find(
      (l) => l.id === x.listing_id && l.listing_type === "destination",
    );
    return l ? [l] : [];
  });
  function generate() {
    const ranked = recommend(s.listings, p, scenario);
    setStops(ranked.slice(0, p.days * 2).map((r) => r.listing));
    setAlternatives(ranked.slice(p.days * 2).map((r) => r.listing));
    setReasons(Object.fromEntries(ranked.map((r) => [r.listing.id, r.reason])));
    setGenerated(true);
  }
  function move(i: number, d: number) {
    setStops((old) => {
      const next = [...old];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  }
  return (
    <section className="card itinerary" id="itinerary">
      <div className="row">
        <Route />
        <div>
          <span className="eyebrow">MAKE IT YOUR OWN</span>
          <h2>Your island, your itinerary</h2>
        </div>
      </div>
      <p>
        Explainable suggestions, with room for detours. Distances and travel
        times are not road-routing estimates.
      </p>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
      >
        <div className="form-grid">
          <label>
            Trip duration (days)
            <input
              type="number"
              min="1"
              max="7"
              value={p.days}
              onChange={(e) =>
                setP({ ...p, days: Math.max(1, Math.min(7, +e.target.value)) })
              }
            />
          </label>
          <label>
            Starting municipality
            <select
              value={p.municipality}
              onChange={(e) => setP({ ...p, municipality: e.target.value })}
            >
              {municipalities.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Budget (₱)
            <input
              min="0"
              max="100000"
              type="number"
              value={p.budget}
              onChange={(e) => setP({ ...p, budget: +e.target.value })}
            />
          </label>
          <label>
            Travel date (optional)
            <input
              type="date"
              value={p.date}
              onChange={(e) => setP({ ...p, date: e.target.value })}
            />
          </label>
          <label>
            Activity
            <select
              value={p.activity}
              onChange={(e) => setP({ ...p, activity: e.target.value })}
            >
              <option value="">Any activity</option>
              {[
                "beach",
                "nature",
                "heritage",
                "culture",
                "hiking",
                "photography",
                "coast",
              ].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
        </div>
        <fieldset>
          <legend>Your interests</legend>
          <div className="filter-chips">
            {[
              "beach",
              "nature",
              "heritage",
              "culture",
              "hiking",
              "photography",
            ].map((a) => (
              <label className="check-chip" key={a}>
                <input
                  type="checkbox"
                  checked={p.interests.includes(a)}
                  onChange={(e) =>
                    setP({
                      ...p,
                      interests: e.target.checked
                        ? [...p.interests, a]
                        : p.interests.filter((x) => x !== a),
                    })
                  }
                />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Saved places from HOME</legend>
          {saved.length ? (
            saved.map((l) => (
              <label className="row" key={l.id}>
                <input
                  type="checkbox"
                  checked={p.saved.includes(l.id)}
                  onChange={(e) =>
                    setP({
                      ...p,
                      saved: e.target.checked
                        ? [...p.saved, l.id]
                        : p.saved.filter((x) => x !== l.id),
                    })
                  }
                />
                {l.name}
                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    setStops((old) =>
                      old.some((x) => x.id === l.id) ? old : [...old, l],
                    )
                  }
                >
                  Add manually
                </button>
              </label>
            ))
          ) : (
            <p className="muted">
              Save places from a story or destination card first.
            </p>
          )}
        </fieldset>
        <Button>
          <Route size={17} />
          {generated ? "Regenerate suggestions" : "Generate itinerary"}
        </Button>
      </form>
      {generated && !stops.length && (
        <Empty title="No verified destinations match yet">
          The seed records are unverified. An administrator must review sources
          and readiness before automatic promotion. You may add saved places
          manually, subject to local confirmation.
        </Empty>
      )}
      {stops.length > 0 && (
        <div className="itinerary-result">
          <label>
            Itinerary name
            <input
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {stops.map((l, i) => (
            <div className="itinerary-stop" key={l.id}>
              <span className="stop-number">{i + 1}</span>
              <div className="grow">
                <Link to={"/places/" + l.id}>
                  <h3>{l.name}</h3>
                </Link>
                <small>
                  Day {Math.min(p.days, 1 + Math.floor(i / 2))} ·{" "}
                  {l.metadata.activities.join(", ")}
                </small>
                <p>
                  {reasons[l.id] ??
                    "Manually selected saved place · confirm access and source information."}
                </p>
                <Badge>{l.metadata.source_label}</Badge>{" "}
                <a
                  href={l.source_url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                >
                  Source
                </a>
              </div>
              <div className="stack">
                <button
                  className="icon-button"
                  aria-label={`Move ${l.name} up`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Move ${l.name} down`}
                  disabled={i === stops.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Remove ${l.name}`}
                  onClick={() =>
                    setStops((old) => old.filter((x) => x.id !== l.id))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <p>
            Known listed costs: ₱
            {stops
              .reduce((sum, l) => sum + (l.fee_max ?? 0), 0)
              .toLocaleString()}
            . {stops.filter((l) => l.fee_max === null).length} stops have
            unverified fees. Transport, meals and accommodation are excluded;
            this is not a total trip price.
          </p>
          {alternatives.length > 0 && (
            <p>
              Alternatives:{" "}
              {alternatives.map((l) => (
                <Link key={l.id} to={"/places/" + l.id}>
                  {l.name} ·{" "}
                </Link>
              ))}
            </p>
          )}
          <Button
            onClick={() =>
              void s.run(async () => {
                const user_id = s.requireUser();
                const { error } = await backend()
                  .from("itineraries")
                  .insert({
                    user_id,
                    name,
                    stops: stops.map((l) => l.id),
                    preferences: { ...p, scenario },
                  });
                if (error) throw error;
              }, "Itinerary saved")
            }
          >
            <Bookmark size={17} />
            Save itinerary
          </Button>
        </div>
      )}
      <details>
        <summary>How suggestions are scored</summary>
        <p>
          All inputs normalized 0–1: 35% interests, 20% budget fit, 15%
          municipality proximity, 15% lower simulated crowding, 10% source
          confidence, 5% community benefit. Saved eligible places take priority.
          Unknown fees reduce confidence; they never become zero-price claims.
        </p>
      </details>
      {s.itineraries.length > 0 && (
        <div>
          <h3>Saved itineraries</h3>
          {s.itineraries.map((i) => (
            <div className="row between" key={i.id}>
              <button
                className="text-link"
                onClick={() => {
                  setName(i.name);
                  setStops(
                    i.stops.flatMap(
                      (id) => s.listings.find((l) => l.id === id) ?? [],
                    ),
                  );
                }}
              >
                {i.name} · {i.stops.length} stops
              </button>
              <button
                className="icon-button"
                aria-label={`Delete ${i.name}`}
                onClick={() =>
                  void s.run(async () => {
                    const { error } = await backend()
                      .from("itineraries")
                      .delete()
                      .eq("id", i.id);
                    if (error) throw error;
                  }, "Itinerary deleted")
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
export function MapPage() {
  const s = useStore();
  const [params] = useSearchParams();
  const [plan, setPlan] = useState(params.has("plan"));
  const [scenario, setScenario] = useState<Scenario>(scenarios[0]);
  const [filters, setFilters] = useState({
    municipality: "",
    category: "",
    activity: "",
    fee: "",
    rating: "",
    sentiment: "",
    crowding: "",
    verified: false,
  });
  const [tileError, setTileError] = useState(false);
  const [layer, setLayer] = useState("discovery");
  function markerColor(l: Listing) {
    if (layer === "sentiment") {
      const label = sentimentSummary(
        s.posts.filter((p) => p.listing_id === l.id),
      ).label;
      return {
        Positive: "#388967",
        Neutral: "#758983",
        Mixed: "#b68b3e",
        Negative: "#b65a46",
        "Insufficient data": "#818781",
      }[label];
    }
    if (layer === "congestion") {
      const category = congestion({
        ...scenario,
        baselineDemand: l.metadata.baseline,
        assumedCapacity: l.metadata.capacity,
      }).category;
      return { LOW: "#388967", MODERATE: "#b68b3e", HIGH: "#b65a46" }[category];
    }
    return "#2a7463";
  }
  const destinations = s.listings.filter(
    (l) => l.listing_type === "destination",
  );
  const filtered = destinations.filter((l) => {
    const reviews = s.posts.filter(
      (p) => p.listing_id === l.id && p.post_type === "review",
    );
    const avg = reviews.length
      ? reviews.reduce((a, p) => a + (p.rating ?? 0), 0) / reviews.length
      : 0;
    const c = congestion({
      ...scenario,
      baselineDemand: l.metadata.baseline,
      assumedCapacity: l.metadata.capacity,
    }).category;
    return (
      (!filters.municipality || l.municipality === filters.municipality) &&
      (!filters.category || l.metadata.category === filters.category) &&
      (!filters.activity || l.metadata.activities.includes(filters.activity)) &&
      (!filters.fee || (l.fee_max !== null && l.fee_max <= +filters.fee)) &&
      (!filters.rating || avg >= +filters.rating) &&
      (!filters.sentiment ||
        sentimentSummary(reviews).label === filters.sentiment) &&
      (!filters.crowding || c === filters.crowding) &&
      (!filters.verified || l.metadata.verified)
    );
  });
  return (
    <div className="page map-page">
      <PageTitle
        eyebrow="MAP · YOUR ISLAND AT A GLANCE"
        title="A new perspective on Marinduque."
        description="Find a place to pause, a story to follow, and a thoughtful way to get there."
        action={
          <Button onClick={() => setPlan(true)}>
            <Route size={18} />
            Plan a journey
          </Button>
        }
      />
      <section className="card map-filters">
        <div className="row">
          <SlidersHorizontal size={17} />
          <strong>Find your kind of place</strong>
        </div>
        <div className="filter-grid">
          {(
            [
              "municipality",
              "category",
              "activity",
              "fee",
              "rating",
              "sentiment",
              "crowding",
            ] as const
          ).map((key) => {
            const opts: Record<string, string[]> = {
              municipality: [...municipalities],
              category: [
                ...new Set(destinations.map((l) => l.metadata.category)),
              ],
              activity: [
                "beach",
                "nature",
                "heritage",
                "culture",
                "hiking",
                "photography",
              ],
              fee: ["100", "500", "1000"],
              rating: ["3", "4", "5"],
              sentiment: [
                "Positive",
                "Neutral",
                "Mixed",
                "Negative",
                "Insufficient data",
              ],
              crowding: ["LOW", "MODERATE", "HIGH"],
            };
            return (
              <label key={key}>
                {key === "crowding" ? "Simulated crowding" : key}
                <select
                  value={filters[key]}
                  onChange={(e) =>
                    setFilters({ ...filters, [key]: e.target.value })
                  }
                >
                  <option value="">All</option>
                  {opts[key].map((x) => (
                    <option value={x} key={x}>
                      {key === "fee" ? "Up to ₱" + x : x}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
          <label className="row check-label">
            <input
              type="checkbox"
              checked={filters.verified}
              onChange={(e) =>
                setFilters({ ...filters, verified: e.target.checked })
              }
            />
            Verified only
          </label>
        </div>
      </section>
      <div className="row map-layer-control">
        <label htmlFor="map-layer">Map layer</label>
        <select
          id="map-layer"
          value={layer}
          onChange={(e) => setLayer(e.target.value)}
        >
          <option value="discovery">Destination discovery</option>
          <option value="sentiment">Community review sentiment</option>
          <option value="congestion">DEMO / SIMULATED congestion</option>
        </select>
      </div>
      <p className="fine-print">
        {layer === "sentiment"
          ? "Green: positive · amber: mixed · red: negative · gray: neutral / insufficient data. Approximate community analysis; sample sizes shown in popups."
          : layer === "congestion"
            ? "Green: LOW · amber: MODERATE · red: HIGH. All visitor pressure is DEMO / SIMULATED."
            : "Select a marker or choose a destination from the accessible list."}
      </p>
      <div className="map-layout">
        <div className="map-canvas">
          <MapContainer
            center={[13.41, 121.97]}
            zoom={10}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{ tileerror: () => setTileError(true) }}
            />
            {filtered
              .filter((l) => l.latitude !== null && l.longitude !== null)
              .map((l) => (
                <Marker
                  key={l.id}
                  position={[l.latitude!, l.longitude!]}
                  icon={L.divIcon({
                    className: "custom-map-marker",
                    html: `<span style="background:${markerColor(l)}">✦</span>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                  })}
                >
                  <Popup>
                    <img
                      className="popup-image"
                      src={l.metadata.image}
                      alt="Original illustration"
                    />
                    <h3>{l.name}</h3>
                    <p>{l.description}</p>
                    <small>
                      Community reviews:{" "}
                      {
                        s.posts.filter(
                          (p) =>
                            p.listing_id === l.id &&
                            p.post_type === "review" &&
                            p.moderation_status === "published",
                        ).length
                      }{" "}
                      ·{" "}
                      {
                        sentimentSummary(
                          s.posts.filter((p) => p.listing_id === l.id),
                        ).label
                      }
                    </small>
                    <small>
                      {l.municipality} · {l.metadata.category}
                      <br />
                      Fee not verified — confirm with the operator.
                      <br />
                      {l.metadata.source_label} · Coordinates approximate
                    </small>
                    <p>
                      <Link to={"/places/" + l.id}>
                        View details & reviews →
                      </Link>
                    </p>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
          {tileError && (
            <div className="map-error" role="status">
              Map tiles unavailable. Use the destination list alongside the map.
            </div>
          )}
          <span className="map-label">
            MARINDUQUE · Coordinates are introductory, not navigation precision.
          </span>
        </div>
        <div className="map-results">
          <div className="row between">
            <h3>{filtered.length} places to discover</h3>
            <MapPin size={18} />
          </div>
          {filtered.length ? (
            filtered.map((l) => (
              <Link to={"/places/" + l.id} key={l.id} className="map-result">
                <img src={l.metadata.image} alt="" />
                <div>
                  <h3>{l.name}</h3>
                  <small>
                    {l.municipality} · {l.metadata.category}
                  </small>
                  <Badge>
                    {
                      congestion({
                        ...scenario,
                        baselineDemand: l.metadata.baseline,
                        assumedCapacity: l.metadata.capacity,
                      }).category
                    }{" "}
                    · SIMULATED
                  </Badge>
                </div>
              </Link>
            ))
          ) : (
            <Empty title="No places match">Try changing the filters.</Empty>
          )}
        </div>
      </div>
      <Simulation scenario={scenario} setScenario={setScenario} />
      <ItineraryPlanner scenario={scenario} />
      <Modal
        title="Plan your Marinduque journey"
        open={plan}
        onOpenChange={setPlan}
      >
        <ItineraryPlanner scenario={scenario} />
      </Modal>
    </div>
  );
}
