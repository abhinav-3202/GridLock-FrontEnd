import { useState } from 'react'
import { ThemeProvider } from './ThemeContext'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'

function AppInner() {
  const [currentPage, setCurrentPage] = useState('landing')

  const handleNavigate = (page) => {
    setCurrentPage(page)
  }

  if (currentPage === 'landing') {
    return <LandingPage onNavigate={handleNavigate} />
  }

  return <Dashboard />
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}