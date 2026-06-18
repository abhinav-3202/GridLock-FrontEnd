import { useTheme } from '../ThemeContext'

export default function LandingPage({ onNavigate }) {
  const { theme } = useTheme()

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(/src/assets/hero.jpg)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: '#ffffff',
      textAlign: 'center',
      padding: '20px',
      overflow: 'hidden',
    }}>
      {/* Content Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        maxWidth: '700px',
        animation: 'fadeInUp 0.8s ease-out',
      }}>
        {/* Logo / Brand */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#ef4444,#dc2626)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
          fontSize: '32px',
          fontWeight: 700,
          color: '#ffffff',
        }}>
          P
        </div>

        {/* Main Heading */}
        <h1 style={{
          fontSize: 'clamp(32px, 8vw, 56px)',
          fontWeight: 800,
          margin: 0,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          textShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          Bengaluru Traffic Analysis System
        </h1>

        {/* Subheading */}
        <p style={{
          fontSize: 'clamp(14px, 2vw, 18px)',
          fontWeight: 400,
          margin: 0,
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.6,
          letterSpacing: '0.01em',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          Real-time traffic violation analytics and hotspot intelligence for smarter city management
        </p>

        {/* CTA Button */}
        <button
          onClick={() => onNavigate('dashboard')}
          style={{
            marginTop: '16px',
            padding: '14px 48px',
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(239,68,68,0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(239,68,68,0.4)'
          }}
        >
           Show Analytics
        </button>
      </div>

      {/* Floating bottom accent */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '120px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)',
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
