-- HabitFlow MVP schema
-- Tabel, enum, constraint, index, trigger, RLS.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums
create type public.user_role as enum ('user', 'admin');
create type public.plan_interval as enum ('month');
create type public.subscription_status as enum ('pending', 'active', 'past_due', 'canceled', 'expired');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'expired', 'refunded');
create type public.habit_frequency as enum ('daily', 'weekdays');
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.reminder_channel as enum ('web_push', 'email');
create type public.reminder_status as enum ('pending', 'sent', 'failed', 'skipped');
create type public.webhook_status as enum ('received', 'processed', 'failed', 'ignored');

-- ---------------------------------------------------------------- users
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null default '',
  role public.user_role not null default 'user',
  timezone text not null default 'Asia/Jakarta',
  notification_permission text not null default 'default'
    check (notification_permission in ('default', 'granted', 'denied')),
  onboarding_completed_at timestamptz,
  goal text,
  default_reminder_time time,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  email_reminders boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- plans
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  price integer not null check (price >= 0),
  interval public.plan_interval not null default 'month',
  limits jsonb not null default '{}'::jsonb check (jsonb_typeof(limits) = 'object'),
  features jsonb not null default '{}'::jsonb check (jsonb_typeof(features) = 'object'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  status public.subscription_status not null default 'pending',
  gateway_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  plan_id uuid not null references public.plans (id),
  gateway_order_id text not null unique,
  gateway_transaction_id text unique,
  amount integer not null check (amount >= 0),
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- habits
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text check (char_length(description) <= 500),
  frequency public.habit_frequency not null default 'daily',
  weekdays smallint[] not null default '{}'::smallint[],
  reminder_time time,
  color text not null default 'moss',
  icon text not null default 'sparkles',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habits_weekdays_valid check (
    (frequency = 'daily' and weekdays = '{}'::smallint[])
    or (frequency = 'weekdays' and cardinality(weekdays) > 0 and weekdays <@ array[1,2,3,4,5,6,7]::smallint[])
  )
);

-- ---------------------------------------------------------------- habit logs
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  scheduled_date date not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (habit_id, scheduled_date)
);

-- ---------------------------------------------------------------- tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  notes text check (char_length(notes) <= 2000),
  due_at timestamptz,
  priority public.task_priority not null default 'medium',
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- reminders
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  scheduled_at timestamptz not null,
  channel public.reminder_channel not null,
  status public.reminder_status not null default 'pending',
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  unique (habit_id, scheduled_at, channel)
);

-- ---------------------------------------------------------------- push subscriptions
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- webhook events
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'midtrans',
  event_key text not null unique,
  event_type text not null,
  payload jsonb not null,
  status public.webhook_status not null default 'received',
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- indexes
create index habits_user_active_idx on public.habits (user_id, is_active, created_at desc);
create index habit_logs_user_date_idx on public.habit_logs (user_id, scheduled_date desc);
create index tasks_user_status_due_idx on public.tasks (user_id, is_completed, due_at);
create index subscriptions_user_status_idx on public.subscriptions (user_id, status);
create index subscriptions_gateway_idx on public.subscriptions (gateway_subscription_id);
create index payments_user_created_idx on public.payments (user_id, created_at desc);
create index payments_status_idx on public.payments (status, created_at desc);
create index reminders_status_schedule_idx on public.reminders (status, scheduled_at);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id) where revoked_at is null;
create index webhook_events_status_idx on public.webhook_events (status, created_at desc);
create index users_role_idx on public.users (role);

-- ---------------------------------------------------------------- updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
create trigger habits_updated_at before update on public.habits
  for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- new auth user -> public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fallback_name text;
begin
  fallback_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );

  insert into public.users (id, email, name)
  values (new.id, coalesce(new.email, ''), fallback_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- RLS
alter table public.users enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.webhook_events enable row level security;

-- Grants: default Supabase grants are broad; be explicit per table.
revoke all on public.users from anon, authenticated;
grant select on public.users to authenticated;
grant update (name, timezone, notification_permission, onboarding_completed_at, goal, default_reminder_time, theme, email_reminders)
  on public.users to authenticated;

revoke all on public.plans from anon, authenticated;
grant select on public.plans to anon, authenticated;

revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

revoke all on public.habits from anon, authenticated;
grant select, insert, update, delete on public.habits to authenticated;

revoke all on public.habit_logs from anon, authenticated;
grant select, insert, update, delete on public.habit_logs to authenticated;

revoke all on public.tasks from anon, authenticated;
grant select, insert, update, delete on public.tasks to authenticated;

revoke all on public.reminders from anon, authenticated;
grant select on public.reminders to authenticated;

revoke all on public.push_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

revoke all on public.webhook_events from anon, authenticated;

-- ---------------------------------------------------------------- policies
create policy "users_select_own" on public.users
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "users_update_own" on public.users
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "plans_read_all" on public.plans
  for select to anon, authenticated
  using (true);

create policy "habits_select_own" on public.habits
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "habits_insert_own" on public.habits
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "habits_update_own" on public.habits
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "habits_delete_own" on public.habits
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "habit_logs_select_own" on public.habit_logs
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "habit_logs_insert_own" on public.habit_logs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "habit_logs_update_own" on public.habit_logs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "habit_logs_delete_own" on public.habit_logs
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "tasks_select_own" on public.tasks
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "tasks_insert_own" on public.tasks
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "tasks_update_own" on public.tasks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "tasks_delete_own" on public.tasks
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "subscriptions_select_own" on public.subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "payments_select_own" on public.payments
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "reminders_select_own" on public.reminders
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- webhook_events: no authenticated access at all.
