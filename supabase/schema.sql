-- =====================================================================
-- Café Faim — content schema + security rules
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New
-- query → paste → Run). Safe to re-run: every statement is guarded.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Who is allowed to write
--
-- Public read, admin-only write. "Admin" is membership of the admins
-- table, NOT merely being logged in — if sign-ups ever get enabled by
-- accident, a stranger with an account still cannot touch the content.
--
-- SECURITY DEFINER so the check itself can read admins without tripping
-- that table's own row-level policy (which would recurse). search_path is
-- pinned so the function cannot be redirected at a shadowed table.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  id                   uuid primary key references auth.users on delete cascade,
  email                text,
  must_change_password boolean not null default true,
  created_at           timestamptz not null default now()
);

alter table public.admins
  add column if not exists must_change_password boolean not null default true;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Content tables
-- Every translatable field is a _nl / _en pair. Leave _en empty when the
-- text is identical in both languages; the site falls back to _nl.
-- ---------------------------------------------------------------------

-- Single row (id is pinned to 1) holding the "Het concept" block.
create table if not exists public.concept (
  id          int primary key default 1 check (id = 1),
  kicker_nl   text, kicker_en  text,
  heading_nl  text, heading_en text,
  body1_nl    text, body1_en   text,
  body2_nl    text, body2_en   text,
  updated_at  timestamptz not null default now()
);

-- Single row (id pinned to 1) for site-wide media that is not part of any one
-- section. Only the hero video today; a table rather than more columns on
-- `concept` because it is not concept copy and would not belong there.
create table if not exists public.site_settings (
  id              int primary key default 1 check (id = 1),
  hero_video_path text,
  updated_at      timestamptz not null default now()
);

create table if not exists public.concept_pills (
  id        uuid primary key default gen_random_uuid(),
  position  int  not null default 0,
  strong_nl text, strong_en text,
  label_nl  text, label_en  text
);

create table if not exists public.cakes (
  id         uuid primary key default gen_random_uuid(),
  position   int  not null default 0,
  image_path text,
  alt        text,
  title_nl   text, title_en text,
  blurb_nl   text, blurb_en text
);

create table if not exists public.gallery_photos (
  id         uuid primary key default gen_random_uuid(),
  position   int  not null default 0,
  image_path text,
  alt        text,
  caption_nl text, caption_en text
);

create table if not exists public.menu_cards (
  id       uuid primary key default gen_random_uuid(),
  position int  not null default 0,
  title_nl text, title_en text
);

-- parent_id lets the highlighted matcha panel ("feature") hold its own
-- sub-groups without a second table.
create table if not exists public.menu_sections (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid references public.menu_cards    on delete cascade,
  parent_id    uuid references public.menu_sections on delete cascade,
  column_index int  not null default 0,
  position     int  not null default 0,
  kind         text not null default 'group'
               check (kind in ('group','box','boxList','feature','till')),
  sub          boolean not null default false,
  heading_nl   text, heading_en text,
  lead_nl      text, lead_en    text,
  note_nl      text, note_en    text,
  badge_nl     text, badge_en   text,
  text_nl      text, text_en    text
);

create table if not exists public.menu_items (
  id         uuid primary key default gen_random_uuid(),
  section_id uuid references public.menu_sections on delete cascade,
  position   int  not null default 0,
  name_nl    text, name_en text,
  price      text,
  desc_nl    text, desc_en text,
  from_nl    text, from_en text
);

create index if not exists menu_sections_card_idx on public.menu_sections (card_id, column_index, position);
create index if not exists menu_sections_parent_idx on public.menu_sections (parent_id, position);
create index if not exists menu_items_section_idx  on public.menu_items (section_id, position);

-- ---------------------------------------------------------------------
-- Row Level Security
--
-- RLS denies everything until a policy allows it, so enabling it on every
-- table is what makes the rules below the complete story.
-- ---------------------------------------------------------------------
alter table public.admins         enable row level security;
alter table public.concept        enable row level security;
alter table public.site_settings  enable row level security;
alter table public.concept_pills  enable row level security;
alter table public.cakes          enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.menu_cards     enable row level security;
alter table public.menu_sections  enable row level security;
alter table public.menu_items     enable row level security;

-- Content: anyone may read (the public site uses the anon key), only an
-- admin may write. Written as one policy per command so an over-broad
-- FOR ALL can never quietly grant more than intended.
do $$
declare t text;
begin
  foreach t in array array[
    'concept','site_settings','concept_pills','cakes','gallery_photos',
    'menu_cards','menu_sections','menu_items'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_read',   t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);

    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_read', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
      t || '_insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_admin())',
      t || '_delete', t);
  end loop;
end $$;

-- The admins table is never publicly readable: knowing who the admin is
-- is not something a visitor needs. An admin may read their own row (the
-- dashboard uses it to confirm the account still has access) and nothing
-- else. There is deliberately no insert/update/delete policy — adding an
-- admin is a manual step in the Supabase dashboard, so a compromised
-- browser session cannot mint new admins.
drop policy if exists admins_read_self on public.admins;
create policy admins_read_self on public.admins
  for select to authenticated using (id = auth.uid());

-- The dashboard clears must_change_password after the first password change,
-- so that one flag has to be writable. Column-level grants keep it to exactly
-- that: RLS limits the row to your own, and the GRANT limits the column, so a
-- hijacked session still cannot rewrite `email` or promote another account.
drop policy if exists admins_update_self on public.admins;
create policy admins_update_self on public.admins
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

revoke update on public.admins from anon, authenticated;
grant  update (must_change_password) on public.admins to authenticated;

-- ---------------------------------------------------------------------
-- Storage bucket for uploaded photos
-- Public read so <img> works without signed URLs; writes admin-only.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists media_read   on storage.objects;
drop policy if exists media_insert on storage.objects;
drop policy if exists media_update on storage.objects;
drop policy if exists media_delete on storage.objects;

create policy media_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
create policy media_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy media_update on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy media_delete on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
