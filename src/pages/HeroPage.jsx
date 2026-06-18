import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import heroImage from '../assets/hero.jpg'

export default function HeroPage({ onEnter }) {
  const overlayRef = useRef(null)
  const badgeRef = useRef(null)
  const headlineRef = useRef(null)
  const subRef = useRef(null)
  const btnRef = useRef(null)
  const statsRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.2 }
    )
    .fromTo(badgeRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6 },
      '-=0.4'
    )
    .fromTo(headlineRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9 },
      '-=0.3'
    )
    .fromTo(subRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7 },
      '-=0.5'
    )
    .fromTo(btnRef.current,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.5 },
      '-=0.3'
    )
    .fromTo(statsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6 },
      '-=0.2'
    )
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* Background image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {/* Gradient overlay — dark teal tint */}
      <div
        ref={overlayRef}
        className="absolute inset-0 w-full h-full opacity-0"
        style={{
          background: 'linear-gradient(135deg, rgba(15,76,58,0.82) 0%, rgba(13,148,136,0.65) 50%, rgba(0,0,0,0.75) 100%)'
        }}
      />
 
      {/* Navbar strip */}
      {/* Navbar strip inside HeroPage.jsx */}
<div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-5">
  <div className="flex items-center gap-3">
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base"
      style={{ background: 'linear-gradient(135deg, #0d9488, #06b6d4)' }}
    >
      P
    </div>
    {/* Explicitly check that this has text-white class */}
    <span className="text-white font-bold text-lg tracking-wide">ParkSense AI</span>
  </div>
  <div
    className="text-xs font-semibold px-4 py-1.5 rounded-full border border-white/30 text-white"
    style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
  >
    Bengaluru Traffic Intelligence
  </div>
</div>

      {/* Hero content — centered */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">

        {/* Badge */}
        <div
          ref={badgeRef}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(13,148,136,0.25)',
            border: '1px solid rgba(13,148,136,0.6)',
            color: '#5eead4',
            backdropFilter: 'blur(8px)'
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse inline-block" />
          AI-Powered Parking Violation Detection
        </div>

        {/* Main headline */}
        <h1
          ref={headlineRef}
          className="text-white font-black leading-tight mb-4"
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 4rem)',
            textShadow: '0 4px 24px rgba(0,0,0,0.75), 0 2px 4px rgba(0,0,0,0.5)',
            letterSpacing: '-0.02em'
          }}
        >
          Welcome to<br />
          <span style={{ color: '#5eead4' }}>Bengaluru</span> Traffic Command
        </h1>

        {/* Subheadline */}
        <p
            ref={subRef}
            className="text-white text-lg max-w-xl mb-10 leading-relaxed font-medium"
            style={{
                textShadow: '0 2px 8px rgba(0,0,0,0.6)'
            }}
            >
            Detect illegal parking hotspots, quantify congestion impact, and enable
            targeted enforcement — powered by historical violation intelligence.
            </p>

        {/* CTA Button */}
        <button
          ref={btnRef}
          onClick={onEnter}
          className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-base transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
            boxShadow: '0 8px 32px rgba(13,148,136,0.45)'
          }}
        >
          <span>View Live Analysis</span>
          <svg
            className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        {/* Stats row at bottom */}
        <div
          ref={statsRef}
          className="mt-16 flex items-center gap-8"
        >
          {[
            { value: '2,98,441', label: 'Violations Analysed' },
            { value: '50', label: 'Hotspots Identified' },
            { value: '8–10 AM', label: 'Peak Violation Window' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-white font-black text-2xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                {stat.value}
              </div>
              <div className="text-white/50 text-xs mt-0.5 uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-white/40 text-xs">
        <div className="w-px h-8 bg-white/20 animate-pulse" />
        scroll to explore
      </div>

    </div>
  )
}