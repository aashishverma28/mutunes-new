import { Link } from "@tanstack/react-router";
import { Play, Loader2 } from "lucide-react";
import { usePlayer, type CustomPlaylist } from "@/store/player";
import { useState } from "react";
import { getSaavnAlbumSongs } from "@/lib/saavn";
import {
  tracksByIds,
  tracksByArtist,
  tracks,
  type Playlist,
  type Artist,
  type Album,
} from "@/data/catalog";

function PlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-primary text-white shadow-lg opacity-0 translate-y-2 scale-90 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-100 hover:scale-105 cursor-pointer z-10"
      aria-label="Play"
    >
      <Play className="h-5 w-5 fill-current" />
    </button>
  );
}

export function PlaylistCard({ playlist }: { playlist: Playlist | CustomPlaylist }) {
  const { playQueue } = usePlayer();
  const getTracks = () => {
    if ("tracks" in playlist) return playlist.tracks;
    return tracksByIds(playlist.trackIds || []);
  };
  return (
    <Link
      to="/playlist/$id"
      params={{ id: playlist.id }}
      className="group relative block bg-transparent text-left cursor-pointer transition-all"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl border border-white/5 bg-surface">
        <img
          src={playlist.cover}
          alt=""
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <PlayButton onClick={() => playQueue(getTracks())} />
      </div>

      <div className="mt-3">
        <div className="font-semibold text-sm text-foreground truncate group-hover:underline">
          {playlist.title}
        </div>
        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {playlist.description || `${getTracks().length} songs`}
        </div>
      </div>
    </Link>
  );
}

export function ArtistCard({ artist }: { artist: Artist }) {
  const { playQueue } = usePlayer();
  return (
    <Link
      to="/artist/$id"
      params={{ id: artist.id }}
      className="group relative block text-center cursor-pointer transition-all bg-transparent"
    >
      {/* Perfect Circle image for YT Music */}
      <div className="relative mx-auto aspect-square w-4/5 overflow-hidden rounded-full border border-white/5 bg-surface shadow-md">
        <img
          src={artist.image}
          alt=""
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <PlayButton onClick={() => playQueue(tracksByArtist(artist.id))} />
      </div>

      <div className="mt-3">
        <div className="font-semibold text-sm text-foreground truncate group-hover:underline">
          {artist.name}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mt-1">
          Artist
        </div>
      </div>
    </Link>
  );
}

export function AlbumCard({ album, artistName }: { album: Album; artistName?: string }) {
  const { playQueue } = usePlayer();
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (album.id.startsWith("saavn-album-")) {
        const songs = await getSaavnAlbumSongs(album.id);
        if (songs.length > 0) {
          playQueue(songs);
        }
      } else {
        // Local album
        const songs = tracks.filter((t) => t.albumId === album.id);
        if (songs.length > 0) {
          playQueue(songs);
        }
      }
    } catch (e) {
      console.error("Error playing album:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative bg-transparent text-left transition-all">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-white/5 bg-surface">
        <img
          src={album.cover}
          alt=""
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePlay();
          }}
          className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-primary text-white shadow-lg opacity-0 translate-y-2 scale-90 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-100 hover:scale-105 cursor-pointer z-10"
          disabled={loading}
          aria-label={`Play ${album.title}`}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Play className="h-5 w-5 fill-current" />
          )}
        </button>
      </div>

      <div className="mt-3">
        <div className="font-semibold text-sm text-foreground truncate">{album.title}</div>
        <div className="truncate text-xs text-muted-foreground mt-1">
          {album.year}
          {artistName ? ` · ${artistName}` : ""}
        </div>
      </div>
    </div>
  );
}
