import { Play, Heart, MoreHorizontal, Download, CheckCircle2 } from "lucide-react";
import { usePlayer, useCurrentTrack } from "@/store/player";
import { getAlbum, getArtist, formatDuration, type Track } from "@/data/catalog";
import { EqBars } from "./NowPlaying";
import { Link } from "@tanstack/react-router";
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

export function TrackRow({
  track,
  index,
  queue,
  showAlbum = true,
  playlistId,
}: {
  track: Track;
  index: number;
  queue: Track[];
  showAlbum?: boolean;
  playlistId?: string;
}) {
  const {
    playQueue,
    toggle,
    isPlaying,
    toggleLike,
    liked,
    toggleDownload,
    downloaded,
    customPlaylists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    createPlaylist,
  } = usePlayer();
  const current = useCurrentTrack();
  const isCurrent = current?.id === track.id;
  const album = getAlbum(track.albumId);
  const artist = getArtist(track.artistId);
  const isLiked = liked.has(track.id);
  const isDownloaded = downloaded.has(track.id);

  return (
    <div
      className={`group grid grid-cols-[2rem_1fr_auto] items-center gap-4 px-4 py-3.5 text-sm transition-all border-b border-border/40 hover:bg-white/5 md:grid-cols-[2rem_1fr_1fr_auto_3rem] ${
        isCurrent ? "bg-white/10 font-semibold" : ""
      }`}
      onDoubleClick={() => playQueue(queue, index)}
    >
      <div className="flex h-6 w-6 items-center justify-center">
        {isCurrent ? (
          <div className="flex items-center gap-1 justify-center">
            <EqBars playing={isPlaying} />
          </div>
        ) : (
          <>
            <span className="text-xs text-muted-foreground/60 group-hover:hidden tabular-nums">
              {index + 1}
            </span>
            <button
              onClick={() => (isCurrent ? toggle() : playQueue(queue, index))}
              className="hidden text-primary hover:scale-105 transition-transform group-hover:block cursor-pointer"
              aria-label="Play"
            >
              <Play className="h-4 w-4" fill="currentColor" />
            </button>
          </>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <img
          src={track.coverUrl || album?.cover}
          alt=""
          className="h-9 w-9 shrink-0 rounded object-cover border border-white/5 shadow-sm"
        />
        <div className="min-w-0">
          <div
            className={`truncate font-semibold text-sm leading-tight ${isCurrent ? "text-primary" : "text-foreground"}`}
          >
            {track.title}
          </div>
          <div className="truncate text-xs text-muted-foreground/70 mt-0.5">
            {track.artistId ? (
              <Link
                to="/artist/$id"
                params={{ id: track.artistId }}
                className="hover:underline hover:text-foreground transition-colors cursor-pointer"
              >
                {track.artistName || artist?.name || "Unknown Artist"}
              </Link>
            ) : (
              track.artistName || artist?.name || "Unknown Artist"
            )}
          </div>
        </div>
      </div>

      {showAlbum && (
        <div className="hidden truncate text-xs text-muted-foreground/60 md:block">
          {track.albumName || album?.title}
        </div>
      )}

      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => toggleLike(track)}
          className={`${isLiked ? "text-primary" : "text-transparent group-hover:text-muted-foreground/60"} hover:text-primary transition-colors cursor-pointer p-1 rounded-full hover:bg-white/5`}
          aria-label="Like"
        >
          <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
        </button>
        <button
          onClick={() => toggleDownload(track)}
          className={`${isDownloaded ? "text-emerald-500/80" : "text-transparent group-hover:text-muted-foreground/60"} hover:text-primary transition-colors cursor-pointer p-1 rounded-full hover:bg-white/5`}
          aria-label="Download"
        >
          {isDownloaded ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500/80" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground/60 tabular-nums">
        {formatDuration(track.duration)}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground/60 hover:text-foreground md:hidden md:group-hover:block cursor-pointer p-1 rounded-full hover:bg-white/5">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background border border-border/80">
            <DropdownMenuItem onClick={() => playQueue([track])} className="cursor-pointer">
              Play Song
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const { queue: currentQueue } = usePlayer.getState();
                usePlayer.setState({ queue: [...currentQueue, track] });
              }}
              className="cursor-pointer"
            >
              Add to Queue
            </DropdownMenuItem>

            <DropdownMenuSeparator />

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

            {playlistId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => removeTrackFromPlaylist(playlistId, track.id)}
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  Remove from Playlist
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => toggleLike(track)} className="cursor-pointer">
              {isLiked ? "Remove from Liked" : "Like Song"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleDownload(track)} className="cursor-pointer">
              {isDownloaded ? "Remove Download" : "Download"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
