// src/pages/Dashboard/CountryTool.jsx
// #03 — El foso competitivo, hecho protagonista.
// La herramienta fiscal por país es el diferenciador más único de FinanceOS,
// pero vivía enterrada como un ítem más en la navegación lateral (Shell.jsx).
// Aquí se eleva a tarjeta destacada del Dashboard: al elegir país, su
// herramienta exclusiva aparece como protagonista, no como letra chica.
import { useT } from '../../i18n/useT.js'

// País → herramienta fiscal (mismo mapa que la nav en Shell.jsx).
const TOOL_BY_COUNTRY = {
  CL: { id: 'hipoteca',     flag: '🇨🇱', nameKey: 'nav.hipotecaCL' },
  PT: { id: 'ppr',          flag: '🇵🇹', nameKey: 'nav.pprPortugal' },
  EC: { id: 'deducciones',  flag: '🇪🇨', nameKey: 'nav.deductions' },
  PE: { id: 'deducciones',  flag: '🇵🇪', nameKey: 'nav.deductions' },
  MX: { id: 'ahorrofiscal', flag: '🇲🇽', nameKey: 'nav.taxSavings' },
  CO: { id: 'ahorrofiscal', flag: '🇨🇴', nameKey: 'nav.taxSavings' },
  US: { id: 'ahorrofiscal', flag: '🇺🇸', nameKey: 'nav.taxSavings' },
  ES: { id: 'ahorrofiscal', flag: '🇪🇸', nameKey: 'nav.taxSavings' },
  AR: { id: 'inflacion',    flag: '🇦🇷', nameKey: 'nav.inflation' },
  VE: { id: 'multimoneda',  flag: '🇻🇪', nameKey: 'nav.multicurrency' },
  DE: { id: 'steuer',       flag: '🇩🇪', nameKey: 'nav.steuerDE' },
}

export default function CountryTool({ country, setPage }) {
  const { t } = useT()
  const cc   = (country || 'CL').toUpperCase()
  const tool = TOOL_BY_COUNTRY[cc]
  if (!tool || !setPage) return null

  return (
    <button
      type="button"
      onClick={() => setPage(tool.id)}
      className="card rise"
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 18px', marginBottom: 16,
        background: 'var(--grn-tint)', borderLeft: '3px solid var(--grn)',
      }}
    >
      <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">{tool.flag}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--grn)' }}>
          {t('countryTool.eyebrow')}
        </span>
        <span className="display" style={{ fontSize: 17, fontWeight: 700, color: 'var(--tx)', lineHeight: 1.15 }}>
          {t(tool.nameKey)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--tm)', lineHeight: 1.45 }}>
          {t('countryTool.sub')}
        </span>
      </span>
      <span style={{
        flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
        color: 'var(--grn)', display: 'inline-flex', alignItems: 'center', gap: 5,
        border: '.5px solid color-mix(in srgb, var(--grn) 35%, transparent)',
        borderRadius: 999, padding: '6px 12px', whiteSpace: 'nowrap',
      }}>
        {t('countryTool.cta')} →
      </span>
    </button>
  )
}
