-- FinanceOS Pro — Supabase schema (Phase 1: cloud backup)
-- Pega esto en el SQL Editor de tu proyecto Supabase y ejecuta.
-- https://supabase.com/dashboard → tu proyecto → SQL Editor → New Query

-- Tabla: un backup por usuario (upsert por user_id)
create table if not exists cloud_backups (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  data        jsonb        not null,
  app_version text         default '1.5',
  updated_at  timestamptz  default now()
);

-- Row Level Security: solo el dueño puede leer/escribir su backup
alter table cloud_backups enable row level security;

create policy "users can manage own backup"
  on cloud_backups
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Habilitar auth anónima en Supabase:
-- Dashboard → Authentication → Providers → Anonymous Sign-ins → Enable
