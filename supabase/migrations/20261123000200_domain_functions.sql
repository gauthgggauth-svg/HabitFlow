-- Fungsi domain: enqueue reminder, entitlement lookup, metrik admin.

-- ---------------------------------------------------------------- reminder enqueue
-- Dipanggil endpoint internal setiap 5 menit. Idempotent karena unique
-- (habit_id, scheduled_at, channel).
create or replace function public.enqueue_due_reminders(
  p_window_start timestamptz,
  p_window_end timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  local_date date;
  scheduled_utc timestamptz;
  affected integer;
  total integer := 0;
  has_push boolean;
begin
  for rec in
    select
      h.id as habit_id,
      h.user_id,
      h.frequency,
      h.weekdays,
      h.reminder_time,
      u.timezone,
      u.email_reminders,
      coalesce((plan.features ->> 'email_reminders')::boolean, false) as email_feature
    from public.habits h
    join public.users u on u.id = h.user_id
    left join lateral (
      select p.features
      from public.subscriptions s
      join public.plans p on p.id = s.plan_id
      where s.user_id = h.user_id
        and (
          s.status = 'active'
          or (s.status in ('past_due', 'canceled') and s.current_period_end >= now())
        )
      order by s.created_at desc
      limit 1
    ) plan on true
    where h.is_active = true
      and h.reminder_time is not null
  loop
    local_date := (p_window_end at time zone rec.timezone)::date;

    if rec.frequency = 'weekdays'
       and not (extract(isodow from local_date)::smallint = any (rec.weekdays)) then
      continue;
    end if;

    scheduled_utc := (local_date + rec.reminder_time) at time zone rec.timezone;

    if scheduled_utc < p_window_start or scheduled_utc > p_window_end then
      continue;
    end if;

    insert into public.reminders (habit_id, user_id, scheduled_at, channel)
    values (rec.habit_id, rec.user_id, scheduled_utc, 'web_push')
    on conflict (habit_id, scheduled_at, channel) do nothing;
    get diagnostics affected = row_count;
    total := total + affected;

    if rec.email_reminders and rec.email_feature then
      select exists (
        select 1 from public.push_subscriptions ps
        where ps.user_id = rec.user_id and ps.revoked_at is null
      ) into has_push;

      if not has_push then
        insert into public.reminders (habit_id, user_id, scheduled_at, channel)
        values (rec.habit_id, rec.user_id, scheduled_utc, 'email')
        on conflict (habit_id, scheduled_at, channel) do nothing;
        get diagnostics affected = row_count;
        total := total + affected;
      end if;
    end if;
  end loop;

  return total;
end;
$$;

revoke all on function public.enqueue_due_reminders(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.enqueue_due_reminders(timestamptz, timestamptz) to service_role;

-- ---------------------------------------------------------------- admin metrics
create or replace function public.admin_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  total_users bigint;
  paid_active bigint;
  mrr bigint;
  d1_base bigint;
  d1_hit bigint;
  d7_base bigint;
  d7_hit bigint;
  d30_base bigint;
  d30_hit bigint;
  reminders_sent bigint;
  reminders_actioned bigint;
begin
  select count(*) into total_users from public.users;
  select count(*) into paid_active
    from public.subscriptions s
    where s.status = 'active';

  select coalesce(sum(p.price), 0) into mrr
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
    where s.status = 'active' and p.code in ('standard', 'pro');

  select count(*) into d1_base from public.users
    where created_at <= now() - interval '1 day';
  select count(distinct u.id) into d1_hit
    from public.users u
    join public.habit_logs l on l.user_id = u.id
    where u.created_at <= now() - interval '1 day'
      and (l.completed_at at time zone u.timezone)::date
          = (u.created_at at time zone u.timezone)::date + 1;

  select count(*) into d7_base from public.users
    where created_at <= now() - interval '7 days';
  select count(distinct u.id) into d7_hit
    from public.users u
    join public.habit_logs l on l.user_id = u.id
    where u.created_at <= now() - interval '7 days'
      and (l.completed_at at time zone u.timezone)::date
          = (u.created_at at time zone u.timezone)::date + 7;

  select count(*) into d30_base from public.users
    where created_at <= now() - interval '30 days';
  select count(distinct u.id) into d30_hit
    from public.users u
    join public.habit_logs l on l.user_id = u.id
    where u.created_at <= now() - interval '30 days'
      and (l.completed_at at time zone u.timezone)::date
          = (u.created_at at time zone u.timezone)::date + 30;

  select count(*) into reminders_sent
    from public.reminders r
    where r.status = 'sent' and r.sent_at >= now() - interval '30 days';
  select count(distinct r.id) into reminders_actioned
    from public.reminders r
    join public.habit_logs l on l.habit_id = r.habit_id
    where r.status = 'sent'
      and r.sent_at >= now() - interval '30 days'
      and l.completed_at >= r.sent_at
      and l.completed_at <= r.sent_at + interval '60 minutes';

  select jsonb_build_object(
    'generated_at', now(),
    'total_users', total_users,
    'new_users_30d', (select count(*) from public.users where created_at >= now() - interval '30 days'),
    'activated_users', (select count(distinct user_id) from public.habits),
    'paid_active', paid_active,
    'conversion_rate', case when total_users = 0 then 0 else round((paid_active::numeric / total_users) * 100, 2) end,
    'mrr', mrr,
    'arpu', case when paid_active = 0 then 0 else round(mrr::numeric / paid_active) end,
    'active_by_plan', (
      select coalesce(jsonb_object_agg(p.code, counts.total), '{}'::jsonb)
      from public.plans p
      left join (
        select plan_id, count(*) as total
        from public.subscriptions where status = 'active'
        group by plan_id
      ) counts on counts.plan_id = p.id
    ),
    'retention', jsonb_build_object(
      'd1', case when d1_base = 0 then 0 else round((d1_hit::numeric / d1_base) * 100, 2) end,
      'd1_base', d1_base,
      'd7', case when d7_base = 0 then 0 else round((d7_hit::numeric / d7_base) * 100, 2) end,
      'd7_base', d7_base,
      'd30', case when d30_base = 0 then 0 else round((d30_hit::numeric / d30_base) * 100, 2) end,
      'd30_base', d30_base
    ),
    'churn_30d', (
      select coalesce(jsonb_object_agg(p.code, counts.total), '{}'::jsonb)
      from public.plans p
      left join (
        select plan_id, count(*) as total
        from public.subscriptions
        where status in ('canceled', 'expired')
          and updated_at >= now() - interval '30 days'
        group by plan_id
      ) counts on counts.plan_id = p.id
    ),
    'payment', jsonb_build_object(
      'attempts_30d', (select count(*) from public.payments where created_at >= now() - interval '30 days'),
      'failed_30d', (select count(*) from public.payments where status = 'failed' and created_at >= now() - interval '30 days'),
      'failed_rate', (
        select case when count(*) = 0 then 0
          else round((count(*) filter (where status = 'failed')::numeric / count(*)) * 100, 2)
        end from public.payments where created_at >= now() - interval '30 days'
      ),
      'pending', (select count(*) from public.payments where status = 'pending')
    ),
    'webhook', jsonb_build_object(
      'events_30d', (select count(*) from public.webhook_events where created_at >= now() - interval '30 days'),
      'failed_30d', (select count(*) from public.webhook_events where status = 'failed' and created_at >= now() - interval '30 days'),
      'failure_rate', (
        select case when count(*) = 0 then 0
          else round((count(*) filter (where status = 'failed')::numeric / count(*)) * 100, 2)
        end from public.webhook_events where created_at >= now() - interval '30 days'
      )
    ),
    'reminders', jsonb_build_object(
      'sent_30d', reminders_sent,
      'failed_30d', (select count(*) from public.reminders where status = 'failed' and created_at >= now() - interval '30 days'),
      'action_rate', case when reminders_sent = 0 then 0 else round((reminders_actioned::numeric / reminders_sent) * 100, 2) end
    ),
    'product', jsonb_build_object(
      'avg_active_habits', (
        select coalesce(round(avg(total), 2), 0) from (
          select count(*) as total from public.habits where is_active = true group by user_id
        ) per_user
      ),
      'task_completion_rate', (
        select case when count(*) = 0 then 0
          else round((count(*) filter (where is_completed)::numeric / count(*)) * 100, 2)
        end from public.tasks
      ),
      'median_minutes_to_first_habit', (
        select coalesce(round(percentile_cont(0.5) within group (
          order by extract(epoch from (h.first_created - u.created_at)) / 60
        )::numeric, 1), 0)
        from public.users u
        join lateral (
          select min(created_at) as first_created from public.habits where user_id = u.id
        ) h on h.first_created is not null
      )
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_metrics() from public, anon, authenticated;
grant execute on function public.admin_metrics() to service_role;
