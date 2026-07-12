-- supabase-e2e-hardening.sql
-- FIX de privacidad E2E: dejar de recibir la clave FNOS en texto plano en el servidor.
--
-- PROBLEMA (auditoría 2026-07-11): sync_push/sync_pull/validate_license/
-- save_push_subscription reciben `p_key` = la clave FNOS CRUDA y la hashean
-- server-side. Como la llave de cifrado del sync se deriva de esa misma clave
-- con un algoritmo público, cualquiera con acceso al servidor (o un breach, o
-- logs de Postgres) puede descifrar los datos financieros. Rompe la promesa
-- "la llave nunca sale del dispositivo".
--
-- SOLUCIÓN: el cliente enviará el HASH (sha256 hex, 64 chars) en vez de la clave
-- cruda. La llave de cifrado se sigue derivando LOCALMENTE de la clave (que nunca
-- sale). Este script hace las funciones RETROCOMPATIBLES: aceptan tanto el hash
-- (clientes nuevos) como la clave cruda (clientes viejos aún en caché), así que
-- SE PUEDE CORRER AHORA sin romper el sync de nadie — no hay ventana de fallo.
--
-- Idempotente. Pega TODO en Supabase → SQL Editor → Run.

-- Helper: si el input ya es un hash sha256 (64 hex) lo usa tal cual; si no
-- (es una clave FNOS-XXXX...), lo normaliza y hashea igual que antes.
create or replace function public.fnos_resolve_hash(p_input text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select case
    when p_input ~ '^[0-9a-f]{64}$' then lower(p_input)
    else encode(digest(upper(trim(coalesce(p_input, ''))), 'sha256'), 'hex')
  end
$$;

-- ── sync_push (retrocompatible) ──────────────────────────────────────────────
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
  v_hash := public.fnos_resolve_hash(p_key);
  if not exists (select 1 from public.licenses where key_hash = v_hash and status = 'active'
                and (expires_at is null or expires_at > now())) then
    return jsonb_build_object('ok', false, 'error', 'invalid_license');
  end if;
  insert into public.synced_data (key_hash, blob, updated_at, saved_at)
  values (v_hash, p_blob, coalesce(p_updated_at, 0), now())
  on conflict (key_hash) do update
    set blob = excluded.blob, updated_at = excluded.updated_at, saved_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

-- ── sync_pull (retrocompatible) ──────────────────────────────────────────────
create or replace function public.sync_pull(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_hash text; v_row public.synced_data%rowtype;
begin
  v_hash := public.fnos_resolve_hash(p_key);
  if not exists (select 1 from public.licenses where key_hash = v_hash and status = 'active'
                and (expires_at is null or expires_at > now())) then
    return jsonb_build_object('ok', false, 'error', 'invalid_license');
  end if;
  select * into v_row from public.synced_data where key_hash = v_hash;
  if not found then return jsonb_build_object('ok', true, 'empty', true); end if;
  return jsonb_build_object('ok', true, 'blob', v_row.blob, 'updated_at', v_row.updated_at);
end;
$$;

-- ── validate_license (retrocompatible) ───────────────────────────────────────
-- Nota: acepta el hash directo o la clave. Devuelve el mismo shape que antes.
create or replace function public.validate_license(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_hash text; v_row public.licenses%rowtype;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    return jsonb_build_object('valid', false);
  end if;
  v_hash := public.fnos_resolve_hash(p_key);
  select * into v_row from public.licenses where key_hash = v_hash and status = 'active';
  if not found then
    return jsonb_build_object('valid', false);
  end if;
  if v_row.expires_at is not null and v_row.expires_at < now() then
    return jsonb_build_object('valid', false, 'expired', true);
  end if;
  return jsonb_build_object('valid', true, 'plan', v_row.plan,
    'expires_at', case when v_row.expires_at is null then null
                       else extract(epoch from v_row.expires_at) * 1000 end);
end;
$$;

-- ── save_push_subscription / delete (retrocompatibles) ───────────────────────
-- Firma actual: save_push_subscription(p_key, p_endpoint, p_p256dh, p_auth).
create or replace function public.save_push_subscription(p_key text, p_endpoint text, p_p256dh text, p_auth text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_hash text;
begin
  if p_endpoint is null then return jsonb_build_object('ok', false, 'error', 'bad_args'); end if;
  v_hash := public.fnos_resolve_hash(p_key);
  if not exists (select 1 from public.licenses where key_hash = v_hash and status = 'active') then
    return jsonb_build_object('ok', false, 'error', 'invalid_license');
  end if;
  insert into public.push_subscriptions (key_hash, endpoint, p256dh, auth, created_at)
  values (v_hash, p_endpoint, p_p256dh, p_auth, now())
  on conflict (endpoint) do update set key_hash = excluded.key_hash, p256dh = excluded.p256dh, auth = excluded.auth;
  return jsonb_build_object('ok', true);
end;
$$;

-- Permisos (idempotente)
revoke all on function public.fnos_resolve_hash(text) from public;
grant  execute on function public.fnos_resolve_hash(text) to anon;

-- LISTO. Es seguro correr esto AHORA: el sync/validación/push sigue funcionando
-- con clientes viejos (clave cruda) y nuevos (hash). Tras correrlo, avisar para
-- desplegar el cliente que ya solo envía el hash (deja de exponer la clave FNOS).
