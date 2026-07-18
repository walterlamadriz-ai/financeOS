// src/pages/Dashboard/MonthVerdict.jsx
// "Número héroe" del mes — una respuesta clara y grande: ¿te sobra o te falta?
// Inspirado en la claridad de apps como Kentra ("¿ganas o pierdes?"), pero con
// el dato honesto de FinanceOS: el DISPONIBLE REAL (freeFlow) = ingresos − gastos
// − deudas − suscripciones. No es el saldo del banco; es lo que de verdad queda.
import CountUp from '../../components/CountUp.jsx'
import { useT } from '../../i18n/useT.js'

export default function MonthVerdict({ freeFlow, hasData, sym, month }) {
  const { t } = useT()

  const positive = freeFlow > 0
  const tight    = freeFlow === 0
  const color = !hasData ? 'var(--th)'
    : positive ? 'var(--pos)'
    : tight    ? 'var(--warn)'
    : 'var(--neg)'
  const bg = !hasData ? 'var(--sur)'
    : positive ? 'color-mix(in srgb, var(--pos) 8%, var(--sur))'
    : tight    ? 'color-mix(in srgb, var(--warn) 8%, var(--sur))'
    : 'color-mix(in srgb, var(--neg) 8%, var(--sur))'

  const label = !hasData ? '' : positive ? t('verdict.surplus') : tight ? t('verdict.tight') : t('verdict.deficit')
  const sub   = !hasData ? '' : positive || tight ? t('verdict.sub') : t('verdict.subDeficit')

  return (
    <div className="card rise" style={{
      padding: '18px 20px', marginBottom: 16, background: bg,
      borderLeft: `3px solid ${color}`, display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--th)' }}>
        {t('verdict.eyebrow')} · {month}
      </div>

      {!hasData ? (
        <div style={{ fontSize: 15, color: 'var(--tm)', fontWeight: 500, marginTop: 2 }}>
          {t('verdict.noData')}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: 'var(--tm)', fontWeight: 500 }}>{label}</div>
          <div className="num" style={{ fontSize: 38, fontWeight: 700, color, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            {freeFlow < 0 ? '−' : ''}{sym}<CountUp value={Math.abs(freeFlow)} format={(v) => Math.round(v).toLocaleString('es-CL')} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 2 }}>{sub}</div>
        </>
      )}
    </div>
  )
}
