# Personal OS Plan A In-App Automations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 4 core in-app smart automations for Personal OS (Career Follow-up Radar, Daily Morning Briefing & Task Rollover, 24-Hour Dropzone Auto-Purge, and Local Dev Port Health-Check Ping) following Ponytail minimalist engineering and Warm Bento visual guidelines.

**Architecture:** Client-side reactive automation engine using native Web APIs (Date calculations, AbortController/fetch, Web Storage, and Zustand lifecycle hooks) with zero external runtime dependencies. Each automation is encapsulated in a dedicated utility module with unit test coverage, wired cleanly into the existing UI components.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Zustand, Tailwind CSS, Node.js tsx test runner.

**Spec:** [docs/superpowers/specs/2026-11-03-nexus-os-design.md](file:///e:/College%20Stuff/Career/chemicvll/docs/superpowers/specs/2026-11-03-nexus-os-design.md) & [DESIGN.md](file:///e:/College%20Stuff/Career/chemicvll/DESIGN.md)

## Global Constraints
- Zero Emojis in technical documentation, comments, and README.md.
- Adhere strictly to Ponytail principles: native browser APIs before dependencies, minimal code, YAGNI.
- Maintain Warm Bento Fintech design system: `#FAF9F4` base, `#FF6B00` primary accent, `#18181B` deep neutral, Plus Jakarta Sans typography.
- Enforce Atomic Commits using Conventional Commits for every task.
- Zero TypeScript errors (`npx tsc --noEmit`) and 100% passing tests before completion.

## Review Focus
- Date boundary edge cases (leap days, timezone differences, negative elapsed times).
- Idempotency of Daily Briefing rollover (must not duplicate or repeatedly trigger rollover on page refresh).
- Preservation of pinned dropzone items during auto-purge (pinned items must never be deleted).
- AbortController timeout handling during port ping checks (must not hang or block the browser UI thread).
- Smooth hydration without server-client mismatches when reading browser localStorage.

---

### Task 1: Automasi 1 — Career Follow-Up & Deadline Radar

**Files:**
- Create: `src/lib/career-radar.ts`
- Test: `src/lib/__tests__/career-radar.test.ts`
- Modify: `src/components/career/CareerCard.tsx`
- Modify: `src/components/career/CareerKanban.tsx`

**Requirements:**
1. Calculate elapsed days from `applied_date`. If ≥ 5 days without contact and stage is `'applied'`, return urgency `'follow_up_due'`.
2. If `deadline` is within 48 hours and stage is `'assessment'`, return urgency `'assessment_urgent'`.
3. Provide `generateFollowUpDraft(item, type: 'email' | 'whatsapp')` producing tailored Indonesian outreach messages.
4. Add quick action button on `CareerCard.tsx` to copy the generated template with instant feedback toast.

**Steps:**
- [ ] Write failing test in `src/lib/__tests__/career-radar.test.ts` verifying urgency detection and message generation.
- [ ] Run test with `npx tsx src/lib/__tests__/career-radar.test.ts` and confirm failure.
- [ ] Implement `src/lib/career-radar.ts` with pure TypeScript functions (no external libraries).
- [ ] Run test with `npx tsx src/lib/__tests__/career-radar.test.ts` and verify it passes.
- [ ] Integrate follow-up radar badge and copy button in `src/components/career/CareerCard.tsx` and `CareerKanban.tsx`.
- [ ] Verify compilation with `npx tsc --noEmit`.
- [ ] Commit changes: `feat(career): implement automated follow-up radar and outreach message generator`.

---

### Task 2: Automasi 2 — Daily Morning Briefing & Task Rollover

**Files:**
- Create: `src/lib/daily-rollover.ts`
- Test: `src/lib/__tests__/daily-rollover.test.ts`
- Create: `src/components/dashboard/DailyBriefingModal.tsx`
- Modify: `src/stores/useTaskStore.ts`
- Modify: `src/components/dashboard/DashboardCockpit.tsx`
- Modify: `src/app/page.tsx`

**Requirements:**
1. Check `last_briefing_date` stored in `localStorage`.
2. When the user opens the app on a new calendar day (`todayStr !== last_briefing_date`):
   - Automatically rollover uncompleted P1 tasks (`status !== 'done'` and `priority === 1`) to `is_daily_focus: true`.
   - Calculate summary stats: number of active interviews, pending assessment deadlines, rolled-over tasks.
   - Display a sleek Warm Bento modal ("Morning Cockpit Briefing") greeting Ferrel with today's action plan.
3. Dismissing the modal saves `last_briefing_date = todayStr` to guarantee once-a-day display.

**Steps:**
- [ ] Write failing test in `src/lib/__tests__/daily-rollover.test.ts` verifying task rollover logic and briefing metrics calculation.
- [ ] Run test with `npx tsx src/lib/__tests__/daily-rollover.test.ts` and confirm failure.
- [ ] Implement `src/lib/daily-rollover.ts` with pure rollover transformation functions.
- [ ] Run test with `npx tsx src/lib/__tests__/daily-rollover.test.ts` and verify it passes.
- [ ] Add `rolloverUnfinishedP1Tasks()` action to `src/stores/useTaskStore.ts`.
- [ ] Build `src/components/dashboard/DailyBriefingModal.tsx` styled in Warm Bento with Plus Jakarta Sans.
- [ ] Wire the modal into `src/app/page.tsx` with hydration-safe `useEffect`.
- [ ] Verify compilation with `npx tsc --noEmit`.
- [ ] Commit changes: `feat(productivity): implement daily morning briefing and automatic P1 task rollover`.

---

### Task 3: Automasi 3 — Dropzone 24-Hour Auto-Purge

**Files:**
- Create: `src/lib/dropzone-purger.ts`
- Test: `src/lib/__tests__/dropzone-purger.test.ts`
- Modify: `src/stores/useDropzoneStore.ts`
- Modify: `src/components/dropzone/DropzonePanel.tsx`

**Requirements:**
1. Pure function `purgeExpiredDropzoneItems(items, now, maxAgeMs = 24 * 60 * 60 * 1000)`:
   - Preserves all items with `is_pinned === true`.
   - Retains unpinned items created within the last 24 hours.
   - Discards unpinned items where `now - Date.parse(created_at) > maxAgeMs`.
   - Returns `{ retainedItems, purgedCount }`.
2. Wire `purgeExpired()` into `useDropzoneStore.ts` so it automatically evaluates upon initialization and item additions.
3. Display real-time count of auto-purged items in `DropzonePanel.tsx` header.

**Steps:**
- [ ] Write failing test in `src/lib/__tests__/dropzone-purger.test.ts` covering pinned protection and expired purge.
- [ ] Run test with `npx tsx src/lib/__tests__/dropzone-purger.test.ts` and confirm failure.
- [ ] Implement `src/lib/dropzone-purger.ts`.
- [ ] Run test with `npx tsx src/lib/__tests__/dropzone-purger.test.ts` and verify it passes.
- [ ] Integrate `purgeExpired` into `useDropzoneStore.ts` and display indicator in `DropzonePanel.tsx`.
- [ ] Verify compilation with `npx tsc --noEmit`.
- [ ] Commit changes: `feat(dropzone): implement automated 24-hour cache purge for unpinned items`.

---

### Task 4: Automasi 4 — Local Dev Port Health-Check Ping

**Files:**
- Create: `src/lib/port-checker.ts`
- Test: `src/lib/__tests__/port-checker.test.ts`
- Modify: `src/components/dev/DevMissionControl.tsx`

**Requirements:**
1. Function `checkPortHealth(port: number, timeoutMs = 1200): Promise<'healthy' | 'down'>` using native `fetch` with `AbortController` and `mode: 'no-cors'`.
2. Automatically execute health-checks across all registered project ports every 30 seconds when viewing Dev Server.
3. Update the visual badge next to each project (`Healthy` with green pulse dot / `Down` with gray dot) in real time without page reload.

**Steps:**
- [x] Write unit test in `src/lib/__tests__/port-checker.test.ts` mocking fetch success and abort timeout.
- [x] Run test with `npx tsx src/lib/__tests__/port-checker.test.ts` and confirm failure.
- [x] Implement `src/lib/port-checker.ts` with timeout safeguards.
- [x] Run test with `npx tsx src/lib/__tests__/port-checker.test.ts` and verify it passes.
- [x] Integrate port health-check state and periodic polling hook into `src/components/dev/DevMissionControl.tsx`.
- [x] Verify compilation with `npx tsc --noEmit`.
- [x] Commit changes: `feat(dev): implement automated port health-check polling and status badges`.

---

### Task 5: End-to-End Test Suite, Production Build & Documentation

**Files:**
- Modify: `README.md`
- Modify: `DESIGN.md`
- Modify: `package.json` (add all test scripts to `npm test`)

**Requirements:**
1. Update `package.json` test script to execute all unit test suites (`career-utils`, `command-parser`, `crypto-vault`, `career-radar`, `daily-rollover`, `dropzone-purger`, `port-checker`).
2. Run full test suite and confirm 100% passing.
3. Run `npm run build` and confirm 0 errors.
4. Update `README.md` with descriptions of the 4 in-app automations (strictly no emojis).

**Steps:**
- [x] Update `package.json` test runner script to run all test files.
- [x] Run `npm test` and verify all tests pass.
- [x] Run `npx tsc --noEmit` and verify 0 TypeScript diagnostics.
- [x] Run `npm run build` and verify clean static site generation.
- [x] Update `README.md` documenting the Automation Engine.
- [x] Commit changes: `docs(core): document in-app automation engine and finalize test suite`.

