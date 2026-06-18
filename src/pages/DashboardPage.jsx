import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import KPICards from '../components/KPICards'
import MapView from '../components/MapView'
import FilterBar from '../components/FilterBar'
import HotspotTable from '../components/HotspotTable'
import TimeChart from '../components/TimeChart'
import VehicleChart from '../components/VehicleChart'
import ZoneDetailPanel from '../components/ZoneDetailPanel'
import { getHotspotData } from '../services/api'

export default function DashboardPage({ onBack }) {
  const [data, setData] = useState(null)
  const [filteredHotspots, setFilteredHotspots] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('map') // 'map' or 'analytics'
  const [filters, setFilters] = useState({ timeFrame: '', severity: 'all', count: 50 })

  useEffect(() => {
    getHotspotData().then(result => {
      setData(result)
      setFilteredHotspots(result.hotspots)
      setLoading(false)
    })
  }, [])

  function handleFilterChange(newFilters) {
    setFilters(newFilters)
    if (!data) return

    let result = [...data.hotspots]

    if (newFilters.severity === 'critical') result = result.filter(z => z.congestion_score >= 9)
    else if (newFilters.severity === 'high') result = result.filter(z => z.congestion_score >= 7 && z.congestion_score < 9)
    else if (newFilters.severity === 'moderate') result = result.filter(z => z.congestion_score < 7)

    result = result.slice(0, newFilters.count)
    setFilteredHotspots(result)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: '#f0faf8' }}>
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl mx-auto mb-4 animate-pulse"
          style={{ background: 'linear-gradient(135deg, #0d9488, #06b6d4)' }}
        >
          P
        </div>
        <p style={{ color: '#0f4c3a', fontWeight: 600 }}>Loading Bengaluru data...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#f8fffe' }}>
      <Navbar onBack={onBack} showBack={true} />

      <div className="px-6 py-5 space-y-5 max-w-screen-2xl mx-auto">

        {/* KPI Cards */}
        <KPICards summary={data.summary} />

        {/* View toggle */}
        <div className="flex items-center justify-between">
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: '1px solid #c9ebe4', background: 'white' }}
          >
            {[
              { key: 'map', label: '🗺️ Map View' },
              { key: 'analytics', label: '📊 View Analytics' }
            ].map(v => (
              <button
                key={v.key}
                onClick={() => setActiveView(v.key)}
                className="px-5 py-2.5 text-sm font-semibold transition-all duration-200"
                style={{
                  background: activeView === v.key
                    ? 'linear-gradient(135deg, #0d9488, #06b6d4)'
                    : 'transparent',
                  color: activeView === v.key ? 'white' : '#4a7c6f',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Filter bar — only in map view */}
          {activeView === 'map' && (
            <FilterBar onFilterChange={handleFilterChange} />
          )}
        </div>

        {/* MAP VIEW */}
        {activeView === 'map' && (
          <div className="space-y-5">
            {/* Map — 75vh */}
            <div style={{ height: '75vh' }}>
              <MapView
                hotspots={filteredHotspots}
                onZoneClick={setSelectedZone}
                selectedZone={selectedZone}
              />
            </div>

            {/* Hotspot table below map */}
            <HotspotTable
              hotspots={filteredHotspots}
              onZoneClick={setSelectedZone}
            />
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {activeView === 'analytics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-5">
              {/* Time chart — wider */}
              <div className="col-span-2">
                <TimeChart timeSeries={data.time_series} />
              </div>
              {/* Vehicle chart */}
              <div>
                <VehicleChart vehicles={data.vehicle_breakdown} />
              </div>
            </div>

            {/* Full hotspot table */}
            <HotspotTable
              hotspots={data.hotspots}
              onZoneClick={(zone) => {
                setSelectedZone(zone)
                setActiveView('map')
              }}
            />
          </div>
        )}

      </div>

      {/* Zone detail side panel */}
      {selectedZone && (
        <ZoneDetailPanel
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  )
}