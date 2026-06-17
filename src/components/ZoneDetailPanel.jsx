// import React from 'react'

function StatRow({ label, value, valueColor }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-800">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className={`text-xs font-semibold ${valueColor || 'text-white'}`}>{value}</span>
    </div>
  )
}

function getScoreColor(score) {
  if (score >= 9) return 'text-red-400'
  if (score >= 7) return 'text-orange-400'
  return 'text-yellow-400'
}

function getGapColor(gap) {
  if (gap === 'HIGH') return 'text-red-400'
  if (gap === 'MEDIUM') return 'text-orange-400'
  return 'text-yellow-400'
}

export default function ZoneDetailPanel({ zone, onClose }) {
  if (!zone) return null

  const resolutionPercent = (zone.resolution_rate * 100).toFixed(0)

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-700 z-50 flex flex-col shadow-2xl">
      
      <div className="px-5 py-4 border-b border-gray-700 flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Zone Detail</p>
          <h2 className="text-white font-semibold text-sm leading-snug">{zone.label}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white text-xl leading-none mt-0.5"
        >
          ✕
        </button>
      </div>

      <div className="px-5 py-4 border-b border-gray-700">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Congestion Score</p>
        <div className="flex items-end gap-2">
          <span className={`text-5xl font-bold ${getScoreColor(zone.congestion_score)}`}>
            {zone.congestion_score}
          </span>
          <span className="text-gray-500 text-sm mb-2">/ 10</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
          <div
            className="h-2 rounded-full"
            style={{
              width: `${(zone.congestion_score / 10) * 100}%`,
              backgroundColor: zone.congestion_score >= 9
                ? '#ef4444'
                : zone.congestion_score >= 7
                ? '#f97316'
                : '#eab308'
            }}
          />
        </div>
      </div>

      <div className="px-5 py-4 flex-1 overflow-y-auto">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Zone Statistics</p>
        <StatRow
          label="Total Violations"
          value={zone.violation_count.toLocaleString()}
        />
        <StatRow
          label="Peak Hour"
          value={zone.peak_hour}
          valueColor="text-orange-400"
        />
        <StatRow
          label="Peak Day"
          value={zone.peak_day}
        />
        <StatRow
          label="Top Vehicle Type"
          value={zone.top_vehicle}
        />
        <StatRow
          label="Enforcement Gap"
          value={zone.enforcement_gap}
          valueColor={getGapColor(zone.enforcement_gap)}
        />
        <StatRow
          label="Resolution Rate"
          value={`${resolutionPercent}%`}
          valueColor={zone.resolution_rate >= 0.6 ? 'text-green-400' : 'text-red-400'}
        />
        <StatRow
          label="Zone Rank"
          value={`#${zone.rank} of 50`}
        />
      </div>

      <div className="px-5 py-4 border-t border-gray-700">
        <button
          onClick={() => alert(`Enforcement alert sent for ${zone.label}`)}
          className="w-full bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          🚨 Flag for Enforcement
        </button>
        <p className="text-gray-600 text-xs text-center mt-2">
          Sends priority alert to nearest patrol unit
        </p>
      </div>
    </div>
  )
}