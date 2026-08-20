# School Management System — End-to-End Test & Bug Report

**Scope**: root `school-management-system/` (Angular 19 frontend + Node/Express backend + PostgreSQL). `lab/` (BdVirtualLab) was explicitly excluded per user request.
**Date**: 2026-08-20
**Method**: local run against an isolated Postgres 15 container (port 5433, via `docker-compose.yml`'s `postgres` service — the schema auto-applies from `database-setup/database/schema.sql`), backend on port 3002 (3000/3001 were occupied by unrelated local projects), frontend via `ng serve`. Testing combined direct API calls (`curl`) against every route file under `backend/routes/`, code review of auth/authorization logic, and the Angular build's own diagnostics. **No fixes have been applied yet** — this is the report for you to confirm before I touch code.

**Not covered**: live browser click-through of the UI — this environment has no browser-automation tool available, so frontend findings below come from code review + build output, not observed rendering. If you want the visual UI walked through, I can do that with your screen or you can hand me screenshots.

**Status: all 9 findings below are fixed** (confirmed 2026-08-20/21, see outcome notes on each — #9 was found during a later follow-up pass, not the original audit). One extra issue surfaced while fixing #5 — see the note there.

---

## Critical

### 1. Anyone can self-register as `admin` — no auth on `/api/auth/register`, `role` trusted from client
**File**: [backend/routes/auth.js:48-63](backend/routes/auth.js#L48-L63)
**Repro**:
```bash
curl -X POST http://localhost:3002/api/auth/register -H "Content-Type: application/json" \
  -d '{"username":"hacker","email":"x@x.com","password":"pwn123","role":"admin"}'
# → 201 Created, role: "admin"
curl -X POST http://localhost:3002/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"hacker","password":"pwn123"}'
# → valid admin JWT
```
Confirmed live against the local instance. This endpoint has no `verifyToken`/`requireRole` guard at all, and inserts whatever `role` string the client sends directly into `users.role`. Anyone with network access to the API gets full admin control of the school's data (students, payments, exam results, employee records) with one HTTP request.
**Fix direction**: either remove public self-registration entirely (accounts created only by an admin via `POST /api/users`, which already exists and is properly gated), or if public registration must stay (e.g. parent signup), hardcode `role: 'student'`/`'parent'` server-side and ignore any `role` sent by the client.

**FIXED**: the frontend never called `/api/auth/register` (only `/api/users` via the admin panel does user creation, already properly gated) — the route was dead weight with no legitimate use, so it was removed entirely from `auth.js`, and the now-stale reference to it in `auth.interceptor.ts`'s public-route allowlist was removed too. Re-verified: `POST /api/auth/register` now returns 404.

### 2. Broken access control (IDOR) — authenticated non-admin users can read/write any other user's records
**Files**: [backend/routes/students.js:7](backend/routes/students.js#L7), [payments.js:7](backend/routes/payments.js#L7), [payments.js:48](backend/routes/payments.js#L48), [attendance.js:24,48,66,95](backend/routes/attendance.js#L24), [exams.js:81,97](backend/routes/exams.js#L81), [homework.js:100](backend/routes/homework.js#L100)

All of these only check `verifyToken` (is the caller logged in?) — none check that the `studentId`/`id` in the URL or body actually belongs to the caller. Confirmed live as `student1` (role `student`, linked to student id 5):
```bash
# full roster of every student in the school — names, parents' names, DOB, phone, address
curl -H "Authorization: Bearer $STUDENT1_TOKEN" http://localhost:3002/api/students

# every family's payment/fee records, unrelated to student1
curl -H "Authorization: Bearer $STUDENT1_TOKEN" http://localhost:3002/api/payments

# another specific student's fee history and attendance %, just by guessing an id
curl -H "Authorization: Bearer $STUDENT1_TOKEN" http://localhost:3002/api/payments/student/2
curl -H "Authorization: Bearer $STUDENT1_TOKEN" http://localhost:3002/api/attendance/student-summary/2
```
`homework.js:100` (`POST /submit`) is the write-side variant: `student_id` comes straight from the request body, so a logged-in student can submit or silently overwrite another student's homework submission.

**Impact**: full PII and financial-record disclosure across every family in the school, plus tampering with another student's homework record. This is the kind of bug that turns "small internal school app" into a real data-breach liability the moment it's reachable outside a trusted LAN.
**Fix direction**: every "by studentId" route needs to check `req.user.role === 'admin' || req.user.role === 'teacher' || (req.user.role === 'student' && the studentId resolves to req.user.userId via the students.user_id link)`. Same pattern for `parent` role against their linked children (guardian-linking doesn't appear to exist in this schema yet — see feature suggestions below).

**FIXED**: added a `requireOwnStudentOrStaff(getStudentId)` middleware in `middleware/auth.js` — admin/teacher pass straight through, a `student` caller is only allowed through if the requested student id resolves (via `students.user_id`) to their own account, everyone else gets 403. Applied to `students.js` (`GET /`, `GET /:id`), `payments.js` (`GET /`, `GET /student/:studentId`), `attendance.js` (`student-summary`, `report/:studentId/:month`, `report-summary`, `/:classId/:date`), `exams.js` (`student-results/:studentId`, `/:examId/results`), `homework.js` (`POST /submit`, checked against `body.student_id`). Re-verified live: `student1` now gets 403 on another student's records and 200 on their own; `admin`/`teacher` regression-tested unaffected (still 200 everywhere).

---

## High

### 3. `backend/.env` is committed to git despite `.gitignore` excluding it
**Files**: [backend/.gitignore:2](backend/.gitignore#L2) says `.env*`, but `git log --oneline -- backend/.env` shows it was added in the initial commit — `.gitignore` only stops *future* untracked files, it doesn't retroactively untrack a file already in history.
**Impact**: `JWT_SECRET` and `DB_PASSWORD` are in git history for anyone who clones the repo (currently placeholder values, but the tracked file will keep leaking whatever real values get put in it going forward, since edits to a tracked file show up in every commit/diff).
**Fix direction**: `git rm --cached backend/.env` (keep the file on disk), commit that removal, and rotate any secret that was ever real in that file's history.

**FIXED (staged, not committed)**: ran `git rm --cached backend/.env` — it's staged for removal from tracking but still on disk untouched. I did not commit or rotate any secrets myself since I don't have your production credentials; **you still need to**: (1) commit this removal, (2) if the real `JWT_SECRET`/`DB_PASSWORD` used in production was ever the same as what's in this file's git history, rotate it.

### 4. Every route handler swallows errors with no server-side logging
**Files**: all of `backend/routes/*.js` — 56 `catch (error) { res.status(500).json({ message: 'Server error' }) }` blocks, only 2 of which log anything (`grep console.error routes/*.js` → 2 hits total).
**Impact**: when something breaks in production, there is no log line to diagnose it from — the actual JS error/stack is discarded. Every 500 looks identical from the server's own logs.
**Fix direction**: `console.error(error)` (or a real logger) before every 500 response, at minimum.

**FIXED**: added `console.error(error)` to all 56 catch blocks across every `backend/routes/*.js` file. Also hardened two spots (`routes/users.js` `POST /`, `routes/subjects.js`) that returned the raw `e.message` to the client instead of a generic message — that's an information-disclosure smell (can leak DB column/constraint names to any caller who triggers a 500), now logged server-side only and a generic `'Server error'` sent to the client. Verified: `node --check` passes on every route file, and a live 500 now produces a full stack trace in the server log.

---

## Medium

### 5. Local dev frontend config points at the production backend, not localhost
**File**: [frontend/src/environments/environment.ts:3](frontend/src/environments/environment.ts#L3) — `apiUrl: 'https://raes-backend.vercel.app/api'`, identical to `environment.prod.ts`.
**Impact**: README's documented local setup (`cd frontend && npm install && ng serve`) does not actually exercise your local backend at all — `ng serve` silently talks to the live production API. A developer testing "locally" can end up creating/editing/deleting real production data (students, payments, users) without realizing it, and can't test backend changes without deploying them first.
**Fix direction**: `environment.ts` (dev) → `http://localhost:3000/api` (matching the README's documented backend port); leave `environment.prod.ts` pointing at the Vercel URL.

**FIXED — turned out to be bigger than one file**: `environment.ts`/`environment.prod.ts` were never actually read anywhere — **every single component and service hardcoded its own literal `'https://raes-backend.vercel.app/api'` string** (13 files, ~40 call sites: `admin-panel`, `teacher-portal`, `student-portal`, `landing`, `dashboard`, `payments`, `teachers`, `homework`, `attendance`, `transport`, `exams` components, plus `auth.service.ts` and `student.service.ts`). So fixing `environment.ts` alone would have changed nothing. Fixed properly: every one of those now imports `environment` and reads `environment.apiUrl`, `environment.ts` now points at `http://localhost:3000/api`, `environment.prod.ts` is untouched (still the Vercel URL) and `angular.json`'s existing `fileReplacements` already swaps dev→prod correctly on a production build. Verified: `npx tsc --noEmit` clean, `ng serve` rebuilds with zero warnings, and a live admin-token smoke test against the local backend succeeded across all 10 list endpoints.

### 6. `POST /api/auth/login` returns 401 for malformed requests instead of 400
**File**: [backend/routes/auth.js:9-24](backend/routes/auth.js#L9-L24)
**Repro**: `curl -X POST .../login -d '{}'` → `401 {"message":"Invalid credentials"}`.
Missing `username`/`password` in the body is a client error (400), not a failed-auth case (401). Low practical impact (frontend always sends both fields), but muddies API semantics for anyone else integrating against it.

**FIXED**: added an explicit check in `auth.js`'s `/login` handler returning 400 before the DB lookup runs. Verified: `curl -d '{}'` now returns `400 {"message":"username and password are required"}`.

---

## Low / cleanup

### 7. Dead code: duplicate `switch` branch, flagged by the Angular build itself
**File**: [frontend/src/app/components/admin-panel.component.ts:2557 & 2565](frontend/src/app/components/admin-panel.component.ts#L2557-L2565) — `case 'payments': this.loadPayments(); break;` appears twice in the same `switch`. Harmless (both branches do the same thing) but the second is unreachable; `ng serve`/`ng build` emits a warning on every build.

**FIXED**: removed the duplicate `case`. Verified: `ng serve` rebuild no longer emits the `duplicate-case` warning.

### 8. README claims features not present anywhere in the codebase
**File**: [README.md](README.md) lists "✅ OMR সার্ভিস" and "✅ মোবাইল অ্যাপ" as implemented features. No OMR-related route/table and no mobile app project exist in this repo. Not a code bug, but worth flagging — either the doc is stale marketing copy or there's a component living outside this repo that should be referenced.

**FIXED**: split the README's feature list into "Features (implemented)" — verified against actual routes/tables — and a new "Planned / Not yet implemented" section for OMR, seat plan, mobile app, and community features (also caught "সিট প্ল্যান" making the same false claim, moved it too). See `FEATURE_ROADMAP.md` for what building those out would actually take.

### 9. No frontend route guards — every protected page was reachable while logged out
**File**: [frontend/src/app/app.routes.ts](frontend/src/app/app.routes.ts) — none of `/admin`, `/students`, `/teachers`, `/attendance`, `/exams`, `/payments`, `/homework`, `/transport`, `/student-portal`, `/teacher-portal`, `/parent-portal` had a `canActivate` guard. Navigating to any of them directly (no login) rendered the component shell instead of redirecting to `/login`. **Not a data leak** — the backend independently rejects every unauthenticated API call with 401/403 (verified throughout this session), so no data was ever actually exposed — but it's a broken-looking page for anyone who bookmarks/shares a direct link instead of the proper "please log in" experience.
**FIXED**: added `frontend/src/app/guards/auth.guard.ts` (a functional `CanActivateFn` checking `AuthService.isLoggedIn()`, redirecting to `/login` otherwise) and applied `canActivate: [authGuard]` to all 11 protected routes. `/`, `/login`, `/forgot-password`, `/reset-password` remain public. Verified via `tsc --noEmit` (clean) and code review — I could not visually click through the redirect since this environment has no browser-automation tool (same limitation noted at the top of this report).

---

## Summary table

| # | Severity | Area | One-line | Status |
|---|----------|------|----------|--------|
| 1 | Critical | Auth | Public registration lets anyone become admin | ✅ Fixed (route removed) |
| 2 | Critical | Authorization | IDOR exposes every student's PII/payments/attendance/exams to any logged-in student | ✅ Fixed (ownership middleware) |
| 3 | High | Secrets | `backend/.env` tracked in git despite `.gitignore` | ⚠️ Untracked, staged — **you need to commit + rotate secrets if ever real** |
| 4 | High | Observability | All backend errors swallowed with no logging | ✅ Fixed (56 catch blocks) |
| 5 | Medium | Dev config | Local `ng serve` hits production API by default | ✅ Fixed (was systemic — 13 files) |
| 6 | Medium | API correctness | Login returns 401 instead of 400 on bad request | ✅ Fixed |
| 7 | Low | Code cleanliness | Duplicate switch case (dead code) | ✅ Fixed |
| 8 | Low | Docs | README lists unimplemented features | ✅ Fixed |
| 9 | Medium | Frontend | No route guards — protected pages reachable while logged out (backend still blocked all data) | ✅ Fixed |

---

## What I did *not* get to
- Visual/manual UI click-through (no browser tool in this environment)
- Full CRUD test of every module (classes, subjects, transport, gallery, notices, employees, hero-slides, quick-links, website-settings, admissions) beyond the authorization-pattern review above — these all follow the same `verifyToken` + `requireRole('admin')` pattern for writes and look consistent, but I didn't individually exercise every field/edge case
- Load/performance testing
- Mobile responsiveness

## Your action items (I can't do these for you)
1. ~~Commit the `backend/.env` untracking~~ — **done**: committed in `1707f99`. Still on you: decide whether to rotate `JWT_SECRET`/`DB_PASSWORD` if the real production values were ever the same as what's in this file's git history (I have no access to your production secrets to check).
2. If you want public self-registration back for parents/students (rather than admin-only account creation via the admin panel), tell me and I'll re-add it with the role hardcoded server-side.
3. Local dev now needs your backend running on `localhost:3000` (`cd backend && npm start`) — port 3000 was occupied by an unrelated project during my testing so I ran on 3002 via an env var override, but the committed `.env`/`environment.ts` both correctly say 3000 for anyone else.
4. ~~`backend/node_modules` was tracked in git~~ — **done**: untracked and committed in `6b3c07d` (files stay on disk, nothing changes for anyone currently running the app).

See `FEATURE_ROADMAP.md` for feature suggestions and a future-plan writeup.
