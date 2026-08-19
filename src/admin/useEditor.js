import { useCallback, useEffect, useMemo, useState } from 'react';
import { describeChanges } from './changes.js';

/*
 * Shared load / edit / save cycle for the four editors.
 *
 * Dirtiness is a comparison against the snapshot taken when the data loaded,
 * not a flag set on every keystroke. That way typing something and undoing it
 * correctly leaves the editor clean, and "Wijzigingen ongedaan maken" is just
 * restoring that snapshot — no change log to keep in sync.
 */
export function useEditor(load, save) {
  const [data, setData] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | failed
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const loaded = await load();
      setData(loaded);
      setSnapshot(JSON.stringify(loaded));
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('failed');
    }
  }, [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dirty = useMemo(
    () => status === 'ready' && JSON.stringify(data) !== snapshot,
    [data, snapshot, status]
  );

  // Described from the same snapshot that decides dirtiness, so the list in the
  // confirmation dialog can never disagree with the button being enabled.
  const changes = useMemo(
    () => (dirty ? describeChanges(JSON.parse(snapshot), data) : []),
    [dirty, snapshot, data]
  );

  const update = useCallback((next) => {
    setSaved(false);
    setData((prev) => (typeof next === 'function' ? next(prev) : next));
  }, []);

  const onSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      // save() also gets the snapshot, because working out which rows were
      // deleted means comparing against what was loaded — the current list, by
      // definition, no longer contains them.
      await save(data, JSON.parse(snapshot));
      // Re-read rather than trusting the local copy: this is what confirms the
      // write actually landed, and it picks up anything the database filled in.
      const fresh = await load();
      setData(fresh);
      setSnapshot(JSON.stringify(fresh));
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [data, load, save, snapshot]);

  const onReset = useCallback(() => {
    if (snapshot == null) return;
    setData(JSON.parse(snapshot));
    setSaved(false);
    setError(null);
  }, [snapshot]);

  return { data, update, status, dirty, changes, saving, saved, error, onSave, onReset, refresh };
}

/* Moves an item within a list; used by every reorder button. */
export function moveItem(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
