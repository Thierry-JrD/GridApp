import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, Home, Images, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Accueil", icon: Home, exact: true },
  { to: "/projects", label: "Mes projets", icon: Images },
  { to: "/settings", label: "Paramètres", icon: Settings },
  { to: "/camera", label: "Caméra", icon: Camera, soon: true },
];

export default function AppShell({ user, children }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { logout } = useAuth();

  const isActive = (item) => (item.exact ? pathname === item.to : pathname.startsWith(item.to));

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="no-print sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/85 px-3 backdrop-blur-md sm:px-5">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-brand text-brand-foreground shadow-[0_2px_12px_hsl(var(--brand)/0.35)]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="currentColor" strokeWidth="1.7" fill="none" />
            </svg>
          </span>
          <span className="font-display text-[19px] font-semibold tracking-tight">GridArt</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                isActive(item) ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
              {item.soon && (
                <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                  bientôt
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <nav className="mr-1 flex items-center gap-0.5 sm:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-lg transition-colors",
                  isActive(item) ? "bg-secondary text-foreground" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
              </Link>
            ))}
          </nav>
          <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground md:block">
            {user?.full_name || user?.email}
          </span>
          <button
            type="button"
            onClick={() => logout()}
            title="Se déconnecter"
            aria-label="Se déconnecter"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}