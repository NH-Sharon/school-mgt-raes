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
npm install
npm run db:setup       # applies schema.sql
npm run db:seed        # seeds subjects/chapters/content/simulations/questions + demo users
node db/seed-expansion-classes-9-12.js   # adds 5 extra chapters each for Classes 9-12 (20 total)
node db/seed-simulations-round2.js       # adds 5 more real interactive simulations (circuit/lens/titration/photosynthesis/HTML editor)
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

## Seed content

One full learn → simulate → exam path per subject (Chemistry Class 9-10, Physics Class 9-10, Biology Class 9-10, ICT Class 11-12) — enough to exercise every feature. The rest of the NCTB catalogue is meant to be added by teachers/content admins through the Admin panel (`/admin`), not hand-authored here — see the plan notes for why.

## Known simplifications

- No real SMS/OTP or payment gateway integration (none exists to connect to); hooks are structured so one can be added later.
- 50k+ concurrent user scalability is an architecture property (stateless JWT API + pooled Postgres), not something load-tested here.
- Chemistry reaction descriptions (ported from the original prototype) are Bangla-only; the rest of the UI and the Physics/Biology/ICT content is bilingual.
