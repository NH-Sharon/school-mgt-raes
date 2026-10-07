# BdVirtualLab

Interactive Lab Simulation, Learning & MCQ Examination Platform for Classes 6-12 (NCTB curriculum, Bangladesh). Built to the requirements in `SRS_BdVirtualLab.docx`.

## Live deployment

- Frontend: https://bdvirtuallab-frontend.vercel.app
- Backend API: https://bdvirtuallab-backend.vercel.app/api
- Database: Neon Postgres project `bdvirtuallab` (org: Specter), separate from the RAES school's Neon projects
- Vercel projects: `specter-tech/bdvirtuallab-frontend`, `specter-tech/bdvirtuallab-backend`

Same demo logins as local (see below). To redeploy after changes: `vercel deploy --prod --yes` from `backend/` or `frontend/` respectively (both are already linked).

## Stack

- **Backend** (`backend/`): Node.js + Express + PostgreSQL (raw `pg`, no ORM), JWT auth, bcrypt — mirrors the conventions of the sibling `school-management-system/backend`.
- **Frontend** (`frontend/`): Angular 19, standalone components, signal-based bilingual (Bangla/English) i18n, installable PWA — mirrors the conventions of the sibling `school-management-system/frontend`.

## Local setup

### 1. Database

Any Postgres 13+ works. Example with Docker:

```bash
docker run -d --name bdvirtuallab-postgres -e POSTGRES_DB=bdvirtuallab -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5544:5432 postgres:15
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # adjust DB_PORT/DB_PASSWORD etc. to match your Postgres
                       # (optional) set ANTHROPIC_API_KEY to enable the Book Analysis engine
npm install
npm run db:setup       # applies schema.sql + migrate-srs.sql (SRS tables: topics, books, cq_questions, safety, etc.)
npm run db:seed        # seeds subjects/chapters/content/simulations/questions + demo users
node db/seed-expansion-classes-9-12.js   # adds 5 extra chapters each for Classes 9-12 (20 total)
node db/seed-simulations-round2.js       # adds 5 more real interactive simulations (circuit/lens/titration/photosynthesis/HTML editor)
node db/seed-chemistry.js                # SRS slice: safety-equipment catalog, lab safety requirements,
                                         # chemistry book records, lab ordering, guided-step scripts
node db/seed-chemistry-full.js           # FULL NCTB Class 9-10 Chemistry bank — all 12 real chapters,
                                         # 72 topics, 360 level-tiered MCQs + 24 Creative Questions
                                         # (authored offline in db/data/chemistry-9-10/chem_full_part*.json,
                                         # no LLM at runtime). Migrates the chemistry sims onto the Acid-Base chapter.
npm run dev            # http://localhost:4000
```

Demo logins (password `Test@1234` for all): `student1`, `teacher1`, `guardian1`, `contentadmin1`, `sysadmin1`.

### 3. Frontend

```bash
cd frontend
npm install
npm start   # ng serve, http://localhost:4300 — proxies API calls to http://localhost:4000/api
```

## What's implemented

Every functional requirement in the SRS (FR-1 through FR-7) works end-to-end:

- **Auth & roles** — student/teacher/guardian/content_admin/system_admin, guardian-student linking.
- **Virtual labs** — Chemistry (acid/base/salt/metal mixing, ported from the original prototype), Physics (simple pendulum → g estimation), Biology (virtual microscope), ICT (logic gate builder). Every attempt is logged (steps, mistakes, hints, duration) and feeds the dashboard.
- **Learning content** — chapter-wise notes/formulas, progress tracking, bookmarks, personal notes.
- **MCQ exams** — randomized question serving, timer, practice/exam mode, negative marking, instant scoring + explanations, weak-chapter detection, teacher-assigned exams.
- **Dashboards** — student (mastery rings, score trend, activity heatmap, timeline, badges), teacher (class overview, weakest chapters, CSV export), guardian (weekly summary).
- **Content admin** — chapters/content/simulations/questions with draft → review → publish workflow, bulk MCQ CSV import, audit log.
- **PWA** — installable, offline-capable via `@angular/service-worker`.

## SRS Lab & Study Platform (2026-07-22 build)

Implemented on top of the base app per `srs/SRS_Lab_Learning_Platform.md`, with Chemistry as the fully-populated end-to-end subject:

- **FR-1 UI/UX** — global design-token system (`frontend/src/styles.css`), redesigned split-panel Login/Signup, **forgot-password → reset** flow (dev returns the reset token in the response since there is no email/SMS integration), unified top navigation (Study / Labs / Book Corner / Exam / Dashboard).
- **FR-2 Guided / Non-Guided labs** — every lab is entered through a **Lab Launch** screen (mode selection → safety check). Guided mode shows a step-by-step script with hints (seeded for the chemistry sims in `simulations.config.guidedSteps`); Non-Guided hides hints. Each attempt records `mode` + `safety_passed`.
- **FR-3 Study (MCQ + CQ)** — chapter view has **Notes / MCQ Practice / Creative-Question Practice** tabs. CQ practice shows stimulus + 4 leveled parts (knowledge/comprehension/application/higher) with reveal-able model answers.
- **FR-4 Exams** — questions are tiered **Basic / Medium / Advanced**, randomized, with **anti-repeat** (avoids the previous attempt's questions when the pool allows) and a **level-wise breakdown** on the result page.
- **FR-5 Book Corner** — admins upload PDFs (`POST /api/books/admin`, stored in `backend/uploads/`, gitignored); students read them in an in-app **pdf.js** reader with page nav, zoom, HTTP-Range streaming, and saved last-read page. The three NCTB chemistry PDFs are pre-registered by `seed-chemistry.js` (served from `text-books/`).
- **FR-6 Book Analysis engine** — content admins trigger analysis over a page range (`/admin/books` UI → `POST /api/analysis/admin/:bookId`). The backend (`services/bookAnalysis.js`) extracts a text layer if present, otherwise sends a **PDF-vision slice** (scanned NCTB pages) to the **Claude API** (`ANALYSIS_MODEL`, default `claude-opus-4-8`, structured outputs) and creates **draft** chapters → topics → notes + leveled MCQ + CQ for admin review/publish. Requires `ANTHROPIC_API_KEY`; without it the endpoint returns a clear 400.
- **FR-7 Lab sequence** — `/labs` lists experiments grouped and ordered by textbook chapter sequence, with chapter/topic/name filtering.
- **FR-8 Safety prerequisite** — a `labLaunchGuard` makes it impossible to open a simulation without first passing the safety checklist for that lab; the backend re-verifies required equipment on attempt creation.

New env vars (`backend/.env`): `ANTHROPIC_API_KEY` (optional; enables FR-6), `ANALYSIS_MODEL` (default `claude-opus-4-8`).

> **Note on `backend/uploads/`** — used for locally uploaded books. Vercel's serverless filesystem is ephemeral, so production book uploads would need cloud object storage (e.g. Vercel Blob / S3); the seeded chemistry books are served from the committed `text-books/` paths and work in either environment.

## Seed content

One full learn → simulate → exam path per subject (Chemistry Class 9-10, Physics Class 9-10, Biology Class 9-10, ICT Class 11-12) — enough to exercise every feature. The rest of the NCTB catalogue is meant to be added by teachers/content admins through the Admin panel (`/admin`), not hand-authored here — see the plan notes for why.

## Known simplifications

- No real SMS/OTP or payment gateway integration (none exists to connect to); hooks are structured so one can be added later.
- 50k+ concurrent user scalability is an architecture property (stateless JWT API + pooled Postgres), not something load-tested here.
- Chemistry reaction descriptions (ported from the original prototype) are Bangla-only; the rest of the UI and the Physics/Biology/ICT content is bilingual.
