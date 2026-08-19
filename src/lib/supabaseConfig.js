/*
 * Connection details only — deliberately free of any SDK import so the public
 * bundle can read content without shipping the auth/storage/realtime client.
 *
 * The anon key is meant to ship in the browser: it identifies the project, it
 * does not grant permission. What a request may actually do is decided
 * server-side by the Row Level Security policies in supabase/schema.sql.
 *
 * The service_role key bypasses RLS entirely and must never appear in any
 * VITE_-prefixed variable — everything Vite inlines is downloadable.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
