// import React from 'react'

function getScoreColor(score) {
  if (score >= 9) return 'text-red-400'
  if (score >= 7) return 'text-orange-400'
  return 'text-yellow-400'
}

function getGapBadge(gap) {
  if (gap === 'HIGH') return 'bg-red-900 text-red-300'
  if (gap === 'MEDIUM') return 'bg-orange-900 text-orange-300'
  return 'bg-yellow-900 text-yellow-300'
}

export default function HotspotList({ hotspots, onZoneClick, selectedZone }) {
  if (!hotspots) return null

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
          Top Hotspots
        </h2>
        <p className="text-gray-500 text-xs mt-0.5">Ranked by congestion score</p>
      </div>

      <div className="overflow-y-auto flex-1">
        {hotspots.map((zone) => (
          <div
            key={zone.zone_id}
            onClick={() => onZoneClick(zone)}
            className={`px-4 py-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${
              selectedZone?.zone_id === zone.zone_id ? 'bg-gray-800 border-l-2 border-l-red-500' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs font-mono w-5">
                  #{zone.rank}
                </span>
                <span className="text-white text-xs font-medium truncate max-w-[140px]">
                  {zone.label}
                </span>
              </div>
              <span className={`text-sm font-bold ${getScoreColor(zone.congestion_score)}`}>
                {zone.congestion_score}
              </span>
            </div>

            <div className="flex items-center gap-2 ml-7">
              <span className={`text-xs px-2 py-0.5 rounded-full ${getGapBadge(zone.enforcement_gap)}`}>
                {zone.enforcement_gap}
              </span>
              <span className="text-gray-500 text-xs">
                {zone.violation_count.toLocaleString()} violations
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}