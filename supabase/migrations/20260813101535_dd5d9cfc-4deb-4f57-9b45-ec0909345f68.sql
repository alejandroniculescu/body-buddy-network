-- 1. Private schema for RLS helper functions (not exposed to the Data API)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION private.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION private.runs_group(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = _group_id AND (g.leader_id = _user_id OR g.onboarder_id = _user_id)
  ) OR private.has_role(_user_id, 'admin');
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_group_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.runs_group(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_group_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.runs_group(uuid, uuid) TO authenticated, service_role;

-- 2. Repoint policies at the private helpers
DROP POLICY "members see their own group roster" ON public.group_members;
CREATE POLICY "members see their own group roster" ON public.group_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR private.is_group_member(group_id, auth.uid())
  OR private.runs_group(group_id, auth.uid())
);

DROP POLICY "own applications read" ON public.group_applications;
CREATE POLICY "own applications read" ON public.group_applications
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.runs_group(group_id, auth.uid()));

DROP POLICY "own applications update" ON public.group_applications;
CREATE POLICY "own applications update" ON public.group_applications
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR private.runs_group(group_id, auth.uid()))
WITH CHECK (user_id = auth.uid() OR private.runs_group(group_id, auth.uid()));

DROP POLICY "Admins manage gear" ON public.gear_items;
CREATE POLICY "Admins manage gear" ON public.gear_items
FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_group_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.runs_group(uuid, uuid);

-- 3. Explicit membership-change rules on the roster
GRANT INSERT, UPDATE, DELETE ON public.group_members TO authenticated;

CREATE POLICY "facilitators add members" ON public.group_members
FOR INSERT TO authenticated
WITH CHECK (private.runs_group(group_id, auth.uid()));

CREATE POLICY "facilitators update members" ON public.group_members
FOR UPDATE TO authenticated
USING (private.runs_group(group_id, auth.uid()))
WITH CHECK (private.runs_group(group_id, auth.uid()));

CREATE POLICY "leave or remove members" ON public.group_members
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR private.runs_group(group_id, auth.uid()));

-- 4. Hide facilitator identities from signed-out visitors (column-level)
REVOKE SELECT ON public.groups FROM anon;
GRANT SELECT (
  id, name, focus_statement, region, duration_band, tolerance_band, mode,
  location, cadence, capacity, member_count, status, cohort, created_at, updated_at
) ON public.groups TO anon;
GRANT SELECT ON public.groups TO authenticated;