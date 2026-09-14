# Agenda Zero — Migration Kickoff Guide

> **v2 restructure — solo developer reference for the incremental rewrite.**

This is a conventions guide, not a task list. It answers one question: *when I sit down to build or migrate something, how do I do it the right way?* Keep it open while working so no standard slips through in the heat of implementation. It is a living document — as the codebase evolves, parts of it will go stale and should be updated, not obeyed blindly.

---

## 1. What Is Changing and Why

Agenda Zero was built incrementally, feature-first, to get a working product out. That worked: the system already has WhatsApp-based auth, per-school multi-tenancy with RLS, and complete features (incidents, announcements, daily logs, guardian side). The base is functional but was never given consistent conventions. This restructure establishes them, without breaking what already works in production.

**The main shifts:**

- **UI rebuilt from the design system first** — primitives and tokens become the foundation everything else is rebuilt on. This is the deliberate entry point, not an afterthought.
- **Feature-based folder structure** — each feature owns its components, hooks, services, mocks and action-contract types, instead of everything living flat in `components/ui/` and `app/actions/`.
- **A service layer** — components and hooks stop talking to Supabase directly. They call a service; the service talks to the database. This is what makes mocking and real unit tests possible.
- **Design tokens instead of hardcoded hex** — every colour becomes a CSS custom property in `globals.css`.
- **Authorization hardening** — every Server Action derives session/tenant/role from the caller cookie before acting, instead of trusting values sent by the client. (From the security review.)
- **A `dev` branch** — development stops going straight to `main` / production.

**The old code is not deleted up front.** It keeps running exactly as before until a new feature replaces it. The migration is incremental: a file in its old location is removed only once nothing imports it anymore — when it is truly orphaned.

---

## 2. Mental Model: Old and New Side by Side

Unlike a framework migration, there is no second build system here — it is the same Next.js app throughout. What coexists is two *conventions*: the legacy flat layout and the new feature-based one. During the migration the repo holds both.

```
src/
├── app/            ← Next.js App Router. Routes live here. Pages orchestrate,
│                     they do not implement. A page.tsx is a thin shell that
│                     imports from features/ and composes the screen.
├── components/ui/  ← shared PRIMITIVES only (Button, Input, Card, Badge,
│                     Avatar, Chip). Rebuilt with tokens. Feature-specific
│                     components move OUT of here into their feature.
├── lib/            ← shared utilities (supabase, auth-context, storage,
│                     calculateAge, guardianDisplayName).
├── types/          ← DOMAIN types + barrel export (index.ts). Stays.
└── features/       ← NEW. One folder per feature. This is where migrated
                      work lands.
```

**Rule of thumb:** routing never moves — a route is its folder under `app/`. What moves is the *logic*: components, hooks, service and action-contract types migrate into `features/{name}/`, and the `page.tsx` becomes a thin orchestrator that imports them.

---

## 3. The `dev` Branch — Do This First

Today commits go straight to `main`, which is wired to Vercel and auto-deploys to production. Since this restructure rewrites large parts of the system, every half-finished intermediate commit would otherwise hit production. The `dev` branch is the buffer where things are allowed to be temporarily broken.

```bash
# 1. make sure main is clean and the current deploy is healthy
# 2. branch dev off main (identical at this point)
git checkout main
git checkout -b dev
git push -u origin dev
```

Then, once and for all:

- Confirm in Vercel which branch is the Production Branch. `main` stays production; pushing `dev` gives you a free preview URL to test the rewrite against.
- Optionally protect `main` in GitHub (Settings → Branches) so nothing reaches it except via PR from `dev`. Solo, this is a habit-guard against an autopilot `push origin main`.

**Workflow from here on:** `feature/name` → `dev` → `main`. Each unit of work branches off `dev`; when stable it goes to `dev` via PR; when a set is solid, `dev` merges to `main` and only then does Vercel publish.

**Integration strategy:** let `dev` accumulate the whole rewrite and merge to `main` at the end. The UI will be in a mixed state (some screens new, some old) for a while, and that mixed state should not sit in production.

---

## 4. The Two Phases

**Phase 1 — Foundation.** Build the shared base that nothing depends on yet, so it impacts nothing when it lands: design tokens, rebuilt primitives, and the shared `auth-context` helper. Existing pages keep working because they don't import the new pieces yet.

**Phase 2 — Feature by feature, simplest first.** Take one page, rebuild it and everything it touches the right way in `features/`, wire it up, verify, then delete the old files once they're orphaned. Start with the simplest screens to validate the pattern before tackling the heavy ones (incidents, daily logs).

**Security fixes are not a separate phase.** They happen *inside* each feature's rebuild, because the review's findings live in the exact action files a feature owns. Incidents carries 4 of the 7; announcements carries 1; guardian registration carries 2. The only piece that comes up front, in Phase 1, is the shared `requireAuthContext()` helper.

---

## 5. Phase 1 — Foundation Checklist

### 5.1 Design tokens (`globals.css`)

Implement every token from Design Guidelines v1.0 as a CSS custom property. No hex value stays hardcoded in a component after this.

```css
:root {
  --primary: #FF8C66;   /* Peach — primary actions, links   */
  --success: #72AA78;   /* Sage  — confirmations            */
  --warning: #F5C632;   /* Butter — attention               */
  --info:    #5A8ED6;   /* Sky   — informational            */
  --danger:  #E86C88;   /* Rose Talc — errors, alerts       */
  --bg:      #FAF7F2;   /* default screen background        */
  --surface: #FFFDF9;   /* cards, sheets, elevated surfaces */
  --fg1:     #3A2E24;   /* primary text                     */
  --fg2:     #8C7060;   /* secondary text, subtitles        */
  --radius-md: 14px;    /* buttons */
  --radius-lg: 20px;    /* cards   */
  --radius-xl: 28px;    /* modals  */
  --shadow-sm: 0 2px 8px rgba(180,140,120,0.12);
}
```

- Shadows use `rgba(180,140,120, …)` — never `rgba(0,0,0, …)`. Keeps the palette warm.
- Add Nunito (700, 800 — display/headings) and DM Sans (400, 500, 600 — UI/body) via Google Fonts.

### 5.2 Rebuild the primitives

Rewrite the shared primitives in `components/ui/` to consume the tokens, with the variants and states from the guide:

- `Button` — Primary / Secondary / Ghost / Pill, plus disabled
- `Input` — default, active/focus, and error states
- `Card`, `Badge`, `Avatar`, `Chip` — per the component library page of the guide
- Keep the `.examples.tsx` pattern as the visual catalogue. No Storybook — it solves a team-scale discovery problem this solo project does not have.

None of this touches existing screens — they don't import the new primitives until Phase 2 pulls them in.

### 5.3 The shared `auth-context` helper

Create `src/lib/auth-context.ts`. It is the single fix for all 7 critical findings: it derives who the caller *really* is from their cookie, so actions stop trusting client-sent `schoolId` / `recordedBy` / `userId`. It impacts nothing on its own; it waits for the first feature in Phase 2 to call it.

```ts
// src/lib/auth-context.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

type AuthContext = { userId: string; schoolId: string; role: string }

export async function requireAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()
  if (!data) return null

  return { userId: user.id, schoolId: data.school_id, role: data.role }
}
```

### 5.4 Quality infrastructure (optional, but best done here)

Prettier + Husky + lint-staged and the real ESLint rules. If you want these, the best moment is at the very start of Phase 1, before the primitives — the first Prettier run reformats every file, so doing it now keeps that reformatting out of your feature diffs. Also add the `typecheck`, `test:coverage` and `test:watch` scripts.

---

## 6. How to Migrate a Feature (Phase 2)

Target structure for each feature:

```
src/features/{feature-name}/
├── components/          # feature components (e.g. ChildModal, DailyLogForm)
├── hooks/               # feature hooks
├── services/            # the ONLY place that talks to Supabase
│   └── {feature}.service.ts
├── __mocks__/           # typed fake data, shared by tests and local dev
│   └── {feature}.mock.ts
├── types.ts             # action-contract types (CreateXInput, XResult)
└── index.ts             # barrel — export only what other modules need

# the route stays in app/:
src/app/.../{feature}/page.tsx   # thin orchestrator, imports from features/
```

### The service-layer rule

Components and hooks call the service. The service calls Supabase. A component never touches `createClient()` or `createAdminClient()` directly. This is what lets a mock replace the real implementation without touching the component.

### The types split

- **Domain types** (things that exist in the DB and more than one screen knows — `Child`, `Incident`) stay centralized in `src/types/` behind the barrel. Import from `@/types`.
- **Action-contract types** (`CreateIncidentInput`, `CreateIncidentResult` — the shape of one operation's input/output) live in the feature. Only that feature uses them.

**Quick test:** "does it describe something persisted that multiple screens know?" → domain, `src/types/`. "does it describe one operation's in/out?" → contract, in the feature.

### Every Server Action starts with the guard

When you rebuild a feature's actions, the first thing each one does is establish trust, then use the trusted context — never the client-sent value:

```ts
const ctx = await requireAuthContext()
if (!ctx) return { ok: false, error: 'Não autenticado.' }
if (ctx.schoolId !== input.schoolId)
  return { ok: false, error: 'Sem permissão.' }
if (!['coordenador', 'admin'].includes(ctx.role))
  return { ok: false, error: 'Sem permissão.' }

// then write with ctx.schoolId / ctx.userId — NOT input.schoolId etc.
```

### Definition of done for a migrated feature

- Screen rebuilt with new primitives and tokens; no hardcoded hex.
- Logic moved into `features/{name}/`; `page.tsx` is a thin orchestrator.
- Supabase calls isolated behind `services/`; no direct DB access in components.
- Every Server Action guarded with `requireAuthContext()`; client-sent identity values removed.
- A `.mock.ts` exists and is used by the tests.
- Tests colocated next to the files they test (not in `src/__tests__/`).
- Old files deleted only once nothing imports them.

---

## 7. Legacy Pattern → New Equivalent

When migrating a module, do not port these patterns. Replace them.

| Legacy pattern | New equivalent |
|---|---|
| `createAdminClient()` in an action with no session check | Call `requireAuthContext()` first; act on `ctx`, not client input |
| `input.schoolId` / `input.recordedBy` written straight to the DB | Use `ctx.schoolId` / `ctx.userId` from the guard |
| Hardcoded hex (`#FF8C66`) in a component | CSS token `var(--primary)` |
| Component calls Supabase directly | Component → hook → `feature.service.ts` → Supabase |
| Tests in `src/__tests__/` | Colocated: `ChildModal.test.tsx` next to `ChildModal.tsx` |
| Feature component in `components/ui/` (e.g. `DailyLogForm`) | Move into `features/{name}/components/` |
| Dev depends on a live Supabase | Typed `.mock.ts` per feature, reused in tests |
| Page does data-fetch + state + business logic + JSX | Page orchestrates; logic in hooks/services/components |
| Commit straight to `main` | `feature/name` → `dev` → `main` |

## TODO comments

Format: `// TODO(#N): short description` when a tracking issue exists — the
number lets anyone jump from the code straight to the issue's full context.
`// TODO: short description` (no number) when there isn't one yet. Either way,
greppable (`grep -rn "TODO"`) so nothing adiado fica esquecido no meio do código.

---

## 8. Things Already True in This Repo

State picked up from reading the current code — worth knowing before you assume otherwise.

- **`proxy.ts` is already correct.** Next.js 16 renamed the middleware convention to `proxy` (function exported as `proxy`). It is done and wired. The restructure doc's "rename proxy → middleware" item is obsolete and backwards — ignore it.
- **Watch for an orphaned `middleware.ts`.** On Next 16 a leftover `middleware.ts` is silently ignored at build time — no error, no warning — which would make route protection quietly stop running. Confirm none exists.
- **Stack is Next 16.2 / React 19.2.** `next.config.ts` is essentially empty, which is fine — nothing to undo.
- **The real "god" files are not the ones the doc names.** Biggest by line count: `DailyLogForm.tsx` (889), `incidents/page.tsx` (726), `ClassModal.tsx` (647), `ChildModal.tsx` (547), `announcements/page.tsx` (506). Prioritise accordingly.
- **Defense in depth already exists.** Route protection is three-layer: `proxy.ts` + the `useSchool` hook + page-level redirect. The server-action guard is the missing fourth layer — the action defending itself, because the outer layers can fail silently.

---

## 9. Security Review Backlog

Root cause of the 7 critical findings is one thing: every Server Action uses `createAdminClient()` (service role, bypasses RLS) and none derives session/tenant/role from the caller's cookie before acting. The `requireAuthContext()` helper fixes all 7. These get applied per-feature as each is rebuilt, not in a separate pass.

| Severity | Action | Fix when rebuilding |
|---|---|---|
| 🔴 Critical | `createIncident` | write with `ctx.schoolId`; `recordedBy = ctx.userId` |
| 🔴 Critical | `sendIncident` | fetch by id **AND** `school_id`; use `ctx.userId` |
| 🔴 Critical | `updateIncident` | same fetch guard; `editedBy = ctx.userId` |
| 🔴 Critical | `markIncidentRead` | `ctx.userId`; validate active guardianship |
| 🔴 Critical | `createAnnouncement` | check publisher role; use `ctx` |
| 🔴 Critical | `registerGuardian` | `ctx.schoolId` / `userId`; require admin/coordenador |
| 🔴 Critical | `verifyCpf` | accept `schoolId` only if `= ctx`; consider SQL rpc |
| 🟡 Medium | `guardian/child/[id]` | audit RLS; explicit guardianship check on load |
| 🟢 Low | `registerGuardian` | full rollback, or 3 inserts in one SQL fn via rpc |
| 🟢 Low | `.env.example` | create it; README references a file that is missing |

> The review was a read-through without running the code locally. Confirm each finding against the current file as you reach it.

---

## 10. Where to Look When Stuck

| Question | Where |
|---|---|
| How does route protection work? | `src/proxy.ts` + `hooks/useSchool.ts` |
| How does an action verify the caller? | `src/lib/auth-context.ts` (once created) |
| Admin vs browser Supabase client? | `lib/supabase-admin.ts` vs `lib/supabase.ts` |
| What design tokens exist? | `app/globals.css` + Design Guidelines v1.0 |
| Where do domain types live? | `src/types/` (barrel in `index.ts`) |
| Reference feature structure? | the first feature you migrate — keep it clean as the template |
| What each finding needs? | Section 9 of this document |

---

*Agenda Zero · Migration Kickoff v2 · living document — update it as reality changes.*