# Deploying Café Faim to cafefaim.nl on Cloudflare Pages

Everything on the code side is ready — `_headers` (security headers),
`sitemap.xml`, `robots.txt`, and the canonical/`og:url` tags in
`index.html` all already point at `https://cafefaim.nl/`. What's left are
account-level steps that need your own logins, so they can't be done for
you. This is a one-time setup.

## 1. Connect the repo to Cloudflare

1. Sign up / log into [Cloudflare](https://dash.cloudflare.com) (free tier is enough).
2. **Workers & Pages → Create → Connect to Git**, pick the
   `ibrahim-mursal/CafeFaim` repo.
3. Cloudflare's onboarding now routes new Git projects through its unified
   Workers builder (deploys via `wrangler deploy`) rather than the older,
   separate Pages flow (which used a "build output directory" field) —
   which one you land on can vary. Fill in whichever fields that screen
   actually shows:
   - **Build command**:
     ```
     node build.js && mkdir -p dist && cp index.html style.css script.js robots.txt sitemap.xml _headers dist/ && cp -r assets dist/ && cp -r admin dist/
     ```
   - **If there's a "Build output directory" field** (classic Pages
     flow): set it to `dist`.
   - **If there's a "Deploy command" field instead**, pre-filled with
     `npx wrangler deploy` (unified Workers flow): leave it as-is —
     `wrangler.jsonc` at the repo root already tells it the static files
     live in `dist/`, so no extra field to fill in for output location.
   - **Project name**: whatever Cloudflare suggests (e.g. `cafefaim`) is
     fine — it doesn't need to match anything else in the repo.
4. Deploy. Cloudflare gives you a working preview URL immediately
   (`*.pages.dev` or `*.workers.dev` depending on which flow) — check it
   loads correctly before moving on to the domain.

## 2. Point cafefaim.nl at it

Simplest path: move the domain's nameservers to Cloudflare (also gets you
free DNS + the CDN/DDoS protection layer for the whole domain, not just
the site).

1. **Cloudflare → Add a site → cafefaim.nl**. Cloudflare scans existing
   DNS records and shows you two nameservers.
2. At whichever registrar `cafefaim.nl` is registered with, replace its
   nameservers with the two Cloudflare gives you. (Propagation is usually
   under an hour, sometimes up to 24h.)
3. Back in the Pages project → **Custom domains → Set up a domain** →
   enter `cafefaim.nl`. Cloudflare issues the SSL certificate and wires
   the DNS record automatically since it's already managing the zone.

*(If you'd rather not move nameservers, Cloudflare Pages also accepts a
CNAME record instead — the "Custom domains" screen shows that option too,
just with a manual DNS step at your current registrar each time.)*

## 3. Update the admin login's callback URL

The GitHub App behind `/admin/`'s login (see `admin/README.md`) has a
callback URL locked to wherever the site was live when you created it.
Once `cafefaim.nl` is live:

1. **GitHub → Settings → Developer settings → GitHub Apps → (your app) →
   General**.
2. Update **Callback URL** to `https://cafefaim.nl/admin/`.

`/admin/` keeps working at the old URL too until you remove it — GitHub
Apps support multiple callback URLs, so you don't have to do this the
instant DNS switches over.

## 4. Tell Google it exists

Being live at a real domain doesn't get it into Google's index by itself —
see the earlier conversation for why. Once `https://cafefaim.nl/` resolves:

1. [Google Search Console](https://search.google.com/search-console) →
   add `cafefaim.nl` as a property → verify (Search Console offers a DNS
   TXT record option, which is easy since Cloudflare is already managing
   DNS) → **Sitemaps** → submit `sitemap.xml`.
2. Separately, and arguably more useful for a physical café: set up or
   claim a **Google Business Profile** for Café Faim. That's what
   actually surfaces in Google Maps and "coffee near me" searches — it's
   a different system from the website's own search ranking.

## What happens to the GitHub Pages copy?

`.github/workflows/deploy.yml` still runs on every push and keeps
`https://ibrahim-mursal.github.io/CafeFaim/` updated. Once `cafefaim.nl`
is the real address, that URL is just a harmless secondary copy — nothing
links to it, and `robots.txt`/canonical tags on the live domain keep
Google from treating it as a competing duplicate. Leave it running (it's
free) or remove the workflow later if you'd rather not maintain two
deploy targets — your call, not required either way.
