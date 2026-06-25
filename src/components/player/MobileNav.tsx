import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Library, Search } from "lucide-react";

const nav = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/browse", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
];

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="md:hidden flex h-14 shrink-0 items-center justify-around border-t border-border/40 bg-surface px-4 pb-safe-bottom z-30">
      {nav.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? pathname === to : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[10px] font-medium transition-all ${
              active
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
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
  );
}
