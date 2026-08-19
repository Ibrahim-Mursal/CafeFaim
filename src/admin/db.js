import { supabase } from '../lib/supabase.js';

/*
 * Loading and saving for the editors.
 *
 * Every collection here is tiny (the whole menu is ~50 rows), so saving writes
 * the visible list back wholesale rather than tracking per-field changes:
 * upsert everything on screen, delete whatever was loaded but is no longer
 * there. Rows get their id in the browser, which is what makes that one
 * uniform upsert possible for both new and existing rows.
 */

export { newId } from './ids.js';

export async function loadTable(table, order = 'position') {
  const { data, error } = await supabase.from(table).select('*').order(order, { ascending: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

/*
 * Deletions run first. The reverse would briefly leave two rows claiming the
 * same position, and any unique-position constraint added later would reject
 * the write halfway through.
 */
export async function saveCollection({ table, rows, loadedIds, toDb }) {
  const keep = new Set(rows.map((r) => r.id));
  const removed = [...loadedIds].filter((id) => !keep.has(id));

  if (removed.length) {
    const { error } = await supabase.from(table).delete().in('id', removed);
    if (error) throw new Error(`${table} verwijderen: ${error.message}`);
  }

  if (rows.length) {
    // position is rewritten from array order, so "move up" in the UI is the
    // only thing an editor has to think about.
    const payload = rows.map((row, index) => ({ ...toDb(row), id: row.id, position: index }));
    const { error } = await supabase.from(table).upsert(payload);
    if (error) throw new Error(`${table} opslaan: ${error.message}`);
  }
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 6 * 1024 * 1024;

/*
 * Uploads a photo and returns its public URL.
 *
 * The filename is generated rather than taken from the upload: a name chosen
 * elsewhere should never decide a path on our storage. Type and size are
 * checked here for a quick, clear error, but the real guard is the storage
 * policy — only an admin may write to this bucket at all.
 */
export async function uploadImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error('Alleen JPG, PNG, WebP of AVIF.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Maximaal 6 MB per foto.');
  }

  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }[file.type];
  const path = `${new Date().getFullYear()}/${newId()}.${ext}`;

  const { error } = await supabase.storage
    .from('media')
    .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
  if (error) throw new Error(`Uploaden mislukt: ${error.message}`);

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

// _nl / _en helpers shared by the editors.
export const nl = (pair) => pair?.nl ?? '';
export const en = (pair) => pair?.en ?? '';
export const pairOf = (nlValue, enValue) => ({ nl: nlValue || null, en: enValue || null });
