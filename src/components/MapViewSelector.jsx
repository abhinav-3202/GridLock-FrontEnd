import { useTheme } from '../ThemeContext'

const VIEWS = [
  {
    id: 'hotspots',
    label: 'Hotspots',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="7" strokeOpacity="0.4" />
        <circle cx="12" cy="12" r="11" strokeOpacity="0.15" />
      </svg>
    ),
  },
  {
    id: 'heatmap',
    label: 'Heatmap',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 2C8 2 5 6 5 10c0 5 7 12 7 12s7-7 7-12c0-4-3-8-7-8z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
]

export default function MapViewSelector({ mapView, onMapViewChange }) {
  const { theme } = useTheme()
  const isDark = theme.mode === 'dark'

  return (
    <div style={{
      display: 'inline-flex',
      borderRadius: '999px',
      padding: '3px',
      gap: '2px',
      background: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    }}>
      {VIEWS.map(({ id, label, icon }) => {
        const isActive = mapView === id
        return (
          <button
            key={id}
            onClick={() => onMapViewChange(id)}
            title={`${label} view`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              transition: 'all 0.2s ease',
              background: isActive
                ? (id === 'heatmap'
                    ? 'linear-gradient(135deg,#f97316,#ef4444)'
                    : 'linear-gradient(135deg,#6366f1,#4f46e5)')
                : 'transparent',
              color: isActive
                ? '#ffffff'
                : (isDark ? '#9ca3af' : '#64748b'),
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.color = isDark ? '#f1f5f9' : '#0f172a'
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.color = isDark ? '#9ca3af' : '#64748b'
            }}
          >
            {icon}
            {label}
          </button>
        )
      })}
    </div>
  )
}
