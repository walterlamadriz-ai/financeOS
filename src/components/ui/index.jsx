// src/components/ui/index.jsx
// Shared UI primitives

import styles from './ui.module.css'

export function Btn({ children, variant = 'ghost', size = 'md', onClick, disabled, style }) {
  const cls = [styles.btn, styles[`btn_${variant}`], styles[`btn_${size}`]].join(' ')
  return (
    <button className={cls} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  )
}

export function Card({ children, style, className }) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  )
}

export function CardHeader({ title, right }) {
  return (
    <div className={styles.cardHd}>
      <span>{title}</span>
      {right && <span>{right}</span>}
    </div>
  )
}

export function KPI({ label, value, sub, color = 'default' }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiLbl}>{label}</div>
      <div className={[styles.kpiVal, styles[`kpi_${color}`]].join(' ')}>{value}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  )
}

export function Badge({ children, color = 'green' }) {
  return <span className={[styles.badge, styles[`badge_${color}`]].join(' ')}>{children}</span>
}

export function ProgressBar({ value, max = 100, color = 'green', height = 5 }) {
  const pct = Math.min(max > 0 ? (value / max) * 100 : 0, 100)
  return (
    <div className={styles.progBg} style={{ height }}>
      <div className={[styles.progFill, styles[`prog_${color}`]].join(' ')} style={{ width: pct + '%' }} />
    </div>
  )
}

export function FormGroup({ label, children }) {
  return (
    <div className={styles.fg}>
      {label && <label className={styles.fl}>{label}</label>}
      {children}
    </div>
  )
}

export function FormRow({ children }) {
  return <div className={styles.frow}>{children}</div>
}

export function Alert({ children, type = 'warn' }) {
  return <div className={[styles.alert, styles[`alert_${type}`]].join(' ')}>{children}</div>
}

export function Empty({ text = 'Sin registros aún' }) {
  return <div className={styles.empty}>{text}</div>
}

export function TxRow({ dot, name, meta, amount, isIncome, onDelete }) {
  return (
    <div className={styles.txRow}>
      <div className={styles.txDot} style={{ background: dot }} />
      <div className={styles.txInfo}>
        <div className={styles.txName}>{name}</div>
        {meta && <div className={styles.txMeta}>{meta}</div>}
      </div>
      <div className={[styles.txAmt, isIncome ? styles.txInc : styles.txExp].join(' ')}>
        {isIncome ? '+' : '-'}{amount}
      </div>
      {onDelete && (
        <button className={styles.delBtn} onClick={onDelete}>✕</button>
      )}
    </div>
  )
}

export function BarRow({ label, valueLabel, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className={styles.barRow}>
      <div className={styles.barLbl}>
        <span>{label}</span>
        <span>{valueLabel}</span>
      </div>
      <div className={styles.barBg}>
        <div className={styles.barFill} style={{ width: pct + '%', background: color }} />
      </div>
    </div>
  )
}

export function SectionTitle({ children }) {
  return <div className={styles.sectionTitle}>{children}</div>
}

export function PageHeader({ title, sub }) {
  return (
    <div className={styles.pageHeader}>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
  )
}
