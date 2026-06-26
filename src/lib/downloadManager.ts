import { type Track } from "@/data/catalog";
import { getTrackAudioUrl } from "@/store/player";

const CACHE_NAME = "mutunes-tracks-cache";

// Helper to construct a stable unique cache key for a track
export function getTrackCacheKey(trackId: string): string {
  return `https://mutunes-local/track/${trackId}`;
}

// Helper to construct a stable unique cache key for a track cover
export function getCoverCacheKey(trackId: string): string {
  return `https://mutunes-local/cover/${trackId}`;
}

/**
 * Downloads a track with progress reporting and caches it in Cache Storage.
 */
export async function downloadTrack(
  track: Track,
  quality: string,
  onProgress: (progress: number) => void
): Promise<void> {
  if (typeof window === "undefined" || !window.caches) {
    throw new Error("Cache Storage API is not supported in this browser context.");
  }

  const audioUrl = getTrackAudioUrl(track, quality);
  if (!audioUrl) {
    throw new Error("No stream URL available for the requested quality.");
  }

  // 1. Fetch audio with progress tracking
  try {
    const response = await fetch(audioUrl, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Failed to fetch audio stream. Server returned status: ${response.status}`);
    }

    const contentLength = response.headers.get("content-length");
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("ReadableStream not supported on the audio response body.");
    }

    let loadedBytes = 0;
    const chunks: BlobPart[] = [];

    // Trigger initial progress
    onProgress(1);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        chunks.push(value);
        loadedBytes += value.length;
        if (totalBytes > 0) {
          const progress = Math.round((loadedBytes / totalBytes) * 100);
          onProgress(Math.max(1, Math.min(99, progress)));
        }
      }
    }

    const mimeType = response.headers.get("content-type") || "audio/mpeg";
    const audioBlob = new Blob(chunks, { type: mimeType });

    // 2. Put audio blob into Cache Storage under the stable track URL key
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = new Response(audioBlob, {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": audioBlob.size.toString(),
        "X-Mutunes-Cached-At": Date.now().toString(),
        "X-Mutunes-Quality": quality,
      },
    });

    await cache.put(getTrackCacheKey(track.id), cachedResponse);

    // 3. Optional: Try to fetch and cache the cover image for offline support
    const coverUrl = track.coverUrl;
    if (coverUrl) {
      try {
        const coverResponse = await fetch(coverUrl, { mode: "cors", credentials: "omit" });
        if (coverResponse.ok) {
          const coverBlob = await coverResponse.blob();
          const cachedCover = new Response(coverBlob, {
            headers: { "Content-Type": coverBlob.type },
          });
          await cache.put(getCoverCacheKey(track.id), cachedCover);
        }
      } catch (imgError) {
        console.warn("[DownloadManager] Failed to cache track cover image for offline use:", imgError);
        // Do not fail the overall download if only cover image caching fails
      }
    }

    onProgress(100);
  } catch (error: any) {
    console.error("[DownloadManager] Download failed for track:", track.title, error);
    
    // Check if it is a CORS/network failure
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error(
        "CORS Policy Block: The audio provider restricts browser downloads. Try changing playback quality in settings or select another song."
      );
    }
    
    throw error;
  }
}

/**
 * Removes a track and its cover from the Cache Storage.
 */
export async function deleteTrackDownload(trackId: string): Promise<boolean> {
  if (typeof window === "undefined" || !window.caches) return false;

  try {
    const cache = await caches.open(CACHE_NAME);
    const trackKey = getTrackCacheKey(trackId);
    const coverKey = getCoverCacheKey(trackId);
    
    const trackDeleted = await cache.delete(trackKey);
    await cache.delete(coverKey); // delete cover silently
    
    return trackDeleted;
  } catch (e) {
    console.error("[DownloadManager] Error deleting cached track:", e);
    return false;
  }
}

/**
 * Verifies if a track is cached in the local Cache Storage.
 */
export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  if (typeof window === "undefined" || !window.caches) return false;

  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(getTrackCacheKey(trackId));
    return !!response;
  } catch (e) {
    return false;
  }
}

/**
 * Checks if a cached cover image exists and returns its object URL.
 */
export async function getDownloadedCoverUrl(trackId: string): Promise<string | null> {
  if (typeof window === "undefined" || !window.caches) return null;

  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(getCoverCacheKey(trackId));
    if (response) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.warn("[DownloadManager] Error retrieving cached cover:", e);
  }
  return null;
}
