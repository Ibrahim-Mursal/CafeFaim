import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig.js';

/*
 * Public, read-only access to PostgREST.
 *
 * The visitor-facing site only ever selects rows, which is a plain GET with two
 * headers — so it uses this instead of @supabase/supabase-js. Pulling the full
 * SDK in for reads more than doubled the landing page bundle (54 kB -> 113 kB
 * gzipped) to ship an auth and storage client no visitor can use. The dashboard
 * imports the real SDK, because it genuinely needs sessions and uploads.
 *
 * Row Level Security still applies: these requests carry the anon key, so they
 * can read exactly what the `*_read` policies allow and write nothing.
 */

const ATTEMPTS = 3;
const BACKOFF_MS = [400, 1200];

// 5xx and network failures are worth another try; 4xx is not. A 401 or 404 is a
// wrong key or a missing table, and repeating it just delays the fallback.
const isRetryable = (status) => status === undefined || status === 429 || status >= 500;

const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });

/*
 * Retries because a Supabase project that has been idle returns 503 while it
 * wakes, which is exactly what a quiet café site hits every morning. Without
 * this, one cold-start request would drop the visitor onto the bundled fallback
 * for their whole session — stale prices, silently. Observed in practice: the
 * first request after an idle period 503s, the next one succeeds.
 */
export async function selectAll(table, signal) {
  let lastError;

  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    if (attempt > 0) await wait(BACKOFF_MS[attempt - 1], signal);

    let res;
    try {
      res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
        signal,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: 'application/json',
        },
      });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err; // offline or DNS failure — retryable
      continue;
    }

    if (res.ok) return res.json();

    lastError = new Error(`${table}: ${res.status} ${res.statusText}`);
    if (!isRetryable(res.status)) break;
  }

  throw lastError;
}
