/*
 * Turns "the editor state before" and "the editor state now" into a list of
 * plain Dutch sentences, for the confirmation shown before saving.
 *
 * Deliberately generic rather than four hand-written diffs: every editor is a
 * tree of records with { nl, en } fields and an id on anything in a list, so one
 * walker covers the concept block, both photo lists and the whole menu — and a
 * new field added to any editor is described without touching this file.
 *
 * Pure, so scripts/verify.mjs can check it without a browser.
 */

const FIELD_LABELS = {
  kicker: 'Kopje erboven',
  heading: 'Kopje',
  title: 'Titel',
  body1: 'Eerste alinea',
  body2: 'Tweede alinea',
  strong: 'Dikgedrukt',
  label: 'Regel eronder',
  blurb: 'Regel eronder',
  caption: 'Bijschrift',
  name: 'Naam',
  price: 'Prijs',
  desc: 'Omschrijving',
  from: 'Prijs-voorvoegsel',
  lead: 'Introregel',
  note: 'Voetnoot',
  badge: 'Labeltje',
  text: 'Tekst',
  alt: 'Omschrijving van de foto',
  kind: 'Soort onderdeel',
  sub: 'Kleiner kopje',
};

// The same field name is labelled differently in different editors — `heading`
// is "Titel" on the concept block and "Kopje" on a menu section. The dialog has
// to echo the label the editor actually shows, or it describes a field the
// reader cannot find.
const SCOPED_LABELS = {
  block: { heading: 'Titel' },
};

// Keys whose contents are described by the records inside them, so they add no
// step of their own to the breadcrumb.
// 'columns' is transparent because compareList already names each column.
const TRANSPARENT = new Set(['block', 'cards', 'columns', 'items', 'groups', 'photos', 'pills']);

const COLUMN_NAMES = ['Linkerkolom', 'Rechterkolom'];

const MAX_LINES = 40;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// A { nl, en } pair is one field to a human, not two.
const isPair = (v) =>
  isObject(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => k === 'nl' || k === 'en');

const isRecord = (v) => isObject(v) && typeof v.id === 'string';
const asList = (v) => (Array.isArray(v) ? v : []);

function short(value) {
  const text = (value ?? '').toString().trim();
  if (!text) return '(leeg)';
  return text.length > 45 ? `“${text.slice(0, 45)}…”` : `“${text}”`;
}

/* The human name of a record — whatever it is called on screen. */
function nameOf(record) {
  for (const key of ['name', 'title', 'caption', 'heading', 'strong', 'text']) {
    const value = record?.[key];
    const text = isPair(value) ? value.nl : value;
    if (text && String(text).trim()) return String(text).trim();
  }
  return 'naamloos item';
}

const at = (path) => (path.length ? `${path.join(' › ')} — ` : '');

function comparePair(before, after, label, path, out) {
  const nlChanged = (before?.nl ?? '') !== (after?.nl ?? '');
  const enChanged = (before?.en ?? '') !== (after?.en ?? '');

  // Reported as separate lines so it is obvious which language moved, and so
  // an edit that changes only the translation is still visible.
  if (nlChanged) out.push(`${at(path)}${label}: ${short(before?.nl)} → ${short(after?.nl)}`);
  if (enChanged) out.push(`${at(path)}${label} (Engels): ${short(before?.en)} → ${short(after?.en)}`);
}

// Array.prototype.every is vacuously true for an empty array, so the length
// check is load-bearing: without it, deleting the last row of any list made the
// resulting [] look like the menu's two-column [[...],[...]] shape, and a record
// object was then walked as if it were an array.
const isListOfLists = (v) => Array.isArray(v) && v.length > 0 && v.every(Array.isArray);

function compareList(before, after, path, out, scope) {
  // Arrays of arrays: only the menu's two columns.
  if (isListOfLists(before) || isListOfLists(after)) {
    const count = Math.max(before.length, after.length);
    for (let i = 0; i < count; i += 1) {
      walk(before[i] ?? [], after[i] ?? [], [...path, COLUMN_NAMES[i] ?? `Kolom ${i + 1}`], out, scope);
    }
    return;
  }

  if (!before.every(isRecord) && !after.every(isRecord)) {
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      out.push(`${at(path)}lijst aangepast`);
    }
    return;
  }

  const beforeById = new Map(before.map((r) => [r.id, r]));
  const afterById = new Map(after.map((r) => [r.id, r]));

  for (const record of after) {
    if (!beforeById.has(record.id)) out.push(`${at(path)}toegevoegd: ${nameOf(record)}`);
  }
  for (const record of before) {
    if (!afterById.has(record.id)) out.push(`${at(path)}VERWIJDERD: ${nameOf(record)}`);
  }

  // Reordering is reported once for the list, not once per moved row.
  const commonBefore = before.filter((r) => afterById.has(r.id)).map((r) => r.id);
  const commonAfter = after.filter((r) => beforeById.has(r.id)).map((r) => r.id);
  if (commonBefore.join() !== commonAfter.join()) {
    out.push(`${at(path)}volgorde aangepast`);
  }

  for (const record of after) {
    const previous = beforeById.get(record.id);
    if (previous) walk(previous, record, [...path, nameOf(previous)], out, scope);
  }
}

function walk(before, after, path, out, scope) {
  if (out.length > MAX_LINES) return;

  if (Array.isArray(before) || Array.isArray(after)) {
    // Coerced rather than defaulted: if a field is an array on one side and an
    // object on the other, the object must not reach the list comparison.
    compareList(asList(before), asList(after), path, out, scope);
    return;
  }

  if (isPair(before) || isPair(after)) return; // handled by the parent, which knows the label

  if (isObject(before) || isObject(after)) {
    const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
    for (const key of keys) {
      if (key === 'id') continue;
      const a = before?.[key];
      const b = after?.[key];
      const label = SCOPED_LABELS[scope]?.[key] ?? FIELD_LABELS[key] ?? key;

      if (isPair(a) || isPair(b)) {
        comparePair(a, b, label, path, out);
      } else if (Array.isArray(a) || Array.isArray(b) || isObject(a) || isObject(b)) {
        // Descending into a named container sets the scope for the labels inside it.
        walk(a, b, TRANSPARENT.has(key) ? path : [...path, label], out, SCOPED_LABELS[key] ? key : scope);
      } else if (a !== b) {
        if (key === 'src') out.push(`${at(path)}foto vervangen`);
        else if (key === 'sub') out.push(`${at(path)}${label}: ${b ? 'aan' : 'uit'}`);
        else out.push(`${at(path)}${label}: ${short(a)} → ${short(b)}`);
      }
    }
    return;
  }

  if (before !== after) out.push(`${at(path)}gewijzigd`);
}

export function describeChanges(before, after) {
  const out = [];
  walk(before, after, [], out);

  if (out.length > MAX_LINES) {
    const shown = out.slice(0, MAX_LINES);
    shown.push(`… en nog ${out.length - MAX_LINES} wijziging(en)`);
    return shown;
  }
  return out;
}

// Deletions are the only changes that cannot be undone after saving, so the
// dialog calls them out separately.
export const countRemovals = (lines) => lines.filter((l) => l.includes('VERWIJDERD')).length;
