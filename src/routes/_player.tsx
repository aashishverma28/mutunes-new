import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Sidebar } from "@/components/player/Sidebar";
import { NowPlaying } from "@/components/player/NowPlaying";
import { FullPlayer } from "@/components/player/FullPlayer";
import { MobileNav } from "@/components/player/MobileNav";
import { Settings, User } from "lucide-react";

export const Route = createFileRoute("/_player")({
  component: PlayerLayout,
});

function PlayerLayout() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* YT Music style Top Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-background px-6 z-30">
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="https://plain-apac-prod-public.komododecks.com/202606/26/DCtu1opdndBdW3UY3wPJ/image.png"
            alt="MUTUNES Logo"
            className="h-8 w-8 object-contain rounded-full shadow-sm"
          />
          <div className="flex items-baseline gap-1">
            <span className="font-sans text-xl font-bold tracking-tight text-foreground uppercase">
              Mutunes
            </span>
            <span className="text-[9px] uppercase font-bold text-primary tracking-widest px-1.5 py-0.5 rounded bg-primary/10">
              Music
            </span>
          </div>
        </Link>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="rounded-full p-2 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <div className="h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-border bg-surface hover:border-muted-foreground/50 transition-colors">
            {/* Simple dummy user profile avatar */}
            <div className="grid h-full w-full place-items-center bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 pb-12 pt-6">
            <Outlet />
          </div>
        </main>
      </div>
      <NowPlaying />
      <MobileNav />
      <FullPlayer />
    </div>
  );
}
