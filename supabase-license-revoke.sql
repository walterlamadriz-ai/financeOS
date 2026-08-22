-- FinanceOS — Revocación de licencia al reembolsar/disputar (Stripe)
-- Pega TODO esto en: Supabase Dashboard → tu proyecto → SQL Editor → New Query → Run
-- Idempotente. Requiere que ya exista public.licenses (supabase-licenses.sql).
--
-- Auditoría 2026-08-21, hallazgo FISC-1: el webhook de Stripe solo escuchaba
-- checkout.session.completed — un reembolso o disputa nunca revocaba la
-- licencia, aunque la tabla ya modela status='revoked' y validate_license ya
-- filtra por licencias activas. Nada lo disparaba.
--
-- Mecanismo: charge.refunded/charge.dispute.created traen el payment_intent
-- (pi_...) del cargo, NO el id de la Checkout Session (cs_...) que licenses
-- ya guarda en stripe_session_id — son objetos de Stripe distintos, no se
-- pueden unir directamente sin una llamada extra a la API de Stripe. En vez
-- de agregar esa dependencia (secret nueva, llamada de red extra desde el
-- webhook), se guarda el payment_intent YA en el momento de emitir la
-- licencia (session.payment_intent está disponible en el propio evento
-- checkout.session.completed para checkouts de pago único) y se revoca
-- buscando por esa columna — 100% con lo que Stripe ya manda al webhook.
--
-- Límite honesto: licencias emitidas ANTES de correr esto tienen
-- payment_intent_id NULL — un reembolso de una compra vieja no se revoca
-- solo, hay que revocarla a mano (ver query al final). Solo las compras
-- nuevas, después de desplegar el webhook actualizado, quedan cubiertas
-- automáticamente.

alter table public.licenses add column if not exists payment_intent_id text;
create index if not exists licenses_payment_intent_idx on public.licenses (payment_intent_id);

-- issue_license: mismo comportamiento de antes (supabase-licenses.sql), con
-- un parámetro nuevo opcional al final (default null) — no rompe a nadie que
-- la siga llamando con 4 argumentos; Postgres deja ambas firmas coexistiendo.
create or replace function public.issue_license(
  p_key text, p_plan text, p_email text default null, p_session text default null,
  p_payment_intent text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.licenses (key_hash, plan, email, stripe_session_id, payment_intent_id)
  values (encode(digest(upper(trim(p_key)), 'sha256'), 'hex'),
          coalesce(p_plan,'personal'), p_email, p_session, p_payment_intent)
  on conflict (key_hash) do nothing;
end;
$$;
revoke all on function public.issue_license(text,text,text,text,text) from public;
revoke all on function public.issue_license(text,text,text,text,text) from anon;
grant execute on function public.issue_license(text,text,text,text,text) to service_role;

-- revoke_license: pone status='revoked' para la licencia cuyo payment_intent
-- matchea. SECURITY DEFINER, solo service_role (mismo criterio que
-- issue_license) — el webhook es el único que la llama, nunca el cliente.
create or replace function public.revoke_license(p_payment_intent text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_count int;
begin
  if p_payment_intent is null then
    return jsonb_build_object('ok', false, 'error', 'bad_args');
  end if;
  update public.licenses
     set status = 'revoked'
   where payment_intent_id = p_payment_intent
     and status = 'active';
  get diagnostics v_count = row_count;
  if v_count = 0 then
    return jsonb_build_object('ok', false, 'error', 'not_found_or_already_revoked');
  end if;
  return jsonb_build_object('ok', true, 'revoked', v_count);
end;
$$;
revoke all on function public.revoke_license(text) from public;
revoke all on function public.revoke_license(text) from anon;
grant execute on function public.revoke_license(text) to service_role;

-- LISTO. Para revocar a mano una licencia vieja (payment_intent_id NULL):
--   update public.licenses set status='revoked'
--   where key_hash = encode(digest(upper('FNOS-XXXX-XXXX-XXXX'),'sha256'),'hex');
