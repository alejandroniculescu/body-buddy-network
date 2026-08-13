import type { Tables } from "@/integrations/supabase/types";

/**
 * Facilitator names are not readable by signed-out visitors, so anonymous
 * browsing asks for everything except the personal columns.
 */
export const PUBLIC_GROUP_COLUMNS =
  "id, name, focus_statement, region, duration_band, tolerance_band, mode, location, cadence, capacity, member_count, status, cohort, created_at, updated_at";

export type BrowsableGroup = Omit<
  Tables<"groups">,
  "leader_name" | "onboarder_name" | "leader_id" | "onboarder_id"
> & {
  leader_name?: string | null;
  onboarder_name?: string | null;
  leader_id?: string | null;
  onboarder_id?: string | null;
};

export const HIDDEN_NAME = "Shown after you sign in";

export function facilitatorName(value?: string | null) {
  return value ?? HIDDEN_NAME;
}
