import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const linkClass =
  "rounded-sm px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground";
const activeClass = "text-foreground font-semibold";

export function SiteHeader() {
  const { user, isFacilitator } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-5 py-3">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-lg tracking-tight">MassageNow</span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            peer groups
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1">
          <Link to="/groups" className={linkClass} activeProps={{ className: `${linkClass} ${activeClass}` }}>
            Groups
          </Link>
          <Link to="/gear" className={linkClass} activeProps={{ className: `${linkClass} ${activeClass}` }}>
            Gear
          </Link>
          <Link to="/safety" className={linkClass} activeProps={{ className: `${linkClass} ${activeClass}` }}>
            Safety
          </Link>
          {user ? (
            <>
              <Link
                to="/performance"
                className={linkClass}
                activeProps={{ className: `${linkClass} ${activeClass}` }}
              >
                Performance
              </Link>
              <Link
                to="/applications"
                className={linkClass}
                activeProps={{ className: `${linkClass} ${activeClass}` }}
              >
                My place
              </Link>
              {isFacilitator ? (
                <Link
                  to="/facilitate"
                  className={linkClass}
                  activeProps={{ className: `${linkClass} ${activeClass}` }}
                >
                  Facilitate
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className={linkClass}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className={linkClass} activeProps={{ className: `${linkClass} ${activeClass}` }}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
