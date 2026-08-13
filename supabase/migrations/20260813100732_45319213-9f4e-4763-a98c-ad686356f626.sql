CREATE TABLE public.gear_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  why_it_helps text,
  region text,
  technique text,
  sponsor_name text,
  sponsor_code text,
  sponsor_offer text,
  url text,
  price_note text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gear_items TO anon;
GRANT SELECT ON public.gear_items TO authenticated;
GRANT ALL ON public.gear_items TO service_role;
ALTER TABLE public.gear_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gear is public to read" ON public.gear_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage gear" ON public.gear_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.wearable_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recorded_on date NOT NULL DEFAULT current_date,
  source text NOT NULL DEFAULT 'manual',
  sleep_hours numeric(4,2),
  resting_hr integer,
  hrv_ms integer,
  steps integer,
  active_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, recorded_on)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wearable_readings TO authenticated;
GRANT ALL ON public.wearable_readings TO service_role;
ALTER TABLE public.wearable_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own wearable readings" ON public.wearable_readings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.pain_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recorded_on date NOT NULL DEFAULT current_date,
  region text NOT NULL,
  pain_score integer NOT NULL CHECK (pain_score BETWEEN 0 AND 10),
  stiffness_score integer CHECK (stiffness_score BETWEEN 0 AND 10),
  function_score integer CHECK (function_score BETWEEN 0 AND 10),
  flare boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pain_reports TO authenticated;
GRANT ALL ON public.pain_reports TO service_role;
ALTER TABLE public.pain_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own pain reports" ON public.pain_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.gear_items (name, category, description, why_it_helps, region, technique, sponsor_name, sponsor_code, sponsor_offer, price_note, sort_order) VALUES
('Light resistance band set', 'Bands', 'Three light-to-medium loop bands, long enough to anchor on a door.', 'Lets you start strengthening at a dose that does not provoke the area, then step up slowly.', NULL, 'bands', 'Kinetic Supply', 'MASSAGENOW15', '15% off the light set', 'around 20', 10),
('Soft massage ball', 'Self-release', 'A 6cm ball, softer than a lacrosse ball, for gentle self-release against a wall.', 'Wall work keeps the pressure light and easy to back off from.', NULL, 'self_release', 'Kinetic Supply', 'MASSAGENOW15', '15% off single balls', 'around 12', 20),
('Medium-density foam roller', 'Foam rolling', '45cm roller, medium density — firm enough to be useful, soft enough for a first week.', 'Short, slow passes over large muscle groups without pinning a sore spot.', NULL, 'foam_rolling', 'RollWell', 'NOWROLL10', '10% off rollers', 'around 30', 30),
('Gua sha stone', 'Gua sha', 'Smooth stainless or jade edge tool, with a small bottle of skin oil.', 'Oil plus a light edge keeps the stroke soothing rather than abrasive.', NULL, 'gua_sha', 'Slate & Stone', 'MASSAGENOW-GS', '10% off, oil included', 'around 25', 40),
('Silicone cupping set', 'Cupping', 'Four soft silicone cups you squeeze rather than heat.', 'Squeeze cups give you direct control of suction and come off instantly.', NULL, 'cupping', 'Slate & Stone', 'MASSAGENOW-GS', '10% off starter sets', 'around 22', 50),
('Door anchor & long band', 'Bands', 'Door anchor plus a long band for pulls and rows at a light load.', 'Rows and external rotation at a load you can actually control.', 'shoulder', 'bands', 'Kinetic Supply', 'MASSAGENOW15', '15% off anchors', 'around 25', 60),
('Peanut roller', 'Self-release', 'Twin-ball roller that straddles the spine instead of pressing on it.', 'Keeps pressure either side of the spine for neck and upper back work.', 'neck', 'self_release', 'RollWell', 'NOWROLL10', '10% off', 'around 18', 70),
('Firm yoga block', 'Support', 'Cork block for propping hips and knees in low-tolerance positions.', 'Support under a limb often makes a position tolerable enough to hold.', 'low_back', NULL, 'Grounded Goods', 'MASSAGENOW-G', '12% off cork range', 'around 20', 80),
('Long massage cane', 'Self-release', 'Hooked cane so you can reach glute and hip points without twisting.', 'Reaching the area without contorting into a flare position.', 'hip', 'self_release', 'RollWell', 'NOWROLL10', '10% off', 'around 28', 90),
('Nerve glide strap', 'Nerve gliding', 'Soft strap with loops for controlled leg and arm glides.', 'The strap keeps glides slow and within range instead of stretching hard.', 'knee', 'nerve_gliding', 'Kinetic Supply', 'MASSAGENOW15', '15% off straps', 'around 15', 100),
('Foot release ball & arch band', 'Self-release', 'Small firm ball plus a short band for toe and arch work.', 'Small tools for a small area, so the dose stays low.', 'foot', 'self_release', 'Grounded Goods', 'MASSAGENOW-G', '12% off', 'around 14', 110),
('Warm compress pack', 'Support', 'Microwavable compress for jaw and face work before anything else.', 'A little warmth first usually means less pressure is needed.', 'jaw', NULL, 'Grounded Goods', 'MASSAGENOW-G', '12% off', 'around 16', 120);