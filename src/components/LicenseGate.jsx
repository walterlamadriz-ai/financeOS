// src/components/LicenseGate.jsx
import { useState } from 'react'
import { validateLicense, setLicenseEmail } from '../utils/licenseValidator.js'

const PLANS = [
  {
    name: 'Personal',
    price: 'US$19',
    desc: 'Pago único · uso personal',
    product: 'personal',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 'US$29',
    desc: 'PDF · Asesor · APV · pago único',
    product: 'pro',
    highlight: true,
  },
]

// Stripe Payment Links (Live) — Personal US$19 / Pro US$29
const CHECKOUT_LINKS = {
  personal: 'https://buy.stripe.com/6oU5kFdxo2a95Xz7Z73wQ00',
  pro:      'https://buy.stripe.com/3cIdRb9h82a90Dfenv3wQ01',
}

async function startCheckout(product) {
  const url = CHECKOUT_LINKS[product] || 'https://financeospro.com/#pricing'
  window.location.href = url
}

export default function LicenseGate({ onActivate }) {
  const [key, setKey]           = useState('')
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [buying, setBuying]     = useState(null)
  const [error, setError]       = useState('')
  const [showHelp, setShowHelp] = useState(false)

  async function handleActivate() {
    const clean = key.trim()
    if (!clean) return
    setLoading(true)
    setError('')
    try {
      const valid = await validateLicense(clean)
      if (valid) {
        // Best-effort: asocia el email para avisos/soporte. No bloquea la activación si falla.
        if (email.trim()) setLicenseEmail(email).catch(() => {})
        onActivate()
      } else {
        setError('Clave inválida. Verifica que la copiaste completa desde el email de confirmación.')
        setShowHelp(true)
      }
    } catch {
      setError('Sin conexión. Verifica tu internet e intenta nuevamente.')
    }
    setLoading(false)
  }

  async function handleBuy(product) {
    setBuying(product)
    try {
      await startCheckout(product)
    } catch {
      setError('Error al conectar con el servidor de pagos. Intenta de nuevo.')
      setBuying(null)
    }
  }

  const s = {
    wrap: {
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--body)',
    },
    box: {
      background: 'var(--card,#fff)',
      border: '0.5px solid var(--brd2,#e2e2dc)',
      borderRadius: 18,
      padding: '40px 36px',
      maxWidth: 440,
      width: '100%',
      boxShadow: '0 4px 24px rgba(0,0,0,.07)',
    },
  }

  return (
    <div style={s.wrap}>
      <div style={s.box}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 34, height: 34, background: 'var(--grn,#1a6b4a)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>F</div>
          <div>
            <div style={{ fontFamily: 'var(--head)', fontSize: 17, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-.3px' }}>FinanceOS</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink3,#888)', marginTop: 1 }}>v1.5 · MAXNOVA & LUCI Global LLC</div>
          </div>
        </div>

        {/* Activate */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 6, fontFamily: 'var(--head)' }}>Ingresa tu clave de acceso</div>
          <div style={{ fontSize: 12, color: 'var(--ink2,#666)', lineHeight: 1.6, marginBottom: 14, fontFamily: 'var(--body)' }}>
            La encontrarás en el email de confirmación de tu compra, con formato{' '}
            <span style={{ fontFamily: 'var(--mono)', background: '#f4f4f0', padding: '1px 6px', borderRadius: 4 }}>FNOS-XXXX-XXXX-XXXX</span>
          </div>
          <input
            style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--brd,#e0e0d8)', borderRadius: 8, fontSize: 14, fontFamily: 'var(--mono)', background: 'var(--bg)', color: 'var(--ink)', letterSpacing: 1, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
            type="text"
            placeholder="FNOS-XXXX-XXXX-XXXX"
            value={key}
            onChange={e => { setKey(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleActivate()}
            autoFocus
            spellCheck={false}
          />

          <input
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--brd,#e0e0d8)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--body)', background: 'var(--bg)', color: 'var(--ink)', marginBottom: 4, boxSizing: 'border-box', outline: 'none' }}
            type="email"
            placeholder="Tu email (opcional — avisos y soporte)"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleActivate()}
            spellCheck={false}
          />
          <div style={{ fontSize: 10, color: '#999', fontFamily: 'var(--mono)', marginBottom: 10, lineHeight: 1.5 }}>
            Solo para avisarte de novedades importantes o si necesitas soporte. Nunca vemos tus datos financieros.
          </div>

          {error && (
            <div style={{ fontSize: 11, color: '#c0392b', marginBottom: 10, fontFamily: 'var(--mono)', padding: '8px 12px', background: 'rgba(192,57,43,.07)', borderRadius: 7, lineHeight: 1.5 }}>
              ⚠ {error}
            </div>
          )}

          <button
            style={{ width: '100%', padding: 12, background: 'var(--grn,#1a6b4a)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading || !key.trim() ? 'not-allowed' : 'pointer', opacity: loading || !key.trim() ? 0.55 : 1, fontFamily: 'var(--body)', transition: 'opacity .15s' }}
            onClick={handleActivate}
            disabled={loading || !key.trim()}
          >
            {loading ? 'Verificando…' : 'Activar FinanceOS →'}
          </button>

          {showHelp && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: '#f7f8f4', borderRadius: 8, fontSize: 11, color: '#555', fontFamily: 'var(--mono)', lineHeight: 1.65 }}>
              <strong style={{ color: 'var(--ink)' }}>¿Dónde está mi clave?</strong><br />
              1. Abre el email de confirmación de tu compra<br />
              2. Busca el campo "License Key" — formato FNOS-XXXX-XXXX-XXXX<br />
              3. Cópiala completa y pégala arriba<br /><br />
              ¿No encuentras el email?{' '}
              <a href="https://financeospro.com/activate.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--grn)' }}>
                Ver instrucciones completas →
              </a>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0' }}>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--brd,#e0e0d8)' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#aaa', flexShrink: 0 }}>¿Aún no tienes licencia?</span>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--brd,#e0e0d8)' }} />
        </div>

        {/* Purchase plans */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {PLANS.map(p => (
            <button
              key={p.name}
              onClick={() => handleBuy(p.product)}
              disabled={buying !== null}
              style={{
                flex: 1,
                padding: '14px 12px',
                borderRadius: 10,
                textAlign: 'center',
                border: p.highlight ? '1.5px solid var(--grn,#1a6b4a)' : '1px solid var(--brd,#e0e0d8)',
                background: p.highlight ? 'rgba(26,107,74,.05)' : 'var(--bg)',
                cursor: buying !== null ? 'not-allowed' : 'pointer',
                opacity: buying && buying !== p.product ? 0.5 : 1,
                transition: 'transform .12s, opacity .15s',
              }}
              onMouseOver={e => { if (!buying) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ fontFamily: 'var(--head)', fontSize: 13, fontWeight: 600, color: p.highlight ? 'var(--grn,#1a6b4a)' : 'var(--ink)', marginBottom: 3 }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--head)', fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>{p.price}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#888' }}>{p.desc}</div>
              {buying === p.product && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--grn)', marginTop: 6 }}>Redirigiendo…</div>
              )}
            </button>
          ))}
        </div>

        {/* Demo link */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#aaa', fontFamily: 'var(--mono)' }}>
          <a href="https://demo.financeospro.com/app/?demo=true" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--grn,#1a6b4a)', textDecoration: 'none' }}>
            Explorar el demo gratis →
          </a>
        </div>

      </div>
    </div>
  )
}
