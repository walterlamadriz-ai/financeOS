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

async function issueLicense(key: string, plan: string, email: string | null, session: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/issue_license`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_key: key, p_plan: plan, p_email: email, p_session: session }),
  });
  if (!res.ok) throw new Error(`issue_license failed: ${res.status} ${await res.text()}`);
}

async function sendKeyEmail(to: string, key: string, plan: string) {
  if (!RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY no configurada — clave generada NO enviada por email: ${key}`);
    return;
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
  if (!res.ok) console.error("Resend error:", res.status, await res.text());
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
  if (event?.type === "checkout.session.completed" && event?.livemode !== true) {
    console.warn(`Evento de TEST ignorado (no se emite licencia): session=${event?.data?.object?.id}`);
    return new Response(JSON.stringify({ received: true, ignored: "test_event" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (event?.type === "checkout.session.completed") {
    const session = event.data?.object ?? {};
    // Solo checkouts realmente pagados y con un monto válido (evita $0 / pruebas).
    const amount = session.amount_total ?? 0;
    if (session.payment_status !== "paid" || amount < 1900) {
      console.warn(`Checkout ignorado: payment_status=${session.payment_status} amount=${amount} session=${session.id}`);
      return new Response(JSON.stringify({ received: true, ignored: "unpaid_or_zero" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const email = session.customer_details?.email ?? session.customer_email ?? null;
    const plan = planFromAmount(amount);
    const key = generateKey();
    try {
      await issueLicense(key, plan, email, session.id ?? null);
      if (email) await sendKeyEmail(email, key, plan);
      // Log siempre la clave (para test/retiro manual aunque no haya email)
      console.log(`Licencia emitida: plan=${plan} email=${email} key=${key} session=${session.id}`);
    } catch (err) {
      console.error("Error emitiendo licencia:", err);
      return new Response("error issuing license", { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
