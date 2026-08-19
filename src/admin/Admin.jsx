import { useState } from 'react';
import { isConfigured } from '../lib/supabase.js';
import { useAuth } from './useAuth.js';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { ConceptEditor } from './editors/ConceptEditor.jsx';
import { MenuEditor } from './editors/MenuEditor.jsx';
import { CakesEditor, GalleryEditor } from './editors/PhotoListEditor.jsx';

const TABS = [
  { id: 'concept', label: 'Concepttekst', Editor: ConceptEditor },
  { id: 'menu', label: 'Menukaart', Editor: MenuEditor },
  { id: 'cakes', label: 'Taarten op maat', Editor: CakesEditor },
  { id: 'gallery', label: 'Galerij', Editor: GalleryEditor },
];

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

export default function Admin() {
  const { admin, status, signIn, signOut, changePassword } = useAuth();
  const [tab, setTab] = useState('concept');

  if (!isConfigured) return <NotConfigured />;
  if (status === 'checking') return <p className="ad-spinner">Even geduld…</p>;
  if (status === 'out') return <Login onSignIn={signIn} />;
  if (status === 'denied') return <Denied onSignOut={signOut} />;
  if (admin?.must_change_password) {
    return <ChangePassword onChange={changePassword} onSignOut={signOut} />;
  }

  const Editor = TABS.find((t) => t.id === tab).Editor;

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
          <button className="ad-btn ad-btn--ghost ad-btn--sm" onClick={signOut}>
            Uitloggen
          </button>
        </div>

        <div className="ad-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              className="ad-tab"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="ad-main">
        {/* Remounting on tab change is intentional: each editor reloads its own
            rows, so you never edit a stale copy after saving elsewhere. The
            boundary sits inside the shell so a crash in one editor leaves the
            tabs usable — switching away is the quickest way out. */}
        <ErrorBoundary key={tab}>
          <Editor />
        </ErrorBoundary>
      </main>
    </>
  );
}
