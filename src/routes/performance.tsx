import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { REGIONS, regionLabel, techniqueName } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Performance & provider report — MassageNow" },
      {
        name: "description",
        content:
          "Your private log of wearable readings and reported pain, the difference over time, and a printable summary you can hand to a physio or psychotherapist.",
      },
      { property: "og:title", content: "Performance & provider report — MassageNow" },
      {
        property: "og:description",
        content: "Wearables, reported pain, and a report for your healthcare providers.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Performance,
});

const today = () => new Date().toISOString().slice(0, 10);

function avg(values: number[]) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function fmt(value: number | null, digits = 1) {
  return value === null ? "—" : value.toFixed(digits);
}

function Performance() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const { data: pain } = useQuery({
    queryKey: ["pain-reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("pain_reports")
        .select("*")
        .eq("user_id", user!.id)
        .order("recorded_on", { ascending: true });
      return data ?? [];
    },
  });

  const { data: wearables } = useQuery({
    queryKey: ["wearable-readings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("wearable_readings")
        .select("*")
        .eq("user_id", user!.id)
        .order("recorded_on", { ascending: true });
      return data ?? [];
    },
  });

  const { data: checkIns } = useQuery({
    queryKey: ["perf-checkins", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("check_ins")
        .select("id, technique, dose, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const series = useMemo(() => {
    const byDate = new Map<
      string,
      { date: string; pain?: number; sleep?: number; hrv?: number; steps?: number }
    >();
    for (const p of pain ?? []) {
      const row = byDate.get(p.recorded_on) ?? { date: p.recorded_on };
      row.pain = p.pain_score;
      byDate.set(p.recorded_on, row);
    }
    for (const w of wearables ?? []) {
      const row = byDate.get(w.recorded_on) ?? { date: w.recorded_on };
      if (w.sleep_hours !== null) row.sleep = Number(w.sleep_hours);
      if (w.hrv_ms !== null) row.hrv = w.hrv_ms;
      if (w.steps !== null) row.steps = w.steps;
      byDate.set(w.recorded_on, row);
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [pain, wearables]);

  const difference = useMemo(() => {
    const scores = (pain ?? []).map((p) => p.pain_score);
    const window = Math.max(1, Math.min(14, Math.floor(scores.length / 2) || 1));
    const first = avg(scores.slice(0, window));
    const last = avg(scores.slice(-window));
    const sleepFirst = avg(
      (wearables ?? []).slice(0, window).flatMap((w) => (w.sleep_hours ? [Number(w.sleep_hours)] : [])),
    );
    const sleepLast = avg(
      (wearables ?? []).slice(-window).flatMap((w) => (w.sleep_hours ? [Number(w.sleep_hours)] : [])),
    );
    const hrvFirst = avg((wearables ?? []).slice(0, window).flatMap((w) => (w.hrv_ms ? [w.hrv_ms] : [])));
    const hrvLast = avg((wearables ?? []).slice(-window).flatMap((w) => (w.hrv_ms ? [w.hrv_ms] : [])));
    return {
      window,
      first,
      last,
      painDelta: first !== null && last !== null ? last - first : null,
      flares: (pain ?? []).filter((p) => p.flare).length,
      sleepFirst,
      sleepLast,
      hrvFirst,
      hrvLast,
    };
  }, [pain, wearables]);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-20">
        <h1 className="text-3xl">Sign in to see your performance log</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This page is private to you. Nothing on it is shared with your group.
        </p>
        <Link
          to="/auth"
          search={{ next: "/performance" }}
          className="mt-6 inline-flex rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pain-reports", user.id] });
    queryClient.invalidateQueries({ queryKey: ["wearable-readings", user.id] });
  };

  const reportText = buildReportText({
    email: user.email ?? "member",
    series,
    difference,
    pain: pain ?? [],
    checkIns: checkIns ?? [],
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14">
      <h1 className="text-4xl">Performance</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Your own numbers: what your wearable says, what you report about pain, and the difference
        between the start and now. Private to you — bring it to a physio, GP, or psychotherapist if
        it's useful.
      </p>
      <p className="mt-4 max-w-2xl border-l-2 border-accent pl-4 text-sm text-muted-foreground">
        This is a self-report log, not a clinical measure. It doesn't diagnose anything and shouldn't
        replace an assessment.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <PainForm userId={user.id} onSaved={invalidate} />
        <WearableForm userId={user.id} onSaved={invalidate} />
      </div>

      <section className="mt-14">
        <h2 className="text-2xl">The difference so far</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={`First ${difference.window} entries`} value={fmt(difference.first)} unit="/10 pain" />
          <Stat label={`Last ${difference.window} entries`} value={fmt(difference.last)} unit="/10 pain" />
          <Stat
            label="Change"
            value={
              difference.painDelta === null
                ? "—"
                : `${difference.painDelta > 0 ? "+" : ""}${difference.painDelta.toFixed(1)}`
            }
            unit="points"
          />
          <Stat label="Flare-ups logged" value={String(difference.flares)} unit="days" />
          <Stat label="Sleep, start" value={fmt(difference.sleepFirst)} unit="hours" />
          <Stat label="Sleep, now" value={fmt(difference.sleepLast)} unit="hours" />
          <Stat label="HRV, start" value={fmt(difference.hrvFirst, 0)} unit="ms" />
          <Stat label="HRV, now" value={fmt(difference.hrvLast, 0)} unit="ms" />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl">Pain against sleep and HRV</h2>
        {series.length < 2 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Log at least two days and the trend appears here.
          </p>
        ) : (
          <div className="mt-5 h-72 rounded-sm border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pain"
                  name="Pain /10"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  connectNulls
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sleep"
                  name="Sleep (h)"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="hrv"
                  name="HRV (ms)"
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 3"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl">Report for a provider</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A plain summary of dates, scores, practice dose, and change — for a physio,
          psychotherapist, or GP. Print it or copy it into an email.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => window.print()}>Print / save as PDF</Button>
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(reportText);
              toast.success("Report copied.");
            }}
          >
            Copy as text
          </Button>
        </div>
        <pre className="mt-6 overflow-x-auto whitespace-pre-wrap rounded-sm border border-border bg-card p-5 text-xs leading-relaxed">
          {reportText}
        </pre>
      </section>
    </div>
  );
}

function buildReportText({
  email,
  series,
  difference,
  pain,
  checkIns,
}: {
  email: string;
  series: { date: string; pain?: number; sleep?: number; hrv?: number }[];
  difference: {
    window: number;
    first: number | null;
    last: number | null;
    painDelta: number | null;
    flares: number;
    sleepFirst: number | null;
    sleepLast: number | null;
    hrvFirst: number | null;
    hrvLast: number | null;
  };
  pain: { recorded_on: string; region: string; pain_score: number; notes: string | null }[];
  checkIns: { technique: string; dose: string | null; created_at: string }[];
}) {
  const range =
    series.length > 0 ? `${series[0]!.date} to ${series[series.length - 1]!.date}` : "no entries yet";
  const doses = new Map<string, number>();
  for (const c of checkIns) doses.set(c.technique, (doses.get(c.technique) ?? 0) + 1);
  const regions = [...new Set(pain.map((p) => p.region))].map(regionLabel).join(", ") || "—";

  return [
    "MASSAGENOW — SELF-REPORT SUMMARY",
    "For information only. Self-reported by the participant; not a clinical assessment.",
    "",
    `Participant: ${email}`,
    `Period: ${range}`,
    `Areas reported: ${regions}`,
    "",
    "REPORTED PAIN (0-10, participant rating)",
    `  First ${difference.window} entries, mean: ${fmt(difference.first)}`,
    `  Last ${difference.window} entries, mean:  ${fmt(difference.last)}`,
    `  Change: ${
      difference.painDelta === null
        ? "—"
        : `${difference.painDelta > 0 ? "+" : ""}${difference.painDelta.toFixed(1)} points`
    }`,
    `  Flare-up days logged: ${difference.flares}`,
    "",
    "WEARABLE READINGS (device or manual entry)",
    `  Sleep, first window: ${fmt(difference.sleepFirst)} h → latest window: ${fmt(difference.sleepLast)} h`,
    `  HRV, first window: ${fmt(difference.hrvFirst, 0)} ms → latest window: ${fmt(difference.hrvLast, 0)} ms`,
    "",
    "SELF-GUIDED PRACTICE (sessions logged)",
    doses.size
      ? [...doses.entries()].map(([t, n]) => `  ${techniqueName(t)}: ${n} session(s)`).join("\n")
      : "  No sessions logged.",
    "",
    "DAILY ENTRIES",
    series.length
      ? series
          .map(
            (s) =>
              `  ${s.date}  pain ${s.pain ?? "—"}/10  sleep ${s.sleep ?? "—"}h  hrv ${s.hrv ?? "—"}ms`,
          )
          .join("\n")
      : "  None.",
    "",
    "NOTES FROM THE PARTICIPANT",
    pain.filter((p) => p.notes).length
      ? pain
          .filter((p) => p.notes)
          .map((p) => `  ${p.recorded_on}: ${p.notes}`)
          .join("\n")
      : "  None.",
  ].join("\n");
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground">{unit}</p>
    </div>
  );
}

function PainForm({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [date, setDate] = useState(today());
  const [region, setRegion] = useState(REGIONS[0]!.value);
  const [painScore, setPainScore] = useState([4]);
  const [stiffness, setStiffness] = useState([4]);
  const [functionScore, setFunctionScore] = useState([6]);
  const [flare, setFlare] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("pain_reports").insert({
      user_id: userId,
      recorded_on: date,
      region,
      pain_score: painScore[0]!,
      stiffness_score: stiffness[0]!,
      function_score: functionScore[0]!,
      flare,
      notes: notes || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not save that entry.");
      return;
    }
    setNotes("");
    toast.success("Pain entry saved.");
    onSaved();
  }

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <h2 className="text-xl">Report pain</h2>
      <Input type="date" className="mt-4" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        {REGIONS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRegion(r.value)}
            className={`rounded-sm border px-3 py-1.5 text-xs ${
              region === r.value ? "border-primary bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <ScoreSlider label="Pain right now" value={painScore} onChange={setPainScore} />
      <ScoreSlider label="Stiffness" value={stiffness} onChange={setStiffness} />
      <ScoreSlider label="Function (10 = normal)" value={functionScore} onChange={setFunctionScore} />
      <label className="mt-4 flex items-center gap-3 text-sm">
        <Checkbox checked={flare} onCheckedChange={(v) => setFlare(v === true)} />
        <span>This was a flare-up day</span>
      </label>
      <Textarea
        className="mt-3"
        placeholder="What changed, what you avoided, what helped…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <Button className="mt-4" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Save pain entry"}
      </Button>
    </div>
  );
}

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number[];
  onChange: (v: number[]) => void;
}) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value[0]}/10</span>
      </div>
      <Slider className="mt-2" min={0} max={10} step={1} value={value} onValueChange={onChange} />
    </div>
  );
}

const SOURCES = ["manual", "apple_health", "garmin", "fitbit", "whoop", "oura"];

function WearableForm({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [date, setDate] = useState(today());
  const [source, setSource] = useState("manual");
  const [sleep, setSleep] = useState("");
  const [restingHr, setRestingHr] = useState("");
  const [hrv, setHrv] = useState("");
  const [steps, setSteps] = useState("");
  const [activeMinutes, setActiveMinutes] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("wearable_readings").upsert(
      {
        user_id: userId,
        recorded_on: date,
        source,
        sleep_hours: sleep ? Number(sleep) : null,
        resting_hr: restingHr ? Number(restingHr) : null,
        hrv_ms: hrv ? Number(hrv) : null,
        steps: steps ? Number(steps) : null,
        active_minutes: activeMinutes ? Number(activeMinutes) : null,
      },
      { onConflict: "user_id,recorded_on" },
    );
    setBusy(false);
    if (error) {
      toast.error("Could not save that reading.");
      return;
    }
    toast.success("Wearable reading saved.");
    onSaved();
  }

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <h2 className="text-xl">Wearable readings</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Copy the day's numbers from your watch or ring. One entry per day; saving again overwrites it.
      </p>
      <Input type="date" className="mt-4" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={`rounded-sm border px-3 py-1.5 text-xs ${
              source === s ? "border-primary bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Input placeholder="Sleep (h)" value={sleep} onChange={(e) => setSleep(e.target.value)} />
        <Input placeholder="Resting HR" value={restingHr} onChange={(e) => setRestingHr(e.target.value)} />
        <Input placeholder="HRV (ms)" value={hrv} onChange={(e) => setHrv(e.target.value)} />
        <Input placeholder="Steps" value={steps} onChange={(e) => setSteps(e.target.value)} />
        <Input
          placeholder="Active minutes"
          value={activeMinutes}
          onChange={(e) => setActiveMinutes(e.target.value)}
        />
      </div>
      <Button className="mt-4" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Save reading"}
      </Button>
    </div>
  );
}
