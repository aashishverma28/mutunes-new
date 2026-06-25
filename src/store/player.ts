import { create } from "zustand";
import { tracks as allTracks, type Track } from "@/data/catalog";

export type CustomPlaylist = {
  id: string;
  title: string;
  description: string;
  cover: string;
  tracks: Track[];
};

type PlayerState = {
  queue: Track[];
  index: number;
  isPlaying: boolean;
  progress: number; // seconds
  volume: number; // 0-1
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  liked: Set<string>;
  likedTracksList: Track[];
  downloaded: Set<string>;
  downloadedTracksList: Track[];
  expanded: boolean;
  customPlaylists: CustomPlaylist[];
  playQueue: (tracks: Track[], startIndex?: number) => void;
  playTrack: (track: Track) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (s: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLike: (track: Track) => void;
  toggleDownload: (track: Track) => void;
  clearCache: () => void;
  tick: () => void;
  setExpanded: (v: boolean) => void;
  activeFullPlayerTab: "queue" | "lyrics" | "related";
  setActiveFullPlayerTab: (tab: "queue" | "lyrics" | "related") => void;
  mobileTabOpen: boolean;
  setMobileTabOpen: (v: boolean) => void;
  createPlaylist: (title: string, description?: string) => string;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
};

// Singleton audio player instance
let audio: HTMLAudioElement | null = null;

if (typeof window !== "undefined") {
  audio = new Audio();

  // Listen to standard playback end to trigger next track
  audio.addEventListener("ended", () => {
    const state = usePlayer.getState();
    if (state.repeat === "one") {
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
      state.seek(0);
    } else {
      state.next();
    }
  });

  // Track progress updates dynamically
  audio.addEventListener("timeupdate", () => {
    const state = usePlayer.getState();
    const currentTrack = state.queue[state.index];
    if (audio && !audio.paused && currentTrack?.audioUrl) {
      usePlayer.setState({ progress: Math.floor(audio.currentTime) });
    }
  });
}

let initialCustomPlaylists: CustomPlaylist[] = [];
let initialLikedTracks: Track[] = [];
let initialLiked: string[] = [];
let initialDownloadedTracks: Track[] = [];
let initialDownloaded: string[] = [];

if (typeof window !== "undefined") {
  try {
    initialCustomPlaylists = JSON.parse(localStorage.getItem("mutunes-playlists") || "[]");
    initialLikedTracks = JSON.parse(localStorage.getItem("mutunes-liked-tracks") || "[]");
    initialLiked = initialLikedTracks.map((t) => t.id);
    initialDownloadedTracks = JSON.parse(localStorage.getItem("mutunes-downloaded-tracks") || "[]");
    initialDownloaded = initialDownloadedTracks.map((t) => t.id);
  } catch (e) {
    console.error("Failed to load store from localStorage", e);
  }
}

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  isPlaying: false,
  progress: 0,
  volume: 0.8,
  shuffle: false,
  repeat: "off",
  liked: new Set<string>(initialLiked),
  likedTracksList: initialLikedTracks,
  downloaded: new Set<string>(initialDownloaded),
  downloadedTracksList: initialDownloadedTracks,
  customPlaylists: initialCustomPlaylists,
  expanded: false,
  activeFullPlayerTab: "queue",
  setActiveFullPlayerTab: (tab) => set({ activeFullPlayerTab: tab }),
  mobileTabOpen: false,
  setMobileTabOpen: (v) => set({ mobileTabOpen: v }),
  playQueue: (tracks, startIndex = 0) => {
    set({ queue: tracks, index: startIndex, isPlaying: true, progress: 0 });
    const track = tracks[startIndex];
    if (audio && track) {
      if (track.audioUrl) {
        audio.src = track.audioUrl;
        audio.volume = get().volume;
        audio.play().catch((e) => console.error("Audio playback error:", e));
      } else {
        audio.pause();
        audio.src = "";
      }
    }
  },
  playTrack: (track) => {
    const { queue } = get();
    const i = queue.findIndex((t) => t.id === track.id);
    if (i >= 0) {
      set({ index: i, isPlaying: true, progress: 0 });
      const currentTrack = queue[i];
      if (audio && currentTrack) {
        if (currentTrack.audioUrl) {
          audio.src = currentTrack.audioUrl;
          audio.volume = get().volume;
          audio.play().catch((e) => console.error("Audio playback error:", e));
        } else {
          audio.pause();
          audio.src = "";
        }
      }
    } else {
      const newQueue = [track, ...queue];
      set({ queue: newQueue, index: 0, isPlaying: true, progress: 0 });
      if (audio && track.audioUrl) {
        audio.src = track.audioUrl;
        audio.volume = get().volume;
        audio.play().catch((e) => console.error("Audio playback error:", e));
      }
    }
  },
  toggle: () => {
    const nextPlaying = !get().isPlaying;
    set({ isPlaying: nextPlaying });
    if (audio) {
      if (nextPlaying) {
        const track = get().queue[get().index];
        if (track?.audioUrl) {
          if (audio.src !== track.audioUrl) {
            audio.src = track.audioUrl;
          }
          audio.volume = get().volume;
          audio.play().catch((e) => console.error("Audio play error:", e));
        }
      } else {
        audio.pause();
      }
    }
  },
  next: () => {
    const { queue, index, shuffle, repeat } = get();
    if (queue.length === 0) return;
    let nextIdx = shuffle ? Math.floor(Math.random() * queue.length) : index + 1;
    if (nextIdx >= queue.length) nextIdx = repeat === "all" ? 0 : queue.length - 1;
    set({ index: nextIdx, progress: 0, isPlaying: true });

    const nextTrack = queue[nextIdx];
    if (audio && nextTrack) {
      if (nextTrack.audioUrl) {
        audio.src = nextTrack.audioUrl;
        audio.volume = get().volume;
        audio.play().catch((e) => console.error("Audio next error:", e));
      } else {
        audio.pause();
        audio.src = "";
      }
    }
  },
  prev: () => {
    const { queue, index, progress } = get();
    if (progress > 3) {
      if (audio) audio.currentTime = 0;
      return set({ progress: 0 });
    }
    const prevIdx = Math.max(0, index - 1);
    set({ index: prevIdx, progress: 0, isPlaying: true });

    const prevTrack = queue[prevIdx];
    if (audio && prevTrack) {
      if (prevTrack.audioUrl) {
        audio.src = prevTrack.audioUrl;
        audio.volume = get().volume;
        audio.play().catch((e) => console.error("Audio prev error:", e));
      } else {
        audio.pause();
        audio.src = "";
      }
    }
  },
  seek: (s) => {
    set({ progress: s });
    if (audio) {
      audio.currentTime = s;
    }
  },
  setVolume: (v) => {
    set({ volume: v });
    if (audio) {
      audio.volume = v;
    }
  },
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () =>
    set((s) => ({ repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off" })),
  toggleLike: (track) =>
    set((s) => {
      const liked = new Set(s.liked);
      let likedTracksList = [...s.likedTracksList];
      if (liked.has(track.id)) {
        liked.delete(track.id);
        likedTracksList = likedTracksList.filter((t) => t.id !== track.id);
      } else {
        liked.add(track.id);
        likedTracksList.push(track);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("mutunes-liked-tracks", JSON.stringify(likedTracksList));
      }
      return { liked, likedTracksList };
    }),
  toggleDownload: (track) =>
    set((s) => {
      const downloaded = new Set(s.downloaded);
      let downloadedTracksList = [...s.downloadedTracksList];
      if (downloaded.has(track.id)) {
        downloaded.delete(track.id);
        downloadedTracksList = downloadedTracksList.filter((t) => t.id !== track.id);
      } else {
        downloaded.add(track.id);
        downloadedTracksList.push(track);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("mutunes-downloaded-tracks", JSON.stringify(downloadedTracksList));
      }
      return { downloaded, downloadedTracksList };
    }),
  clearCache: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mutunes-downloaded-tracks");
    }
    set(() => ({
      downloaded: new Set<string>(),
      downloadedTracksList: [],
    }));
  },
  tick: () => {
    const { isPlaying, progress, queue, index, repeat } = get();
    if (!isPlaying || queue.length === 0) return;
    const current = queue[index];
    if (!current) return;

    // If it has audio streaming URL, let the browser timeupdate handle progress
    if (current.audioUrl) return;

    if (progress + 1 >= current.duration) {
      if (repeat === "one") return set({ progress: 0 });
      get().next();
    } else {
      set({ progress: progress + 1 });
    }
  },
  setExpanded: (v) => set((s) => ({ expanded: v, mobileTabOpen: v ? s.mobileTabOpen : false })),
  createPlaylist: (title, description = "") => {
    const id = `custom-${Date.now()}`;
    const newPlaylist: CustomPlaylist = {
      id,
      title,
      description,
      cover:
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=640&q=80",
      tracks: [],
    };
    set((s) => {
      const updated = [...s.customPlaylists, newPlaylist];
      if (typeof window !== "undefined") {
        localStorage.setItem("mutunes-playlists", JSON.stringify(updated));
      }
      return { customPlaylists: updated };
    });
    return id;
  },
  deletePlaylist: (id) => {
    set((s) => {
      const updated = s.customPlaylists.filter((p) => p.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("mutunes-playlists", JSON.stringify(updated));
      }
      return { customPlaylists: updated };
    });
  },
  addTrackToPlaylist: (playlistId, track) => {
    set((s) => {
      const updated = s.customPlaylists.map((p) => {
        if (p.id === playlistId) {
          if (p.tracks.some((t) => t.id === track.id)) return p;
          const updatedTracks = [...p.tracks, track];
          const cover = p.tracks.length === 0 && track.coverUrl ? track.coverUrl : p.cover;
          return { ...p, tracks: updatedTracks, cover };
        }
        return p;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("mutunes-playlists", JSON.stringify(updated));
      }
      return { customPlaylists: updated };
    });
  },
  removeTrackFromPlaylist: (playlistId, trackId) => {
    set((s) => {
      const updated = s.customPlaylists.map((p) => {
        if (p.id === playlistId) {
          const updatedTracks = p.tracks.filter((t) => t.id !== trackId);
          return { ...p, tracks: updatedTracks };
        }
        return p;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("mutunes-playlists", JSON.stringify(updated));
      }
      return { customPlaylists: updated };
    });
  },
}));

export const useCurrentTrack = () => {
  const { queue, index } = usePlayer();
  return queue[index];
};
