import { createFileRoute } from "@tanstack/react-router";
import { Play, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlayer } from "@/store/player";
import { searchSaavnSongs } from "@/lib/saavn";
import { type Track, playlists } from "@/data/catalog";
import { PlaylistCard } from "@/components/player/Cards";

export const Route = createFileRoute("/_player/")({
  head: () => ({
    meta: [
      { title: "Home — MUTUNES" },
      {
        name: "description",
        content: "Your daily mix, new releases and personalized recommendations on MUTUNES.",
      },
    ],
  }),
  component: Home,
});

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 first:mt-0">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground/80 mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function TrackCard({ track, onClick }: { track: Track; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative block text-left w-full cursor-pointer transition-all bg-transparent border-0"
    >
      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-surface aspect-square shadow-md">
        <img
          src={track.coverUrl}
          alt=""
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-primary text-white opacity-0 shadow-lg translate-y-2 scale-90 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-100 hover:scale-105">
          <Play className="h-5 w-5 fill-current translate-x-0.5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="font-semibold text-sm text-foreground truncate group-hover:underline">
          {track.title}
        </div>
        <div className="truncate text-xs text-muted-foreground mt-1">{track.artistName}</div>
      </div>
    </button>
  );
}

const CATEGORIES = [
  { id: "all", label: "All", query: "top english hits" },
  { id: "energize", label: "Energize", query: "workout music" },
  { id: "relax", label: "Relax", query: "acoustic chill" },
  { id: "focus", label: "Focus", query: "lofi study beats" },
  { id: "commute", label: "Commute", query: "chill synthwave" },
  { id: "bhojpuri", label: "Bhojpuri", query: "Bhojpuri hits" },
  { id: "devotional", label: "Devotional", query: "bhakti devotional songs" },
  { id: "assamese", label: "Assamese Hits", query: "Assamese hits" },
  { id: "bollywood", label: "Bollywood Hits", query: "Bollywood hits" },
  { id: "haryanvi", label: "Haryana Hits", query: "Haryanvi hits" },
  { id: "punjabi", label: "Punjab Hits", query: "Punjabi hits" },
  { id: "hollywood", label: "Hollywood Trends", query: "Hollywood hits trends" },
  { id: "marathi", label: "Marathi Hits", query: "Marathi hits" },
  { id: "gujarati", label: "Gujarati Hits", query: "Gujarati hits" },
  { id: "rajasthani", label: "Rajasthani Hits", query: "Rajasthani hits" },
  { id: "tamil", label: "Tamil Hits", query: "Tamil hits" },
  { id: "telugu", label: "Telugu Hits", query: "Telugu hits" },
  { id: "malayali", label: "Malayali Hits", query: "Malayalam hits" },
  { id: "kannada", label: "Kannada Hits", query: "Kannada hits" },
  { id: "odia", label: "Odia Hits", query: "Odia hits" },
  { id: "chhattisgarhi", label: "Chhattisgarhi Hits", query: "Chhattisgarhi hits" },
  {
    id: "wedding",
    label: "Wedding Special",
    query: "wedding shaadi marriage indian songs multi language mix",
  },
];

const STATIC_SECTIONS = [
  {
    id: "acoustic",
    title: "Acoustic & Relaxing",
    subtitle: "Crisp guitar and soothing melodies.",
    query: "indie acoustic morning",
  },
  {
    id: "night",
    title: "Nighttime Focus",
    subtitle: "Chill frequencies to work or wind down.",
    query: "lofi beats study sleep",
  },
  {
    id: "bhojpuri",
    title: "Bhojpuri Hits",
    subtitle: "Top charts and energetic Bhojpuri beats.",
    query: "Bhojpuri hits",
  },
  {
    id: "devotional",
    title: "Devotional Hits",
    subtitle: "Peaceful spiritual and devotional charts.",
    query: "bhakti devotional songs",
  },
  {
    id: "assamese",
    title: "Assamese Hits",
    subtitle: "Beautiful melodies and folk beats from Assam.",
    query: "Assamese hits",
  },
  {
    id: "bollywood",
    title: "Bollywood Hits",
    subtitle: "The biggest chartbusters and latest Hindi releases.",
    query: "Bollywood hits",
  },
  {
    id: "haryanvi",
    title: "Haryana Hits",
    subtitle: "High-energy Haryanvi beats and dance numbers.",
    query: "Haryanvi hits",
  },
  {
    id: "punjabi",
    title: "Punjab Hits",
    subtitle: "Trending Punjabi pop and bhangra hits.",
    query: "Punjabi hits",
  },
  {
    id: "hollywood",
    title: "Hollywood Trends",
    subtitle: "Trending chartbusters and international pop hits.",
    query: "Hollywood hits trends",
  },
  {
    id: "marathi",
    title: "Marathi Hits",
    subtitle: "Top Marathi tracks and traditional rhythms.",
    query: "Marathi hits",
  },
  {
    id: "gujarati",
    title: "Gujarati Hits",
    subtitle: "Latest Gujarati hits and garba beats.",
    query: "Gujarati hits",
  },
  {
    id: "rajasthani",
    title: "Rajasthani Hits",
    subtitle: "Beautiful folk and modern Rajasthani songs.",
    query: "Rajasthani hits",
  },
  {
    id: "tamil",
    title: "Tamil Hits",
    subtitle: "Super hit tracks from Kollywood.",
    query: "Tamil hits",
  },
  {
    id: "telugu",
    title: "Telugu Hits",
    subtitle: "Blockbuster songs from Tollywood.",
    query: "Telugu hits",
  },
  {
    id: "malayali",
    title: "Malayali Hits",
    subtitle: "Melodious and trending Malayalam tracks.",
    query: "Malayalam hits",
  },
  {
    id: "kannada",
    title: "Kannada Hits",
    subtitle: "Sandalwood chartbusters and trending melodies.",
    query: "Kannada hits",
  },
  {
    id: "odia",
    title: "Odia Hits",
    subtitle: "Top Odia music and latest releases.",
    query: "Odia hits",
  },
  {
    id: "chhattisgarhi",
    title: "Chhattisgarhi Hits",
    subtitle: "Popular tracks from Chhattisgarh.",
    query: "Chhattisgarhi hits",
  },
  {
    id: "wedding",
    title: "Wedding Special",
    subtitle: "Indian wedding and shaadi music mix in all languages.",
    query: "wedding shaadi marriage indian songs multi language mix",
  },
];

function Home() {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Still up?";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    if (h < 22) return "Good evening";
    return "Late night, friend";
  })();

  const { playQueue } = usePlayer();
  const [activeCategory, setActiveCategory] = useState("all");
  const [rotation, setRotation] = useState<Track[]>([]);
  const [sectionsData, setSectionsData] = useState<Record<string, Track[]>>({});
  const [mixedSongs, setMixedSongs] = useState<Track[]>([]);
  const [quickPicksLoading, setQuickPicksLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  // 1. Fetch active category Quick Picks (whenever activeCategory changes)
  useEffect(() => {
    let active = true;
    async function fetchRotation() {
      setQuickPicksLoading(true);
      try {
        const catObj = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
        const songs = await searchSaavnSongs(catObj.query);
        if (active) {
          setRotation(songs.slice(0, 12));
        }
      } catch (err) {
        console.error("Error loading rotation:", err);
      } finally {
        if (active) {
          setQuickPicksLoading(false);
        }
      }
    }
    fetchRotation();
    return () => {
      active = false;
    };
  }, [activeCategory]);

  // 2. Fetch static sections once on mount
  useEffect(() => {
    let active = true;
    async function fetchStaticSections() {
      setSectionsLoading(true);
      try {
        const data: Record<string, Track[]> = {};
        const [mixedResults] = await Promise.all([
          searchSaavnSongs("weekly trending mix popular songs"),
          ...STATIC_SECTIONS.map(async (sec) => {
            try {
              const songs = await searchSaavnSongs(sec.query);
              if (active) {
                data[sec.id] = songs.slice(0, 5);
              }
            } catch (e) {
              console.error(`Failed to fetch section ${sec.id}:`, e);
            }
          }),
        ]);
        if (active) {
          setMixedSongs(mixedResults.slice(0, 5));
          setSectionsData(data);
        }
      } catch (err) {
        console.error("Error loading static sections:", err);
      } finally {
        if (active) {
          setSectionsLoading(false);
        }
      }
    }
    fetchStaticSections();
    return () => {
      active = false;
    };
  }, []);

  const initialLoading = quickPicksLoading && Object.keys(sectionsData).length === 0;

  return (
    <div className="space-y-12">
      {/* Greeting and Category Pills */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{greeting}</h1>
        {/* Pills container - horizontally scrollable on mobile */}
        <div className="mt-4 flex gap-2.5 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 no-scrollbar snap-x scroll-smooth whitespace-nowrap">
          {CATEGORIES.map((c) => {
            const active = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all cursor-pointer border snap-start shrink-0 ${
                  active
                    ? "bg-white text-black border-white shadow-sm"
                    : "bg-surface-elevated text-foreground border-border hover:bg-white/10"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {initialLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Gathering recommendations...</span>
        </div>
      )}

      {!initialLoading && (
        <>
          {/* Section 1: Quick Picks (Structured like YT Music 4-row horizontal scrolling grid) */}
          <Section title="Start radio from a song" subtitle="Quick Picks">
            {quickPicksLoading ? (
              <div className="flex items-center gap-3 py-6">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading Quick Picks...</span>
              </div>
            ) : (
              <div className="flex gap-x-6 gap-y-3 overflow-x-auto pb-4 snap-x scrollbar-thin grid grid-flow-col grid-rows-4">
                {rotation.map((track, idx) => (
                  <div
                    key={track.id}
                    onClick={() => playQueue(rotation, idx)}
                    className="flex items-center gap-3 w-72 md:w-80 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors snap-start shrink-0 select-none group"
                  >
                    <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded bg-surface border border-white/5">
                      <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="h-4 w-4 text-white fill-current translate-x-0.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground group-hover:underline">
                        {track.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground mt-0.5">
                        {track.artistName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Section 2: Mixed for You (Playlists or Suggested Songs) */}
          <Section
            title="Mixed for you"
            subtitle="Personalized station playlists and song suggestions."
          >
            {playlists.length > 0 && (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5 mb-6">
                {playlists.slice(0, 5).map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            )}
            {mixedSongs.length > 0 && (
              <div>
                {playlists.length > 0 && (
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-3">
                    Suggested Songs
                  </h3>
                )}
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
                  {mixedSongs.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      onClick={() => playQueue(mixedSongs, mixedSongs.indexOf(track))}
                    />
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Static sections mapping */}
          {STATIC_SECTIONS.map((sec) => {
            const tracks = sectionsData[sec.id] || [];
            if (tracks.length === 0 && sectionsLoading) {
              return (
                <Section key={sec.id} title={sec.title} subtitle={sec.subtitle}>
                  <div className="flex items-center gap-3 py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Loading tracks...</span>
                  </div>
                </Section>
              );
            }
            if (tracks.length === 0) return null;
            return (
              <Section key={sec.id} title={sec.title} subtitle={sec.subtitle}>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
                  {tracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      onClick={() => playQueue(tracks, tracks.indexOf(track))}
                    />
                  ))}
                </div>
              </Section>
            );
          })}
        </>
      )}
    </div>
  );
}
