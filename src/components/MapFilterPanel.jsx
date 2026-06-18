import { useState, useMemo } from 'react'
import { useTheme } from '../ThemeContext'

/* ── static option sets ──────────────────────────────────── */

const TIME_OPTIONS = [
  { value: 'all',     label: 'All Hours'       },
  { value: '00-06',   label: '12AM – 6AM  (Night)'  },
  { value: '06-10',   label: '6AM – 10AM (Morning)' },
  { value: '10-14',   label: '10AM – 2PM (Midday)'  },
  { value: '14-18',   label: '2PM – 6PM  (Afternoon)'},
  { value: '18-24',   label: '6PM – 12AM (Evening)'  },
]

const DAY_OPTIONS = [
  { value: 'all',       label: 'All Days'   },
  { value: 'Monday',    label: 'Monday'     },
  { value: 'Tuesday',   label: 'Tuesday'    },
  { value: 'Wednesday', label: 'Wednesday'  },
  { value: 'Thursday',  label: 'Thursday'   },
  { value: 'Friday',    label: 'Friday'     },
  { value: 'Saturday',  label: 'Saturday'   },
  { value: 'Sunday',    label: 'Sunday'     },
]

const AREA_OPTIONS = [
  { value: 'all',    label: 'All Areas'    },
  { value: 'top5',   label: 'Top 5 Zones'  },
  { value: 'top10',  label: 'Top 10 Zones' },
  // specific zones added dynamically below
]

/* ── colour-coded congestion legend ─────────────────────── */

const LEGEND = [
  { color: '#ef4444', label: 'Critical (≥ 9.0)' },
  { color: '#f97316', label: 'High  (7.0 – 8.9)' },
  { color: '#eab308', label: 'Moderate (< 7.0)'   },
]

/* ── helpers ─────────────────────────────────────────────── */

function matchesTime(zone, slot) {
  if (slot === 'all') return true
  const [start, end] = slot.split('-').map(Number)
  const peakStart = parseInt(zone.peak_hour.split(':')[0], 10)
  return peakStart >= start && peakStart < end
}

function matchesDay(zone, day) {
  if (day === 'all') return true
  return zone.peak_day === day
}

function matchesArea(zone, area, allHotspots) {
  if (area === 'all')   return true
  if (area === 'top5')  return zone.rank <= 5
  if (area === 'top10') return zone.rank <= 10
  // specific zone_id
  return zone.zone_id === area
}

/* ── styled Select ───────────────────────────────────────── */

function Select({ id, label, value, onChange, options, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={id}
        style={{ color: theme.textLabel, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            appearance: 'none',
            padding: '9px 36px 9px 12px',
            borderRadius: '10px',
            border: `1px solid ${theme.cardBorder}`,
            background: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#ffffff',
            color: theme.textPrimary,
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            outline: 'none',
            boxShadow: theme.cardShadowBase,
            transition: 'border-color 0.2s ease, background 0.3s ease',
          }}
          onFocus={e => { e.target.style.borderColor = '#ef4444' }}
          onBlur={e => { e.target.style.borderColor = theme.cardBorder }}
        >
          {options.map(opt => (
            <option
              key={opt.value}
              value={opt.value}
              style={{ background: theme.mode === 'dark' ? '#1f2937' : '#ffffff', color: theme.textPrimary }}
            >
              {opt.label}
            </option>
          ))}
        </select>
        {/* chevron */}
        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: theme.textMuted }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  )
}

/* ── reset button ────────────────────────────────────────── */

function ResetButton({ onClick, theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '9px',
        borderRadius: '10px',
        border: `1px solid ${theme.cardBorder}`,
        background: 'transparent',
        color: theme.textSecondary,
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = theme.rowHover; e.currentTarget.style.color = theme.textPrimary }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textSecondary }}
    >
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 .49-3.45" />
      </svg>
      Reset Filters
    </button>
  )
}

/* ── active-filter summary badge ────────────────────────── */

function ActiveBadge({ count, theme }) {
  if (count === 0) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: '20px', height: '20px', borderRadius: '999px',
      background: '#ef4444', color: '#ffffff',
      fontSize: '11px', fontWeight: 700,
      padding: '0 5px',
    }}>
      {count}
    </span>
  )
}

/* ── main export ─────────────────────────────────────────── */

export default function MapFilterPanel({ hotspots, onFilteredChange }) {
  const { theme } = useTheme()

  const [timeSlot, setTimeSlot] = useState('all')
  const [day,      setDay]      = useState('all')
  const [area,     setArea]     = useState('all')

  // Build dynamic area options (static presets + each zone by name)
  const areaOptions = useMemo(() => {
    const specific = (hotspots || []).map(z => ({ value: z.zone_id, label: `${z.label}` }))
    return [...AREA_OPTIONS, ...specific]
  }, [hotspots])

  // Apply filters whenever state changes
  const filtered = useMemo(() => {
    if (!hotspots) return []
    const result = hotspots.filter(z =>
      matchesTime(z, timeSlot) &&
      matchesDay(z, day)       &&
      matchesArea(z, area, hotspots)
    )
    onFilteredChange(result)
    return result
  }, [hotspots, timeSlot, day, area])

  const activeCount = [timeSlot, day, area].filter(v => v !== 'all').length

  function reset() {
    setTimeSlot('all')
    setDay('all')
    setArea('all')
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0',
      height: '100%',
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: theme.cardShadowBase,
      transition: 'background 0.3s ease',
    }}>

      {/* Panel header */}
      <div style={{
        padding: '16px 18px',
        borderBottom: `1px solid ${theme.sectionDivider}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 8px rgba(99,102,241,0.35)',
          }}>
            <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
          <div>
            <h3 style={{ color: theme.textPrimary, fontWeight: 700, fontSize: '13px', margin: 0 }}>Map Filters</h3>
            <p style={{ color: theme.textMuted, fontSize: '11px', margin: '1px 0 0 0' }}>Refine hotspot view</p>
          </div>
        </div>
        <ActiveBadge count={activeCount} theme={theme} />
      </div>

      {/* Filters */}
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflowY: 'auto' }}>

        <Select
          id="filter-time"
          label="⏰ Time Interval"
          value={timeSlot}
          onChange={setTimeSlot}
          options={TIME_OPTIONS}
          theme={theme}
        />

        <Select
          id="filter-day"
          label="📅 Day of Week"
          value={day}
          onChange={setDay}
          options={DAY_OPTIONS}
          theme={theme}
        />

        <Select
          id="filter-area"
          label="📍 Area / Zone"
          value={area}
          onChange={setArea}
          options={areaOptions}
          theme={theme}
        />

        {/* Result count chip */}
        <div style={{
          padding: '10px 12px',
          borderRadius: '10px',
          background: filtered.length > 0
            ? (theme.mode === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.07)')
            : (theme.mode === 'dark' ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.07)'),
          border: `1px solid ${filtered.length > 0 ? 'rgba(99,102,241,0.25)' : 'rgba(239,68,68,0.25)'}`,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: filtered.length > 0 ? '#6366f1' : '#ef4444',
          }} />
          <span style={{ color: theme.textSecondary, fontSize: '12px', fontWeight: 500 }}>
            {filtered.length === 0
              ? 'No zones match filters'
              : `${filtered.length} zone${filtered.length !== 1 ? 's' : ''} on map`}
          </span>
        </div>

        <ResetButton onClick={reset} theme={theme} />
      </div>

      {/* Congestion legend */}
      <div style={{
        padding: '14px 18px',
        borderTop: `1px solid ${theme.sectionDivider}`,
      }}>
        <p style={{ color: theme.textMuted, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Congestion Level
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {LEGEND.map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 4px ${color}80` }} />
              <span style={{ color: theme.textSecondary, fontSize: '11px' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
