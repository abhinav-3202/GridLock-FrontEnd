import { useEffect, useRef } from 'react'
import Map, { Marker, Popup } from 'react-map-gl/maplibre'

// Ensure maplibre's core structural CSS styles are loaded
import 'maplibre-gl/dist/maplibre-gl.css'

function getColor(score) {
  if (score >= 9) return '#ef4444' // Red
  if (score >= 7) return '#f97316' // Orange
  return '#eab308'                 // Yellow
}

function getRadius(count) {
  if (count >= 4000) return 28
  if (count >= 3000) return 22
  if (count >= 2000) return 16
  return 12
}

export default function MapView({ hotspots, onZoneClick, selectedZone }) {
  const mapRef = useRef(null)

  // Replaces Leaflet's custom FlyTo component by directly accessing the Map instance
  useEffect(() => {
    if (selectedZone && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedZone.lng, selectedZone.lat], // maplibre expects [lng, lat]
        zoom: 15,
        duration: 1200, // 1.2 seconds smooth transition
        essential: true
      })
    }
  }, [selectedZone])

  if (!hotspots) return null

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 h-full w-full relative">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 77.5946,
          latitude: 12.9716,
          zoom: 12
        }}
        // Using CartoDB's free crisp, clean light vector map tile configuration
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        
        {/* Render Hotspot Markers */}
        {hotspots.map((zone) => {
          const isSelected = selectedZone?.zone_id === zone.zone_id
          const radiusSize = getRadius(zone.violation_count)
          const zoneColor = getColor(zone.congestion_score)

          return (
            <Marker 
              key={zone.zone_id} 
              longitude={zone.lng} 
              latitude={zone.lat}
              anchor="center"
            >
              {/* Dynamic Vector Style Circles using Tailwind styling */}
              <div
                onClick={() => onZoneClick(zone)}
                className="rounded-full transition-all duration-200 cursor-pointer shadow-md"
                style={{
                  width: `${radiusSize * 2}px`,
                  height: `${radiusSize * 2}px`,
                  backgroundColor: zoneColor,
                  opacity: isSelected ? 0.95 : 0.6,
                  border: isSelected ? `3px solid #ffffff` : `1.5px solid #ffffff`,
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)'
                }}
              />
            </Marker>
          )
        })}

        {/* Selected Zone Vector Popup Details */}
        {selectedZone && (
          <Popup
            longitude={selectedZone.lng}
            latitude={selectedZone.lat}
            anchor="bottom"
            closeButton={false}
            offset={getRadius(selectedZone.violation_count)}
          >
            <div className="text-sm font-sans bg-white text-gray-900 p-1 min-w-[140px]">
              <p className="font-bold border-b border-gray-200 pb-1 mb-1 text-gray-900">
                {selectedZone.label}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Score:</span> {selectedZone.congestion_score}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Violations:</span> {selectedZone.violation_count.toLocaleString()}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Peak:</span> {selectedZone.peak_hour}
              </p>
            </div>
          </Popup>
        )}
        
      </Map>
    </div>
  )
}