-- FinanceOS — Asociar email del cliente a su licencia
-- Pega esto en: Supabase Dashboard → tu proyecto → SQL Editor → New Query → Run
-- Idempotente. Requiere que ya exista public.licenses (supabase-licenses.sql)
-- y public.fnos_resolve_hash (supabase-e2e-hardening.sql) — correr ese primero.
--
-- CORREGIDO 2026-08-22 (auditoría 2026-08-21, hallazgo SEC-1): este archivo
-- versionado seguía hasheando p_key directo con digest(), sin pasar por
-- fnos_resolve_hash — el mismo patrón de doble-hash que ya rompió sync_push
-- una vez (ver CLAUDE.md), esta vez en un archivo que ese CLAUDE.md no
-- cubría. Se verificó contra la función REAL en producción con
-- pg_get_functiondef(oid) antes de tocar nada: ya estaba parcheada a mano en
-- algún momento (usa fnos_resolve_hash, con una forma más simple que la de
-- este archivo — sin validación de formato de email, sin chequeo de
-- expires_at). Este archivo se reescribe para reflejar EXACTAMENTE esa
-- versión ya viva en producción, no una reconstrucción propia — correrlo de
-- nuevo es, a partir de ahora, un no-op real. No se tocó producción: ya
-- estaba bien, solo el archivo del repo estaba desactualizado.

create or replace function public.set_license_email(p_key text, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_hash text;
begin
  if p_email is null then return jsonb_build_object('ok', false); end if;
  v_hash := public.fnos_resolve_hash(p_key);
  update public.licenses set email = trim(p_email) where key_hash = v_hash and status = 'active';
  return jsonb_build_object('ok', found);
end;
$$;

revoke all on function public.set_license_email(text, text) from public;
grant  execute on function public.set_license_email(text, text) to anon;

-- Verificá con: select email from public.licenses where key_hash = encode(digest(upper('FNOS-XXXX-XXXX-XXXX'),'sha256'),'hex');
