-- FinanceOS — Licencias escalables (v2.0) — Stripe + Supabase
-- Pega TODO esto en: Supabase Dashboard → tu proyecto → SQL Editor → New Query → Run
-- Idempotente: se puede ejecutar varias veces sin romper nada.

-- 1) Extensión para hashear claves (SHA-256) del lado servidor
create extension if not exists pgcrypto;

-- 2) Tabla de licencias — SOLO guardamos el HASH de la clave, nunca el texto plano
create table if not exists public.licenses (
  key_hash          text primary key,                          -- sha256(hex) de la clave normalizada
  plan              text not null default 'personal'
                       check (plan in ('personal','pro')),
  status            text not null default 'active'
                       check (status in ('active','revoked')),
  email             text,
  stripe_session_id text unique,
  created_at        timestamptz not null default now(),
  activated_at      timestamptz,
  expires_at        timestamptz   -- NULL = licencia perpetua (pagada); con fecha = prueba temporal
);
-- Para bases ya existentes: agrega la columna si falta
alter table public.licenses add column if not exists expires_at timestamptz;

-- 3) RLS: nadie accede a la tabla directamente; solo vía la función RPC
alter table public.licenses enable row level security;
-- (No creamos policies para anon → la tabla queda inaccesible salvo por la RPC security definer)

-- 4) RPC pública que valida una clave. Recibe la clave en texto, la hashea aquí.
--    Devuelve { valid: bool, plan: text }. No expone la tabla ni permite enumerar.
-- IMPORTANTE: search_path DEBE incluir `extensions` — pgcrypto (digest) vive ahí.
-- Con solo `public`, digest() no resuelve y la validación falla (incidente 2026-07-01).
create or replace function public.validate_license(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_row  public.licenses%rowtype;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    return jsonb_build_object('valid', false);
  end if;

  -- Normalizar igual que el cliente: trim + uppercase
  v_hash := encode(digest(upper(trim(p_key)), 'sha256'), 'hex');

  select * into v_row
  from public.licenses
  where key_hash = v_hash and status = 'active';

  if not found then
    return jsonb_build_object('valid', false);
  end if;

  -- Licencias de prueba: si vencieron, rechazar
  if v_row.expires_at is not null and v_row.expires_at < now() then
    return jsonb_build_object('valid', false, 'expired', true);
  end if;

  -- Marcar primera activación (no sobrescribe si ya estaba activada)
  update public.licenses
     set activated_at = coalesce(activated_at, now())
   where key_hash = v_hash;

  return jsonb_build_object('valid', true, 'plan', v_row.plan,
    'expires_at', case when v_row.expires_at is null then null
                       else extract(epoch from v_row.expires_at) * 1000 end);
end;
$$;

-- 5) Permitir que el rol anónimo (la app) ejecute SOLO esta función
revoke all on function public.validate_license(text) from public;
grant execute on function public.validate_license(text) to anon;

-- 6) Helper para insertar una licencia desde el webhook de Stripe.
--    Recibe la clave en texto, la hashea y guarda. SECURITY DEFINER.
--    Solo debe ser llamada por el webhook (usa service_role, no anon).
create or replace function public.issue_license(
  p_key text, p_plan text, p_email text default null, p_session text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions  -- extensions: pgcrypto (digest)
as $$
begin
  insert into public.licenses (key_hash, plan, email, stripe_session_id)
  values (encode(digest(upper(trim(p_key)), 'sha256'), 'hex'),
          coalesce(p_plan,'personal'), p_email, p_session)
  on conflict (key_hash) do nothing;
end;
$$;
revoke all on function public.issue_license(text,text,text,text) from public;
revoke all on function public.issue_license(text,text,text,text) from anon;
grant execute on function public.issue_license(text,text,text,text) to service_role;

-- LISTO. Verifica que la RPC existe con:
--   select public.validate_license('FNOS-TEST-TEST-TEST');  → debe devolver {"valid": false}
