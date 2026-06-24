import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Library, Heart, Search, ListMusic } from "lucide-react";
import { playlists } from "@/data/catalog";

const nav = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/browse", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-6 p-4 border-r border-border/40 bg-background">
      {/* Navigation list */}
      <nav className="space-y-1">
        {nav.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? "bg-surface-elevated text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Horizontal divider */}
      <div className="h-px bg-border/40" />

      {/* Library/Mixtapes list */}
      <div className="flex flex-col min-h-0 flex-1 gap-2">
        <div className="mb-2 px-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
          <span>Playlists</span>
          <ListMusic className="h-4 w-4" />
        </div>

        <div className="-mx-2 flex-1 space-y-1 overflow-y-auto pr-1 pl-2">
          <Link
            to="/library"
            className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-all hover:bg-surface-elevated"
          >
            <div className="grid h-9 w-9 place-items-center rounded bg-primary/10 text-primary border border-primary/20 shadow-sm">
              <Heart className="h-4.5 w-4.5" fill="currentColor" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-sm text-foreground">Liked Songs</div>
              <div className="truncate text-[10px] text-muted-foreground">Auto Playlist</div>
            </div>
          </Link>

          {playlists
            .filter((p) => p.id !== "p8")
            .map((p) => (
              <Link
                key={p.id}
                to="/playlist/$id"
                params={{ id: p.id }}
                className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-all hover:bg-surface-elevated"
              >
                <img
                  src={p.cover}
                  alt=""
                  className="h-9 w-9 rounded object-cover border border-border/50"
                />
                <div className="min-w-0">
                  <div className="truncate font-medium text-sm text-foreground/90">{p.title}</div>
                  <div className="truncate text-[10px] text-muted-foreground">Playlist</div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </aside>
  );
}
