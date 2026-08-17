// api/plaid/exchange-token.js — Vercel Edge Function
// Segundo paso: cambia el public_token (efímero, solo sirve una vez) por un
// access_token real. El access_token es la credencial de acceso continuo a
// la cuenta bancaria — este endpoint lo devuelve al cliente y lo OLVIDA de
// inmediato. No hay base de datos acá: FinanceOS guarda el access_token
// únicamente en el dispositivo del usuario (plaidStore.js), nunca en el
// servidor. Ver la nota de diseño en el commit de esta feature.

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
    const { publicToken } = await req.json();
    if (!publicToken) return new Response(JSON.stringify({ error: 'missing_public_token' }), { status: 400, headers: HEADERS });

    const res = await fetch(`${base}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id, secret, public_token: publicToken }),
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: json.error_code || 'plaid_error', message: json.error_message }), { status: 502, headers: HEADERS });
    }

    return new Response(JSON.stringify({ accessToken: json.access_token, itemId: json.item_id }), { status: 200, headers: HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'fetch_failed' }), { status: 500, headers: HEADERS });
  }
}
