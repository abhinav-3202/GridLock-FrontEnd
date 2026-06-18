import { useState, useEffect } from 'react'
import { useTheme } from '../ThemeContext'
import Navbar from '../components/Navbar'
import KPICards from '../components/KPICards'
import MapView from '../components/MapView'
import MapFilterPanel from '../components/MapFilterPanel'
import HotspotList from '../components/HotspotList'
import VisualsPage from '../components/VisualsPage'
import ZoneDetailPanel from '../components/ZoneDetailPanel'
import { getHotspotData } from '../services/api'

export default function Dashboard() {
  const { theme } = useTheme()
  const [data, setData] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('overview')
  const [filteredHotspots, setFilteredHotspots] = useState(null)

  useEffect(() => {
    getHotspotData().then(result => {
      setData(result)
      setFilteredHotspots(result.hotspots)
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

          {/* ── Map row: 25% filter panel + 75% map ── */}
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            {/* Left: Filter Panel — 25% */}
            <div style={{
              flex: '0 0 min(280px, 25%)',
              minWidth: '220px',
            }}>
              <MapFilterPanel
                hotspots={data.hotspots}
                onFilteredChange={setFilteredHotspots}
              />
            </div>

            {/* Right: Map — 75% */}
            <div style={{
              flex: '1 1 0',
              minWidth: '300px',
              height: '520px',
            }}>
              <MapView
                hotspots={filteredHotspots ?? data.hotspots}
                onZoneClick={setSelectedZone}
                selectedZone={selectedZone}
              />
            </div>
          </div>

          {/* 2. Top Hotspots — full width table (always shows full list) */}
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
    </div>
  )
}
