import { createContext, useContext, useState } from 'react'

/* ── Token definitions ─────────────────────────────────────
   Every color/shadow used anywhere in the app lives here.
   Components consume tokens, never raw hex values.
─────────────────────────────────────────────────────────── */
export const THEMES = {
  dark: {
    mode: 'dark',
    // Page
    pageBg:           '#030712',
    // Nav
    navBg:            '#111827',
    navBorder:        'rgba(255,255,255,0.08)',
    navText:          '#f1f5f9',
    navSubText:       '#9ca3af',
    navTabActive:     '#ef4444',
    navTabActiveShadow: 'rgba(239,68,68,0.35)',
    navTabInactive:   'transparent',
    navTabInactiveText: '#9ca3af',
    navTabHover:      'rgba(255,255,255,0.06)',
    // Cards / panels
    cardBg:           'linear-gradient(160deg,#111827 0%,#0f172a 100%)',
    cardBorder:       'rgba(255,255,255,0.07)',
    cardShadowBase:   '0 1px 4px rgba(0,0,0,0.3)',
    // Text
    textPrimary:      '#f1f5f9',
    textSecondary:    '#9ca3af',
    textMuted:        '#6b7280',
    textLabel:        '#9ca3af',
    // Surfaces
    sectionHeaderBg:  'rgba(255,255,255,0.02)',
    sectionDivider:   'rgba(255,255,255,0.05)',
    rowHover:         'rgba(255,255,255,0.04)',
    scoreBarBg:       'rgba(255,255,255,0.08)',
    // Tooltip
    tooltipBg:        '#1f2937',
    tooltipBorder:    '#374151',
    tooltipText:      '#f1f5f9',
    tooltipSubText:   '#9ca3af',
    // Chart
    chartGrid:        '#374151',
    chartTickColor:   '#6b7280',
    chartCursor:      'rgba(255,255,255,0.05)',
    // ZoneDetail panel
    panelBg:          '#111827',
    panelBorder:      'rgba(255,255,255,0.08)',
    panelRowDivider:  'rgba(255,255,255,0.06)',
    // Loading screen
    loadingBg:        '#030712',
    loadingText:      '#f1f5f9',
    // Badge
    zoneBadgeBg:      'rgba(99,102,241,0.12)',
    zoneBadgeBorder:  'rgba(99,102,241,0.35)',
    zoneBadgeText:    '#a5b4fc',
    zoneBadgeDot:     '#818cf8',
    // Theme toggle button
    toggleBg:         'rgba(255,255,255,0.08)',
    toggleBorder:     'rgba(255,255,255,0.12)',
    toggleText:       '#f1f5f9',
  },

  light: {
    mode: 'light',
    // Page
    pageBg:           '#f1f5f9',
    // Nav
    navBg:            '#ffffff',
    navBorder:        'rgba(0,0,0,0.09)',
    navText:          '#0f172a',
    navSubText:       '#64748b',
    navTabActive:     '#ef4444',
    navTabActiveShadow: 'rgba(239,68,68,0.25)',
    navTabInactive:   'transparent',
    navTabInactiveText: '#64748b',
    navTabHover:      'rgba(0,0,0,0.05)',
    // Cards / panels
    cardBg:           '#ffffff',
    cardBorder:       'rgba(0,0,0,0.07)',
    cardShadowBase:   '0 1px 4px rgba(0,0,0,0.08)',
    // Text
    textPrimary:      '#0f172a',
    textSecondary:    '#475569',
    textMuted:        '#94a3b8',
    textLabel:        '#64748b',
    // Surfaces
    sectionHeaderBg:  'rgba(0,0,0,0.02)',
    sectionDivider:   'rgba(0,0,0,0.06)',
    rowHover:         'rgba(0,0,0,0.03)',
    scoreBarBg:       'rgba(0,0,0,0.08)',
    // Tooltip
    tooltipBg:        '#ffffff',
    tooltipBorder:    '#e2e8f0',
    tooltipText:      '#0f172a',
    tooltipSubText:   '#64748b',
    // Chart
    chartGrid:        '#e2e8f0',
    chartTickColor:   '#94a3b8',
    chartCursor:      'rgba(0,0,0,0.04)',
    // ZoneDetail panel
    panelBg:          '#ffffff',
    panelBorder:      'rgba(0,0,0,0.09)',
    panelRowDivider:  'rgba(0,0,0,0.06)',
    // Loading screen
    loadingBg:        '#f1f5f9',
    loadingText:      '#0f172a',
    // Badge
    zoneBadgeBg:      'rgba(99,102,241,0.08)',
    zoneBadgeBorder:  'rgba(99,102,241,0.25)',
    zoneBadgeText:    '#4f46e5',
    zoneBadgeDot:     '#6366f1',
    // Theme toggle button
    toggleBg:         'rgba(0,0,0,0.05)',
    toggleBorder:     'rgba(0,0,0,0.12)',
    toggleText:       '#0f172a',
  },
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  // Switched initial state from 'dark' to 'light' 🟢
  const [mode, setMode] = useState('light')
  
  const theme = THEMES[mode]
  const toggle = () => setMode(m => m === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}