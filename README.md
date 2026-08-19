# Café Faim

One-page site for Café Faim (Waalwijk) — React + Vite, with a small admin
dashboard for the content that changes.

```bash
npm install
npm run dev      # local dev server, hot reload
npm run build    # production bundle -> dist/
npm run preview  # serve dist/ exactly as it deploys
npm run verify   # checks the content mapping + menu save round trip
```

Deploy by uploading `dist/`. URLs are relative (`base: './'`), so it works from
a domain root or a subfolder. Filenames are hashed, so no cache-busting query is
needed.

The site is **two pages**: `index.html` (public) and `fata.html` (dashboard).
The dashboard is a separate entry point on purpose — it works on any static host
without SPA rewrite rules, and the public page downloads none of its code.

---

## Setting up the dashboard

Content lives in Supabase; the files in `src/data/` stay bundled as a fallback,
so the site still renders if Supabase is unreachable.

### 1. Create the project

Sign up at [supabase.com](https://supabase.com) and create a project. The free
tier is ample for this site.

### 2. Run the SQL, in this order

Dashboard → **SQL Editor** → New query → paste → Run.

| File | What it does |
|---|---|
| `supabase/schema.sql` | Tables, Row Level Security, policies, storage bucket. Safe to re-run — and re-run it after pulling changes, since new tables arrive here. |
| `supabase/seed.sql` | Loads the current site content. **Run once.** Re-running replaces everything, so don't run it again after anyone has started editing. |

Supabase may warn about destructive operations — see the notes at the top of
each file for what they actually do.

### 3. Turn off public sign-ups

**Authentication → Sign In / Providers → Email →** turn off *Allow new users to
sign up*.

Nobody should be able to create an account on your project. Write access also
requires a row in `admins`, so this is a second lock rather than the only one —
but leave it off regardless.

### 4. Create the owner account

**Authentication → Users → Add user → Create new user.** Use the café's e-mail
and any temporary password; the dashboard forces a change on first sign-in, so
this one is throwaway. Tick *Auto Confirm User*.

Then grant it access — SQL Editor, with the same e-mail:

```sql
insert into public.admins (id, email, must_change_password)
select id, email, true
from auth.users
where email = 'info@cafefaim.nl'
on conflict (id) do nothing;

select email, must_change_password from public.admins;
```

Looking the id up by e-mail avoids copying a UUID by hand. The second query
should return exactly one row.

### 5. Check the security rules

Run `supabase/verify-security.sql`. **Every row must say PASS.** It impersonates
a visitor and a signed-in non-admin and tries to change your content. It alters
nothing: the update probes assign columns to themselves, deletes are inspected
rather than attempted, and the insert probes are cleaned up.

Re-run it after any change to the policies.

### 6. Point the site at the project

**Project Settings → API.** Copy `.env.example` to `.env` and fill in the
Project URL and the `anon` / `public` key:

```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Both are meant to ship in the browser: the anon key identifies the project, it
does not grant permission — the policies decide what a request may do.

**Never put the `service_role` key here, or in any `VITE_`-prefixed variable.**
It bypasses Row Level Security entirely, and everything `VITE_`-prefixed is
compiled into files any visitor can download.

`.env` is gitignored, so set the same two variables in your host's build
settings too — otherwise the deployed build silently falls back to the bundled
content.

### 7. Sign in

Restart `npm run dev` (Vite reads `.env` at startup) and open
**http://localhost:5181/fata.html**. Sign in, choose a real password when
prompted, and the four tabs appear.

---

## Using the dashboard

Five tabs: **Startvideo**, **Concepttekst**, **Menukaart**, **Taarten op maat**,
**Galerij**.

- Dutch and English sit side by side. Leaving English empty means "same in both
  languages" — that is how most prices and product names are stored.
- Changes are **not** saved as you type. The bar along the bottom says when
  there are unsaved changes; *Opslaan* publishes them, *Wijzigingen ongedaan
  maken* discards them.
- Order is set with the ↑ ↓ buttons. On the menu, → and ← move a section
  between the two columns.
- Saved changes are live immediately — no rebuild.

Photos upload straight from the editor (JPG, PNG, WebP or AVIF, up to 6 MB).
Crop them to portrait beforehand if you can: cake cards render 3:4 and gallery
tiles 4:5.

The hero background video is capped at 8 MB (MP4 or WebM), which is a bandwidth
limit rather than a storage one — it autoplays for every visitor, so its size is
paid on every page load and counts against Supabase's monthly transfer
allowance. The video that ships with the repo is served from the site's own host
and costs nothing; an uploaded one is served from Supabase Storage. *Terug naar
de standaardvideo* switches back.

---

## Layout

```
public/assets/     images + hero video, copied through the build untouched
supabase/          schema, seed, and the security self-test
scripts/           seed generator, mapping tests
src/
  main.jsx         public entry
  App.jsx          section order
  lang.jsx         NL/EN context; t() replaces the old data-nl/data-en
  style.css        public stylesheet
  components/      one per section
  content/         fetches content, falls back to src/data
  data/            bundled fallback content
  hooks/           typewriter, scroll reveal, sticky nav, reduced motion
  lib/             Supabase config; REST reader (public), full client (admin)
  admin/           the dashboard — its own entry, styles and editors
```

`src/data/` is both the offline fallback and the source of `seed.sql`. After
editing it, run `npm run seed:generate`.
