import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import KPICards from './components/KPICards'
import MapView from './components/MapView'
import HotspotList from './components/HotspotList'
import TimeChart from './components/TimeChart'
import VehicleChart from './components/VehicleChart'
import ZoneDetailPanel from './components/ZoneDetailPanel'
import { getHotspotData } from './services/api'

export default function App() {
  const [data, setData] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHotspotData().then(result => {
      setData(result)
      setLoading(false);
    })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-white text-xl">
      Loading Bengaluru Traffic Intelligence...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="p-4 space-y-4">
        <KPICards summary={data.summary} />
        <div className="flex gap-4 h-[500px]">
          <div className="flex-1">
            <MapView
              hotspots={data.hotspots}
              onZoneClick={setSelectedZone}
              selectedZone={selectedZone}
            />
          </div>
          <div className="w-72">
            <HotspotList
              hotspots={data.hotspots}
              onZoneClick={setSelectedZone}
              selectedZone={selectedZone}
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <TimeChart timeSeries={data.time_series} />
          </div>
          <div className="w-80">
            <VehicleChart vehicles={data.vehicle_breakdown} />
          </div>
        </div>
      </div>
      {selectedZone && (
        <ZoneDetailPanel
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  )
}