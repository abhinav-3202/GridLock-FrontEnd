import { useState, useEffect } from 'react'
import { ThemeProvider, useTheme } from './ThemeContext'
import HeroPage from './pages/HeroPage'
import DashboardPage from './pages/DashboardPage'
import Navbar from './components/Navbar'
import KPICards from './components/KPICards'
import MapView from './components/MapView'
import HotspotList from './components/HotspotList'
import VisualsPage from './components/VisualsPage'
import ZoneDetailPanel from './components/ZoneDetailPanel'
import { getHotspotData } from './services/api'

function AppInner() {
  const { theme } = useTheme()
  const [page, setPage] = useState('hero') // Handled by your structural page state
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
      {/* 1. Show the Hero Landing Page */}
      {page === 'hero' && <HeroPage onEnter={() => setPage('dashboard')} />}

      {/* 2. Show the Main Dashboard Application when entered */}
      {page === 'dashboard' && (
        <>
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
        </>
      )}
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