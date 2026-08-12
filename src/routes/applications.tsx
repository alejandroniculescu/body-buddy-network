import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { withdrawApplication } from "@/lib/groups.functions";
import { TECHNIQUES, modeLabel, techniqueName } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "My place — applications & check-ins — Kinship" },
      {
        name: "description",
        content:
          "Track your group applications, see the circles you've joined, and log short check-ins about what you tried and how it felt.",
      },
      { property: "og:title", content: "My place — Kinship" },
      {
        property: "og:description",
        content: "Applications, groups you've joined, and your check-in history.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyPlace,
});

function MyPlace() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const withdraw = useServerFn(withdrawApplication);

  const { data: applications } = useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("group_applications")
        .select("id, status, note, created_at, group_id, groups(name, mode, location, cadence)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: checkIns } = useQuery({
    queryKey: ["my-checkins", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("check_ins")
        .select("id, technique, dose, felt_after, notes, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  if (loading) {
    return <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-20">
        <h1 className="text-3xl">Sign in to see your place</h1>
        <Link
          to="/auth"
          search={{ next: "/applications" }}
          className="mt-6 inline-flex rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const accepted = (applications ?? []).filter((a) => a.status === "accepted");

  async function cancel(id: string) {
    const result = await withdraw({ data: { applicationId: id } });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Withdrawn.");
    queryClient.invalidateQueries({ queryKey: ["my-applications", user?.id] });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14">
      <h1 className="text-4xl">My place</h1>

      <section className="mt-10">
        <h2 className="text-2xl">Applications</h2>
        {!applications?.length ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing yet.{" "}
            <Link to="/groups" className="underline underline-offset-4">
              Browse the groups
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {applications.map((a) => (
              <li key={a.id} className="rounded-sm border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to="/groups/$groupId"
                      params={{ groupId: a.group_id }}
                      className="text-lg underline-offset-4 hover:underline"
                    >
                      {a.groups?.name ?? "Group"}
                    </Link>
                    {a.groups ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {modeLabel(a.groups.mode)} · {a.groups.location} · {a.groups.cadence}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-sm bg-secondary px-2 py-1 text-xs uppercase tracking-[0.12em]">
                    {a.status}
                  </span>
                </div>
                {a.note ? <p className="mt-3 text-sm text-muted-foreground">“{a.note}”</p> : null}
                {a.status === "pending" ? (
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => cancel(a.id)}>
                    Withdraw
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl">Check-in</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Short, honest notes on what you tried and what followed. This is how you find out what
          helps you — it isn't a progress report and nobody grades it.
        </p>
        {accepted.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Check-ins open once you've been accepted into a group.
          </p>
        ) : (
          <CheckInForm
            userId={user.id}
            groupId={accepted[0].group_id}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["my-checkins", user.id] })}
          />
        )}

        {checkIns?.length ? (
          <ul className="mt-8 space-y-3">
            {checkIns.map((c) => (
              <li key={c.id} className="rounded-sm border border-border bg-card p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="font-semibold">{techniqueName(c.technique)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                {c.dose ? <p className="mt-1 text-muted-foreground">Dose: {c.dose}</p> : null}
                {c.felt_after ? <p className="mt-1">After: {c.felt_after}</p> : null}
                {c.notes ? <p className="mt-1 text-muted-foreground">{c.notes}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function CheckInForm({
  userId,
  groupId,
  onSaved,
}: {
  userId: string;
  groupId: string;
  onSaved: () => void;
}) {
  const [technique, setTechnique] = useState(TECHNIQUES[0].id);
  const [dose, setDose] = useState("");
  const [feltAfter, setFeltAfter] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("check_ins").insert({
      user_id: userId,
      group_id: groupId,
      technique,
      dose: dose || null,
      felt_after: feltAfter || null,
      notes: notes || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not save that check-in.");
      return;
    }
    setDose("");
    setFeltAfter("");
    setNotes("");
    toast.success("Check-in saved.");
    onSaved();
  }

  return (
    <div className="mt-5 rounded-sm border border-border bg-card p-5">
      <div className="flex flex-wrap gap-2">
        {TECHNIQUES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTechnique(t.id)}
            className={`rounded-sm border px-3 py-1.5 text-xs ${
              technique === t.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
      <Input
        className="mt-4"
        placeholder="Dose — e.g. 60 seconds, light pressure"
        value={dose}
        onChange={(e) => setDose(e.target.value)}
      />
      <Input
        className="mt-3"
        placeholder="How did it feel afterwards, and the next morning?"
        value={feltAfter}
        onChange={(e) => setFeltAfter(e.target.value)}
      />
      <Textarea
        className="mt-3"
        placeholder="Anything else worth remembering"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <Button className="mt-4" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Save check-in"}
      </Button>
    </div>
  );
}
