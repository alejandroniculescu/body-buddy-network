import { createFileRoute, Link } from "@tanstack/react-router";
import { PEER_CONDUCT, REFERRAL_ROUTE, RED_FLAGS, TECHNIQUES, FOCUS_STATEMENT } from "@/lib/domain";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety protocol & referral route — Kinship" },
      {
        name: "description",
        content:
          "The clinician-designed safety protocol behind Kinship groups: red flags, stop rules, technique contraindications, and when to seek care.",
      },
      { property: "og:title", content: "Safety protocol & referral route — Kinship" },
      {
        property: "og:description",
        content: "Red flags, stop rules, contraindications, and the referral route peers must follow.",
      },
    ],
  }),
  component: SafetyPage,
});

function SafetyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Clinician-designed · reviewed content
      </p>
      <h1 className="mt-4 text-4xl">Safety protocol</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Kinship groups are peer spaces. The offer is: “{FOCUS_STATEMENT}” Nothing here is
        assessment, diagnosis, or treatment.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl">1. Red flags — stop and get seen</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Any of these ends the intake. No group is offered until a clinician has looked at it.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {RED_FLAGS.map((flag) => (
            <li key={flag.value} className="flex gap-3 rounded-sm border border-border bg-card p-3">
              <span className="text-destructive">▲</span>
              <span>{flag.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">2. Referral route</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {REFERRAL_ROUTE.map((line) => (
            <li key={line} className="border-l-2 border-accent pl-4 text-muted-foreground">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">3. Techniques are experiments, not treatment</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every technique is optional and stays locked until its own contraindication check is
          passed and you opt in.
        </p>
        <div className="mt-5 space-y-5">
          {TECHNIQUES.map((technique) => (
            <article key={technique.id} className="rounded-sm border border-border bg-card p-5">
              <h3 className="text-lg">{technique.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{technique.evidence}</p>
              <p className="mt-3 text-sm">
                <span className="font-semibold">Low dose: </span>
                {technique.dose}
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Stop rules
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {technique.stopRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">4. What peers may and may not do</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {PEER_CONDUCT.map((rule) => (
            <li key={rule} className="rounded-sm bg-secondary/60 p-3">
              {rule}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12">
        <Link to="/intake" className="text-sm font-semibold underline underline-offset-4">
          Start the intake →
        </Link>
      </div>
    </div>
  );
}
