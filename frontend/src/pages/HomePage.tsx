import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlaylists, type Playlist } from '../api/playlists'
import { getStats, type Stats } from '../api/stats'

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const WEEK_DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT']

function parseDateParts(aired_date: string) {
  const [yyyy, mm, dd] = aired_date.split('-')
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  return {
    dd: String(Number(dd)),
    monYr: `${MONTHS[Number(mm) - 1]} ${yyyy}`,
    yyyy,
    dow: WEEK_DAYS[date.getDay()],
  }
}

function formatSpan(oldestDate: string): string {
  const oldest = new Date(oldestDate)
  const now = new Date()
  const totalDays = Math.floor((now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24))
  const years = Math.floor(totalDays / 365)
  const days = totalDays % 365
  if (years === 0) return `${days} DAYS`
  return `${years} YR ${days} DAYS`
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [yearPlaylists, setYearPlaylists] = useState<Playlist[]>([])
  const [selectedYear, setSelectedYear] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getStats().then(s => {
      setStats(s)
      if (s.years.length > 0) {
        const latest = s.years[s.years.length - 1]
        setSelectedYear(latest)
        getPlaylists({ year: latest }).then(setYearPlaylists)
      }
    })
  }, [])

  const handleYearSelect = async (year: string) => {
    setSelectedYear(year)
    const data = await getPlaylists({ year })
    setYearPlaylists(data)
  }

  const displayed = yearPlaylists.slice().sort((a, b) => b.aired_date.localeCompare(a.aired_date))
  const years = stats?.years ?? []

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '46px 34px 80px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        flexWrap: 'wrap', gap: 16, marginBottom: 34,
      }}>
        <div>
          <div style={{
            fontFamily: "'VT323',monospace", fontSize: 24,
            color: 'oklch(0.86 0.13 200)', letterSpacing: '.2em', marginBottom: 8,
          }}>» PLAYLIST ARCHIVE</div>
          <h1 style={{
            fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 56,
            textTransform: 'uppercase', lineHeight: .95, color: '#fff', margin: 0,
          }}>Travel back through<br />rage's history</h1>
        </div>
        {stats && (
          <div style={{
            fontFamily: "'VT323',monospace", fontSize: 24, color: '#5a5a64',
            textAlign: 'right', lineHeight: 1.4,
          }}>
            <div>
              {stats.playlists.toLocaleString()} EPISODES / {stats.videos.toLocaleString()} CLIPS
            </div>
            {stats.oldest_aired_date && (
              <div>{formatSpan(stats.oldest_aired_date)}</div>
            )}
          </div>
        )}
      </div>

      <div style={{
        borderTop: '1px solid #1c1c24', borderBottom: '1px solid #1c1c24',
        padding: '16px 0', marginBottom: 26,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#5a5a64' }}>SEASON</span>
        {years.map(year => (
          <YearChip
            key={year}
            year={year}
            active={selectedYear === year}
            onClick={() => handleYearSelect(year)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {displayed.map(p => {
          const { dd, monYr, dow } = parseDateParts(p.aired_date)
          return (
            <EpisodeRow
              key={p.id}
              dd={dd} monYr={monYr} dow={dow}
              title={p.title}
              onClick={() => navigate(`/playlist/${p.id}`)}
            />
          )
        })}
      </div>
    </div>
  )
}

function YearChip({ year, active, onClick }: { year: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'VT323',monospace", fontSize: 24,
        letterSpacing: '.06em', padding: '5px 16px',
        border: `1px solid ${active ? 'oklch(0.78 0.22 350)' : '#2a2a34'}`,
        background: active ? 'oklch(0.78 0.22 350)' : 'transparent',
        color: active ? '#08080c' : '#b6b6c0',
        boxShadow: active ? '0 0 14px oklch(0.66 0.24 350/.5)' : 'none',
        cursor: 'pointer',
      }}
    >{year}</button>
  )
}

function EpisodeRow({
  dd, monYr, dow, title, onClick,
}: {
  dd: string; monYr: string; dow: string; title: string; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '130px 1fr auto',
        gap: 24,
        padding: '18px 22px',
        border: `1px solid ${hovered ? 'oklch(0.5 0.16 350)' : '#1c1c24'}`,
        background: hovered ? '#101018' : '#0b0b10',
        cursor: 'pointer',
        alignItems: 'center',
      }}
    >
      <div style={{ borderRight: '1px solid #1c1c24', paddingRight: 20 }}>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 46, color: '#fff', lineHeight: .8 }}>{dd}</div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 20, color: 'oklch(0.78 0.22 350)', letterSpacing: '.12em' }}>{monYr}</div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#5a5a64' }}>{dow}</div>
      </div>

      <div style={{
        fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: 16,
        textTransform: 'uppercase', color: 'oklch(0.86 0.13 200)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{title}</div>

      <div style={{
        width: 46, height: 46, borderRadius: '50%',
        border: '1px solid #2a2a34',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'oklch(0.78 0.22 350)',
        textShadow: '0 0 10px oklch(0.66 0.24 350)',
        fontFamily: "'VT323',monospace", fontSize: 22,
        flexShrink: 0,
      }}>▶</div>
    </div>
  )
}
