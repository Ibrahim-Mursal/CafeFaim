import { useEffect, useRef, useState } from 'react';
import { uploadImage } from './db.js';
import { countRemovals } from './changes.js';

/* Small building blocks shared by the four editors. */

export function Field({ label, children }) {
  return (
    <div className="ad-field">
      <span className="ad-label">{label}</span>
      {children}
    </div>
  );
}

/*
 * One label, two inputs: Dutch and English next to each other.
 *
 * English is optional everywhere. Leaving it empty is how the site is told the
 * text is the same in both languages, so the placeholder says so instead of
 * looking like a field somebody forgot.
 */
export function Bilingual({ label, value, onChange, textarea = false, placeholder = '' }) {
  const Input = textarea ? 'textarea' : 'input';
  const className = textarea ? 'ad-textarea' : 'ad-input';

  return (
    <div className="ad-field">
      <span className="ad-label">{label}</span>
      <div className="ad-bi">
        <div>
          <span className="ad-bi__lang">NL</span>
          <Input
            className={className}
            value={value?.nl ?? ''}
            placeholder={placeholder}
            onChange={(e) => onChange({ ...value, nl: e.target.value })}
          />
        </div>
        <div>
          <span className="ad-bi__lang ad-bi__lang--en">EN</span>
          <Input
            className={className}
            value={value?.en ?? ''}
            placeholder="zelfde als Nederlands"
            onChange={(e) => onChange({ ...value, en: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export function TextField({ label, value, onChange, placeholder = '', className = 'ad-input' }) {
  return (
    <Field label={label}>
      <input
        className={className}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

/* Reordering by buttons rather than drag-and-drop: it works with a keyboard,
   on a phone, and with a screen reader, none of which drag-and-drop does well. */
export function OrderTools({ index, total, onMove, onRemove, label }) {
  return (
    <div className="ad-tools">
      <button
        type="button"
        className="ad-icon"
        onClick={() => onMove(index, index - 1)}
        disabled={index === 0}
        aria-label={`${label} omhoog`}
        title="Omhoog"
      >
        ↑
      </button>
      <button
        type="button"
        className="ad-icon"
        onClick={() => onMove(index, index + 1)}
        disabled={index === total - 1}
        aria-label={`${label} omlaag`}
        title="Omlaag"
      >
        ↓
      </button>
      <button
        type="button"
        className="ad-icon ad-icon--danger"
        onClick={() => onRemove(index)}
        aria-label={`${label} verwijderen`}
        title="Verwijderen"
      >
        ✕
      </button>
    </div>
  );
}

export function ImageField({ value, alt, onChange, onAltChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const input = useRef(null);

  async function pick(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // let the same file be chosen again after an error
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ad-img">
      {value ? (
        <img className="ad-img__preview" src={value} alt="" />
      ) : (
        <div className="ad-img__empty">Geen foto</div>
      )}

      <div className="ad-img__side">
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          hidden
          onChange={pick}
        />
        <button
          type="button"
          className="ad-btn ad-btn--ghost ad-btn--sm"
          onClick={() => input.current?.click()}
          disabled={busy}
        >
          {busy ? 'Uploaden…' : value ? 'Andere foto kiezen' : 'Foto kiezen'}
        </button>
        {error && <p className="ad-error" style={{ marginTop: 8, fontSize: '.85rem' }}>{error}</p>}

        {/* Alt text is what a screen reader announces and what shows if the
            photo fails to load, so it is a plain required-feeling field. */}
        <div style={{ marginTop: 12 }}>
          <span className="ad-label">Omschrijving van de foto</span>
          <input
            className="ad-input"
            value={alt ?? ''}
            placeholder="bv. Roze verjaardagstaart met gouden drip"
            onChange={(e) => onAltChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

/*
 * Modal confirmation.
 *
 * Escape and the backdrop both cancel, and focus moves to the safest button on
 * open — Annuleren when the action destroys something, so a stray Enter or an
 * impatient second click cannot confirm it.
 */
export function ConfirmDialog({ open, title, intro, lines, note, confirmLabel, danger, onConfirm, onCancel }) {
  const safeButton = useRef(null);

  useEffect(() => {
    if (!open) return;
    safeButton.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="ad-modal" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="ad-modal__card" role="dialog" aria-modal="true" aria-labelledby="ad-modal-title">
        <h2 id="ad-modal-title">{title}</h2>
        {intro && <p className="ad-note">{intro}</p>}

        {lines && lines.length > 0 && (
          <ul className="ad-changes">
            {lines.map((line, i) => (
              <li key={i} className={line.includes('VERWIJDERD') ? 'ad-changes__gone' : undefined}>
                {line}
              </li>
            ))}
          </ul>
        )}

        {note && <div className="ad-alert ad-alert--error">{note}</div>}

        <div className="ad-modal__actions">
          <button
            type="button"
            ref={danger ? safeButton : null}
            className="ad-btn ad-btn--ghost"
            onClick={onCancel}
          >
            Annuleren
          </button>
          <button
            type="button"
            ref={danger ? null : safeButton}
            className={`ad-btn ${danger ? 'ad-btn--danger' : 'ad-btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
 * Fixed bar along the bottom.
 *
 * Save is explicit rather than autosaved: the owner is editing live prices, and
 * a visible "unsaved changes" state plus one button is easier to trust than
 * changes that disappear into the database as you type.
 *
 * Both buttons confirm first, for opposite reasons — Opslaan publishes to the
 * public site immediately, and Ongedaan maken throws work away with no undo.
 * The save dialog lists what will actually change, because "are you sure?" on
 * its own asks a question the reader has no way to answer.
 */
export function SaveBar({ dirty, saving, saved, error, changes = [], onSave, onReset }) {
  const [asking, setAsking] = useState(null); // 'save' | 'reset' | null
  const removals = countRemovals(changes);

  let message;
  if (error) message = <span className="ad-error">{error}</span>;
  else if (saving) message = <span>Opslaan…</span>;
  else if (dirty)
    message = (
      <span className="ad-dirty">
        {changes.length} wijziging{changes.length === 1 ? '' : 'en'} nog niet opgeslagen
      </span>
    );
  else if (saved) message = <span className="ad-saved">✓ Opgeslagen — staat live op de site</span>;
  else message = <span style={{ color: '#6B6B63' }}>Alles is opgeslagen.</span>;

  return (
    <>
      <div className="ad-savebar">
        <div className="ad-savebar__inner">
          <div className="ad-savebar__msg">{message}</div>
          <button
            type="button"
            className="ad-btn ad-btn--ghost"
            onClick={() => setAsking('reset')}
            disabled={!dirty || saving}
          >
            Wijzigingen ongedaan maken
          </button>
          <button
            type="button"
            className="ad-btn ad-btn--primary"
            onClick={() => setAsking('save')}
            disabled={!dirty || saving}
          >
            Opslaan
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={asking === 'save'}
        title="Dit wordt opgeslagen"
        intro="Deze wijzigingen komen meteen op de website te staan."
        lines={changes}
        note={
          removals > 0
            ? `Let op: ${removals} onderdeel${removals === 1 ? '' : 'en'} wordt definitief verwijderd. Dit kan daarna niet meer ongedaan worden gemaakt.`
            : null
        }
        confirmLabel="Ja, opslaan"
        onCancel={() => setAsking(null)}
        onConfirm={() => {
          setAsking(null);
          onSave();
        }}
      />

      <ConfirmDialog
        open={asking === 'reset'}
        title="Wijzigingen weggooien?"
        intro={`Je ${changes.length} wijziging${changes.length === 1 ? '' : 'en'} ${changes.length === 1 ? 'gaat' : 'gaan'} verloren. De laatst opgeslagen versie komt terug.`}
        lines={changes}
        confirmLabel="Ja, weggooien"
        danger
        onCancel={() => setAsking(null)}
        onConfirm={() => {
          setAsking(null);
          onReset();
        }}
      />
    </>
  );
}

/* Warns before a reload or tab close throws away unsaved edits. */
export function useUnsavedGuard(dirty) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}

export function Loading() {
  return <p className="ad-spinner">Laden…</p>;
}
