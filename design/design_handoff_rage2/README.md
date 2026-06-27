# Handoff: Rage² — late-night archive SPA

## Overview
Rage² lets fans browse ABC *rage*'s archived weekly playlists (1998→) and replay
them as YouTube clips. Pick an episode by date → see its tracklist → watch the videos
back-to-back. This redesign is a single-page app with three views — **Browse**,
**Search**, and **Episode/Player** — wrapped in a persistent "late-night broadcast" shell.
The aesthetic is deliberate VHS / CRT nostalgia: near-black background, scanline + vignette
overlays, hot-magenta and cyan neon, pixel/OSD typography.

This bundle also includes a separate **Admin interface** (`Rage2 Admin.dc.html`) where
authenticated editors fix the programmatic track→YouTube matches inside a playlist. It is a
deliberately calmer, denser "back-of-house" tool — same brand palette, dialed down for
legibility and data density. See the **Admin Interface** section below.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing the
intended look and behavior, **not** production code to copy directly. The task is to
**recreate these designs in the target codebase's existing environment** (React, Vue,
Svelte, etc.) using its established patterns, component primitives, and data layer. If no
front-end environment exists yet, pick the most appropriate framework for the project and
implement there. The HTML uses a small internal templating runtime — ignore that machinery;
reproduce the *markup, styles, data shape, and interactions* described below.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are intended
as shown. Recreate the UI pixel-closely using the codebase's libraries. The one exception is
the video area: it is a striped placeholder labelled `[ YOUTUBE CLIP ]` and should be wired
to a real YouTube IFrame Player in production (see Interactions → Player).

## Screenshots
Reference renders of each view (in `screenshots/`):
- `01-browse.png` — Browse: header, season filter, episode rows.
- `02-search.png` — Search: query "Eminem" in ALL mode, cross-episode track hits.
- `03-episode.png` — Episode/Player: CRT video, now-playing, transport, tracklist.
- `04-admin-table.png` — Admin: track table with matched videos, confidence, status, inline edit.
- `05-admin-drawer.png` — Admin: detail drawer for fixing a single track's match.
- `06-admin-rematch.png` — Admin: re-match modal with candidate videos.

## Data Model
The whole app is driven by an array of **episodes**, each with a tracklist. Mock data spans
1999–2003 with intentionally recurring artists so search returns cross-episode hits.

```ts
type Track = {
  n: string;        // "01" — 1-based position, zero-padded
  artist: string;
  title: string;
  dur: string;      // "4:32" — m:ss
  durSec: number;   // parsed duration
  timecode: string; // "08:13" — cumulative start time within the episode
};

type Episode = {
  id: number;
  dow: string;       // "SAT" | "FRI"
  dd: string;        // "18"  (zero-padded day)
  monYr: string;     // "MAR 2000"
  yyyy: string;      // "2000"
  tag: string;       // theme/guest label, e.g. "Guest: Spiderbait", "Top 50 countdown"
  tracks: Track[];
  count: string;     // String(tracks.length)
  runtime: string;   // "52 MIN"  (sum of durations, rounded to minutes)
  featured: string;  // first 4 unique artists joined with "  ·  "
  dateShort: string; // "SAT 18 MAR 2000"
  dateLong: string;  // "18 MAR 2000"
  ts: number;        // Date(yyyy,mon,dd).getTime() — used for sorting & prev/next
};
```

Derivations the prototype performs (replicate these):
- **timecode** = running sum of prior track durations within the episode (first track 00:00).
- **runtime** = `Math.round(totalSeconds / 60) + " MIN"`.
- **featured** = `[...new Set(tracks.map(t=>t.artist))].slice(0,4).join("  ·  ")`.
- Episodes are sorted by `ts` (ascending) to compute prev/next; Browse lists a year **descending**.

The real product should fetch this from the rageagain data source (the project README of
the original lists a public DB dump). The shape above is what the views consume.

---

## Global Shell (persists across all views)

### Background & overlays
- Page background: `#08080c`. Body also `#08080c`.
- **Scanline overlay**: `position:fixed; inset:0; pointer-events:none; z-index:60;`
  `background: repeating-linear-gradient(0deg, rgba(255,255,255,.04) 0 1px, transparent 1px 3px);`
- **Vignette overlay**: `position:fixed; inset:0; pointer-events:none; z-index:61;`
  `background: radial-gradient(130% 130% at 50% 30%, transparent 58%, rgba(0,0,0,.6) 100%);`
- Base text color `#e9e9ef`; base font `'IBM Plex Mono', monospace`.

### Top bar
- `position:sticky; top:0; z-index:50;` flex row, space-between, padding `16px 34px`.
- Background `rgba(8,8,12,.92)`, `border-bottom:1px solid #1c1c24`, `backdrop-filter:blur(4px)`.
- **Left (logo, clickable → Browse)**: a magenta `▶` glyph (`'VT323' 30px`, color
  `oklch(0.78 0.22 350)`, `text-shadow:0 0 14px oklch(0.66 0.24 350 / .8)`) + wordmark
  `RAGE²` (`'Oswald' 700 24px`, `letter-spacing:.4em`, uppercase).
- **Right**: nav items `BROWSE` and `SEARCH`, then a status cluster: a blinking red dot
  (`10px` circle, `oklch(0.66 0.24 25)`, `box-shadow:0 0 10px` same, `animation:recblink 1.1s steps(1) infinite`)
  + `REC · ARCHIVE` (`'VT323' 22px`, color `oklch(0.86 0.13 200)`).
- **Nav item states** (`'Oswald' 600 22px`, uppercase, `letter-spacing:.18em`, cursor pointer):
  - active: color `oklch(0.82 0.2 350)`, `text-shadow:0 0 12px oklch(0.66 0.24 350 /.7)`,
    `border-bottom:2px solid oklch(0.72 0.22 350)`, `padding-bottom:3px`.
  - inactive: color `#8a8a95`.

### Keyframes (global)
```css
@keyframes recblink { 0%,49%{opacity:1} 50%,100%{opacity:.12} }   /* REC dot + left accent */
@keyframes crtflick { 0%,100%{opacity:.05} 50%{opacity:.10} }      /* player glow flicker, 4s ease-in-out */
@keyframes curblink { 0%,49%{opacity:1} 50%,100%{opacity:0} }      /* (reserved) text cursor */
```

---

## Screens / Views

### 1. Browse
**Purpose**: find an episode by season, scan featured artists, open it.
**Layout**: centered column, `max-width:1180px`, padding `46px 34px 80px`.
- **Header row** (flex, space-between, align-end, wraps):
  - Left: kicker `» PLAYLIST ARCHIVE` (`'VT323' 24px`, `oklch(0.86 0.13 200)`, `letter-spacing:.2em`)
    + `h1` "Travel back through / rage's history" (`'Oswald' 700 56px`, uppercase, `line-height:.95`).
  - Right (right-aligned, `'VT323' 24px`, `#5a5a64`): `1,694 EPISODES / 201,316 CLIPS · 1 YR 173 DAYS`.
- **Year filter bar**: `border-top`+`border-bottom 1px #1c1c24`, padding `16px 0`, margin `34px 0 26px`.
  Label `SEASON` (`'VT323' 22px`, `#5a5a64`) then year chips (1999–2003).
  - Chip base: `'VT323' 24px`, `letter-spacing:.06em`, padding `5px 16px`, `border:1px solid #2a2a34`, cursor pointer.
  - Active chip: text `#08080c`, background `oklch(0.78 0.22 350)`, border same,
    `box-shadow:0 0 14px oklch(0.66 0.24 350 /.5)`.
  - Inactive chip: text `#b6b6c0`, transparent background.
- **Episode list**: vertical stack, `gap:10px`. Each row is a clickable `grid` of
  `130px 1fr auto`, `gap:24px`, padding `18px 22px`, `border:1px solid #1c1c24`,
  background `#0b0b10`. Hover: `border-color:oklch(0.5 0.16 350)`, background `#101018`.
  - **Date block** (col 1, `border-right:1px solid #1c1c24`, `padding-right:20px`):
    day number `dd` (`'VT323' 46px`, `#fff`, `line-height:.8`), `monYr` (`'VT323' 20px`,
    `oklch(0.78 0.22 350)`, `letter-spacing:.12em`), `dow` (`'VT323' 16px`, `#5a5a64`).
  - **Middle** (col 2): `tag` (`'Oswald' 600 16px`, uppercase, `oklch(0.86 0.13 200)`) +
    `featured` artists (`'VT323' 21px`, `#b6b6c0`, single line, ellipsis).
  - **Right** (col 3, flex, `gap:22px`): meta `{count} CLIPS / {runtime}` (`'VT323' 22px`,
    `#5a5a64`, right-aligned) + a circular play button (`46px` circle, `border:1px solid #2a2a34`,
    `▶` in `oklch(0.78 0.22 350)` with magenta `text-shadow`).
  - List shows the selected year's episodes sorted **newest first**.

### 2. Search
**Purpose**: find playlists by date OR by artist/song (which episodes a track appeared in).
**Layout**: centered column, `max-width:980px`, padding `46px 34px 80px`.
- Kicker `» SEARCH THE ARCHIVE` (same style as Browse kicker).
- **Input** (margin-top 14px, relative): leading `⌖`-style glyph `⍾` (`'VT323' 28px`,
  `oklch(0.78 0.22 350)`) absolutely placed left:18px, vertically centered. The field:
  full width, padding `18px 18px 18px 56px`, background `#0b0b10`, `border:1px solid #2a2a34`,
  radius 3px, text `#fff` `'VT323' 30px`, placeholder `date, artist or song…` (placeholder
  color `#4f4f59`). Focus: `border-color:oklch(0.55 0.18 350)`.
- **Mode toggle** (flex, gap 8px, margin-top 14px): three chips — `ALL`, `BY DATE`,
  `ARTIST / SONG`. Chip base `'VT323' 22px`, padding `6px 18px`, `border:1px solid #2a2a34`.
  Active chip: text `#08080c`, background `oklch(0.86 0.13 200)` (cyan), border same.
  Inactive: text `#8a8a95`.
- **Empty state** (no query): label `TRY SEARCHING` then suggestion chips
  (`Powderfinger`, `Silverchair`, `18 Mar 2000`, `Eminem`, `2001`, `Kylie Minogue`).
  Chip: `'VT323' 22px`, `#b6b6c0`, `border:1px solid #2a2a34`, padding `7px 16px`;
  hover `border-color:oklch(0.5 0.16 350)`, text `#fff`. Clicking sets the query.
- **Results** (query present): a summary line (`'VT323' 24px`, `#8a8a95`,
  `border-bottom:1px solid #1c1c24`, padding-bottom 12px) then result rows (stack, gap 8px).
  - Summary text depends on mode:
    - artist: `"<q>"  —  found in N episode(s)`
    - date: `N episode(s) matching "<q>"`
    - all: `N result(s) for "<q>"`
  - **Result row**: clickable grid `108px 1fr auto`, `gap:22px`, padding `14px 20px`,
    `border:1px solid #1c1c24`, background `#0b0b10`; hover like Browse rows.
    - Date block (`border-right`): `dd` (`'VT323' 34px`, `#fff`) + `monYr` (`'VT323' 17px`,
      magenta).
    - Middle: `primary` (`'Oswald' 600 17px`, uppercase, `#fff`, ellipsis) + `secondary`
      (`'VT323' 20px`, `#8a8a95`).
      - For track hits: primary = `"<artist> — <title>"`, secondary =
        `"<dateShort>  ·  track <n>/<count>"` (+ `"  +K more"` if the artist/song matched
        multiple tracks in that episode).
      - For date hits: primary = episode `tag`, secondary = `"<dow>  ·  <count> clips  ·  <runtime>"`.
    - Right: `OPEN ▶` (`'VT323' 22px`, magenta).
  - **No results**: centered `░░░ NO SIGNAL — nothing matched "<q>" ░░░` (`'VT323' 26px`, `#5a5a64`).

**Search logic** (replicate exactly):
- `q = query.trim().toLowerCase()`.
- `wantDate = mode==='all' || mode==='date'`; `wantTrack = mode==='all' || mode==='artist'`.
- Iterate episodes **newest first**. For each:
  - `hits = wantTrack ? tracks.filter(t => (t.artist+" "+t.title).toLowerCase().includes(q)) : []`
  - `dateHit = wantDate && (dateShort | dateLong | yyyy | tag).toLowerCase().includes(q)`
  - If `hits.length` → push a track-hit row (first hit shown, `+K more` if >1).
  - Else if `dateHit` → push a date-hit row.
- One row max per episode (track hits take precedence over date hits).

### 3. Episode / Player
**Purpose**: watch the episode's clips in order; jump around the tracklist; step weeks.
**Layout**: centered, `max-width:1280px`, padding `26px 34px 70px`.
- **Back link**: `◀ BACK TO ARCHIVE` (`'VT323' 22px`, `#8a8a95`; hover `#fff`), margin-bottom 18px → Browse.
- **Player shell**: `border:1px solid #1c1c24`, radius 4px, overflow hidden, background `#08080c`.
  - **Episode header** (flex, space-between, padding `18px 28px`, `border-bottom`):
    `▶ PLAY` (magenta `'VT323' 30px`) + `dateLong` (`'Oswald' 600 22px`, uppercase) +
    `tag` (`'VT323' 22px`, cyan); right: `SP · {count} CLIPS · {runtime}` (`'VT323' 24px`, `#5a5a64`).
  - **Body grid** `1fr 440px`:
    - **Player column** (padding 28px, `border-right`, flex column gap 18px):
      - **Video** `aspect-ratio:16/9`, radius 3px. Placeholder background
        `repeating-linear-gradient(135deg,#15151c 0 16px,#0f0f15 16px 32px)`,
        `box-shadow:inset 0 0 60px rgba(0,0,0,.7)`. Inside:
        - a flickering magenta radial glow (`animation:crtflick 4s ease-in-out infinite`),
        - top-left OSD `CH 02 · {nowTrack.timecode}` (`'VT323' 22px`, `rgba(233,233,239,.55)`),
        - centered `[ YOUTUBE CLIP ]` label,
        - bottom-left now-playing block: `▶ NOW PLAYING` kicker (`'VT323' 18px`, cyan,
          `letter-spacing:.22em`) over artist/title in `'Oswald' 700 42px` uppercase with
          **chromatic-aberration** text-shadow: `text-shadow:2px 0 oklch(0.66 0.24 25 /.8), -2px 0 oklch(0.86 0.13 200 /.8)` (title in weight 500, `#d8d8e0`).
      - **Transport**:
        - time row: elapsed (magenta) — scrub track — duration (`#73737e`). Scrub: `4px`
          rail `#23232c`; fill width **30%** (decorative), `oklch(0.72 0.22 350)` with glow;
          a `11px` white playhead at 30% with magenta glow. `elapsed` shown = `fmt(durSec*0.3)`.
        - controls: `⏮ ⏯ ⏭` (`'VT323' 30px`; `⏯` magenta with glow). `⏮`/`⏭` step nowIndex.
        - right: `▣ TRACKING ████░░` indicator (`'VT323' 22px`, `#5a5a64`).
    - **Tracklist column** (flex column):
      - header: `PLAYLIST` (cyan `'VT323' 24px`) + `{count} CLIPS` (`#5a5a64`),
        `border-bottom`, padding `18px 24px 12px`.
      - scroll area `max-height:560px; overflow-y:auto`, padding `6px 0`.
      - **Track row** (clickable → cue that track): relative flex, `gap:14px`,
        padding `9px 24px 9px 27px`, `border-bottom:1px solid rgba(28,28,36,.6)`; hover `#101018`.
        - When it's the now-playing track, a left accent bar: `position:absolute; left:0;
          top:0; bottom:0; width:3px; background:oklch(0.72 0.22 350)` with magenta glow.
        - cells: `n` (`'VT323' 22px`, `#4f4f59`, width 26) · `timecode`
          (`'IBM Plex Mono' 18px`, `#5a5a64`, width 42) · stacked artist
          (`'Oswald' 600 15px`, uppercase, `#e9e9ef`) over title (`'VT323' 18px`, `#8a8a95`),
          both single-line ellipsis · `dur` (`'IBM Plex Mono' 18px`, `#5a5a64`).
  - **Week browser** (flex, space-between, height 60px, padding `0 28px`, `border-top`,
    background `#0b0b10`): `◀ {prevLabel}` · current `dateShort` (magenta, glow) ·
    `{nextLabel} ▶`. Prev/next labels are the neighbouring episodes' `dateLong`, or
    `ARCHIVE START` / `ARCHIVE END` at the bounds. Clicking opens that episode.

---

## Interactions & Behavior
- **Navigation / routing**: Browse ↔ Search via top-bar nav; logo → Browse. Opening an
  episode (from a Browse row, a Search result, or week prev/next) switches to the Episode
  view and **scrolls to top** (`window.scrollTo(0,0)`), resetting `nowIndex` to 0.
  In a real app, back these with routes: `/` (browse, `?year=`), `/search?q=&mode=`,
  `/episode/:id`. Browser back/forward should work.
- **Year filter**: clicking a chip sets the active year; list re-renders to that year (newest first).
- **Search**: input is controlled; results recompute live on every keystroke and on mode change.
  Suggestion + "found in N episodes" rows are clickable and open the relevant episode.
- **Tracklist**: clicking a track sets it as now-playing (updates video overlay, OSD timecode,
  transport elapsed, and the left accent bar). `⏮`/`⏭` decrement/increment within `[0, count-1]`.
- **Player (production)**: replace the placeholder with the **YouTube IFrame Player API**.
  Each track needs a resolved YouTube video id (the original matches tracks→videos
  programmatically; carry a `youtubeId` per track). Cue/play the now-playing track; advance
  to the next track on video end. The 30% scrub fill is decorative in the mock — wire it to
  real `getCurrentTime()/getDuration()` and make the rail seekable.
- **Hover states**: rows lift to `#101018` with a magenta border; nav/chips brighten as noted.
- **Animations**: REC dot blink (1.1s steps), player glow flicker (4s ease-in-out). Keep subtle.

## State Management
Prototype keeps one state object; map to your store/router:
- `view`: `'browse' | 'search' | 'episode'` → route.
- `year`: selected Browse season (default `'2000'`).
- `episodeId`: currently open episode (default 1).
- `query`: search string. `mode`: `'all' | 'date' | 'artist'` (default `'all'`).
- `nowIndex`: index of the now-playing track in the open episode (reset to 0 on open).
- Data fetching: load episodes + tracks from the rageagain data source; resolve a YouTube
  video id per track for the player.

## Design Tokens
**Colors**
- Background base: `#08080c`; panel surfaces: `#0b0b10`; hover surface: `#101018`.
- Hairlines / borders: `#1c1c24`; control borders: `#2a2a34`; subtle row divider: `rgba(28,28,36,.6)`.
- Text: primary `#fff` / `#e9e9ef`; secondary `#b6b6c0` / `#cfcfd8`; muted `#8a8a95`;
  faint `#5a5a64`; faintest `#4f4f59`.
- **Magenta accent** (primary): `oklch(0.78 0.22 350)` (text/icon), `oklch(0.72 0.22 350)`
  (fills/bars), `oklch(0.66 0.24 350)` (glow / shadows), `oklch(0.82 0.2 350)` (active nav),
  `oklch(0.55 0.18 350)` / `oklch(0.5 0.16 350)` (focus/hover borders).
- **Cyan accent** (secondary): `oklch(0.86 0.13 200)`.
- **Red** (REC dot only): `oklch(0.66 0.24 25)`.
- Chromatic-aberration title shadow: red `oklch(0.66 0.24 25 /.8)` +2px, cyan
  `oklch(0.86 0.13 200 /.8)` −2px.

**Typography** (Google Fonts)
- `VT323` (pixel/CRT/OSD) — most numeric + OSD text. Sizes used: 16/17/18/20/21/22/24/26/28/30/34/46.
- `Oswald` (condensed display) — headings, artist names, tags, nav. Weights 500/600/700.
  Sizes: 15/16/17/22/24/42/56. Headings uppercase, tight `line-height` (~.95).
- `IBM Plex Mono` — base body font + tracklist timecode/duration. Sizes 13/18.
- Letter-spacing: kickers ~`.2em`; nav `.18em`; wordmark `.4em`; OSD labels `.08–.22em`.

**Spacing** — multiples of common values: 6 / 8 / 10 / 12 / 14 / 16 / 18 / 22 / 24 / 26 / 28 / 34 / 46 / 70 / 80 (px). Containers: 1180 (browse), 980 (search), 1280 (episode).
**Radius** — 2px (scrub), 3px (inputs/video), 4px (player shell); 50% (play / REC circles).
**Shadows / glow** — neon via `box-shadow: 0 0 10–14px <accent>` and matching `text-shadow`.

## Assets
- No raster assets. Fonts from Google Fonts (`VT323`, `Oswald`, `IBM Plex Mono`).
- The video area is a CSS striped placeholder — supply real YouTube embeds in production.
- Scanline/vignette/glow are pure CSS (gradients + keyframes); no images needed.
- All glyphs are Unicode (▶ ⏮ ⏯ ⏭ ◀ ⍾ ▣ █ ░); swap for your icon set if preferred.

## Admin Interface

A separate **standalone** screen for authenticated editors to fix the programmatic
track→YouTube matches inside a playlist. **Distinct visual treatment** from the public site:
utilitarian dark admin, maximum density, minimal retro. Tie to brand is intentional and
light — the muted magenta accent and the `RAGE²` wordmark only.

### Admin design tokens (override the public neon palette)
- Page background `#0d0e11`; top bar `#101217`; surfaces `#14161b` / `#181b21`.
- Borders `#23262e` (hairline) / `#2b2f39` (controls) / `#1a1d23` (row divider).
- Text: primary `#e6e8ec`, secondary `#cdd2da` / `#9aa0ab`, muted `#7f8794`, faint `#6b727f`.
- Brand accent (sparingly — primary buttons, focus, active): magenta `oklch(0.74 0.15 350)`
  (button), `oklch(0.7 0.16 350)` (borders/focus, usually at low alpha `/.4–.6`),
  `oklch(0.8–0.82 0.14 350)` (accent text).
- **Status colors** (semantic, muted):
  - Verified → green `oklch(0.72 0.13 155)`
  - Needs review → amber `oklch(0.8 0.13 75)`
  - Rejected → red `oklch(0.68 0.16 25)`
  - No video → grey `#8a93a3`
  Each chip = `color` text on a `<color>/.14` background with a `<color>30` border + a 6px dot.
- **Confidence color** by score: `≥85` green, `60–84` amber, `<60` red (same hues as above).
- **Fonts**: `IBM Plex Sans` (UI, 11–17px), `IBM Plex Mono` (IDs, timecodes, confidence,
  labels), `Oswald 700` (wordmark only, `letter-spacing:.32em`). Radius 4–6px (10px modal).

### Auth
Assume the user is already signed in. Top bar shows a "All changes saved" status pill, a user
chip (avatar initials `PG`, name, role "Editor"), and a **Sign out** button. No login screen,
no role management in this mock — but gate the whole route behind auth in production and
hide/disable mutating actions for non-editors.

### Data additions
Each track gains a `match` object on top of the public `Track` shape:
```ts
type Match = {
  videoId: string;       // YouTube id (11 chars)
  videoTitle: string;    // matched video's title
  channel: string;       // matched video's channel
  confidence: number;    // 0–99 — match score from the matching algorithm
  status: 'verified' | 'review' | 'rejected' | 'novideo';
  manual: boolean;       // true once an editor overrode via URL/re-match
};
```
In the prototype these are generated deterministically (seeded by episode+index+artist) and
intentionally seed bad matches — karaoke, `[REACTION]`, live, and lyric videos with low
confidence — so the fixing workflow is visible. In production, `match` comes from the
matcher; `status` defaults from confidence (`≥85` verified, `60–84` review, `<60` rejected)
and editors correct it.

### Screen layout
1. **Top bar** (54px, `#101217`, bottom border): `RAGE²` wordmark + magenta `ADMIN` tag
   (left); saved-status pill + user chip + Sign out (right).
2. **Toolbar**: "EDITING PLAYLIST" label + a **playlist picker** (custom dropdown, not a native
   `<select>` — see note) showing `dateShort · tag`; to its right a verified **progress bar**
   (`{verified}/{total} verified`, `{n} need attention`, green fill at `verified/total`).
3. **Filter tabs** (underline-active): `All`, `Needs review`, `Rejected`, `No video`,
   `Verified`, each with a live count; filters the table by `match.status`.
4. **Track table** — dense grid, columns:
   `38px 54px minmax(110px,.9fr) minmax(120px,1fr) minmax(280px,1.8fr) 132px 104px`
   (`# · Time · Artist · Title · Matched YouTube video · Status · Actions`), rows ~48px,
   `border-bottom:1px solid #1a1d23`.
   - **# / Time**: mono, muted.
   - **Artist / Title**: borderless inline `<input>` (transparent → `#1b1e25` on hover,
     magenta `/.6` border on focus). Edits commit live to the row.
   - **Matched video**: 60×34 thumbnail placeholder (▶) + title (ellipsis) + `channel · videoId`
     (mono, muted) + a right-aligned confidence `NN%` (colored) over a 3px bar.
   - **Status**: the semantic chip (dot + label).
   - **Actions**: `✓` verify, `✕` reject (each highlights in its status color when active),
     and `⚙` to open the detail drawer. 28px square buttons, `1px #2b2f39` border.
5. **Empty state** when a filter has no tracks.

### Edit patterns (all three coexist — this was an explicit exploration)
- **Inline (in-table)**: edit artist/title in place; one-click verify/reject per row.
- **Detail drawer** (right, 440px, slides over a dim backdrop) for the selected track:
  large match preview (videoId badge + `NN% match` badge), matched title/channel,
  **Re-match** and **No video available** buttons, an **OVERRIDE WITH YOUTUBE URL** field +
  Apply (parses the id from the pasted URL, sets `manual:true`, confidence 100, status
  verified), editable Artist/Title, a **Match status** segmented control, and a sticky
  footer with **Cancel** (discards) / **Save changes** (commits). The drawer edits a *draft
  copy* so Cancel is non-destructive.
- **Re-match modal** (centered, 560px) launched from the drawer: a list of candidate videos
  (thumbnail, title, `channel · id`, confidence). Clicking one swaps the draft's match
  (status becomes verified if confidence ≥85, else review) and returns to the drawer.

### Admin state
- `episodeId` (current playlist), `filter` (status tab), `store` (per-episode working track
  arrays — edits persist across playlist switches within the session), `selectedIndex` +
  `draft` (drawer), `urlInput`, `rematchOpen`, `epMenuOpen` (custom dropdown).
- **Save model**: inline edits + quick verify/reject commit immediately; the drawer commits a
  draft on Save. In production, wire each mutation to a PATCH on the track/match resource and
  surface real save state (the "All changes saved" pill).
- **Note — custom dropdown**: the playlist picker is a hand-built dropdown (button + absolutely
  positioned menu + click-outside catcher), *not* a native `<select>`. Reproduce as your
  framework's Select/Combobox component; the native element is avoided only due to a quirk in
  the prototype runtime.

## Files
- `Rage2 SPA.dc.html` — the full SPA (shell + Browse + Search + Episode). **Primary reference.**
  All logic (dataset, derivations, search, navigation, player state) lives in the `Component`
  class inside this file; markup + inline styles are in its template.
- `Rage2 Admin.dc.html` — the **admin** match-fixing tool (table + inline edit + drawer +
  re-match modal). Self-contained; its `Component` class holds the dataset + match generators
  and all edit logic.
- `Rage2 Directions.dc.html` — the original 3-direction exploration on a canvas
  (A: VHS/CRT — the chosen direction; B: 90s print zine; C: teletext). Context only; A is the build.

> These `.dc.html` files open in a browser as-is for reference. Reproduce the design in your
> codebase's framework — do not ship the HTML directly.
