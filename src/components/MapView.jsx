import  { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'

function getColor(score) {
  if (score >= 9) return '#ef4444'
  if (score >= 7) return '#f97316'
  return '#eab308'
}

function getRadius(count) {
  if (count >= 4000) return 28
  if (count >= 3000) return 22
  if (count >= 2000) return 16
  return 12
}

function FlyToZone({ selectedZone }) {
  const map = useMap()
  useEffect(() => {
    if (selectedZone) {
      map.flyTo([selectedZone.lat, selectedZone.lng], 15, { duration: 1.2 })
    }
  }, [selectedZone, map])
  return null
}

export default function MapView({ hotspots, onZoneClick, selectedZone }) {
  if (!hotspots) return null

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700 h-full">
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToZone selectedZone={selectedZone} />

        {hotspots.map((zone) => (
          <CircleMarker
            key={zone.zone_id}
            center={[zone.lat, zone.lng]}
            radius={getRadius(zone.violation_count)}
            pathOptions={{
              color: getColor(zone.congestion_score),
              fillColor: getColor(zone.congestion_score),
              fillOpacity: selectedZone?.zone_id === zone.zone_id ? 0.95 : 0.6,
              weight: selectedZone?.zone_id === zone.zone_id ? 3 : 1.5,
            }}
            eventHandlers={{
              click: () => onZoneClick(zone),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{zone.label}</p>
                <p>Score: {zone.congestion_score}</p>
                <p>Violations: {zone.violation_count.toLocaleString()}</p>
                <p>Peak: {zone.peak_hour}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}