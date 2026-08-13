import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { applyToGroup, withdrawApplication } from "@/lib/groups.functions";
import { PEER_CONDUCT, TECHNIQUES, modeLabel, regionLabel, toleranceLabel } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { GearGrid, type GearItem } from "@/components/gear-list";

function GearSection({ region }: { region: string }) {
  const { data: items } = useQuery({
    queryKey: ["gear-items", region],
    queryFn: async () => {
      const { data } = await supabase
        .from("gear_items")
        .select("*")
        .or(`region.is.null,region.eq.${region}`)
        .order("sort_order", { ascending: true });
      return (data ?? []) as GearItem[];
    },
  });

  return (
    <section className="mt-12">
      <h2 className="text-2xl">Our gear</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        What this group works with, plus the sponsor codes that come with it. Optional — none of it is
        needed to take part.
      </p>
      <GearGrid items={items ?? []} />
      <Link to="/gear" className="mt-5 inline-flex text-sm font-semibold underline underline-offset-4">
        See the full kit →
      </Link>
    </section>
  );
}

export const Route = createFileRoute("/groups/$groupId")({
  head: () => ({
    meta: [
      { title: "Group details & application — MassageNow" },
      {
        name: "description",
        content:
          "How this peer group meets, who facilitates it, how many places are left, and the optional low-dose experiments members can opt into.",
      },
      { property: "og:title", content: "Group details & application — MassageNow" },
      {
        property: "og:description",
        content: "Places left, meeting mode, facilitators, and the optional technique library.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroupDetail,
});

function GroupDetail() {
  const { groupId } = useParams({ from: "/groups/$groupId" });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const apply = useServerFn(applyToGroup);
  const withdraw = useServerFn(withdrawApplication);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: group, isLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("*").eq("id", groupId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: mine } = useQuery({
    queryKey: ["application", groupId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("group_applications")
        .select("id, status")
        .eq("group_id", groupId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: intake } = useQuery({
    queryKey: ["latest-intake", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("intakes")
        .select("id, completed, red_flag_stop")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!group) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="text-3xl">That group isn't here</h1>
        <Link to="/groups" className="mt-4 inline-block text-sm underline underline-offset-4">
          Back to all groups →
        </Link>
      </div>
    );
  }

  const placesLeft = Math.max(group.capacity - group.member_count, 0);
  const full = group.status !== "open" || placesLeft === 0;

  async function submitApplication() {
    setBusy(true);
    const result = await apply({ data: { groupId, note: note.trim() || undefined } });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Application sent. The onboarder will be in touch.");
    setNote("");
    queryClient.invalidateQueries({ queryKey: ["application", groupId, user?.id] });
  }

  async function cancelApplication() {
    if (!mine) return;
    setBusy(true);
    const result = await withdraw({ data: { applicationId: mine.id } });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Application withdrawn.");
    queryClient.invalidateQueries({ queryKey: ["application", groupId, user?.id] });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14">
      <Link to="/groups" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        ← All groups
      </Link>
      <h1 className="mt-5 text-4xl">{group.name}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{group.focus_statement}</p>

      <dl className="mt-8 grid gap-4 rounded-sm border border-border bg-card p-6 text-sm sm:grid-cols-3">
        <Meta label="Area" value={regionLabel(group.region)} />
        <Meta label="Duration band" value={group.duration_band} />
        <Meta label="Tolerance" value={toleranceLabel(group.tolerance_band)} />
        <Meta label="Meets" value={`${modeLabel(group.mode)} · ${group.location}`} />
        <Meta label="Cadence" value={group.cadence} />
        <Meta
          label="Places"
          value={full ? "Full — next circle open" : `${placesLeft} of ${group.capacity} left`}
        />
        <Meta label="Leader" value={group.leader_name} />
        <Meta label="Onboarder" value={group.onboarder_name} />
        <Meta label="Circle" value={`#${group.cohort}`} />
      </dl>

      <section className="mt-12">
        <h2 className="text-2xl">Optional experiments</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nobody has to try any of these. Each one stays locked until you tick its own
          contraindication checks, and every one has stop rules that override anything a peer says.
        </p>
        <div className="mt-5 space-y-4">
          {TECHNIQUES.map((t) => (
            <TechniqueCard key={t.id} technique={t} />
          ))}
        </div>
      </section>

      <GearSection region={group.region} />

      <section className="mt-12">
        <h2 className="text-2xl">How peers behave here</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {PEER_CONDUCT.map((rule) => (
            <li key={rule} className="rounded-sm bg-secondary/60 p-3">
              {rule}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-sm border border-border bg-card p-6">
        <h2 className="text-2xl">Apply to this group</h2>
        {!user ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              You'll need an account and a completed intake before applying.
            </p>
            <Link
              to="/auth"
              search={{ next: `/groups/${groupId}` }}
              className="mt-5 inline-flex rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Sign in to apply
            </Link>
          </>
        ) : !intake?.completed ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              The intake comes first — it's the screening step, and it takes a couple of minutes.
            </p>
            <Link
              to="/intake"
              className="mt-5 inline-flex rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Complete the intake
            </Link>
          </>
        ) : intake.red_flag_stop ? (
          <p className="mt-3 rounded-sm border-l-2 border-destructive bg-destructive/5 p-4 text-sm">
            Your intake flagged something a clinician should see first, so applications stay closed.{" "}
            <Link to="/intake/result" className="underline underline-offset-4">
              See your referral route
            </Link>
            .
          </p>
        ) : mine && mine.status !== "withdrawn" && mine.status !== "declined" ? (
          <div className="mt-3">
            <p className="text-sm">
              Your application is <strong>{mine.status}</strong>.
              {mine.status === "pending"
                ? " The onboarder reviews it before the group meets next."
                : " Welcome in — your onboarder will set up your first conversation."}
            </p>
            {mine.status === "pending" ? (
              <Button variant="outline" className="mt-4" disabled={busy} onClick={cancelApplication}>
                Withdraw application
              </Button>
            ) : null}
          </div>
        ) : full ? (
          <p className="mt-3 text-sm text-muted-foreground">
            This circle is full. A new one with the same facilitators is already open on the groups
            page.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Optional: tell the onboarder anything that would help them place you well.
            </p>
            <Textarea
              className="mt-4"
              placeholder="Anything you'd like the onboarder to know…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button className="mt-4" disabled={busy} onClick={submitApplication}>
              {busy ? "Sending…" : "Send application"}
            </Button>
          </>
        )}
      </section>
    </div>
  );
}

function TechniqueCard({ technique }: { technique: (typeof TECHNIQUES)[number] }) {
  const [checked, setChecked] = useState<string[]>([]);
  const unlocked = technique.contraindications.every((c) => checked.includes(c.id));

  return (
    <article className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg">{technique.name}</h3>
        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {unlocked ? "Unlocked" : "Locked"}
        </span>
      </div>
      <p className="mt-2 text-sm">{technique.claim}</p>
      <p className="mt-2 text-sm text-muted-foreground">{technique.evidence}</p>

      <div className="mt-4 space-y-2">
        {technique.contraindications.map((c) => (
          <label key={c.id} className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={checked.includes(c.id)}
              onCheckedChange={(value) =>
                setChecked((prev) =>
                  value ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                )
              }
            />
            <span>{c.label}</span>
          </label>
        ))}
      </div>

      {unlocked ? (
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-sm">
            <span className="font-semibold">Low dose: </span>
            {technique.dose}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">Stop rules</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {technique.stopRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
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
