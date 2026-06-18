import { useTheme } from '../ThemeContext'

function SunIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}

export default function Navbar({ activePage, onPageChange }) {
  const { theme, toggle } = useTheme()
  const isDark = theme.mode === 'dark'

  return (
    <nav style={{
      background: theme.navBg,
      borderBottom: `1px solid ${theme.navBorder}`,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      transition: 'background 0.3s ease, border-color 0.3s ease',
      boxShadow: isDark
        ? '0 1px 12px rgba(0,0,0,0.4)'
        : '0 1px 8px rgba(0,0,0,0.08)',
    }}>

      {/* ── Left: Brand ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#ef4444,#dc2626)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(239,68,68,0.35)',
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>P</span>
        </div>
        <span style={{ color: theme.navText, fontWeight: 700, fontSize: '16px', letterSpacing: '0.02em' }}>
          ParkSense AI
        </span>
      </div>

      {/* ── Center: Title + Nav tabs ─────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <h1 style={{
          color: theme.navText,
          fontWeight: 800, fontSize: '18px',
          letterSpacing: '0.02em', margin: 0,
          transition: 'color 0.3s ease',
        }}>
          Bengaluru Traffic Violation Intelligence
        </h1>

        {/* Tab pills */}
        <div style={{
          display: 'flex', gap: '4px',
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          padding: '3px',
          borderRadius: '999px',
        }}>
          {['overview', 'visuals'].map(page => {
            const isActive = activePage === page
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                style={{
                  padding: '4px 16px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'capitalize',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isActive ? theme.navTabActive : 'transparent',
                  color: isActive ? '#ffffff' : theme.navTabInactiveText,
                  boxShadow: isActive ? `0 2px 8px ${theme.navTabActiveShadow}` : 'none',
                }}
              >
                {page === 'overview' ? 'Overview' : 'Visuals'}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right: Live badge + Theme toggle ─────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px', justifyContent: 'flex-end' }}>
        {/* Live badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#4ade80', flexShrink: 0,
            boxShadow: '0 0 6px rgba(74,222,128,0.6)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ color: theme.navSubText, fontSize: '13px' }}>Live Analysis Active</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px',
            borderRadius: '999px',
            border: `1px solid ${theme.toggleBorder}`,
            background: theme.toggleBg,
            color: theme.toggleText,
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
          {isDark ? 'Light' : 'Dark'}
        </button>
      </div>
    </nav>
  )
}