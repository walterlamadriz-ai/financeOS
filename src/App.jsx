// src/App.jsx
import { useState, lazy, Suspense } from 'react'
import LicenseGate from './components/LicenseGate.jsx'
import { isLicenseActive } from './utils/licenseValidator.js'
import { AppProvider, useApp } from './context/AppContext.jsx'
import Shell from './components/layout/Shell.jsx'
import Toast from './components/ui/Toast.jsx'
import Onboarding from './components/Onboarding.jsx'
import Dashboard from './pages/Dashboard/index.jsx'
import CashFlow from './pages/CashFlow/index.jsx'
import Privacy from './pages/legal/Privacy.jsx'
import Terms from './pages/legal/Terms.jsx'
import License from './pages/legal/License.jsx'
import Disclaimer from './pages/legal/Disclaimer.jsx'
import { Income, Expenses, Budgets, Debts, Goals, Reports, Settings } from './pages/index.jsx'
import DemoShell from './demo/DemoShell.jsx'
const Advisor = lazy(() => import('./pages/Advisor/index.jsx'))
import Subscriptions from './pages/Subscriptions/index.jsx'
import Coach from './pages/Coach/index.jsx'
import APVPage from './pages/APV/index.jsx'
import ImportCSV from './pages/Import/index.jsx'
import Movements from './pages/Movements/index.jsx'

// ── Detectar modo demo ────────────────────────────────────────────────────────
function isDemoMode() {
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get('demo') === 'true'
  } catch {
    return false
  }
}

function Inner() {
  const [page, setPage] = useState('dashboard')
  const [licensed, setLicensed] = useState(isLicenseActive())

  // Demo bypass: si URL tiene ?demo=true no se pide licencia
  const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true')

  if (!licensed && !isDemo) {
    return <LicenseGate onActivate={() => setLicensed(true)} />
  }
  const { settings, loading } = useApp()

  function renderPage(page) {
    switch (page) {
      case 'dashboard':  return <Dashboard setPage={setPage}/>
      case 'income':     return <Income />
      case 'expenses':   return <Expenses />
      case 'budgets':    return <Budgets />
      case 'debts':      return <Debts />
      case 'goals':      return <Goals />
      case 'cashflow':   return <CashFlow />
      case 'reports':    return <Reports />
      case 'settings':   return <Settings />
      case 'privacy':    return <Privacy />
      case 'terms':      return <Terms />
      case 'license':    return <License />
      case 'disclaimer': return <Disclaimer />
      case 'advisor':    return <Suspense fallback={<div style={{padding:24,color:'var(--th)',fontFamily:'var(--mono)',fontSize:12}}>Cargando...</div>}><Advisor /></Suspense>
      case 'subscriptions': return <Subscriptions />
      case 'coach':         return <Coach />
      case 'apv':           return <APVPage />
      case 'movements': return <Movements setPage={setPage}/>
      case 'import':        return <ImportCSV />
      default:           return <Dashboard setPage={setPage}/>
    }
  }

  const showOnboarding = !loading && !settings.onboardingDone

  if (showOnboarding) {
    return <Onboarding onComplete={() => {}} />
  }

  return (
    <Shell page={page} setPage={setPage}>
      {renderPage(page)}
      <Toast />
    </Shell>
  )
}

export default function App() {
  // Si URL tiene ?demo=true, cargar DemoShell (sin AppProvider, sin IndexedDB)
  if (isDemoMode()) {
    return <DemoShell />
  }

  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  )
}
