import { type Track, type Album } from "@/data/catalog";

export type SaavnTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  audioUrl: string;
  coverUrl: string;
};

// Map Saavn API song object to our internal Track type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSaavnSong(song: any) {
  // Extract artist name robustly
  let artistName = "Unknown Artist";
  if (typeof song.primaryArtists === "string" && song.primaryArtists) {
    artistName = song.primaryArtists;
  } else if (Array.isArray(song.artists?.primary) && song.artists.primary.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    artistName = song.artists.primary.map((a: any) => a.name).join(", ");
  } else if (typeof song.artist === "string" && song.artist) {
    artistName = song.artist;
  } else if (song.singers) {
    artistName = Array.isArray(song.singers) ? song.singers.join(", ") : String(song.singers);
  }

  // Extract cover image
  let coverUrl =
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=640&q=80";
  if (Array.isArray(song.image) && song.image.length > 0) {
    coverUrl =
      song.image[song.image.length - 1].url || song.image[song.image.length - 1].link || coverUrl;
  } else if (typeof song.image === "string" && song.image) {
    coverUrl = song.image;
  }

  // Extract audio download URL
  let audioUrl = "";
  if (Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
    audioUrl =
      song.downloadUrl[song.downloadUrl.length - 1].url ||
      song.downloadUrl[song.downloadUrl.length - 1].link ||
      "";
  } else if (typeof song.downloadUrl === "string" && song.downloadUrl) {
    audioUrl = song.downloadUrl;
  }

  let artistId = "saavn-artist";
  if (Array.isArray(song.artists?.primary) && song.artists.primary.length > 0) {
    artistId = song.artists.primary[0].id || artistId;
  }

  return {
    id: `saavn-${song.id}`,
    title: song.title || song.name || "Untitled Track",
    artistId: artistId,
    albumId: `saavn-album-${song.id}`,
    duration: Number(song.duration) || 180,
    audioUrl: audioUrl,
    coverUrl: coverUrl,
    artistName: artistName,
    albumName: typeof song.album === "object" ? song.album.name : song.album || "Single",
  };
}

export async function searchSaavnSongs(query: string) {
  if (!query.trim()) return [];
  try {
    const response = await fetch(
      `https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(query)}`,
    );
    if (!response.ok) throw new Error("Saavn search request failed");

    const json = await response.json();
    let results = [];
    if (json.success && json.data) {
      results = json.data.results || json.data;
    } else if (json.results) {
      results = json.results;
    } else if (Array.isArray(json.data)) {
      results = json.data;
    } else if (Array.isArray(json)) {
      results = json;
    }

    return (results || []).map(mapSaavnSong).filter((t) => t.audioUrl);
  } catch (error) {
    console.error("Error searching JioSaavn:", error);
    return [];
  }
}

export async function getSaavnSongDetails(id: string) {
  const saavnId = id.replace("saavn-", "");
  try {
    const response = await fetch(`https://saavn.sumit.co/api/songs?id=${saavnId}`);
    if (!response.ok) throw new Error("Saavn song details request failed");

    const json = await response.json();
    let song = null;
    if (json.success && json.data) {
      song = Array.isArray(json.data) ? json.data[0] : json.data;
    } else if (Array.isArray(json)) {
      song = json[0];
    }

    return song ? mapSaavnSong(song) : null;
  } catch (error) {
    console.error("Error fetching JioSaavn details:", error);
    return null;
  }
}

export async function searchSaavnArtists(query: string) {
  if (!query.trim()) return [];
  try {
    const response = await fetch(
      `https://saavn.sumit.co/api/search/artists?query=${encodeURIComponent(query)}`,
    );
    if (!response.ok) throw new Error("Saavn artist search request failed");

    const json = await response.json();
    let results = [];
    if (json.success && json.data) {
      results = json.data.results || json.data;
    } else if (json.results) {
      results = json.results;
    } else if (Array.isArray(json.data)) {
      results = json.data;
    } else if (Array.isArray(json)) {
      results = json;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (results || []).map((artist: any) => {
      let image = "";
      if (Array.isArray(artist.image) && artist.image.length > 0) {
        image = artist.image[artist.image.length - 1].url || "";
      } else if (typeof artist.image === "string") {
        image = artist.image;
      }
      return {
        id: String(artist.id),
        name: artist.name || "Unknown Artist",
        image:
          image ||
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=640&q=80",
        monthlyListeners: 125000,
        bio: `${artist.name} is a popular artist.`,
      };
    });
  } catch (error) {
    console.error("Error searching JioSaavn artists:", error);
    return [];
  }
}

export async function getSaavnArtistDetails(id: string) {
  try {
    const response = await fetch(`https://saavn.sumit.co/api/artists?id=${id}`);
    if (!response.ok) throw new Error("Saavn artist details failed");

    const json = await response.json();
    if (!json.success || !json.data) return null;

    const data = json.data;
    let image = "";
    if (Array.isArray(data.image) && data.image.length > 0) {
      image = data.image[data.image.length - 1].url || "";
    } else if (typeof data.image === "string") {
      image = data.image;
    }

    const artistObj = {
      id: String(data.id),
      name: data.name || "Unknown Artist",
      image:
        image ||
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=640&q=80",
      monthlyListeners: Number(data.fanCount) || Number(data.followerCount) || 150000,
      bio:
        data.bio ||
        `${data.name} is a verified artist on JioSaavn. Enjoy their popular tracks, albums and singles.`,
    };

    // Map top songs
    let songs: Track[] = [];
    if (Array.isArray(data.topSongs)) {
      songs = data.topSongs.map(mapSaavnSong).filter((t) => t.audioUrl);
    }

    // Map albums and singles
    let albums: Album[] = [];
    const rawAlbums = [...(data.topAlbums || []), ...(data.singles || [])];
    if (Array.isArray(rawAlbums)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      albums = rawAlbums.map((alb: any) => {
        let albImage = "";
        if (Array.isArray(alb.image) && alb.image.length > 0) {
          albImage = alb.image[alb.image.length - 1].url || "";
        } else if (typeof alb.image === "string") {
          albImage = alb.image;
        }
        return {
          id: `saavn-album-${alb.id}`,
          title: alb.name || alb.title || "Album",
          artistId: String(data.id),
          cover:
            albImage ||
            image ||
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=640&q=80",
          year: Number(alb.year) || 2024,
        };
      });
    }

    return {
      artist: artistObj,
      tracks: songs,
      albums: albums,
    };
  } catch (error) {
    console.error("Error fetching JioSaavn artist details:", error);
    return null;
  }
}

export type LyricsLine = {
  time: number; // seconds
  text: string;
};

export type LyricsResult = {
  synced: LyricsLine[]; // time-synced lines (may be empty)
  plain: string[]; // plain text lines (always present if found)
  found: boolean;
};

function parseLrc(lrc: string): LyricsLine[] {
  const lines: LyricsLine[] = [];
  const lineRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  for (const raw of lrc.split("\n")) {
    const m = raw.match(lineRegex);
    if (m) {
      const mins = parseInt(m[1], 10);
      const secs = parseInt(m[2], 10);
      const ms = parseInt(m[3].padEnd(3, "0"), 10);
      const time = mins * 60 + secs + ms / 1000;
      lines.push({ time, text: m[4].trim() });
    }
  }
  return lines;
}

export async function getLyrics(
  title: string,
  artistName: string,
  albumName?: string,
  duration?: number,
): Promise<LyricsResult> {
  const empty: LyricsResult = { synced: [], plain: [], found: false };
  try {
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artistName,
    });
    if (albumName) params.set("album_name", albumName);
    if (duration) params.set("duration", String(Math.round(duration)));

    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
    if (!res.ok) {
      // Try search as fallback
      const searchParams = new URLSearchParams({ q: `${artistName} ${title}` });
      const searchRes = await fetch(`https://lrclib.net/api/search?${searchParams.toString()}`);
      if (!searchRes.ok) return empty;
      const searchJson: unknown[] = await searchRes.json();
      if (!Array.isArray(searchJson) || searchJson.length === 0) return empty;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const first = searchJson[0] as any;
      const plain =
        (first.plainLyrics as string | null)?.split("\n").map((l: string) => l.trim()) ?? [];
      const synced = first.syncedLyrics ? parseLrc(first.syncedLyrics as string) : [];
      return { synced, plain, found: plain.length > 0 || synced.length > 0 };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as any;
    const plain =
      (json.plainLyrics as string | null)?.split("\n").map((l: string) => l.trim()) ?? [];
    const synced = json.syncedLyrics ? parseLrc(json.syncedLyrics as string) : [];
    return { synced, plain, found: plain.length > 0 || synced.length > 0 };
  } catch {
    return empty;
  }
}

export async function getSaavnAlbumSongs(id: string): Promise<Track[]> {
  const saavnId = id.replace("saavn-album-", "");
  try {
    const response = await fetch(`https://saavn.sumit.co/api/albums?id=${saavnId}`);
    if (!response.ok) throw new Error("Saavn album details request failed");

    const json = await response.json();
    if (!json.success || !json.data || !Array.isArray(json.data.songs)) return [];

    return json.data.songs.map(mapSaavnSong).filter((t: Track) => t.audioUrl);
  } catch (error) {
    console.error("Error fetching JioSaavn album songs:", error);
    return [];
  }
}
