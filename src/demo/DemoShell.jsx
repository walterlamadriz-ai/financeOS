// src/demo/DemoShell.jsx
// Shell para modo demo — envuelve la app con DemoProvider
// Bridge: hace que useApp() en todos los módulos use los datos demo (sin IndexedDB)

import { useState, useContext } from 'react'
import { DemoProvider, useDemo, DemoContext } from './DemoContext.jsx'
import DemoBanner from './DemoBanner.jsx'
import Shell from '../components/layout/Shell.jsx'
import Toast from '../components/ui/Toast.jsx'
import Dashboard from '../pages/Dashboard/index.jsx'
import CashFlow from '../pages/CashFlow/index.jsx'
import { Income, Expenses, Budgets, Debts, Goals, Reports, Settings } from '../pages/index.jsx'
import Privacy from '../pages/legal/Privacy.jsx'
import Terms from '../pages/legal/Terms.jsx'
import License from '../pages/legal/License.jsx'
import Disclaimer from '../pages/legal/Disclaimer.jsx'
import Advisor from '../pages/Advisor/index.jsx'
import Subscriptions from '../pages/Subscriptions/index.jsx'
import Coach from '../pages/Coach/index.jsx'
import ImportCSV from '../pages/Import/index.jsx'
import { AppContext } from '../context/AppContext.jsx'

function renderPage(page) {
  switch (page) {
    case 'dashboard':  return <Dashboard />
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
    case 'advisor':       return <Advisor />
    case 'subscriptions': return <Subscriptions />
    case 'coach':         return <Coach />
    case 'import':        return <ImportCSV />
    default:              return <Dashboard />
  }
}

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

function DemoInner() {
  const [page, setPage] = useState('dashboard')
  return (
    <>
      <DemoBanner />
      <Shell page={page} setPage={setPage}>
        {renderPage(page)}
        <Toast />
      </Shell>
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
