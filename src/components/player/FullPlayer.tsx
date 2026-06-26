import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  ChevronLeft,
  Heart,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  ListMusic,
  Mic2,
  Sparkles,
  Music2,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlayer, useCurrentTrack } from "@/store/player";
import { getAlbum, getArtist, formatDuration, type Track } from "@/data/catalog";
import { searchSaavnSongs, getLyrics, type LyricsLine } from "@/lib/saavn";
import { Link } from "@tanstack/react-router";

type LyricsState = {
  lines: LyricsLine[]; // synced lines (with timestamps)
  plain: string[]; // plain fallback lines
  loading: boolean;
  found: boolean;
  isSynced: boolean;
};

export function FullPlayer() {
  const {
    expanded,
    setExpanded,
    isPlaying,
    queue,
    index: currentIndex,
    toggle,
    next,
    prev,
    progress,
    seek,
    liked,
    toggleLike,
    playQueue,
    activeFullPlayerTab,
    setActiveFullPlayerTab,
    mobileTabOpen,
    setMobileTabOpen,
    customPlaylists,
    addTrackToPlaylist,
    createPlaylist,
    streamQuality,
    setStreamQuality,
  } = usePlayer();

  const track = useCurrentTrack();
  const [relatedTracks, setRelatedTracks] = useState<Track[]>([]);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const [lyrics, setLyrics] = useState<LyricsState>({
    lines: [],
    plain: [],
    loading: false,
    found: false,
    isSynced: false,
  });
  const lyricsTrackId = useRef<string | null>(null);

  useEffect(() => {
    if (track?.artistName) {
      searchSaavnSongs(track.artistName)
        .then((res) => {
          setRelatedTracks(res.filter((t: Track) => t.id !== track.id).slice(0, 6));
        })
        .catch(() => {});
    }
  }, [track]);

  // Fetch real lyrics when track changes
  useEffect(() => {
    if (!track || lyricsTrackId.current === track.id) return;
    lyricsTrackId.current = track.id;
    setLyrics({ lines: [], plain: [], loading: true, found: false, isSynced: false });
    getLyrics(track.title, track.artistName || "", track.albumName, track.duration)
      .then((result) => {
        setLyrics({
          lines: result.synced,
          plain: result.plain,
          loading: false,
          found: result.found,
          isSynced: result.synced.length > 0,
        });
      })
      .catch(() => {
        setLyrics({ lines: [], plain: [], loading: false, found: false, isSynced: false });
      });
  }, [track]);

  // For synced lyrics: find the currently active line index
  const activeSyncedLine = useCallback(() => {
    if (!lyrics.isSynced || lyrics.lines.length === 0) return -1;
    let idx = 0;
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (lyrics.lines[i].time <= progress) idx = i;
      else break;
    }
    return idx;
  }, [lyrics, progress]);

  const activeLine = activeSyncedLine();

  // Autoscroll lyrics when active line changes
  useEffect(() => {
    if (!lyricsContainerRef.current || activeLine < 0) return;
    const activeElement = lyricsContainerRef.current.children[activeLine] as HTMLElement;
    if (activeElement) {
      lyricsContainerRef.current.scrollTo({
        top:
          activeElement.offsetTop -
          lyricsContainerRef.current.clientHeight / 2 +
          activeElement.clientHeight / 2,
        behavior: "smooth",
      });
    }
  }, [activeLine]);

  if (!expanded || !track) return null;
  const album = getAlbum(track.albumId);
  const artist = getArtist(track.artistId);
  const isLiked = liked.has(track.id);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden select-none">
      {/* Blurred background image cover overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-20 blur-3xl pointer-events-none scale-110"
        style={{
          backgroundImage: `url(${track.coverUrl || album?.cover})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Dark overlay to ensure legibility */}
      <div className="absolute inset-0 -z-10 bg-black/60 pointer-events-none" />

      {/* Header bar */}
      <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-white/5 bg-black/25">
        <button
          onClick={() => {
            if (mobileTabOpen) {
              setMobileTabOpen(false);
            } else {
              setExpanded(false);
            }
          }}
          className="rounded-full p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
          title={mobileTabOpen ? "Back to player" : "Minimize player"}
        >
          <span className="hidden lg:block">
            <ChevronDown className="h-6 w-6" />
          </span>
          <span className="lg:hidden">
            {mobileTabOpen ? (
              <ChevronLeft className="h-6 w-6" />
            ) : (
              <ChevronDown className="h-6 w-6" />
            )}
          </span>
        </button>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            {mobileTabOpen ? "Active Tab" : "Playing From"}
          </div>
          <div className="text-sm font-semibold text-foreground max-w-xs truncate">
            {mobileTabOpen
              ? activeFullPlayerTab === "queue"
                ? "Up Next"
                : activeFullPlayerTab === "lyrics"
                  ? "Lyrics"
                  : "Related"
              : track.albumName || album?.title || "JioSaavn Stream"}
          </div>
        </div>
        {mobileTabOpen ? (
          <button
            onClick={() => setExpanded(false)}
            className="lg:hidden rounded-full p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
            title="Minimize player"
          >
            <ChevronDown className="h-6 w-6" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* Main split grid: Left (Artwork + Mini Controls), Right (Tabs + Info Panel) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 w-full max-w-7xl mx-auto px-6 py-4 items-center gap-8 lg:gap-12">
        {/* Left Side: 12-col layout (takes up 6 cols) */}
        <div
          className={`lg:col-span-6 flex flex-col justify-center items-center h-full max-w-md mx-auto w-full ${
            mobileTabOpen ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Big Square Album Art */}
          <div className="relative aspect-square w-[85%] sm:w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group bg-surface">
            <img
              src={track.coverUrl || album?.cover}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
            />
          </div>

          {/* Media Info (under artwork) */}
          <div className="w-full mt-5 flex items-center justify-between px-2 sm:px-0">
            <div className="min-w-0 pr-4">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate flex items-center gap-2">
                {track.title}
                {streamQuality === "lossless" && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded shadow-[0_0_10px_rgba(16,185,129,0.15)] select-none">
                    LOSSLESS
                  </span>
                )}
                {streamQuality === "hires" && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded shadow-[0_0_10px_rgba(245,158,11,0.15)] select-none">
                    HI-RES
                  </span>
                )}
                {streamQuality === "high" && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider bg-primary/20 text-primary border border-primary/30 rounded select-none">
                    HQ
                  </span>
                )}
              </h1>
              <Link
                to="/artist/$id"
                params={{ id: track.artistId }}
                onClick={() => setExpanded(false)}
                className="text-muted-foreground text-sm mt-0.5 truncate hover:underline hover:text-foreground transition-colors block"
              >
                {track.artistName || artist?.name || "Unknown Artist"}
              </Link>
            </div>
            <div className="flex items-center gap-1">
              {/* Quality Chooser Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full p-2 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center"
                    title="Audio Quality"
                  >
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider border transition-all uppercase ${
                      streamQuality === "lossless" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                      streamQuality === "hires" ? "border-amber-500/30 text-amber-400 bg-amber-500/10" :
                      "border-white/20 text-muted-foreground/60 hover:text-foreground hover:border-white/40"
                    }`}>
                      {streamQuality === "auto" ? "AUTO" :
                       streamQuality === "low" ? "96K" :
                       streamQuality === "normal" ? "160K" :
                       streamQuality === "high" ? "HQ" :
                       streamQuality === "lossless" ? "LOSSLESS" : "HI-RES"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 bg-background border border-border/80 text-xs">
                  {[
                    { id: "auto", label: "Auto (Adaptive)" },
                    { id: "low", label: "Low (96 kbps)" },
                    { id: "normal", label: "Normal (160 kbps)" },
                    { id: "high", label: "High (320 kbps)" },
                    { id: "lossless", label: "Lossless (FLAC)" },
                    { id: "hires", label: "Hi-Res Lossless" },
                  ].map((q) => (
                    <DropdownMenuItem
                      key={q.id}
                      onClick={() => setStreamQuality(q.id)}
                      className={`cursor-pointer ${streamQuality === q.id ? "text-primary font-bold" : ""}`}
                    >
                      {q.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={() => toggleLike(track)}
                className={`rounded-full p-2 hover:bg-white/5 transition-colors ${
                  isLiked ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"
                }`}
              >
                <Heart className="h-6 w-6" fill={isLiked ? "currentColor" : "none"} />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full p-2 hover:bg-white/5 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                    title="Add to playlist"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-background border border-border/80"
                >
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                      Add to Playlist
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-48 bg-background border border-border/80">
                      {customPlaylists.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                          No custom playlists
                        </div>
                      ) : (
                        customPlaylists.map((p) => (
                          <DropdownMenuItem
                            key={p.id}
                            onClick={() => addTrackToPlaylist(p.id, track)}
                            className="cursor-pointer"
                          >
                            {p.title}
                          </DropdownMenuItem>
                        ))
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          const name = prompt("Enter playlist name:");
                          if (name && name.trim()) {
                            const newId = createPlaylist(name.trim());
                            addTrackToPlaylist(newId, track);
                          }
                        }}
                        className="cursor-pointer text-primary"
                      >
                        + Create Playlist
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Seek Progress Bar */}
          <div className="w-full mt-4 px-2 sm:px-0">
            <div className="relative h-1.5 group cursor-pointer overflow-visible rounded-full">
              <input
                type="range"
                min={0}
                max={track.duration}
                value={progress}
                onChange={(e) => seek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-40"
              />
              <div className="absolute inset-0 bg-white/10 rounded-full" />
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full relative"
                style={{ width: `${(progress / track.duration) * 100}%` }}
              >
                <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground/75 tabular-nums">
              <span>{formatDuration(progress)}</span>
              <span>{formatDuration(track.duration)}</span>
            </div>
          </div>

          {/* Big Transport Controls */}
          <div className="mt-5 flex items-center justify-center gap-8">
            <button
              onClick={prev}
              className="text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full p-3 transition-colors active:scale-90"
              aria-label="Previous"
            >
              <SkipBack className="h-6 w-6" fill="currentColor" />
            </button>

            <button
              onClick={toggle}
              className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full bg-foreground text-background shadow-lg hover:scale-105 active:scale-95 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 sm:h-7 sm:w-7" fill="currentColor" />
              ) : (
                <Play className="h-6 w-6 sm:h-7 sm:w-7 translate-x-0.5" fill="currentColor" />
              )}
            </button>

            <button
              onClick={next}
              className="text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full p-3 transition-colors active:scale-90"
              aria-label="Next"
            >
              <SkipForward className="h-6 w-6" fill="currentColor" />
            </button>
          </div>

          {/* Mobile Tab Button Row under controls */}
          <div className="lg:hidden w-full mt-6 flex border-t border-white/5 pt-4.5 items-center justify-around shrink-0">
            {[
              { id: "queue" as const, label: "Up Next", icon: ListMusic },
              { id: "lyrics" as const, label: "Lyrics", icon: Mic2 },
              { id: "related" as const, label: "Related", icon: Sparkles },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveFullPlayerTab(id);
                  setMobileTabOpen(true);
                }}
                className="flex flex-col items-center gap-1.5 py-1 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground active:scale-95 transition-transform"
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Tab Panel (takes up 6 cols) */}
        <div
          className={`lg:col-span-6 flex flex-col h-full min-h-[300px] lg:h-[80%] bg-surface/50 border border-white/5 rounded-2xl backdrop-blur-md overflow-hidden ${
            mobileTabOpen ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Tab Selection Row */}
          <div className="flex border-b border-white/5 bg-black/20 shrink-0">
            {[
              { id: "queue" as const, label: "Up Next", icon: ListMusic },
              { id: "lyrics" as const, label: "Lyrics", icon: Mic2 },
              { id: "related" as const, label: "Related", icon: Sparkles },
            ].map(({ id, label, icon: Icon }) => {
              const isActive = activeFullPlayerTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveFullPlayerTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                    isActive
                      ? "border-primary text-foreground bg-white/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/2"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0 flex flex-col">
            {activeFullPlayerTab === "queue" && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-4 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center justify-between">
                  <span>Up Next</span>
                  <span>{queue.length} Tracks</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin">
                  {queue.map((t, idx) => {
                    const isCurrent = idx === currentIndex;
                    return (
                      <div
                        key={`${t.id}-${idx}`}
                        onClick={() => playQueue(queue, idx)}
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-white/5 transition-colors ${
                          isCurrent ? "bg-white/10" : ""
                        }`}
                      >
                        <span className="w-6 text-center text-xs text-muted-foreground/60 tabular-nums">
                          {idx + 1}
                        </span>
                        <img
                          src={t.coverUrl || getAlbum(t.albumId)?.cover}
                          alt=""
                          className="h-9 w-9 rounded object-cover border border-white/5"
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className={`truncate text-sm font-semibold ${isCurrent ? "text-primary" : "text-foreground"}`}
                          >
                            {t.title}
                          </div>
                          <div className="truncate text-xs text-muted-foreground/80">
                            {t.artistName}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground/60 tabular-nums">
                          {formatDuration(t.duration)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeFullPlayerTab === "lyrics" && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Lyrics Header */}
                <div className="mb-4 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center justify-between shrink-0">
                  <span className="flex items-center gap-1.5">
                    <Mic2 className="h-3.5 w-3.5" />
                    Lyrics
                    {lyrics.isSynced && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-extrabold tracking-wider uppercase">
                        Synced
                      </span>
                    )}
                  </span>
                  {lyrics.found && (
                    <span className="text-[10px] text-muted-foreground/40">lrclib.net</span>
                  )}
                </div>

                {/* Loading */}
                {lyrics.loading && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-60">
                    <Music2 className="h-8 w-8 animate-pulse text-primary" />
                    <p className="text-sm text-muted-foreground">Fetching lyrics...</p>
                  </div>
                )}

                {/* Not Found */}
                {!lyrics.loading && !lyrics.found && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-50">
                    <Mic2 className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      Lyrics not available for this track
                    </p>
                    <p className="text-xs text-muted-foreground/60 text-center">
                      {track.title} · {track.artistName}
                    </p>
                  </div>
                )}

                {/* Synced lyrics */}
                {!lyrics.loading && lyrics.found && lyrics.isSynced && (
                  <div
                    ref={lyricsContainerRef}
                    className="flex-1 overflow-y-auto text-center space-y-4 py-4 scrollbar-thin select-text"
                  >
                    {lyrics.lines.map((line, i) => {
                      const isActive = i === activeLine;
                      return (
                        <p
                          key={i}
                          className={`text-lg md:text-xl font-medium tracking-tight transition-all duration-300 leading-relaxed cursor-pointer ${
                            isActive
                              ? "text-foreground font-bold opacity-100"
                              : i < activeLine
                                ? "text-muted-foreground opacity-30 hover:opacity-60"
                                : "text-muted-foreground opacity-50 hover:opacity-70"
                          }`}
                          style={
                            isActive ? { transform: "scale(1.04)", transformOrigin: "center" } : {}
                          }
                          onClick={() => seek(line.time)}
                        >
                          {line.text || "♪"}
                        </p>
                      );
                    })}
                  </div>
                )}

                {/* Plain lyrics (no timestamps) */}
                {!lyrics.loading && lyrics.found && !lyrics.isSynced && (
                  <div className="flex-1 overflow-y-auto text-center space-y-4 py-4 scrollbar-thin select-text">
                    {lyrics.plain.map((line, i) => (
                      <p
                        key={i}
                        className="text-lg md:text-xl font-medium tracking-tight leading-relaxed text-muted-foreground opacity-70"
                      >
                        {line || <span className="text-muted-foreground/30">·</span>}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeFullPlayerTab === "related" && (
              <div className="flex-1 flex flex-col min-h-0 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">
                    Recommendations by Artist
                  </h3>
                  {relatedTracks.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Fetching suggestions...</p>
                  ) : (
                    <div className="space-y-2">
                      {relatedTracks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => playQueue([t])}
                          className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                        >
                          <img src={t.coverUrl} alt="" className="h-10 w-10 rounded object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {t.title}
                            </div>
                            <div className="truncate text-xs text-muted-foreground/80">
                              {t.artistName}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground/60 tabular-nums">
                            {formatDuration(t.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5 pt-4">
                  <h3 className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">
                    About the Artist
                  </h3>
                  <div className="flex items-center gap-3 mt-3">
                    {artist && (
                      <>
                        <img
                          src={artist.image}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-foreground truncate">
                            {artist.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            {artist.monthlyListeners.toLocaleString()} Monthly Listeners
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed mt-3 italic">
                    "
                    {artist?.bio ||
                      "This artist is globally acclaimed for their unique sound and contributions to the genre."}
                    "
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
