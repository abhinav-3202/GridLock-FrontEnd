import { useTheme } from '../ThemeContext'

function getScoreColor(score) {
  if (score >= 9) return '#ef4444'
  if (score >= 7) return '#f97316'
  return '#eab308'
}
function getGapColor(gap) {
  if (gap === 'HIGH') return '#ef4444'
  if (gap === 'MEDIUM') return '#f97316'
  return '#eab308'
}

function StatRow({ label, value, valueColor, theme }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0',
      borderBottom: `1px solid ${theme.panelRowDivider}`,
    }}>
      <span style={{ color: theme.textSecondary, fontSize: '12px', transition: 'color 0.3s ease' }}>{label}</span>
      <span style={{ color: valueColor || theme.textPrimary, fontSize: '12px', fontWeight: 600, transition: 'color 0.3s ease' }}>{value}</span>
    </div>
  )
}

export default function ZoneDetailPanel({ zone, onClose }) {
  const { theme } = useTheme()
  if (!zone) return null

  const resolutionPercent = (zone.resolution_rate * 100).toFixed(0)
  const scoreColor = getScoreColor(zone.congestion_score)
  const scoreBarBg = zone.congestion_score >= 9 ? '#ef4444' : zone.congestion_score >= 7 ? '#f97316' : '#eab308'

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0,
      height: '100%', width: '320px',
      background: theme.panelBg,
      borderLeft: `1px solid ${theme.panelBorder}`,
      zIndex: 50,
      display: 'flex', flexDirection: 'column',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
      transition: 'background 0.3s ease',
    }}>

      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: `1px solid ${theme.panelBorder}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ color: theme.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', transition: 'color 0.3s ease' }}>
            Zone Detail
          </p>
          <h2 style={{ color: theme.textPrimary, fontWeight: 600, fontSize: '14px', margin: 0, lineHeight: 1.3, transition: 'color 0.3s ease' }}>
            {zone.label}
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: theme.textMuted, fontSize: '20px', lineHeight: 1,
            padding: '2px 6px', borderRadius: '6px',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.textPrimary }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted }}
        >
          ✕
        </button>
      </div>

      {/* Score section */}
      <div style={{ padding: '20px', borderBottom: `1px solid ${theme.panelBorder}` }}>
        <p style={{ color: theme.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', transition: 'color 0.3s ease' }}>
          Congestion Score
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{ color: scoreColor, fontWeight: 700, fontSize: '48px', lineHeight: 1 }}>
            {zone.congestion_score}
          </span>
          <span style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '6px' }}>/ 10</span>
        </div>
        <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: theme.scoreBarBg, marginTop: '12px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '4px',
            background: scoreBarBg,
            width: `${(zone.congestion_score / 10) * 100}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
        <p style={{ color: theme.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', transition: 'color 0.3s ease' }}>
          Zone Statistics
        </p>
        <StatRow label="Total Violations" value={zone.violation_count.toLocaleString()} theme={theme} />
        <StatRow label="Peak Hour" value={zone.peak_hour} valueColor="#f97316" theme={theme} />
        <StatRow label="Peak Day" value={zone.peak_day} theme={theme} />
        <StatRow label="Top Vehicle Type" value={zone.top_vehicle} theme={theme} />
        <StatRow label="Enforcement Gap" value={zone.enforcement_gap} valueColor={getGapColor(zone.enforcement_gap)} theme={theme} />
        <StatRow label="Resolution Rate" value={`${resolutionPercent}%`} valueColor={zone.resolution_rate >= 0.6 ? '#22c55e' : '#ef4444'} theme={theme} />
        <StatRow label="Zone Rank" value={`#${zone.rank} of 50`} theme={theme} />
      </div>

      {/* CTA */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${theme.panelBorder}` }}>
        <button
          onClick={() => alert(`Enforcement alert sent for ${zone.label}`)}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg,#ef4444,#dc2626)',
            color: '#ffffff',
            fontSize: '14px', fontWeight: 600,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          🚨 Flag for Enforcement
        </button>
        <p style={{ color: theme.textMuted, fontSize: '11px', textAlign: 'center', marginTop: '8px', transition: 'color 0.3s ease' }}>
          Sends priority alert to nearest patrol unit
        </p>
      </div>
    </div>
  )
}