import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { getPlaylists, getPlaylist, type Playlist, type Video } from '../api/playlists'
import { patchVideoStatus, patchVideoMatch, searchYoutubeMatches, rescrapePlaylist, triggerScrape, getIssueNeighbours, type YouTubeResult, type IssueNeighbours } from '../api/admin'

type MatchStatus = 'verified' | 'review' | 'rejected' | 'novideo'
type FilterKey = 'all' | MatchStatus

const STATUS: Record<MatchStatus, { label: string; color: string; bg: string; border: string }> = {
  verified: { label: 'Verified',     color: 'oklch(0.72 0.13 155)', bg: 'oklch(0.72 0.13 155 / .14)', border: 'oklch(0.72 0.13 155 / .3)' },
  review:   { label: 'Needs review', color: 'oklch(0.8 0.13 75)',   bg: 'oklch(0.8 0.13 75 / .14)',   border: 'oklch(0.8 0.13 75 / .3)'   },
  rejected: { label: 'Rejected',     color: 'oklch(0.68 0.16 25)',  bg: 'oklch(0.68 0.16 25 / .14)',  border: 'oklch(0.68 0.16 25 / .3)'  },
  novideo:  { label: 'No video',     color: '#8a93a3',              bg: 'rgba(138,147,163,.14)',       border: 'rgba(138,147,163,.3)'      },
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'review',   label: 'Needs review' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'novideo',  label: 'No video' },
  { key: 'verified', label: 'Verified' },
]

const COLS = '38px minmax(110px,0.9fr) minmax(120px,1fr) minmax(280px,1.8fr) 132px 104px'

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT']

function fmtDate(d: string) {
  const [yyyy, mm, dd] = d.split('-')
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  return `${DAYS[date.getDay()]} ${Number(dd)} ${MONTHS[Number(mm) - 1]} ${yyyy}`
}

const VALID_STATUSES = new Set<string>(['verified', 'review', 'rejected', 'novideo'])

function statusOf(v: Video): MatchStatus {
  const s = v.match_status
  return (s && VALID_STATUSES.has(s)) ? s as MatchStatus : 'review'
}

export default function AdminPage() {
  const { logout } = useAuth()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [tracks, setTracks] = useState<Video[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [comboOpen, setComboOpen] = useState(false)
  const [comboQuery, setComboQuery] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapingAll, setScrapingAll] = useState(false)
  const [playlistsLoaded, setPlaylistsLoaded] = useState(false)
  const [issueNeighbours, setIssueNeighbours] = useState<IssueNeighbours>({ prev: null, next: null })
  const [drawerTrack, setDrawerTrack] = useState<Video | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    getPlaylists().then(ps => {
      setPlaylists(ps)
      if (ps.length) setSelectedId(ps[0].id)
      setPlaylistsLoaded(true)
    })
  }, [])

  const handleTriggerScrape = async () => {
    setScrapingAll(true)
    try {
      await triggerScrape()
      const ps = await getPlaylists()
      setPlaylists(ps)
      if (ps.length) setSelectedId(ps[0].id)
    } finally {
      setScrapingAll(false)
    }
  }

  useEffect(() => {
    if (!selectedId) return
    setLoadingTracks(true)
    setTracks([])
    setFilter('all')
    setSelectedIds(new Set())
    getPlaylist(selectedId)
      .then(p => setTracks(p.videos))
      .finally(() => setLoadingTracks(false))
    getIssueNeighbours(selectedId).then(setIssueNeighbours)
  }, [selectedId])

  const updateTrack = (videoId: number, patch: Partial<Video>) =>
    setTracks(ts => ts.map(t => t.id === videoId ? { ...t, ...patch } : t))

  const setStatus = (videoId: number, status: MatchStatus) => {
    updateTrack(videoId, { match_status: status })
    patchVideoStatus(videoId, status)
  }

  const toggleSelect = (id: number) =>
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const counts: Record<FilterKey, number> = { all: tracks.length, verified: 0, review: 0, rejected: 0, novideo: 0 }
  tracks.forEach(t => counts[statusOf(t)]++)
  const verifiedPct = tracks.length ? Math.round((counts.verified / tracks.length) * 100) : 0
  const needsAttention = counts.review + counts.rejected + counts.novideo

  const shown = filter === 'all' ? tracks : tracks.filter(t => statusOf(t) === filter)
  const selectedPlaylist = playlists.find(p => p.id === selectedId)

  const filteredPlaylists = comboQuery
    ? playlists.filter(p => `${fmtDate(p.aired_date)} ${p.title}`.toLowerCase().includes(comboQuery.toLowerCase()))
    : playlists

  const allShownSelected = shown.length > 0 && shown.every(t => selectedIds.has(t.id))
  const someShownSelected = shown.some(t => selectedIds.has(t.id))

  const toggleSelectAll = () => {
    if (allShownSelected) {
      setSelectedIds(prev => { const n = new Set(prev); shown.forEach(t => n.delete(t.id)); return n })
    } else {
      setSelectedIds(prev => { const n = new Set(prev); shown.forEach(t => n.add(t.id)); return n })
    }
  }

  const handleRescrape = async () => {
    if (!selectedId) return
    setScraping(true)
    try {
      await rescrapePlaylist(selectedId)
      const [p, neighbours] = await Promise.all([getPlaylist(selectedId), getIssueNeighbours(selectedId)])
      setTracks(p.videos)
      setSelectedIds(new Set())
      setIssueNeighbours(neighbours)
    } finally {
      setScraping(false)
    }
  }

  const bulkSetStatus = (status: MatchStatus) => {
    const ids = [...selectedIds]
    setTracks(ts => ts.map(t => selectedIds.has(t.id) ? { ...t, match_status: status } : t))
    setSelectedIds(new Set())
    Promise.all(ids.map(id => patchVideoStatus(id, status)))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0e11', color: '#e6e8ec', fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 22px', height: 54,
        background: '#101217', borderBottom: '1px solid #23262e',
        boxShadow: '0 2px 0 rgba(0,0,0,.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', font: "700 17px 'Oswald',sans-serif", letterSpacing: '.32em', textTransform: 'uppercase' }}>
            RAGE<span style={{ fontSize: '.6em', verticalAlign: '0.45em', letterSpacing: 0, marginLeft: '-.04em' }}>2</span>
          </Link>
          <span style={{
            font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: '.12em',
            color: 'oklch(0.7 0.16 350)',
            border: '1px solid oklch(0.7 0.16 350 / .4)',
            borderRadius: 3, padding: '3px 8px',
          }}>ADMIN</span>
        </div>
        <AdminBtn onClick={logout}>Sign out</AdminBtn>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '18px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>

          {/* Playlist selector */}
          <div>
            <div style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: '.14em', color: '#7f8794', textTransform: 'uppercase', marginBottom: 7 }}>
              EDITING PLAYLIST
            </div>
            {playlistsLoaded && playlists.length === 0 ? (
              <button
                onClick={handleTriggerScrape}
                disabled={scrapingAll}
                style={{
                  padding: '9px 16px', borderRadius: 6,
                  background: 'oklch(0.7 0.16 350 / .1)',
                  border: '1px solid oklch(0.7 0.16 350 / .4)',
                  color: scrapingAll ? '#4d5460' : 'oklch(0.82 0.14 350)',
                  cursor: scrapingAll ? 'default' : 'pointer',
                  font: "600 13px 'IBM Plex Sans',sans-serif",
                }}
              >{scrapingAll ? 'Scraping…' : 'No playlists found — trigger scrape'}</button>
            ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IssueNavBtn
                title={issueNeighbours.next ? `◀  ${issueNeighbours.next.title}` : 'No newer playlists with issues'}
                disabled={!issueNeighbours.next}
                onClick={() => issueNeighbours.next && setSelectedId(issueNeighbours.next.id)}
              >◀</IssueNavBtn>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', minWidth: 320 }}>
                <input
                  value={comboOpen ? comboQuery : (selectedPlaylist ? `${fmtDate(selectedPlaylist.aired_date)}  ·  ${selectedPlaylist.title}` : '')}
                  onChange={e => setComboQuery(e.target.value)}
                  onFocus={() => { setComboOpen(true); setComboQuery('') }}
                  onBlur={() => setTimeout(() => setComboOpen(false), 150)}
                  placeholder="Select playlist…"
                  style={{
                    width: '100%', padding: '9px 32px 9px 13px',
                    background: '#181b21', color: '#e6e8ec',
                    border: `1px solid ${comboOpen ? '#3a4150' : '#2b2f39'}`, borderRadius: 6,
                    font: "600 14px 'IBM Plex Sans'", outline: 'none',
                  }}
                />
                <span style={{ position: 'absolute', right: 11, color: '#7f8794', fontSize: 11, pointerEvents: 'none' }}>▾</span>
              </div>
              {comboOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 40,
                    width: 420, maxHeight: 340, overflowY: 'auto',
                    background: '#14161b', border: '1px solid #2b2f39', borderRadius: 8,
                    boxShadow: '0 20px 50px rgba(0,0,0,.5)', padding: 5,
                  }}>
                    {filteredPlaylists.length === 0 && (
                      <div style={{ padding: '10px 11px', font: "500 12px 'IBM Plex Mono',monospace", color: '#4d5460' }}>No results</div>
                    )}
                    {filteredPlaylists.map(p => (
                      <DropdownItem
                        key={p.id}
                        label={`${fmtDate(p.aired_date)}  ·  ${p.title}`}
                        selected={p.id === selectedId}
                        onClick={() => { setSelectedId(p.id); setComboOpen(false); setComboQuery('') }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handleRescrape}
              disabled={!selectedId || scraping}
              title="Re-scrape this playlist"
              style={{
                height: 38, padding: '0 13px', borderRadius: 6, flexShrink: 0,
                background: 'none', border: '1px solid #2b2f39',
                color: scraping ? '#4d5460' : '#9aa0ab',
                cursor: selectedId && !scraping ? 'pointer' : 'default',
                fontSize: 15, fontFamily: "'IBM Plex Sans',sans-serif",
              }}
            >{scraping ? '…' : '↺'}</button>
              <IssueNavBtn
                title={issueNeighbours.prev ? `▶  ${issueNeighbours.prev.title}` : 'No older playlists with issues'}
                disabled={!issueNeighbours.prev}
                onClick={() => issueNeighbours.prev && setSelectedId(issueNeighbours.prev.id)}
              >▶</IssueNavBtn>
              {selectedPlaylist && (
                <a
                  href={selectedPlaylist.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open on ABC website"
                  style={{
                    height: 38, width: 38, borderRadius: 6, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #2b2f39', color: '#7f8794',
                    fontSize: 14, textDecoration: 'none',
                  }}
                >↗</a>
              )}
            </div>
            )}
          </div>

          {/* Progress */}
          <div style={{ minWidth: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 12px 'IBM Plex Mono',monospace", color: '#9aa0ab', marginBottom: 6 }}>
              <span>{counts.verified} / {tracks.length} verified</span>
              <span style={{ color: '#7f8794' }}>{needsAttention} need attention</span>
            </div>
            <div style={{ height: 6, background: '#1b1e25', borderRadius: 3, overflow: 'hidden', border: '1px solid #23262e' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'oklch(0.72 0.13 155)',
                boxShadow: '0 0 8px oklch(0.72 0.13 155 / .5)',
                width: `${verifiedPct}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 18, borderBottom: '1px solid #23262e' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: 'none', border: 'none',
                borderBottom: `2px solid ${filter === f.key ? 'oklch(0.74 0.15 350)' : 'transparent'}`,
                padding: '9px 14px', marginBottom: -1,
                font: "600 13px 'IBM Plex Sans'", cursor: 'pointer',
                color: filter === f.key ? '#fff' : '#7f8794',
                display: 'inline-flex', alignItems: 'center', gap: 7,
              }}
            >
              {f.label}
              <span style={{ opacity: 0.6, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 22px 80px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: COLS,
          alignItems: 'center', padding: '11px 12px',
          borderBottom: '1px solid #23262e',
          font: "600 10.5px 'IBM Plex Mono',monospace",
          letterSpacing: '.1em', color: '#6b727f', textTransform: 'uppercase',
          position: 'sticky', top: 0, background: '#0d0e11', zIndex: 10,
        }}>
          <span><Checkbox checked={allShownSelected} indeterminate={someShownSelected && !allShownSelected} onChange={toggleSelectAll} /></span>
          <span>Artist</span>
          <span>Title</span>
          <span>Matched YouTube video</span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        {loadingTracks && (
          <div style={{ textAlign: 'center', padding: '54px 0', color: '#6b727f', font: "500 13px 'IBM Plex Mono',monospace" }}>
            Loading…
          </div>
        )}

        {!loadingTracks && shown.length === 0 && (
          <div style={{ textAlign: 'center', padding: '54px 0', color: '#6b727f', font: "500 13px 'IBM Plex Mono',monospace" }}>
            No tracks in this filter.
          </div>
        )}

        {shown.map(track => (
          <TrackRow
            key={track.id} track={track} onSetStatus={setStatus} onFix={setDrawerTrack}
            selected={selectedIds.has(track.id)} onToggle={toggleSelect} anySelected={selectedIds.size > 0}
          />
        ))}
      </div>

      {selectedIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
          background: '#14161b', borderTop: '1px solid #2b2f39',
          padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 -8px 32px rgba(0,0,0,.5)',
        }}>
          <span style={{ font: "500 13px 'IBM Plex Mono',monospace", color: '#9aa0ab', flexShrink: 0 }}>
            {selectedIds.size} selected
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <BulkBtn color="oklch(0.72 0.13 155)" onClick={() => bulkSetStatus('verified')}>✓ Verify</BulkBtn>
            <BulkBtn color="oklch(0.68 0.16 25)"  onClick={() => bulkSetStatus('rejected')}>✕ Reject</BulkBtn>
            <BulkBtn color="#8a93a3"               onClick={() => bulkSetStatus('novideo')}>No video</BulkBtn>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <AdminBtn onClick={() => setSelectedIds(new Set())}>Clear</AdminBtn>
          </div>
        </div>
      )}

      {drawerTrack && (
        <FixMatchDrawer
          track={drawerTrack}
          onClose={() => setDrawerTrack(null)}
          onSaved={(id, patch) => { updateTrack(id, patch); setDrawerTrack(null) }}
        />
      )}
    </div>
  )
}

function TrackRow({ track, onSetStatus, onFix, selected, onToggle, anySelected }: {
  track: Video
  onSetStatus: (id: number, s: MatchStatus) => void
  onFix: (track: Video) => void
  selected: boolean
  onToggle: (id: number) => void
  anySelected: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const st = STATUS[statusOf(track)]
  const isVerified = statusOf(track) === 'verified'
  const isRejected = statusOf(track) === 'rejected'
  const showCheckbox = anySelected || hovered

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid', gridTemplateColumns: COLS,
        alignItems: 'center', padding: '7px 12px',
        borderBottom: '1px solid #1a1d23',
        background: selected ? 'oklch(0.7 0.16 350 / .06)' : hovered ? '#15171d' : 'transparent',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {showCheckbox
          ? <Checkbox checked={selected} onChange={() => onToggle(track.id)} />
          : <span style={{ font: "500 13px 'IBM Plex Mono',monospace", color: '#6b727f' }}>{String(track.position).padStart(2, '0')}</span>
        }
      </span>

      <span style={{ paddingRight: 10, fontSize: 13.5, fontWeight: 500, color: '#e6e8ec', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {track.artist}
      </span>

      <span style={{ paddingRight: 12, fontSize: 13.5, color: '#cdd2da', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {track.title}
      </span>

      {/* Matched video */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, paddingRight: 14 }}>
        <div style={{
          width: 60, height: 34, borderRadius: 3, flexShrink: 0, overflow: 'hidden',
          background: 'linear-gradient(135deg,#1b1f27,#2b313d)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {track.thumbnail
            ? <img src={track.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>▶</span>
          }
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          {track.youtube_id ? (
            <>
              <div style={{ fontSize: 13, color: '#dfe3e9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {track.artist} — {track.title}
              </div>
              <div style={{ font: "400 11px 'IBM Plex Mono',monospace", color: '#6b727f', marginTop: 2 }}>
                {track.youtube_id}
              </div>
            </>
          ) : (
            <div style={{ font: "400 12px 'IBM Plex Mono',monospace", color: '#4d5460' }}>No match found</div>
          )}
        </div>
      </div>

      {/* Status chip */}
      <span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 9px', borderRadius: 4,
          font: "600 11px 'IBM Plex Sans'",
          color: st.color, background: st.bg,
          border: `1px solid ${st.border}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
          {st.label}
        </span>
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
        <ActionBtn
          title="Verify"
          active={isVerified}
          activeColor="oklch(0.72 0.13 155)"
          activeBorder="oklch(0.72 0.13 155 / .6)"
          activeBg="oklch(0.72 0.13 155 / .12)"
          onClick={() => onSetStatus(track.id, isVerified ? 'review' : 'verified')}
        >✓</ActionBtn>
        <ActionBtn
          title="Reject"
          active={isRejected}
          activeColor="oklch(0.68 0.16 25)"
          activeBorder="oklch(0.68 0.16 25 / .6)"
          activeBg="oklch(0.68 0.16 25 / .12)"
          onClick={() => onSetStatus(track.id, isRejected ? 'review' : 'rejected')}
        >✕</ActionBtn>
        <ActionBtn title="Fix match" hoverColor="oklch(0.8 0.14 350)" onClick={() => onFix(track)}>⚙</ActionBtn>
      </div>
    </div>
  )
}

function ActionBtn({ children, title, active, activeColor, activeBorder, activeBg, hoverColor, onClick }: {
  children: React.ReactNode
  title: string
  active?: boolean
  activeColor?: string
  activeBorder?: string
  activeBg?: string
  hoverColor?: string
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${active ? (activeBorder ?? '#2b2f39') : '#2b2f39'}`,
        borderRadius: 5,
        background: active ? (activeBg ?? 'none') : 'none',
        color: active ? (activeColor ?? '#9aa0ab') : hovered ? (hoverColor ?? '#cdd2da') : '#7f8794',
        cursor: 'pointer', fontSize: 13,
        fontFamily: "'IBM Plex Sans',sans-serif",
      }}
    >{children}</button>
  )
}

function AdminBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12,
        color: hovered ? '#cdd2da' : '#7f8794',
        border: `1px solid ${hovered ? '#3a4150' : '#2b2f39'}`,
        borderRadius: 4, padding: '6px 11px',
        background: 'none', cursor: 'pointer',
      }}
    >{children}</button>
  )
}

function IssueNavBtn({ children, title, disabled, onClick }: {
  children: React.ReactNode
  title: string
  disabled: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 38, width: 38, borderRadius: 6, flexShrink: 0,
        background: 'none', border: `1px solid ${disabled ? '#2b2f39' : hovered ? 'oklch(0.74 0.15 350 / .6)' : 'oklch(0.74 0.15 350 / .3)'}`,
        color: disabled ? '#3a4150' : hovered ? 'oklch(0.88 0.14 350)' : 'oklch(0.74 0.15 350)',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 12, fontFamily: "'IBM Plex Sans',sans-serif",
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >{children}</button>
  )
}

function Checkbox({ checked, indeterminate, onChange }: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
}) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onChange() }}
      style={{
        width: 16, height: 16, borderRadius: 3, flexShrink: 0, cursor: 'pointer',
        border: `1.5px solid ${checked || indeterminate ? 'oklch(0.74 0.15 350 / .7)' : '#3a4150'}`,
        background: checked ? 'oklch(0.7 0.16 350 / .2)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {checked     && <span style={{ color: 'oklch(0.82 0.14 350)', fontSize: 10, lineHeight: 1, userSelect: 'none' }}>✓</span>}
      {!checked && indeterminate && <span style={{ color: 'oklch(0.82 0.14 350)', fontSize: 12, lineHeight: 1, userSelect: 'none' }}>−</span>}
    </div>
  )
}

function BulkBtn({ children, color, onClick }: { children: React.ReactNode; color: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 13px', borderRadius: 5, fontSize: 13, fontWeight: 600,
        fontFamily: "'IBM Plex Sans',sans-serif", cursor: 'pointer',
        color: hovered ? color : '#9aa0ab',
        background: hovered ? `color-mix(in srgb, ${color} 15%, transparent)` : 'transparent',
        border: `1px solid ${hovered ? `color-mix(in srgb, ${color} 45%, transparent)` : '#2b2f39'}`,
        transition: 'color 0.1s, background 0.1s, border-color 0.1s',
      }}
    >{children}</button>
  )
}

function parseYouTubeId(input: string): string | null {
  const s = input.trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s
  try {
    const url = new URL(s)
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null
    if (url.hostname.endsWith('youtube.com')) {
      const v = url.searchParams.get('v')
      if (v) return v
      const m = url.pathname.match(/\/(?:embed|shorts|v)\/([A-Za-z0-9_-]{11})/)
      if (m) return m[1]
    }
  } catch {}
  return null
}

function FixMatchDrawer({ track, onClose, onSaved }: {
  track: Video
  onClose: () => void
  onSaved: (id: number, patch: Partial<Video>) => void
}) {
  const [query, setQuery] = useState(`${track.artist} ${track.title}`)
  const [results, setResults] = useState<YouTubeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<YouTubeResult | null>(null)
  const [override, setOverride] = useState('')
  const [saving, setSaving] = useState(false)
  const didMount = useRef(false)

  const overrideId = parseYouTubeId(override)
  const saveTarget = overrideId
    ? { youtube_id: overrideId, thumbnail: `https://img.youtube.com/vi/${overrideId}/mqdefault.jpg` }
    : selected
    ? { youtube_id: selected.youtube_id, thumbnail: selected.thumbnail }
    : null

  useEffect(() => {
    if (didMount.current) return
    didMount.current = true
    doSearch(`${track.artist} ${track.title}`)
  }, [])

  async function doSearch(q: string) {
    if (!q.trim()) return
    setLoading(true)
    setResults([])
    setSelected(null)
    try {
      setResults(await searchYoutubeMatches(q))
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!saveTarget) return
    setSaving(true)
    try {
      await patchVideoMatch(track.id, saveTarget.youtube_id, saveTarget.thumbnail)
      onSaved(track.id, { youtube_id: saveTarget.youtube_id, thumbnail: saveTarget.thumbnail, match_status: 'verified' })
    } finally {
      setSaving(false)
    }
  }

  async function handleNoVideo() {
    setSaving(true)
    try {
      await patchVideoStatus(track.id, 'novideo')
      onSaved(track.id, { match_status: 'novideo' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,.45)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, zIndex: 50,
        background: '#14161b', borderLeft: '1px solid #2b2f39',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,.5)',
        fontFamily: "'IBM Plex Sans',sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #23262e', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ font: "600 10.5px 'IBM Plex Mono',monospace", letterSpacing: '.14em', color: '#6b727f', textTransform: 'uppercase', marginBottom: 6 }}>Fix match</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#e6e8ec' }}>{track.artist}</div>
              <div style={{ fontSize: 13, color: '#9aa0ab', marginTop: 2 }}>{track.title}</div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#6b727f', cursor: 'pointer', fontSize: 18, padding: '2px 4px', lineHeight: 1, flexShrink: 0 }}
            >✕</button>
          </div>
        </div>

        {/* Current match */}
        {track.youtube_id && (
          <div style={{ padding: '11px 20px', borderBottom: '1px solid #1e2128', background: '#111318', flexShrink: 0 }}>
            <div style={{ font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: '.12em', color: '#6b727f', textTransform: 'uppercase', marginBottom: 7 }}>Current match</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {track.thumbnail && <img src={track.thumbnail} alt="" style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />}
              <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: '#5a6170' }}>{track.youtube_id}</span>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e2128', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch(query)}
              placeholder="Search YouTube…"
              style={{
                flex: 1, padding: '8px 12px',
                background: '#1b1e25', border: '1px solid #2b2f39', borderRadius: 5,
                color: '#e6e8ec', fontSize: 13, outline: 'none',
                fontFamily: "'IBM Plex Sans',sans-serif",
              }}
            />
            <button
              onClick={() => doSearch(query)}
              disabled={loading}
              style={{
                padding: '8px 14px', borderRadius: 5, flexShrink: 0,
                background: '#1b1e25', border: '1px solid #2b2f39',
                color: loading ? '#4d5460' : '#cdd2da', fontSize: 13, fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
                fontFamily: "'IBM Plex Sans',sans-serif",
              }}
            >Search</button>
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b727f', font: "500 12px 'IBM Plex Mono',monospace" }}>Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#4d5460', font: "500 12px 'IBM Plex Mono',monospace" }}>No results</div>
          )}
          {results.map(r => (
            <ResultItem key={r.youtube_id} result={r} selected={!overrideId && selected?.youtube_id === r.youtube_id} onSelect={r => { setSelected(r); setOverride('') }} />
          ))}
        </div>

        {/* Override */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #1e2128', flexShrink: 0 }}>
          <div style={{ font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: '.12em', color: '#6b727f', textTransform: 'uppercase', marginBottom: 8 }}>Override</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              value={override}
              onChange={e => setOverride(e.target.value)}
              placeholder="Paste YouTube URL or video ID…"
              style={{
                flex: 1, padding: '8px 12px',
                background: '#1b1e25',
                border: `1px solid ${overrideId ? 'oklch(0.74 0.15 350 / .5)' : override.length > 0 ? 'oklch(0.68 0.16 25 / .5)' : '#2b2f39'}`,
                borderRadius: 5, color: '#e6e8ec', fontSize: 13, outline: 'none',
                fontFamily: "'IBM Plex Mono',monospace",
              }}
            />
            {overrideId && (
              <img
                src={`https://img.youtube.com/vi/${overrideId}/mqdefault.jpg`}
                alt=""
                style={{ width: 64, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #23262e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button
            onClick={handleNoVideo}
            disabled={saving}
            style={{
              background: 'none', border: '1px solid #2b2f39', borderRadius: 5,
              color: '#7f8794', cursor: 'pointer', fontSize: 13,
              fontFamily: "'IBM Plex Sans',sans-serif", padding: '7px 12px',
            }}
          >No video</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <AdminBtn onClick={onClose}>Cancel</AdminBtn>
            <button
              onClick={handleSave}
              disabled={!saveTarget || saving}
              style={{
                padding: '7px 16px', borderRadius: 5,
                background: saveTarget ? 'oklch(0.7 0.16 350 / .15)' : '#1b1e25',
                border: `1px solid ${saveTarget ? 'oklch(0.7 0.16 350 / .5)' : '#2b2f39'}`,
                color: saveTarget ? 'oklch(0.82 0.14 350)' : '#4d5460',
                cursor: saveTarget && !saving ? 'pointer' : 'default', fontSize: 13, fontWeight: 600,
                fontFamily: "'IBM Plex Sans',sans-serif",
              }}
            >{saving ? 'Saving…' : 'Save match'}</button>
          </div>
        </div>
      </div>
    </>
  )
}

function ResultItem({ result, selected, onSelect }: {
  result: YouTubeResult
  selected: boolean
  onSelect: (r: YouTubeResult) => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={() => onSelect(result)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 12, padding: '9px 10px',
        borderRadius: 6, marginBottom: 3, cursor: 'pointer',
        border: `1px solid ${selected ? 'oklch(0.74 0.15 350 / .5)' : 'transparent'}`,
        background: selected ? 'oklch(0.7 0.16 350 / .1)' : hovered ? '#1b1e25' : 'transparent',
      }}
    >
      <img src={result.thumbnail} alt="" style={{ width: 100, height: 56, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#dfe3e9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>{result.title}</div>
        <div style={{ font: "400 11.5px 'IBM Plex Mono',monospace", color: '#7f8794', marginTop: 3 }}>{result.channel}</div>
        <div style={{ font: "400 11px 'IBM Plex Mono',monospace", color: '#4d5460', marginTop: 2 }}>{result.youtube_id}</div>
      </div>
    </div>
  )
}

function DropdownItem({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '9px 11px', borderRadius: 5,
        fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        color: selected ? 'oklch(0.82 0.14 350)' : '#cdd2da',
        background: selected ? 'oklch(0.7 0.16 350 / .14)' : hovered ? '#1b1e25' : 'transparent',
      }}
    >{label}</div>
  )
}
