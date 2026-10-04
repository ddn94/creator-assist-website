-- Talent example collabs start in Concept, with one deliverable and one expense.
-- Run after 20260929193000_example_data.sql.

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
    notes,
    fee_agreed,
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
    content_id, category, amount, note, expense_date
  )
  values (
    new_id, 'editor', 150, 'Example expense. Delete it anytime.', current_date
  );
end;
$$;

revoke all on function public.seed_example_collab(uuid, uuid, boolean) from public;
revoke all on function public.seed_example_collab(uuid, uuid, boolean) from anon, authenticated;

-- Existing examples that are still the original seed.
do $$
declare
  row record;
begin
  for row in
    select c.id, c.owner_id
    from public.content_items c
    where c.title = 'Sample paid collab'
      and c.notes = 'Example deal so Payments and P&L are not empty. Delete it anytime.'
      and not exists (
        select 1 from public.content_deliverables d where d.content_id = c.id
      )
      and not exists (
        select 1 from public.content_expenses e where e.content_id = c.id
      )
  loop
    if row.owner_id is not null then
      update public.content_items
        set stage = 'concept'
        where id = row.id
          and stage = 'delivered';
    end if;

    insert into public.content_deliverables (content_id, type, quantity, rate)
    values (row.id, 'video', 1, 1000);

    insert into public.content_expenses (
      content_id, category, amount, note, expense_date
    )
    values (
      row.id, 'editor', 150, 'Example expense. Delete it anytime.', current_date
    );
  end loop;
end;
$$;
