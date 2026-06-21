// src/demo/DemoBanner.jsx
import { useState } from 'react'
import { useDemo } from './DemoContext.jsx'

export default function DemoBanner() {
  const { setScenario } = useDemo()
  const [scenario, setLocal] = useState('dificil')

  function toggle() {
    const next = scenario === 'dificil' ? 'exitoso' : 'dificil'
    setLocal(next)
    setScenario(next)
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 200,
      background: 'linear-gradient(135deg, #0a5c3e, #127a50)',
      color: '#fff',
      boxShadow: '0 2px 12px rgba(10,92,62,.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', minHeight: 40, flexWrap: 'wrap' }}>

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

        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.85)', flex: 1, lineHeight: 1.3, minWidth: 120 }}>
          Datos ficticios · Sofía García · Colombia
        </span>

        {/* Toggle escenario */}
        <button
          onClick={toggle}
          title={scenario === 'dificil' ? 'Ver mes con buenos ingresos' : 'Ver mes con ingresos bajos'}
          style={{
            background: 'rgba(255,255,255,.12)',
            border: '1px solid rgba(255,255,255,.25)',
            color: '#fff',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 10,
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {scenario === 'dificil' ? '↕ Mes exitoso' : '↕ Mes difícil'}
        </button>

        {/* CTA inmediato */}
        <a
          href="https://financeospro.com/#pricing"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#fff',
            border: 'none',
            color: '#0a5c3e',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          Obtener →
        </a>

      </div>
    </div>
  )
}
