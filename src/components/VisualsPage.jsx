import TimeChart from './TimeChart'
import VehicleChart from './VehicleChart'
import { useTheme } from '../ThemeContext'

export default function VisualsPage({ data }) {
  const { theme } = useTheme()
  if (!data) return null

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Page header */}
      <div>
        <h2 style={{ color: theme.textPrimary, fontWeight: 700, fontSize: '18px', letterSpacing: '0.02em', margin: 0, transition: 'color 0.3s ease' }}>
          Analytics &amp; Visuals
        </h2>
        <p style={{ color: theme.textMuted, fontSize: '14px', marginTop: '4px', transition: 'color 0.3s ease' }}>
          Detailed breakdown of violation patterns and vehicle distribution
        </p>
      </div>

      {/* Charts row */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <TimeChart timeSeries={data.time_series} />
        </div>
        <div style={{ width: '320px', flexShrink: 0 }}>
          <VehicleChart vehicles={data.vehicle_breakdown} />
        </div>
      </div>
    </div>
  )
}
