import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from './supabaseConfig.js';

/*
 * The full client — sessions, storage uploads, authenticated writes.
 *
 * Imported by the dashboard only. The public site reads through
 * lib/restRead.js so visitors never download this.
 */
export { isConfigured };

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // The dashboard is opened directly, never through an email link
        // carrying tokens in the URL, so there is nothing to detect and this
        // stops the client rewriting the address bar on load.
        detectSessionInUrl: false,
      },
    })
  : null;
