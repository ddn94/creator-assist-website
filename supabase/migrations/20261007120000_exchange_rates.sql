-- Historical USD cross rates. Safe to run on a database that already
-- has accounts, roster, and content. Does not change existing deals.
--
-- per_usd is how many units of `currency` equal 1 USD on `rate_date`.
-- The daily import writes rows with the service role. Signed-in users
-- can read them. They cannot insert, update, or delete.

create table public.exchange_rates (
  rate_date date not null,
  currency text not null,
  per_usd numeric not null check (per_usd > 0),
  primary key (rate_date, currency),
  constraint exchange_rates_currency_code check (currency ~ '^[A-Z]{3}$')
);

create index exchange_rates_currency_date_idx
  on public.exchange_rates (currency, rate_date);

alter table public.exchange_rates enable row level security;

create policy exchange_rates_read
  on public.exchange_rates
  for select
  to authenticated
  using (true);

revoke all on public.exchange_rates from public, anon, authenticated;
grant select on public.exchange_rates to authenticated;
grant select, insert on public.exchange_rates to service_role;
