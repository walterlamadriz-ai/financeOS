// FinanceOS — Webhook de Stripe → emite licencia en Supabase + envía email
// Supabase Edge Function (Deno). Deploy:
//   supabase functions deploy stripe-webhook --no-verify-jwt
// Env (supabase secrets set):
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL,
//   SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, FROM_EMAIL
//
// Stripe Dashboard → Developers → Webhooks → endpoint:
//   https://<TU-PROYECTO>.supabase.co/functions/v1/stripe-webhook
//   evento: checkout.session.completed

import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "FinanceOS <licencias@financeospro.com>";

// Genera una clave FNOS-XXXX-XXXX-XXXX (sin caracteres ambiguos)
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

// Determina el plan según el monto pagado (US$19.99 Personal / US$29.99 Pro)
function planFromAmount(amountTotal: number | null): "personal" | "pro" {
  // amountTotal viene en centavos. >= 2500 → Pro
  return (amountTotal ?? 0) >= 2500 ? "pro" : "personal";
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
    console.warn("RESEND_API_KEY no configurada — clave generada pero NO enviada por email:", key);
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
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, sig!, Deno.env.get("STRIPE_WEBHOOK_SECRET")!, undefined, cryptoProvider,
    );
  } catch (err) {
    return new Response(`Webhook signature error: ${(err as Error).message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email ?? session.customer_email ?? null;
    const plan = planFromAmount(session.amount_total);
    const key = generateKey();
    try {
      await issueLicense(key, plan, email, session.id);
      if (email) await sendKeyEmail(email, key, plan);
      console.log(`Licencia emitida: plan=${plan} email=${email} session=${session.id}`);
    } catch (err) {
      console.error("Error emitiendo licencia:", err);
      return new Response("error issuing license", { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
