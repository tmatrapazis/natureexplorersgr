/**
 * Supabase client factories.
 * - Browser (web):     createBrowserSupabase()  — anon key, cookie session via @supabase/ssr
 * - Server (Next.js):  createServerSupabase()   — reads/writes the auth cookie (RSC / Route Handlers)
 * - Service (Edge):    createServiceSupabase()  — SERVICE ROLE, server-only, bypasses RLS
 *
 * Never import the service client into any client bundle.
 */

import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
// import type { Database } from "./database.types"; // generated via `pnpm db:types`

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/** Web browser client (client components). */
export function createBrowserSupabase() {
  return createBrowserClient(URL, ANON);
}

/** Next.js server client — pass the framework cookie store. */
export function createServerSupabase(cookieStore: {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
}) {
  return createServerClient(URL, ANON, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => cookieStore.set(name, value, options),
      remove: (name, options) => cookieStore.set(name, "", { ...options, maxAge: 0 }),
    },
  });
}

/** Service-role client — Edge Functions / trusted server only. Bypasses RLS. */
export function createServiceSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing (server-only).");
  return createClient(URL, key, { auth: { persistSession: false } });
}

// Typed data-access functions (ports of legacy src/api/db.js) live alongside this file, e.g.:
//   export const trips = { listPublished, getBySlug, ... }
//   export const bookings = { filterByTripIds, getTierAvailability (RPC), ... }
