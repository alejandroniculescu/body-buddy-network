import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FOCUS_STATEMENT, REGIONS, modeLabel, regionLabel, toleranceLabel } from "@/lib/domain";

export const Route = createFileRoute("/groups/")({
  head: () => ({
    meta: [
      { title: "Peer groups now forming — Kinship" },
      {
        name: "description",
        content:
          "Browse peer pain groups by area, meeting mode, and location. Eight people per group, a leader and an onboarder, and a new circle opens when one fills.",
      },
      { property: "og:title", content: "Peer groups now forming — Kinship" },
      {
        property: "og:description",
        content: "Eight people per group, online or in person, with a leader and an onboarder.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const [region, setRegion] = useState<string>("all");
  const [mode, setMode] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("status", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const groups = useMemo(() => {
    return (data ?? []).filter(
      (g) => (region === "all" || g.region === region) && (mode === "all" || g.mode === mode),
    );
  }, [data, region, mode]);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Now forming</p>
      <h1 className="mt-4 text-4xl">Groups you can apply to</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Every group holds eight people. When the eighth is accepted, that circle closes and the next
        one opens with the same leader and onboarder. The shared offer is always the same:{" "}
        <em>{FOCUS_STATEMENT}</em>
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Filter label="All areas" active={region === "all"} onClick={() => setRegion("all")} />
        {REGIONS.map((r) => (
          <Filter
            key={r.value}
            label={r.label}
            active={region === r.value}
            onClick={() => setRegion(r.value)}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Filter label="Any mode" active={mode === "all"} onClick={() => setMode("all")} />
        <Filter label="Online" active={mode === "online"} onClick={() => setMode("online")} />
        <Filter
          label="In person"
          active={mode === "in_person"}
          onClick={() => setMode("in_person")}
        />
      </div>

      {isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading groups…</p>
      ) : groups.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No group matches those filters yet. Widen the filters, or check back — new circles open as
          existing ones fill.
        </p>
      ) : (
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {groups.map((g) => {
            const full = g.status !== "open" || g.member_count >= g.capacity;
            return (
              <li key={g.id} className="flex flex-col rounded-sm border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl leading-snug">{g.name}</h2>
                  <span
                    className={`shrink-0 rounded-sm px-2 py-1 text-xs ${
                      full ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {g.member_count}/{g.capacity}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{g.focus_statement}</p>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <Meta label="Area" value={regionLabel(g.region)} />
                  <Meta label="Tolerance" value={toleranceLabel(g.tolerance_band)} />
                  <Meta label="Meets" value={`${modeLabel(g.mode)} · ${g.location}`} />
                  <Meta label="Cadence" value={g.cadence} />
                  <Meta label="Leader" value={g.leader_name} />
                  <Meta label="Onboarder" value={g.onboarder_name} />
                </dl>
                <div className="mt-6 flex items-center gap-4 pt-1">
                  <Link
                    to="/groups/$groupId"
                    params={{ groupId: g.id }}
                    className="rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    {full ? "View group" : "View & apply"}
                  </Link>
                  {full ? (
                    <span className="text-xs text-muted-foreground">
                      Full — the next circle is open
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Filter({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
      }`}
    >
      {label}
    </button>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
