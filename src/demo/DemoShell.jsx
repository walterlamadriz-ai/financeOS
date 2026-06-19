// src/demo/DemoShell.jsx
// Shell para modo demo — envuelve la app con DemoProvider
// Bridge: hace que useApp() en todos los módulos use los datos demo (sin IndexedDB)

import { useState, useEffect, useContext, lazy, Suspense } from 'react'
import { DemoProvider, useDemo, DemoContext } from './DemoContext.jsx'
import DemoBanner from './DemoBanner.jsx'
import Shell from '../components/layout/Shell.jsx'
import Toast from '../components/ui/Toast.jsx'
import Dashboard from '../pages/Dashboard/index.jsx'
import CashFlow from '../pages/CashFlow/index.jsx'
import Income    from '../pages/Income/index.jsx'
import Budgets   from '../pages/Budgets/index.jsx'
import Debts     from '../pages/Debts/index.jsx'
import Goals     from '../pages/Goals/index.jsx'
import Reports   from '../pages/Reports/index.jsx'
import Settings  from '../pages/Settings/index.jsx'
import Privacy from '../pages/legal/Privacy.jsx'
import Terms from '../pages/legal/Terms.jsx'
import License from '../pages/legal/License.jsx'
import Disclaimer from '../pages/legal/Disclaimer.jsx'
import Subscriptions from '../pages/Subscriptions/index.jsx'
import Coach from '../pages/Coach/index.jsx'
import APVPage from '../pages/APV/index.jsx'
import ImportCSV from '../pages/Import/index.jsx'
import Movements from '../pages/Movements/index.jsx'
import { AppContext } from '../context/AppContext.jsx'

const Advisor = lazy(() => import('../pages/Advisor/index.jsx'))

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
    const t = setTimeout(() => setVisible(true), 3 * 60 * 1000)
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
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Estás viendo datos ficticios.</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)' }}>El tuyo es privado, es tuyo para siempre y cuesta $19.99 USD.</div>
      </div>
      <button
        onClick={() => window.open('https://financeospro.com/#pricing', '_blank')}
        style={{
          background: '#fff', color: '#0a5c3e', border: 'none',
          borderRadius: 8, padding: '9px 18px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
        }}
      >
        Obtener FinanceOS →
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
      case 'cashflow':      return <CashFlow />
      case 'reports':       return <Reports />
      case 'settings':      return <Settings />
      case 'privacy':       return <Privacy />
      case 'terms':         return <Terms />
      case 'license':       return <License />
      case 'disclaimer':    return <Disclaimer />
      case 'advisor':       return <Suspense fallback={<div style={{padding:24,color:'var(--th)',fontFamily:'var(--mono)',fontSize:12}}>Cargando...</div>}><Advisor /></Suspense>
      case 'subscriptions': return <Subscriptions />
      case 'coach':         return <Coach />
      case 'apv':           return <APVPage />
      case 'movements':     return <Movements setPage={setPage}/>
      case 'import':        return <ImportCSV />
      default:              return <Dashboard setPage={setPage}/>
    }
  }

  return (
    <>
      <DemoBanner />
      <Shell page={page} setPage={setPage}>
        {renderPage(page)}
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
