// api/plaid/sync.js — Vercel Edge Function
// Tercer paso, y el único que se vuelve a llamar después del enganche
// inicial: recibe el access_token + cursor guardados en el dispositivo del
// usuario, pide a Plaid los movimientos nuevos/modificados/eliminados desde
// ese cursor (endpoint incremental /transactions/sync, no el /transactions/get
// viejo), y devuelve todo + el cursor siguiente. No persiste nada — el
// cliente es quien guarda accessToken y cursor en su propio IndexedDB.
//
// El access_token SÍ cruza la red en cada sincronización (viaja del
// dispositivo a esta función). No hay forma de evitar esto con Plaid sin
// guardar el token en un servidor — ver la nota de diseño del commit.

export const config = { runtime: 'edge' };

const PLAID_BASE = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
};

const ALLOWED_ORIGINS = ['https://app.financeospro.com', 'https://demo.financeospro.com'];
const MAX_PAGES = 20; // tope de seguridad — un item real no debería necesitar tantas paginas

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
    const { accessToken, cursor } = await req.json();
    if (!accessToken) return new Response(JSON.stringify({ error: 'missing_access_token' }), { status: 400, headers: HEADERS });

    let added = [], modified = [], removed = [];
    let nextCursor = cursor || undefined;
    let hasMore = true;
    let pages = 0;

    while (hasMore && pages < MAX_PAGES) {
      pages++;
      const res = await fetch(`${base}/transactions/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id, secret, access_token: accessToken, cursor: nextCursor, count: 500 }),
        signal: AbortSignal.timeout(15000),
      });
      const json = await res.json();

      if (!res.ok) {
        // ITEM_LOGIN_REQUIRED: el banco pide reconectar (contraseña cambiada,
        // MFA vencido, etc.) — el cliente debe ofrecer "Reconectar", no
        // reintentar solo. Se lo marcamos explícito en vez de un error genérico.
        const needsReauth = json.error_code === 'ITEM_LOGIN_REQUIRED';
        return new Response(
          JSON.stringify({ error: json.error_code || 'plaid_error', message: json.error_message, needsReauth }),
          { status: 502, headers: HEADERS }
        );
      }

      added = added.concat(json.added || []);
      modified = modified.concat(json.modified || []);
      removed = removed.concat((json.removed || []).map(r => r.transaction_id));
      nextCursor = json.next_cursor;
      hasMore = !!json.has_more;
    }

    return new Response(JSON.stringify({ added, modified, removed, nextCursor }), { status: 200, headers: HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'fetch_failed' }), { status: 500, headers: HEADERS });
  }
}
