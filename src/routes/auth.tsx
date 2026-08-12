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
      { title: "Sign in — MassageNow peer groups" },
      {
        name: "description",
        content:
          "Create a MassageNow account as a member, a group leader, or an onboarder, or sign back in to your intake and group.",
      },
      { property: "og:title", content: "Sign in — MassageNow peer groups" },
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

      <div className="relative mt-8 flex items-center justify-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <span className="relative z-10 bg-background px-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Or continue with
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => signInWithOAuth("google")}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => signInWithOAuth("apple")}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.22 7.13-.57 1.5-1.31 2.99-2.27 4.08zm-5.85-15.1c.07-2.04 1.76-3.79 3.8-3.94.29 2.32-1.91 4.48-3.8 3.94z" />
          </svg>
          Apple
        </Button>
      </div>

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
