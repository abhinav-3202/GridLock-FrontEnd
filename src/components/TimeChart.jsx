import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { useTheme } from '../ThemeContext'

function getPeakColor(violations) {
  if (violations >= 4000) return '#ef4444'
  if (violations >= 2000) return '#f97316'
  if (violations >= 1000) return '#eab308'
  return '#94a3b8'
}

export default function TimeChart({ timeSeries }) {
  const { theme } = useTheme()
  if (!timeSeries) return null

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: theme.tooltipBg,
          border: `1px solid ${theme.tooltipBorder}`,
          borderRadius: '8px', padding: '8px 12px', fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          <p style={{ color: theme.tooltipSubText, marginBottom: '2px' }}>{label}</p>
          <p style={{ color: theme.tooltipText, fontWeight: 700 }}>
            {payload[0].value.toLocaleString()} violations
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: '12px',
      padding: '16px',
      boxShadow: theme.cardShadowBase,
      transition: 'background 0.3s ease',
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ color: theme.textPrimary, fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, transition: 'color 0.3s ease' }}>
          Violations by Hour
        </h2>
        <p style={{ color: theme.textMuted, fontSize: '12px', marginTop: '2px', transition: 'color 0.3s ease' }}>
          Historical pattern — 24 hour distribution
        </p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={timeSeries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: theme.chartTickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: theme.chartTickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: theme.chartCursor }} />
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