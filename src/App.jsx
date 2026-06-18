<<<<<<< HEAD
import { useState } from 'react'
import HeroPage from './pages/HeroPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  const [page, setPage] = useState('hero')

  return (
    <div className="min-h-screen">
      {page === 'hero' && <HeroPage onEnter={() => setPage('dashboard')} />}
      {page === 'dashboard' && <DashboardPage onBack={() => setPage('hero')} />}
=======
import { useState, useEffect } from 'react'
import { ThemeProvider, useTheme } from './ThemeContext'
import Navbar from './components/Navbar'
import KPICards from './components/KPICards'
import MapView from './components/MapView'
import HotspotList from './components/HotspotList'
import VisualsPage from './components/VisualsPage'
import ZoneDetailPanel from './components/ZoneDetailPanel'
import { getHotspotData } from './services/api'

function AppInner() {
  const { theme } = useTheme()
  const [data, setData] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('overview')

  useEffect(() => {
    getHotspotData().then(result => {
      setData(result)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh',
      background: theme.loadingBg,
      color: theme.loadingText,
      fontSize: '18px', fontWeight: 500,
      transition: 'background 0.3s ease, color 0.3s ease',
    }}>
      Loading Bengaluru Traffic Intelligence...
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.pageBg,
      color: theme.textPrimary,
      transition: 'background 0.3s ease, color 0.3s ease',
    }}>
      <Navbar activePage={activePage} onPageChange={setActivePage} />

      {/* ── OVERVIEW PAGE ── */}
      {activePage === 'overview' && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. Map — full width */}
          <div style={{ height: '500px', width: '100%' }}>
            <MapView
              hotspots={data.hotspots}
              onZoneClick={setSelectedZone}
              selectedZone={selectedZone}
            />
          </div>

          {/* 2. Top Hotspots — full width table */}
          <HotspotList
            hotspots={data.hotspots}
            onZoneClick={setSelectedZone}
            selectedZone={selectedZone}
          />

          {/* 3. KPI Stat Cards */}
          <KPICards summary={data.summary} />
        </div>
      )}

      {/* ── VISUALS PAGE ── */}
      {activePage === 'visuals' && (
        <VisualsPage data={data} />
      )}

      {/* Zone detail slide-over */}
      {selectedZone && (
        <ZoneDetailPanel
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
        />
      )}
>>>>>>> 25fe58c88e0cfa3fca9042685ed26569bb3d9be2
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}