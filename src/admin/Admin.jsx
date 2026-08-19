import { useCallback, useMemo, useState } from 'react';
import { isConfigured } from '../lib/supabase.js';
import { useAuth } from './useAuth.js';
import { useEditor } from './useEditor.js';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { SaveBar, useUnsavedGuard } from './ui.jsx';
import { ConceptEditor, conceptIO } from './editors/ConceptEditor.jsx';
import { MenuEditor, menuIO } from './editors/MenuEditor.jsx';
import { CakesEditor, GalleryEditor, cakesIO, galleryIO } from './editors/PhotoListEditor.jsx';

const TABS = [
  { id: 'concept', label: 'Concepttekst', Editor: ConceptEditor },
  { id: 'menu', label: 'Menukaart', Editor: MenuEditor },
  { id: 'cakes', label: 'Taarten op maat', Editor: CakesEditor },
  { id: 'gallery', label: 'Galerij', Editor: GalleryEditor },
];

/*
 * All four editors' state lives here rather than inside each tab.
 *
 * Only the active tab is rendered, so if each editor owned its own state,
 * switching tabs would unmount it and throw away unsaved work without a word.
 * Holding it here means edits survive tab switches, one Opslaan saves the whole
 * dashboard, and the confirmation can list every pending change at once.
 */
function useWorkspace() {
  const editors = {
    concept: useEditor(conceptIO.load, conceptIO.save),
    menu: useEditor(menuIO.load, menuIO.save),
    cakes: useEditor(cakesIO.load, cakesIO.save),
    gallery: useEditor(galleryIO.load, galleryIO.save),
  };

  const sections = useMemo(
    () =>
      TABS.filter((t) => editors[t.id].changes.length > 0).map((t) => ({
        id: t.id,
        label: t.label,
        changes: editors[t.id].changes,
      })),
    [editors.concept.changes, editors.menu.changes, editors.cakes.changes, editors.gallery.changes]
  );

  const dirty = sections.length > 0;
  const saving = TABS.some((t) => editors[t.id].saving);
  // "Saved" only once nothing is left pending, so the message cannot claim
  // success while another tab still holds unsaved work.
  const saved = !dirty && TABS.some((t) => editors[t.id].saved);
  const error = TABS.map((t) => editors[t.id].error).find(Boolean) ?? null;

  const onSave = useCallback(async () => {
    // Sequential, so a failure names one table and the rest are not left
    // half-written by parallel requests racing each other.
    for (const tab of TABS) {
      if (editors[tab.id].changes.length > 0) await editors[tab.id].onSave();
    }
  }, [editors.concept, editors.menu, editors.cakes, editors.gallery]);

  const onReset = useCallback(() => {
    TABS.forEach((tab) => editors[tab.id].onReset());
  }, [editors.concept, editors.menu, editors.cakes, editors.gallery]);

  return { editors, sections, dirty, saving, saved, error, onSave, onReset };
}

/* Shown when the build has no Supabase credentials — a blank login box with no
   explanation would just look broken. */
function NotConfigured() {
  return (
    <div className="ad-gate">
      <div className="ad-card ad-card--wide">
        <h1>Beheer is nog niet gekoppeld</h1>
        <p className="ad-note">
          Er is nog geen Supabase-project ingesteld voor deze site. Zie <code>README.md</code>{' '}
          voor de volledige stappen; kort samengevat:
        </p>
        <ol className="ad-steps">
          <li>Maak een gratis project aan op supabase.com.</li>
          <li>
            Draai <code>supabase/schema.sql</code> en daarna <code>supabase/seed.sql</code> in de
            SQL Editor.
          </li>
          <li>
            Zet de projectgegevens in een <code>.env</code> naast <code>package.json</code>:
            <code className="ad-code">
              VITE_SUPABASE_URL=https://jouwproject.supabase.co{'\n'}
              VITE_SUPABASE_ANON_KEY=eyJhbGci…
            </code>
          </li>
          <li>
            Bouw de site opnieuw met <code>npm run build</code>.
          </li>
        </ol>
      </div>
    </div>
  );
}

function Login({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const message = await onSignIn(email.trim(), password);
    // Deliberately vague: a message that distinguishes "no such account" from
    // "wrong password" tells an attacker which addresses are worth attacking.
    if (message) setError('Inloggen mislukt. Controleer je e-mailadres en wachtwoord.');
    setBusy(false);
  }

  return (
    <div className="ad-gate">
      <form className="ad-card" onSubmit={submit}>
        <h1>Café Faim beheer</h1>
        <p className="ad-note">Log in om de teksten en foto's van de site aan te passen.</p>

        {error && <div className="ad-alert ad-alert--error">{error}</div>}

        <div className="ad-field">
          <label htmlFor="ad-email">E-mailadres</label>
          <input
            id="ad-email"
            className="ad-input"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="ad-field">
          <label htmlFor="ad-pass">Wachtwoord</label>
          <input
            id="ad-pass"
            className="ad-input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="ad-btn ad-btn--primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Bezig…' : 'Inloggen'}
        </button>
      </form>
    </div>
  );
}

/* Blocks the dashboard until the starter password has been replaced, so the
   password used to hand the account over cannot stay in use. */
function ChangePassword({ onChange, onSignOut }) {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (password !== repeat) {
      setError('De twee wachtwoorden zijn niet gelijk.');
      return;
    }
    if (password.length < 12) {
      setError('Gebruik minstens 12 tekens.');
      return;
    }
    setBusy(true);
    setError(null);
    const message = await onChange(password);
    if (message) setError(message);
    setBusy(false);
  }

  return (
    <div className="ad-gate">
      <form className="ad-card" onSubmit={submit}>
        <h1>Kies een eigen wachtwoord</h1>
        <p className="ad-note">
          Dit account gebruikt nog het wachtwoord waarmee het is aangemaakt. Kies er nu een eigen
          wachtwoord voor — minstens 12 tekens.
        </p>

        {error && <div className="ad-alert ad-alert--error">{error}</div>}

        <div className="ad-field">
          <label htmlFor="ad-new">Nieuw wachtwoord</label>
          <input
            id="ad-new"
            className="ad-input"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="ad-field">
          <label htmlFor="ad-new2">Nogmaals ter controle</label>
          <input
            id="ad-new2"
            className="ad-input"
            type="password"
            autoComplete="new-password"
            required
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
          />
        </div>

        <button className="ad-btn ad-btn--primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Bezig…' : 'Wachtwoord opslaan'}
        </button>
        <p className="ad-center" style={{ marginTop: 14 }}>
          <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={onSignOut}>
            Uitloggen
          </button>
        </p>
      </form>
    </div>
  );
}

function Denied({ onSignOut }) {
  return (
    <div className="ad-gate">
      <div className="ad-card">
        <h1>Geen toegang</h1>
        <p className="ad-note">
          Dit account mag de site niet beheren. Vraag de eigenaar om het toe te voegen aan de
          beheerderslijst.
        </p>
        <button className="ad-btn ad-btn--ghost" onClick={onSignOut}>
          Uitloggen
        </button>
      </div>
    </div>
  );
}

function Dashboard({ admin, onSignOut }) {
  const [tab, setTab] = useState('concept');
  const workspace = useWorkspace();
  useUnsavedGuard(workspace.dirty);

  const active = TABS.find((t) => t.id === tab);
  const Editor = active.Editor;

  return (
    <>
      <header className="ad-head">
        <div className="ad-head__bar">
          <span className="ad-brand">
            Faim <span>beheer</span>
          </span>
          <span className="ad-head__spacer" />
          <span className="ad-who">{admin?.email}</span>
          <a className="ad-btn ad-btn--ghost ad-btn--sm" href="./" target="_blank" rel="noopener">
            Bekijk site
          </a>
          <button className="ad-btn ad-btn--ghost ad-btn--sm" onClick={onSignOut}>
            Uitloggen
          </button>
        </div>

        <div className="ad-tabs" role="tablist">
          {TABS.map((t) => {
            const pending = workspace.editors[t.id].changes.length;
            return (
              <button
                key={t.id}
                className="ad-tab"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {/* A dot on the tab is what makes unsaved work elsewhere
                    discoverable without opening the save dialog. */}
                {pending > 0 && (
                  <span className="ad-tab__dot" title={`${pending} niet-opgeslagen wijziging(en)`} />
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="ad-main">
        {/* The boundary resets per tab, but the editor state it wraps lives in
            useWorkspace, so a crash no longer costs the other tabs' work. */}
        <ErrorBoundary key={tab}>
          <Editor editor={workspace.editors[tab]} />
        </ErrorBoundary>
      </main>

      <SaveBar
        sections={workspace.sections}
        dirty={workspace.dirty}
        saving={workspace.saving}
        saved={workspace.saved}
        error={workspace.error}
        onSave={workspace.onSave}
        onReset={workspace.onReset}
        onGoTo={setTab}
      />
    </>
  );
}

export default function Admin() {
  const { admin, status, signIn, signOut, changePassword } = useAuth();

  if (!isConfigured) return <NotConfigured />;
  if (status === 'checking') return <p className="ad-spinner">Even geduld…</p>;
  if (status === 'out') return <Login onSignIn={signIn} />;
  if (status === 'denied') return <Denied onSignOut={signOut} />;
  if (admin?.must_change_password) {
    return <ChangePassword onChange={changePassword} onSignOut={signOut} />;
  }

  return <Dashboard admin={admin} onSignOut={signOut} />;
}
