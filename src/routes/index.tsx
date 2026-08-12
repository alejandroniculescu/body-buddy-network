import { createFileRoute, Link } from "@tanstack/react-router";
import { FOCUS_STATEMENT, TECHNIQUES } from "@/lib/domain";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MassageNow — weekly self-guided massage peer groups" },
      {
        name: "description",
        content:
          "Join a peer group of eight dedicated to weekly self-guided massage. A short safety screen first, then a space to talk, learn, and work on your pain points.",
      },
      { property: "og:title", content: "MassageNow — weekly self-guided massage peer groups" },
      {
        property: "og:description",
        content:
          "Weekly self-guided massage in small peer groups. Safety screening first; every technique is an optional, low-dose experiment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div>
      <section className="mx-auto w-full max-w-5xl px-5 pt-16 pb-14 sm:pt-24">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Peer groups · eight people · weekly practice
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.08] sm:text-6xl">
          Join peer groups dedicated to weekly self-guided massage.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          A space to talk, learn, and overcome pain points. You answer a few safety questions first —
          if nothing needs a clinician, we show you the groups you can apply to.
        </p>


        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            to="/intake"
            className="inline-flex items-center rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start the intake
          </Link>
          <Link
            to="/groups"
            className="inline-flex items-center rounded-sm border border-input px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            Look at the groups first
          </Link>
        </div>

        <p className="mt-8 max-w-xl border-l-2 border-accent pl-4 text-sm text-muted-foreground">
          MassageNow is not a clinic. Nothing here is diagnosis or treatment, and no peer will tell you
          what's wrong with you.
        </p>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-14 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Screen before you join",
              body: "Area, duration, red flags, recent injury or surgery, numbness or weakness, goals, movement tolerance, and clinical clearance. Red flags stop the flow and send you to a clinician.",
            },
            {
              step: "02",
              title: "Apply to a group",
              body: "Each group shows how many of its eight places are taken, whether it meets online or in person, and who leads and onboards it. At eight, the next circle opens.",
            },
            {
              step: "03",
              title: "Practise together, weekly",
              body: "Groups meet weekly to talk and practise. Every technique is optional and locked until you pass its own contraindication check — low-dose, time-limited, stopped on a flare.",
            },

          ].map((item) => (
            <div key={item.step}>
              <p className="font-display text-3xl text-accent">{item.step}</p>
              <h2 className="mt-2 text-xl">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-5 py-16">
        <h2 className="text-3xl">What a group actually offers</h2>
        <p className="mt-4 max-w-2xl text-lg">“{FOCUS_STATEMENT}”</p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Not “we treat this area with these tools”. Peers support practice. They do not diagnose,
          promise relief, or pressure anyone into a technique.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {TECHNIQUES.map((t) => (
            <article key={t.id} className="rounded-sm border border-border bg-card p-5">
              <h3 className="text-lg">{t.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.claim}</p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t.evidence}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
                Optional · locked until checked
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <Link to="/safety" className="text-sm font-semibold underline underline-offset-4">
            Read the safety protocol and referral route →
          </Link>
        </div>
      </section>
    </div>
  );
}
