import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ExternalLink,
  MapPin,
  Bookmark,
  Plus,
  Megaphone,
  SlidersHorizontal,
} from "lucide-react";
import { useStore } from "../lib/store";
import { backend, safeLink } from "../lib/supabase";
import { municipalities } from "../lib/types";
import { sentimentSummary } from "../lib/intelligence";
import {
  Badge,
  Empty,
  ListingCard,
  PageTitle,
  Skeleton,
  Stars,
} from "../components/common";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/dialog";
import { Weather } from "../components/Weather";
import { Composer, PostCard } from "./Home";
import { ListingMediaGallery, listingCover, listingCoverAlt } from "../components/ListingMedia";
export function Hub() {
  const s = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [listingType, setListingType] = useState<"" | "enterprise" | "heritage">("");
  const [sort, setSort] = useState<"newest" | "name">("newest");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState("enterprise");
  const listings = s.listings
    .filter(
      (l) =>
        l.listing_type !== "destination" &&
        (!listingType || l.listing_type === listingType) &&
        (!category || l.metadata.category === category) &&
        (!municipality || l.municipality === municipality) &&
        (l.name + " " + l.description)
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : b.created_at.localeCompare(a.created_at),
    );
  return (
    <div className="page">
      <PageTitle
        eyebrow="DALUYAN MARKETPLACE"
        title="Find something local."
        description="Browse community advertisements for stays, food, tours, crafts, and cultural experiences. Connect directly with the people behind each listing."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={17} />
            Submit a listing
          </Button>
        }
      />
      <div className="hub-intro">
        <span><Megaphone size={13} /> LOCAL ADS · DIRECT CONNECTIONS</span>
        <h2>
          Discover island finds.
          <br />
          Support local makers.
        </h2>
        <p>Support Marinduque’s communities through mindful travel.</p>
      </div>
      <div className="card hub-filters">
        <label>
          Search
          <input
            placeholder="Stays, food, crafts, guides…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {[
              "Hotels",
              "Resorts",
              "Homestays",
              "Restaurants",
              "Tour guides",
              "Tour services",
              "Local artisans",
              "Cultural products",
              "Other tourism enterprises",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Municipality
          <select
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
          >
            <option value="">All towns</option>
            {municipalities.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "name")}>
            <option value="newest">Newest ads</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>
      <div className="marketplace-toolbar">
        <div className="marketplace-tabs" aria-label="Ad type">
          <button className={!listingType ? "active" : ""} onClick={() => setListingType("")}>All ads</button>
          <button className={listingType === "enterprise" ? "active" : ""} onClick={() => setListingType("enterprise")}>Businesses</button>
          <button className={listingType === "heritage" ? "active" : ""} onClick={() => setListingType("heritage")}>Culture &amp; heritage</button>
        </div>
        <span className="marketplace-count"><SlidersHorizontal size={14} /> {listings.length} {listings.length === 1 ? "ad" : "ads"}</span>
      </div>
      <p className="fine-print">
        Public listings are community-submitted and may require confirmation.
        DALUYAN does not provide booking, checkout, or payment processing.
      </p>
      {s.loading ? (
        <Skeleton />
      ) : listings.length ? (
        <div className="listing-grid">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <Empty title="No listings match your search" />
      )}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Share a business or cultural listing"
      >
        {!s.session ? (
          <Empty title="Sign in to request a listing">
            <Link to="/auth">Sign in</Link>
          </Empty>
        ) : (
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setBusy(true);
              void s
                .run(async () => {
                  const website = String(f.get("website") ?? "").trim();
                  if (website && !safeLink(website)?.startsWith("https://"))
                    throw new Error("Use an HTTPS website URL");
                  const { error } = await backend()
                    .from("listings")
                    .insert({
                      owner_id: s.requireUser(),
                      name: f.get("name"),
                      listing_type: kind,
                      municipality: f.get("municipality"),
                      description: f.get("description"),
                      contact_links: contactsFrom(f),
                      metadata: {
                        ...listingExtras(f),
                        category: f.get("category"),
                        activities: [],
                        image: "/landscape-1.svg",
                        verified: false,
                        source_label: "UNVERIFIED",
                        last_checked: null,
                        public_promotion: false,
                        community_benefit: 0,
                        capacity: 0,
                        baseline: 0,
                        accreditation_reference: f.get("evidence"),
                      },
                    });
                  if (error) throw error;
                  setOpen(false);
                }, "Listing submitted for review")
                .finally(() => setBusy(false));
            }}
          >
            <label>
              Submission type
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="enterprise">Business / listing claim</option>
                <option value="heritage">
                  Heritage contribution (approval required)
                </option>
              </select>
            </label>
            <label>
              Name
              <input name="name" required minLength={2} maxLength={160} />
            </label>
            <label>
              Description
              <textarea
                name="description"
                required
                minLength={10}
                maxLength={10000}
              />
            </label>
            <label>
              Municipality
              <select name="municipality">
                {municipalities.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label>
              Category
              <input
                name="category"
                required
                placeholder="e.g. Homestays or public heritage"
              />
            </label>
            <label>
              Official website (optional)
              <input type="url" name="website" placeholder="https://" />
            </label>
            <BusinessFields />
            <label>
              Accreditation / ownership / permission reference
              <input
                name="evidence"
                maxLength={1000}
                placeholder="Evidence reference for administrator review"
              />
            </label>
            <p className="fine-print">
              Submitting a claim never grants ownership of an existing listing.
              An authorized administrator must review it. Do not submit
              sensitive heritage materials without permission.
            </p>
            <Button disabled={busy}>
              {busy ? "Submitting…" : "Request review"}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
export function Detail() {
  const { id } = useParams();
  const s = useStore();
  const l = s.listings.find((l) => l.id === id);
  const [review, setReview] = useState(false);
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  if (s.loading)
    return (
      <div className="page">
        <Skeleton />
      </div>
    );
  if (!l)
    return (
      <Empty title="Place unavailable">
        This record may be awaiting approval.
      </Empty>
    );
  const reviews = s.posts.filter(
    (p) =>
      p.listing_id === id &&
      p.post_type === "review" &&
      p.moderation_status === "published",
  );
  const avg = reviews.length
    ? reviews.reduce((a, p) => a + (p.rating ?? 0), 0) / reviews.length
    : 0;
  const sentiment = sentimentSummary(reviews);
  const contacts = Object.entries(l.contact_links).filter(([, v]) =>
    safeLink(v),
  );
  return (
    <div className="page detail-page">
      <Link
        className="text-link"
        to={l.listing_type === "destination" ? "/map" : "/hub"}
      >
        ← Back to {l.listing_type === "destination" ? "MAP" : "the hub"}
      </Link>
      <div className="detail-hero">
        <img
          src={listingCover(l)}
          alt={listingCoverAlt(l)}
          loading="eager"
          decoding="async"
          onError={(event) => { event.currentTarget.src = "/landscape-1.svg"; }}
        />
        <span>ORIGINAL ILLUSTRATION · PHOTOGRAPHS PENDING VERIFIED MEDIA</span>
      </div>
      <div className="detail-grid">
        <div>
          <div className="row between">
            <Badge>{l.metadata.source_label}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                void s.run(
                  () => s.toggleSave("listing", l.id),
                  "Saved places updated",
                )
              }
            >
              <Bookmark size={16} />
              {s.saved.some((x) => x.listing_id === id)
                ? "Saved"
                : "Save place"}
            </Button>
          </div>
          <h1>{l.name}</h1>
          <p className="row muted">
            <MapPin size={17} />
            {l.municipality} · {l.metadata.category}
          </p>
          <div className="row">
            <Stars value={Math.round(avg)} />
            <span>
              {avg ? avg.toFixed(1) : "No rating yet"} · {reviews.length}{" "}
              community reviews
            </span>
          </div>
          <section className="detail-section">
            <ListingMediaGallery listing={l} />
          </section>
          <section className="detail-section">
            <h2>A little about this place</h2>
            <p>{l.description}</p>
            {l.metadata.cultural_context && (
              <p>{l.metadata.cultural_context}</p>
            )}
            <div className="filter-chips">
              {l.metadata.activities.map((a) => (
                <Badge key={a}>{a}</Badge>
              ))}
            </div>
            {l.metadata.address && <p>Public address: {l.metadata.address}</p>}
            {l.latitude !== null && (
              <p>
                Approximate coordinates: {l.latitude}, {l.longitude}. Confirm
                access and route locally.
              </p>
            )}
          </section>
          <section className="card source-card">
            <h3>Know before you go</h3>
            <p>
              {l.fee_status === "unverified" || l.fee_min === null
                ? "Fee not verified — confirm with the operator."
                : `Estimated listed fee: ₱${l.fee_min}–₱${l.fee_max ?? l.fee_min} · ${l.fee_status}`}
            </p>
            {safeLink(l.fee_source_url ?? undefined) && (
              <a href={l.fee_source_url!} target="_blank" rel="noreferrer">
                Fee evidence
              </a>
            )}
            <p>
              Source review: {l.metadata.last_checked ?? "Not yet checked"}.{" "}
              {l.metadata.verified
                ? "Platform reviewed; confirm current conditions."
                : "This introductory record has not been independently verified."}
            </p>
            {safeLink(l.source_url ?? undefined) && (
              <a href={l.source_url!} target="_blank" rel="noreferrer">
                Original source reference <ExternalLink size={14} />
              </a>
            )}
          </section>
          {l.listing_type !== "destination" && (
            <section className="detail-section">
              <h2>Connect directly</h2>
              <Badge>{l.accreditation_status}</Badge>
              <p>
                DALUYAN cannot issue DOT accreditation.{" "}
                <a
                  href="https://accreditation.tourism.gov.ph/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Official DOT portal
                </a>
              </p>
              {l.metadata.services && (
                <p>Services: {l.metadata.services.join(", ")}</p>
              )}
              {l.metadata.amenities?.length ? (
                <p>Amenities: {l.metadata.amenities.join(", ")}</p>
              ) : null}
              {contacts.length ? (
                <div className="row wrap">
                  {contacts.map(([k, v]) => (
                    <Button key={k} asChild variant="outline">
                      <a href={v} target="_blank" rel="noreferrer">
                        {k}
                        <ExternalLink size={14} />
                      </a>
                    </Button>
                  ))}
                </div>
              ) : (
                <p>Contact information unavailable.</p>
              )}
              <p className="fine-print">
                Coordinate through existing external channels. No in-app
                reservations or transactions.
              </p>
            </section>
          )}
          <section className="detail-section">
            <div className="row between">
              <h2>Community reviews</h2>
              {l.listing_type !== "heritage" && (
                <Button size="sm" onClick={() => setReview(true)}>
                  Write a review
                </Button>
              )}
            </div>
            <p>
              Approximate sentiment: <Badge>{sentiment.label}</Badge> · sample
              size {sentiment.total}. Community opinions, not verified outcomes.
            </p>
            <div className="row wrap">
              {Object.entries(sentiment.counts).map(([label, count]) => (
                <small key={label}>
                  {label}: {count}{" "}
                </small>
              ))}
            </div>
            <details>
              <summary>Topics in published reviews</summary>
              {Object.entries(sentiment.topics).map(([k, n]) => (
                <p key={k}>
                  {k}: {n}
                </p>
              ))}
            </details>
            {reviews.length ? (
              reviews.map((p) => <PostCard key={p.id} post={p} />)
            ) : (
              <Empty title="No reviews yet">
                Share a helpful, respectful review after your visit.
              </Empty>
            )}
          </section>
          {(l.owner_id === s.session?.user.id || s.isAdmin) && (
            <Button onClick={() => setEdit(true)}>
              Manage authorized listing information
            </Button>
          )}
        </div>
        <aside>
          {l.latitude !== null && l.longitude !== null && (
            <Weather
              latitude={l.latitude}
              longitude={l.longitude}
              location={l.municipality}
            />
          )}
          <section className="panel-section">
            <h3>More in {l.municipality}</h3>
            {s.listings
              .filter((x) => x.municipality === l.municipality && x.id !== l.id)
              .slice(0, 3)
              .map((x) => (
                <Link className="map-result" key={x.id} to={"/places/" + x.id}>
                  <img src={x.metadata.image} alt="" />
                  <strong>{x.name}</strong>
                </Link>
              ))}
          </section>
        </aside>
      </div>
      <Composer
        key={l.id}
        open={review}
        setOpen={setReview}
        listingId={l.id}
        review
      />
      <Modal open={edit} onOpenChange={setEdit} title="Manage your listing">
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            void s
              .run(async () => {
                const website = String(f.get("website") ?? "");
                if (website && !safeLink(website)?.startsWith("https://"))
                  throw new Error("Use an HTTPS contact");
                const { error } = await backend()
                  .from("listings")
                  .update({
                    name: f.get("name"),
                    description: f.get("description"),
                    contact_links: contactsFrom(f),
                    metadata: { ...l.metadata, ...listingExtras(f) },
                    ...(s.isAdmin
                      ? {
                          latitude: f.get("latitude")
                            ? Number(f.get("latitude"))
                            : null,
                          longitude: f.get("longitude")
                            ? Number(f.get("longitude"))
                            : null,
                          fee_min: f.get("fee_min")
                            ? Number(f.get("fee_min"))
                            : null,
                          fee_max: f.get("fee_max")
                            ? Number(f.get("fee_max"))
                            : null,
                          fee_status: f.get("fee_status"),
                          fee_source_url: f.get("fee_source_url") || null,
                          metadata: {
                            ...l.metadata,
                            ...listingExtras(f),
                            category: String(f.get("category")),
                            activities: String(f.get("activities"))
                              .split(",")
                              .map((a) => a.trim())
                              .filter(Boolean),
                          },
                        }
                      : {}),
                  })
                  .eq("id", l.id);
                if (error) throw error;
                setEdit(false);
              }, "Listing updated")
              .finally(() => setBusy(false));
          }}
        >
          <label>
            Name
            <input name="name" defaultValue={l.name} required />
          </label>
          <label>
            Description
            <textarea
              name="description"
              defaultValue={l.description}
              required
              minLength={10}
            />
          </label>
          <label>
            Official website
            <input
              name="website"
              type="url"
              defaultValue={l.contact_links.website ?? ""}
            />
          </label>
          <BusinessFields listing={l} />
          {s.isAdmin && (
            <>
              <div className="form-grid">
                <label>
                  Latitude
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    defaultValue={l.latitude ?? ""}
                  />
                </label>
                <label>
                  Longitude
                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    defaultValue={l.longitude ?? ""}
                  />
                </label>
                <label>
                  Minimum fee
                  <input
                    name="fee_min"
                    type="number"
                    min="0"
                    defaultValue={l.fee_min ?? ""}
                  />
                </label>
                <label>
                  Maximum fee
                  <input
                    name="fee_max"
                    type="number"
                    min="0"
                    defaultValue={l.fee_max ?? ""}
                  />
                </label>
              </div>
              <label>
                Fee status
                <select name="fee_status" defaultValue={l.fee_status}>
                  <option>unverified</option>
                  <option>estimated</option>
                  <option>verified</option>
                </select>
              </label>
              <label>
                Fee evidence URL
                <input
                  name="fee_source_url"
                  type="url"
                  defaultValue={l.fee_source_url ?? ""}
                />
              </label>
              <label>
                Category
                <input
                  name="category"
                  defaultValue={l.metadata.category}
                  required
                />
              </label>
              <label>
                Activities, comma separated
                <input
                  name="activities"
                  defaultValue={l.metadata.activities.join(", ")}
                />
              </label>
            </>
          )}
          <p>
            Verification, publication and accreditation require administrator
            review.
          </p>
          <Button disabled={busy}>Save permitted information</Button>
        </form>
      </Modal>
    </div>
  );
}

function contactsFrom(f: FormData) {
  const out: Record<string, string> = {};
  for (const k of ["website", "facebook", "instagram"]) {
    const value = String(f.get(k) ?? "").trim();
    if (value) {
      if (!safeLink(value)?.startsWith("https://"))
        throw new Error(
          "External websites and social profiles must use HTTPS.",
        );
      out[k] = value;
    }
  }
  const email = String(f.get("email") ?? "").trim();
  if (email) out.email = "mailto:" + email;
  const phone = String(f.get("phone") ?? "").trim();
  if (phone) {
    if (!/^[+0-9 ()-]{5,30}$/.test(phone))
      throw new Error("Enter a valid public phone number");
    out.phone = "tel:" + phone.replace(/[ ()-]/g, "");
  }
  return out;
}
function listingExtras(f: FormData) {
  return {
    services: String(f.get("services") ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    amenities: String(f.get("amenities") ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    address: String(f.get("address") ?? "").trim(),
  };
}
function BusinessFields({
  listing,
}: {
  listing?: import("../lib/types").Listing;
}) {
  return (
    <>
      <div className="form-grid">
        {["facebook", "instagram"].map((k) => (
          <label key={k}>
            {k === "facebook" ? "Facebook" : "Instagram"} URL
            <input
              name={k}
              type="url"
              defaultValue={listing?.contact_links[k] ?? ""}
              placeholder="https://"
            />
          </label>
        ))}
        <label>
          Public email
          <input
            name="email"
            type="email"
            defaultValue={
              listing?.contact_links.email?.replace(/^mailto:/, "") ?? ""
            }
          />
        </label>
        <label>
          Public telephone
          <input
            name="phone"
            type="tel"
            defaultValue={
              listing?.contact_links.phone?.replace(/^tel:/, "") ?? ""
            }
          />
        </label>
      </div>
      <label>
        Public address (subject to review)
        <input
          name="address"
          maxLength={500}
          defaultValue={listing?.metadata.address ?? ""}
        />
      </label>
      <label>
        Services, comma separated
        <input
          name="services"
          maxLength={1000}
          defaultValue={listing?.metadata.services?.join(", ") ?? ""}
        />
      </label>
      <label>
        Amenities, comma separated
        <input
          name="amenities"
          maxLength={1000}
          defaultValue={listing?.metadata.amenities?.join(", ") ?? ""}
        />
      </label>
    </>
  );
}
