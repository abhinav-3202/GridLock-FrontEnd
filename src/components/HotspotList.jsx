import { useTheme } from '../ThemeContext'

/* ── helpers ─────────────────────────────────────────────── */

const RANK_GRADIENTS = [
  'linear-gradient(135deg,#f43f5e,#dc2626)',
  'linear-gradient(135deg,#f97316,#d97706)',
  'linear-gradient(135deg,#fbbf24,#ca8a04)',
  'linear-gradient(135deg,#6366f1,#2563eb)',
  'linear-gradient(135deg,#64748b,#475569)',
]
function getRankGradient(rank) { return RANK_GRADIENTS[rank - 1] ?? RANK_GRADIENTS[4] }

function getScoreStyle(score) {
  if (score >= 9) return { color: '#fb7185', bar: '#ef4444' }
  if (score >= 7) return { color: '#fbbf24', bar: '#f59e0b' }
  return { color: '#34d399', bar: '#10b981' }
}

function getRiskStyle(gap) {
  if (gap === 'HIGH')   return { bg: 'rgba(239,68,68,0.15)',  color: '#fca5a5', dot: '#ef4444', outline: 'rgba(239,68,68,0.4)' }
  if (gap === 'MEDIUM') return { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', dot: '#f59e0b', outline: 'rgba(245,158,11,0.4)' }
  return                       { bg: 'rgba(52,211,153,0.15)', color: '#6ee7b7', dot: '#10b981', outline: 'rgba(52,211,153,0.4)' }
}

/* ── component ───────────────────────────────────────────── */

export default function HotspotList({ hotspots, onZoneClick, selectedZone }) {
  const { theme } = useTheme()
  if (!hotspots) return null

  return (
    <div style={{
      background: theme.cardBg,
      boxShadow: `0 4px 24px rgba(0,0,0,${theme.mode === 'dark' ? '0.4' : '0.1'}), ${theme.cardShadowBase}`,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: '16px',
      overflow: 'hidden',
      transition: 'background 0.3s ease',
    }}>

      {/* ── Section Header ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: `1px solid ${theme.sectionDivider}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg,#f97316,#ef4444)',
            boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" fill="white" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 style={{ color: theme.textPrimary, fontWeight: 700, fontSize: '15px', letterSpacing: '0.01em', margin: 0, transition: 'color 0.3s ease' }}>
              Top Hotspots
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '12px', margin: '2px 0 0 0', transition: 'color 0.3s ease' }}>
              Ranked by congestion score
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: theme.zoneBadgeBg,
          border: `1px solid ${theme.zoneBadgeBorder}`,
          borderRadius: '999px', padding: '4px 12px',
          transition: 'background 0.3s ease',
        }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: theme.zoneBadgeDot, flexShrink: 0 }} />
          <span style={{ color: theme.zoneBadgeText, fontSize: '12px', fontWeight: 600, transition: 'color 0.3s ease' }}>
            {hotspots.length} zones
          </span>
        </div>
      </div>

      {/* ── Column Headers ─────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '48px 1fr 140px 120px 160px',
        gap: '16px',
        padding: '10px 24px',
        borderBottom: `1px solid ${theme.sectionDivider}`,
        background: theme.sectionHeaderBg,
        transition: 'background 0.3s ease',
      }}>
        {[
          { label: 'Rank',       align: 'left'   },
          { label: 'Location',   align: 'left'   },
          { label: 'Score',      align: 'center' },
          { label: 'Risk Level', align: 'center' },
          { label: 'Violations', align: 'right'  },
        ].map(({ label, align }) => (
          <span key={label} style={{
            color: theme.textMuted, fontSize: '11px', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            textAlign: align, transition: 'color 0.3s ease',
          }}>
            {label}
          </span>
        ))}
      </div>

      {/* ── Rows ───────────────────────────────────────────── */}
      <div>
        {hotspots.map((zone) => {
          const isSelected = selectedZone?.zone_id === zone.zone_id
          const score = getScoreStyle(zone.congestion_score)
          const risk  = getRiskStyle(zone.enforcement_gap)

          return (
            <div
              key={zone.zone_id}
              onClick={() => onZoneClick(zone)}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 140px 120px 160px',
                gap: '16px',
                padding: '14px 24px',
                borderBottom: `1px solid ${theme.sectionDivider}`,
                borderLeft: isSelected ? '3px solid #ef4444' : '3px solid transparent',
                background: isSelected
                  ? `linear-gradient(90deg,rgba(239,68,68,0.08) 0%,rgba(255,255,255,0.01) 100%)`
                  : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                alignItems: 'center',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = theme.rowHover }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
            >
              {/* Rank badge */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: getRankGradient(zone.rank),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                }}>
                  <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>{zone.rank}</span>
                </div>
              </div>

              {/* Location */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                <span style={{ color: theme.textPrimary, fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color 0.3s ease' }}>
                  {zone.label}
                </span>
                <span style={{ color: theme.textMuted, fontSize: '11px', marginTop: '2px', transition: 'color 0.3s ease' }}>
                  Bengaluru
                </span>
              </div>

              {/* Score + bar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: score.color, fontWeight: 700, fontSize: '17px' }}>
                  {zone.congestion_score}
                  <span style={{ color: theme.textMuted, fontSize: '11px', fontWeight: 400 }}>/10</span>
                </span>
                <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: theme.scoreBarBg, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '3px', background: score.bar, width: `${(zone.congestion_score / 10) * 100}%`, transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* Risk pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontSize: '11px', fontWeight: 600,
                  padding: '5px 10px', borderRadius: '999px',
                  background: risk.bg, color: risk.color,
                  border: `1px solid ${risk.outline}`,
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: risk.dot, flexShrink: 0 }} />
                  {zone.enforcement_gap}
                </span>
              </div>

              {/* Violations */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ color: theme.textPrimary, fontWeight: 700, fontSize: '14px', fontVariantNumeric: 'tabular-nums', transition: 'color 0.3s ease' }}>
                  {zone.violation_count.toLocaleString()}
                </span>
                <span style={{ color: theme.textMuted, fontSize: '11px', marginTop: '2px', transition: 'color 0.3s ease' }}>
                  violations
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}