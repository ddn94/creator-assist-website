-- Content: posts, deals, deliverables, expenses, ideas, and change history.
-- An agency sees a private card, a connected talent from the day they
-- connected, and a frozen copy after a split. Ideas stay on the talent account.
-- Run after 20261005000100_roster.sql.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete cascade,
  talent_record_id uuid references public.talent_records (id) on delete cascade,
  title text not null,
  platform text not null default 'Instagram',
  niche text,
  type text not null check (type in ('organic', 'paid_collab')),
  brand_name text,
  stage text not null default 'concept'
    check (stage in ('concept', 'filmed', 'edited', 'delivered', 'go_live')),
  go_live_date timestamptz,
  shot_list text not null default '',
  notes text not null default '',
  idea_title text,
  fee_agreed numeric(12, 2),
  currency text,
  payment_terms text
    check (
      payment_terms is null
      or payment_terms in ('net_30', 'net_60', 'net_90', 'net_120')
    ),
  date_delivered timestamptz,
  date_invoiced timestamptz,
  date_paid timestamptz,
  agency_visible boolean not null default true,
  talent_hidden_at timestamptz,
  agency_copy_of uuid,
  agency_created boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_has_owner
    check (owner_id is not null or talent_record_id is not null)
);

create unique index content_items_agency_copy_of_key
  on public.content_items (agency_copy_of)
  where agency_copy_of is not null;

create index content_items_owner_id_idx on public.content_items (owner_id);
create index content_items_talent_record_id_idx on public.content_items (talent_record_id);
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
  sort_order integer not null default 0,
  currency text
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

-- ---------------------------------------------------------------------------
-- Visibility
-- ---------------------------------------------------------------------------

create or replace function public.touch_content_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(current_setting('ca.preserve_content_updated_at', true), '') = '1' then
    return new;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.agency_owns_record(p_record uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.talent_records t
    where t.id = p_record
      and t.agency_id = (select auth.uid())
  );
$$;

-- Add is limited to a private record. Invited and active talent add their own.
create or replace function public.agency_can_add_record_content(p_record uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.talent_records t
    where t.id = p_record
      and t.agency_id = (select auth.uid())
      and t.status = 'record'
      and t.linked_user_id is null
  );
$$;

-- Roster-card deals, plus talent content from connected_at until disconnected_at.
create or replace function public.agency_can_see_content(
  p_owner uuid,
  p_record uuid,
  p_created timestamptz,
  p_agency_visible boolean
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_agency_visible and exists (
    select 1
    from public.talent_records t
    where t.agency_id = (select auth.uid())
      and (
        (
          p_record is not null
          and t.id = p_record
        )
        or (
          t.status = 'active'
          and t.connected_at is not null
          and p_owner is not null
          and t.linked_user_id = p_owner
          and p_created >= t.connected_at
        )
        or (
          t.status in ('disconnected', 'requested')
          and t.connected_at is not null
          and t.disconnected_at is not null
          and p_owner is not null
          and t.linked_user_id = p_owner
          and p_created >= t.connected_at
          and p_created <= t.disconnected_at
        )
      )
  );
$$;

-- True when a former agency should still keep this deal.
create or replace function public.content_retained_by_disconnected_agency(
  p_owner uuid,
  p_record uuid,
  p_created timestamptz,
  p_agency_visible boolean
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p_agency_visible, false)
    and p_owner is not null
    and not exists (
      select 1
      from public.talent_records active
      where active.linked_user_id = p_owner
        and active.status = 'active'
        and active.connected_at is not null
        and (
          active.id = p_record
          or p_created >= active.connected_at
        )
    )
    and exists (
      select 1
      from public.talent_records former
      where former.linked_user_id = p_owner
        and former.status in ('disconnected', 'requested')
        and former.connected_at is not null
        and former.disconnected_at is not null
        and (
          former.id = p_record
          or (
            p_created >= former.connected_at
            and p_created <= former.disconnected_at
          )
        )
    );
$$;

-- A delete after a split hides the deal from the talent. The agency keeps the copy.
create or replace function public.delete_owned_content(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.content_items%rowtype;
begin
  select * into row
  from public.content_items
  where id = p_id;

  if not found then
    raise exception 'Content not found';
  end if;

  if row.owner_id is distinct from (select auth.uid()) then
    raise exception 'You cannot delete this content';
  end if;

  if row.talent_hidden_at is not null then
    return;
  end if;

  update public.ideas
    set linked_content_id = null,
        status = 'idea'
  where linked_content_id = p_id;

  if public.content_retained_by_disconnected_agency(
    row.owner_id,
    row.talent_record_id,
    row.created_at,
    row.agency_visible
  ) then
    update public.content_items
      set talent_hidden_at = now()
    where id = p_id;
    return;
  end if;

  delete from public.content_items
  where id = p_id;
end;
$$;

-- The post and its line items commit together. A failed rewrite rolls the
-- delete back, so the old deliverables and expenses stay.
create or replace function public.save_content(
  p_id uuid,
  p_title text,
  p_platform text,
  p_niche text,
  p_type text,
  p_brand_name text,
  p_stage text,
  p_go_live_date timestamptz,
  p_shot_list text,
  p_notes text,
  p_idea_title text,
  p_fee_agreed numeric,
  p_currency text,
  p_payment_terms text,
  p_date_delivered timestamptz,
  p_date_invoiced timestamptz,
  p_date_paid timestamptz,
  p_deliverables jsonb default '[]'::jsonb,
  p_expenses jsonb default '[]'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  line jsonb;
  sort_order integer;
  line_id uuid;
  raw_id text;
begin
  if (select auth.uid()) is null then
    raise exception 'Could not save content.';
  end if;

  update public.content_items
    set
      title = p_title,
      platform = p_platform,
      niche = p_niche,
      type = p_type,
      brand_name = p_brand_name,
      stage = p_stage,
      go_live_date = p_go_live_date,
      shot_list = p_shot_list,
      notes = p_notes,
      idea_title = p_idea_title,
      fee_agreed = p_fee_agreed,
      currency = p_currency,
      payment_terms = p_payment_terms,
      date_delivered = p_date_delivered,
      date_invoiced = p_date_invoiced,
      date_paid = p_date_paid
    where id = p_id
      and (
        (
          owner_id = (select auth.uid())
          and talent_hidden_at is null
          and agency_copy_of is null
        )
        or (
          owner_id is null
          and public.agency_owns_record(talent_record_id)
        )
        or (
          agency_created
          and agency_copy_of is null
          and talent_hidden_at is null
          and agency_visible
          and public.is_agency_of_owner(owner_id)
          and exists (
            select 1
            from public.talent_records r
            where r.id = content_items.talent_record_id
              and r.agency_id = (select auth.uid())
              and r.status = 'active'
          )
        )
      );

  if not found then
    raise exception 'Could not save content.';
  end if;

  delete from public.content_deliverables where content_id = p_id;
  delete from public.content_expenses where content_id = p_id;

  begin
    sort_order := 0;
    for line in
      select value
      from jsonb_array_elements(coalesce(p_deliverables, '[]'::jsonb))
    loop
      raw_id := line->>'id';
      if raw_id ~* '^[0-9a-f-]{36}$' then
        begin
          line_id := raw_id::uuid;
        exception
          when invalid_text_representation then
            line_id := gen_random_uuid();
        end;
      else
        line_id := gen_random_uuid();
      end if;

      insert into public.content_deliverables (
        id, content_id, type, quantity, rate, sort_order
      )
      values (
        line_id,
        p_id,
        line->>'type',
        coalesce((line->>'quantity')::integer, 1),
        coalesce((line->>'rate')::numeric, 0),
        sort_order
      );
      sort_order := sort_order + 1;
    end loop;
  exception
    when others then
      raise exception 'Could not save deliverables.';
  end;

  begin
    sort_order := 0;
    for line in
      select value
      from jsonb_array_elements(coalesce(p_expenses, '[]'::jsonb))
    loop
      raw_id := line->>'id';
      if raw_id ~* '^[0-9a-f-]{36}$' then
        begin
          line_id := raw_id::uuid;
        exception
          when invalid_text_representation then
            line_id := gen_random_uuid();
        end;
      else
        line_id := gen_random_uuid();
      end if;

      insert into public.content_expenses (
        id, content_id, category, amount, note, expense_date, currency, sort_order
      )
      values (
        line_id,
        p_id,
        line->>'category',
        coalesce((line->>'amount')::numeric, 0),
        line->>'note',
        (line->>'expense_date')::date,
        nullif(line->>'currency', ''),
        sort_order
      );
      sort_order := sort_order + 1;
    end loop;
  exception
    when others then
      raise exception 'Could not save expenses.';
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Frozen copy after a split
-- ---------------------------------------------------------------------------

create or replace function public.ensure_agency_deal_copy(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  src public.content_items%rowtype;
  record_id uuid;
  copy_id uuid;
begin
  if coalesce(current_setting('ca.copying_deal', true), '') = '1' then
    return false;
  end if;

  select * into src
  from public.content_items
  where id = p_id
  for update;

  if not found
     or src.owner_id is null
     or src.agency_copy_of is not null
     or src.talent_hidden_at is not null then
    return false;
  end if;

  if exists (
    select 1 from public.content_items where agency_copy_of = p_id
  ) then
    return src.agency_visible;
  end if;

  if not public.content_retained_by_disconnected_agency(
    src.owner_id,
    src.talent_record_id,
    src.created_at,
    src.agency_visible
  ) then
    return false;
  end if;

  select t.id into record_id
  from public.talent_records t
  where t.linked_user_id = src.owner_id
    and t.status in ('disconnected', 'requested')
    and t.connected_at is not null
    and t.disconnected_at is not null
    and (
      t.id = src.talent_record_id
      or (
        src.created_at >= t.connected_at
        and src.created_at <= t.disconnected_at
      )
    )
  order by
    case when t.id = src.talent_record_id then 0 else 1 end,
    t.disconnected_at desc
  limit 1;

  if record_id is null then
    return false;
  end if;

  perform set_config('ca.copying_deal', '1', true);
  begin
    insert into public.content_items (
      owner_id,
      talent_record_id,
      title,
      platform,
      niche,
      type,
      brand_name,
      stage,
      go_live_date,
      shot_list,
      notes,
      idea_title,
      fee_agreed,
      currency,
      payment_terms,
      date_delivered,
      date_invoiced,
      date_paid,
      created_at,
      updated_at,
      agency_visible,
      talent_hidden_at,
      agency_copy_of
    )
    values (
      src.owner_id,
      record_id,
      src.title,
      src.platform,
      src.niche,
      src.type,
      src.brand_name,
      src.stage,
      src.go_live_date,
      src.shot_list,
      src.notes,
      src.idea_title,
      src.fee_agreed,
      src.currency,
      src.payment_terms,
      src.date_delivered,
      src.date_invoiced,
      src.date_paid,
      src.created_at,
      src.updated_at,
      true,
      now(),
      src.id
    )
    on conflict (agency_copy_of) where agency_copy_of is not null do nothing
    returning id into copy_id;

    if copy_id is not null then
      insert into public.content_deliverables (content_id, type, quantity, rate, sort_order)
      select copy_id, type, quantity, rate, sort_order
      from public.content_deliverables
      where content_id = src.id;

      insert into public.content_expenses (
        content_id, category, amount, note, expense_date, sort_order, currency
      )
      select copy_id, category, amount, note, expense_date, sort_order, currency
      from public.content_expenses
      where content_id = src.id;

      insert into public.content_changes (
        content_id, actor_id, actor_name, summary, created_at
      )
      select copy_id, actor_id, actor_name, summary, created_at
      from public.content_changes
      where content_id = src.id;
    end if;

    perform set_config('ca.copying_deal', '', true);
  exception
    when others then
      perform set_config('ca.copying_deal', '', true);
      raise;
  end;

  return true;
end;
$$;

create or replace function public.freeze_deals_for_disconnected_record(p_record uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deal_id uuid;
begin
  for deal_id in
    select c.id
    from public.content_items c
    join public.talent_records t on t.id = p_record
    where t.linked_user_id is not null
      and c.owner_id = t.linked_user_id
      and c.agency_visible
      and c.talent_hidden_at is null
      and c.agency_copy_of is null
      and public.content_retained_by_disconnected_agency(
        c.owner_id,
        c.talent_record_id,
        c.created_at,
        c.agency_visible
      )
  loop
    if public.ensure_agency_deal_copy(deal_id) then
      perform set_config('ca.preserve_content_updated_at', '1', true);
      begin
        update public.content_items
          set agency_visible = false
        where id = deal_id
          and agency_visible;
        perform set_config('ca.preserve_content_updated_at', '', true);
      exception
        when others then
          perform set_config('ca.preserve_content_updated_at', '', true);
          raise;
      end;
    end if;
  end loop;
end;
$$;

create or replace function public.freeze_shared_deal_on_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('ca.copying_deal', true), '') = '1' then
    return new;
  end if;

  if old.owner_id is null or old.agency_copy_of is not null then
    return new;
  end if;

  -- A talent delete hides this same row from the talent and leaves it
  -- with the agency. Do not fork that update.
  if old.talent_hidden_at is not null or new.talent_hidden_at is not null then
    return new;
  end if;

  if exists (
    select 1 from public.content_items where agency_copy_of = old.id
  ) then
    new.agency_visible := false;
    return new;
  end if;

  if public.ensure_agency_deal_copy(old.id) then
    new.agency_visible := false;
  end if;

  return new;
end;
$$;

create or replace function public.freeze_shared_deal_on_child_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_id uuid := coalesce(new.content_id, old.content_id);
begin
  if coalesce(current_setting('ca.copying_deal', true), '') = '1' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if public.ensure_agency_deal_copy(parent_id) then
    perform set_config('ca.preserve_content_updated_at', '1', true);
    begin
      update public.content_items
        set agency_visible = false
      where id = parent_id
        and agency_visible;
      perform set_config('ca.preserve_content_updated_at', '', true);
    exception
      when others then
        perform set_config('ca.preserve_content_updated_at', '', true);
        raise;
    end;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Payment terms, invoice date, and paid date stay editable on a snapshot.
create or replace function public.guard_agency_copy_invoice_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.agency_copy_of is null then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.owner_id is distinct from old.owner_id
     or new.talent_record_id is distinct from old.talent_record_id
     or new.title is distinct from old.title
     or new.platform is distinct from old.platform
     or new.niche is distinct from old.niche
     or new.type is distinct from old.type
     or new.brand_name is distinct from old.brand_name
     or new.stage is distinct from old.stage
     or new.go_live_date is distinct from old.go_live_date
     or new.shot_list is distinct from old.shot_list
     or new.notes is distinct from old.notes
     or new.idea_title is distinct from old.idea_title
     or new.fee_agreed is distinct from old.fee_agreed
     or new.currency is distinct from old.currency
     or new.created_at is distinct from old.created_at
     or new.agency_visible is distinct from old.agency_visible
     or new.talent_hidden_at is distinct from old.talent_hidden_at
     or new.agency_copy_of is distinct from old.agency_copy_of
     or (
       new.date_delivered is distinct from old.date_delivered
       and old.date_delivered is not null
     )
  then
    raise exception 'A disconnected snapshot only accepts payment terms, invoice date, and paid date';
  end if;

  return new;
end;
$$;

create trigger content_items_freeze_disconnected
  before update on public.content_items
  for each row execute function public.freeze_shared_deal_on_write();

create trigger content_items_guard_agency_copy
  before update on public.content_items
  for each row execute function public.guard_agency_copy_invoice_update();

create trigger content_items_touch
  before update on public.content_items
  for each row execute function public.touch_content_updated_at();

create trigger content_deliverables_freeze_disconnected
  before insert or update or delete on public.content_deliverables
  for each row execute function public.freeze_shared_deal_on_child_write();

create trigger content_expenses_freeze_disconnected
  before insert or update or delete on public.content_expenses
  for each row execute function public.freeze_shared_deal_on_child_write();

-- ---------------------------------------------------------------------------
-- Connect, disconnect, and claim
-- ---------------------------------------------------------------------------

create or replace function public.disconnect_talent_link(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.talent_records%rowtype;
begin
  select * into rec from public.talent_records where id = p_id;
  if not found then
    raise exception 'Talent record not found';
  end if;

  if rec.status <> 'active' or rec.linked_user_id is null then
    raise exception 'Only a connected talent can be disconnected';
  end if;

  if uid <> rec.agency_id and uid <> rec.linked_user_id then
    raise exception 'You cannot disconnect this talent';
  end if;

  update public.talent_records
    set status = 'disconnected',
        disconnected_at = now(),
        updated_at = now()
    where id = rec.id
      and status = 'active';

  if not found then
    raise exception 'Only a connected talent can be disconnected';
  end if;

  perform public.freeze_deals_for_disconnected_record(rec.id);
end;
$$;

create or replace function public.respond_connection_request(p_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.talent_records%rowtype;
begin
  select * into rec
  from public.talent_records
  where id = p_id
    and status = 'requested'
    and (request_user_id = uid or linked_user_id = uid);

  if not found then
    raise exception 'Connection request not found';
  end if;

  if not p_accept then
    if rec.linked_user_id is not null then
      update public.talent_records
        set status = 'disconnected',
            request_user_id = null,
            declined_at = now(),
            updated_at = now()
        where id = rec.id
          and status = 'requested';
    else
      update public.talent_records
        set status = 'record',
            request_user_id = null,
            declined_at = now(),
            updated_at = now()
        where id = rec.id
          and status = 'requested';
    end if;
    return;
  end if;

  if exists (
    select 1 from public.talent_records
    where linked_user_id = uid
      and status = 'active'
      and id <> rec.id
  ) then
    raise exception 'Disconnect from your current agency first';
  end if;

  if rec.linked_user_id is not null and rec.disconnected_at is not null then
    update public.content_items
      set agency_visible = false
    where owner_id = rec.linked_user_id
      and created_at > rec.disconnected_at
      and (talent_record_id is null or talent_record_id <> rec.id);
  end if;

  update public.talent_records
    set status = 'active',
        linked_user_id = uid,
        request_user_id = null,
        connected_at = coalesce(connected_at, now()),
        disconnected_at = null,
        declined_at = null,
        updated_at = now()
    where id = rec.id
      and status = 'requested';

  update public.content_items
    set owner_id = uid
  where talent_record_id = rec.id
    and owner_id is null
    and agency_copy_of is null
    and talent_hidden_at is null;
end;
$$;

-- Reconnecting must not hand the agency's frozen copy back to the talent.
create or replace function public.claim_record_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.linked_user_id is not null and old.linked_user_id is null then
    update public.content_items
      set owner_id = new.linked_user_id
      where talent_record_id = new.id
        and owner_id is null
        and agency_copy_of is null
        and talent_hidden_at is null;
  end if;
  return new;
end;
$$;

create trigger talent_records_claim_content
  after update of linked_user_id on public.talent_records
  for each row execute function public.claim_record_content();

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

alter table public.content_items enable row level security;
alter table public.content_deliverables enable row level security;
alter table public.content_expenses enable row level security;
alter table public.ideas enable row level security;
alter table public.content_changes enable row level security;

create policy content_select_own_or_agency
  on public.content_items
  for select
  to authenticated
  using (
    (
      owner_id = (select auth.uid())
      and talent_hidden_at is null
    )
    or public.agency_can_see_content(
      owner_id,
      talent_record_id,
      created_at,
      agency_visible
    )
  );

create policy content_insert_own_or_record
  on public.content_items
  for insert
  to authenticated
  with check (
    (
      owner_id = (select auth.uid())
      and talent_record_id is null
    )
    or (
      owner_id is null
      and public.agency_can_add_record_content(talent_record_id)
    )
  );

create policy content_update_own_or_agency
  on public.content_items
  for update
  to authenticated
  using (
    (
      owner_id = (select auth.uid())
      and talent_hidden_at is null
      and agency_copy_of is null
    )
    or (
      agency_visible
      and agency_copy_of is null
      and public.is_agency_of_owner(owner_id)
    )
    or (
      owner_id is null
      and agency_visible
      and public.agency_owns_record(talent_record_id)
    )
    or (
      agency_copy_of is not null
      and agency_visible
      and public.agency_owns_record(talent_record_id)
    )
  )
  with check (
    (
      owner_id = (select auth.uid())
      and talent_hidden_at is null
      and agency_copy_of is null
    )
    or (
      agency_visible
      and agency_copy_of is null
      and public.is_agency_of_owner(owner_id)
    )
    or (
      owner_id is null
      and agency_visible
      and public.agency_owns_record(talent_record_id)
    )
    or (
      agency_copy_of is not null
      and agency_visible
      and public.agency_owns_record(talent_record_id)
    )
  );

create policy content_delete_own_or_record
  on public.content_items
  for delete
  to authenticated
  using (
    (
      owner_id = (select auth.uid())
      and agency_copy_of is null
      and not public.content_retained_by_disconnected_agency(
        owner_id,
        talent_record_id,
        created_at,
        agency_visible
      )
    )
    or (
      owner_id is null
      and public.agency_owns_record(talent_record_id)
    )
  );

create policy deliverables_select
  on public.content_deliverables
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
          )
          or public.agency_can_see_content(
            c.owner_id,
            c.talent_record_id,
            c.created_at,
            c.agency_visible
          )
        )
    )
  );

create policy deliverables_write_own_or_record
  on public.content_deliverables
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
          )
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
          or (
            c.agency_created
            and c.agency_visible
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
            and public.is_agency_of_owner(c.owner_id)
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
          )
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
          or (
            c.agency_created
            and c.agency_visible
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
            and public.is_agency_of_owner(c.owner_id)
          )
        )
    )
  );

create policy expenses_select
  on public.content_expenses
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
          )
          or public.agency_can_see_content(
            c.owner_id,
            c.talent_record_id,
            c.created_at,
            c.agency_visible
          )
        )
    )
  );

create policy expenses_write_own_or_record
  on public.content_expenses
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
          )
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
          or (
            c.agency_created
            and c.agency_visible
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
            and public.is_agency_of_owner(c.owner_id)
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
          )
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
          or (
            c.agency_created
            and c.agency_visible
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
            and public.is_agency_of_owner(c.owner_id)
          )
        )
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
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
          )
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
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
          )
          or (
            c.agency_copy_of is null
            and public.is_agency_of_owner(c.owner_id)
          )
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
          or (
            c.agency_copy_of is not null
            and c.agency_visible
            and public.agency_owns_record(c.talent_record_id)
          )
        )
    )
  );

grant select, insert, update, delete on public.content_items to authenticated;
grant select, insert, update, delete on public.content_deliverables to authenticated;
grant select, insert, update, delete on public.content_expenses to authenticated;
grant select, insert, update, delete on public.ideas to authenticated;
grant select, insert on public.content_changes to authenticated;

revoke all on function public.agency_owns_record(uuid) from public;
revoke all on function public.agency_can_add_record_content(uuid) from public;
revoke all on function public.agency_can_see_content(uuid, uuid, timestamptz, boolean) from public;
revoke all on function public.content_retained_by_disconnected_agency(uuid, uuid, timestamptz, boolean) from public;
revoke all on function public.delete_owned_content(uuid) from public;
revoke all on function public.save_content(
  uuid, text, text, text, text, text, text, timestamptz, text, text, text,
  numeric, text, text, timestamptz, timestamptz, timestamptz, jsonb, jsonb
) from public, anon;
revoke all on function public.disconnect_talent_link(uuid) from public;
revoke all on function public.respond_connection_request(uuid, boolean) from public;
revoke all on function public.ensure_agency_deal_copy(uuid) from public;
revoke all on function public.freeze_deals_for_disconnected_record(uuid) from public;
revoke all on function public.ensure_agency_deal_copy(uuid) from anon, authenticated;
revoke all on function public.freeze_deals_for_disconnected_record(uuid) from anon, authenticated;

grant execute on function public.agency_owns_record(uuid) to authenticated;
grant execute on function public.agency_can_add_record_content(uuid) to authenticated;
grant execute on function public.agency_can_see_content(uuid, uuid, timestamptz, boolean) to authenticated;
grant execute on function public.content_retained_by_disconnected_agency(uuid, uuid, timestamptz, boolean) to authenticated;
grant execute on function public.delete_owned_content(uuid) to authenticated;
grant execute on function public.save_content(
  uuid, text, text, text, text, text, text, timestamptz, text, text, text,
  numeric, text, text, timestamptz, timestamptz, timestamptz, jsonb, jsonb
) to authenticated;
grant execute on function public.disconnect_talent_link(uuid) to authenticated;
grant execute on function public.respond_connection_request(uuid, boolean) to authenticated;
