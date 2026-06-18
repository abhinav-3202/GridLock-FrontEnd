import { useTheme } from '../ThemeContext'

/* ── Icons ──────────────────────────────────────────────── */
function IconViolations() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 0m8 0H5m8 0h2m2 0h1.5a1.5 1.5 0 001.5-1.5v-4.5a1.5 1.5 0 00-.44-1.06L18 7H13v9z" />
    </svg>
  )
}
function IconHotspots() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <circle cx="12" cy="11" r="3" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 3.5" />
    </svg>
  )
}
function IconWarning() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

/* ── Card accent configs ────────────────────────────────── */
const CARDS = [
  { key: 'violations', title: 'Total Violations Analysed', subtitle: 'Jan – May dataset',        Icon: IconViolations, accent: '#6366f1', shadow: 'rgba(99,102,241,0.18)',  iconBg: 'rgba(99,102,241,0.15)',  topBorder: '#6366f1' },
  { key: 'hotspots',   title: 'Hotspots Identified',       subtitle: 'High density zones',       Icon: IconHotspots,   accent: '#ef4444', shadow: 'rgba(239,68,68,0.18)',   iconBg: 'rgba(239,68,68,0.14)',   topBorder: '#ef4444' },
  { key: 'peak',       title: 'Peak Violation Hour',        subtitle: 'Highest risk window',      Icon: IconClock,      accent: '#f59e0b', shadow: 'rgba(245,158,11,0.18)',  iconBg: 'rgba(245,158,11,0.14)',  topBorder: '#f59e0b' },
  { key: 'zone',       title: 'Highest Risk Zone',          subtitle: 'Immediate action needed',  Icon: IconWarning,    accent: '#f97316', shadow: 'rgba(249,115,22,0.18)',  iconBg: 'rgba(249,115,22,0.14)',  topBorder: '#f97316' },
]

/* ── Single card ─────────────────────────────────────────── */
function Card({ config, value, theme }) {
  const { title, subtitle, Icon, accent, shadow, iconBg, topBorder } = config
  const valueFontSize = value.length > 14 ? '14px' : value.length > 8 ? '18px' : '28px'

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        padding: '20px', borderRadius: '16px', overflow: 'hidden',
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderTop: `3px solid ${topBorder}`,
        boxShadow: `0 4px 20px ${shadow}, ${theme.cardShadowBase}`,
        transition: 'transform 0.2s ease, background 0.3s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: '-24px', right: '-24px',
        width: '96px', height: '96px', borderRadius: '50%',
        background: accent, opacity: theme.mode === 'dark' ? 0.12 : 0.07,
        filter: 'blur(24px)', pointerEvents: 'none',
      }} />

      {/* Icon */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
        background: iconBg, color: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <Icon />
      </div>

      {/* Label */}
      <span style={{
        color: theme.textLabel, fontSize: '10px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1.3,
        transition: 'color 0.3s ease',
      }}>
        {title}
      </span>

      {/* Value */}
      <span style={{
        color: theme.textPrimary, fontWeight: 800,
        fontSize: valueFontSize, lineHeight: 1.2, marginTop: '6px',
        wordBreak: 'break-word', transition: 'color 0.3s ease',
      }}>
        {value}
      </span>

      {/* Subtitle */}
      <span style={{
        color: theme.textMuted, fontSize: '11px',
        fontStyle: 'italic', marginTop: '6px', transition: 'color 0.3s ease',
      }}>
        {subtitle}
      </span>
    </div>
  )
}

/* ── Export ─────────────────────────────────────────────── */
export default function KPICards({ summary }) {
  const { theme } = useTheme()
  if (!summary) return null

  const values = [
    summary.total_violations.toLocaleString(),
    String(summary.total_hotspots),
    summary.peak_hour,
    summary.highest_risk_zone,
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
      {CARDS.map((cfg, i) => (
        <Card key={cfg.key} config={cfg} value={values[i]} theme={theme} />
      ))}
    </div>
  )
}