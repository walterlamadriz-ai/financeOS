// src/components/legal/MicroCopy.jsx
// Componentes de microcopy legal — reutilizables en toda la app
// Importar donde se necesite mostrar avisos contextuales

// ── FINANCIAL DISCLAIMER ─────────────────────────────────────────────────────
// Usar en: Dashboard, Reportes, Proyección, pie de página de la app
export function FinancialDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <p style={{
        fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)',
        lineHeight: 1.5, marginTop: 8,
      }}>
        Orientación general · No constituye asesoría financiera certificada.
      </p>
    )
  }
  return (
    <div style={{
      fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)',
      lineHeight: 1.6, padding: '8px 12px', background: 'var(--sur2)',
      borderRadius: 6, borderLeft: '2px solid var(--brd2)', marginTop: 8,
    }}>
      FinanceOS es una herramienta de organización financiera personal. Los datos y
      proyecciones mostrados se basan en la información ingresada por el usuario y
      no constituyen asesoría financiera, tributaria ni de inversión.
    </div>
  )
}

// ── BACKUP WARNING ────────────────────────────────────────────────────────────
// Usar en: Ajustes, onboarding final, primer acceso al módulo de exportación
export function BackupWarning({ variant = 'full' }) {
  if (variant === 'inline') {
    return (
      <p style={{
        fontSize: 11, color: '#854f0b', fontFamily: 'var(--mono)',
        lineHeight: 1.5, marginTop: 6,
      }}>
        ⚠ Exportá un respaldo JSON periódicamente. Los datos locales pueden perderse
        si borrás el navegador o cambiás de dispositivo.
      </p>
    )
  }
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '12px 14px', background: '#faeeda',
      border: '0.5px solid rgba(133,79,11,.2)', borderRadius: 8,
      fontSize: 12, color: '#854f0b', lineHeight: 1.6,
    }}>
      <span style={{ flexShrink: 0, fontSize: 16, marginTop: 1 }}>⚠</span>
      <div>
        <strong>Tus datos viven en este dispositivo.</strong> Si borrás el navegador,
        limpiás la caché o cambiás de dispositivo sin exportar un respaldo, perderás
        todos tus datos de forma permanente. Exportá un respaldo JSON desde{' '}
        <strong>Ajustes → Exportar JSON</strong> al menos una vez al mes.
      </div>
    </div>
  )
}

// ── PRIVACY BADGE ─────────────────────────────────────────────────────────────
// Usar en: Dashboard (primera vez), onboarding, ajustes
export function PrivacyBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', background: 'var(--grn-bg)',
      border: '0.5px solid rgba(26,163,104,.2)', borderRadius: 20,
      fontSize: 11, color: 'var(--grn)', fontFamily: 'var(--mono)',
    }}>
      <span>🔒</span>
      <span>Datos locales · Sin servidor · Sin cuentas</span>
    </div>
  )
}

// ── LOCAL STORAGE NOTICE ──────────────────────────────────────────────────────
// Usar en: primera carga, ajustes, exportación
export function LocalStorageNotice() {
  return (
    <div style={{
      padding: '10px 14px', background: 'var(--sur2)',
      border: '0.5px solid var(--brd)', borderRadius: 8,
      fontSize: 12, color: 'var(--tm)', lineHeight: 1.6,
    }}>
      <strong style={{ color: 'var(--tx)' }}>¿Dónde están tus datos?</strong>{' '}
      Guardados en este navegador, en este dispositivo. FinanceOS no tiene servidor —
      tus datos nunca salen de acá. Exportá un respaldo JSON para acceder desde
      otro dispositivo.
    </div>
  )
}

// ── PROJECTION DISCLAIMER ─────────────────────────────────────────────────────
// Usar en: módulo de Proyección de flujo de caja
export function ProjectionDisclaimer() {
  return (
    <p style={{
      fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)',
      lineHeight: 1.5, marginTop: 8,
    }}>
      * Proyección calculada sobre ingresos y gastos recurrentes registrados.
      No incluye eventos futuros imprevistos. Orientación general — no constituye
      asesoría financiera certificada.
    </p>
  )
}

// ── REPORTS DISCLAIMER ────────────────────────────────────────────────────────
// Usar en: módulo de Reportes
export function ReportsDisclaimer() {
  return (
    <p style={{
      fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)',
      lineHeight: 1.5, padding: '6px 10px', background: 'var(--sur2)',
      borderRadius: 4, marginTop: 4,
    }}>
      Las recomendaciones mostradas se basan en los datos registrados y son
      orientativas. No constituyen asesoría financiera, tributaria ni de inversión.
    </p>
  )
}
