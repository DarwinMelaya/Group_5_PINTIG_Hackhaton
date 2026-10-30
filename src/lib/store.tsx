import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { backend, supabase } from "./supabase";
import type {
  Listing,
  Post,
  ActivityEvent,
  SavedItem,
  Itinerary,
  Profile,
  ListingMedia,
} from "./types";
import { classify } from "./intelligence";
import { enterpriseListings15 } from "../data/enterpriseListings15";
import { marinduqueDestinations } from "../data/marinduqueDestinations";
type NewPost = Pick<
  Post,
  "body" | "listing_id" | "municipality" | "post_type"
> &
  Partial<
    Pick<
      Post,
      "rating" | "parent_id" | "media_urls" | "category" | "feedback_status"
    >
  >;
function useStoreValue() {
  const requestVersion = useRef(0);
  const currentUser = useRef<string | undefined>(undefined);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [role, setRole] = useState("tourist");
  const [aal, setAal] = useState("aal1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [interests, setInterestState] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const notify = useCallback((s: string) => setToast(s), []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 6500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    if (!supabase) {
      setError(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to use DALUYAN.",
      );
      setAuthReady(true);
      return;
    }
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      if (currentUser.current !== s?.user.id) {
        currentUser.current = s?.user.id;
        requestVersion.current++;
        setPosts([]);
        setEvents([]);
        setSaved([]);
        setItineraries([]);
        setProfile(null);
        setRole("tourist");
        setAal("aal1");
        setNeedsMfa(false);
      }
      setSession(s);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const uid = session?.user.id;
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("daluyan.interests." + (uid ?? "guest")) ?? "[]",
      );
      setInterestState(
        Array.isArray(saved)
          ? saved.filter((x): x is string => typeof x === "string")
          : [],
      );
    } catch {
      setInterestState([]);
    }
  }, [uid]);
  function setInterests(next: string[]) {
    setInterestState(next);
    try {
      localStorage.setItem(
        "daluyan.interests." + (uid ?? "guest"),
        JSON.stringify(next),
      );
    } catch {
      notify(
        "Preferences apply to this visit; browser storage is unavailable.",
      );
    }
  }
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    const isCurrent = () => version === requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const client = backend();
      const queries = await Promise.all([
        client.from("listings").select("*").order("name"),
        client
          .from("enterprise_media")
          .select("*")
          .eq("approval_status", "approved")
          .order("display_order"),
        client
          .from("posts")
          .select("*,profiles!posts_author_id_fkey(display_name,avatar_url,avatar_type,avatar_id)")
          .order("created_at", { ascending: false })
          .limit(500),
        client
          .from("activity_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      const listingError = queries[0].error;
      const mediaResult = queries[1];
      queries.slice(2).forEach((r) => {
        if (r.error) throw r.error;
      });
      if (!isCurrent()) return;
      const serverListings = (queries[0].data ?? []) as Listing[];
      const approvedMedia = mediaResult.error
        ? []
        : await resolveApprovedMedia((mediaResult.data ?? []) as Array<Record<string, unknown>>);
      const listingsWithMedia = serverListings.map((listing) => ({
        ...listing,
        metadata: {
          ...listing.metadata,
          media_gallery: approvedMedia.filter((media) => media.enterprise_id === listing.id),
          cover_photo_url: approvedMedia.find((media) => media.enterprise_id === listing.id && media.kind === "cover")?.url ?? null,
          media_status: approvedMedia.some((media) => media.enterprise_id === listing.id) ? "approved" as const : listing.metadata.media_status,
        },
      }));
      setListings(listingsWithMedia.length ? listingsWithMedia : [...marinduqueDestinations, ...enterpriseListings15]);
      if (listingError) setError(`Showing the verified local listing directory while listings sync: ${listingError.message}`);
      setPosts(queries[2].data as Post[]);
      setEvents(queries[3].data as ActivityEvent[]);
      if (uid) {
        const q = await Promise.all([
          client.from("saved_items").select("*").eq("user_id", uid),
          client.from("itineraries").select("*").eq("user_id", uid),
          client.from("profiles").select("*").eq("id", uid).single(),
          client
            .from("user_roles")
            .select("role")
            .eq("user_id", uid)
            .single(),
          client.auth.mfa.getAuthenticatorAssuranceLevel(),
        ]);
        q.forEach((r) => {
          if (r.error) throw r.error;
        });
        if (!isCurrent()) return;
        setSaved(q[0].data as SavedItem[]);
        setItineraries(q[1].data as Itinerary[]);
        setProfile(q[2].data as Profile);
        setRole(q[3].data?.role ?? "tourist");
        setAal(q[4].data?.currentLevel ?? "aal1");
        setNeedsMfa(
          q[4].data?.nextLevel === "aal2" && q[4].data.currentLevel !== "aal2",
        );
      } else {
        setSaved([]);
        setItineraries([]);
        setProfile(null);
        setRole("tourist");
        setAal("aal1");
        setNeedsMfa(false);
      }
    } catch (e) {
      if (!isCurrent()) return;
      setError(
        e instanceof Error
          ? e.message
          : String((e as { message?: string }).message ?? e),
      );
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [uid]);
  useEffect(() => {
    if (authReady) void refresh();
  }, [authReady, refresh]);
  useEffect(() => {
    if (!supabase || !uid) return;
    const channel = supabase
      .channel("personal-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_events",
          filter: `recipient_id=eq.${uid}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();
    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [uid, refresh]);
  async function run(task: () => Promise<unknown>, message = "Saved") {
    try {
      await task();
      notify(message);
      await refresh();
      return true;
    } catch (e) {
      notify(
        e instanceof Error
          ? e.message
          : String((e as { message?: string }).message ?? e),
      );
      return false;
    }
  }
  function requireUser() {
    if (!uid) throw new Error("Sign in to save, publish or interact.");
    if (needsMfa)
      throw new Error(
        "Complete your authenticator challenge in the sign-in page first.",
      );
    return uid;
  }
  async function publish(p: NewPost) {
    const author_id = requireUser();
    const { error } = await backend()
      .from("posts")
      .insert({
        ...p,
        author_id,
        rating: p.rating ?? null,
        parent_id: p.parent_id ?? null,
        media_urls: p.media_urls ?? [],
        sentiment_label: classify(p.body),
        feedback_status: p.post_type === "feedback" ? "Received" : null,
      });
    if (error) throw error;
  }
  async function editPost(id: string, body: string) {
    const { error } = await backend()
      .from("posts")
      .update({ body, sentiment_label: classify(body) })
      .eq("id", id);
    if (error) throw error;
  }
  async function removePost(id: string) {
    const { error } = await backend().from("posts").delete().eq("id", id);
    if (error) throw error;
  }
  async function interact(post_id: string, event_type: string, reason = "") {
    requireUser();
    const { error } = await backend().rpc("interact", {
      target: post_id,
      kind: event_type,
      reason,
    });
    if (error) throw error;
  }
  async function toggleSave(kind: "listing" | "post", id: string) {
    const user_id = requireUser();
    const existing = saved.find((s) =>
      kind === "listing" ? s.listing_id === id : s.post_id === id,
    );
    const { error } = existing
      ? await backend().from("saved_items").delete().eq("id", existing.id)
      : await backend()
          .from("saved_items")
          .insert({ user_id, [kind + "_id"]: id });
    if (error) throw error;
  }
  async function markRead(id?: string) {
    const { error } = await backend().rpc("mark_notifications_read", {
      target: id ?? null,
    });
    if (error) throw error;
  }
  async function upload(file: File, bucket = "post-media") {
    const user = requireUser();
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    )
      throw new Error("Use a JPEG, PNG or WebP image under 10 MB.");
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing unavailable");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Cannot compress image"))),
        "image/webp",
        0.82,
      ),
    );
    const path = `${user}/${crypto.randomUUID()}.webp`;
    const { error } = await backend()
      .storage.from(bucket)
      .upload(path, blob, { contentType: "image/webp", upsert: false });
    if (error) throw error;
    return bucket === "feedback-evidence"
      ? path
      : backend().storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  async function uploadEnterpriseMedia(
    file: File,
    input: {
      enterpriseId: string;
      mediaType: "cover" | "product" | "service" | "facility";
      altText: string;
      sourceUrl?: string;
      licenseInfo?: string;
      attribution?: string;
    },
  ) {
    const user = requireUser();
    if (!session) throw new Error("Sign in to upload enterprise media.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024)
      throw new Error("Use a JPEG, PNG or WebP image under 10 MB.");
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing unavailable");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Cannot compress image")), "image/webp", 0.84),
    );
    const filename = input.mediaType + "-" + crypto.randomUUID() + ".webp";
    const storagePath = `${input.enterpriseId}/${filename}`;
    const { error: uploadError } = await backend().storage.from("enterprise-media").upload(storagePath, blob, { contentType: "image/webp", upsert: false });
    if (uploadError) throw uploadError;
    const { error: mediaError } = await backend().from("enterprise_media").insert({
      enterprise_id: input.enterpriseId,
      storage_path: storagePath,
      media_type: input.mediaType,
      alt_text: input.altText,
      source_url: input.sourceUrl ?? null,
      license_info: input.licenseInfo ?? null,
      attribution: input.attribution ?? null,
      permission_status: "pending",
      approval_status: "pending",
      is_cover: input.mediaType === "cover",
      uploaded_by: user,
    });
    if (mediaError) throw mediaError;
    return storagePath;
  }
  return {
    interests,
    setInterests,
    session,
    authReady,
    profile,
    role,
    aal,
    needsMfa,
    isAdmin: role === "admin" && aal === "aal2",
    listings,
    posts,
    events,
    saved,
    itineraries,
    loading,
    error,
    toast,
    notify,
    refresh,
    run,
    publish,
    editPost,
    removePost,
    interact,
    toggleSave,
    markRead,
    upload,
    uploadEnterpriseMedia,
    requireUser,
  };
}

async function resolveApprovedMedia(rows: Array<Record<string, unknown>>): Promise<ListingMedia[]> {
  const resolved: Array<ListingMedia | null> = await Promise.all(rows.map(async (row): Promise<ListingMedia | null> => {
    const storagePath = typeof row.storage_path === "string" ? row.storage_path : "";
    const enterpriseId = typeof row.enterprise_id === "string" ? row.enterprise_id : "";
    if (!storagePath || !enterpriseId || !supabase) return null;
    const url = supabase.storage.from("enterprise-media").getPublicUrl(storagePath).data.publicUrl;
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (!response.ok) return null;
    } catch {
      return null;
    }
    return {
      id: String(row.id),
      enterprise_id: enterpriseId,
      storage_path: storagePath,
      url,
      original_url: typeof row.source_url === "string" ? row.source_url : url,
      alt: typeof row.alt_text === "string" ? row.alt_text : "Authorized enterprise photograph",
      kind: row.media_type === "product" || row.media_type === "service" || row.media_type === "facility" ? row.media_type : "cover",
      rights_status: "authorized",
      approval_status: "approved",
      source_url: typeof row.source_url === "string" ? row.source_url : null,
      license: typeof row.license_info === "string" ? row.license_info : null,
      attribution: typeof row.attribution === "string" ? row.attribution : null,
      approved: true,
    } satisfies ListingMedia;
  }));
  return resolved.filter((media): media is ListingMedia => media !== null);
}
const Context = createContext<ReturnType<typeof useStoreValue> | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing StoreProvider");
  return value;
}
