import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { REFERRAL_ROUTE, RED_FLAGS, regionLabel, toleranceLabel } from "@/lib/domain";

export const Route = createFileRoute("/intake/result")({
  head: () => ({
    meta: [
      { title: "Your screening result — Kinship" },
      {
        name: "description",
        content:
          "What your intake answers mean for next steps: a clinician referral, or the peer groups you can apply to.",
      },
      { property: "og:title", content: "Your screening result — Kinship" },
      {
        property: "og:description",
        content: "Either a referral route, or the groups matched to your area and tolerance.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultPage,
});

type Intake = {
  id: string;
  regions: string[];
  duration_band: string | null;
  red_flags: string[];
  red_flag_stop: boolean;
  neuro_symptoms: string[];
  movement_tolerance: string | null;
};

function ResultPage() {
  const { user, loading } = useAuth();
  const [intake, setIntake] = useState<Intake | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    if (!user) {
      setPending(false);
      return;
    }
    supabase
      .from("intakes")
      .select("id, regions, duration_band, red_flags, red_flag_stop, neuro_symptoms, movement_tolerance")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setIntake(data as Intake | null);
        setPending(false);
      });
  }, [user]);

  if (loading || pending) {
    return <div className="mx-auto max-w-2xl px-5 py-20 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user || !intake) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-20">
        <h1 className="text-3xl">No intake yet</h1>
        <Link to="/intake" className="mt-4 inline-block text-sm underline underline-offset-4">
          Start the intake →
        </Link>
      </div>
    );
  }

  if (intake.red_flag_stop) {
    const flagged = RED_FLAGS.filter((f) => intake.red_flags.includes(f.value));
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-14">
        <p className="text-xs uppercase tracking-[0.2em] text-destructive">Please see a clinician first</p>
        <h1 className="mt-4 text-4xl">We're not going to match you to a group yet.</h1>
        <p className="mt-4 text-muted-foreground">
          You ticked something that should be looked at by a clinician before you try anything new
          with the area. This isn't a verdict on how serious it is — it's the only safe response a
          peer service can give.
        </p>

        <div className="mt-8 rounded-sm border border-destructive/40 bg-destructive/5 p-5">
          <p className="text-sm font-semibold">What you told us</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {flagged.map((f) => (
              <li key={f.value}>{f.label}</li>
            ))}
          </ul>
        </div>

        <h2 className="mt-10 text-2xl">Referral route</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {REFERRAL_ROUTE.map((line) => (
            <li key={line} className="border-l-2 border-accent pl-4 text-muted-foreground">
              {line}
            </li>
          ))}
        </ul>

        <p className="mt-10 text-sm text-muted-foreground">
          Once you've been seen and cleared, come back and redo the intake — it takes two minutes.
        </p>
        <Link to="/intake" className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">
          Redo the intake after clearance →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Screening complete</p>
      <h1 className="mt-4 text-4xl">Nothing here needs a clinician first.</h1>
      <p className="mt-4 text-muted-foreground">
        That means you can apply to a group. A group is not a treatment plan — it's eight people, a
        leader, an onboarder, and a set of careful experiments you can opt out of at any point.
      </p>

      <dl className="mt-8 grid gap-4 rounded-sm border border-border bg-card p-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Area</dt>
          <dd className="mt-1">{intake.regions.map(regionLabel).join(", ")}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Duration</dt>
          <dd className="mt-1">{intake.duration_band ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tolerance</dt>
          <dd className="mt-1">{toleranceLabel(intake.movement_tolerance)}</dd>
        </div>
      </dl>

      {intake.neuro_symptoms.length > 0 ? (
        <p className="mt-6 rounded-sm border-l-2 border-caution bg-caution/10 p-4 text-sm">
          You mentioned nerve-type symptoms. They're not a red flag on their own, but your onboarder
          will keep loading gentle and will ask you to stop and get seen if anything progresses.
        </p>
      ) : null}

      <Link
        to="/groups"
        className="mt-9 inline-flex rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        See the groups you can apply to
      </Link>
    </div>
  );
}
