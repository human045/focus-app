-- ════════════════════════════════════════════════
-- Focus App — Supabase Migration v2
-- Run this in: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════

-- 1. PROFILES (auto-created on signup via trigger)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger: auto-insert profile on new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. TODOS
create table if not exists public.todos (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  text            text not null,
  done            boolean default false,
  pinned          boolean default false,
  est_poms        int default 1,
  poms_completed  int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.todos enable row level security;
create policy "Users manage own todos" on public.todos
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger todos_updated_at before update on public.todos
  for each row execute function public.set_updated_at();


-- 3. POMODORO SESSIONS (for streak/stats)
create table if not exists public.pomo_sessions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  mode        text not null check (mode in ('work','short','long')),
  duration    int not null,
  todo_id     bigint references public.todos(id) on delete set null,
  completed   boolean default true,
  started_at  timestamptz default now()
);

alter table public.pomo_sessions enable row level security;
create policy "Users manage own sessions" on public.pomo_sessions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 4. USER SETTINGS
create table if not exists public.user_settings (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  work_min           int default 25,
  short_min          int default 5,
  long_min           int default 15,
  sessions_per_cycle int default 4,
  auto_break         boolean default true,
  auto_work          boolean default false,
  theme              text default 'dark',
  updated_at         timestamptz default now()
);

alter table public.user_settings enable row level security;
create policy "Users manage own settings" on public.user_settings
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user_settings()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_settings on auth.users;
create trigger on_auth_user_created_settings
  after insert on auth.users
  for each row execute function public.handle_new_user_settings();


-- 5. DAILY STATS VIEW
create or replace view public.daily_focus_stats as
select
  user_id,
  date_trunc('day', started_at at time zone 'utc') as day,
  count(*) filter (where mode = 'work' and completed) as work_sessions,
  sum(duration) filter (where mode = 'work' and completed) as focus_seconds
from public.pomo_sessions
group by user_id, day;
