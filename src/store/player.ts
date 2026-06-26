import { create } from "zustand";
import { tracks as allTracks, type Track } from "@/data/catalog";
import { supabase } from "@/lib/supabase";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { downloadTrack, deleteTrackDownload } from "@/lib/downloadManager";
import { toast } from "sonner";

let activeBlobUrl: string | null = null;

export function cleanupBlobUrl() {
  if (activeBlobUrl) {
    URL.revokeObjectURL(activeBlobUrl);
    activeBlobUrl = null;
  }
}

export function getTrackAudioUrl(track: Track, quality: string): string {
  if (!track.downloadUrl || track.downloadUrl.length === 0) {
    return track.audioUrl || "";
  }

  let targetQuality = "320kbps";
  if (quality === "low") {
    targetQuality = "96kbps";
  } else if (quality === "normal") {
    targetQuality = "160kbps";
  } else if (quality === "auto") {
    if (typeof window !== "undefined" && navigator) {
      // @ts-ignore
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        if (connection.saveData) {
          targetQuality = "96kbps";
        } else if (connection.effectiveType === "2g" || connection.effectiveType === "3g") {
          targetQuality = "96kbps";
        } else if (connection.effectiveType === "4g") {
          targetQuality = "320kbps";
        }
      } else {
        targetQuality = "160kbps";
      }
    } else {
      targetQuality = "160kbps";
    }
  }

  // Find exact match or nearest
  const match = track.downloadUrl.find((d) => d.quality === targetQuality);
  if (match) return match.url;

  // Fallback to highest quality available
  return track.downloadUrl[track.downloadUrl.length - 1]?.url || track.audioUrl || "";
}

export async function resolveAudioSource(track: Track, quality: string): Promise<string> {
  if (typeof window === "undefined" || !window.caches) {
    return getTrackAudioUrl(track, quality);
  }

  try {
    const cache = await caches.open("mutunes-tracks-cache");
    const cacheKey = `https://mutunes-local/track/${track.id}`;
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      cleanupBlobUrl();
      const blobUrl = URL.createObjectURL(blob);
      activeBlobUrl = blobUrl;
      console.log(`[AudioSource] Resolving local cached audio for: ${track.title} (${track.id})`);
      return blobUrl;
    }
  } catch (error) {
    console.error("[AudioSource] Error matches local cache:", error);
  }

  return getTrackAudioUrl(track, quality);
}

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
  downloadProgress: Record<string, number>;
  expanded: boolean;
  customPlaylists: CustomPlaylist[];
  streamQuality: string;
  downloadQuality: string;
  user: SupabaseUser | null;
  logout: () => void;
  setStreamQuality: (q: string) => Promise<void> | void;
  setDownloadQuality: (q: string) => void;
  playQueue: (tracks: Track[], startIndex?: number) => Promise<void> | void;
  playTrack: (track: Track) => Promise<void> | void;
  toggle: () => Promise<void> | void;
  next: () => Promise<void> | void;
  prev: () => Promise<void> | void;
  seek: (s: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLike: (track: Track) => void;
  toggleDownload: (track: Track) => Promise<void> | void;
  clearCache: () => Promise<void> | void;
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
    if (audio && !audio.paused && currentTrack) {
      usePlayer.setState({ progress: Math.floor(audio.currentTime) });
    }
  });
}

let initialCustomPlaylists: CustomPlaylist[] = [];
let initialLikedTracks: Track[] = [];
let initialLiked: string[] = [];
let initialDownloadedTracks: Track[] = [];
let initialDownloaded: string[] = [];
let initialStreamQuality = "high";
let initialDownloadQuality = "high";
let initialUser: SupabaseUser | null = null;

if (typeof window !== "undefined") {
  try {
    initialCustomPlaylists = JSON.parse(localStorage.getItem("mutunes-playlists") || "[]");
    initialLikedTracks = JSON.parse(localStorage.getItem("mutunes-liked-tracks") || "[]");
    initialLiked = initialLikedTracks.map((t) => t.id);
    initialDownloadedTracks = JSON.parse(localStorage.getItem("mutunes-downloaded-tracks") || "[]");
    initialDownloaded = initialDownloadedTracks.map((t) => t.id);
    initialStreamQuality = localStorage.getItem("mutunes-stream-quality") || "high";
    initialDownloadQuality = localStorage.getItem("mutunes-download-quality") || "high";
    const savedUser = localStorage.getItem("mutunes-user");
    if (savedUser) {
      initialUser = JSON.parse(savedUser);
      // Trigger database background refresh after store is initialized
      setTimeout(() => {
        if (initialUser) {
          loadUserDataFromSupabase(initialUser.id);
        }
      }, 100);
    }
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
  streamQuality: initialStreamQuality,
  downloadQuality: initialDownloadQuality,
  user: initialUser,
  downloadProgress: {},
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
    if (typeof window !== "undefined") {
      localStorage.removeItem("mutunes-user");
    }
  },
  setStreamQuality: async (q) => {
    set({ streamQuality: q });
    if (typeof window !== "undefined") {
      localStorage.setItem("mutunes-stream-quality", q);
    }
    // Dynamic bitrate switching mid-playback
    const { queue, index, isPlaying } = get();
    const track = queue[index];
    if (audio && track && !audio.src.startsWith("blob:")) {
      const newUrl = getTrackAudioUrl(track, q);
      if (newUrl && audio.src !== newUrl) {
        const currentTime = audio.currentTime;
        const wasPlaying = isPlaying && !audio.paused;
        
        audio.pause();
        audio.src = newUrl;
        
        const handleMetadata = () => {
          if (audio) {
            audio.currentTime = currentTime;
            if (wasPlaying) {
              audio.play().catch((e) => console.error("Audio playback recovery error:", e));
            }
          }
        };
        
        audio.addEventListener("loadedmetadata", handleMetadata, { once: true });
        audio.load();
      }
    }
  },
  setDownloadQuality: (q) => {
    set({ downloadQuality: q });
    if (typeof window !== "undefined") {
      localStorage.setItem("mutunes-download-quality", q);
    }
  },
  activeFullPlayerTab: "queue",
  setActiveFullPlayerTab: (tab) => set({ activeFullPlayerTab: tab }),
  mobileTabOpen: false,
  setMobileTabOpen: (v) => set({ mobileTabOpen: v }),
  playQueue: async (tracks, startIndex = 0) => {
    set({ queue: tracks, index: startIndex, isPlaying: true, progress: 0 });
    const track = tracks[startIndex];
    if (audio && track) {
      const audioUrl = await resolveAudioSource(track, get().streamQuality);
      if (audioUrl) {
        audio.src = audioUrl;
        audio.volume = get().volume;
        audio.play().catch((e) => console.error("Audio playback error:", e));
      } else {
        audio.pause();
        audio.src = "";
      }
    }
  },
  playTrack: async (track) => {
    const { queue } = get();
    const i = queue.findIndex((t) => t.id === track.id);
    if (i >= 0) {
      set({ index: i, isPlaying: true, progress: 0 });
      const currentTrack = queue[i];
      if (audio && currentTrack) {
        const audioUrl = await resolveAudioSource(currentTrack, get().streamQuality);
        if (audioUrl) {
          audio.src = audioUrl;
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
      if (audio) {
        const audioUrl = await resolveAudioSource(track, get().streamQuality);
        if (audioUrl) {
          audio.src = audioUrl;
          audio.volume = get().volume;
          audio.play().catch((e) => console.error("Audio playback error:", e));
        }
      }
    }
  },
  toggle: async () => {
    const nextPlaying = !get().isPlaying;
    set({ isPlaying: nextPlaying });
    if (audio) {
      if (nextPlaying) {
        const track = get().queue[get().index];
        if (track) {
          const audioUrl = await resolveAudioSource(track, get().streamQuality);
          if (audioUrl) {
            if (audio.src !== audioUrl) {
              audio.src = audioUrl;
            }
            audio.volume = get().volume;
            audio.play().catch((e) => console.error("Audio play error:", e));
          }
        }
      } else {
        audio.pause();
      }
    }
  },
  next: async () => {
    const { queue, index, shuffle, repeat } = get();
    if (queue.length === 0) return;
    let nextIdx = shuffle ? Math.floor(Math.random() * queue.length) : index + 1;
    if (nextIdx >= queue.length) nextIdx = repeat === "all" ? 0 : queue.length - 1;
    set({ index: nextIdx, progress: 0, isPlaying: true });

    const nextTrack = queue[nextIdx];
    if (audio && nextTrack) {
      const audioUrl = await resolveAudioSource(nextTrack, get().streamQuality);
      if (audioUrl) {
        audio.src = audioUrl;
        audio.volume = get().volume;
        audio.play().catch((e) => console.error("Audio next error:", e));
      } else {
        audio.pause();
        audio.src = "";
      }
    }
  },
  prev: async () => {
    const { queue, index, progress } = get();
    if (progress > 3) {
      if (audio) audio.currentTime = 0;
      return set({ progress: 0 });
    }
    const prevIdx = Math.max(0, index - 1);
    set({ index: prevIdx, progress: 0, isPlaying: true });

    const prevTrack = queue[prevIdx];
    if (audio && prevTrack) {
      const audioUrl = await resolveAudioSource(prevTrack, get().streamQuality);
      if (audioUrl) {
        audio.src = audioUrl;
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
      const user = s.user;
      
      if (liked.has(track.id)) {
        liked.delete(track.id);
        likedTracksList = likedTracksList.filter((t) => t.id !== track.id);
        
        // Sync delete to Supabase
        if (user) {
          supabase
            .from("liked_tracks")
            .delete()
            .eq("user_id", user.id)
            .eq("track_id", track.id)
            .then(({ error }) => {
              if (error) console.error("[SupabaseSync] Error removing like:", error);
            });
        }
      } else {
        liked.add(track.id);
        likedTracksList.push(track);
        
        // Sync insert to Supabase
        if (user) {
          supabase
            .from("liked_tracks")
            .insert({
              user_id: user.id,
              track_id: track.id,
              track_data: track,
            })
            .then(({ error }) => {
              if (error) console.error("[SupabaseSync] Error adding like:", error);
            });
        }
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("mutunes-liked-tracks", JSON.stringify(likedTracksList));
      }
      return { liked, likedTracksList };
    }),
  toggleDownload: async (track) => {
    const { downloaded, downloadedTracksList, downloadQuality, user } = get();
    const isDownloaded = downloaded.has(track.id);

    if (isDownloaded) {
      try {
        await deleteTrackDownload(track.id);
        
        if (user) {
          supabase
            .from("downloaded_tracks")
            .delete()
            .eq("user_id", user.id)
            .eq("track_id", track.id)
            .then(({ error }) => {
              if (error) console.error("[SupabaseSync] Error removing download record:", error);
            });
        }

        set((s) => {
          const newDownloaded = new Set(s.downloaded);
          newDownloaded.delete(track.id);
          const newDownloadedTracksList = s.downloadedTracksList.filter((t) => t.id !== track.id);
          
          if (typeof window !== "undefined") {
            localStorage.setItem("mutunes-downloaded-tracks", JSON.stringify(newDownloadedTracksList));
          }
          
          return {
            downloaded: newDownloaded,
            downloadedTracksList: newDownloadedTracksList,
          };
        });
        toast.success(`Removed "${track.title}" from downloads.`);
      } catch (err: any) {
        console.error("Failed to delete track download:", err);
        toast.error("Failed to delete offline files.");
      }
    } else {
      // Start download
      set((s) => ({
        downloadProgress: { ...s.downloadProgress, [track.id]: 1 },
      }));

      try {
        await downloadTrack(track, downloadQuality, (progress) => {
          set((s) => ({
            downloadProgress: { ...s.downloadProgress, [track.id]: progress },
          }));
        });

        if (user) {
          supabase
            .from("downloaded_tracks")
            .insert({
              user_id: user.id,
              track_id: track.id,
              track_data: track,
            })
            .then(({ error }) => {
              if (error) console.error("[SupabaseSync] Error creating download record:", error);
            });
        }

        // Add to downloaded tracks list
        set((s) => {
          const newDownloaded = new Set(s.downloaded);
          newDownloaded.add(track.id);
          const newDownloadedTracksList = [...s.downloadedTracksList, track];

          const newProgress = { ...s.downloadProgress };
          delete newProgress[track.id];

          if (typeof window !== "undefined") {
            localStorage.setItem("mutunes-downloaded-tracks", JSON.stringify(newDownloadedTracksList));
          }

          return {
            downloaded: newDownloaded,
            downloadedTracksList: newDownloadedTracksList,
            downloadProgress: newProgress,
          };
        });
        toast.success(`Downloaded "${track.title}" for offline playback!`);
      } catch (err: any) {
        console.error("Failed to download track:", err);
        toast.error(err.message || `Failed to download "${track.title}".`);
        
        // Clear progress
        set((s) => {
          const newProgress = { ...s.downloadProgress };
          delete newProgress[track.id];
          return { downloadProgress: newProgress };
        });
      }
    }
  },
  clearCache: async () => {
    const { user } = get();
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("mutunes-downloaded-tracks");
        if (window.caches) {
          await caches.delete("mutunes-tracks-cache");
        }
      }
      
      if (user) {
        supabase
          .from("downloaded_tracks")
          .delete()
          .eq("user_id", user.id)
          .then(({ error }) => {
            if (error) console.error("[SupabaseSync] Error clearing download records:", error);
          });
      }

      set(() => ({
        downloaded: new Set<string>(),
        downloadedTracksList: [],
      }));
      toast.success("Offline storage cleared successfully.");
    } catch (e) {
      console.error("Error clearing offline cache:", e);
      toast.error("Failed to clear offline storage.");
    }
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
    
    const user = get().user;
    if (user) {
      supabase
        .from("playlists")
        .insert({
          id,
          user_id: user.id,
          title,
          description,
          cover: newPlaylist.cover,
        })
        .then(({ error }) => {
          if (error) console.error("[SupabaseSync] Error creating playlist:", error);
        });
    }

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
    const user = get().user;
    if (user) {
      supabase
        .from("playlists")
        .delete()
        .eq("user_id", user.id)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("[SupabaseSync] Error deleting playlist:", error);
        });
    }

    set((s) => {
      const updated = s.customPlaylists.filter((p) => p.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("mutunes-playlists", JSON.stringify(updated));
      }
      return { customPlaylists: updated };
    });
  },
  addTrackToPlaylist: (playlistId, track) => {
    const user = get().user;
    set((s) => {
      const updated = s.customPlaylists.map((p) => {
        if (p.id === playlistId) {
          if (p.tracks.some((t) => t.id === track.id)) return p;
          
          if (user) {
            supabase
              .from("playlist_tracks")
              .insert({
                playlist_id: playlistId,
                track_id: track.id,
                track_data: track,
                position: p.tracks.length,
              })
              .then(({ error }) => {
                if (error) console.error("[SupabaseSync] Error adding track to playlist:", error);
              });
          }

          const updatedTracks = [...p.tracks, track];
          const cover = p.tracks.length === 0 && track.coverUrl ? track.coverUrl : p.cover;
          
          // Update playlist cover in DB if it changed
          if (p.tracks.length === 0 && track.coverUrl && user) {
            supabase
              .from("playlists")
              .update({ cover: track.coverUrl })
              .eq("id", playlistId)
              .then(({ error }) => {
                if (error) console.error("[SupabaseSync] Error updating cover:", error);
              });
          }

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
    const user = get().user;
    if (user) {
      supabase
        .from("playlist_tracks")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("track_id", trackId)
        .then(({ error }) => {
          if (error) console.error("[SupabaseSync] Error removing track from playlist:", error);
        });
    }

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

export async function mergeLocalDataToDatabase(userId: string) {
  try {
    const localLiked: Track[] = JSON.parse(localStorage.getItem("mutunes-liked-tracks") || "[]");
    const localDownloaded: Track[] = JSON.parse(localStorage.getItem("mutunes-downloaded-tracks") || "[]");
    const localPlaylists: CustomPlaylist[] = JSON.parse(localStorage.getItem("mutunes-playlists") || "[]");

    // 1. Merge liked tracks
    if (localLiked.length > 0) {
      for (const track of localLiked) {
        await supabase.from("liked_tracks").upsert({
          user_id: userId,
          track_id: track.id,
          track_data: track
        }, { onConflict: "user_id,track_id" });
      }
    }

    // 2. Merge downloaded tracks list
    if (localDownloaded.length > 0) {
      for (const track of localDownloaded) {
        await supabase.from("downloaded_tracks").upsert({
          user_id: userId,
          track_id: track.id,
          track_data: track
        }, { onConflict: "user_id,track_id" });
      }
    }

    // 3. Merge playlists
    if (localPlaylists.length > 0) {
      for (const playlist of localPlaylists) {
        // Upsert playlist
        await supabase.from("playlists").upsert({
          id: playlist.id,
          user_id: userId,
          title: playlist.title,
          description: playlist.description || "",
          cover: playlist.cover,
        }, { onConflict: "id" });

        // Upsert playlist tracks
        if (playlist.tracks && playlist.tracks.length > 0) {
          for (let index = 0; index < playlist.tracks.length; index++) {
            const track = playlist.tracks[index];
            await supabase.from("playlist_tracks").upsert({
              playlist_id: playlist.id,
              track_id: track.id,
              track_data: track,
              position: index,
            }, { onConflict: "playlist_id,track_id" });
          }
        }
      }
    }
    
    console.log("[SupabaseSync] Local library successfully merged with cloud database!");
  } catch (error) {
    console.error("[SupabaseSync] Error merging local library to cloud:", error);
  }
}

export async function loadUserDataFromSupabase(userId: string) {
  try {
    // 1. Fetch Liked Songs
    const { data: likedData, error: likedError } = await supabase
      .from("liked_tracks")
      .select("track_id, track_data")
      .eq("user_id", userId);
    
    if (likedError) throw likedError;

    // 2. Fetch Downloaded Songs List
    const { data: downloadedData, error: downloadedError } = await supabase
      .from("downloaded_tracks")
      .select("track_id, track_data")
      .eq("user_id", userId);

    if (downloadedError) throw downloadedError;

    // 3. Fetch Playlists and their tracks
    const { data: playlistsData, error: playlistsError } = await supabase
      .from("playlists")
      .select(`
        id,
        title,
        description,
        cover,
        playlist_tracks (
          track_id,
          track_data,
          position
        )
      `)
      .eq("user_id", userId);

    if (playlistsError) throw playlistsError;

    // Map liked songs
    const likedTracksList: Track[] = (likedData || []).map((d) => d.track_data as Track);
    const liked = new Set(likedTracksList.map((t) => t.id));

    // Map downloaded songs list
    const downloadedTracksList: Track[] = (downloadedData || []).map((d) => d.track_data as Track);
    const downloaded = new Set(downloadedTracksList.map((t) => t.id));

    // Map playlists
    const customPlaylists: CustomPlaylist[] = (playlistsData || []).map((p) => {
      const tracks = ((p.playlist_tracks as any[]) || [])
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((pt) => pt.track_data as Track);
      return {
        id: p.id,
        title: p.title,
        description: p.description || "",
        cover: p.cover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=640&q=80",
        tracks: tracks,
      };
    });

    // Update the Zustand store state!
    usePlayer.setState({
      liked,
      likedTracksList,
      downloaded,
      downloadedTracksList,
      customPlaylists,
    });

    // Sync back to localstorage for instant cache loading on next reload
    if (typeof window !== "undefined") {
      localStorage.setItem("mutunes-liked-tracks", JSON.stringify(likedTracksList));
      localStorage.setItem("mutunes-downloaded-tracks", JSON.stringify(downloadedTracksList));
      localStorage.setItem("mutunes-playlists", JSON.stringify(customPlaylists));
    }

    console.log("[SupabaseSync] Successfully loaded user library metrics from cloud database!");
  } catch (error) {
    console.error("[SupabaseSync] Error loading user library from cloud:", error);
  }
}

if (typeof window !== "undefined") {
  // Listen to Supabase auth changes to sync with store and localStorage
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      usePlayer.setState({ user: session.user });
      localStorage.setItem("mutunes-user", JSON.stringify(session.user));
      
      if (event === "SIGNED_IN") {
        // First merge local data, then fetch full library
        await mergeLocalDataToDatabase(session.user.id);
      }
      
      loadUserDataFromSupabase(session.user.id);
    } else if (event === "SIGNED_OUT" || (event === "INITIAL_SESSION" && !session)) {
      usePlayer.setState({ 
        user: null,
        liked: new Set<string>(),
        likedTracksList: [],
        downloaded: new Set<string>(),
        downloadedTracksList: [],
        customPlaylists: [],
      });
      localStorage.removeItem("mutunes-user");
      localStorage.removeItem("mutunes-liked-tracks");
      localStorage.removeItem("mutunes-downloaded-tracks");
      localStorage.removeItem("mutunes-playlists");
    }
  });
}
