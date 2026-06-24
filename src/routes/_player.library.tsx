import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, ListMusic, CheckCircle2 } from "lucide-react";
import { playlists } from "@/data/catalog";
import { PlaylistCard } from "@/components/player/Cards";
import { usePlayer } from "@/store/player";
import { TrackRow } from "@/components/player/TrackRow";

export const Route = createFileRoute("/_player/library")({
  head: () => ({
    meta: [
      { title: "Your Library — MUTUNES" },
      { name: "description", content: "Your playlists, downloads and liked songs on MUTUNES." },
    ],
  }),
  component: Library,
});

type Tab = "playlists" | "downloads";

function Library() {
  const [tab, setTab] = useState<Tab>("playlists");
  const likedTracks = usePlayer((s) => s.likedTracksList);
  const downloadedTracks = usePlayer((s) => s.downloadedTracksList);
  const downloadBytes = downloadedTracks.reduce((a, t) => a + (t.duration || 200) * 40_000, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your playlists, liked tracks, and downloads.
        </p>
      </div>

      <div className="flex gap-2.5">
        {[
          { id: "playlists" as const, label: "Playlists", icon: ListMusic },
          { id: "downloads" as const, label: "Downloads", icon: Download },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all cursor-pointer active:scale-95 ${
              tab === id
                ? "bg-white text-black border-white shadow-sm"
                : "border-border text-muted-foreground hover:text-foreground bg-surface-elevated hover:bg-white/10"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "playlists" && (
        <div className="mt-6 space-y-10">
          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">Playlists</h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
              {playlists.map((p) => (
                <PlaylistCard key={p.id} playlist={p} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-1 text-xl font-bold text-foreground">Liked Songs</h2>
            <p className="text-xs text-muted-foreground mb-4">
              All tracks you have liked will appear here.
            </p>
            {likedTracks.length === 0 ? (
              <p className="text-sm text-muted-foreground italic bg-surface/30 p-6 rounded-2xl border border-white/5">
                No liked songs yet. Tap the heart icon on any song.
              </p>
            ) : (
              <div className="divide-y divide-border/20">
                {likedTracks.map((t, i) => (
                  <TrackRow key={t.id} track={t} index={i} queue={likedTracks} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "downloads" && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-4 border border-white/5 bg-surface/40 p-5 rounded-2xl shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">Offline Playback</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {downloadedTracks.length} tracks saved · {(downloadBytes / 1_000_000).toFixed(1)} MB
                used
              </div>
            </div>
          </div>

          {downloadedTracks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic bg-surface/30 p-6 rounded-2xl border border-white/5">
              No tracks downloaded. Hit the download icon on any song.
            </p>
          ) : (
            <div className="divide-y divide-border/20">
              {downloadedTracks.map((t, i) => (
                <TrackRow key={t.id} track={t} index={i} queue={downloadedTracks} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
