// src/components/layout/Shell.jsx — Fase mobile nav

import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import s from './shell.module.css'
import { BackupStatusBadge } from '../backup/BackupManager.jsx'

const NAV = [
  { sec: 'Principal',    items: [{ id: 'dashboard', ic: '◈', lb: 'Dashboard' }] },
  { sec: 'Movimientos',  items: [
    { id: 'movements',     ic: '⊟', lb: 'Salidas del mes' },
    { id: 'income',        ic: '↑', lb: 'Ingresos' },
    { id: 'expenses',      ic: '↓', lb: 'Gastos' },
    { id: 'subscriptions', ic: '↻', lb: 'Suscripciones' },
    { id: 'import',        ic: '↑', lb: 'Importar movimientos' },
  ] },
  { sec: 'Planificación', items: [
    { id: 'budgets', ic: '▤', lb: 'Presupuestos' },
    { id: 'debts',   ic: '⊖', lb: 'Deudas' },
    { id: 'goals',   ic: '◎', lb: 'Metas' },
  ] },
  { sec: 'Análisis', items: [
    { id: 'coach',    ic: '◈', lb: 'Señales' },
    { id: 'reports',  ic: '⊞', lb: 'Reportes' },
    { id: 'cashflow', ic: '⟶', lb: 'Proyección' },
  ] },
  { sec: 'Pro', items: [
    { id: 'advisor',  ic: '◑', lb: 'Modo Asesor' },
    { id: 'settings', ic: '⊙', lb: 'Ajustes' },
  ] },
]

// Todas las secciones planas para historial
const ALL_ITEMS = NAV.flatMap(g => g.items)

// Etiqueta legible para la topbar
function pageLabel(id) {
  return ALL_ITEMS.find(it => it.id === id)?.lb || id
}

export default function Shell({ page, setPage, children }) {
  const { settings, updateSettings } = useApp()
  const isDark = settings.theme === 'dark'

  // ── Drawer móvil ────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef(null)

  // Cerrar drawer al hacer clic fuera
  useEffect(() => {
    function handleOutside(e) {
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [drawerOpen])

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  // ── Historial de navegación ──────────────────────────────────────────────────
  const [history, setHistory] = useState([])

  function navigate(id) {
    if (id !== page) {
      setHistory(h => [...h, page])
    }
    setPage(id)
    setDrawerOpen(false)
  }

  function goBack() {
    if (history.length > 0) {
      const prev = history[history.length - 1]
      setHistory(h => h.slice(0, -1))
      setPage(prev)
    } else {
      setPage('dashboard')
    }
  }

  // ── Tip de rotación — mostrar solo una vez ───────────────────────────────────
  const [showTip, setShowTip] = useState(() => {
    try { return !localStorage.getItem('fos_rotation_tip_seen') }
    catch { return true }
  })

  function dismissTip() {
    try { localStorage.setItem('fos_rotation_tip_seen', '1') } catch {}
    setShowTip(false)
  }

  function toggleTheme() {
    updateSettings({ ...settings, theme: isDark ? 'light' : 'dark' })
  }

  // ── Render del nav (reutilizado en sidebar y drawer) ─────────────────────────
  function NavItems({ onNavigate }) {
    return (
      <>
        {NAV.map(g => (
          <div key={g.sec}>
            <div className={s.sec}>{g.sec}</div>
            {g.items.map(it => (
              <div
                key={it.id}
                className={s.ni + (page === it.id ? ' ' + s.active : '')}
                onClick={() => onNavigate(it.id)}
              >
                <span className={s.ic}>{it.ic}</span>
                {it.lb}
              </div>
            ))}
          </div>
        ))}
      </>
    )
  }

  return (
    <div className={s.shell}>

      {/* ── SIDEBAR DESKTOP (oculto en móvil) ── */}
      <nav className={s.sb}>
        <div className={s.logo}>
          <div className={s.logoName}>FinanceOS</div>
          <div className={s.logoSub}>v1.2</div>
        </div>

        <NavItems onNavigate={navigate} />

        <div className={s.footer}>
          <button className={s.themeBtn} onClick={toggleTheme}>
            {isDark ? '☀ Claro' : '◑ Oscuro'}
          </button>
          <div className={s.legalLinks}>
            <span onClick={() => navigate('privacy')} className={s.legalLink}>Privacidad</span>
            <span onClick={() => navigate('terms')} className={s.legalLink}>Términos</span>
            <span onClick={() => navigate('disclaimer')} className={s.legalLink}>Aviso legal</span>
            <a href='https://financeos-landing-omega.vercel.app/docs/index.html' target='_blank' className={s.legalLink} style={{textDecoration:'none'}}>Docs</a>
          </div>
          <div className={s.appVersion}>
            FinanceOS v1.2 · MAXNOVA & LUCI Global LLC<br/>
            <span style={{opacity:.5}}>🔒 Sin servidor · Sin cuentas</span>
          </div>
          <div style={{marginTop:6}}><BackupStatusBadge compact /></div>
        </div>
      </nav>

      {/* ── OVERLAY del drawer (solo móvil) ── */}
      {drawerOpen && <div className={s.overlay} onClick={() => setDrawerOpen(false)} />}

      {/* ── DRAWER MÓVIL ── */}
      <nav ref={drawerRef} className={s.drawer + (drawerOpen ? ' ' + s.drawerOpen : '')}>
        <div className={s.drawerHeader}>
          <div className={s.logo} style={{border:'none', padding:0, margin:0}}>
            <div className={s.logoName}>FinanceOS</div>
            <div className={s.logoSub}>v1.2</div>
          </div>
          <button className={s.drawerClose} onClick={() => setDrawerOpen(false)} aria-label="Cerrar menú"><span style={{fontSize:18}}>☰</span><span style={{fontSize:10,fontFamily:"var(--mono)",display:"block",lineHeight:1,marginTop:2}}>Menú</span></button>
        </div>

        <div className={s.drawerNav}>
          <NavItems onNavigate={navigate} />
        </div>

        <div className={s.drawerFooter}>
          <button className={s.themeBtn} onClick={toggleTheme}>
            {isDark ? '☀ Claro' : '◑ Oscuro'}
          </button>
          <div style={{marginTop:8}}><BackupStatusBadge compact /></div>
        </div>
      </nav>

      {/* ── ÁREA PRINCIPAL ── */}
      <div className={s.main}>

        {/* Topbar móvil — botón ☰ + atrás + título */}
        <div className={s.topbar}>
          <div className={s.topLeft}>
            {/* Botón hamburguesa — solo móvil */}
            <button
              className={s.menuBtn}
              onClick={() => setDrawerOpen(true)} aria-label="Abrir menú"
            >
              <span style={{fontSize:18}}>☰</span><span style={{fontSize:10,fontFamily:"var(--mono)",display:"block",lineHeight:1,marginTop:2}}>Menú</span>
            </button>
            {/* Botón atrás — solo móvil, si no está en dashboard */}
            {page !== 'dashboard' && (
              <button className={s.backBtn} onClick={goBack} aria-label="Volver">
                ← Atrás
              </button>
            )}
          </div>
          <span className={s.crumb}>{pageLabel(page)}</span>
          <span className={s.topRight}>FinanceOS · {settings.currency || 'CLP'}</span>
        </div>

        {/* Tip de rotación — solo móvil, solo una vez */}
        {showTip && (
          <div className={s.rotationTip}>
            <span>💡 Tip: girá tu teléfono para ver el menú lateral, o usá el botón ☰</span>
            <button className={s.tipClose} onClick={dismissTip} aria-label="Cerrar tip">✕</button>
          </div>
        )}

        <div className={s.content}>
          {children}
        </div>
      </div>
    </div>
  )
}
