import { useEffect, useRef, useState, useMemo } from 'react'
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import MapViewSelector from './MapViewSelector'

/* ═══════════════════════════════════════════════════════════
   HOTSPOT MARKER HELPERS  (unchanged)
═══════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════
   BENGALURU ROAD CORRIDOR WAYPOINTS
   ─────────────────────────────────────────────────────────
   Each entry is keyed by zone_id (matching mockData).
   Roads are arrays of [lng, lat] waypoints tracing actual
   Bengaluru arterials visible in OSM / Google Maps.

   Z001 – Coles Road, Indiranagar (12.9944, 77.6156)
     - Old Airport Road (diagonal NW→SE arterial)
     - 100ft Road / CMH Road (E-W corridor)
     - Indiranagar 12th Main (N-S)

   Z002 – MBT Road / Old Madras Road, KR Pura (13.0082, 77.6933)
     - Old Madras Road / NH 75 (major E-W arterial)
     - KR Pura Bridge connector (N-S)
     - Side arterial along ring road

   Z003 – Shivajinagar Bus Stand (12.9851, 77.6010)
     - MG Road (E-W CBD arterial)
     - Queens Road (N-S)
     - Residency Road (E-W parallel)

   Z004 – Silk Board Junction (12.9174, 77.6230)
     - Hosur Road / NH 44 (major N-S arterial)
     - Outer Ring Road (E-W, Bengaluru's busiest ring)
     - Bannerghatta Road connector

   Z005 – Koramangala 6th Block (12.9352, 77.6245)
     - 80ft Road (N-S spine of Koramangala)
     - Inner Ring Road (E-W)
     - Koramangala Main Road diagonal
═══════════════════════════════════════════════════════════ */

const HOTSPOT_ROADS = {
  Z001: [
    // Old Airport Road – NW to SE through Indiranagar
    [[77.598,12.988],[77.604,12.990],[77.610,12.992],[77.616,12.994],[77.622,12.997],[77.628,13.000],[77.634,13.003]],
    // 100ft Road (CMH Road) – E-W
    [[77.600,12.978],[77.607,12.978],[77.614,12.978],[77.620,12.977],[77.628,12.976]],
    // Indiranagar 12th Main – N-S
    [[77.616,12.968],[77.616,12.975],[77.616,12.982],[77.616,12.990],[77.616,12.998]],
    // Double Road connector
    [[77.605,12.983],[77.610,12.986],[77.616,12.989],[77.621,12.992]],
  ],
  Z002: [
    // Old Madras Road / NH 75 – W to E (long arterial)
    [[77.660,13.008],[77.670,13.008],[77.680,13.008],[77.693,13.008],[77.704,13.007],[77.716,13.006],[77.727,13.005]],
    // KR Pura Bridge Road – N-S
    [[77.693,12.996],[77.693,13.002],[77.693,13.008],[77.693,13.014],[77.694,13.021],[77.694,13.027]],
    // Banaswadi Road parallel
    [[77.676,13.014],[77.684,13.013],[77.693,13.012],[77.702,13.011]],
  ],
  Z003: [
    // MG Road – W to E
    [[77.574,12.975],[77.582,12.975],[77.591,12.975],[77.601,12.974],[77.610,12.974],[77.619,12.973]],
    // Queens Road – N-S
    [[77.601,12.962],[77.601,12.968],[77.601,12.975],[77.601,12.982],[77.601,12.990]],
    // Residency Road – E-W
    [[77.580,12.970],[77.588,12.970],[77.597,12.971],[77.607,12.972],[77.616,12.972]],
    // St Marks / Brigade Road connector
    [[77.594,12.974],[77.598,12.977],[77.601,12.981],[77.605,12.985]],
  ],
  Z004: [
    // Hosur Road / NH 44 – N to S (very busy)
    [[77.623,12.942],[77.623,12.935],[77.623,12.927],[77.623,12.917],[77.623,12.907],[77.622,12.897],[77.621,12.888]],
    // Outer Ring Road – W to E (Bengaluru's busiest ring)
    [[77.592,12.917],[77.602,12.917],[77.612,12.917],[77.623,12.917],[77.634,12.918],[77.645,12.919],[77.657,12.920],[77.668,12.921]],
    // Bannerghatta Road connector  
    [[77.623,12.917],[77.619,12.910],[77.615,12.903],[77.611,12.896]],
    // BTM Layout connector
    [[77.614,12.920],[77.618,12.919],[77.623,12.918],[77.629,12.919]],
  ],
  Z005: [
    // 80ft Road (Koramangala main spine) – N to S
    [[77.624,12.947],[77.624,12.940],[77.624,12.933],[77.624,12.926],[77.624,12.919],[77.624,12.912]],
    // Inner Ring Road – W to E
    [[77.604,12.935],[77.612,12.935],[77.621,12.935],[77.630,12.935],[77.640,12.934],[77.650,12.933]],
    // Koramangala 1st Main diagonal
    [[77.616,12.941],[77.620,12.938],[77.625,12.935],[77.630,12.932],[77.634,12.928]],
    // 60ft Road connector
    [[77.618,12.928],[77.622,12.930],[77.627,12.933],[77.631,12.937]],
  ],
}

/* ═══════════════════════════════════════════════════════════
   SEEDED LCG — deterministic so useMemo stays stable across
   re-renders without producing different random values.
═══════════════════════════════════════════════════════════ */

function seededRandom(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = (s ^ (s >>> 16)) >>> 0
    return s / 0xffffffff
  }
}

/* ═══════════════════════════════════════════════════════════
   ROAD-FOLLOWING POINT GENERATION
   ─────────────────────────────────────────────────────────
   Algorithm:
   1. For each hotspot, look up its road corridors.
   2. For each road segment (polyline of waypoints):
      a. Interpolate N points evenly along the polyline arc.
      b. Apply tiny seeded jitter (±20m) so the line looks
         like traffic flow rather than a perfect vector.
      c. Weight = baseWeight × Gaussian(distance from hotspot)
         so the heat tapers naturally away from the junction.
   3. Add the exact hotspot centre at full weight.

   Point count per road scales with congestion score so
   critical zones produce denser, more prominent corridors.

   Total points: ~5 zones × 4 roads × 25-45 pts ≈ 600-900
   — well within smooth MapLibre performance territory.
═══════════════════════════════════════════════════════════ */

function posOnPolyline(waypoints, t) {
  /* Return [lng, lat] at fractional arc-length t ∈ [0,1]. */
  if (waypoints.length === 1) return waypoints[0]

  let total = 0
  const segs = []
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i+1][0] - waypoints[i][0]
    const dy = waypoints[i+1][1] - waypoints[i][1]
    const len = Math.sqrt(dx*dx + dy*dy)
    segs.push(len)
    total += len
  }

  let target = t * total
  let cum = 0
  for (let i = 0; i < segs.length; i++) {
    if (cum + segs[i] >= target || i === segs.length - 1) {
      const localT = segs[i] > 0 ? Math.min((target - cum) / segs[i], 1) : 0
      return [
        waypoints[i][0] + (waypoints[i+1][0] - waypoints[i][0]) * localT,
        waypoints[i][1] + (waypoints[i+1][1] - waypoints[i][1]) * localT,
      ]
    }
    cum += segs[i]
  }
  return waypoints[waypoints.length - 1]
}

function generateRoadHeatPoints(hotspots) {
  const features = []

  hotspots.forEach((zone, zoneIdx) => {
    const baseW  = zone.congestion_score / 10      // 0.75 – 0.94
    const roads  = HOTSPOT_ROADS[zone.zone_id]
    const rand   = seededRandom(zoneIdx * 7919 + 31337)

    // Attenuation sigma: higher-score zones spread heat further
    const sigma  = 0.006 + baseW * 0.010            // 0.0135 – 0.0154°

    // Points per road segment scales with severity
    const nPts   = Math.round(20 + baseW * 25)      // 25 – 44 pts/road

    // Jitter: ±0.0002° ≈ ±22 m — keeps points on road, not in buildings
    const jitter = 0.00018

    /* ── Real junction centre at full weight ── */
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [zone.lng, zone.lat] },
      properties: { weight: baseW },
    })

    if (!roads) return

    roads.forEach(waypoints => {
      for (let k = 0; k < nPts; k++) {
        const t = k / Math.max(nPts - 1, 1)
        const [lng, lat] = posOnPolyline(waypoints, t)

        /* Distance from hotspot junction (degrees, approx) */
        const dLat = lat  - zone.lat
        const dLng = lng  - zone.lng
        const d2   = dLat*dLat + dLng*dLng
        const distW = Math.exp(-d2 / (2 * sigma * sigma))

        /* Road weight: min 25% at far end so corridors stay visible */
        const w = baseW * (0.25 + 0.75 * distW)

        /* Deterministic sub-road jitter */
        const jLng = lng + (rand() - 0.5) * jitter
        const jLat = lat + (rand() - 0.5) * jitter

        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [jLng, jLat] },
          properties: { weight: Math.min(w, 1) },
        })
      }
    })
  })

  return { type: 'FeatureCollection', features }
}

/* ═══════════════════════════════════════════════════════════
   MAPLIBRE HEATMAP LAYER
   ─────────────────────────────────────────────────────────
   KEY FIXES vs previous version:

   1. heatmap-intensity was 2.5 at z9 → saturated entire city red.
      Now 0.25 at z9 → city overview stays green/yellow; only
      genuine multi-corridor overlap reaches orange/red.

   2. Color ramp re-anchored: green spans 0.08–0.45 of density,
      yellow 0.45–0.62, orange 0.62–0.78, red only ≥ 0.82.
      This matches the "mostly green city, red only at peaks"
      requirement exactly.

   3. Radius at low zoom enlarged so sparse road corridors still
      form a continuous gradient rather than isolated dots.
      Radius shrinks at high zoom to reveal road-level detail.
═══════════════════════════════════════════════════════════ */

const HEATMAP_LAYER = {
  id:     'heatmap-layer',
  type:   'heatmap',
  source: 'heatmap-source',
  paint: {

    /* Weight: read pre-computed road-attenuated weight */
    'heatmap-weight': [
      'interpolate', ['linear'], ['get', 'weight'],
      0, 0,
      1, 1,
    ],

    /* ── THE CRITICAL FIX ──────────────────────────────────
       Previous: 2.5 at z9 → all overlapping kernels saturate
                 the entire city to density ≈ 1.0 → all red.
       Now:      0.25 at z9 → density reaches 0.4-0.6 at road
                 corridors (green→yellow) and 0.6-0.8 at major
                 junctions (yellow→orange), red only at the
                 3-4 most critical points where score ≥ 9.
    ──────────────────────────────────────────────────────── */
    'heatmap-intensity': [
      'interpolate', ['linear'], ['zoom'],
      9,  0.25,
      10, 0.35,
      11, 0.50,
      12, 0.70,
      13, 0.90,
      14, 1.10,
      15, 1.40,
      16, 1.80,
      17, 2.20,
    ],

    /* ── COLOR RAMP — Green (low) → Yellow → Orange → Red (severe)
       Density thresholds are intentionally shifted RIGHT so most
       of the city renders green; red is rare and meaningful.    */
    'heatmap-color': [
      'interpolate', ['linear'],
      ['heatmap-density'],
      0.00, 'rgba(0,0,0,0)',           // fully transparent — no data
      0.04, 'rgba(30,180,30,0)',       // still transparent (avoid ghost tint)
      0.08, 'rgba(30,200,60,0.30)',    // very faint green edge
      0.18, 'rgba(50,210,70,0.55)',    // light green — free-flowing traffic
      0.32, 'rgba(90,210,50,0.68)',    // green — normal city background
      0.45, 'rgba(190,220,20,0.76)',   // yellow-green — mild congestion
      0.56, 'rgba(255,210,0,0.82)',    // yellow — moderate congestion
      0.66, 'rgba(255,160,0,0.87)',    // amber — heavy congestion
      0.76, 'rgba(255,80,0,0.91)',     // orange-red — high congestion
      0.82, 'rgba(230,30,0,0.94)',     // red — severe congestion
      0.90, 'rgba(200,0,0,0.97)',      // deep red — critical
      1.00, 'rgba(160,0,0,1.0)',       // dark red — absolute peak
    ],

    /* Radius: wide at low zoom (corridors merge into smooth field),
       narrow at high zoom (precise road-level detail).           */
    'heatmap-radius': [
      'interpolate', ['linear'], ['zoom'],
      9,  65,
      10, 52,
      11, 40,
      12, 30,
      13, 22,
      14, 16,
      15, 12,
      16,  9,
      17,  7,
    ],

    /* Opacity: near-full across all zooms for strong visual impact */
    'heatmap-opacity': [
      'interpolate', ['linear'], ['zoom'],
      9,  0.88,
      12, 0.90,
      15, 0.86,
      17, 0.78,
    ],
  },
}

/* ═══════════════════════════════════════════════════════════
   HEATMAP LEGEND — updated to match new Green→Red ramp
═══════════════════════════════════════════════════════════ */

function HeatmapLegend() {
  return (
    <div style={{
      position: 'absolute', bottom: '12px', left: '12px', zIndex: 10,
      background: 'rgba(8,14,28,0.86)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '12px',
      padding: '12px 16px',
      minWidth: '175px',
    }}>
      <p style={{
        color: '#94a3b8', fontSize: '10px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px',
      }}>
        Traffic Congestion
      </p>

      {/* Gradient bar — Green→Yellow→Orange→Red */}
      <div style={{
        height: '10px', borderRadius: '5px', marginBottom: '7px',
        background: 'linear-gradient(to right, rgba(30,200,60,0.9), rgba(190,220,20,0.95), rgba(255,210,0,1), rgba(255,120,0,1), rgba(230,30,0,1), rgb(160,0,0))',
        boxShadow: '0 0 10px rgba(239,68,68,0.35)',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ color: '#4ade80', fontSize: '10px', fontWeight: 600 }}>Free</span>
        <span style={{ color: '#facc15', fontSize: '10px', fontWeight: 600 }}>Moderate</span>
        <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: 600 }}>Severe</span>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:'rgba(30,200,60,0.85)', flexShrink:0 }} />
          <span style={{ color:'#6b7280', fontSize:'10px' }}>Green — low congestion</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:'rgba(255,200,0,1)', flexShrink:0 }} />
          <span style={{ color:'#6b7280', fontSize:'10px' }}>Yellow — moderate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:'rgba(255,100,0,1)', flexShrink:0 }} />
          <span style={{ color:'#6b7280', fontSize:'10px' }}>Orange — heavy traffic</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:'rgba(200,0,0,1)', flexShrink:0 }} />
          <span style={{ color:'#6b7280', fontSize:'10px' }}>Red — severe congestion</span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT — MapView
═══════════════════════════════════════════════════════════ */

export default function MapView({ hotspots, onZoneClick, selectedZone }) {
  const mapRef                = useRef(null)
  const [mapView, setMapView] = useState('hotspots')

  /* Build road-following GeoJSON only when hotspots list changes.
     ~700 features — generated in < 2 ms, never repeated.       */
  const heatmapGeoJSON = useMemo(() => {
    if (!hotspots || hotspots.length === 0) return null
    return generateRoadHeatPoints(hotspots)
  }, [hotspots])

  /* Fly to selected zone on click (hotspot mode) */
  useEffect(() => {
    if (selectedZone && mapRef.current) {
      mapRef.current.flyTo({
        center:    [selectedZone.lng, selectedZone.lat],
        zoom:      15,
        duration:  1200,
        essential: true,
      })
    }
  }, [selectedZone])

  if (!hotspots) return null

  return (
    <div style={{
      borderRadius: '12px',
      overflow:     'hidden',
      border:       '1px solid #e2e8f0',
      height:       '100%',
      width:        '100%',
      position:     'relative',
    }}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 77.5946, latitude: 12.9716, zoom: 12 }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        {/* ── HEATMAP MODE ─────────────────────────────────── */}
        {mapView === 'heatmap' && heatmapGeoJSON && (
          <Source id="heatmap-source" type="geojson" data={heatmapGeoJSON}>
            <Layer {...HEATMAP_LAYER} />
          </Source>
        )}

        {/* ── HOTSPOT MARKERS (unchanged) ──────────────────── */}
        {mapView === 'hotspots' && hotspots.map((zone) => {
          const isSelected = selectedZone?.zone_id === zone.zone_id
          const radiusSize = getRadius(zone.violation_count)
          const zoneColor  = getColor(zone.congestion_score)
          return (
            <Marker key={zone.zone_id} longitude={zone.lng} latitude={zone.lat} anchor="center">
              <div
                onClick={() => onZoneClick(zone)}
                style={{
                  width:           `${radiusSize * 2}px`,
                  height:          `${radiusSize * 2}px`,
                  borderRadius:    '50%',
                  backgroundColor: zoneColor,
                  opacity:         isSelected ? 0.95 : 0.65,
                  border:          isSelected ? '3px solid #ffffff' : '1.5px solid #ffffff',
                  transform:       isSelected ? 'scale(1.18)' : 'scale(1)',
                  cursor:          'pointer',
                  boxShadow:       `0 2px 8px ${zoneColor}80`,
                  transition:      'transform 0.2s ease, opacity 0.2s ease',
                }}
              />
            </Marker>
          )
        })}

        {/* ── POPUP (both modes) ───────────────────────────── */}
        {selectedZone && (
          <Popup
            longitude={selectedZone.lng}
            latitude={selectedZone.lat}
            anchor="bottom"
            closeButton={false}
            offset={getRadius(selectedZone.violation_count)}
          >
            <div style={{
              fontSize: '13px', fontFamily: 'sans-serif',
              background: '#ffffff', color: '#111827',
              padding: '8px 10px', minWidth: '155px', borderRadius: '6px',
            }}>
              <p style={{ fontWeight:700, borderBottom:'1px solid #e5e7eb', paddingBottom:'4px', marginBottom:'4px', color:'#111827' }}>
                {selectedZone.label}
              </p>
              <p style={{ color:'#4b5563', marginBottom:'2px' }}>
                <span style={{ fontWeight:600, color:'#1f2937' }}>Score: </span>{selectedZone.congestion_score}
              </p>
              <p style={{ color:'#4b5563', marginBottom:'2px' }}>
                <span style={{ fontWeight:600, color:'#1f2937' }}>Violations: </span>{selectedZone.violation_count.toLocaleString()}
              </p>
              <p style={{ color:'#4b5563' }}>
                <span style={{ fontWeight:600, color:'#1f2937' }}>Peak: </span>{selectedZone.peak_hour}
              </p>
            </div>
          </Popup>
        )}
      </Map>

      {/* ── MAP VIEW SELECTOR — top-right ────────────────── */}
      <div style={{ position:'absolute', top:'12px', right:'12px', zIndex:20 }}>
        <MapViewSelector mapView={mapView} onMapViewChange={setMapView} />
      </div>

      {/* ── HEATMAP LEGEND — bottom-left ─────────────────── */}
      {mapView === 'heatmap' && <HeatmapLegend />}
    </div>
  )
}