-- =====================================================================
-- Café Faim — security self-test
--
-- Run in the Supabase SQL editor AFTER schema.sql. It impersonates a
-- visitor and a signed-in non-admin, tries to change content, and reports
-- whether each attempt was correctly refused. Every row must say PASS.
--
-- Safe to run against live content, by construction rather than by relying
-- on a rollback:
--   * the UPDATE probes assign a column to itself, so even if a policy let
--     one through, no value changes;
--   * the INSERT probes write a marked row that the cleanup at the bottom
--     removes, and which is only ever created if a policy is already broken;
--   * DELETE is never attempted — it is the one thing that cannot be undone,
--     so its policies are inspected instead.
--
-- Supabase will still warn that the script contains destructive operations,
-- because it does contain INSERT/DELETE keywords. Reading them is worthwhile;
-- the notes above are what they amount to.
--
-- Re-run after any change to the policies, and after adding an admin.
-- =====================================================================

do $$
declare
  fake_user constant uuid := '00000000-0000-0000-0000-0000000000ff';
  probe     constant text := '__rls_probe__';
  results   jsonb := '[]'::jsonb;
  ok        boolean;
  msg       text;
  n         int;
  truth     int;
begin
  -- Results accumulate in a variable, never in a table, and every probe
  -- resets the role before recording. Assigning a variable needs no
  -- privileges; writing to a table while still switched to anon would fail on
  -- permissions, be caught by the same exception handler as a blocked write,
  -- and turn a broken policy into a false PASS.
  ------------------------------------------------------------------ 1 ----
  -- Policies on a table with RLS switched off are decoration: Postgres
  -- never consults them.
  select count(*) into n
  from pg_class c
  where c.relnamespace = 'public'::regnamespace
    and c.relname in ('admins','concept','site_settings','concept_pills','cakes',
                      'gallery_photos','menu_cards','menu_sections','menu_items')
    and not c.relrowsecurity;
  results := results || jsonb_build_object(
    'result', case when n = 0 then 'PASS' else '**FAIL**' end,
    'check_name', 'row level security enabled on all 9 tables',
    'detail', case when n = 0 then 'all enabled' else n || ' table(s) unprotected' end);

  ------------------------------------------------------------------ 2 ----
  -- The public site reads with the anon key, so a visitor must still see
  -- everything. Compared against the true count rather than "more than
  -- zero", so this stays meaningful before the seed has been loaded.
  select count(*) into truth from public.menu_items;
  begin
    set local role anon;
    select count(*) into n from public.menu_items;
    ok := (n = truth);
    msg := n || ' of ' || truth || ' rows visible';
  exception when others then
    ok := false;
    msg := sqlerrm;
  end;
  reset role;
  results := results || jsonb_build_object(
    'result', case when ok then 'PASS' else '**FAIL**' end,
    'check_name', 'visitor can read the menu', 'detail', msg);

  ------------------------------------------------------------------ 3 ----
  begin
    set local role anon;
    insert into public.cakes (title_nl) values (probe);
    ok := false; msg := 'INSERT WAS ALLOWED';
  exception when others then
    ok := true; msg := sqlerrm;
  end;
  reset role;
  results := results || jsonb_build_object(
    'result', case when ok then 'PASS' else '**FAIL**' end,
    'check_name', 'visitor cannot add a cake', 'detail', msg);

  ------------------------------------------------------------------ 4 ----
  -- price = price: a refused update and a permitted one are told apart by
  -- the row count, without either one altering a price.
  begin
    set local role anon;
    update public.menu_items set price = price where id is not null;
    get diagnostics n = row_count;
    ok := (n = 0); msg := n || ' row(s) writable';
  exception when others then
    ok := true; msg := sqlerrm;
  end;
  reset role;
  results := results || jsonb_build_object(
    'result', case when ok then 'PASS' else '**FAIL**' end,
    'check_name', 'visitor cannot change prices', 'detail', msg);

  ------------------------------------------------------------------ 5 ----
  begin
    set local role anon;
    select count(*) into n from public.admins;
    ok := (n = 0); msg := n || ' admin row(s) visible';
  exception when others then
    ok := true; msg := sqlerrm;
  end;
  reset role;
  results := results || jsonb_build_object(
    'result', case when ok then 'PASS' else '**FAIL**' end,
    'check_name', 'visitor cannot list admins', 'detail', msg);

  ------------------------------------------------------------------ 6 ----
  -- Signed in but not an admin. This is the case that decides whether an
  -- open sign-up setting turns into an open door.
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims',
      json_build_object('sub', fake_user, 'role', 'authenticated')::text, true);
    insert into public.cakes (title_nl) values (probe);
    ok := false; msg := 'INSERT WAS ALLOWED';
  exception when others then
    ok := true; msg := sqlerrm;
  end;
  reset role;
  results := results || jsonb_build_object(
    'result', case when ok then 'PASS' else '**FAIL**' end,
    'check_name', 'signed-in non-admin cannot add content', 'detail', msg);

  ------------------------------------------------------------------ 7 ----
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims',
      json_build_object('sub', fake_user, 'role', 'authenticated')::text, true);
    update public.concept set heading_nl = heading_nl where id = 1;
    get diagnostics n = row_count;
    ok := (n = 0); msg := n || ' row(s) writable';
  exception when others then
    ok := true; msg := sqlerrm;
  end;
  reset role;
  results := results || jsonb_build_object(
    'result', case when ok then 'PASS' else '**FAIL**' end,
    'check_name', 'signed-in non-admin cannot edit the concept text', 'detail', msg);

  ------------------------------------------------------------------ 8 ----
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims',
      json_build_object('sub', fake_user, 'role', 'authenticated')::text, true);
    insert into public.admins (id, email) values (fake_user, probe);
    ok := false; msg := 'INSERT WAS ALLOWED';
  exception when others then
    ok := true; msg := sqlerrm;
  end;
  reset role;
  results := results || jsonb_build_object(
    'result', case when ok then 'PASS' else '**FAIL**' end,
    'check_name', 'nobody can grant themselves admin', 'detail', msg);

  ------------------------------------------------------------------ 9 ----
  -- DELETE is never attempted, so its policies are checked directly: seven
  -- content tables, each with a delete policy gated on is_admin().
  select count(*) into n
  from pg_policies
  where schemaname = 'public' and cmd = 'DELETE'
    and tablename in ('concept','site_settings','concept_pills','cakes',
                      'gallery_photos','menu_cards','menu_sections','menu_items')
    and qual like '%is_admin%';
  results := results || jsonb_build_object(
    'result', case when n = 8 then 'PASS' else '**FAIL**' end,
    'check_name', 'deleting content is admin-only',
    'detail', n || ' of 8 tables gated on is_admin()');

  ----------------------------------------------------------------- 10 ----
  select count(*) into n
  from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'admins'
    and grantee = 'authenticated' and privilege_type = 'UPDATE'
    and column_name <> 'must_change_password';
  results := results || jsonb_build_object(
    'result', case when n = 0 then 'PASS' else '**FAIL**' end,
    'check_name', 'admins: only must_change_password is writable',
    'detail', case when n = 0 then 'no other writable columns'
                   else n || ' extra column(s) writable' end);

  ----------------------------------------------------------------- 11 ----
  select count(*) into n
  from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and policyname in ('media_insert','media_update','media_delete');
  results := results || jsonb_build_object(
    'result', case when n = 3 then 'PASS' else '**FAIL**' end,
    'check_name', 'photo uploads restricted to admins',
    'detail', n || ' of 3 write policies present');

  perform set_config('faim.security_check', results::text, false);
end $$;

-- Removes the marked rows, which exist only if a policy let one through.
-- Normally deletes nothing.
delete from public.cakes  where title_nl = '__rls_probe__';
delete from public.admins where email    = '__rls_probe__';

select result, check_name, detail
from jsonb_to_recordset(current_setting('faim.security_check')::jsonb)
  as t(result text, check_name text, detail text);
