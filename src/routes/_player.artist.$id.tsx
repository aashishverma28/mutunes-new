import { createFileRoute, notFound } from "@tanstack/react-router";
import { Play, BadgeCheck } from "lucide-react";
import { getArtist, tracksByArtist, albumsByArtist } from "@/data/catalog";
import { TrackRow } from "@/components/player/TrackRow";
import { AlbumCard } from "@/components/player/Cards";
import { usePlayer } from "@/store/player";
import { useState } from "react";
import { getSaavnArtistDetails } from "@/lib/saavn";

export const Route = createFileRoute("/_player/artist/$id")({
  loader: async ({ params }) => {
    // 1. Try local first
    const localArtist = getArtist(params.id);
    if (localArtist) {
      return {
        artist: localArtist,
        tracks: tracksByArtist(localArtist.id),
        albums: albumsByArtist(localArtist.id),
        isLocal: true,
      };
    }

    // 2. Fetch from Saavn
    const saavnArtistData = await getSaavnArtistDetails(params.id);
    if (!saavnArtistData) throw notFound();
    return {
      artist: saavnArtistData.artist,
      tracks: saavnArtistData.tracks,
      albums: saavnArtistData.albums,
      isLocal: false,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.artist.name} — MUTUNES` },
          { name: "description", content: loaderData.artist.bio },
          { property: "og:title", content: `${loaderData.artist.name} — MUTUNES` },
          { property: "og:description", content: loaderData.artist.bio },
          { property: "og:image", content: loaderData.artist.image },
        ]
      : [],
  }),
  notFoundComponent: () => <div className="p-8">Artist not found.</div>,
  errorComponent: () => <div className="p-8">Couldn't load this artist.</div>,
  component: ArtistPage,
});

function ArtistPage() {
  const { artist, tracks, albums } = Route.useLoaderData();
  const top = tracks.slice(0, 5);
  const { playQueue } = usePlayer();
  const [following, setFollowing] = useState(false);

  return (
    <div className="space-y-10 relative">
      {/* Sleek landscape artist profile banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-2xl border border-white/5 shadow-2xl flex items-end">
        {/* Banner image background */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none scale-102"
          style={{ backgroundImage: `url(${artist.image})` }}
        />
        {/* Dark gradient fade from bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

        {/* Content overlay */}
        <div className="relative p-6 md:p-8 w-full">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <BadgeCheck className="h-4.5 w-4.5" />
            <span>Verified Artist</span>
          </div>
          <h1 className="mt-1 font-sans text-4xl md:text-5xl font-extrabold leading-tight text-white">
            {artist.name}
          </h1>
          <p className="mt-2 text-xs font-bold text-muted-foreground">
            {artist.monthlyListeners.toLocaleString()} monthly listeners
          </p>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-4">
        {/* Play Button */}
        <button
          onClick={() => playQueue(tracks)}
          className="flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 font-semibold shadow-md hover:scale-103 active:scale-97 transition-transform cursor-pointer"
        >
          <Play className="h-5 w-5 fill-current" />
          <span>Play</span>
        </button>

        {/* Follow Button */}
        <button
          onClick={() => setFollowing(!following)}
          className={`rounded-full border px-6 py-3 text-sm font-semibold transition-all cursor-pointer ${
            following
              ? "border-primary bg-primary/20 text-primary"
              : "border-border bg-surface hover:bg-white/10 text-foreground"
          }`}
        >
          {following ? "Following" : "Follow"}
        </button>
      </div>

      {/* Bio section */}
      <section className="bg-surface/30 rounded-2xl p-6 border border-white/5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
          Biography
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{artist.bio}</p>
      </section>

      {/* Popular Tracks logs */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-foreground tracking-tight">Most Popular</h2>
        <div className="divide-y divide-border/20">
          {top.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} queue={top} showAlbum={false} />
          ))}
        </div>
      </section>

      {/* Discography */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-foreground tracking-tight">Albums</h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
