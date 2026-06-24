export type Artist = {
  id: string;
  name: string;
  image: string;
  monthlyListeners: number;
  bio: string;
};

export type Track = {
  id: string;
  title: string;
  artistId: string;
  albumId: string;
  duration: number; // seconds
  audioUrl?: string;
  coverUrl?: string;
  artistName?: string;
  albumName?: string;
};

export type Album = {
  id: string;
  title: string;
  artistId: string;
  cover: string;
  year: number;
};

export type Playlist = {
  id: string;
  title: string;
  description: string;
  cover: string;
  trackIds: string[];
};

export type Genre = {
  id: string;
  name: string;
  color: string;
  image: string;
};

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=80`;

export const artists: Artist[] = [];
export const albums: Album[] = [];
export const tracks: Track[] = [];
export const playlists: Playlist[] = [];

export const genres: Genre[] = [
  { id: "g1", name: "Pop", color: "#EC4899", image: img("photo-1470225620780-dba8ba36b745") },
  { id: "g2", name: "Hip-Hop", color: "#F59E0B", image: img("photo-1493225457124-a3eb161ffa5f") },
  {
    id: "g3",
    name: "Electronic",
    color: "#8B5CF6",
    image: img("photo-1459749411175-04bf5292ceea"),
  },
  { id: "g4", name: "Rock", color: "#EF4444", image: img("photo-1485561222814-e6c50477491b") },
  { id: "g5", name: "Indie", color: "#10B981", image: img("photo-1487180144351-b8472da7d491") },
  { id: "g6", name: "Jazz", color: "#0EA5E9", image: img("photo-1514525253161-7a46d19cd819") },
  { id: "g7", name: "Classical", color: "#A78BFA", image: img("photo-1485579149621-3123dd979885") },
  {
    id: "g8",
    name: "R&B / Soul",
    color: "#F472B6",
    image: img("photo-1516280440614-37939bbacd81"),
  },
  { id: "g9", name: "Folk", color: "#84CC16", image: img("photo-1493676304819-0d7a8d026dcf") },
  { id: "g10", name: "Ambient", color: "#22D3EE", image: img("photo-1501386761578-eac5c94b800a") },
  { id: "g11", name: "Latin", color: "#FB7185", image: img("photo-1483412033650-1015ddeb83d1") },
  { id: "g12", name: "K-Pop", color: "#C084FC", image: img("photo-1496293455970-f8581aae0e3b") },
  { id: "g13", name: "Bhojpuri", color: "#F97316", image: img("photo-1614613535308-eb5fbd3d2c17") },
  { id: "g14", name: "Devotional", color: "#EAB308", image: img("photo-1545128485-c400e7702796") },
  {
    id: "g15",
    name: "Assamese Hits",
    color: "#14B8A6",
    image: img("photo-1507838153414-b4b713384a76"),
  },
  {
    id: "g16",
    name: "Bollywood Hits",
    color: "#EF4444",
    image: img("photo-1498038432885-c6f3f1b912ee"),
  },
  {
    id: "g17",
    name: "Haryana Hits",
    color: "#8B5CF6",
    image: img("photo-1511671782779-c97d3d27a1d4"),
  },
  {
    id: "g18",
    name: "Punjab Hits",
    color: "#F59E0B",
    image: img("photo-1470225620780-dba8ba36b745"),
  },
  {
    id: "g19",
    name: "Hollywood Trends",
    color: "#EC4899",
    image: img("photo-1514525253161-7a46d19cd819"),
  },
  {
    id: "g20",
    name: "Marathi Hits",
    color: "#F97316",
    image: img("photo-1493676304819-0d7a8d026dcf"),
  },
  {
    id: "g21",
    name: "Gujarati Hits",
    color: "#10B981",
    image: img("photo-1501386761578-eac5c94b800a"),
  },
  {
    id: "g22",
    name: "Rajasthani Hits",
    color: "#EAB308",
    image: img("photo-1545128485-c400e7702796"),
  },
  {
    id: "g23",
    name: "Tamil Hits",
    color: "#0EA5E9",
    image: img("photo-1516280440614-37939bbacd81"),
  },
  {
    id: "g24",
    name: "Telugu Hits",
    color: "#8B5CF6",
    image: img("photo-1485561222814-e6c50477491b"),
  },
  {
    id: "g25",
    name: "Malayali Hits",
    color: "#14B8A6",
    image: img("photo-1507838153414-b4b713384a76"),
  },
  {
    id: "g26",
    name: "Kannada Hits",
    color: "#F472B6",
    image: img("photo-1487180144351-b8472da7d491"),
  },
  {
    id: "g27",
    name: "Odia Hits",
    color: "#22D3EE",
    image: img("photo-1496293455970-f8581aae0e3b"),
  },
  {
    id: "g28",
    name: "Chhattisgarhi Hits",
    color: "#FB7185",
    image: img("photo-1483412033650-1015ddeb83d1"),
  },
  {
    id: "g29",
    name: "Wedding Special",
    color: "#EF4444",
    image: img("photo-1519741497674-611481863552"),
  },
];

export const getArtist = (id: string) => artists.find((a) => a.id === id);
export const getAlbum = (id: string) => albums.find((a) => a.id === id);
export const getTrack = (id: string) => tracks.find((t) => t.id === id);
export const getPlaylist = (id: string) => playlists.find((p) => p.id === id);
export const tracksByIds = (ids: string[]) => ids.map(getTrack).filter(Boolean) as Track[];
export const tracksByArtist = (artistId: string) => tracks.filter((t) => t.artistId === artistId);
export const albumsByArtist = (artistId: string) => albums.filter((a) => a.artistId === artistId);

export const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
};
