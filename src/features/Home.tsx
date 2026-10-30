import { useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ImagePlus,
  MapPin,
  MessageCircle,
  Heart,
  Share2,
  Bookmark,
  Flag,
  ArrowUpRight,
  Plus,
  Pencil,
  Trash2,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../lib/store";
import { rankFeed } from "../lib/intelligence";
import { municipalities, type Post } from "../lib/types";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/dialog";
import {
  Avatar,
  Badge,
  Empty,
  ListingCard,
  Skeleton,
  Stars,
  dateTime,
} from "../components/common";
import { Butterfly } from "../components/CulturalArt";
import { Weather } from "../components/Weather";
export function Composer({
  open,
  setOpen,
  listingId,
  review = false,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  listingId?: string;
  review?: boolean;
}) {
  const s = useStore();
  const [body, setBody] = useState("");
  const [listing, setListing] = useState(listingId ?? "");
  const [municipality, setMunicipality] = useState<string>(
    s.listings.find((l) => l.id === listingId)?.municipality ?? "Boac",
  );
  const [rating, setRating] = useState(5);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title={review ? "Share a place review" : "Share your island story"}
    >
      {!s.session ? (
        <Empty title="Sign in to share your journey">
          <Link to="/auth" onClick={() => setOpen(false)}>
            Sign in / Register
          </Link>
        </Empty>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            void s
              .run(async () => {
                if (files.length > (review ? 1 : 3))
                  throw new Error("Too many images");
                const media_urls = [];
                for (const file of files) media_urls.push(await s.upload(file));
                await s.publish({
                  body: body.trim(),
                  listing_id: listing || null,
                  municipality: municipality as Post["municipality"],
                  post_type: review ? "review" : "social",
                  rating: review ? rating : null,
                  media_urls,
                });
                setBody("");
                setFiles([]);
                setPreview(false);
                setOpen(false);
              }, "Published")
              .finally(() => setBusy(false));
          }}
          className="form-stack"
        >
          <label>
            Your {review ? "review" : "story"}
            <textarea
              required
              maxLength={5000}
              minLength={1}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What made your journey memorable?"
              rows={5}
            />
          </label>
          {review && (
            <div>
              <label>Rating</label>
              <Stars value={rating} onChange={setRating} />
            </div>
          )}
          <div className="form-grid">
            <label>
              Destination
              <select
                value={listing}
                required={review}
                onChange={(e) => {
                  setListing(e.target.value);
                  setMunicipality(
                    s.listings.find((l) => l.id === e.target.value)
                      ?.municipality ?? municipality,
                  );
                }}
              >
                <option value="">Choose a destination</option>
                {s.listings
                  .filter(
                    (l) =>
                      l.listing_type === "destination" ||
                      (review && l.listing_type === "enterprise"),
                  )
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Municipality
              <select
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
              >
                {municipalities.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="upload-label">
            <ImagePlus size={20} /> Up to {review ? 1 : 3} photos · JPEG, PNG,
            WebP
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={!review}
              onChange={(e) => {
                const f = Array.from(e.target.files ?? []);
                if (f.length > (review ? 1 : 3)) {
                  s.notify("Please select fewer photographs");
                  e.target.value = "";
                  return;
                }
                setFiles(f);
              }}
            />
          </label>
          {files.length > 0 && (
            <small>
              {files.map((f) => f.name).join(", ")} · compressed before upload
            </small>
          )}
          {preview && (
            <div className="card preview-post">
              <Badge>Preview</Badge>
              <p>{body}</p>
              {files.map((f, index) => (
                <div className="upload-preview-wrap" key={`${f.name}-${index}`}>
                  <PreviewImage file={f} />
                  <button type="button" className="text-link" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="row end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreview(!preview)}
            >
              Preview
            </Button>
            <Button disabled={busy || !body.trim()}>
              {busy ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
function PreviewImage({ file }: { file: File }) {
  const [url] = useState(() => URL.createObjectURL(file));
  return (
    <img
      className="upload-preview"
      src={url}
      onLoad={() => URL.revokeObjectURL(url)}
      alt="Selected photograph preview"
    />
  );
}

function PostMediaCarousel({ urls, fictional, municipality }: { urls: string[]; fictional?: boolean; municipality: string }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const move = (delta: number) => setIndex((current) => (current + delta + urls.length) % urls.length);
  const source = fictional ? `/textile-${(municipality.length % 3) + 1}.svg` : urls[index];
  return (
    <div
      className="post-media-carousel"
      role="region"
      aria-label={`Post photo ${index + 1} of ${urls.length}`}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }}
      onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
        if (Math.abs(distance) > 36) move(distance < 0 ? 1 : -1);
        touchStart.current = null;
      }}
      tabIndex={0}
    >
      <img
        src={source}
        alt={fictional ? "Original Philippine textile-inspired geometric illustration, not a destination photograph" : `Travel photograph ${index + 1} of ${urls.length}`}
        loading="lazy"
        onError={(event) => { event.currentTarget.src = "/landscape-1.svg"; }}
      />
      {urls.length > 1 && <>
        <button type="button" className="carousel-control carousel-prev" aria-label="Previous photo" onClick={() => move(-1)}><ChevronLeft size={20} /></button>
        <button type="button" className="carousel-control carousel-next" aria-label="Next photo" onClick={() => move(1)}><ChevronRight size={20} /></button>
        <span className="carousel-counter">{index + 1} / {urls.length}</span>
        <div className="carousel-dots" aria-label="Choose a photo">{urls.map((url, dotIndex) => <button key={url + dotIndex} type="button" className={dotIndex === index ? "active" : ""} aria-label={`Show photo ${dotIndex + 1}`} onClick={() => setIndex(dotIndex)} />)}</div>
      </>}
    </div>
  );
}
export function PostCard({
  post: p,
  depth = 0,
}: {
  post: Post;
  depth?: number;
}) {
  const s = useStore();
  const [comments, setComments] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(p.id);
  const [dialog, setDialog] = useState<"report" | "edit" | "delete" | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const l = s.listings.find((l) => l.id === p.listing_id);
  const replies = s.posts.filter((x) => x.parent_id === p.id);
  const reactions = s.events.filter(
    (e) => e.post_id === p.id && e.event_type === "reaction",
  );
  const liked = reactions.some((e) => e.actor_id === s.session?.user.id);
  const saved = s.saved.some((x) => x.post_id === p.id);
  const own = p.author_id === s.session?.user.id;
  return (
    <article className={"card post-card " + (depth ? "reply-card" : "")}>
      <div className="post-heading">
        <Link to={"/profiles/" + p.author_id}>
          <Avatar
            name={p.profiles?.display_name}
            url={p.profiles?.avatar_url}
            avatarType={p.profiles?.avatar_type}
            avatarId={p.profiles?.avatar_id}
          />
        </Link>
        <div className="grow">
          <Link to={"/profiles/" + p.author_id}>
            <strong>{p.profiles?.display_name ?? "Traveler"}</strong>
          </Link>
          <small>
            {dateTime(p.created_at)} · {p.municipality}
          </small>
        </div>
        {p.fictional ? (
          <Badge>DEMO POST</Badge>
        ) : (
          <button
            className="icon-button"
            aria-label="Report post"
            onClick={() => {
              setDraft("");
              setDialog("report");
            }}
          >
            <Flag size={16} />
          </button>
        )}
        {own && (
          <>
            <button
              className="icon-button"
              aria-label="Edit post"
              onClick={() => {
                setDraft(p.body);
                setDialog("edit");
              }}
            >
              <Pencil size={15} />
            </button>
            <button
              className="icon-button"
              aria-label="Delete post"
              onClick={() => setDialog("delete")}
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
      {p.post_type === "review" && <Stars value={p.rating ?? 0} />}
      <p className="post-text">{p.body}</p>
      {p.media_urls.length > 0 && (
        <PostMediaCarousel urls={p.media_urls} fictional={p.fictional} municipality={p.municipality} />
      )}
      {l && (
        <div className="post-place">
          <MapPin size={17} />
          <Link to={"/places/" + l.id}>
            <strong>{l.name}</strong>
            <small>
              {l.municipality} · {l.metadata.category}
            </small>
          </Link>
          <button
            className="text-link"
            onClick={() =>
              void s.run(
                () => s.toggleSave("listing", l.id),
                "Saved places updated",
              )
            }
          >
            {s.saved.some((x) => x.listing_id === l.id)
              ? "Saved"
              : "Save place"}{" "}
            <Plus size={14} />
          </button>
        </div>
      )}
      <div className="post-stats">
        <span>{reactions.length} appreciations</span>
        <button onClick={() => setComments(!comments)}>
          {replies.length} comments
        </button>
      </div>
      <div className="post-actions">
        <button
          className={liked ? "selected" : ""}
          onClick={() =>
            void s.run(
              () => s.interact(p.id, "reaction"),
              "Appreciation updated",
            )
          }
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
          Appreciate
        </button>
        <button onClick={() => setComments(!comments)}>
          <MessageCircle size={18} />
          Comment
        </button>
        <button
          onClick={() =>
            void s.run(async () => {
              const url = window.location.origin + "/posts/" + p.id;
              if (navigator.share)
                await navigator.share({ title: "A DALUYAN journey", url });
              else await navigator.clipboard.writeText(url);
            }, "Share link ready")
          }
        >
          <Share2 size={18} />
          Share
        </button>
        <button
          className={saved ? "selected" : ""}
          aria-label="Save post"
          onClick={() =>
            void s.run(() => s.toggleSave("post", p.id), "Saved posts updated")
          }
        >
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      {comments && (
        <section className="comments">
          <h4>Conversation</h4>
          {depth < 3 &&
            replies.map((r) => (
              <div key={r.id}>
                <PostCard post={r} depth={depth + 1} />
                <button
                  className="text-link"
                  onClick={() => {
                    setReplyTo(r.id);
                    setText(
                      "@" + (r.profiles?.display_name ?? "Traveler") + " ",
                    );
                  }}
                >
                  Reply to {r.profiles?.display_name ?? "traveler"}
                </button>
              </div>
            ))}
          {!replies.length && (
            <p className="muted">Start a thoughtful conversation.</p>
          )}
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              setBusy(true);
              void s
                .run(async () => {
                  await s.publish({
                    body: text.trim(),
                    listing_id: p.listing_id,
                    parent_id: replyTo,
                    post_type: "comment",
                    municipality: p.municipality,
                  });
                  setText("");
                  setReplyTo(p.id);
                }, "Comment added")
                .finally(() => setBusy(false));
            }}
          >
            <input
              aria-label="Write a comment"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              maxLength={5000}
              placeholder="Add to the conversation…"
            />
            <Button
              size="icon"
              aria-label="Send comment"
              disabled={busy || !text.trim()}
            >
              <Send size={17} />
            </Button>
          </form>
        </section>
      )}
      <Modal
        title={
          dialog === "report"
            ? "Report this post"
            : dialog === "edit"
              ? "Edit your post"
              : "Delete this post?"
        }
        open={!!dialog}
        onOpenChange={(o) => {
          if (!o) setDialog(null);
        }}
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            void s
              .run(async () => {
                if (dialog === "report")
                  await s.interact(p.id, "report", draft);
                if (dialog === "edit") await s.editPost(p.id, draft);
                if (dialog === "delete") await s.removePost(p.id);
                setDialog(null);
              }, "Content updated")
              .finally(() => setBusy(false));
          }}
        >
          {dialog === "delete" ? (
            <p>This permanently removes your post and its conversation.</p>
          ) : (
            <label>
              {dialog === "report" ? "Reason for report" : "Post text"}
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                minLength={dialog === "report" ? 5 : 1}
                maxLength={dialog === "report" ? 1000 : 5000}
                required
              />
            </label>
          )}
          <Button
            disabled={busy}
            variant={dialog === "delete" ? "destructive" : "default"}
          >
            {busy ? "Saving…" : "Confirm"}
          </Button>
        </form>
      </Modal>
    </article>
  );
}
export function Home() {
  const s = useStore();
  const [municipality, setMunicipality] = useState("");
  const [sort, setSort] = useState("recommended");
  const [limit, setLimit] = useState(6);
  const [compose, setCompose] = useState(false);
  const feed = rankFeed(
    s.posts,
    municipality,
    s.interests,
    s.listings,
    Object.fromEntries(
      s.posts.map((p) => [
        p.id,
        s.events.filter(
          (e) => e.post_id === p.id && e.event_type === "reaction",
        ).length,
      ]),
    ),
  );
  if (sort === "latest")
    feed.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return (
    <div className="home-grid">
      <div className="home-center">
        <section className="town-stories" aria-label="Marinduque town stories">
          <div className="stories-title">
            <span className="eyebrow">SIX TOWNS. ENDLESS CONNECTIONS.</span>
            <Link className="text-link" to="/discover">
              Explore all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="stories-track">
            {municipalities.map((town, i) => (
              <button
                key={town}
                className="town-story"
                aria-label={`Show stories from ${town}`}
                aria-pressed={municipality === town}
                onClick={() => {
                  setMunicipality(town);
                  setLimit(6);
                }}
              >
                <span className="story-ring">
                  <span className={`story-art story-art-${i % 3}`}>
                    <span>{town.slice(0, 2).toUpperCase()}</span>
                  </span>
                </span>
                <span>{town}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="feed-welcome">
          <div>
            <span className="eyebrow">YOUR DAILY DOSE OF ISLAND LIFE</span>
            <h1>
              Find your place.
              <br />
              Share your journey.
            </h1>
            <p>Small moments. Local voices. A little closer to Marinduque.</p>
          </div>
          <Link className="button button-outline" to="/map">
            Explore the island <ArrowUpRight size={16} />
          </Link>
        </section>
        <div className="card compose-prompt">
          <div className="row">
            <Avatar name={s.profile?.display_name ?? "Guest"} />
            <button className="compose-input" onClick={() => setCompose(true)}>
              Where did your journey take you?
            </button>
          </div>
          <div className="row between">
            <span className="muted row">
              <ImagePlus size={17} /> Photo / experience{" "}
              <span className="dot-separator">·</span>
              <MapPin size={16} /> Tag a place
            </span>
            <Button size="sm" onClick={() => setCompose(true)}>
              <Plus size={15} /> Share a story
            </Button>
          </div>
        </div>
        <div className="feed-heading">
          <h2>
            Island stories <span>✦</span>
          </h2>
          <label className="sort-label">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recommended">Recommended</option>
              <option value="latest">Latest</option>
            </select>
          </label>
        </div>
        <div
          className="filter-chips"
          role="group"
          aria-label="Filter municipality"
        >
          {["", ...municipalities].map((m) => (
            <button
              key={m}
              aria-pressed={municipality === m}
              className={municipality === m ? "active" : ""}
              onClick={() => {
                setMunicipality(m);
                setLimit(6);
              }}
            >
              {m || "All towns"}
            </button>
          ))}
        </div>
        <p className="fine-print">
          Ranked by recency, place relevance, genuine engagement and content
          quality. Reported content is excluded.
        </p>
        <div className="story-mosaic" aria-label="Island community stories">
          {s.loading ? (
            <Skeleton />
          ) : feed.length ? (
            feed.slice(0, limit).map((p) => <PostCard key={p.id} post={p} />)
          ) : (
            <Empty title="A story is waiting to be shared">
              Be the first to share from this municipality.
            </Empty>
          )}
        </div>
        {feed.length > limit && (
          <Button
            variant="outline"
            className="load-more"
            onClick={() => setLimit((n) => n + 6)}
          >
            Load more stories
          </Button>
        )}
        <Composer open={compose} setOpen={setCompose} />
      </div>
      <aside className="right-panel">
        <Weather />
        <section className="panel-section">
          <div className="section-heading">
            <h3>Around the island</h3>
            <Link to="/discover" aria-label="View all destinations">
              <ArrowUpRight size={17} />
            </Link>
          </div>
          {s.listings
            .filter((l) => l.listing_type === "destination")
            .slice(3, 6)
            .map((l, i) => (
              <Link
                key={l.id}
                to={"/places/" + l.id}
                className="trending-place"
              >
                <span className="trend-number">0{i + 1}</span>
                <img src={l.metadata.image} alt="" />
                <span>
                  <strong>{l.name}</strong>
                  <small>{l.municipality}</small>
                </span>
              </Link>
            ))}
          <small className="fine-print">
            Explore introductory records. Confirm access locally.
          </small>
        </section>
        <section className="responsible-card">
          <span>TRAVEL WITH PURPOSE</span>
          <h3>
            Make memories.
            <br />
            Leave a positive mark.
          </h3>
          <ul className="butterfly-list">
            <li>Choose local.</li>
            <li>Respect culture.</li>
            <li>Take your litter home.</li>
          </ul>
          <Link to="/feedback">
            Help shape better tourism <ArrowUpRight size={16} />
          </Link>
        </section>
        <div className="rini-promo">
          <span className="rini-icon">
            <Butterfly />
          </span>
          <h3>A little help from RINI</h3>
          <p>Your source-grounded island companion, one question away.</p>
          <Link to="/rini">
            Let’s plan something <ArrowUpRight size={15} />
          </Link>
        </div>
      </aside>
    </div>
  );
}
export function PostPage() {
  const { id } = useParams();
  const s = useStore();
  const p = s.posts.find((p) => p.id === id);
  return (
    <div className="narrow-page">
      {s.loading ? (
        <Skeleton />
      ) : p && p.post_type !== "feedback" ? (
        <PostCard post={p} />
      ) : (
        <Empty title="Post unavailable">
          This post may be private or awaiting moderation.
        </Empty>
      )}
    </div>
  );
}
export function ProfilePage() {
  const { id } = useParams();
  const s = useStore();
  const posts = s.posts.filter(
    (p) =>
      p.author_id === id &&
      p.post_type !== "feedback" &&
      p.moderation_status === "published",
  );
  const name =
    posts[0]?.profiles?.display_name ??
    (s.session?.user.id === id ? s.profile?.display_name : "Traveler");
  return (
    <div className="narrow-page">
      <div className="card profile-heading">
        <Avatar name={name} url={s.profile?.avatar_url} avatarType={s.profile?.avatar_type} avatarId={s.profile?.avatar_id} />
        <h1>{name}</h1>
        <p>Public island stories</p>
      </div>
      {posts.length ? (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      ) : (
        <Empty title="No public stories yet" />
      )}
    </div>
  );
}
export function Discover() {
  const s = useStore();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  return (
    <div className="page">
      <h1>Discover Marinduque</h1>
      <label>
        Search places and local experiences
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try Boac, beach, heritage…"
        />
      </label>
      <div className="listing-grid">
        {s.listings
          .filter((l) =>
            (l.name + " " + l.municipality + " " + l.description)
              .toLowerCase()
              .includes(q.toLowerCase()),
          )
          .map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
      </div>
    </div>
  );
}
