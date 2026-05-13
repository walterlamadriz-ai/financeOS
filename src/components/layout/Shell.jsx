// src/components/layout/Shell.jsx

import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import s from './shell.module.css'

const NAV = [
  { sec: 'General',        items: [{ id: 'dashboard', ic: '◈', lb: 'Dashboard' }] },
  { sec: 'Transacciones',  items: [{ id: 'income', ic: '↑', lb: 'Ingresos' }, { id: 'expenses', ic: '↓', lb: 'Gastos' }] },
  { sec: 'Planificación',  items: [{ id: 'budgets', ic: '▤', lb: 'Presupuestos' }, { id: 'debts', ic: '⊖', lb: 'Deudas' }, { id: 'goals', ic: '◎', lb: 'Metas' }] },
  { sec: 'Análisis',       items: [{ id: 'cashflow', ic: '⟶', lb: 'Proyección' }, { id: 'reports', ic: '⊞', lb: 'Reportes' }, { id: 'settings', ic: '⊙', lb: 'Ajustes' }] },
]

export default function Shell({ page, setPage, children }) {
  const { settings, updateSettings } = useApp()
  const isDark = settings.theme === 'dark'

  function toggleTheme() {
    updateSettings({ ...settings, theme: isDark ? 'light' : 'dark' })
  }

  return (
    <div className={s.shell}>
      <nav className={s.sb}>
        <div className={s.logo}>
          <div className={s.logoName}>FinanceOS</div>
          <div className={s.logoSub}>v1.0 · personal</div>
        </div>

        {NAV.map(g => (
          <div key={g.sec}>
            <div className={s.sec}>{g.sec}</div>
            {g.items.map(it => (
              <div
                key={it.id}
                className={s.ni + (page === it.id ? ' ' + s.active : '')}
                onClick={() => setPage(it.id)}
              >
                <span className={s.ic}>{it.ic}</span>
                {it.lb}
              </div>
            ))}
          </div>
        ))}

        <div className={s.footer}>
          <button className={s.themeBtn} onClick={toggleTheme}>
            {isDark ? '☀ Claro' : '◑ Oscuro'}
          </button>
        </div>
      </nav>

      <div className={s.main}>
        <div className={s.topbar}>
          <span className={s.crumb}>{page}</span>
          <span className={s.topRight}>FinanceOS · {settings.currency || 'CLP'}</span>
        </div>
        <div className={s.content}>
          {children}
        </div>
      </div>
    </div>
  )
}
