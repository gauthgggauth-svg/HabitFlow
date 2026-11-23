-- Seed idempotent: plan Free, Standard, Pro.
insert into public.plans (code, name, price, interval, limits, features, sort_order)
values
  (
    'free',
    'Free',
    0,
    'month',
    '{"active_habits": 3, "active_tasks": 20}'::jsonb,
    '{"stats": "locked", "email_reminders": false, "csv_export": false, "dark_theme": false, "priority_support": false}'::jsonb,
    1
  ),
  (
    'standard',
    'Standard',
    29000,
    'month',
    '{"active_habits": null, "active_tasks": null}'::jsonb,
    '{"stats": "basic", "email_reminders": true, "csv_export": false, "dark_theme": false, "priority_support": false}'::jsonb,
    2
  ),
  (
    'pro',
    'Pro',
    59000,
    'month',
    '{"active_habits": null, "active_tasks": null}'::jsonb,
    '{"stats": "advanced", "email_reminders": true, "csv_export": true, "dark_theme": true, "priority_support": true}'::jsonb,
    3
  )
on conflict (code) do update set
  name = excluded.name,
  price = excluded.price,
  interval = excluded.interval,
  limits = excluded.limits,
  features = excluded.features,
  sort_order = excluded.sort_order,
  is_active = true;
