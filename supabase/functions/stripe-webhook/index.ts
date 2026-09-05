// FinanceOS — Webhook de Stripe → emite licencia en Supabase + envía email
// Supabase Edge Function (Deno). SIN SDK de Stripe: verifica la firma con Web Crypto
// (evita el shim de Node de esm.sh que rompe en el runtime nuevo de Supabase/Deno 2).
//
// Secrets necesarios (Supabase → Edge Functions → Secrets):
//   STRIPE_WEBHOOK_SECRET   (whsec_...)   ← obligatorio
//   RESEND_API_KEY, FROM_EMAIL            ← opcional (email de la clave)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ← los inyecta Supabase solo
//
// Stripe → Developers → Webhooks → endpoint:
//   https://<PROYECTO>.supabase.co/functions/v1/stripe-webhook
//   evento: checkout.session.completed

// Acepta firma de TEST y de LIVE: prueba contra ambos secrets (los que existan).
const WEBHOOK_SECRETS = [
  Deno.env.get("STRIPE_WEBHOOK_SECRET"),       // test (o el principal)
  Deno.env.get("STRIPE_WEBHOOK_SECRET_LIVE"),  // live
].filter((s): s is string => !!s);
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "FinanceOS <licencias@financeospro.com>";

const enc = new TextEncoder();

// Verifica la firma del webhook de Stripe (esquema t=...,v1=...) con HMAC-SHA256.
// Prueba contra varios secrets (test + live) y acepta si alguno coincide.
async function verifyStripeSignature(rawBody: string, sigHeader: string, secrets: string[]): Promise<boolean> {
  if (!sigHeader || secrets.length === 0) return false;
  const parts = sigHeader.split(",").map((p) => p.trim());
  const t = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1s = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || v1s.length === 0) return false;

  // tolerancia de 5 min contra replay
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(t)) > 300) return false;

  for (const secret of secrets) {
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${rawBody}`));
    const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
    if (v1s.includes(expected)) return true;
  }
  return false;
}

function generateKey(): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I,O,0,1
  const rnd = crypto.getRandomValues(new Uint8Array(12));
  let out = "";
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) out += "-";
    out += charset[rnd[i] % charset.length];
  }
  return `FNOS-${out}`;
}

function planFromAmount(amountTotal: number | null): "personal" | "pro" {
  // centavos. Personal US$19 (1900) / Pro US$29 (2900) → umbral 2400.
  return (amountTotal ?? 0) >= 2400 ? "pro" : "personal";
}

async function issueLicense(key: string, plan: string, email: string | null, session: string, paymentIntent: string | null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/issue_license`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_key: key, p_plan: plan, p_email: email, p_session: session, p_payment_intent: paymentIntent }),
  });
  if (!res.ok) throw new Error(`issue_license failed: ${res.status} ${await res.text()}`);
}

// Auditoría 2026-08-27: issue_license NO era idempotente por sesión — un
// reintento de Stripe (timeout, o sendKeyEmail fallando DESPUÉS de que la
// licencia ya se insertó bien) generaba una clave nueva y chocaba contra la
// constraint UNIQUE de stripe_session_id, sin capturar ese conflicto (el
// "on conflict" de issue_license solo cubre key_hash). Postgres tiraba una
// excepción no manejada, la RPC devolvía error, el webhook 500, y Stripe
// reintentaba durante 3 días — un cliente que pagó nunca recibía su clave.
// Fix: chequear ANTES si esta sesión ya se procesó. No se puede reenviar LA
// MISMA clave (el servidor nunca guarda el texto plano, solo el hash — por
// diseño, para que un breach del servidor no filtre claves reales), así que
// un reintento detectado simplemente se reconoce como ya cubierto y no
// vuelve a intentar emitir ni a chocar contra la constraint.
async function sessionAlreadyProcessed(sessionId: string): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/licenses?stripe_session_id=eq.${encodeURIComponent(sessionId)}&select=key_hash&limit=1`,
    { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } },
  );
  if (!res.ok) {
    // Si el chequeo mismo falla, no bloqueamos la emisión por eso — issue_license
    // sigue protegido por su propio conflict handling para el caso normal.
    console.error(`sessionAlreadyProcessed check failed: ${res.status} ${await res.text()}`);
    return false;
  }
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0;
}

// FISC-1 (auditoría 2026-08-21): revoca la licencia asociada a un payment_intent
// cuando Stripe manda charge.refunded o charge.dispute.created. Antes de esto
// ningún evento revocaba nada — ver supabase-license-revoke.sql para el
// detalle de por qué se matchea por payment_intent y no por session id.
async function revokeLicense(paymentIntent: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/revoke_license`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_payment_intent: paymentIntent }),
  });
  if (!res.ok) {
    console.error(`revoke_license failed: ${res.status} ${await res.text()}`);
    return { ok: false, error: `http_${res.status}` };
  }
  return await res.json();
}

// Devuelve true solo si Resend aceptó el envío. La clave NUNCA se imprime en
// logs: de ella se deriva la llave AES-GCM del sync (ver utils/syncCrypto.js,
// deriveKey = SHA-256('fnos-sync:'+clave)), así que un log con la clave permite
// descifrar el blob de synced_data de ese usuario y rompe la promesa E2E que
// declara la política de privacidad. Para correlacionar con la fila alcanza
// stripe_session_id, que es UNIQUE en licenses.
async function sendKeyEmail(to: string, key: string, plan: string, sessionRef: string | null): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error(`CRITICO: RESEND_API_KEY no configurada — el cliente pago y NO recibio su clave. session=${sessionRef}`);
    return false;
  }
  const appUrl = "https://app.financeospro.com/app/";
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#0a5c3e">Tu licencia de FinanceOS</h2>
      <p>¡Gracias por tu compra! Tu plan: <strong>${plan === "pro" ? "Pro" : "Personal"}</strong>.</p>
      <p>Tu clave de acceso:</p>
      <p style="font-family:monospace;font-size:20px;font-weight:700;background:#f0f7f3;
                padding:14px;border-radius:8px;text-align:center;letter-spacing:2px">${key}</p>
      <p>Actívala aquí: <a href="${appUrl}">${appUrl}</a></p>
      <p style="color:#888;font-size:12px">Tus datos financieros se guardan solo en tu dispositivo.</p>
    </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject: "Tu licencia de FinanceOS 🔑", html }),
  });
  if (!res.ok) {
    console.error(`Resend error: ${res.status} ${await res.text()} session=${sessionRef}`);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();

  const ok = await verifyStripeSignature(raw, sig, WEBHOOK_SECRETS);
  if (!ok) {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }

  // Blindaje: solo eventos LIVE reales emiten licencia. Un evento de TEST (o un
  // endpoint de test todavía conectado) NO debe mintear una clave real en producción.
  // Cubre los dos tipos que pueden emitir licencia (ver bloque de abajo) — quedó
  // desincronizado una vez ya (ver auditoría 2026-09-01), verificar los dos juntos.
  const CHECKOUT_EVENT_TYPES = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  if (CHECKOUT_EVENT_TYPES.includes(event?.type) && event?.livemode !== true) {
    console.warn(`Evento de TEST ignorado (no se emite licencia): type=${event?.type} session=${event?.data?.object?.id}`);
    return new Response(JSON.stringify({ received: true, ignored: "test_event" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Auditoría externa 2026-09-01: faltaba "checkout.session.async_payment_succeeded".
  // Un Payment Link con OXXO/boleto/SEPA débito habilitado (métodos recomendados por
  // Stripe para LATAM/Alemania) dispara primero "completed" con payment_status:'unpaid'
  // (se ignora abajo, correcto) y solo emite la licencia cuando compensa el pago async
  // días después — evento que este webhook nunca escuchaba. El cliente pagaba y nunca
  // recibía su clave, sin ningún error visible. sessionAlreadyProcessed() ya protege
  // contra procesar dos veces si algún evento llegara duplicado.
  if (CHECKOUT_EVENT_TYPES.includes(event?.type)) {
    const session = event.data?.object ?? {};
    // Solo checkouts realmente pagados y con un monto válido (evita $0 / pruebas).
    const amount = session.amount_total ?? 0;
    if (session.payment_status !== "paid" || amount < 1900) {
      console.warn(`Checkout ignorado: payment_status=${session.payment_status} amount=${amount} session=${session.id}`);
      return new Response(JSON.stringify({ received: true, ignored: "unpaid_or_zero" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    // Idempotencia: si esta sesión ya generó una licencia (reintento de Stripe),
    // no volver a intentarlo — ver sessionAlreadyProcessed().
    if (session.id && await sessionAlreadyProcessed(session.id)) {
      console.log(`Sesión ya procesada, reintento de Stripe ignorado: session=${session.id}`);
      return new Response(JSON.stringify({ received: true, ignored: "already_processed" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const email = session.customer_details?.email ?? session.customer_email ?? null;
    const plan = planFromAmount(amount);
    const key = generateKey();
    // session.payment_intent viene en el propio evento para checkouts de pago
    // único (mode:'payment') — se guarda para poder revocar más adelante si
    // Stripe manda un charge.refunded/charge.dispute.created (ver revokeLicense).
    const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
    try {
      await issueLicense(key, plan, email, session.id ?? null, paymentIntent);
      const emailSent = email ? await sendKeyEmail(email, key, plan, session.id ?? null) : false;
      // Sin `key` a propósito — ver el comentario de sendKeyEmail(). session.id
      // identifica la fila igual de bien y no es material criptografico.
      console.log(`Licencia emitida: plan=${plan} email=${email ?? "(sin email)"} session=${session.id} payment_intent=${paymentIntent} email_enviado=${emailSent}`);
      if (!emailSent) {
        // Antes esto era invisible: la licencia quedaba emitida, el webhook
        // devolvia 200 y nadie se enteraba de que el cliente no tenia su clave.
        console.error(`CRITICO: licencia emitida pero el cliente NO recibio su clave. session=${session.id} email=${email ?? "(sin email)"} payment_intent=${paymentIntent} — la clave original NO es recuperable (el servidor solo guarda su hash): resolver reemitiendo una licencia nueva.`);
      }
    } catch (err) {
      console.error("Error emitiendo licencia:", err);
      return new Response("error issuing license", { status: 500 });
    }
  }

  // FISC-1 — reembolso o disputa: revocar la licencia asociada, si la hay.
  // Silencioso en el caso "not_found" (licencia emitida antes de este fix, sin
  // payment_intent_id guardado, o ya revocada) — no es un error del webhook.
  if (event?.type === "charge.refunded" || event?.type === "charge.dispute.created") {
    const charge = event.data?.object ?? {};
    const paymentIntent = typeof charge.payment_intent === "string" ? charge.payment_intent : (charge.payment_intent?.id ?? null);
    if (paymentIntent) {
      const result = await revokeLicense(paymentIntent);
      console.log(`${event.type}: payment_intent=${paymentIntent} revoke_result=${JSON.stringify(result)}`);
    } else {
      console.warn(`${event.type} sin payment_intent en el payload — no se puede revocar automáticamente, charge=${charge.id}`);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
