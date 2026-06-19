// src/demo/DemoBanner.jsx
// Banner persistente para modo demo — visible en todas las páginas

import { useState } from 'react'

export default function DemoBanner() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 200,
      background: 'linear-gradient(135deg, #0a5c3e, #127a50)',
      color: '#fff',
      boxShadow: '0 2px 12px rgba(10,92,62,.3)',
    }}>

      {/* Fila principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', minHeight: 40 }}>
        <div style={{
          background: 'rgba(255,255,255,.2)',
          borderRadius: 20,
          padding: '2px 8px',
          fontSize: 10,
          fontFamily: 'var(--mono)',
          fontWeight: 600,
          letterSpacing: 1,
          flexShrink: 0,
          border: '1px solid rgba(255,255,255,.3)',
          whiteSpace: 'nowrap',
        }}>
          DEMO
        </div>

        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.85)', flex: 1, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Datos ficticios · Sofía García · Colombia · nada se guarda
        </span>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'rgba(255,255,255,.15)',
              border: '1px solid rgba(255,255,255,.25)',
              color: '#fff',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              whiteSpace: 'nowrap',
            }}
          >
            {expanded ? 'Ocultar' : '¿Por qué FinanceOS?'}
          </button>
          <button
            onClick={() => window.open('https://financeospro.com/#pricing', '_blank')}
            style={{
              background: '#fff',
              border: 'none',
              color: '#0a5c3e',
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Obtener →
          </button>
        </div>
      </div>

      {/* Panel expansible con argumentos de compra */}
      {expanded && (
        <div style={{
          background: 'rgba(0,0,0,.18)',
          padding: '14px 16px 16px',
          fontSize: 12,
          lineHeight: 1.6,
          color: 'rgba(255,255,255,.85)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>🔒 Solo tú tienes tus datos</div>
            <div>Todo queda en tu dispositivo. Sin servidores, sin cuentas, sin conexión obligatoria. Nadie más puede ver tus finanzas.</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>💳 Un solo pago. Para siempre.</div>
            <div>Sin suscripciones, sin renovaciones automáticas, sin sorpresas. Personal desde $19.99 USD · Pro desde $29.99 USD.</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>📊 Diagnóstico automático</div>
            <div>El sistema analiza tus finanzas cada mes y te dice exactamente qué mejorar. Sin hojas de cálculo, sin configuración manual.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => window.open('https://financeospro.com/#pricing', '_blank')}
              style={{
                background: '#fff',
                border: 'none',
                color: '#0a5c3e',
                borderRadius: 8,
                padding: '9px 18px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Empezar con mis datos reales →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
