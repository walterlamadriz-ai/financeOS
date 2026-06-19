// src/components/ui/ProGate.jsx
// Muestra un bloqueo orientativo si plan !== 'pro'
// Usar: <ProGate><ComponentePro /></ProGate>

import config from '../../config.js'

export default function ProGate({ children, feature = 'esta función' }) {
  const isPro = config.plan === 'pro' || config.plan === 'enterprise'

  if (isPro) return children

  return (
    <div style={{
      maxWidth: 520, margin: '48px auto', padding: '32px 24px',
      background: 'var(--sur)', border: '.5px solid var(--brd)',
      borderRadius: 'var(--r)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>◑</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--amb)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
        Función Pro
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>
        {feature} es exclusivo del plan Pro
      </h2>
      <p style={{ fontSize: 13, color: 'var(--th)', lineHeight: 1.7, marginBottom: 20 }}>
        Actualizá tu licencia a Pro por un pago único de <strong>$29.99 USD</strong> para acceder a Modo Asesor, reportes PDF, proyección de flujo, simulador de deudas, APV Chile e importación CSV.
      </p>
      <a
        href="https://financeospro.com/#pricing"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block', background: 'var(--accent)',
          color: '#0f1923', borderRadius: 8, padding: '10px 22px',
          fontWeight: 700, fontSize: 13, textDecoration: 'none',
          fontFamily: 'var(--mono)',
        }}
      >
        Ver planes →
      </a>
    </div>
  )
}
