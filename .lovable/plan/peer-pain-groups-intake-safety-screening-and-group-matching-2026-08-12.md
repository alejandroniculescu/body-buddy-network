# Peer Pain Groups — intake, safety screening, and group matching

A guided intake that screens for safety first, then shows peer groups you can apply to. Groups are capped at 8 members, each has a leader and an onboarder, and each states whether it meets online or in person.

## The flow

```text
Landing  ->  Intake (multi-step)  ->  Screening result  ->  Browse groups  ->  Apply  ->  Application status
                                          |
                                          +-- red flags -> referral screen (no group offer)
```

### 1. Intake

Pain location starts the match; it does not decide the techniques. Steps:

1. Area(s) of pain (body-region picker)
2. Duration (under 6 weeks / 6-12 weeks / 3-12 months / over a year)
3. Red-flag screening (see below)
4. Recent injury, surgery, or trauma
5. Neurological symptoms: numbness, tingling, weakness, balance change
6. Goals in the person's own words plus a few common goal chips
7. Movement tolerance (what you can currently do without a flare)
8. Clinical clearance: seen a clinician? cleared for exercise? on anticoagulants / bleeding disorder / skin condition?

Progress is saved as you go so nobody loses answers.

### 2. Red-flag handling — hard stop

Unexplained weight loss, fever/night sweats, bowel or bladder change, saddle numbness, progressive or bilateral weakness, unrelenting night pain, significant recent trauma, or history of cancer ends the flow on a plain-language "please see a clinician first" screen with referral guidance and an option to come back after clearance. No group is offered.

### 3. Group matching and application

- Groups are matched on region + duration band + movement tolerance, not on technique.
- Each group card shows: name, focus statement, current member count out of 8, meeting mode (online / in person, with city or platform), meeting cadence, leader, and onboarder.
- Applying creates a pending application the leader or onboarder accepts. Accepting at 8 members closes the group and spins up a fresh group with the same profile so the next applicant has somewhere to land.
- Full groups show "Full — join the next one" and point at the newly opened group.

### 4. Group space

- Offer framing, taken as-is: "Explore safe ways to relate differently to this area, identify what helps, and build capacity" — not "we treat X with these four tools."
- Clinician-designed safety protocol, stop rules, and referral route pinned at the top.
- Peer conduct rules stated plainly: peers do not diagnose, do not promise relief, and do not pressure anyone to try a technique.

### 5. Technique library — locked by default

Every technique is an optional, low-dose experiment. Each one stays locked until its own contraindication check passes and the member explicitly opts in, with a stop rule shown at opt-in (stop on symptom flare, tingling, dizziness, or worsening pain).

- Small resistance-band work — gradual strengthening, adapted to the individual, guided by a qualified movement/physio professional.
- Self-release / trigger-point work — gentle and time-limited; may temporarily ease symptoms for some people.
- Gua sha — some find it soothing; evidence for durable benefit is limited; commonly bruises. Blocked for bleeding disorders, anticoagulants, broken or irritated skin, infection, or unexplained symptoms.

A simple check-in log lets members record what they tried, dose, and how they felt after.

## Assumptions I made

Say the word if any of these are wrong:

- Red flags are a hard stop with referral, not a soft gate.
- Techniques are locked until an individual contraindication check plus opt-in.
- Safety protocol and referral copy are clinician-reviewed static content for now; no live clinician in the product.

## Technical notes

- Lovable Cloud for accounts, intake responses, groups, memberships, applications, and check-ins.
- **Social auth**: add Google and Apple sign-in to the existing email/password auth page using Lovable Cloud managed OAuth. Configure both providers the same turn they are introduced so sign-in does not fail with an unsupported-provider error. OAuth redirect returns to a public route, then navigates to the intended destination after the session is confirmed.
- Roles in a separate `user_roles` table (`member`, `onboarder`, `leader`, `admin`) checked through a security-definer function — never on a profile row.
- Tables: `profiles`, `user_roles`, `intakes`, `groups` (mode, location/platform, cadence, capacity 8, status), `group_members`, `group_applications`, `technique_optins`, `check_ins`. RLS on everything, with explicit grants; members read only their own group.
- Capacity and the "spawn the next group at 8" rule enforced server-side in a server function, not in the UI.
- Routes: `/`, `/intake`, `/intake/result`, `/groups`, `/groups/$groupId`, `/applications`, `/group/$groupId/techniques`, `/auth`, each with its own head metadata.
- Seed content: a few sample groups across regions and both meeting modes so the browse screen is populated from the first load.
