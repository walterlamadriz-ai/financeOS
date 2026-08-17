// api/plaid/create-link-token.js — Vercel Edge Function
// Primer paso del flujo de Plaid Link. PLAID_CLIENT_ID/PLAID_SECRET quedan
// server-side siempre — nunca deben llegar al navegador. Este endpoint no
// persiste nada: recibe un client_user_id generado en el dispositivo
// (plaidStore.js) y lo reenvía, sin guardar ningún registro propio.
//
// PLAID_ENV controla el ambiente (sandbox/development/production) — hoy es
// 'sandbox' (confirmado en vivo el 2026-08-17: EEUU y México, el resto de
// Latam sin cobertura real de Plaid). Pasar a production el día de mañana es
// solo cambiar esta env var + la secret correspondiente, sin tocar código.

export const config = { runtime: 'edge' };

const PLAID_BASE = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
};

const ALLOWED_ORIGINS = ['https://app.financeospro.com', 'https://demo.financeospro.com'];

function corsHeaders(req) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
  };
}

export default async function handler(req) {
  const HEADERS = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: HEADERS });

  const client_id = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const base = PLAID_BASE[process.env.PLAID_ENV || 'sandbox'];
  if (!client_id || !secret) {
    return new Response(JSON.stringify({ error: 'not_configured' }), { status: 503, headers: HEADERS });
  }

  try {
    const { clientUserId, language } = await req.json();
    if (!clientUserId || typeof clientUserId !== 'string') {
      return new Response(JSON.stringify({ error: 'missing_client_user_id' }), { status: 400, headers: HEADERS });
    }

    const res = await fetch(`${base}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id,
        secret,
        client_name: 'FinanceOS',
        user: { client_user_id: clientUserId },
        products: ['transactions'],
        // Solo EEUU: verificado en vivo el 2026-08-17 contra el sandbox real.
        // México da INVALID_FIELD — esta cuenta de Plaid no tiene el país
        // habilitado todavía (hay que pedirlo desde el dashboard de Plaid,
        // "request product access"). Agregar 'MX' de vuelta acá una vez que
        // Plaid confirme el acceso — no antes, para no ofrecer un flujo que
        // siempre va a fallar.
        country_codes: ['US'],
        language: language === 'es' ? 'es' : 'en',
      }),
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: json.error_code || 'plaid_error', message: json.error_message }), { status: 502, headers: HEADERS });
    }

    return new Response(JSON.stringify({ linkToken: json.link_token }), { status: 200, headers: HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'fetch_failed' }), { status: 500, headers: HEADERS });
  }
}
