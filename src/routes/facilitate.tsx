import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  claimFacilitatorRole,
  createGroup,
  decideApplication,
  getFacilitatorQueue,
} from "@/lib/groups.functions";
import { DURATIONS, PEER_CONDUCT, REGIONS, TOLERANCES, modeLabel, regionLabel } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/facilitate")({
  head: () => ({
    meta: [
      { title: "Facilitate a group — leaders & onboarders — MassageNow" },
      {
        name: "description",
        content:
          "Open a circle, review applications, and accept members. When a group reaches eight, the next circle opens automatically.",
      },
      { property: "og:title", content: "Facilitate a group — MassageNow" },
      {
        property: "og:description",
        content: "Leaders and onboarders open circles and review applications here.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FacilitatePage,
});

function FacilitatePage() {
  const { user, roles, loading, refreshRoles } = useAuth();
  const queryClient = useQueryClient();
  const claim = useServerFn(claimFacilitatorRole);
  const decide = useServerFn(decideApplication);
  const create = useServerFn(createGroup);

  const isFacilitator = roles.includes("leader") || roles.includes("onboarder");

  const { data: queue } = useQuery({
    queryKey: ["facilitator-queue", user?.id],
    enabled: !!user && isFacilitator,
    queryFn: () => getFacilitatorQueue(),
  });

  if (loading) {
    return <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-20">
        <h1 className="text-3xl">Facilitator space</h1>
        <p className="mt-3 text-muted-foreground">
          Leaders and onboarders sign in here to open circles and review applications.
        </p>
        <Link
          to="/auth"
          search={{ next: "/facilitate" }}
          className="mt-6 inline-flex rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  async function takeRole(role: "leader" | "onboarder") {
    const result = await claim({ data: { role } });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    await refreshRoles();
    toast.success(role === "leader" ? "You're set up as a group leader." : "You're set up as an onboarder.");
  }

  if (!isFacilitator) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-14">
        <h1 className="text-4xl">Facilitate a group</h1>
        <p className="mt-4 text-muted-foreground">
          Two roles hold a circle. The <strong>leader</strong> runs the sessions and keeps the group
          to its offer. The <strong>onboarder</strong> meets each new member first, walks them
          through the safety protocol, and is the person they tell when something changes.
        </p>
        <ul className="mt-6 space-y-2 text-sm">
          {PEER_CONDUCT.map((rule) => (
            <li key={rule} className="rounded-sm bg-secondary/60 p-3">
              {rule}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          Neither role assesses, diagnoses, or treats. Both follow the{" "}
          <Link to="/safety" className="underline underline-offset-4">
            safety protocol
          </Link>{" "}
          and refer out.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => takeRole("leader")}>I'm a group leader</Button>
          <Button variant="outline" onClick={() => takeRole("onboarder")}>
            I'm an onboarder
          </Button>
        </div>
      </div>
    );
  }

  async function onDecide(applicationId: string, accept: boolean) {
    const result = await decide({ data: { applicationId, accept } });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      accept
        ? result.spawned
          ? "Accepted — that circle is full, so the next one just opened."
          : "Accepted."
        : "Declined.",
    );
    queryClient.invalidateQueries({ queryKey: ["facilitator-queue", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  }

  const groups = queue?.groups ?? [];
  const applications = queue?.applications ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14">
      <h1 className="text-4xl">Facilitator space</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Signed in as {roles.filter((r) => r !== "member").join(" & ") || "facilitator"}.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl">Your circles</h2>
        {groups.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            You don't run a circle yet. Open one below.
          </p>
        ) : (
          <ul className="mt-4 space-y-5">
            {groups.map((g) => {
              const pending = applications.filter(
                (a) => a.group_id === g.id && a.status === "pending",
              );
              return (
                <li key={g.id} className="rounded-sm border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg">{g.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {regionLabel(g.region)} · {modeLabel(g.mode)} · {g.location} · {g.cadence}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-sm bg-secondary px-2 py-1 text-xs">
                      {g.member_count}/{g.capacity} · {g.status}
                    </span>
                  </div>

                  <p className="mt-5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Pending applications
                  </p>
                  {pending.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Nothing waiting.</p>
                  ) : (
                    <ul className="mt-2 space-y-3">
                      {pending.map((a) => (
                        <li
                          key={a.id}
                          className="rounded-sm border border-border p-4 text-sm"
                        >
                          <p className="text-xs text-muted-foreground">
                            Applied {new Date(a.created_at).toLocaleDateString()} · screening passed
                          </p>
                          {a.note ? <p className="mt-2">“{a.note}”</p> : null}
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" onClick={() => onDecide(a.id, true)}>
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDecide(a.id, false)}
                            >
                              Decline
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl">Open a circle</h2>
        <NewGroupForm
          asRole={roles.includes("leader") ? "leader" : "onboarder"}
          onCreate={async (values) => {
            const result = await create({ data: values });
            if (!result.ok) {
              toast.error(result.error);
              return false;
            }
            toast.success("Circle opened.");
            queryClient.invalidateQueries({ queryKey: ["facilitator-queue", user?.id] });
            queryClient.invalidateQueries({ queryKey: ["groups"] });
            return true;
          }}
        />
      </section>
    </div>
  );
}

type NewGroupValues = {
  name: string;
  region: string;
  duration_band: string;
  tolerance_band: string;
  mode: "online" | "in_person";
  location: string;
  cadence: string;
  leader_name: string;
  onboarder_name: string;
  as_role: "leader" | "onboarder";
};

function NewGroupForm({
  asRole,
  onCreate,
}: {
  asRole: "leader" | "onboarder";
  onCreate: (values: NewGroupValues) => Promise<boolean>;
}) {
  const [values, setValues] = useState<NewGroupValues>({
    name: "",
    region: REGIONS[0]!.value,
    duration_band: DURATIONS[0]!.value,
    tolerance_band: TOLERANCES[0]!.value,
    mode: "online",
    location: "",
    cadence: "",
    leader_name: "",
    onboarder_name: "",
    as_role: asRole,
  });
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof NewGroupValues>(key: K, value: NewGroupValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const valid =
    values.name.length > 2 &&
    values.location.length > 1 &&
    values.cadence.length > 1 &&
    values.leader_name.length > 1 &&
    values.onboarder_name.length > 1;

  return (
    <div className="mt-5 rounded-sm border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Circle name">
          <Input value={values.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Area">
          <Select
            value={values.region}
            options={REGIONS.map((r) => ({ value: r.value, label: r.label }))}
            onChange={(v) => set("region", v)}
          />
        </Field>
        <Field label="Duration band">
          <Select
            value={values.duration_band}
            options={DURATIONS.map((d) => ({ value: d.value, label: d.label }))}
            onChange={(v) => set("duration_band", v)}
          />
        </Field>
        <Field label="Tolerance band">
          <Select
            value={values.tolerance_band}
            options={TOLERANCES.map((t) => ({ value: t.value, label: t.label }))}
            onChange={(v) => set("tolerance_band", v)}
          />
        </Field>
        <Field label="Meeting mode">
          <Select
            value={values.mode}
            options={[
              { value: "online", label: "Online" },
              { value: "in_person", label: "In person" },
            ]}
            onChange={(v) => set("mode", v as "online" | "in_person")}
          />
        </Field>
        <Field label={values.mode === "online" ? "Platform" : "Venue & city"}>
          <Input value={values.location} onChange={(e) => set("location", e.target.value)} />
        </Field>
        <Field label="Cadence">
          <Input
            placeholder="Tuesdays, 19:00, fortnightly"
            value={values.cadence}
            onChange={(e) => set("cadence", e.target.value)}
          />
        </Field>
        <Field label="Leader name">
          <Input value={values.leader_name} onChange={(e) => set("leader_name", e.target.value)} />
        </Field>
        <Field label="Onboarder name">
          <Input
            value={values.onboarder_name}
            onChange={(e) => set("onboarder_name", e.target.value)}
          />
        </Field>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Circles hold eight. When the eighth member is accepted, this one closes and an identical
        circle opens for the next people.
      </p>
      <Button
        className="mt-4"
        disabled={!valid || busy}
        onClick={async () => {
          setBusy(true);
          const ok = await onCreate(values);
          setBusy(false);
          if (ok) setValues((prev) => ({ ...prev, name: "", location: "", cadence: "" }));
        }}
      >
        {busy ? "Opening…" : "Open circle"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
