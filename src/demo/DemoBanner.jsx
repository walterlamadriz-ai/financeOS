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
      padding: expanded ? '10px 20px 14px' : '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      boxShadow: '0 2px 12px rgba(10,92,62,.3)',
      transition: 'padding .2s',
    }}>

      {/* Fila principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 40 }}>
        {/* Badge demo */}
        <div style={{
          background: 'rgba(255,255,255,.2)',
          borderRadius: 20,
          padding: '2px 10px',
          fontSize: 10,
          fontFamily: 'var(--mono)',
          fontWeight: 600,
          letterSpacing: 1,
          flexShrink: 0,
          border: '1px solid rgba(255,255,255,.3)',
        }}>
          MODO DEMO
        </div>

        {/* Mensaje principal */}
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', flex: 1, lineHeight: 1.4 }}>
          Estás explorando con datos ficticios de "María González".{' '}
          <span style={{ color: 'rgba(255,255,255,.6)' }}>
            Nada de esto se guardará en tu dispositivo.
          </span>
        </span>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'rgba(255,255,255,.15)',
              border: '1px solid rgba(255,255,255,.25)',
              color: '#fff',
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'var(--syne, sans-serif)',
            }}
          >
            {expanded ? 'Ocultar' : '¿Qué es esto?'}
          </button>
          <button
            onClick={() => window.open('https://financeos-landing-omega.vercel.app/#pricing', '_blank')}
            style={{
              background: '#fff',
              border: 'none',
              color: '#0a5c3e',
              borderRadius: 6,
              padding: '5px 14px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--syne, sans-serif)',
            }}
          >
            Obtener licencia →
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
