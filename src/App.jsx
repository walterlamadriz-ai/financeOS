// src/App.jsx
import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import Shell from './components/layout/Shell.jsx'
import Toast from './components/ui/Toast.jsx'
import Onboarding from './components/Onboarding.jsx'
import Dashboard from './pages/Dashboard/index.jsx'
import CashFlow from './pages/CashFlow/index.jsx'
import { Income, Expenses, Budgets, Debts, Goals, Reports, Settings } from './pages/index.jsx'

function renderPage(page) {
  switch (page) {
    case 'dashboard': return <Dashboard />
    case 'income':    return <Income />
    case 'expenses':  return <Expenses />
    case 'budgets':   return <Budgets />
    case 'debts':     return <Debts />
    case 'goals':     return <Goals />
    case 'cashflow':  return <CashFlow />
    case 'reports':   return <Reports />
    case 'settings':  return <Settings />
    default:          return <Dashboard />
  }
}

function Inner() {
  const [page, setPage] = useState('dashboard')
  const { settings, loading } = useApp()

  // Mostrar onboarding solo si no se ha completado aún
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
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  )
}

