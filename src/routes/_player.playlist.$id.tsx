import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Play, Pause, Heart, Shuffle, Trash2 } from "lucide-react";
import { getPlaylist, tracksByIds, formatDuration, type Playlist } from "@/data/catalog";
import { TrackRow } from "@/components/player/TrackRow";
import { usePlayer, useCurrentTrack, type CustomPlaylist } from "@/store/player";

export const Route = createFileRoute("/_player/playlist/$id")({
  loader: ({ params }) => {
    const customPlaylist = usePlayer.getState().customPlaylists.find((p) => p.id === params.id);
    if (customPlaylist) {
      return { playlist: customPlaylist, isCustom: true };
    }
    const playlist = getPlaylist(params.id);
    if (!playlist) throw notFound();
    return { playlist, isCustom: false };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.playlist.title} — MUTUNES` },
          { name: "description", content: loaderData.playlist.description },
          { property: "og:title", content: `${loaderData.playlist.title} — MUTUNES` },
          { property: "og:description", content: loaderData.playlist.description },
          { property: "og:image", content: loaderData.playlist.cover },
        ]
      : [],
  }),
  notFoundComponent: () => <div className="p-8">Playlist not found.</div>,
  errorComponent: () => <div className="p-8">Couldn't load this playlist.</div>,
  component: PlaylistPage,
});

function PlaylistPage() {
  const { playlist, isCustom } = Route.useLoaderData();
  const navigate = useNavigate();
  const queue = isCustom ? (playlist as CustomPlaylist).tracks : tracksByIds((playlist as Playlist).trackIds);
  const totalSec = queue.reduce((a, t) => a + t.duration, 0);
  const { playQueue, toggle, isPlaying, deletePlaylist } = usePlayer();
  const current = useCurrentTrack();
  const playingThis = current && queue.some((t) => t.id === current.id);

  return (
    <div className="space-y-8 relative">
      {/* Blurred background image overlay */}
      <div
        className="absolute top-0 left-0 right-0 h-80 -mt-6 -mx-6 opacity-10 blur-3xl pointer-events-none -z-10 scale-105"
        style={{
          backgroundImage: `url(${playlist.cover})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Playlist Header */}
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-end">
        <img
          src={playlist.cover}
          alt=""
          className="h-52 w-52 rounded-2xl object-cover border border-white/10 shadow-2xl"
        />

        <div className="min-w-0 flex-1 text-center md:text-left">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
            Playlist
          </div>
          <h1 className="mt-1 font-sans text-4xl md:text-5xl font-extrabold leading-tight text-foreground">
            {playlist.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">{playlist.description}</p>
          <div className="mt-4 text-xs font-semibold text-muted-foreground/80">
            Mutunes · {queue.length} songs · {Math.round(totalSec / 60)} min
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-center md:justify-start gap-4">
        {/* Play Button */}
        <button
          onClick={() => (playingThis ? toggle() : playQueue(queue))}
          className="flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 font-semibold shadow-md hover:scale-103 active:scale-97 transition-transform cursor-pointer"
        >
          {playingThis && isPlaying ? (
            <>
              <Pause className="h-5 w-5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-5 w-5 fill-current" />
              <span>Play</span>
            </>
          )}
        </button>

        {/* Shuffle Button */}
        <button
          onClick={() => {
            // Shuffle queue and play
            const shuffled = [...queue].sort(() => Math.random() - 0.5);
            playQueue(shuffled);
          }}
          className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated text-foreground px-6 py-3 font-semibold hover:bg-white/10 active:scale-97 transition-transform cursor-pointer"
        >
          <Shuffle className="h-5 w-5" />
          <span>Shuffle</span>
        </button>

        <button
          className="rounded-full border border-border p-3 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
          aria-label="Like playlist"
        >
          <Heart className="h-5 w-5" />
        </button>

        {isCustom && (
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this playlist?")) {
                deletePlaylist(playlist.id);
                navigate({ to: "/library" });
              }
            }}
            className="rounded-full border border-border p-3 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
            aria-label="Delete playlist"
            title="Delete Playlist"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Tracklist table */}
      <div className="mt-6">
        <div className="hidden grid-cols-[2rem_1fr_1fr_auto_3rem] gap-4 border-b border-border/40 px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground/60 font-bold md:grid">
          <div>#</div>
          <div>Title</div>
          <div>Album</div>
          <div className="text-right"></div>
          <div className="flex justify-end">Time</div>
        </div>
        <div className="mt-1 divide-y divide-border/20">
          {queue.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} queue={queue} playlistId={playlist.id} />
          ))}
        </div>
      </div>

      <span hidden>{formatDuration(totalSec)}</span>
    </div>
  );
}
