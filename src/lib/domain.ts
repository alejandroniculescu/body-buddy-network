export type Option = { value: string; label: string; hint?: string };

export const REGIONS: Option[] = [
  { value: "neck", label: "Neck & upper back" },
  { value: "shoulder", label: "Shoulder & scapula" },
  { value: "low_back", label: "Low back" },
  { value: "hip", label: "Hip & glute" },
  { value: "knee", label: "Knee" },
  { value: "foot", label: "Foot & ankle" },
  { value: "jaw", label: "Jaw & face" },
  { value: "widespread", label: "Widespread / multiple areas" },
];

export const DURATIONS: Option[] = [
  { value: "under 6 weeks", label: "Under 6 weeks" },
  { value: "6-12 weeks", label: "6 to 12 weeks" },
  { value: "3-12 months", label: "3 to 12 months" },
  { value: "over a year", label: "Over a year" },
];

export const RED_FLAGS: Option[] = [
  { value: "weight_loss", label: "Unexplained weight loss" },
  { value: "fever", label: "Fever, chills, or night sweats" },
  { value: "bladder_bowel", label: "New bowel or bladder changes" },
  { value: "saddle", label: "Numbness around the groin or inner thighs" },
  {
    value: "progressive_weakness",
    label: "Weakness that is getting worse, or affects both sides",
  },
  {
    value: "night_pain",
    label: "Pain that is unrelenting at night and unchanged by position",
  },
  { value: "trauma", label: "Significant recent trauma (fall, collision, accident)" },
  { value: "cancer_history", label: "History of cancer" },
];

export const NEURO_SYMPTOMS: Option[] = [
  { value: "numbness", label: "Numbness" },
  { value: "tingling", label: "Tingling or pins and needles" },
  { value: "weakness", label: "Weakness, or things slipping from your grip" },
  { value: "balance", label: "Balance or coordination changes" },
  { value: "dizziness", label: "Dizziness with certain movements" },
];

export const GOAL_TAGS: Option[] = [
  { value: "sleep", label: "Sleep through the night" },
  { value: "work", label: "Get through a work day" },
  { value: "lift", label: "Lift and carry again" },
  { value: "sport", label: "Return to a sport or hobby" },
  { value: "fear", label: "Feel less afraid of the area" },
  { value: "understand", label: "Understand what's going on" },
  { value: "flares", label: "Have fewer flare-ups" },
];

export const TOLERANCES: Option[] = [
  {
    value: "low",
    label: "Low",
    hint: "Most movement of the area provokes symptoms; short walks or gentle positions only.",
  },
  {
    value: "moderate",
    label: "Moderate",
    hint: "Daily activity is possible, but load or repetition brings symptoms on.",
  },
  {
    value: "good",
    label: "Good",
    hint: "You move most of the day, and only certain positions or loads flare things.",
  },
];

export type Technique = {
  id: string;
  name: string;
  claim: string;
  evidence: string;
  dose: string;
  contraindications: { id: string; label: string }[];
  stopRules: string[];
};

export const TECHNIQUES: Technique[] = [
  {
    id: "bands",
    name: "Small resistance-band work",
    claim: "Potentially useful for gradual strengthening when adapted to you.",
    evidence:
      "Best understood as graded, progressive loading. It should be adapted to the individual and guided by a qualified movement or physiotherapy professional — not copied from a video.",
    dose: "Start at a load you'd rate 3/10 effort. One or two sets, low reps, once a day. Progress no faster than weekly.",
    contraindications: [
      {
        id: "cleared",
        label: "I have been cleared for exercise by a clinician, or have no reason to think I'm not.",
      },
      {
        id: "no_acute",
        label: "I am not within a few weeks of surgery or a fracture in this area.",
      },
      {
        id: "guidance",
        label: "I understand this should be set up with a qualified movement or physio professional.",
      },
    ],
    stopRules: [
      "Stop if symptoms rise during or after and are still raised the next morning.",
      "Stop on new tingling, numbness, or weakness.",
      "Stop if the effort makes you hold your breath or brace hard.",
    ],
  },
  {
    id: "self_release",
    name: "Self-release / trigger-point work (ball or hands)",

    claim: "Can temporarily ease symptoms for some people.",
    evidence:
      "Any relief is typically short-lived. It is a way to notice what your body responds to, not a treatment. Keep it gentle and time-limited.",
    dose: "Gentle pressure, no more than 3/10 discomfort. 60–90 seconds per spot, once a day, for a two-week trial at most.",
    contraindications: [
      { id: "no_skin", label: "The skin over the area is intact, not irritated or infected." },
      {
        id: "no_unexplained",
        label: "I do not have unexplained symptoms that haven't been looked at.",
      },
      { id: "gentle", label: "I understand this stays gentle and time-limited — harder is not better." },
    ],
    stopRules: [
      "Stop immediately on symptom flare, tingling, dizziness, or worsening pain.",
      "Stop if you need more pressure each time for the same effect.",
      "Stop if it leaves soreness lasting more than a day.",
    ],
  },
  {
    id: "gua_sha",
    name: "Gua sha",
    claim: "Some people find it soothing.",
    evidence:
      "Evidence for durable pain benefit is limited, and it commonly causes bruising. Avoid entirely with bleeding disorders, anticoagulant medication, broken or irritated skin, infection, or unexplained symptoms.",
    dose: "Light strokes only, over intact skin, a couple of minutes at most. Marking is not the goal and is not a sign it worked.",
    contraindications: [
      { id: "no_anticoag", label: "I am not taking anticoagulant (blood-thinning) medication." },
      { id: "no_bleeding", label: "I do not have a bleeding or clotting disorder." },
      { id: "no_skin", label: "The skin is intact — no cuts, rashes, irritation, or infection." },
      {
        id: "no_unexplained",
        label: "I do not have unexplained symptoms that haven't been looked at.",
      },
      { id: "bruise_ok", label: "I understand bruising is common, and I accept that." },
    ],
    stopRules: [
      "Stop on any pain beyond mild, on dizziness, or on lightheadedness.",
      "Stop if marks are slow to clear or unusually dark.",
      "Do not work the same area more than once every few days.",
    ],
  },
];

export const FOCUS_STATEMENT =
  "Explore safe ways to relate differently to this area, identify what helps, and build capacity.";

export const PEER_CONDUCT = [
  "Peers do not diagnose. Nobody here names your condition.",
  "Peers do not promise relief. Nothing offered here is a treatment.",
  "Nobody pressures anyone into a technique, or to explain why they skipped one.",
  "Facilitators follow the clinician-designed safety protocol and refer out when anything changes.",
];

export const REFERRAL_ROUTE = [
  "Same day: emergency care for loss of bladder or bowel control, saddle numbness, sudden severe weakness, or symptoms after significant trauma.",
  "Within days: your GP or a physiotherapist for new or progressing neurological symptoms, unexplained weight loss, fever, or night pain.",
  "Any time: tell your group's onboarder if something changes. They pause your experiments and point you to the referral route — they do not assess you.",
];

export function regionLabel(value?: string | null) {
  return REGIONS.find((r) => r.value === value)?.label ?? value ?? "—";
}

export function toleranceLabel(value?: string | null) {
  return TOLERANCES.find((t) => t.value === value)?.label ?? value ?? "—";
}

export function techniqueName(id: string) {
  return TECHNIQUES.find((t) => t.id === id)?.name ?? id;
}

export function modeLabel(mode: string) {
  return mode === "online" ? "Online" : "In person";
}
