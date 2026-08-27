-- FinanceOS — Notificaciones push (recordatorios de sistema, NO alertas financieras)
-- Pega esto en: Supabase Dashboard → tu proyecto → SQL Editor → New Query → Run
-- Idempotente. Requiere que ya exista public.licenses (supabase-licenses.sql).
--
-- IMPORTANTE de privacidad: esta tabla NUNCA contiene datos financieros. Solo guarda
-- el "buzón" técnico (endpoint) para poder tocarle el timbre al navegador — el contenido
-- del aviso (ej. "tu prueba vence en 3 días") se decide en el servidor con metadatos de
-- la licencia (fechas), nunca con tus montos o movimientos (esos siguen cifrados E2E).

create extension if not exists pgcrypto;

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  key_hash    text not null references public.licenses(key_hash) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now(),
  last_sent_at timestamptz  -- evita mandar el mismo aviso dos veces
);
create index if not exists push_subscriptions_key_hash_idx on public.push_subscriptions(key_hash);

alter table public.push_subscriptions enable row level security;
-- (sin policies para anon → solo accesible vía las RPC security-definer de abajo)

-- Guardar/actualizar una suscripción (llamado por el navegador al activar avisos)
create or replace function public.save_push_subscription(
  p_key text, p_endpoint text, p_p256dh text, p_auth text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_hash text;
begin
  if p_key is null or p_endpoint is null or p_p256dh is null or p_auth is null then
    return jsonb_build_object('ok', false, 'error', 'bad_args');
  end if;
  -- fnos_resolve_hash (no digest() directo): el cliente manda el HASH de la
  -- licencia, no la clave cruda (ver supabase-e2e-hardening.sql). Este archivo
  -- hasheaba de nuevo un valor ya hasheado — el mismo bug que ya rompió
  -- sync_push una vez (ver CLAUDE.md). Producción ya corría con el fix
  -- aplicado a mano (verificado con pg_get_functiondef el 2026-08-27); este
  -- archivo solo estaba desactualizado en el repo, no en vivo.
  v_hash := public.fnos_resolve_hash(p_key);
  if not exists (select 1 from public.licenses where key_hash = v_hash and status = 'active'
                and (expires_at is null or expires_at > now())) then
    return jsonb_build_object('ok', false, 'error', 'invalid_license');
  end if;

  insert into public.push_subscriptions (key_hash, endpoint, p256dh, auth)
  values (v_hash, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set key_hash = excluded.key_hash, p256dh = excluded.p256dh, auth = excluded.auth;

  return jsonb_build_object('ok', true);
end;
$$;

-- Borrar una suscripción (al desactivar avisos)
create or replace function public.delete_push_subscription(p_endpoint text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.push_subscriptions where endpoint = p_endpoint;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.save_push_subscription(text,text,text,text) from public;
grant  execute on function public.save_push_subscription(text,text,text,text) to anon;
revoke all on function public.delete_push_subscription(text) from public;
grant  execute on function public.delete_push_subscription(text) to anon;

-- LISTO. Después de correr esto, desplegá la Edge Function 'send-push' (ver supabase/functions/send-push)
-- y programá el cron (ver instrucciones al final de este mismo archivo, sección CRON).

-- ===== CRON (opcional, correr aparte cuando la Edge Function ya esté desplegada) =====
-- Requiere la extensión pg_cron (Dashboard → Database → Extensions → habilitar "pg_cron" y "pg_net")
-- select cron.schedule(
--   'fnos-push-trial-reminders',
--   '0 14 * * *',  -- todos los días 14:00 UTC
--   $$
--   select net.http_post(
--     url := 'https://nelwgbcddwiaimzbcuas.supabase.co/functions/v1/send-push',
--     headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || current_setting('app.settings.service_role_key', true))
--   );
--   $$
-- );
