import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import {
  artists,
  tracks,
  playlists,
  getArtist,
  genres,
  type Track,
  type Artist,
  type Playlist,
} from "@/data/catalog";
import { TrackRow } from "@/components/player/TrackRow";
import { ArtistCard, PlaylistCard } from "@/components/player/Cards";
import { searchSaavnSongs, searchSaavnArtists } from "@/lib/saavn";

export const Route = createFileRoute("/_player/browse")({
  head: () => ({
    meta: [
      { title: "Browse — MUTUNES" },
      {
        name: "description",
        content: "Search and explore moods, genres and curated stations across MUTUNES.",
      },
    ],
  }),
  component: Browse,
});

function Browse() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    tracks: Track[];
    artists: Artist[];
    playlists: Playlist[];
  } | null>(null);
  const query = q.trim().toLowerCase();

  useEffect(() => {
    if (!query) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const saavnTracks = await searchSaavnSongs(query);
        const saavnArtists = await searchSaavnArtists(query);
        const localArtists = artists
          .filter((a) => a.name.toLowerCase().includes(query))
          .map((a) => ({ ...a, id: String(a.id) }));
        const combinedArtists = [...localArtists, ...saavnArtists].slice(0, 6);

        const localPlaylists = playlists
          .filter(
            (p) =>
              p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query),
          )
          .slice(0, 6);

        setResults({
          tracks: saavnTracks,
          artists: combinedArtists,
          playlists: localPlaylists,
        });
      } catch (error) {
        console.error("Error searching Saavn:", error);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="space-y-8">
      {loading && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-1.5 shadow-lg">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span className="text-sm font-semibold text-foreground">Searching...</span>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search for songs, artists, playlists, or browse genres.
        </p>
      </div>

      <div className="relative mt-4 max-w-xl">
        <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search songs, artists, or playlists..."
          className="w-full rounded-full bg-surface-elevated border border-border/80 py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-white/20 focus:ring-1 focus:ring-white/10"
        />
      </div>

      {!results && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {genres.map((g) => {
            return (
              <button
                key={g.id}
                onClick={() => setQ(g.name)}
                className="group relative aspect-[5/3] overflow-hidden p-4 rounded-xl border border-white/5 text-left w-full cursor-pointer bg-surface shadow-md hover:shadow-lg transition-all hover:bg-surface-elevated"
                style={{ backgroundColor: g.color }}
              >
                <div className="text-xl font-bold text-white tracking-tight drop-shadow-md">
                  {g.name}
                </div>
                <img
                  src={g.image}
                  alt=""
                  className="absolute bottom-0 right-0 h-16 w-16 translate-x-2 translate-y-2 rotate-12 rounded-lg object-cover shadow-lg border border-white/20 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6"
                />
              </button>
            );
          })}
        </div>
      )}

      {results && (
        <div className="mt-8 space-y-10">
          {results.tracks.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl font-bold text-foreground tracking-tight">Songs</h2>
              <div className="rounded-2xl border border-white/5 bg-surface p-3 md:p-5 shadow-lg">
                <div className="divide-y divide-white/5">
                  {results.tracks.map((t, i) => (
                    <TrackRow key={t.id} track={t} index={i} queue={results.tracks} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {results.artists.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold tracking-tight">Artists</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {results.artists.map((a) => (
                  <ArtistCard key={a.id} artist={a} />
                ))}
              </div>
            </section>
          )}
          {results.playlists.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold tracking-tight">Playlists</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {results.playlists.map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            </section>
          )}
          {results.tracks.length === 0 &&
            results.artists.length === 0 &&
            results.playlists.length === 0 && (
              <p className="text-muted-foreground">
                No results found for "{q}". Try searching for something else.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
