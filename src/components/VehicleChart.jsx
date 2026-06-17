// import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
//   Legend
} from 'recharts'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7']

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs">
        <p className="text-white font-bold">{payload[0].name}</p>
        <p className="text-gray-400">{payload[0].value.toLocaleString()} violations</p>
      </div>
    )
  }
  return null
}

export default function VehicleChart({ vehicles }) {
  if (!vehicles) return null

  const total = vehicles.reduce((sum, v) => sum + v.count, 0)

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 h-full">
      <div className="mb-2">
        <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
          Vehicle Breakdown
        </h2>
        <p className="text-gray-500 text-xs mt-0.5">By violation count</p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={vehicles}
            dataKey="count"
            nameKey="type"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={2}
          >
            {vehicles.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-1.5 mt-2">
        {vehicles.map((v, index) => (
          <div key={v.type} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-400">{v.type}</span>
            </div>
            <span className="text-gray-300 font-medium">
              {((v.count / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}