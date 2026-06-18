import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '../ThemeContext'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7']

export default function VehicleChart({ vehicles }) {
  const { theme } = useTheme()
  if (!vehicles) return null

  const total = vehicles.reduce((sum, v) => sum + v.count, 0)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: theme.tooltipBg,
          border: `1px solid ${theme.tooltipBorder}`,
          borderRadius: '8px', padding: '8px 12px', fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          <p style={{ color: theme.tooltipText, fontWeight: 700 }}>{payload[0].name}</p>
          <p style={{ color: theme.tooltipSubText }}>{payload[0].value.toLocaleString()} violations</p>
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
      height: '100%',
      transition: 'background 0.3s ease',
    }}>
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ color: theme.textPrimary, fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, transition: 'color 0.3s ease' }}>
          Vehicle Breakdown
        </h2>
        <p style={{ color: theme.textMuted, fontSize: '12px', marginTop: '2px', transition: 'color 0.3s ease' }}>
          By violation count
        </p>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
        {vehicles.map((v, index) => (
          <div key={v.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length], flexShrink: 0 }} />
              <span style={{ color: theme.textSecondary, transition: 'color 0.3s ease' }}>{v.type}</span>
            </div>
            <span style={{ color: theme.textPrimary, fontWeight: 500, transition: 'color 0.3s ease' }}>
              {((v.count / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}