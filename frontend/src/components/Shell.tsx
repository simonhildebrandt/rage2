import { Link, useLocation } from 'react-router-dom'
import { useState, type ReactNode } from 'react'
import { useAutoplay } from '../providers/AutoplayProvider'
import { useAuth } from '../providers/AuthProvider'

export function Shell({ children }: { children: ReactNode }) {
  const loc = useLocation()
  const isBrowse = loc.pathname === '/'
  const isSearch = loc.pathname === '/search'
  const { token } = useAuth()
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
        pointerEvents: 'none', zIndex: 60,
        background: 'repeating-linear-gradient(0deg,rgba(255,255,255,.04) 0 1px,transparent 1px 3px)',
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
        pointerEvents: 'none', zIndex: 61,
        background: 'radial-gradient(130% 130% at 50% 30%,transparent 58%,rgba(0,0,0,.6) 100%)',
      }} />

      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 34px', height: 50,
        background: 'rgba(8,8,12,.92)',
        borderBottom: '1px solid #1c1c24',
        backdropFilter: 'blur(4px)',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: "'VT323',monospace", fontSize: 30, lineHeight: 1,
            color: 'oklch(0.78 0.22 350)',
            textShadow: '0 0 14px oklch(0.66 0.24 350/.8)',
          }}>▶</span>
          <span style={{
            fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 24,
            letterSpacing: '.4em', textTransform: 'uppercase', color: '#fff',
          }}>RAGE²</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <NavItem to="/" active={isBrowse}>BROWSE</NavItem>
          <NavItem to="/search" active={isSearch}>SEARCH</NavItem>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: 'oklch(0.66 0.24 25)',
              boxShadow: '0 0 10px oklch(0.66 0.24 25)',
              animation: 'recblink 1.1s steps(1) infinite',
            }} />
            <button
              onClick={() => setAboutOpen(true)}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: "'VT323',monospace", fontSize: 22,
                color: 'oklch(0.86 0.13 200)',
              }}
            >REC · ABOUT</button>
          </div>
          <AutoplayToggle />
        </div>
      </div>

      {aboutOpen && (
        <>
          <div
            onClick={() => setAboutOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,.7)' }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 71, width: 'min(520px, calc(100vw - 48px))',
            background: '#0d0e11', border: '1px solid #2b2f39', borderRadius: 10,
            padding: '32px 36px',
            fontFamily: "'IBM Plex Mono',monospace",
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '.3em' }}>
                RAGE²
              </span>
              <button
                onClick={() => setAboutOpen(false)}
                style={{ background: 'none', border: 'none', color: '#6b727f', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
              >✕</button>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: '#9aa0ab', margin: 0 }}>
              Rage² is my attempt to bring back{' '}
              <a href="https://rageagain.com" target="_blank" rel="noopener noreferrer" style={{ color: 'oklch(0.74 0.15 350)' }}>rageagain.com</a>
              {' '}(by the excellent <a href="https://www.pjgalbraith.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'oklch(0.74 0.15 350)' }}>Patrick Galbraith</a>
              ) itself an attempt to liberate Rage from it's current state, trapped on broadcast TV.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: '#9aa0ab', margin: '14px 0 0' }}>
              It runs on Cloudflare workers and the code is available here:{' '}
              <a href="https://github.com/simonhildebrandt/rage2" target="_blank" rel="noopener noreferrer" style={{ color: 'oklch(0.74 0.15 350)' }}>
                https://github.com/simonhildebrandt/rage2
              </a>
            </p>
          </div>
        </>
      )}

      {children}

      <div style={{ textAlign: 'center', padding: '40px 0 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        {token ? (
          <Link
            to="/admin"
            style={{
              fontFamily: "'VT323',monospace", fontSize: 18,
              color: '#3a3a44', textDecoration: 'none',
              letterSpacing: '.1em',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#8a8a95' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#3a3a44' }}
          >ADMIN</Link>
        ) : (
          <a
            href={`https://login-with.link/login/${import.meta.env.LWL_KEY}`}
            style={{
              fontFamily: "'VT323',monospace", fontSize: 18,
              color: '#3a3a44', textDecoration: 'none',
              letterSpacing: '.1em',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#8a8a95' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#3a3a44' }}
          >ADMIN LOGIN</a>
        )}
        <a
          href="mailto:simonhildebrandt@gmail.com?subject=rage2%20correction"
          style={{
            fontFamily: "'VT323',monospace", fontSize: 18,
            color: '#3a3a44', textDecoration: 'none',
            letterSpacing: '.1em',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#8a8a95' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#3a3a44' }}
        >REPORT PROBLEMS</a>
      </div>
    </>
  )
}

function AutoplayToggle() {
  const [autoplay, setAutoplay] = useAutoplay()
  return (
    <button
      onClick={() => setAutoplay(!autoplay)}
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: "'VT323',monospace", fontSize: 22,
        color: autoplay ? 'oklch(0.86 0.13 200)' : '#5a5a64',
      }}
    >
      <span>{autoplay ? '[X]' : '[ ]'}</span>
      <span>AUTOPLAY</span>
    </button>
  )
}

function NavItem({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <Link to={to} style={{
      textDecoration: 'none',
      fontFamily: "'Oswald',sans-serif",
      fontWeight: 600, fontSize: 22,
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: active ? 'oklch(0.82 0.2 350)' : '#8a8a95',
      textShadow: active ? '0 0 12px oklch(0.66 0.24 350/.7)' : 'none',
      borderBottom: active ? '2px solid oklch(0.72 0.22 350)' : '2px solid transparent',
      paddingBottom: 3,
    }}>{children}</Link>
  )
}
