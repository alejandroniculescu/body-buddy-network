import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  DURATIONS,
  GOAL_TAGS,
  NEURO_SYMPTOMS,
  RED_FLAGS,
  REGIONS,
  TOLERANCES,
} from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/intake/")({
  head: () => ({
    meta: [
      { title: "Intake & safety screening — MassageNow" },
      {
        name: "description",
        content:
          "A short intake: area, duration, red-flag screening, injury history, neurological symptoms, goals, movement tolerance, and clinical clearance.",
      },
      { property: "og:title", content: "Intake & safety screening — MassageNow" },
      {
        property: "og:description",
        content: "Eight short steps. Screening decides what happens next, not the pain location.",
      },
    ],
  }),
  component: IntakePage,
});

type Answers = {
  regions: string[];
  duration_band: string;
  red_flags: string[];
  recent_injury: boolean | null;
  injury_details: string;
  neuro_symptoms: string[];
  goals: string;
  goal_tags: string[];
  movement_tolerance: string;
  seen_clinician: boolean | null;
  cleared_for_exercise: boolean | null;
  anticoagulants: boolean | null;
  bleeding_disorder: boolean | null;
  skin_condition: boolean | null;
};

const EMPTY: Answers = {
  regions: [],
  duration_band: "",
  red_flags: [],
  recent_injury: null,
  injury_details: "",
  neuro_symptoms: [],
  goals: "",
  goal_tags: [],
  movement_tolerance: "",
  seen_clinician: null,
  cleared_for_exercise: null,
  anticoagulants: null,
  bleeding_disorder: null,
  skin_condition: null,
};

const STEP_TITLES = [
  "Where does it hurt?",
  "How long has it been going on?",
  "Safety screening",
  "Recent injury or surgery",
  "Nerve-type symptoms",
  "What are you hoping for?",
  "What can you currently tolerate?",
  "Clinical clearance",
];

const STORAGE_KEY = "kinship-intake-draft";

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm border px-4 py-2.5 text-left text-sm transition-colors ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function YesNo({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      <Chip selected={value === true} onClick={() => onChange(true)}>
        Yes
      </Chip>
      <Chip selected={value === false} onClick={() => onChange(false)}>
        No
      </Chip>
    </div>
  );
}

function IntakePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        setAnswers({ ...EMPTY, ...(JSON.parse(raw) as Answers) });
      } catch {
        /* ignore malformed drafts */
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    }
  }, [answers]);

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return answers.regions.length > 0;
      case 1:
        return !!answers.duration_band;
      case 2:
        return true;
      case 3:
        return answers.recent_injury !== null;
      case 4:
        return true;
      case 5:
        return answers.goals.trim().length > 2 || answers.goal_tags.length > 0;
      case 6:
        return !!answers.movement_tolerance;
      case 7:
        return (
          answers.seen_clinician !== null &&
          answers.cleared_for_exercise !== null &&
          answers.anticoagulants !== null &&
          answers.bleeding_disorder !== null &&
          answers.skin_condition !== null
        );
      default:
        return false;
    }
  }, [answers, step]);

  async function submit() {
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("intakes")
      .insert({
        user_id: user.id,
        regions: answers.regions,
        duration_band: answers.duration_band,
        red_flags: answers.red_flags,
        red_flag_stop: answers.red_flags.length > 0,
        recent_injury: !!answers.recent_injury,
        injury_details: answers.injury_details || null,
        neuro_symptoms: answers.neuro_symptoms,
        goals: answers.goals || null,
        goal_tags: answers.goal_tags,
        movement_tolerance: answers.movement_tolerance,
        seen_clinician: !!answers.seen_clinician,
        cleared_for_exercise: !!answers.cleared_for_exercise,
        anticoagulants: !!answers.anticoagulants,
        bleeding_disorder: !!answers.bleeding_disorder,
        skin_condition: !!answers.skin_condition,
        completed: true,
      })
      .select("id")
      .maybeSingle();
    setSaving(false);

    if (error || !data) {
      toast.error("Could not save your intake. Try once more.");
      return;
    }
    window.localStorage.removeItem(STORAGE_KEY);
    navigate({ to: "/intake/result" });
  }

  if (loading) {
    return <div className="mx-auto max-w-2xl px-5 py-20 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-20">
        <h1 className="text-3xl">First, an account</h1>
        <p className="mt-3 text-muted-foreground">
          Your intake answers are health information. They're stored against your account and only
          you can read them.
        </p>
        <Link
          to="/auth"
          search={{ next: "/intake" }}
          className="mt-6 inline-flex rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Create an account or sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12">
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Step {step + 1} of {STEP_TITLES.length}
        </p>
        <p className="text-xs text-muted-foreground">Progress is saved as you go</p>
      </div>
      <Progress value={((step + 1) / STEP_TITLES.length) * 100} className="mt-3 h-1" />
      <h1 className="mt-8 text-3xl">{STEP_TITLES[step]}</h1>

      <div className="mt-8 space-y-4">
        {step === 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Pick every area that's involved. This starts your match — it does not decide what you'll
              be offered.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {REGIONS.map((r) => (
                <Chip
                  key={r.value}
                  selected={answers.regions.includes(r.value)}
                  onClick={() => set("regions", toggle(answers.regions, r.value))}
                >
                  {r.label}
                </Chip>
              ))}
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {DURATIONS.map((d) => (
              <Chip
                key={d.value}
                selected={answers.duration_band === d.value}
                onClick={() => set("duration_band", d.value)}
              >
                {d.label}
              </Chip>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Tick anything you've noticed. If none apply, leave them all unticked and continue.
            </p>
            <div className="grid gap-2">
              {RED_FLAGS.map((f) => (
                <Chip
                  key={f.value}
                  selected={answers.red_flags.includes(f.value)}
                  onClick={() => set("red_flags", toggle(answers.red_flags, f.value))}
                >
                  {f.label}
                </Chip>
              ))}
            </div>
            {answers.red_flags.length > 0 ? (
              <p className="rounded-sm border-l-2 border-destructive bg-destructive/5 p-3 text-sm">
                We'll stop the intake here and point you to a clinician. That's the safe answer, not a
                verdict on how bad things are.
              </p>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Any injury, surgery, or procedure involving this area in the last 12 months?
            </p>
            <YesNo value={answers.recent_injury} onChange={(v) => set("recent_injury", v)} />
            {answers.recent_injury ? (
              <Textarea
                placeholder="What happened, and roughly when?"
                value={answers.injury_details}
                onChange={(e) => set("injury_details", e.target.value)}
              />
            ) : null}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Tick anything you get. These change what's safe to try, and how closely your onboarder
              checks in.
            </p>
            <div className="grid gap-2">
              {NEURO_SYMPTOMS.map((s) => (
                <Chip
                  key={s.value}
                  selected={answers.neuro_symptoms.includes(s.value)}
                  onClick={() => set("neuro_symptoms", toggle(answers.neuro_symptoms, s.value))}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {GOAL_TAGS.map((g) => (
                <Chip
                  key={g.value}
                  selected={answers.goal_tags.includes(g.value)}
                  onClick={() => set("goal_tags", toggle(answers.goal_tags, g.value))}
                >
                  {g.label}
                </Chip>
              ))}
            </div>
            <Textarea
              placeholder="In your own words — what would make a difference?"
              value={answers.goals}
              onChange={(e) => set("goals", e.target.value)}
            />
          </>
        ) : null}

        {step === 6 ? (
          <div className="grid gap-2">
            {TOLERANCES.map((t) => (
              <Chip
                key={t.value}
                selected={answers.movement_tolerance === t.value}
                onClick={() => set("movement_tolerance", t.value)}
              >
                <span className="block font-semibold">{t.label}</span>
                <span className="block text-xs opacity-80">{t.hint}</span>
              </Chip>
            ))}
          </div>
        ) : null}

        {step === 7 ? (
          <div className="space-y-6">
            {[
              { key: "seen_clinician" as const, label: "Has a clinician looked at this area?" },
              {
                key: "cleared_for_exercise" as const,
                label: "Have you been cleared for exercise?",
              },
              {
                key: "anticoagulants" as const,
                label: "Do you take anticoagulant (blood-thinning) medication?",
              },
              {
                key: "bleeding_disorder" as const,
                label: "Do you have a bleeding or clotting disorder?",
              },
              {
                key: "skin_condition" as const,
                label: "Is the skin over the area broken, irritated, or infected?",
              },
            ].map((q) => (
              <div key={q.key}>
                <p className="mb-2 text-sm">{q.label}</p>
                <YesNo value={answers[q.key]} onChange={(v) => set(q.key, v)} />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-10 flex items-center gap-3">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : null}
        {step < STEP_TITLES.length - 1 ? (
          <Button disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button disabled={!canContinue || saving} onClick={submit}>
            {saving ? "Saving…" : "Finish intake"}
          </Button>
        )}
      </div>
    </div>
  );
}
