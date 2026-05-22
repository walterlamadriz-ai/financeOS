// src/demo/DemoBanner.jsx
// Banner persistente para modo demo — visible en todas las páginas
// Se muestra cuando settings.isDemo === true

import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

export default function DemoBanner({ onExitDemo }) {
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

      {/* Fila principal — compacta en mobile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', minHeight: 40 }}>
        {/* Badge demo */}
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

        {/* Mensaje principal — truncado en mobile */}
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.85)', flex: 1, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Datos ficticios · nada se guarda
        </span>

        {/* Botones */}
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
            {expanded ? 'Ocultar' : 'Info'}
          </button>
          <button
            onClick={() => window.open('https://financeos-landing-omega.vercel.app/#pricing', '_blank')}
            style={{
              background: '#fff',
              border: 'none',
              color: '#0a5c3e',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Obtener →
          </button>
        </div>
      </div>

      {/* Expansión informativa */}
      {expanded && (
        <div style={{
          background: 'rgba(0,0,0,.15)',
          borderRadius: 8,
          padding: '12px 14px',
          fontSize: 12,
          lineHeight: 1.6,
          color: 'rgba(255,255,255,.8)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>📊 Qué estás viendo</div>
            <div>Datos ficticios de una coach financiera con 3 meses de historial. Dashboard, presupuestos, deudas y metas simulados.</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>🔒 Tus datos reales</div>
            <div>Esta demo vive solo en memoria. Al cerrar la ventana desaparece. No toca tu IndexedDB ni tus datos reales.</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>🚀 Para usar con clientes</div>
            <div>Con la licencia Pro podés personalizar esta app con tu marca y entregársela a tus clientes en 30 minutos.</div>
          </div>
        </div>
      )}
    </div>
  )
}
