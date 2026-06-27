import { useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPlaylist, type PlaylistWithVideos, type Video } from '../api/playlists'
import { useYouTubePlayer } from '../hooks/useYouTubePlayer'
import { useAutoplay } from '../providers/AutoplayProvider'

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const WEEK_DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT']

function parseDateParts(aired_date: string) {
  const [yyyy, mm, dd] = aired_date.split('-')
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  return {
    dateLong: `${Number(dd)} ${MONTHS[Number(mm) - 1]} ${yyyy}`,
    dateShort: `${WEEK_DAYS[date.getDay()]} ${Number(dd)} ${MONTHS[Number(mm) - 1]} ${yyyy}`,
  }
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  return `${m}:${String(ss).padStart(2, '0')}`
}

function TrackRow({
  video, nowPlaying, onClick,
}: {
  video: Video; nowPlaying: boolean; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '9px 24px 9px 27px',
        borderBottom: '1px solid rgba(28,28,36,.6)',
        cursor: 'pointer',
        background: (nowPlaying || hovered) ? '#101018' : 'transparent',
      }}
    >
      {nowPlaying && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: 'oklch(0.72 0.22 350)',
          boxShadow: '0 0 8px oklch(0.66 0.24 350)',
        }} />
      )}
      <span style={{
        fontFamily: "'VT323',monospace", fontSize: 22, color: '#4f4f59',
        width: 26, flexShrink: 0,
      }}>
        {String(video.position).padStart(2, '0')}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: 15,
          textTransform: 'uppercase', color: '#e9e9ef',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{video.artist}</div>
        <div style={{
          fontFamily: "'VT323',monospace", fontSize: 18, color: '#8a8a95',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{video.title}</div>
      </div>
    </div>
  )
}

export default function PlaylistPage() {
  const { id, videoId } = useParams<{ id: string; videoId?: string }>()
  const navigate = useNavigate()
  const [playlist, setPlaylist] = useState<PlaylistWithVideos | null>(null)
  const [nowIndex, setNowIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [autoplay] = useAutoplay()
  const [wrapperEl, setWrapperEl] = useState<HTMLDivElement | null>(null)
  const wrapperRef = useCallback((el: HTMLDivElement | null) => setWrapperEl(el), [])

  const videos = playlist?.videos ?? []
  const count = videos.length
  const nowTrack = videos[nowIndex]

  const { isPlaying, togglePlay, seekTo, elapsed, duration } = useYouTubePlayer(
    wrapperEl,
    nowTrack?.youtube_id ?? null,
    () => setNowIndex(i => Math.min(count - 1, i + 1)),
    autoplay,
  )

  useEffect(() => {
    setPlaylist(null)
    window.scrollTo(0, 0)
    if (id) {
      getPlaylist(Number(id))
        .then(data => {
          setPlaylist(data)
          if (videoId) {
            const idx = data.videos.findIndex(v => v.id === Number(videoId))
            setNowIndex(idx !== -1 ? idx : 0)
          } else {
            setNowIndex(0)
          }
        })
        .catch(() => setError('Failed to load playlist'))
    }
  }, [id, videoId])

  if (error) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '26px 34px 70px' }}>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 26, color: '#5a5a64' }}>
          ░░░ SIGNAL LOST ░░░
        </div>
      </div>
    )
  }
  if (!playlist) return null

  const { dateLong, dateShort } = parseDateParts(playlist.aired_date)
  const progress = duration > 0 ? elapsed / duration : 0
  const hasVideo = !!nowTrack?.youtube_id

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '26px 34px 70px' }}>
      <Link
        to="/"
        style={{
          display: 'inline-block',
          fontFamily: "'VT323',monospace", fontSize: 22, color: '#8a8a95',
          textDecoration: 'none', marginBottom: 18,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#8a8a95' }}
      >◀ BACK TO ARCHIVE</Link>

      <div style={{ border: '1px solid #1c1c24', borderRadius: 4, overflow: 'hidden', background: '#08080c' }}>

        {/* Episode header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 28px', borderBottom: '1px solid #1c1c24',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: 30, color: 'oklch(0.78 0.22 350)' }}>▶ PLAY</span>
            <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: 22, textTransform: 'uppercase', color: '#fff' }}>
              {dateLong}
            </span>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: 'oklch(0.86 0.13 200)' }}>
              {playlist.title}
            </span>
          </div>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 24, color: '#5a5a64' }}>
            SP · {count} CLIPS
          </div>
        </div>

        {/* Body: player + tracklist */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px' }}>

          {/* Player column */}
          <div style={{ padding: 28, borderRight: '1px solid #1c1c24', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Video area */}
            <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 3, overflow: 'hidden' }}>

              {/* YouTube player wrapper — callback ref fires when div mounts, triggering player init */}
              <div
                ref={wrapperRef}
                style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
              />

              {/* Striped placeholder shown when no youtube_id for this track */}
              {!hasVideo && (
                <div style={{
                  position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 1,
                  background: 'repeating-linear-gradient(135deg,#15151c 0 16px,#0f0f15 16px 32px)',
                  boxShadow: 'inset 0 0 60px rgba(0,0,0,.7)',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
                    background: 'radial-gradient(ellipse at center,oklch(0.66 0.24 350/.15) 0%,transparent 70%)',
                    animation: 'crtflick 4s ease-in-out infinite',
                    pointerEvents: 'none',
                  }} />
                  <div style={{
                    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: 28, color: '#5a5a64' }}>
                      [ YOUTUBE CLIP ]
                    </span>
                  </div>
                </div>
              )}

              {/* OSD + now-playing overlay — fades out a moment after playback starts */}
              <div style={{
                position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 2, pointerEvents: 'none',
                opacity: isPlaying ? 0 : 1,
                transition: isPlaying ? 'opacity 0.8s ease 2s' : 'opacity 0.3s ease',
              }}>
                <div style={{
                  position: 'absolute', top: 12, left: 14,
                  fontFamily: "'VT323',monospace", fontSize: 22,
                  color: 'rgba(233,233,239,.55)', letterSpacing: '.08em',
                }}>
                  CH 02{duration > 0 ? ` · ${fmt(elapsed)}` : ''}
                </div>
                {nowTrack && (
                  <div style={{ position: 'absolute', bottom: 16, left: 18, right: 18 }}>
                    <div style={{
                      fontFamily: "'VT323',monospace", fontSize: 18,
                      color: 'oklch(0.86 0.13 200)', letterSpacing: '.22em', marginBottom: 4,
                    }}>▶ NOW PLAYING</div>
                    <div style={{
                      fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 42,
                      textTransform: 'uppercase', color: '#fff', lineHeight: 1,
                      textShadow: '2px 0 oklch(0.66 0.24 25/.8),-2px 0 oklch(0.86 0.13 200/.8)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{nowTrack.artist}</div>
                    <div style={{
                      fontFamily: "'Oswald',sans-serif", fontWeight: 500, fontSize: 28,
                      textTransform: 'uppercase', color: '#d8d8e0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{nowTrack.title}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Transport */}
            <div>
              {/* Scrub bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: 'oklch(0.78 0.22 350)', minWidth: 38 }}>
                  {fmt(elapsed)}
                </span>
                <div
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    seekTo(((e.clientX - rect.left) / rect.width) * duration)
                  }}
                  style={{
                    flex: 1, height: 4, background: '#23232c', borderRadius: 2,
                    position: 'relative', cursor: duration > 0 ? 'pointer' : 'default',
                  }}
                >
                  <div style={{
                    width: `${progress * 100}%`, height: '100%',
                    background: 'oklch(0.72 0.22 350)',
                    borderRadius: 2,
                    boxShadow: '0 0 8px oklch(0.66 0.24 350)',
                    transition: 'width .5s linear',
                  }} />
                </div>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: '#73737e', minWidth: 38, textAlign: 'right' }}>
                  {duration > 0 ? fmt(duration) : '—:——'}
                </span>
              </div>
              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                <button
                  onClick={() => setNowIndex(i => Math.max(0, i - 1))}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    fontFamily: "'VT323',monospace", fontSize: 30,
                    color: '#b6b6c0', opacity: nowIndex > 0 ? 1 : .3,
                  }}
                >⏮</button>
                <button
                  onClick={togglePlay}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    fontFamily: "'VT323',monospace", fontSize: 30,
                    color: 'oklch(0.78 0.22 350)',
                    textShadow: '0 0 12px oklch(0.66 0.24 350)',
                  }}
                >{isPlaying ? '⏸' : '▶'}</button>
                <button
                  onClick={() => setNowIndex(i => Math.min(count - 1, i + 1))}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    fontFamily: "'VT323',monospace", fontSize: 30,
                    color: '#b6b6c0', opacity: nowIndex < count - 1 ? 1 : .3,
                  }}
                >⏭</button>
                <span style={{ marginLeft: 'auto', fontFamily: "'VT323',monospace", fontSize: 22, color: '#5a5a64' }}>
                  ▣ TRACKING ████░░
                </span>
              </div>
            </div>
          </div>

          {/* Tracklist column */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid #1c1c24', padding: '18px 24px 12px',
            }}>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: 24, color: 'oklch(0.86 0.13 200)' }}>PLAYLIST</span>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#5a5a64' }}>{count} CLIPS</span>
            </div>
            <div style={{ maxHeight: 560, overflowY: 'auto', padding: '6px 0' }}>
              {videos.map((v, i) => (
                <TrackRow
                  key={v.id}
                  video={v}
                  nowPlaying={i === nowIndex}
                  onClick={() => setNowIndex(i)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Episode browser */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 60, padding: '0 28px',
          borderTop: '1px solid #1c1c24', background: '#0b0b10',
        }}>
          <EpisodeNavButton
            label={playlist.prev ? `◀ ${playlist.prev.title}` : '◀ OLDEST'}
            disabled={!playlist.prev}
            onClick={() => playlist.prev && navigate(`/playlist/${playlist.prev.id}`)}
          />
          <span style={{
            fontFamily: "'VT323',monospace", fontSize: 22,
            color: 'oklch(0.78 0.22 350)',
            textShadow: '0 0 10px oklch(0.66 0.24 350)',
          }}>{dateShort}</span>
          <EpisodeNavButton
            label={playlist.next ? `${playlist.next.title} ▶` : 'NEWEST ▶'}
            disabled={!playlist.next}
            onClick={() => playlist.next && navigate(`/playlist/${playlist.next.id}`)}
          />
        </div>
      </div>
    </div>
  )
}

function EpisodeNavButton({ label, disabled, onClick }: {
  label: string; disabled: boolean; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none', border: 'none', padding: 0, cursor: disabled ? 'default' : 'pointer',
        fontFamily: "'VT323',monospace", fontSize: 22,
        color: disabled ? '#3a3a44' : hovered ? '#fff' : '#8a8a95',
        transition: 'color 0.15s',
      }}
    >{label}</button>
  )
}
