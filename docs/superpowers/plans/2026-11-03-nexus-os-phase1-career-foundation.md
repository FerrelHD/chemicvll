# Phase 1: Foundation & Career/Internship Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Apply `ponytail` (minimal code, native features first, YAGNI, no unneeded abstractions). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js 14 App Router project with Apple Light typography/aesthetic, deploy the complete Supabase SQL migration, and build the full-featured Career & Internship Tracking Kanban (with applied dates, CV versions, follow-up alerts, and pure typographic styling without pill boxes).

**Architecture:** Next.js 14 App Router with TypeScript and Tailwind CSS. Client state managed via a lean Zustand store and Supabase client SDK (`@supabase/ssr` / `@supabase/supabase-js`). UI follows the Apple Human Interface light theme with SF Pro font stack, pure white cards, crisp hairline borders, and pure typographic hierarchy (no pill capsules or nested boxes).

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, Lucide Icons, Zustand, Supabase JS/SSR.

**Spec:** `docs/superpowers/specs/2026-11-03-nexus-os-design.md`

## Global Constraints

- **Theme & Aesthetic:** Apple Light canvas (`#F5F5F7`), card surface pure white (`#FFFFFF`), primary text `#1D1D1F`, secondary text `#6E6E73`, borders `#E5E5EA`.
- **Typography:** SF Pro system font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif`) with `SF Mono` for dates, counters, and file tags.
- **Badge & Card Policy (Anti-Slop):** Zero pill-shaped badge capsules (`px-2 py-0.5 rounded-full/md bg-blue-100`). Categories like "MAGANG" and "FULL-TIME" must be styled as pure bold text (`font-bold text-xs uppercase tracking-wider`). No nested inner boxes ("box-in-a-box").
- **Copywriting:** No em dash (`—`) characters in UI copy (Anti-slop R-02). Use `,`, `.`, `:`, or `()` instead.
- **Ponytail Rule:** Native HTML controls (`<input type="date">`, native dialog/forms) before adding third-party picker packages. One line before fifty. Minimum files, zero speculative abstraction.

## Review Focus

1. **Date Math & Elapsed Days:** Negative days or invalid timestamps must not crash the elapsed days counter (`10 hari lalu`); fallback to formatted date string if calculation fails.
2. **Category Filter State:** Switching between *Semua*, *Magang*, and *Full-time* must immediately re-slice columns without re-fetching or causing layout shift.
3. **Empty Column Handling:** Columns with zero applications (e.g. *Offer* empty) must render a calm, clean empty placeholder instead of collapsing or showing dead space.
4. **Offline / Missing Supabase Credentials:** The app must gracefully display a clean banner if `.env.local` keys are missing or unconfigured, rather than breaking with unhandled exceptions.
5. **Mobile Responsiveness:** Kanban columns must horizontally scroll smoothly or stack cleanly on mobile viewports (< 640px) without horizontal page overflow.

---

## Tasks

### Task 1: Scaffolding Next.js 14 App & Apple Light Theme

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.mjs`
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `public/manifest.json`

**Interfaces:**
- Produces: Base responsive app layout, Apple Light color tokens, SF Pro font stack, and PWA manifest.

- [ ] **Step 1: Initialize Next.js 14 TypeScript project with Tailwind CSS**
  Install core dependencies: `next`, `react`, `react-dom`, `lucide-react`, `zustand`, `@supabase/supabase-js`, `@supabase/ssr`.
  Dev dependencies: `typescript`, `@types/react`, `@types/node`, `@types/react-dom`, `tailwindcss`, `postcss`, `autoprefixer`.

- [ ] **Step 2: Configure Tailwind theme and Apple design tokens**
  In `tailwind.config.ts`, define:
  - `colors.canvas`: `#F5F5F7`
  - `colors.card`: `#FFFFFF`
  - `colors.subtle`: `#F8F9FA`
  - `colors.border`: `#E5E5EA`
  - `colors.appleText`: `{ primary: '#1D1D1F', secondary: '#6E6E73', muted: '#86868B' }`
  - Font families: `sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif']` and `mono: ['SF Mono', 'Menlo', 'Monaco', 'monospace']`.

- [ ] **Step 3: Setup `src/app/layout.tsx` and `public/manifest.json`**
  Add mobile viewport metadata, Apple mobile web app capable tags, and clean root layout.

- [ ] **Step 4: Verify build and dev server startup**
  Run: `npm run build`
  Expected: Compiled successfully with zero errors.

- [ ] **Step 5: Commit**
  ```bash
  git add .
  git commit -m "chore(core): initialize nextjs 14 typescript tailwind and apple light theme"
  ```

---

### Task 2: Supabase Migration Script & Client SDK

**Files:**
- Create: `supabase/migrations/20261103_initial_schema.sql`
- Create: `src/types/database.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `.env.local.example`

**Interfaces:**
- Produces:
  - `CareerPipeline` TypeScript interface matching the enhanced schema.
  - `createClient()` browser client for client components.
  - `createServerClient()` for server components and route handlers.

- [ ] **Step 1: Write initial SQL migration file**
  Save the complete database schema with RLS policies from `docs/superpowers/specs/2026-11-03-nexus-os-design.md` into `supabase/migrations/20261103_initial_schema.sql`.
  Ensure `career_pipelines` has all enhanced columns (`applied_date`, `platform_source`, `work_type`, `location`, `resume_version`, `stipend_or_salary`, `contact_person`, `next_follow_up_date`, `portal_url`, `notes`).

- [ ] **Step 2: Define TypeScript types in `src/types/database.ts`**
  Define `CareerPipeline`, `CareerStage`, `CareerCategory`, `WorkType`, and full Supabase `Database` type contract.

- [ ] **Step 3: Write minimal Supabase client helpers (Ponytail style)**
  Implement `createBrowserClient` in `src/lib/supabase/client.ts` and server helper in `src/lib/supabase/server.ts`.
  Provide mock/demo fallback data mode if Supabase environment variables are not yet populated by user.

- [ ] **Step 4: Write self-check test for schema definitions and client instantiation**
  Create `src/lib/supabase/__tests__/client.test.ts` or a quick verification script.
  Run: `npx tsx -e "import('./src/types/database').then(() => console.log('Types validated'))"`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add supabase/ src/types/ src/lib/ .env.local.example
  git commit -m "schema(core): add supabase migration and typescript database types"
  ```

---

### Task 3: Navigation Shell & Apple Clean Topbar

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/MobileNav.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: Tailwind tokens and layout structure.
- Produces: Responsive navigation header (Desktop) and touch-friendly bottom bar (Mobile PWA).

- [ ] **Step 1: Build `Header.tsx`**
  Clean top bar:
  - Logo mark (`⌘ Personal OS / chemicvll`).
  - Active status indicator (Cloud sync).
  - Quick hint button for `⌘K` command menu.

- [ ] **Step 2: Build `MobileNav.tsx`**
  Bottom navigation bar for mobile screens (< 768px):
  - Links: *Career*, *Tasks*, *Finance*, *Dev*.
  - Minimum 44px tap targets adhering to Anti-Slop R-03.

- [ ] **Step 3: Verify responsive layout in `src/app/page.tsx`**
  Run: `npm run build`
  Expected: Clean build with zero TypeScript errors.

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/layout/ src/app/
  git commit -m "ui(core): create apple light header and mobile bottom nav"
  ```

---

### Task 4: Career & Internship Kanban Board (Data & UI)

**Files:**
- Create: `src/components/career/CareerKanban.tsx`
- Create: `src/components/career/CareerCard.tsx`
- Create: `src/components/career/CareerModal.tsx`
- Create: `src/components/career/CategoryFilter.tsx`
- Create: `src/stores/useCareerStore.ts`
- Create: `src/lib/career-utils.ts` (date calculation & follow-up status helpers)

**Interfaces:**
- Consumes: `CareerPipeline` type, Supabase client.
- Produces: Interactive Kanban board, stage filtering, quick add/edit modal, days elapsed calculator.

- [ ] **Step 1: Write date & follow-up utility in `src/lib/career-utils.ts` with unit test**
  - `getDaysElapsed(appliedDate: string | null): string` -> returns e.g. "10 hari lalu" or "Hari ini".
  - `getFollowUpStatus(followUpDate: string | null): { isDue: boolean; label: string }`.
  - Write test in `src/lib/__tests__/career-utils.test.ts`.
  Run: `npx tsx src/lib/__tests__/career-utils.test.ts`
  Expected: PASS

- [ ] **Step 2: Implement Zustand store `src/stores/useCareerStore.ts`**
  Store actions:
  - `items: CareerPipeline[]`
  - `filter: 'all' | 'internship' | 'job'`
  - `setFilter(filter)`
  - `addItem(item)`
  - `updateItem(id, updates)`
  - `deleteItem(id)`
  - `moveStage(id, newStage)`

- [ ] **Step 3: Implement `CareerCard.tsx` (Typographic, Zero Pill Badges)**
  Follow user's approved design:
  - Category header: pure bold text (`font-bold text-xs uppercase tracking-wider text-blue-700` or `text-zinc-900`) without pill background.
  - Position & Company name with location & work type.
  - Metadata lines: Applied date + days elapsed, CV version tag, stipend/salary.
  - Follow-up reminder: pure bold amber text with small dot.
  - Clean card surface: pure white, 1px border `border-zinc-200/90`, Apple card shadow.

- [ ] **Step 4: Implement `CareerKanban.tsx` & `CategoryFilter.tsx`**
  - Kanban columns: `Wishlist`, `Applied`, `Assessment`, `Interview`, `Offer`, `Rejected`.
  - Column headers with item counts.
  - Typographic filter tabs (*Semua*, *Magang*, *Full-time*) with underline indicator.
  - Drag-and-drop or one-click stage advance dropdown.

- [ ] **Step 5: Implement `CareerModal.tsx` (Add & Edit Form)**
  - Native HTML inputs (`<input type="text">`, `<input type="date">`, `<select>`).
  - Fields: Company name, Role, Category (`internship` / `job`), Stage, Applied Date, Source (LinkedIn/Glints/etc.), CV Version, Stipend, Contact Person, Next Follow-up Date, Notes.
  - Validation: Company and Role required.

- [ ] **Step 6: Verify build & interactive behavior**
  Run: `npm run build`
  Expected: PASS

- [ ] **Step 7: Commit**
  ```bash
  git add src/components/career/ src/stores/ src/lib/
  git commit -m "feat(career): implement typographic career and internship kanban tracker"
  ```

---

### Task 5: End-to-End Verification & Verification Gate

**Files:**
- Modify: `src/app/page.tsx` (integrate CareerKanban into home view)

- [ ] **Step 1: Mount CareerKanban into main dashboard view**
- [ ] **Step 2: Run production build check**
  Run: `npm run build`
  Expected: Zero warnings, zero build errors.
- [ ] **Step 3: Test responsive layout and interactive flow**
  - Add new internship application.
  - Verify days elapsed calculation.
  - Verify follow-up date badge.
  - Toggle between All, Magang, and Full-time filters.
  - Verify mobile viewport layout (375px width).
- [ ] **Step 4: Commit**
  ```bash
  git add src/
  git commit -m "feat(career): integrate career kanban into dashboard with verified e2e flow"
  ```

