# Café Faim admin dashboard — one-time setup

This gets you a login-protected page at `/admin/` where menu items, prices,
opening hours, hero text, and gallery/cake photos can be edited through a
form. Saving there commits straight to this repo's `main` branch; a GitHub
Actions workflow then rebuilds and redeploys the site automatically.

Two things need doing once, by whoever owns the `ibrahim-mursal/CafeFaim`
GitHub account — both require logging into GitHub yourself, so they can't
be done for you.

## 1. Create a GitHub App (not an OAuth App)

This is what makes `/admin/` a real login screen instead of a fake one. No
separate server, no client secret to protect — GitHub's PKCE flow handles
the whole login in the browser.

1. Go to **github.com → Settings → Developer settings → GitHub Apps → New
   GitHub App**.
2. Fill in:
   - **GitHub App name**: anything, e.g. `Café Faim CMS`.
   - **Homepage URL**: the site's URL once it's live (or the repo URL for now).
   - **Callback URL**: `https://<your-pages-domain>/admin/` — add the exact
     URL the site will be served from (see step 2 below for what that is).
   - Check **Request user authorization (OAuth) during installation**.
   - **Webhook**: uncheck "Active" — this app doesn't need one.
   - **Repository permissions → Contents**: Read and write.
   - **Where can this GitHub App be installed?**: Only on this account is fine.
3. Create the app, then **install it** on the `CafeFaim` repository specifically
   (GitHub prompts for this right after creation).
4. Copy the **Client ID** shown on the app's settings page.
5. Open [`admin/config.yml`](config.yml) and replace
   `REPLACE_WITH_GITHUB_APP_CLIENT_ID` with that Client ID. Commit and push.

If any of GitHub's own screen labels have shifted since this was written,
Decap CMS's official docs are the source of truth:
<https://decapcms.org/docs/github-backend/> (see the `auth_type: pkce` section).

## 2. Turn on GitHub Pages

1. **Repo → Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**
   (not "Deploy from a branch" — the workflow at
   `.github/workflows/deploy.yml` handles the build itself).
3. Push to `main` once (or re-run the workflow from the Actions tab) and
   the site + `/admin/` go live at the URL GitHub shows on that Pages
   settings screen.

## Using it day to day

Visit `/admin/` on the live site, sign in with GitHub, edit, and hit
Publish. That's it — the Action rebuilds `index.html` from the saved JSON
and redeploys within a minute or two.

Nothing here is protected by the `/admin/` URL being obscure — it's
protected by the GitHub login. Only accounts with write access to this
repo can actually save a change.

## Testing locally, before any of the above is set up

You don't need a GitHub App or GitHub Pages to try the editing UI itself —
`config.yml` has `local_backend: true`, which lets `npx decap-server` stand
in for GitHub when the admin page is opened from `localhost`. It writes
straight to your local `content/*.json` files, no login at all.

```bash
npx decap-server        # in one terminal — the local save proxy, port 8081
npx serve -l 8080 .     # in another — serves the site itself, port 8080
```

Then open `http://localhost:8080/admin/` and click the "Login" button (it's
a formality in this mode — nothing to type). Edits saved here land directly
in `content/*.json` on disk; run `node build.js` afterward to fold them into
`index.html` and check the result in a normal browser tab.

This mode is a no-op in production — Decap only looks for the local proxy
when the admin page itself is served from `localhost`/`127.0.0.1`, so
there's nothing to turn off before going live.
