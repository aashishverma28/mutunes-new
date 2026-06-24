# MUTUNES Web Player MVP — Plan

A frontend-only, design-forward web player inspired by the PRD. No backend, no real audio — mock data and non-functional playback controls that animate convincingly. Focus on the look and core navigation of a premium streaming app.

## Scope

In:

- Multi-route player shell with persistent sidebar + bottom now-playing bar
- Home / Browse / Search / Library / Playlist detail / Artist detail pages
- Mock catalog (curated genres, ~10 artists, ~40 tracks, ~8 playlists)
- Working UI state: play/pause toggle, track progress simulation, like, queue, volume, shuffle/repeat
- Lyrics panel (static synced-style display), now-playing full-screen view

Out (per "mock only"):

- Real audio playback / streaming
- Auth, accounts, social, payments, artist dashboard, podcasts, downloads
- Backend / database

## Design Direction

Dark, premium, music-first — distinct from Spotify green and Apple's white.

- Palette: near-black bg `#0A0A0F`, surface `#15151D`, accent electric violet `#8B5CF6` → magenta `#EC4899` gradient, text `#F4F4F5`, muted `#71717A`
- Type pair: **Space Grotesk** (display/headers) + **Inter** (body)
- Motif: rounded-2xl cards with subtle violet glow on hover, gradient progress bars, album art with soft shadow
- Motion: smooth hover lifts, animated equalizer bars on the currently playing row

## Route Structure

```
src/routes/
  __root.tsx              shell: html/head/body
  _player.tsx             layout: sidebar + content + bottom now-playing bar
  _player.index.tsx       Home (Made For You, Recently Played, New Releases)
  _player.browse.tsx      Genre grid
  _player.search.tsx      Search with mock results
  _player.library.tsx     User playlists + liked songs
  _player.playlist.$id.tsx
  _player.artist.$id.tsx
```

## Component Outline

- `PlayerSidebar` — logo, nav links, playlist list
- `NowPlayingBar` — track info, transport controls, progress, volume
- `FullPlayer` — expandable full-screen player with art + lyrics tab
- `TrackRow`, `AlbumCard`, `PlaylistCard`, `ArtistCard`
- `usePlayerStore` (Zustand) — current track, queue, isPlaying, progress (simulated via setInterval), volume, shuffle, repeat, liked set

## Mock Data

`src/data/catalog.ts` — typed arrays: `artists`, `albums`, `tracks`, `playlists`, `genres`. Cover art via curated Unsplash music photography URLs.

## Closing Notes

Everything is presentational. Buttons respond, progress animates, but no audio is loaded. This is a clear stepping stone — Lovable Cloud + real audio uploads can be added later when you're ready to make it functional.
