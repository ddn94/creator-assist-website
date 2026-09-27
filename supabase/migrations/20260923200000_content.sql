-- Content, ideas, deliverables, and expenses for talent accounts.
-- Agency sees linked-talent content via talent_records.linked_user_id,
-- and can read linked talent profile fields (e.g. avatar_path, last_seen_at).
-- Run in staging (and later main) after the auth migration.

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  platform text not null default 'Instagram',
  niche text,
  type text not null check (type in ('organic', 'paid_collab')),
  brand_name text,
  stage text not null default 'concept'
    check (stage in ('concept', 'filmed', 'edited', 'delivered', 'go_live')),
  go_live_date date,
  shot_list text not null default '',
  notes text not null default '',
  idea_title text,
  fee_agreed numeric(12, 2),
  payment_terms text
    check (
      payment_terms is null
      or payment_terms in ('net_30', 'net_60', 'net_90', 'net_120')
    ),
  date_delivered date,
  date_invoiced date,
  date_paid date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_items_owner_id_idx on public.content_items (owner_id);
create index content_items_updated_at_idx on public.content_items (updated_at desc);

create table public.content_deliverables (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items (id) on delete cascade,
  type text not null check (type in ('video', 'carousel', 'stories')),
  quantity integer not null default 1 check (quantity > 0),
  rate numeric(12, 2) not null default 0,
  sort_order integer not null default 0
);

create index content_deliverables_content_id_idx
  on public.content_deliverables (content_id);

create table public.content_expenses (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items (id) on delete cascade,
  category text not null check (category in ('editor', 'props', 'travel', 'other')),
  amount numeric(12, 2) not null default 0,
  note text,
  expense_date date not null,
  sort_order integer not null default 0
);

create index content_expenses_content_id_idx
  on public.content_expenses (content_id);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  tags text[] not null default '{}',
  status text not null default 'idea'
    check (status in ('idea', 'in_progress', 'used')),
  linked_content_id uuid references public.content_items (id) on delete set null,
  created_at timestamptz not null default now()
);

create index ideas_owner_id_idx on public.ideas (owner_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.touch_content_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger content_items_touch
  before update on public.content_items
  for each row execute function public.touch_content_updated_at();

create or replace function public.is_agency_of_owner(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.talent_records t
    where t.agency_id = (select auth.uid())
      and t.linked_user_id = p_owner
  );
$$;

create or replace function public.linked_talent_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.linked_user_id
  from public.talent_records t
  where t.agency_id = (select auth.uid())
    and t.linked_user_id is not null;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.content_items enable row level security;
alter table public.content_deliverables enable row level security;
alter table public.content_expenses enable row level security;
alter table public.ideas enable row level security;

create policy content_select_own_or_agency
  on public.content_items
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or public.is_agency_of_owner(owner_id)
  );

create policy content_insert_own
  on public.content_items
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy content_update_own_or_agency
  on public.content_items
  for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    or public.is_agency_of_owner(owner_id)
  )
  with check (
    owner_id = (select auth.uid())
    or public.is_agency_of_owner(owner_id)
  );

create policy content_delete_own
  on public.content_items
  for delete
  to authenticated
  using (owner_id = (select auth.uid()));

create policy deliverables_select
  on public.content_deliverables
  for select
  to authenticated
  using (
    exists (
      select 1 from public.content_items c
      where c.id = content_id
        and (
          c.owner_id = (select auth.uid())
          or public.is_agency_of_owner(c.owner_id)
        )
    )
  );

create policy deliverables_write_own
  on public.content_deliverables
  for all
  to authenticated
  using (
    exists (
      select 1 from public.content_items c
      where c.id = content_id and c.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.content_items c
      where c.id = content_id and c.owner_id = (select auth.uid())
    )
  );

create policy expenses_select
  on public.content_expenses
  for select
  to authenticated
  using (
    exists (
      select 1 from public.content_items c
      where c.id = content_id
        and (
          c.owner_id = (select auth.uid())
          or public.is_agency_of_owner(c.owner_id)
        )
    )
  );

create policy expenses_write_own
  on public.content_expenses
  for all
  to authenticated
  using (
    exists (
      select 1 from public.content_items c
      where c.id = content_id and c.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.content_items c
      where c.id = content_id and c.owner_id = (select auth.uid())
    )
  );

create policy ideas_select_own
  on public.ideas
  for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy ideas_insert_own
  on public.ideas
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy ideas_update_own
  on public.ideas
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy ideas_delete_own
  on public.ideas
  for delete
  to authenticated
  using (owner_id = (select auth.uid()));

grant select, insert, update, delete on public.content_items to authenticated;
grant select, insert, update, delete on public.content_deliverables to authenticated;
grant select, insert, update, delete on public.content_expenses to authenticated;
grant select, insert, update, delete on public.ideas to authenticated;

revoke all on function public.is_agency_of_owner(uuid) from public;
revoke all on function public.linked_talent_ids() from public;
grant execute on function public.is_agency_of_owner(uuid) to authenticated;
grant execute on function public.linked_talent_ids() to authenticated;

-- Agency may read linked talent profiles (avatar, last_seen_at, etc.).
-- Without this, profiles RLS only allows reading your own row.
create policy profiles_select_linked_talent
  on public.profiles
  for select
  to authenticated
  using (public.is_agency_of_owner(id));
