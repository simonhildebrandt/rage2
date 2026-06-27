import { useEffect, useRef, useState } from 'react'

// Module-level API state — one script tag, one global callback, shared across all instances
let ytState: 'idle' | 'loading' | 'ready' = 'idle'
const ytQueue = new Set<() => void>()

function onYTReady(cb: () => void) {
  if (ytState === 'ready') { cb(); return }
  ytQueue.add(cb)
  if (ytState === 'idle') {
    ytState = 'loading'
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(s)
    ;(window as any).onYouTubeIframeAPIReady = () => {
      console.log('YouTube IFrame API ready')
      ytState = 'ready'
      ytQueue.forEach(fn => fn())
      ytQueue.clear()
    }
  }
}

export function useYouTubePlayer(
  wrapperEl: HTMLDivElement | null,
  videoId: string | null | undefined,
  onEnded: () => void,
  autoplay: boolean,
) {
  const playerRef = useRef<YT.Player | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playerError, setPlayerError] = useState<string | null>(null)

  // Keep latest callback in a ref — the player's onStateChange closure never goes stale
  const onEndedRef = useRef(onEnded)
  useEffect(() => { onEndedRef.current = onEnded })

  // Track the latest videoId/autoplay so deferred player creation uses current values
  const latestVideoId = useRef(videoId)
  useEffect(() => { latestVideoId.current = videoId })
  const latestAutoplay = useRef(autoplay)
  useEffect(() => { latestAutoplay.current = autoplay })

  // Create the player when the wrapper element becomes available.
  // Depends on wrapperEl so it fires once the component has actually rendered the div
  // (avoids the race where playlist loads after mount and the div isn't in the DOM yet).
  useEffect(() => {
    if (!wrapperEl) return

    const playerDiv = document.createElement('div')
    wrapperEl.appendChild(playerDiv)
    let cancelled = false

    onYTReady(() => {
      if (cancelled) return
      if (!latestVideoId.current) {
        setPlayerError('No video found yet.')
        return
      }
      playerRef.current = new YT.Player(playerDiv, {
        videoId: latestVideoId.current ?? undefined,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: latestAutoplay.current ? 1 : 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
        },
        events: {
          onStateChange: e => {
            const playing = e.data === YT.PlayerState.PLAYING
            isPlayingRef.current = playing
            setIsPlaying(playing)
            if (e.data === YT.PlayerState.ENDED) onEndedRef.current()
          },
          onError: (e: { data: number }) => {
            const msg =
              e.data === 2   ? 'Invalid video ID' :
              e.data === 100 ? 'Video unavailable' :
              (e.data === 101 || e.data === 150) ? 'Video cannot be embedded' :
              'Playback error'
            setPlayerError(msg)
          },
        },
      })
    })

    return () => {
      cancelled = true
      isPlayingRef.current = false
      playerRef.current?.destroy()
      playerRef.current = null
      setIsPlaying(false)
    }
  }, [wrapperEl])

  // Load a new video when videoId changes after the player is created.
  // Keep playing if already playing; otherwise respect the autoplay setting.
  useEffect(() => {
    if (!playerRef.current) return
    if (videoId) {
      isPlayingRef.current || latestAutoplay.current
        ? playerRef.current.loadVideoById(videoId)
        : playerRef.current.cueVideoById(videoId)
    } else {
      playerRef.current.stopVideo()
      isPlayingRef.current = false
      setIsPlaying(false)
    }
  }, [videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset scrub position and error on track change
  useEffect(() => {
    setElapsed(0)
    setDuration(0)
    setPlayerError(null)
  }, [videoId])

  // Poll for scrub position while playing
  useEffect(() => {
    const id = setInterval(() => {
      const p = playerRef.current
      if (!p) return
      try {
        setElapsed(p.getCurrentTime() ?? 0)
        setDuration(p.getDuration() ?? 0)
      } catch {}
    }, 500)
    return () => clearInterval(id)
  }, [])

  function togglePlay() {
    if (!playerRef.current) return
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo()
  }

  function seekTo(seconds: number) {
    playerRef.current?.seekTo(seconds, true)
  }

  return { playerRef, isPlaying, playerError, togglePlay, seekTo, elapsed, duration }
}
