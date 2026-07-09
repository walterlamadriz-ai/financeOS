// src/demo/DemoShell.jsx
// Shell para modo demo — envuelve la app con DemoProvider
// Bridge: hace que useApp() en todos los módulos use los datos demo (sin IndexedDB)

import { useState, useEffect, lazy, Suspense } from 'react'
import { DemoProvider, useDemo, DemoContext } from './DemoContext.jsx'
import DemoBanner from './DemoBanner.jsx'
import Shell from '../components/layout/Shell.jsx'
import Toast from '../components/ui/Toast.jsx'
import { AppContext } from '../context/AppContext.jsx'

// Páginas lazy — mismo patrón que App.jsx para coherencia de chunks
const Dashboard     = lazy(() => import('../pages/Dashboard/index.jsx'))
const CashFlow      = lazy(() => import('../pages/CashFlow/index.jsx'))
const Income        = lazy(() => import('../pages/Income/index.jsx'))
const Budgets       = lazy(() => import('../pages/Budgets/index.jsx'))
const Debts         = lazy(() => import('../pages/Debts/index.jsx'))
const Goals         = lazy(() => import('../pages/Goals/index.jsx'))
const Projects      = lazy(() => import('../pages/Projects/index.jsx'))
const NetWorth      = lazy(() => import('../pages/NetWorth/index.jsx'))
const Reports       = lazy(() => import('../pages/Reports/index.jsx'))
const Settings      = lazy(() => import('../pages/Settings/index.jsx'))
const Advisor       = lazy(() => import('../pages/Advisor/index.jsx'))
const Subscriptions = lazy(() => import('../pages/Subscriptions/index.jsx'))
const Coach         = lazy(() => import('../pages/Coach/index.jsx'))
const APVPage       = lazy(() => import('../pages/APV/index.jsx'))
const Deducciones   = lazy(() => import('../pages/Deducciones/index.jsx'))
const AhorroFiscal  = lazy(() => import('../pages/AhorroFiscal/index.jsx'))
const Inflacion     = lazy(() => import('../pages/Inflacion/index.jsx'))
const Multimoneda   = lazy(() => import('../pages/Multimoneda/index.jsx'))
const ImportCSV     = lazy(() => import('../pages/Import/index.jsx'))
const Movements     = lazy(() => import('../pages/Movements/index.jsx'))
const Privacy       = lazy(() => import('../pages/legal/Privacy.jsx'))
const Terms         = lazy(() => import('../pages/legal/Terms.jsx'))
const License       = lazy(() => import('../pages/legal/License.jsx'))
const Disclaimer    = lazy(() => import('../pages/legal/Disclaimer.jsx'))

const PageLoader = () => (
  <div style={{ padding: 24, color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 12 }}>
    Cargando...
  </div>
)

// Bridge: inyecta el valor de DemoContext en AppContext
// → todos los módulos que llaman useApp() reciben los datos demo
function DemoBridge({ children }) {
  const demoValue = useDemo()
  return (
    <AppContext.Provider value={demoValue}>
      {children}
    </AppContext.Provider>
  )
}

// CTA persistente al pie — aparece después de 3 min de uso demo
function DemoBottomCTA() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem('fos_demo_cta_dismissed') } catch { return false }
  })

  useEffect(() => {
    if (dismissed) return
    const t = setTimeout(() => setVisible(true), 75 * 1000)
    return () => clearTimeout(t)
  }, [dismissed])

  if (!visible || dismissed) return null

  function dismiss() {
    try { localStorage.setItem('fos_demo_cta_dismissed', '1') } catch {}
    setDismissed(true)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
      background: 'linear-gradient(135deg, #0a5c3e, #0d7244)',
      color: '#fff',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 -4px 20px rgba(0,0,0,.2)',
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>¿Te convence lo que ves?</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)' }}>El tuyo es privado, local y sin suscripción mensual — pago único de US$14.99.</div>
      </div>
      <button
        onClick={() => window.open('https://financeospro.com/#pricing', '_blank')}
        style={{
          background: '#fff', color: '#0a5c3e', border: 'none',
          borderRadius: 8, padding: '9px 18px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
        }}
      >
        Comprar FinanceOS →
      </button>
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        style={{
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,.6)',
          fontSize: 18, cursor: 'pointer', lineHeight: 1, flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}

function DemoInner() {
  const [page, setPage] = useState('dashboard')

  function renderPage(page) {
    switch (page) {
      case 'dashboard':     return <Dashboard setPage={setPage}/>
      case 'income':        return <Income />
      case 'budgets':       return <Budgets />
      case 'debts':         return <Debts />
      case 'goals':         return <Goals />
      case 'projects':      return <Projects />
      case 'networth':      return <NetWorth />
      case 'cashflow':      return <CashFlow setPage={setPage}/>
      case 'reports':       return <Reports />
      case 'settings':      return <Settings />
      case 'privacy':       return <Privacy />
      case 'terms':         return <Terms />
      case 'license':       return <License />
      case 'disclaimer':    return <Disclaimer />
      case 'advisor':       return <Advisor />
      case 'subscriptions': return <Subscriptions />
      case 'coach':         return <Coach />
      case 'apv':           return <APVPage />
      case 'deducciones':   return <Deducciones />
      case 'ahorrofiscal':  return <AhorroFiscal />
      case 'inflacion':     return <Inflacion />
      case 'multimoneda':   return <Multimoneda />
      case 'movements':     return <Movements setPage={setPage}/>
      case 'import':        return <ImportCSV />
      default:              return <Dashboard setPage={setPage}/>
    }
  }

  return (
    <>
      <DemoBanner />
      <Shell page={page} setPage={setPage}>
        <Suspense fallback={<PageLoader />}>
          {renderPage(page)}
        </Suspense>
        <Toast />
      </Shell>
      <DemoBottomCTA />
    </>
  )
}

export default function DemoShell() {
  return (
    <DemoProvider>
      <DemoBridge>
        <DemoInner />
      </DemoBridge>
    </DemoProvider>
  )
}
