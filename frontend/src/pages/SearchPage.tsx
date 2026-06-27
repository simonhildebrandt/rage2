import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchArchive, type SearchResult } from '../api/search'

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const WEEK_DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT']

function parseDateParts(aired_date: string) {
  const [yyyy, mm, dd] = aired_date.split('-')
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  return {
    dd: String(Number(dd)),
    monYr: `${MONTHS[Number(mm) - 1]} ${yyyy}`,
    dateShort: `${WEEK_DAYS[date.getDay()]} ${Number(dd)} ${MONTHS[Number(mm) - 1]} ${yyyy}`,
  }
}

type Mode = 'all' | 'date' | 'artist'

const SUGGESTIONS = ['Powderfinger', 'Silverchair', 'Eminem', 'Kylie Minogue', 'Spiderbait', 'Regurgitator']

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<Mode>('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const q = query.trim()
    if (!q) { setResults([]); return }

    setSearching(true)
    const timer = setTimeout(() => {
      searchArchive({ q, mode })
        .then(setResults)
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query, mode])

  const hasQuery = query.trim().length > 0

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '46px 34px 80px' }}>
      <div style={{
        fontFamily: "'VT323',monospace", fontSize: 24,
        color: 'oklch(0.86 0.13 200)', letterSpacing: '.2em', marginBottom: 14,
      }}>» SEARCH THE ARCHIVE</div>

      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span style={{
          position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
          fontFamily: "'VT323',monospace", fontSize: 28,
          color: 'oklch(0.78 0.22 350)', pointerEvents: 'none', lineHeight: 1,
        }}>⍾</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="date, artist or song…"
          style={{
            width: '100%', padding: '18px 18px 18px 56px',
            background: '#0b0b10', border: '1px solid #2a2a34', borderRadius: 3,
            color: '#fff', fontFamily: "'VT323',monospace", fontSize: 30,
            outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'oklch(0.55 0.18 350)' }}
          onBlur={e => { e.target.style.borderColor = '#2a2a34' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {(['all', 'date', 'artist'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              fontFamily: "'VT323',monospace", fontSize: 22,
              padding: '6px 18px',
              border: `1px solid ${mode === m ? 'oklch(0.86 0.13 200)' : '#2a2a34'}`,
              background: mode === m ? 'oklch(0.86 0.13 200)' : 'transparent',
              color: mode === m ? '#08080c' : '#8a8a95',
              cursor: 'pointer',
            }}
          >{m === 'all' ? 'ALL' : m === 'date' ? 'BY DATE' : 'ARTIST / SONG'}</button>
        ))}
      </div>

      {!hasQuery ? (
        <div>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#5a5a64', marginBottom: 12 }}>
            TRY SEARCHING
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map(s => (
              <SuggestionChip key={s} label={s} onClick={() => setQuery(s)} />
            ))}
          </div>
        </div>
      ) : searching ? (
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 24, color: '#5a5a64' }}>
          SCANNING…
        </div>
      ) : results.length === 0 ? (
        <div style={{
          fontFamily: "'VT323',monospace", fontSize: 26, color: '#5a5a64',
          textAlign: 'center', marginTop: 40,
        }}>░░░ NO SIGNAL — nothing matched "{query}" ░░░</div>
      ) : (
        <div>
          <div style={{
            fontFamily: "'VT323',monospace", fontSize: 24, color: '#8a8a95',
            borderBottom: '1px solid #1c1c24', paddingBottom: 12, marginBottom: 16,
          }}>
            {results.length} result(s) for "{query}"
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map(r => (
              <ResultRow
                key={`${r.match_type}-${r.playlist_id}`}
                result={r}
                onClick={() => navigate(
                  r.match_type === 'track' && r.video_id
                    ? `/playlist/${r.playlist_id}/video/${r.video_id}`
                    : `/playlist/${r.playlist_id}`
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SuggestionChip({ label, onClick }: { label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "'VT323',monospace", fontSize: 22,
        color: hovered ? '#fff' : '#b6b6c0',
        border: `1px solid ${hovered ? 'oklch(0.5 0.16 350)' : '#2a2a34'}`,
        background: 'transparent', padding: '7px 16px', cursor: 'pointer',
      }}
    >{label}</button>
  )
}

function ResultRow({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const { dd, monYr, dateShort } = parseDateParts(result.aired_date)

  const primary = result.match_type === 'track'
    ? `${result.track_artist} — ${result.track_title}`
    : result.playlist_title

  const extra = result.track_match_count && result.track_match_count > 1
    ? `  +${result.track_match_count - 1} more`
    : ''
  const secondary = result.match_type === 'track'
    ? `${dateShort}  ·  track ${result.track_position}${extra}`
    : dateShort

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid', gridTemplateColumns: '108px 1fr auto',
        gap: 22, padding: '14px 20px', cursor: 'pointer',
        border: `1px solid ${hovered ? 'oklch(0.5 0.16 350)' : '#1c1c24'}`,
        background: hovered ? '#101018' : '#0b0b10',
        alignItems: 'center',
      }}
    >
      <div style={{ borderRight: '1px solid #1c1c24', paddingRight: 16 }}>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 34, color: '#fff', lineHeight: 1 }}>{dd}</div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 17, color: 'oklch(0.78 0.22 350)', letterSpacing: '.1em' }}>{monYr}</div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: 17,
          textTransform: 'uppercase', color: '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{primary}</div>
        <div style={{
          fontFamily: "'VT323',monospace", fontSize: 20, color: '#8a8a95',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{secondary}</div>
      </div>
      <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: 'oklch(0.78 0.22 350)', whiteSpace: 'nowrap' }}>
        OPEN ▶
      </div>
    </div>
  )
}
