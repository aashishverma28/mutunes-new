import { useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  Mic2,
  ListMusic,
  Maximize2,
  Volume1,
  VolumeX,
} from "lucide-react";
import { usePlayer, useCurrentTrack } from "@/store/player";
import { getAlbum, getArtist, formatDuration } from "@/data/catalog";
import { Link } from "@tanstack/react-router";

export function EqBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex h-3 items-end gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-0.75 rounded-sm bg-primary"
          style={{
            animation: playing ? `eq-bounce 0.9s ease-in-out ${i * 0.15}s infinite` : "none",
            transformOrigin: "bottom",
            height: "100%",
            opacity: playing ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
}

export function NowPlaying() {
  const {
    isPlaying,
    progress,
    volume,
    shuffle,
    repeat,
    liked,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    tick,
    setExpanded,
    setActiveFullPlayerTab,
    setMobileTabOpen,
  } = usePlayer();
  const track = useCurrentTrack();

  useEffect(() => {
    const i = setInterval(() => tick(), 1000);
    return () => clearInterval(i);
  }, [tick]);

  if (!track) return null;
  const album = getAlbum(track.albumId);
  const artist = getArtist(track.artistId);
  const isLiked = liked.has(track.id);

  const VolIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  // Handler to open full player on a specific tab
  const openFullPlayerWithTab = (tab: "queue" | "lyrics" | "related") => {
    setActiveFullPlayerTab(tab);
    setMobileTabOpen(true);
    setExpanded(true);
  };

  return (
    <>
      {/* Desktop Player Bar */}
      <div className="hidden md:grid grid-cols-3 items-center justify-between border-t border-border/40 bg-surface px-6 py-4.5 relative z-20 shadow-2xl shrink-0">
        {/* YT Music style Progress Bar stretching along the absolute top edge */}
        <div className="absolute top-0 left-0 right-0 h-[3px] group hover:h-[5px] transition-all overflow-visible z-30">
          <input
            type="range"
            min={0}
            max={track.duration}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-40"
          />
          {/* Visual Progress Track */}
          <div className="absolute inset-0 bg-white/10" />
          <div
            className="absolute top-0 left-0 h-full bg-primary relative transition-all"
            style={{ width: `${(progress / track.duration) * 100}%` }}
          >
            {/* Circular Red dot thumb, visible on hover */}
            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Left: Track Info */}
        <div className="flex min-w-0 w-full items-center gap-4">
          <button
            onClick={() => openFullPlayerWithTab("queue")}
            className="relative shrink-0 flex items-center justify-center w-12 h-12 rounded overflow-hidden border border-border/50 hover:scale-102 active:scale-98 transition-transform"
          >
            <img src={track.coverUrl || album?.cover} alt="" className="h-12 w-12 object-cover" />
          </button>
          <div className="min-w-0 pl-1">
            <div
              onClick={() => openFullPlayerWithTab("queue")}
              className="truncate text-sm font-semibold text-foreground leading-tight hover:underline cursor-pointer"
            >
              {track.title}
            </div>
            <Link
              to="/artist/$id"
              params={{ id: track.artistId }}
              className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors block mt-0.5"
            >
              {track.artistName || artist?.name}
            </Link>
          </div>
          <button
            onClick={() => toggleLike(track)}
            className={`ml-2 rounded-full p-2 transition-colors hover:bg-white/5 ${
              isLiked ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"
            }`}
            aria-label="Like"
          >
            <Heart className="h-4.5 w-4.5" fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Center: Controls */}
        <div className="flex items-center justify-center gap-6 w-full">
          <button
            onClick={toggleShuffle}
            className={`transition-colors rounded-full p-2 hover:bg-white/5 ${
              shuffle ? "text-primary" : "text-muted-foreground/50 hover:text-foreground"
            }`}
            aria-label="Shuffle"
          >
            <Shuffle className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={prev}
            className="text-muted-foreground/75 hover:text-foreground hover:bg-white/5 rounded-full p-2 transition-colors"
            aria-label="Previous"
          >
            <SkipBack className="h-5 w-5" fill="currentColor" />
          </button>

          {/* YT Music Prominent Circle Play/Pause Button */}
          <button
            onClick={toggle}
            className="grid h-11 w-11 place-items-center rounded-full bg-foreground text-background shadow-md hover:scale-105 active:scale-95 transition-transform"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5.5 w-5.5" fill="currentColor" />
            ) : (
              <Play className="h-5.5 w-5.5 translate-x-0.5" fill="currentColor" />
            )}
          </button>

          <button
            onClick={next}
            className="text-muted-foreground/75 hover:text-foreground hover:bg-white/5 rounded-full p-2 transition-colors"
            aria-label="Next"
          >
            <SkipForward className="h-5 w-5" fill="currentColor" />
          </button>
          <button
            onClick={cycleRepeat}
            className={`transition-colors rounded-full p-2 hover:bg-white/5 ${
              repeat !== "off" ? "text-primary" : "text-muted-foreground/50 hover:text-foreground"
            }`}
            aria-label="Repeat"
          >
            <RepeatIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Right: Volume & Tab shortcuts */}
        <div className="flex items-center justify-end gap-3 w-full">
          {/* Simple Time Display */}
          <span className="text-[11px] text-muted-foreground/70 mr-2 tabular-nums">
            {formatDuration(progress)} / {formatDuration(track.duration)}
          </span>

          <button
            onClick={() => openFullPlayerWithTab("lyrics")}
            className="text-muted-foreground/60 hover:text-foreground hover:bg-white/5 rounded-full p-2 transition-colors"
            aria-label="Lyrics"
            title="Lyrics"
          >
            <Mic2 className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => openFullPlayerWithTab("queue")}
            className="text-muted-foreground/60 hover:text-foreground hover:bg-white/5 rounded-full p-2 transition-colors"
            aria-label="Queue"
            title="Queue"
          >
            <ListMusic className="h-4.5 w-4.5" />
          </button>
          <div className="flex items-center gap-2 group/vol">
            <VolIcon
              onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
              className="h-4.5 w-4.5 text-muted-foreground/70 hover:text-foreground cursor-pointer transition-colors"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={volume * 100}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="vol-range w-20 h-1 bg-white/10 hover:h-1.5 transition-all rounded-full appearance-none outline-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #ff0000 0%, #ff0000 ${volume * 100}%, rgba(255, 255, 255, 0.1) ${volume * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
              }}
            />
          </div>
          <button
            onClick={() => openFullPlayerWithTab("queue")}
            className="text-muted-foreground/60 hover:text-foreground hover:bg-white/5 rounded-full p-2 transition-colors"
            aria-label="Expand"
            title="Expand"
          >
            <Maximize2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Mobile Player Bar */}
      <div
        onClick={() => setExpanded(true)}
        className="md:hidden flex h-16 items-center justify-between px-4 bg-surface border-t border-border/40 relative z-20 cursor-pointer shadow-lg shrink-0 select-none"
      >
        {/* progress bar stretching along top edge */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] z-30">
          <div className="absolute inset-0 bg-white/10" />
          <div
            className="absolute top-0 left-0 h-full bg-primary"
            style={{ width: `${(progress / track.duration) * 100}%` }}
          />
        </div>

        {/* Left: Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
          <img
            src={track.coverUrl || album?.cover}
            alt=""
            className="h-10 w-10 shrink-0 rounded object-cover border border-white/5"
          />
          <div className="min-w-0 pl-0.5">
            <div className="truncate text-sm font-semibold text-foreground leading-tight">
              {track.title}
            </div>
            <div className="truncate text-[11px] text-muted-foreground/90 mt-0.5">
              {track.artistName || artist?.name}
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleLike(track)}
            className={`rounded-full p-2 transition-colors ${
              isLiked ? "text-primary" : "text-muted-foreground/60 active:text-foreground"
            }`}
            aria-label="Like"
          >
            <Heart className="h-5.5 w-5.5" fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button
            onClick={toggle}
            className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background shadow-md active:scale-95 transition-transform"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current translate-x-0.5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
