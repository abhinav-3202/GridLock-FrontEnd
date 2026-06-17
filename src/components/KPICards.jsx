// import React from 'react'

function Card({ title, value, subtitle, color }) {
  return (
    <div className={`bg-gray-900 border ${color} rounded-xl p-4 flex flex-col gap-1`}>
      <span className="text-gray-400 text-xs uppercase tracking-widest">{title}</span>
      <span className="text-white text-2xl font-bold">{value}</span>
      {subtitle && (
        <span className="text-gray-500 text-xs">{subtitle}</span>
      )}
    </div>
  )
}

export default function KPICards({ summary }) {
  if (!summary) return null

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card
        title="Total Violations Analysed"
        value={summary.total_violations.toLocaleString()}
        subtitle="Jan - May dataset"
        color="border-blue-800"
      />
      <Card
        title="Hotspots Identified"
        value={summary.total_hotspots}
        subtitle="High density zones"
        color="border-red-800"
      />
      <Card
        title="Peak Violation Hour"
        value={summary.peak_hour}
        subtitle="Highest risk window"
        color="border-orange-800"
      />
      <Card
        title="Highest Risk Zone"
        value={summary.highest_risk_zone}
        subtitle="Immediate action needed"
        color="border-yellow-800"
      />
    </div>
  )
}