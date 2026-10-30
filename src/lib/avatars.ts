export const AVATAR_IDS = ["dog", "cat", "wolf", "fox", "rabbit", "bear", "panda", "deer"] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

export function avatarUrl(id: string | null | undefined) {
  return id && (AVATAR_IDS as readonly string[]).includes(id) ? `/avatars/${id}.svg` : null;
}

export function profilePicture(profile?: {
  avatar_type?: string | null;
  avatar_id?: string | null;
  avatar_url?: string | null;
}) {
  if (profile?.avatar_type === "avatar") return avatarUrl(profile.avatar_id);
  if (profile?.avatar_type === "upload" && profile.avatar_url) return profile.avatar_url;
  return profile?.avatar_url ?? null;
}
