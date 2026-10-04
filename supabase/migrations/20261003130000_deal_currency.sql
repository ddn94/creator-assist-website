-- A fee and an expense remember the currency they were saved in.
-- Changing country updates the profile only. Old amounts keep this code.
-- Run after 20261003120000_freeze_disconnected_deals.sql.

alter table public.content_items
  add column if not exists currency text;

alter table public.content_expenses
  add column if not exists currency text;

-- Existing numbers have only ever been labeled with the owner's currency.
update public.content_items c
set currency = coalesce(
  (
    select nullif(trim(p.currency), '')
    from public.profiles p
    where p.id = c.owner_id
  ),
  (
    select nullif(trim(t.currency), '')
    from public.talent_records t
    where t.id = c.talent_record_id
  ),
  'USD'
)
where c.currency is null
  and c.type = 'paid_collab';

update public.content_expenses e
set currency = coalesce(
  (
    select nullif(trim(c.currency), '')
    from public.content_items c
    where c.id = e.content_id
  ),
  (
    select nullif(trim(p.currency), '')
    from public.content_items c
    join public.profiles p on p.id = c.owner_id
    where c.id = e.content_id
  ),
  (
    select nullif(trim(t.currency), '')
    from public.content_items c
    join public.talent_records t on t.id = c.talent_record_id
    where c.id = e.content_id
  ),
  'USD'
)
where e.currency is null;

-- Snapshots must keep the currency that was on the deal when it was copied.
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

create or replace function public.seed_example_collab(
  p_owner uuid,
  p_record uuid,
  p_agency_visible boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  money_code text;
begin
  select nullif(trim(p.currency), '') into money_code
  from public.profiles p
  where p.id = p_owner;

  if money_code is null and p_record is not null then
    select nullif(trim(t.currency), '') into money_code
    from public.talent_records t
    where t.id = p_record;
  end if;

  money_code := coalesce(money_code, 'USD');

  insert into public.content_items (
    owner_id,
    talent_record_id,
    title,
    platform,
    niche,
    type,
    brand_name,
    stage,
    notes,
    fee_agreed,
    currency,
    payment_terms,
    date_delivered,
    date_invoiced,
    date_paid,
    agency_visible
  )
  values (
    p_owner,
    p_record,
    'Sample paid collab',
    'Instagram',
    'Example',
    'paid_collab',
    'Sample brand',
    case when p_owner is null then 'delivered' else 'concept' end,
    'Example deal so Payments and P&L are not empty. Delete it anytime.',
    1000,
    money_code,
    'net_30',
    now(),
    now(),
    now(),
    p_agency_visible
  )
  returning id into new_id;

  insert into public.content_deliverables (content_id, type, quantity, rate)
  values (new_id, 'video', 1, 1000);

  insert into public.content_expenses (
    content_id, category, amount, note, expense_date, currency
  )
  values (
    new_id, 'editor', 150, 'Example expense. Delete it anytime.', current_date, money_code
  );
end;
$$;
