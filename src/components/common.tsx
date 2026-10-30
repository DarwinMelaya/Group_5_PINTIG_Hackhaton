import { Link } from "react-router-dom";
import {
  MapPin,
  Star,
  ArrowUpRight,
  Bookmark,
  Facebook,
  Globe2,
  Instagram,
  Mail,
  Phone,
} from "lucide-react";
import { MorionMask } from "./CulturalArt";
import type { Listing } from "../lib/types";
import { useStore } from "../lib/store";
import { Button } from "./ui/button";
import { profilePicture } from "../lib/avatars";
import { safeLink } from "../lib/supabase";
import { listingCover, listingCoverAlt } from "./ListingMedia";
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
export function Avatar({
  name = "Traveler",
  url,
  avatarType,
  avatarId,
  small = false,
}: {
  name?: string;
  url?: string | null;
  avatarType?: string | null;
  avatarId?: string | null;
  small?: boolean;
}) {
  return (
    <span
      className={"avatar " + (small ? "avatar-sm" : "")}
      role="img"
      aria-label={name}
    >
      {profilePicture({ avatar_type: avatarType, avatar_id: avatarId, avatar_url: url }) ? <img src={profilePicture({ avatar_type: avatarType, avatar_id: avatarId, avatar_url: url }) ?? ""} alt="" /> : <MorionMask />}
    </span>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <MorionMask className="empty-mask" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
export function Skeleton() {
  return (
    <div className="card skeleton" aria-label="Loading content" role="status">
      <MorionMask className="loading-mask" />
      <span>Gathering island stories…</span>
    </div>
  );
}
export function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange?: (n: number) => void;
}) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            type="button"
            aria-label={`Rate ${n} stars`}
            key={n}
            onClick={() => onChange(n)}
          >
            <Star size={18} fill={n <= value ? "currentColor" : "none"} />
          </button>
        ) : (
          <Star key={n} size={14} fill={n <= value ? "currentColor" : "none"} />
        ),
      )}
    </span>
  );
}
export function ListingCard({ listing: l }: { listing: Listing }) {
  const s = useStore();
  const contactLabels: Record<string, string> = {
    website: "Website",
    facebook: "Facebook",
    instagram: "Instagram",
    email: "Email",
    phone: "Call",
  };
  const contactIcons: Record<string, React.ReactNode> = {
    website: <Globe2 size={13} />,
    facebook: <Facebook size={13} />,
    instagram: <Instagram size={13} />,
    email: <Mail size={13} />,
    phone: <Phone size={13} />,
  };
  const contacts = Object.entries(l.contact_links)
    .filter(([key, value]) => contactLabels[key] && safeLink(value))
    .slice(0, 3);
  const reviews = s.posts.filter(
    (p) =>
      p.listing_id === l.id &&
      p.post_type === "review" &&
      p.moderation_status === "published",
  );
  const avg = reviews.length
    ? reviews.reduce((a, p) => a + (p.rating ?? 0), 0) / reviews.length
    : 0;
  return (
    <article className="card listing-card">
      <Link to={"/places/" + l.id} className="listing-image">
        <img
          src={listingCover(l)}
          alt={listingCoverAlt(l)}
          loading="lazy"
          decoding="async"
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
          onError={(event) => { event.currentTarget.src = "/landscape-1.svg"; }}
        />
        <span className="image-tag">{l.metadata.category}</span>
      </Link>
      <button
        className={
          "save-floating " +
          (s.saved.some((x) => x.listing_id === l.id) ? "saved" : "")
        }
        aria-label={`Save ${l.name}`}
        onClick={() =>
          void s.run(
            () => s.toggleSave("listing", l.id),
            "Saved places updated",
          )
        }
      >
        <Bookmark size={18} />
      </button>
      <div className="listing-body">
        <div className="row between">
          <span className="eyebrow">{l.municipality}</span>
          <span className="rating">
            <Star size={13} />
            {avg ? avg.toFixed(1) : "New"} <small>({reviews.length})</small>
          </span>
        </div>
        <Link to={"/places/" + l.id}>
          <h3>{l.name}</h3>
        </Link>
        <p>{l.description}</p>
        {contacts.length > 0 && (
          <div className="listing-contact-links" aria-label={`Contact ${l.name}`}>
            {contacts.map(([key, value]) => (
              <a
                key={key}
                href={safeLink(value)}
                target={value.startsWith("http") ? "_blank" : undefined}
                rel={value.startsWith("http") ? "noreferrer" : undefined}
                aria-label={`${contactLabels[key]} for ${l.name}`}
                title={contactLabels[key]}
              >
                {contactIcons[key]}
                <span>{contactLabels[key]}</span>
              </a>
            ))}
          </div>
        )}
        <div className="row between listing-card-footer">
          <Badge>{l.metadata.source_label}</Badge>
          <Link to={"/places/" + l.id} aria-label={`Explore ${l.name}`}>
            <span>View ad</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Location({ name }: { name: string }) {
  return (
    <span className="muted row">
      <MapPin size={14} />
      {name}
    </span>
  );
}
export function AuthPrompt() {
  return (
    <Empty title="Your journey starts here">
      Sign in to publish, save places and receive private updates.{" "}
      <Button asChild size="sm">
        <Link to="/auth">Sign in</Link>
      </Button>
    </Empty>
  );
}
export function dateTime(date: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(date));
}
