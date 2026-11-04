# Career Mobile UX & Floating Action Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Career Modal save button overlap on mobile devices caused by the bottom navigation dock and add a mobile-responsive Floating Action Button (FAB) for rapid application logging.

**Architecture:** 
1. Render Career modals via React Portals (`createPortal`) into `document.body` with `z-[70]` to break free from the nested Framer Motion `motion.div` stacking context trap.
2. Refactor `CareerModal` layout into a two-part container: scrollable form body and a fixed/sticky footer bar so the "Save Application" button is always pinned and unobstructed.
3. Add a Floating Action Button (FAB) on mobile view (`bottom-20 right-4`) inside `CareerKanban` with haptic/active scale transitions.

**Tech Stack:** Next.js 14 (App Router), React 18, React DOM (`createPortal`), Tailwind CSS, Lucide React, Framer Motion.

**Spec:** [docs/superpowers/specs/2026-11-03-nexus-os-design.md](file:///e:/College%20Stuff/Career/chemicvll/docs/superpowers/specs/2026-11-03-nexus-os-design.md)

## Global Constraints
- Zero Emojis in code, commit messages, and technical documentation.
- Maintain responsive consistency: Ensure changes look polished across mobile viewports (e.g. 360px - 430px width) and desktop without layout regression.
- Ponytail principle: Minimalist, clean Tailwind CSS utilities and standard React hooks.

## Review Focus
- Modal SSR hydration safety: React Portals require checking `typeof window !== 'undefined'` or a `mounted` state before calling `createPortal` to prevent Next.js hydration mismatches.
- Form submission linkage: Because the footer is moved outside the `<form>` element to remain permanently sticky, the submit button must link to the form via HTML5 `form="career-form"` attribute.
- Stacking order on mobile: Ensure the Floating Action Button does not collide with the mobile navigation dock capsule (`MobileNav` at `bottom-4`, FAB at `bottom-20`).

---

### Task 1: Fix Career Modal Stacking Context and Sticky Footer

**Files:**
- Modify: `src/components/career/CareerModal.tsx`
- Modify: `src/components/career/CareerFollowUpModal.tsx`

- [ ] **Step 1: Add SSR-safe portal wrapper and mount state in CareerModal**
  Import `createPortal` from `react-dom`. Add `const [mounted, setMounted] = useState(false)` with `useEffect(() => setMounted(true), [])`. If not mounted or not open, return `null`.

- [ ] **Step 2: Elevate modal z-index and extract sticky footer**
  Set container overlay to `fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm`.
  Assign an `id="career-form"` to `<form>`. Move the footer controls (`Cancel` and `Save Application`) outside the scrollable `<form>` into a dedicated bottom bar (`shrink-0 border-t border-outline/20 bg-surface-container-lowest`). Set `type="submit" form="career-form"` on the Save button.

- [ ] **Step 3: Update CareerFollowUpModal with Portal**
  Wrap `CareerFollowUpModal` return with `createPortal(..., document.body)` with `z-[70]` so it also reliably breaks out of the stacking context.

- [ ] **Step 4: Run unit tests and build check**
  Run `npm test` and `npm run build` to verify no TypeScript or SSR errors.

- [ ] **Step 5: Atomic Git Commit**
  Stage and commit with message: `fix(career): use portal and sticky footer in CareerModal to prevent dock overlap`.

---

### Task 2: Implement Mobile Floating Action Button (FAB) in CareerKanban

**Files:**
- Modify: `src/components/career/CareerKanban.tsx`

- [ ] **Step 1: Add Floating Action Button element**
  Add a responsive floating action button at the root of `CareerKanban` section:
  ```tsx
  {/* Mobile Floating Action Button (FAB) */}
  <button
    type="button"
    aria-label="Add Career Application"
    onClick={() => handleOpenAdd('applied')}
    className="md:hidden fixed bottom-20 right-4 z-40 w-13 h-13 rounded-full bg-inverse-surface text-white shadow-xl hover:bg-black active:scale-90 transition-all flex items-center justify-center border border-outline/30 focus:outline-none"
  >
    <Plus className="w-6 h-6 stroke-[2.5]" />
  </button>
  ```

- [ ] **Step 2: Polish responsive visibility**
  Ensure the FAB is strictly hidden on `md:` breakpoints (`md:hidden`) where the top desktop button `[+ Record Application]` is already prominent.

- [ ] **Step 3: Run unit tests and Next.js build**
  Execute `npm test` and `npm run build` to guarantee zero regressions.

- [ ] **Step 4: Atomic Git Commit**
  Stage and commit with message: `feat(career): add mobile floating action button for quick application entry`.

---

### Task 3: Push to Origin and Verification

- [ ] **Step 1: Push commits to GitHub**
  Execute `git push origin main` to synchronize with Vercel remote deployment.

- [ ] **Step 2: Verify on Vercel deployment**
  Confirm deployment succeeds and mobile layout operates as expected.

