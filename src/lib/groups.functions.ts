import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const applyToGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ groupId: z.string().uuid(), note: z.string().max(1000).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: intake } = await supabase
      .from("intakes")
      .select("id, red_flag_stop, completed")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!intake || !intake.completed) {
      return { ok: false as const, error: "Complete the intake before applying to a group." };
    }
    if (intake.red_flag_stop) {
      return {
        ok: false as const,
        error:
          "Your intake flagged something that needs a clinician first. Groups stay closed until that's been looked at.",
      };
    }

    const { data: group } = await supabase
      .from("groups")
      .select("id, status, member_count, capacity")
      .eq("id", data.groupId)
      .maybeSingle();

    if (!group) return { ok: false as const, error: "That group no longer exists." };
    if (group.status !== "open" || group.member_count >= group.capacity) {
      return { ok: false as const, error: "That group is full. The next one is already open." };
    }

    const { error } = await supabase.from("group_applications").upsert(
      {
        group_id: data.groupId,
        user_id: userId,
        intake_id: intake.id,
        note: data.note ?? null,
        status: "pending",
      },
      { onConflict: "group_id,user_id" },
    );

    if (error) return { ok: false as const, error: "Could not send that application." };
    return { ok: true as const };
  });

export const withdrawApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ applicationId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("group_applications")
      .update({ status: "withdrawn" })
      .eq("id", data.applicationId)
      .eq("user_id", context.userId);
    if (error) return { ok: false as const, error: "Could not withdraw that application." };
    return { ok: true as const };
  });

export const decideApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ applicationId: z.string().uuid(), accept: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: application } = await supabase
      .from("group_applications")
      .select("id, group_id, user_id, status")
      .eq("id", data.applicationId)
      .maybeSingle();

    if (!application) return { ok: false as const, error: "Application not found." };
    if (application.status !== "pending")
      return { ok: false as const, error: "That application was already decided." };

    const { data: runsRow } = await supabase
      .from("groups")
      .select("leader_id, onboarder_id")
      .eq("id", application.group_id)
      .maybeSingle();
    const runs = !!runsRow && (runsRow.leader_id === userId || runsRow.onboarder_id === userId);
    if (!runs) return { ok: false as const, error: "Only this group's leader or onboarder can decide." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.accept) {
      await supabaseAdmin
        .from("group_applications")
        .update({ status: "declined" })
        .eq("id", application.id);
      return { ok: true as const, spawned: null };
    }

    const { data: group } = await supabaseAdmin
      .from("groups")
      .select("*")
      .eq("id", application.group_id)
      .maybeSingle();
    if (!group) return { ok: false as const, error: "Group not found." };
    if (group.member_count >= group.capacity)
      return { ok: false as const, error: "This group is already at capacity." };

    await supabaseAdmin
      .from("group_members")
      .upsert(
        { group_id: group.id, user_id: application.user_id, role_in_group: "member" },
        { onConflict: "group_id,user_id" },
      );
    await supabaseAdmin
      .from("group_applications")
      .update({ status: "accepted" })
      .eq("id", application.id);

    const nextCount = group.member_count + 1;
    const isFull = nextCount >= group.capacity;
    await supabaseAdmin
      .from("groups")
      .update({ member_count: nextCount, status: isFull ? "full" : "open" })
      .eq("id", group.id);

    let spawned: string | null = null;
    if (isFull) {
      const cohort = group.cohort + 1;
      const baseName = group.name.replace(/ — Circle \d+$/, "");
      const { data: created } = await supabaseAdmin
        .from("groups")
        .insert({
          name: `${baseName} — Circle ${cohort}`,
          focus_statement: group.focus_statement,
          region: group.region,
          duration_band: group.duration_band,
          tolerance_band: group.tolerance_band,
          mode: group.mode,
          location: group.location,
          cadence: group.cadence,
          leader_name: group.leader_name,
          onboarder_name: group.onboarder_name,
          leader_id: group.leader_id,
          onboarder_id: group.onboarder_id,
          cohort,
        })
        .select("id")
        .maybeSingle();
      spawned = created?.id ?? null;
    }

    return { ok: true as const, spawned };
  });

export const claimFacilitatorRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ role: z.enum(["member", "leader", "onboarder"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: data.role }, { onConflict: "user_id,role" });
    if (error) return { ok: false as const, error: "Could not set that role." };
    return { ok: true as const };
  });

export const createGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().min(3).max(120),
        region: z.string().min(1),
        duration_band: z.string().min(1),
        tolerance_band: z.string().min(1),
        mode: z.enum(["online", "in_person"]),
        location: z.string().min(2).max(200),
        cadence: z.string().min(2).max(200),
        leader_name: z.string().min(2).max(120),
        onboarder_name: z.string().min(2).max(120),
        as_role: z.enum(["leader", "onboarder"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isLeader } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "leader",
    });
    const { data: isOnboarder } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "onboarder",
    });
    if (!isLeader && !isOnboarder) {
      return { ok: false as const, error: "Only group leaders and onboarders can open a group." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin
      .from("groups")
      .insert({
        name: data.name,
        region: data.region,
        duration_band: data.duration_band,
        tolerance_band: data.tolerance_band,
        mode: data.mode,
        location: data.location,
        cadence: data.cadence,
        leader_name: data.leader_name,
        onboarder_name: data.onboarder_name,
        leader_id: data.as_role === "leader" ? userId : null,
        onboarder_id: data.as_role === "onboarder" ? userId : null,
      })
      .select("id")
      .maybeSingle();

    if (error || !created) return { ok: false as const, error: "Could not open that group." };
    return { ok: true as const, id: created.id };
  });

export const getFacilitatorQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: groups } = await supabase
      .from("groups")
      .select("*")
      .or(`leader_id.eq.${userId},onboarder_id.eq.${userId}`)
      .order("created_at", { ascending: true });

    const groupIds = (groups ?? []).map((g) => g.id);
    const applications = groupIds.length
      ? ((
          await supabase
            .from("group_applications")
            .select("id, group_id, status, note, created_at")
            .in("group_id", groupIds)
            .order("created_at", { ascending: true })
        ).data ?? [])
      : [];

    return { groups: groups ?? [], applications };
  });
