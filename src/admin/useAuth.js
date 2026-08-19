import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

/*
 * Session state for the dashboard.
 *
 * Being signed in is not the same as being allowed in: after Supabase confirms
 * the password, we still look the account up in the `admins` table. That table
 * is also what the database's own write policies check, so the UI and the
 * server agree on who counts as an admin — the screen you see and the rows you
 * may actually change are decided by the same fact.
 *
 * The check is a real query, not a claim carried in the token, so revoking
 * access is one deleted row and takes effect on the next load.
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState('checking'); // checking | out | denied | in

  const loadAdmin = useCallback(async (activeSession) => {
    if (!activeSession) {
      setAdmin(null);
      setStatus('out');
      return;
    }

    const { data, error } = await supabase
      .from('admins')
      .select('id, email, must_change_password')
      .eq('id', activeSession.user.id)
      .maybeSingle();

    if (error || !data) {
      setAdmin(null);
      setStatus('denied');
      return;
    }

    setAdmin(data);
    setStatus('in');
  }, []);

  useEffect(() => {
    if (!supabase) {
      setStatus('out');
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      loadAdmin(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setStatus(next ? 'checking' : 'out');
      loadAdmin(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadAdmin]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Supabase verifies the new password server-side and rotates the session, so
  // the old one cannot be replayed. Only once that succeeds do we clear the
  // must-change flag — otherwise a failed change would unlock the dashboard.
  const changePassword = useCallback(
    async (password) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return error.message;

      const { error: flagError } = await supabase
        .from('admins')
        .update({ must_change_password: false })
        .eq('id', session.user.id);
      if (flagError) return flagError.message;

      setAdmin((prev) => (prev ? { ...prev, must_change_password: false } : prev));
      return null;
    },
    [session]
  );

  return { session, admin, status, signIn, signOut, changePassword };
}
