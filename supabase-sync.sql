-- FinanceOS — Sync entre dispositivos (v2.0) — ligado a la licencia, cifrado E2E
-- Pega TODO esto en: Supabase Dashboard → tu proyecto → SQL Editor → New Query → Run
-- Idempotente: se puede correr varias veces sin romper nada.
-- Requiere que YA exista la tabla public.licenses (supabase-licenses.sql).

create extension if not exists pgcrypto;

-- 1) Tabla: un blob CIFRADO por licencia. El servidor nunca ve los datos en claro.
create table if not exists public.synced_data (
  key_hash   text primary key references public.licenses(key_hash) on delete cascade,
  blob       text   not null,              -- ciphertext base64 (AES-GCM en el cliente)
  updated_at bigint not null default 0,    -- "versión" (ms epoch) del último cambio local
  saved_at   timestamptz not null default now()
);

-- 2) RLS: nadie toca la tabla directo; solo vía las RPC (security definer)
alter table public.synced_data enable row level security;

-- 3) PUSH — sube el blob cifrado. Valida la licencia antes de escribir.
create or replace function public.sync_push(p_key text, p_blob text, p_updated_at bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_hash text;
begin
  if p_key is null or p_blob is null then
    return jsonb_build_object('ok', false, 'error', 'bad_args');
  end if;
  v_hash := encode(digest(upper(trim(p_key)), 'sha256'), 'hex');
  if not exists (select 1 from public.licenses where key_hash = v_hash and status = 'active') then
    return jsonb_build_object('ok', false, 'error', 'invalid_license');
  end if;
  insert into public.synced_data (key_hash, blob, updated_at, saved_at)
  values (v_hash, p_blob, coalesce(p_updated_at, 0), now())
  on conflict (key_hash) do update
    set blob = excluded.blob, updated_at = excluded.updated_at, saved_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

-- 4) PULL — baja el blob cifrado. Valida la licencia antes de leer.
create or replace function public.sync_pull(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_hash text; v_row public.synced_data%rowtype;
begin
  v_hash := encode(digest(upper(trim(p_key)), 'sha256'), 'hex');
  if not exists (select 1 from public.licenses where key_hash = v_hash and status = 'active') then
    return jsonb_build_object('ok', false, 'error', 'invalid_license');
  end if;
  select * into v_row from public.synced_data where key_hash = v_hash;
  if not found then return jsonb_build_object('ok', true, 'empty', true); end if;
  return jsonb_build_object('ok', true, 'blob', v_row.blob, 'updated_at', v_row.updated_at);
end;
$$;

-- 5) Permisos: solo el rol anónimo (la app) ejecuta las RPC
revoke all on function public.sync_push(text, text, bigint) from public;
grant  execute on function public.sync_push(text, text, bigint) to anon;
revoke all on function public.sync_pull(text) from public;
grant  execute on function public.sync_pull(text) to anon;

-- LISTO. Verificá:
--   select public.sync_pull('FNOS-XXXX-XXXX-XXXX');  → {"ok":true,"empty":true} con una licencia válida
