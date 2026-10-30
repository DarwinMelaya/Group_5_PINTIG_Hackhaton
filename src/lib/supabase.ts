import { createClient } from "@supabase/supabase-js";
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const key = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
)?.trim();
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
export const configured = !!supabase;
export function backend() {
  if (!supabase)
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) to use DALUYAN.",
    );
  return supabase;
}
export function safeLink(value: string | undefined) {
  if (!value) return undefined;
  try {
    const u = new URL(value);
    return ["https:", "mailto:", "tel:"].includes(u.protocol)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}
