import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/80 bg-secondary/40">
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="font-display text-base">Kinship</p>
          <p className="mt-2 max-w-xs text-muted-foreground">
            Small peer groups for people living with persistent pain. Not a clinic, not a diagnosis,
            not a treatment.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Start here</p>
          <p>
            <Link to="/intake" className="underline-offset-4 hover:underline">
              Intake &amp; screening
            </Link>
          </p>
          <p>
            <Link to="/groups" className="underline-offset-4 hover:underline">
              Browse groups
            </Link>
          </p>
          <p>
            <Link to="/safety" className="underline-offset-4 hover:underline">
              Safety protocol
            </Link>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">If in doubt</p>
          <p className="text-muted-foreground">
            Seek urgent care for loss of bladder or bowel control, saddle numbness, sudden severe
            weakness, or symptoms after significant trauma.
          </p>
        </div>
      </div>
    </footer>
  );
}
