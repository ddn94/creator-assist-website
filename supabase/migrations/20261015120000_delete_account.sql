-- Account deletion + safe post-disconnect talent deletes.
-- Handoff runs in a BEFORE DELETE trigger on profiles (same transaction as
-- the wipe), so a failed auth delete does not half-clean the account.
-- Talent: disconnect, clear pending requests, hand agency-kept deals to the
-- roster card. Agency: detach creator-owned deals (creators keep them +
-- change history); unclaimed card deals and agency-only copies cascade away.
-- Frozen copies use owner_id null + agency_created false. Talent deal delete
-- after disconnect forks an agency copy first.

-- Keep change-history rows on agency-kept deals when the actor leaves.
alter table public.content_changes
  alter column actor_id drop not null;

alter table public.content_changes
  drop constraint content_changes_actor_id_fkey;

alter table public.content_changes
  add constraint content_changes_actor_id_fkey
  foreign key (actor_id) references public.profiles (id) on delete set null;

-- New frozen copies sit on the roster card with no talent owner.
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
      agency_copy_of,
      agency_created
    )
    values (
      null,
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
      src.id,
      false
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

-- After disconnect, talent "delete" must fork an agency copy first. Soft-hiding
-- the same row alone meant talent account wipe could erase the agency's deal.
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
    perform public.ensure_agency_deal_copy(p_id);

    if exists (
      select 1 from public.content_items where agency_copy_of = p_id
    ) then
      delete from public.content_items where id = p_id;
      return;
    end if;

    -- Fallback if a copy could not be made: hide from talent, keep row for agency.
    update public.content_items
      set talent_hidden_at = now()
    where id = p_id;
    return;
  end if;

  delete from public.content_items
  where id = p_id;
end;
$$;

-- Handoff for one profile id. Runs in the same transaction as profile delete
-- (BEFORE DELETE trigger) so a failed auth delete never leaves a half-cleaned
-- account. Safe to call more than once.
create or replace function public.prepare_account_deletion_for(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec_id uuid;
  is_agency boolean;
begin
  if p_uid is null then
    raise exception 'Missing account';
  end if;

  select role = 'agency' into is_agency
  from public.profiles
  where id = p_uid;

  if not found then
    return;
  end if;

  if coalesce(is_agency, false) then
    -- Creators keep deals already on their account. Clear the card link so
    -- roster cascade cannot wipe them. Frozen agency-only copies stay and go.
    update public.content_items c
      set talent_record_id = null,
          agency_visible = false
      from public.talent_records t
      where t.agency_id = p_uid
        and c.talent_record_id = t.id
        and c.owner_id is not null
        and c.agency_copy_of is null;
    return;
  end if;

  -- Clear pending connection requests so cards are not left as "requested".
  update public.talent_records
    set status = 'record',
        request_user_id = null,
        declined_at = now(),
        updated_at = now()
    where request_user_id = p_uid
      and status = 'requested'
      and linked_user_id is null;

  update public.talent_records
    set status = 'disconnected',
        request_user_id = null,
        declined_at = now(),
        disconnected_at = coalesce(disconnected_at, now()),
        updated_at = now()
    where linked_user_id = p_uid
      and status = 'requested';

  -- Same as Disconnect — freeze shared deals onto each active card.
  for rec_id in
    select id
    from public.talent_records
    where linked_user_id = p_uid
      and status = 'active'
  loop
    update public.talent_records
      set status = 'disconnected',
          disconnected_at = now(),
          updated_at = now()
      where id = rec_id
        and status = 'active';

    if found then
      perform public.freeze_deals_for_disconnected_record(rec_id);
    end if;
  end loop;

  -- Hand every agency-kept deal to the roster card (no talent owner).
  update public.content_items
    set owner_id = null
    where owner_id = p_uid
      and talent_record_id is not null
      and agency_copy_of is not null;

  update public.content_items
    set owner_id = null
    where owner_id = p_uid
      and talent_record_id is not null
      and agency_created;

  -- Soft-hidden leftovers (agency still on the same row, no freeze copy yet).
  update public.content_items
    set owner_id = null
    where owner_id = p_uid
      and talent_record_id is not null
      and talent_hidden_at is not null
      and agency_copy_of is null;
end;
$$;

create or replace function public.prepare_own_account_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  perform public.prepare_account_deletion_for(auth.uid());
end;
$$;

create or replace function public.profiles_before_delete_prepare()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.prepare_account_deletion_for(old.id);
  return old;
end;
$$;

drop trigger if exists profiles_before_delete_prepare on public.profiles;
create trigger profiles_before_delete_prepare
  before delete on public.profiles
  for each row execute function public.profiles_before_delete_prepare();

revoke all on function public.prepare_account_deletion_for(uuid) from public;
revoke all on function public.prepare_account_deletion_for(uuid) from anon, authenticated;
revoke all on function public.prepare_own_account_deletion() from public;
revoke all on function public.prepare_own_account_deletion() from anon;
grant execute on function public.prepare_own_account_deletion() to authenticated;

-- Disconnected cards can be removed. Talent-owned deals are unlinked first so
-- the creator’s account is untouched; agency copies on the card cascade away.
create or replace function public.agency_delete_record(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.talent_records%rowtype;
begin
  if not exists (
    select 1 from public.profiles where id = uid and role = 'agency'
  ) then
    raise exception 'Only an agency can remove a record';
  end if;

  select * into rec
  from public.talent_records
  where id = p_id
    and agency_id = uid;

  if not found then
    raise exception 'Talent record not found';
  end if;

  if rec.status = 'disconnected' then
    update public.content_items
      set talent_record_id = null,
          agency_visible = false
      where talent_record_id = p_id
        and owner_id is not null
        and agency_copy_of is null;

    delete from public.talent_records
    where id = p_id
      and agency_id = uid
      and status = 'disconnected';

    if not found then
      raise exception 'Could not remove this disconnected card';
    end if;
    return;
  end if;

  delete from public.talent_records
  where id = p_id
    and agency_id = uid
    and status in ('record', 'invited', 'requested')
    and linked_user_id is null;

  if not found then
    raise exception 'Only a card that has not been joined can be removed';
  end if;
end;
$$;
