# Finish the security tightening in app code

The database side is done: the internal permission checks moved into a private area, the group roster got explicit add/change/remove rules, and facilitator names are no longer readable by signed-out visitors. Two pieces of app code still assume the old setup and need updating.

## 1. Facilitator role checks in the server functions

`src/lib/groups.functions.ts` asks the database to run three permission checks by name (`runs_group` once, `has_role` twice). Those checks are now private to the database, so the app can no longer call them directly and the project currently fails to build.

Replace each call with an equivalent read the signed-in user is allowed to make:

- "Does this person run the group?" — read the group's leader and onboarder fields and compare against the signed-in user.
- "Is this person a leader / onboarder?" — read the signed-in user's own role rows.

Behaviour stays identical; only the route the check takes changes. The database access rules still enforce it independently, so a tampered client gains nothing.

## 2. Facilitator names for signed-out visitors

Signed-out visitors can still browse groups but can no longer read `leader_name` / `onboarder_name`. Two pages currently ask for every column, which now fails for them:

- `src/routes/groups.index.tsx` — the groups list
- `src/routes/groups.$groupId.tsx` — the group detail page

Fix: request the non-personal columns for signed-out visitors and the full row when signed in. Where a name would appear, signed-out visitors see "Shown after you sign in" instead of a blank field. Signed-in members see the names exactly as before.

## Technical notes

- Group roster changes run through the server functions, which use the privileged client, so the new roster rules do not affect the accept/decline flow.
- No further migration is needed; this is app-code only.
- Verify with a type check plus a signed-out load of `/groups` and a group detail page.
