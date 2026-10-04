-- Once a talent disconnects, the agency keeps the deals as they were.
-- Later talent edits, including fee, dates, deliverables, and expenses,
-- stay on the talent's row. The agency reads the frozen copy.
-- Run after 20261003100000_keep_disconnected_deal.sql.

alter table public.content_items
  add column if not exists agency_copy_of uuid;

create unique index if not exists content_items_agency_copy_of_key
  on public.content_items (agency_copy_of)
  where agency_copy_of is not null;

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

-- Snapshot a deal a disconnected agency still shares, before it changes.
-- Returns true when the caller must hide the talent's row from the agency.
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
        content_id, category, amount, note, expense_date, sort_order
      )
      select copy_id, category, amount, note, expense_date, sort_order
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

drop trigger if exists content_items_freeze_disconnected on public.content_items;
create trigger content_items_freeze_disconnected
  before update on public.content_items
  for each row execute function public.freeze_shared_deal_on_write();

drop trigger if exists content_deliverables_freeze_disconnected on public.content_deliverables;
create trigger content_deliverables_freeze_disconnected
  before insert or update or delete on public.content_deliverables
  for each row execute function public.freeze_shared_deal_on_child_write();

drop trigger if exists content_expenses_freeze_disconnected on public.content_expenses;
create trigger content_expenses_freeze_disconnected
  before insert or update or delete on public.content_expenses
  for each row execute function public.freeze_shared_deal_on_child_write();

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
            updated_at = now()
        where id = rec.id
          and status = 'requested';
    else
      update public.talent_records
        set status = 'record',
            request_user_id = null,
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

-- The frozen copy stays readable by the agency and unwritable by the talent.
drop policy if exists content_update_own_or_agency on public.content_items;
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
  );

drop policy if exists content_delete_own_or_record on public.content_items;
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

drop policy if exists deliverables_write_own_or_record on public.content_deliverables;
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
        )
    )
  );

drop policy if exists expenses_write_own_or_record on public.content_expenses;
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
        )
    )
  );

drop policy if exists content_changes_insert on public.content_changes;
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
        )
    )
  );

revoke all on function public.ensure_agency_deal_copy(uuid) from public;
revoke all on function public.freeze_deals_for_disconnected_record(uuid) from public;
revoke all on function public.ensure_agency_deal_copy(uuid) from anon, authenticated;
revoke all on function public.freeze_deals_for_disconnected_record(uuid) from anon, authenticated;

-- Deals already left with a disconnected agency are frozen as they are now.
do $$
declare
  rec record;
begin
  for rec in
    select id
    from public.talent_records
    where status in ('disconnected', 'requested')
      and linked_user_id is not null
      and disconnected_at is not null
  loop
    perform public.freeze_deals_for_disconnected_record(rec.id);
  end loop;
end $$;
