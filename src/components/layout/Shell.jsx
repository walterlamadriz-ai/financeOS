// src/components/layout/Shell.jsx — Fase mobile nav

import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import s from './shell.module.css'
import { BackupStatusBadge } from '../backup/BackupManager.jsx'

const NAV = [
  { sec: 'Principal',    items: [{ id: 'dashboard', ic: '◈', lb: 'Dashboard' }] },
  { sec: 'Movimientos',  items: [
    { id: 'income',    ic: '↑', lb: 'Ingresos' },
    { id: 'movements', ic: '↓', lb: 'Egresos' },
    { id: 'import',    ic: '⇪', lb: 'Importar' },
  ] },
  { sec: 'Planificación', items: [
    { id: 'budgets', ic: '▤', lb: 'Presupuestos' },
    { id: 'debts',   ic: '⊖', lb: 'Deudas' },
    { id: 'goals',   ic: '◎', lb: 'Metas' },
    { id: 'apv',     ic: '🇨🇱', lb: 'APV Chile', chileOnly: true },
    { id: 'deducciones', ic: '🧾', lb: 'Deducciones', countries: ['EC', 'PE'] },
  ] },
  { sec: 'Análisis', items: [
    { id: 'coach',    ic: '⚕', lb: 'Diagnóstico' },
    { id: 'reports',  ic: '⊞', lb: 'Reportes' },
    { id: 'cashflow', ic: '⟶', lb: 'Proyección' },
  ] },
  { sec: 'Pro', items: [
    { id: 'advisor',  ic: '◑', lb: 'Modo Asesor', proOnly: true },
  ] },
  { sec: 'Cuenta', items: [
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
  const isChile = (settings.country || 'CL') === 'CL'
  const isDark = settings.theme === 'dark'

  // ── Drawer móvil ────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef(null)

  // ── FAB speed-dial (Ingreso / Egreso) ────────────────────────────────────────
  const [fabOpen, setFabOpen] = useState(false)

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

  function toggleTheme() {
    updateSettings({ ...settings, theme: isDark ? 'light' : 'dark' })
  }

  // ── Render del nav (reutilizado en sidebar y drawer) ─────────────────────────
  const navCountry = (settings.country || 'CL').toUpperCase()
  function NavItems({ onNavigate }) {
    return (
      <>
        {NAV.map(g => (
          <div key={g.sec}>
            <div className={s.sec}>{g.sec}</div>
            {g.items.filter(it => !it.countries || it.countries.includes(navCountry)).map(it => (
              <div
                key={it.id}
                className={s.ni + (page === it.id ? ' ' + s.active : '')}
                onClick={() => onNavigate(it.id)}
              >
                <span className={s.ic}>{it.ic}</span>
                {it.lb}
                {it.proOnly && (
                  <span style={{ marginLeft:'auto', fontSize:8, fontFamily:'var(--mono)', background:'rgba(245,166,35,.18)', color:'var(--amb)', borderRadius:4, padding:'1px 5px', letterSpacing:'.5px', fontWeight:700 }}>PRO</span>
                )}
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
          <div className={s.logoSub}>v1.5</div>
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
            <a href='https://www.financeospro.com/docs/' target='_blank' className={s.legalLink} style={{textDecoration:'none'}}>Ayuda</a>
          </div>
          <div className={s.appVersion}>
            FinanceOS v1.5 · MAXNOVA & LUCI Global LLC<br/>
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
            <div className={s.logoSub}>v1.5</div>
          </div>
          <button className={s.drawerClose} onClick={() => setDrawerOpen(false)} aria-label="Cerrar menú"><span style={{fontSize:18}}>✕</span></button>
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

        <div className={s.content}>
          {children}
        </div>

        {/* FAB speed-dial — Ingreso / Egreso, solo móvil */}
        {fabOpen && <div className={s.fabBackdrop} onClick={() => setFabOpen(false)} />}
        <div className={s.fabWrap}>
          {fabOpen && (
            <div className={s.fabActions}>
              <button
                className={s.fabAction}
                onClick={() => { setFabOpen(false); navigate('income') }}
                aria-label="Agregar ingreso"
              >
                <span className={s.fabActionIc}>↑</span> Ingreso
              </button>
              <button
                className={s.fabAction}
                onClick={() => { setFabOpen(false); navigate('movements') }}
                aria-label="Agregar egreso"
              >
                <span className={s.fabActionIc}>↓</span> Egreso
              </button>
            </div>
          )}
          <button
            className={s.fab}
            onClick={() => setFabOpen(o => !o)}
            aria-label={fabOpen ? 'Cerrar acciones' : 'Agregar movimiento'}
            aria-expanded={fabOpen}
            style={fabOpen ? { transform: 'rotate(45deg)' } : undefined}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
