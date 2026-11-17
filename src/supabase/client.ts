import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

function isValidProjectUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      (parsed.protocol === "https:" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      !parsed.username && !parsed.password && !parsed.search && !parsed.hash && (parsed.pathname === "/" || parsed.pathname === "");
  } catch {
    return false;
  }
}

function isPublicBrowserKey(value: string) {
  if (value.startsWith("sb_secret_")) return false;
  if (value.startsWith("sb_publishable_")) return true;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const claims = JSON.parse(atob(payload)) as { role?: string };
    return claims.role === "anon";
  } catch {
    return false;
  }
}

export const supabaseConfigError = !url || !anonKey
  ? "Supabase is not configured. Add the public project URL and anon/publishable key to .env.local."
  : !isValidProjectUrl(url)
    ? "VITE_SUPABASE_URL must be a valid HTTPS project URL (HTTP is allowed for localhost)."
    : !isPublicBrowserKey(anonKey)
      ? "VITE_SUPABASE_ANON_KEY must be an anon JWT or publishable key. Secret/service-role keys are not safe in a browser."
    : null;

export const supabase = supabaseConfigError
  ? null
  : createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
