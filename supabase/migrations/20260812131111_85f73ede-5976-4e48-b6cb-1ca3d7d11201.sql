-- enums
CREATE TYPE public.app_role AS ENUM ('member','onboarder','leader','admin');
CREATE TYPE public.meeting_mode AS ENUM ('online','in_person');
CREATE TYPE public.group_status AS ENUM ('open','full','closed');
CREATE TYPE public.application_status AS ENUM ('pending','accepted','declined','withdrawn');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

-- roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- intakes
CREATE TABLE public.intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  regions TEXT[] NOT NULL DEFAULT '{}',
  duration_band TEXT,
  red_flags TEXT[] NOT NULL DEFAULT '{}',
  red_flag_stop BOOLEAN NOT NULL DEFAULT false,
  recent_injury BOOLEAN NOT NULL DEFAULT false,
  injury_details TEXT,
  neuro_symptoms TEXT[] NOT NULL DEFAULT '{}',
  goals TEXT,
  goal_tags TEXT[] NOT NULL DEFAULT '{}',
  movement_tolerance TEXT,
  seen_clinician BOOLEAN NOT NULL DEFAULT false,
  cleared_for_exercise BOOLEAN NOT NULL DEFAULT false,
  anticoagulants BOOLEAN NOT NULL DEFAULT false,
  bleeding_disorder BOOLEAN NOT NULL DEFAULT false,
  skin_condition BOOLEAN NOT NULL DEFAULT false,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intakes TO authenticated;
GRANT ALL ON public.intakes TO service_role;
ALTER TABLE public.intakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own intakes" ON public.intakes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER intakes_updated_at BEFORE UPDATE ON public.intakes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- groups
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  focus_statement TEXT NOT NULL DEFAULT 'Explore safe ways to relate differently to this area, identify what helps, and build capacity.',
  region TEXT NOT NULL,
  duration_band TEXT NOT NULL,
  tolerance_band TEXT NOT NULL,
  mode public.meeting_mode NOT NULL,
  location TEXT NOT NULL,
  cadence TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  onboarder_name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 8,
  member_count INT NOT NULL DEFAULT 0,
  status public.group_status NOT NULL DEFAULT 'open',
  cohort INT NOT NULL DEFAULT 1,
  leader_id UUID,
  onboarder_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.groups TO anon;
GRANT SELECT ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups are browsable" ON public.groups FOR SELECT USING (true);
CREATE TRIGGER groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- memberships
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role_in_group TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.runs_group(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = _group_id AND (g.leader_id = _user_id OR g.onboarder_id = _user_id)
  ) OR public.has_role(_user_id, 'admin');
$$;

CREATE POLICY "members see their own group roster" ON public.group_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_group_member(group_id, auth.uid()) OR public.runs_group(group_id, auth.uid()));

-- applications
CREATE TABLE public.group_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  intake_id UUID REFERENCES public.intakes ON DELETE SET NULL,
  note TEXT,
  status public.application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.group_applications TO authenticated;
GRANT ALL ON public.group_applications TO service_role;
ALTER TABLE public.group_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own applications read" ON public.group_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.runs_group(group_id, auth.uid()));
CREATE POLICY "own applications insert" ON public.group_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own applications update" ON public.group_applications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.runs_group(group_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.runs_group(group_id, auth.uid()));
CREATE TRIGGER group_applications_updated_at BEFORE UPDATE ON public.group_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- technique opt-ins
CREATE TABLE public.technique_optins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  technique TEXT NOT NULL,
  contraindications_confirmed BOOLEAN NOT NULL DEFAULT false,
  stop_rules_acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, technique)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technique_optins TO authenticated;
GRANT ALL ON public.technique_optins TO service_role;
ALTER TABLE public.technique_optins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own optins" ON public.technique_optins FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- check-ins
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups ON DELETE SET NULL,
  technique TEXT NOT NULL,
  dose TEXT,
  felt_after TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own check ins" ON public.check_ins FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- seed groups
INSERT INTO public.groups (name, region, duration_band, tolerance_band, mode, location, cadence, leader_name, onboarder_name, member_count, status) VALUES
('Shoulder & Scapula — Circle 1', 'shoulder', '3-12 months', 'moderate', 'online', 'Video call (Zoom)', 'Weekly, Tuesdays 19:00 CET', 'Maya Ellison', 'Tomas Reid', 5, 'open'),
('Shoulder & Scapula — Circle 2', 'shoulder', 'over a year', 'low', 'in_person', 'Berlin, Kreuzberg studio', 'Fortnightly, Saturdays 10:00', 'Jonas Weber', 'Prisha Nair', 3, 'open'),
('Neck & Upper Back — Circle 1', 'neck', '3-12 months', 'moderate', 'online', 'Video call (Zoom)', 'Weekly, Thursdays 18:00 CET', 'Ana Ferreira', 'Liam Doyle', 8, 'full'),
('Neck & Upper Back — Circle 2', 'neck', '3-12 months', 'moderate', 'online', 'Video call (Zoom)', 'Weekly, Thursdays 18:00 CET', 'Ana Ferreira', 'Liam Doyle', 1, 'open'),
('Low Back — Circle 1', 'low_back', 'over a year', 'low', 'online', 'Video call (Zoom)', 'Weekly, Mondays 20:00 CET', 'Ruth Adeyemi', 'Karl Jensen', 6, 'open'),
('Low Back — Circle 2', 'low_back', '6-12 weeks', 'moderate', 'in_person', 'Amsterdam, Oost community room', 'Weekly, Wednesdays 18:30', 'Sanne de Vries', 'Ibrahim Sow', 2, 'open'),
('Hip & Glute — Circle 1', 'hip', '3-12 months', 'good', 'online', 'Video call (Zoom)', 'Fortnightly, Sundays 17:00 CET', 'Elena Marchetti', 'Owen Blake', 4, 'open'),
('Knee — Circle 1', 'knee', '6-12 weeks', 'good', 'in_person', 'Copenhagen, Nørrebro gym annex', 'Weekly, Fridays 17:30', 'Mads Holm', 'Yara Haddad', 2, 'open');