# Rename to MassageNow + reposition the front page

Rename the product from Kinship to MassageNow everywhere, and reframe the messaging around weekly self-guided massage in peer groups. The safety screening, red-flag stop, and technique precautions stay exactly as they are.

## New positioning

Front page headline and lead:

- Headline: "Join peer groups dedicated to weekly self-guided massage."
- Subline: "A space to talk, learn, and overcome pain points."

Supporting copy keeps the honest framing: groups of eight, a leader and an onboarder, online or in person, short safety screen before you apply, techniques are optional low-dose experiments.

## Rename scope

Replace "Kinship" with "MassageNow" in:

- Header wordmark and footer
- Page titles, meta descriptions, og:title / og:description on every route (landing, auth, intake, intake result, safety, groups list, group detail, my place, facilitate, root)
- Body copy that names the product (landing disclaimer, safety page intro)

## Copy edits beyond the name

- Landing: replace "Where it hurts starts the conversation." with the new headline and subline; adjust the three-step explainer to lead with "weekly self-guided massage" rather than pain triage.
- Landing disclaimer stays: MassageNow is not a clinic, nothing here is diagnosis or treatment, no peer will tell you what is wrong with you.
- Meta description updated to match the new positioning while still mentioning the safety screen.

## Unchanged

- Intake wizard, red-flag hard stop, referral route
- Technique library: small resistance bands, self-release / trigger point, gua sha — same claims, dose, contraindications, stop rules, and locked-until-checked behaviour
- Group matching, capacity of eight, leader/onboarder roles, application flow
- Auth including Google and Apple sign-in

## Noted for later (not in this change)

An NDA / participation agreement to sign before joining a group is out of scope for this pass. When you want it, it would sit between application acceptance and group access, stored as a signed-at timestamp on the membership row.

## Technical notes

Text-only change across `src/routes/*.tsx`, `src/components/site-header.tsx`, and `src/components/site-footer.tsx`. No schema, server function, or routing changes. Each route keeps its own unique `head()` metadata.
