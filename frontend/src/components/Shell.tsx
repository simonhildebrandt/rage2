import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAutoplay } from '../providers/AutoplayProvider'
import { useAuth } from '../providers/AuthProvider'

export function Shell({ children }: { children: ReactNode }) {
  const loc = useLocation()
  const isBrowse = loc.pathname === '/'
  const isSearch = loc.pathname === '/search'
  const { token } = useAuth()

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
            <span style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: 'oklch(0.86 0.13 200)' }}>
              REC · ARCHIVE
            </span>
          </div>
          <AutoplayToggle />
        </div>
      </div>

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
