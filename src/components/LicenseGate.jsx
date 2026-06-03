// src/components/LicenseGate.jsx
// Pantalla de activación de licencia FinanceOS
// Se muestra solo si no hay licencia activa en localStorage

import { useState } from 'react'
import { validateLicense, saveLicense } from '../utils/licenseValidator.js'

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
  card: {
    background: 'var(--card)',
    border: '1px solid var(--brd)',
    borderRadius: '16px',
    padding: '40px 36px',
    maxWidth: '420px',
    width: '100%',
  },
  logo: {
    fontFamily: 'var(--head)',
    fontSize: '22px',
    color: 'var(--ink)',
    marginBottom: '6px',
    fontWeight: '600',
  },
  version: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    color: 'var(--ink3)',
    marginBottom: '32px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--ink)',
    marginBottom: '8px',
    fontFamily: 'var(--head)',
  },
  sub: {
    fontSize: '13px',
    color: 'var(--ink2)',
    marginBottom: '24px',
    lineHeight: '1.5',
    fontFamily: 'var(--body)',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid var(--brd)',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'var(--mono)',
    background: 'var(--bg)',
    color: 'var(--ink)',
    letterSpacing: '1px',
    marginBottom: '12px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: 'var(--grn)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'var(--body)',
    marginBottom: '16px',
  },
  btnDisabled: {
    opacity: '0.6',
    cursor: 'not-allowed',
  },
  error: {
    fontSize: '12px',
    color: '#e84142',
    marginBottom: '12px',
    fontFamily: 'var(--mono)',
    padding: '8px 12px',
    background: 'rgba(232,65,66,.08)',
    borderRadius: '6px',
  },
  demo: {
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--ink3)',
    fontFamily: 'var(--mono)',
  },
  demoLink: {
    color: 'var(--grn)',
    textDecoration: 'none',
    fontWeight: '500',
  },
  disclaimer: {
    marginTop: '24px',
    padding: '12px',
    background: 'var(--bg2, #f5f5f0)',
    borderRadius: '8px',
    fontSize: '11px',
    color: 'var(--ink3)',
    lineHeight: '1.5',
    fontFamily: 'var(--mono)',
  },
}

export default function LicenseGate({ onActivate }) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleActivate() {
    if (!key.trim()) return
    setLoading(true)
    setError('')
    try {
      const valid = await validateLicense(key)
      if (valid) {
        saveLicense(key)
        onActivate()
      } else {
        setError('Clave inválida. Verifica que la copiaste correctamente desde Gumroad.')
      }
    } catch(e) {
      setError('Error al validar. Intenta nuevamente.')
    }
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleActivate()
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>FinanceOS</div>
        <div style={s.version}>v1.2 · MAXNOVA & LUCI Global LLC</div>

        <div style={s.title}>Activa tu licencia</div>
        <div style={s.sub}>
          Ingresa la clave que recibiste al comprar en Gumroad.
          La encontrarás en tu email de confirmación.
        </div>

        <input
          style={s.input}
          type="text"
          placeholder="FNOS-XXXX-XXXX-XXXX"
          value={key}
          onChange={e => setKey(e.target.value.toUpperCase())}
          onKeyDown={handleKey}
          autoFocus
          spellCheck={false}
        />

        {error && <div style={s.error}>{error}</div>}

        <button
          style={{...s.btn, ...(loading || !key.trim() ? s.btnDisabled : {})}}
          onClick={handleActivate}
          disabled={loading || !key.trim()}
        >
          {loading ? 'Verificando...' : 'Activar FinanceOS →'}
        </button>

        <div style={s.demo}>
          ¿Quieres probar antes de comprar?{' '}
          
            href="https://demo.financeospro.com/app/?demo=true"
            target="_blank"
            rel="noopener noreferrer"
            style={s.demoLink}
          >
            Ver demo gratuito →
          </a>
        </div>

        <div style={s.disclaimer}>
          Esta clave es personal e intransferible. No la compartas.
          Cada compra incluye una clave única de acceso.
          ¿Problemas? maxnovaluciglobal@gmail.com
        </div>
      </div>
    </div>
  )
}
