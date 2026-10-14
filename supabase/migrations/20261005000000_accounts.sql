-- Accounts: who can sign up and sign in.
-- Profiles, the waitlist, invite lookup, and profile photos.
-- Run this first on a brand-new database, then the roster, content,
-- and signup files. Do not run this set on a database that already
-- has tables from an older migration.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('talent', 'agency')),
  display_name text,
  avatar_path text,
  agency_name text,
  country text,
  currency text,
  onboarding jsonb not null default '{}'::jsonb,
  onboarding_completed_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  consumed_by uuid references auth.users (id) on delete set null
);

create index profiles_last_seen_at_idx
  on public.profiles (last_seen_at desc nulls last);

-- ---------------------------------------------------------------------------
-- Profile guards
-- ---------------------------------------------------------------------------

create or replace function public.protect_profile()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.id := old.id;
  new.email := old.email;
  new.role := old.role;
  new.created_at := old.created_at;
  new.updated_at := now();
  if new.avatar_path is not null
     and new.avatar_path is distinct from (auth.uid()::text || '/avatar') then
    raise exception 'invalid avatar path';
  end if;
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile();

-- Throttled presence: signed-in users bump last_seen_at at most every 5 minutes.
create or replace function public.touch_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  update public.profiles
    set last_seen_at = now()
  where id = auth.uid()
    and (
      last_seen_at is null
      or last_seen_at < now() - interval '5 minutes'
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Invite codes
-- ---------------------------------------------------------------------------

create or replace function public.generate_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i integer;
  n integer;
begin
  for n in 1..12 loop
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
    end loop;
    if not exists (select 1 from public.waitlist where invite_code = code)
       and not exists (select 1 from public.talent_records where invite_code = code) then
      return code;
    end if;
  end loop;
  raise exception 'Could not generate an invite code';
end;
$$;

create or replace function public.join_waitlist(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(trim(p_email));
begin
  if normalized !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email';
  end if;

  if exists (select 1 from public.waitlist where email = normalized) then
    return;
  end if;

  begin
    insert into public.waitlist (email, invite_code)
    values (normalized, public.generate_invite_code());
  exception
    when unique_violation then
      return;
  end;
end;
$$;

create or replace function public.lookup_invite(p_code text, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
  email text := lower(trim(coalesce(p_email, '')));
  wl_email text;
  wl_consumed timestamptz;
  rec_email text;
  rec_status text;
  rec_linked uuid;
begin
  if code = '' or email = '' then
    return 'invalid';
  end if;

  select w.email, w.consumed_at
    into wl_email, wl_consumed
  from public.waitlist w
  where w.invite_code = code;

  if found then
    if wl_consumed is not null then
      return 'used';
    end if;
    if wl_email <> email then
      return 'email_mismatch';
    end if;
    return 'waitlist';
  end if;

  select t.email, t.status, t.linked_user_id
    into rec_email, rec_status, rec_linked
  from public.talent_records t
  where t.invite_code = code;

  if found then
    if rec_linked is not null or rec_status = 'active' then
      return 'used';
    end if;
    if rec_status <> 'invited' then
      return 'invalid';
    end if;
    if rec_email is null or lower(rec_email) <> email then
      return 'email_mismatch';
    end if;
    return 'talent';
  end if;

  return 'invalid';
end;
$$;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.waitlist enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on public.waitlist from public, anon, authenticated;
grant select on public.waitlist to service_role;
grant select, update on public.profiles to authenticated;

revoke all on function public.generate_invite_code() from public;
revoke all on function public.protect_profile() from public;
revoke all on function public.touch_last_seen() from public;
revoke all on function public.join_waitlist(text) from public;
revoke all on function public.lookup_invite(text, text) from public;

grant execute on function public.join_waitlist(text) to anon, authenticated;
grant execute on function public.lookup_invite(text, text) to anon, authenticated;
grant execute on function public.touch_last_seen() to authenticated;
grant execute on function public.protect_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- Profile photos. Objects are public so the app can show them with a URL.
-- Path must be {user id}/avatar.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

create policy avatars_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy avatars_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy avatars_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
