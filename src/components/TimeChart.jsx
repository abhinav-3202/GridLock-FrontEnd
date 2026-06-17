// import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

function getPeakColor(violations) {
  if (violations >= 4000) return '#ef4444'
  if (violations >= 2000) return '#f97316'
  if (violations >= 1000) return '#eab308'
  return '#4b5563'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs">
        <p className="text-gray-400">{label}</p>
        <p className="text-white font-bold">
          {payload[0].value.toLocaleString()} violations
        </p>
      </div>
    )
  }
  return null
}

export default function TimeChart({ timeSeries }) {
  if (!timeSeries) return null

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
      <div className="mb-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
          Violations by Hour
        </h2>
        <p className="text-gray-500 text-xs mt-0.5">
          Historical pattern — 24 hour distribution
        </p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={timeSeries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar dataKey="violations" radius={[3, 3, 0, 0]}>
            {timeSeries.map((entry, index) => (
              <Cell key={index} fill={getPeakColor(entry.violations)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}