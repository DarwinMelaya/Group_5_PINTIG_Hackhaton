export const municipalities = [
  "Boac",
  "Mogpog",
  "Gasan",
  "Buenavista",
  "Santa Cruz",
  "Torrijos",
] as const;
export type Municipality = (typeof municipalities)[number];
export type Moderation = "published" | "pending" | "rejected";
export type ListingMediaRights = "authorized" | "permission_required" | "unknown";
export type ListingMedia = {
  id: string;
  enterprise_id?: string;
  storage_path?: string;
  url: string;
  original_url: string;
  alt: string;
  kind: "cover" | "product" | "service" | "facility";
  rights_status: ListingMediaRights;
  approval_status?: "pending" | "approved" | "rejected";
  source_url?: string | null;
  license?: string | null;
  attribution?: string | null;
  approved: boolean;
};
export type Listing = {
  id: string;
  owner_id: string | null;
  name: string;
  listing_type: "destination" | "enterprise" | "heritage";
  municipality: Municipality;
  description: string;
  latitude: number | null;
  longitude: number | null;
  fee_min: number | null;
  fee_max: number | null;
  fee_status: string;
  fee_source_url: string | null;
  contact_links: Record<string, string>;
  accreditation_status: string;
  source_url: string | null;
  moderation_status: Moderation;
  created_at: string;
  metadata: {
    category: string;
    activities: string[];
    image: string;
    source_label: string;
    last_checked: string | null;
    verified: boolean;
    public_promotion: boolean;
    community_benefit: number;
    capacity: number;
    baseline: number;
    services?: string[];
    amenities?: string[];
    address?: string;
    cultural_context?: string;
    fictional?: boolean;
    media_gallery?: ListingMedia[];
    cover_photo_url?: string | null;
    media_status?: "approved" | "awaiting_authorized_photos";
    photo_source_urls?: string[];
  };
};
export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  display_role: string | null;
  avatar_type?: "default" | "avatar" | "upload" | null;
  avatar_id?: string | null;
  avatar_storage_path?: string | null;
};
export type Post = {
  id: string;
  author_id: string;
  listing_id: string | null;
  parent_id: string | null;
  post_type: "social" | "review" | "comment" | "feedback" | "announcement";
  body: string;
  rating: number | null;
  media_urls: string[];
  sentiment_label: string;
  moderation_status: Moderation;
  municipality: Municipality;
  category: string | null;
  feedback_status: string | null;
  created_at: string;
  profiles?: Pick<Profile, "display_name" | "avatar_url" | "avatar_type" | "avatar_id">;
  fictional?: boolean;
};
export type ActivityEvent = {
  id: string;
  actor_id: string | null;
  recipient_id: string | null;
  listing_id: string | null;
  post_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  is_simulated: boolean;
  source_url: string | null;
  created_at: string;
  read_at: string | null;
};
export type SavedItem = {
  id: string;
  user_id: string;
  listing_id: string | null;
  post_id: string | null;
};
export type Itinerary = {
  id: string;
  user_id: string;
  name: string;
  stops: string[];
  preferences: Record<string, unknown>;
  created_at: string;
};
export type Sentiment =
  "Positive" | "Neutral" | "Mixed" | "Negative" | "Insufficient data";
