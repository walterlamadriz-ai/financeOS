-- FinanceOS — Asociar email del cliente a su licencia
-- Pega esto en: Supabase Dashboard → tu proyecto → SQL Editor → New Query → Run
-- Idempotente. Requiere que ya exista public.licenses (supabase-licenses.sql).

create or replace function public.set_license_email(p_key text, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_email text := nullif(trim(p_email), '');
begin
  if p_key is null or v_email is null then
    return jsonb_build_object('ok', false, 'error', 'bad_args');
  end if;
  -- validación básica de formato de email
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('ok', false, 'error', 'bad_email');
  end if;

  v_hash := encode(digest(upper(trim(p_key)), 'sha256'), 'hex');

  update public.licenses
     set email = v_email
   where key_hash = v_hash
     and status = 'active'
     and (expires_at is null or expires_at > now());

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_license');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.set_license_email(text, text) from public;
grant  execute on function public.set_license_email(text, text) to anon;

-- Verificá con: select email from public.licenses where key_hash = encode(digest(upper('FNOS-XXXX-XXXX-XXXX'),'sha256'),'hex');
