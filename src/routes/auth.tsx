import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { claimFacilitatorRole } from "@/lib/groups.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Kinship peer groups" },
      {
        name: "description",
        content:
          "Create a Kinship account as a member, a group leader, or an onboarder, or sign back in to your intake and group.",
      },
      { property: "og:title", content: "Sign in — Kinship peer groups" },
      {
        property: "og:description",
        content: "Sign in to continue your intake or manage the group you facilitate.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";
type SignupRole = "member" | "leader" | "onboarder";

const ROLE_COPY: { value: SignupRole; label: string; body: string }[] = [
  {
    value: "member",
    label: "I'm here for myself",
    body: "You'll do the intake, get screened, and apply to a group.",
  },
  {
    value: "leader",
    label: "I lead a group",
    body: "You run sessions, hold the safety protocol, and decide applications for your groups.",
  },
  {
    value: "onboarder",
    label: "I onboard new people",
    body: "You welcome applicants, walk them through stop rules, and flag anything that needs referral.",
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<SignupRole>("member");
  const [busy, setBusy] = useState(false);

  const nextPath = search.next && search.next.startsWith("/") ? search.next : "/intake";

  useEffect(() => {
    const raw = sessionStorage.getItem("oauth_pending");
    if (!raw) return;
    const pending = JSON.parse(raw);
    sessionStorage.removeItem("oauth_pending");

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      if (pending.role && pending.role !== "member") {
        claimFacilitatorRole({ data: { role: pending.role } }).finally(() =>
          navigate({ to: pending.nextPath }),
        );
      } else {
        navigate({ to: pending.nextPath });
      }
    });
  }, []);

  async function signInWithOAuth(provider: "google" | "apple") {
    sessionStorage.setItem(
      "oauth_pending",
      JSON.stringify({ nextPath, role: mode === "signup" ? role : "member" }),
    );
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if (result.error) {
      sessionStorage.removeItem("oauth_pending");
      toast.error(result.error instanceof Error ? result.error.message : "Sign-in failed.");
      return;
    }
    if (result.redirected) {
      // Browser is navigating away to the provider; the return path is handled by useEffect.
      return;
    }
    // Preview / web-message path: session is already set.
    const pending = JSON.parse(sessionStorage.getItem("oauth_pending") || "{}");
    sessionStorage.removeItem("oauth_pending");
    if (pending.role && pending.role !== "member") {
      await claimFacilitatorRole({ data: { role: pending.role } });
    }
    navigate({ to: pending.nextPath || nextPath });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/intake`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (role !== "member") {
          await claimFacilitatorRole({ data: { role } });
        }
        toast.success("Account created.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: nextPath });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-16">
      <h1 className="text-3xl">{mode === "signup" ? "Create an account" : "Welcome back"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your intake answers are private to you. Facilitators see only that you applied, and the note
        you choose to write.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {mode === "signup" ? (
          <fieldset className="space-y-3">
            <legend className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              How are you joining?
            </legend>
            {ROLE_COPY.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer gap-3 rounded-sm border p-4 transition-colors ${
                  role === option.value ? "border-primary bg-secondary/60" : "border-border bg-card"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  className="mt-1"
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                />
                <span>
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="block text-sm text-muted-foreground">{option.body}</span>
                </span>
              </label>
            ))}
          </fieldset>
        ) : null}

        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="displayName">Name people see in the group</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="First name or a nickname"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>

      <button
        type="button"
        className="mt-6 text-sm underline underline-offset-4"
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
      >
        {mode === "signup" ? "I already have an account" : "I need an account"}
      </button>
    </div>
  );
}
