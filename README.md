# Personal OS (chemicvll)

An all-in-one personal command center, career opportunity pipeline, financial cashflow hub, deep work focus workstation, and local development environment controller designed for software engineers.

Project Code: `nexus-os`  
Author: Ferrel (`chemicv11`)  
Design Philosophy: Warm Bento Fintech (adapted from modern fintech command center ergonomics)

---

## Architecture Overview

Personal OS unifies daily engineering workflows, career development, and personal administration into a centralized web cockpit with keyboard-first navigation (`Cmd+K`) and Progressive Web App (PWA) mobile support.

### Tech Stack
- Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons
- Typography: Plus Jakarta Sans via next/font/google
- State Management: Zustand (client-side state, global command bar, and optimistic caching)
- Backend & Database: Supabase Cloud (PostgreSQL, Row Level Security, Supabase Auth, Realtime)
- Local Server Runner: Node.js background daemon with native child_process spawning and process tree management
- Security: Client-side .env Vault powered by the Web Crypto API (AES-GCM 256-bit with PBKDF2 key derivation)

---

## Core Functional Modules

### 1. Dashboard Cockpit
- 2x2 Bento Metric Widgets: Career pipeline status, monitored liquid balances, daily task completion ratio, and active listening dev ports.
- Cashflow Capsule Chart: 6-month comparative preview of cash in versus cash out.
- Active Card Preview: Virtual debit card preview with quick-action shortcuts.
- Today Timeline: Upcoming interviews and deep work focus slots.

### 2. Career & Internship Kanban
- Pipeline Stages: Wishlist, Applied, Assessment (coding test deadlines), Interview, Offer, and Rejected.
- Application Attributes: Submission date, elapsed days counter, CV and portfolio version tracker, work mode (remote, hybrid, onsite), compensation/stipend, recruiter contact info, and follow-up reminders.
- Interactive Detail Modal: Recruitment stepper flow (Screening, Technical Challenge, Tech Interview, Offering) with meeting links and document attachments.

### 3. Personal Finance & Cashflow
- Multi-Wallet Aggregation: Balances across bank accounts, e-wallets, and cash.
- Rapid Transaction Logging: Sub-5 second recording of expenses, income, and inter-wallet transfers.
- Subscription Radar: Recurring billing schedule calculator with automated H-3 renewal alert badges.
- Savings Rate Tracker: Visual indicators and progress tracking toward financial targets.

### 4. Deep Work & Focus Cockpit
- Pomodoro Focus Engine: 25-minute interactive timer with interval state controls.
- Priority Matrix: Division of tasks into urgent priorities (P1), scheduled roadmap milestones (P2), and quick wins (P3).
- Two-Tier Engine: Inbox quick-capture versus focused Daily Focus priorities (limited to 3-5 items).

### 5. Dev Server & Local Environment Manager
- Zero-VS Code Server Management: Remote start, stop, and restart controls for local project servers.
- Port & Engine Monitor: Real-time status reporting with process IDs (PIDs) and port allocation.
- Live Terminal Console: Slide-over drawer streaming stdout and stderr logs in real time.
- Client-Side .env Vault: In-browser encryption and decryption of project environment variables using a local Master Passphrase.

### 6. Dropzone & File Stash
- Cross-Device Clipboard: Instant text, URL, and code snippet synchronization between desktop and mobile devices via Supabase Realtime.
- Quick Code Scratchpad: Temporary snippet holder with one-click copy functionality.

---

## Design System: Warm Bento Fintech

The user interface follows the Warm Bento Fintech design paradigm specified in DESIGN.md:
- Canvas: Warm stone off-white (#FAF9F4 / #F6F5F0)
- Surfaces: Optical pure white (#FFFFFF) with 1px hairline borders (#ECEAE2)
- Accent Primary: Energetic warm citrus orange (#FF6B00)
- Dark Neutral: Deep carbon charcoal (#18181B) for primary pill buttons and active states
- Category Accents: Muted pastel tones (soft lavender, mint, warm peach)
- Geometry: 20px-24px rounded card containers with full-pill control buttons

---

## Getting Started

### Prerequisites
- Node.js version 18.17.0 or higher (Node v20+ recommended)
- npm version 9.0.0 or higher
- Git

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/FerrelHD/chemicvll.git
   cd chemicvll
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy the example environment file and configure your credentials:
   ```bash
   cp .env.local.example .env.local
   ```
   Populate `.env.local` with your Supabase Cloud project parameters:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   LOCAL_DAEMON_SECRET=your-chosen-daemon-token
   ```

4. Database Setup:
   Execute the migration script located at `supabase/migrations/20261103_initial_schema.sql` in the Supabase SQL Editor.

5. Run the web application:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

6. Run the local runner daemon (optional for local process control):
   ```bash
   node local-daemon/daemon.js
   ```

---

## Available Scripts

- `npm run dev`: Starts the Next.js development server on port 3000.
- `npm run build`: Compiles and builds the production application.
- `npm run start`: Runs the built production server.
- `npm test`: Executes the unit test suite via tsx.

---

## Git Commit Standards

This repository follows Conventional Commits under the principle of one commit per logical change:
- Types: `feat`, `fix`, `schema`, `ui`, `chore`, `docs`, `refactor`
- Format: `<type>(<scope>): <imperative summary description>`
