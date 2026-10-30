import { useState } from "react";
import { ExternalLink, ImageOff } from "lucide-react";
import type { Listing } from "../lib/types";
import { safeLink } from "../lib/supabase";

function approvedMedia(listing: Listing) {
  return (listing.metadata.media_gallery ?? []).filter(
    (media) => media.approved && media.rights_status === "authorized" && safeLink(media.url),
  );
}

export function listingCover(listing: Listing) {
  return approvedMedia(listing)[0]?.url ?? listing.metadata.image ?? "/landscape-1.svg";
}

export function listingCoverAlt(listing: Listing) {
  return approvedMedia(listing)[0]?.alt ?? `Illustration for ${listing.name}; authentic photographs are pending approval`;
}

export function ListingMediaGallery({ listing }: { listing: Listing }) {
  const media = approvedMedia(listing);
  const [selected, setSelected] = useState(0);
  const sources = (listing.metadata.photo_source_urls ?? []).filter((url) => safeLink(url));

  if (!media.length) {
    return (
      <section className="media-verification-card" aria-label="Media verification status">
        <div className="media-fallback" role="img" aria-label={`Illustration for ${listing.name}`}>
          <ImageOff size={24} />
          <span>Authentic enterprise photos awaiting authorization</span>
        </div>
        <div>
          <strong>Photo status: awaiting authorized media</strong>
          <p>Public source pages are references only. DALUYAN will publish a photograph after the owner or rights holder confirms permission.</p>
          {sources.length > 0 && (
            <div className="media-source-links">
              <span>Research sources:</span>
              {sources.map((source) => (
                <a key={source} href={source} target="_blank" rel="noreferrer">View source <ExternalLink size={12} /></a>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  const selectedMedia = media[Math.min(selected, media.length - 1)];
  return (
    <section className="listing-media-gallery" aria-label={`${listing.name} photo gallery`}>
      <div className="listing-media-main">
        <img src={selectedMedia.url} alt={selectedMedia.alt} loading="eager" decoding="async" sizes="(max-width: 800px) 100vw, 760px" onError={(event) => { event.currentTarget.style.display = "none"; }} />
      </div>
      {media.length > 1 && <div className="listing-media-thumbs">{media.map((item, index) => <button key={item.id} type="button" className={index === selected ? "active" : ""} onClick={() => setSelected(index)} aria-label={`Show photo ${index + 1}`}><img src={item.url} alt="" loading="lazy" decoding="async" /></button>)}</div>}
      <p className="media-attribution">Authorized media · {selectedMedia.attribution ?? "Owner-provided"}</p>
    </section>
  );
}
