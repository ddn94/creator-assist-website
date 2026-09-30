-- Who changed a piece of content, and what they changed.
-- Run after 20260930140000_connection_request.sql.

create table public.content_changes (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  actor_name text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index content_changes_content_id_created_at_idx
  on public.content_changes (content_id, created_at desc);

alter table public.content_changes enable row level security;

create policy content_changes_select
  on public.content_changes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          c.owner_id = (select auth.uid())
          or public.agency_can_see_content(
            c.owner_id,
            c.talent_record_id,
            c.created_at,
            c.agency_visible
          )
        )
    )
  );

create policy content_changes_insert
  on public.content_changes
  for insert
  to authenticated
  with check (
    actor_id = (select auth.uid())
    and exists (
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          c.owner_id = (select auth.uid())
          or public.is_agency_of_owner(c.owner_id)
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
        )
    )
  );

grant select, insert on public.content_changes to authenticated;
