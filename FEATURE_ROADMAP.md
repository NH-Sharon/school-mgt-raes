# School Management System — Feature Suggestions & Future Roadmap

Based on a full read-through of `backend/routes/*.js`, the database schema, and the Angular frontend (post bug-fix pass — see `BUG_REPORT.md`). Grounded in what's actually there today, not a generic feature wishlist.

**Status (2026-08-21): items #1–6, #8–11 are implemented, including the follow-up hardening pass** (see the "Implemented" note under each). #7, #12, #13, #14, #15 were scoped out of this pass — #7 needs an SMS/email provider account (credentials I don't have), and #12–15 are each a multi-week initiative that deserves its own planning session rather than being bolted on here.

**Follow-up pass (same day)**: closed the loose ends flagged in the first pass — audit logging now covers every write route (was: high-value routes only), teacher visibility is now actually scoped to assigned classes once an admin assigns any (was: mapping table existed but wasn't enforced), student/parent portals show "my seat" per upcoming exam (was: admin-only), homework attachments upload for real (was: photo only). Also committed the `.env` untracking and untracked `backend/node_modules` (1299 files that had no business being in git — reproducible via `npm install`).

**Two pre-existing schema/DB quirks surfaced while building this, unrelated to the roadmap items themselves**: `users.email` has a live UNIQUE constraint that isn't declared in `schema.sql` (so `POST /api/users` with a blank email will 409 after the first blank-email user exists — not something I fixed, since it's outside the approved scope); `classes.class_name_bn` is `NOT NULL` in the live DB, consistent with `schema.sql`. Worth knowing about if you hit unexplained 409/500s creating users or classes.

## What exists today
Admissions, attendance, exams + results, payments, homework, transport, employees + HR attendance, notices/gallery/events (public website content), users/roles (admin, teacher, student, parent). No automated tests anywhere (0 backend tests, 1 default Angular boilerplate spec). No SMS/email integration. No file-upload pipeline despite `multer` being a listed dependency. Single-tenant, one school's branding hardcoded into the frontend.

---

## Quick wins (small effort, closes real gaps in what's already built)

### 1. Parent portal — the `parent` role exists but is completely non-functional
`users.role` accepts `'parent'` (schema `CHECK` constraint), but there is no `guardian_student` link table, no parent-facing route, no parent-portal component. A parent account today can log in and see... nothing built for them. This is the single highest-value quick win: add a `guardian_students (guardian_user_id, student_id)` table and a `parent-portal.component.ts` that reuses the same `student-portal` API calls (attendance, results, payments, homework) filtered to their linked child/children. The IDOR fix I just shipped (`requireOwnStudentOrStaff`) needs one addition — extend it to also allow a `parent` role through when the requested student id is in their linked-children set.

**Implemented**: `guardian_students` table (`database-setup/database/migrate-features.sql`); `requireOwnStudentOrStaff` now branches on `parent` role ([backend/middleware/auth.js](backend/middleware/auth.js)); admin manages links via `GET/POST/DELETE /api/students/:id/guardians` and the 👪 button on each student row in the admin panel; `GET /api/auth/me` returns a parent's `children[]`; new [frontend/src/app/components/parent-portal.component.ts](frontend/src/app/components/parent-portal.component.ts) with a child-switcher for multi-child guardians; login routes `parent` role there. Verified live: a parent can read their linked child's payments/attendance/exam-results (200) and is blocked (403) from an unlinked student.

### 2. Self-service password reset
Right now only an admin can reset a password (`POST /api/users/:id/reset-password`) — a locked-out teacher/student/parent has no recovery path except calling the admin. `lab/` (the sibling BdVirtualLab app) already built exactly this — a dev-mode forgot-password → reset flow — and it's a straightforward port.

**Implemented**: ported `lab/`'s `password_resets` table + `/api/auth/forgot-password` and `/api/auth/reset-password` routes verbatim ([backend/routes/auth.js](backend/routes/auth.js)) — same dev-mode token-in-response behavior since there's still no SMS/email provider. New `forgot-password.component.ts` / `reset-password.component.ts`, linked from the login page. Covered by `backend/tests/auth.test.js` (issue → reset → old password rejected → new password works → token can't be reused).

### 3. Actually wire up file uploads
`multer` is in `package.json` but never `require()`'d anywhere. Student "photo" is just a plain text/URL field with no upload endpoint; there's no way to attach documents to an admission application or a homework submission. Add one `POST /api/uploads` route (or per-module upload endpoints) and start with student photos + admission documents — the highest-friction manual workaround right now.

**Implemented**: `POST /api/uploads` (multer, 10MB limit, image/PDF only) in [backend/routes/uploads.js](backend/routes/uploads.js), serving from `/uploads` statically; an `uploads` table tracks who uploaded what. The student photo field in the admin panel now actually uploads the file (previously it read the file into a base64 data-URL client-side and stuffed that into the `photo` text column — functional but bloated the DB; now it stores a real URL). Teacher-portal's homework form now also uploads a real attachment (`onHwAttachment` in `teacher-portal.component.ts`) instead of leaving `attachment_url` unset. **Deliberately not done**: a public admission-document upload for the unauthenticated `POST /api/admissions` form — `/api/uploads` requires an admin/teacher token, and opening it to anonymous callers would mean an unauthenticated public file-upload endpoint (storage-abuse/DoS risk) with no rate-limiting or CAPTCHA in place. Worth doing, but as its own scoped piece of work with those protections, not a quick add-on here.

### 4. Bulk student import (CSV)
Students are currently added one at a time through the admin panel form. Every real school onboarding a new class needs bulk import. `lab/`'s bulk-MCQ-CSV-import pattern (mentioned in its README) is a template to copy the shape of.

**Implemented**: `POST /api/students/bulk-import` accepts a `rows[]` array, auto-generates student IDs sequentially within the batch, reports per-row success/failure rather than all-or-nothing. Admin panel has a "Bulk Import (CSV)" button on the Students page with a paste-a-CSV textarea. Verified live with a 3-row batch (2 valid, 1 missing required fields) — correctly reports 2 created, 1 failed with reason.

### 5. Audit log for admin actions
Given what this session's bug report found (an unauthenticated user could've made themselves admin, or any student could've read every family's payment data), an audit trail — who created/edited/deleted what, and when — is cheap insurance and directly relevant to the trust model this app now has to defend. A single `audit_log` table + a thin logging call in each write route covers it.

**Implemented**: `audit_log` table + a `logAudit(req, action, entity, entityId, details)` helper ([backend/middleware/audit.js](backend/middleware/audit.js)), fire-and-forget so it never blocks or fails the request. **Now wired into every write route** in `backend/routes/*.js` — classes, subjects, transport, homework (including student submissions), payments, notices, gallery, hero-slides, quick-links, school-events, website-settings, admissions, employees, employee-attendance, teachers, attendance-marking, plus the original set (users, students, exams, fee-structures, teacher-assignments, seat-plan). Only `auth.js` (login has nothing to "audit" in this sense) and `uploads.js` (the `uploads` table itself already records who-uploaded-what) are exempt by design.

---

## Mid-term (real features, more design work)

### 6. Structured fee plans instead of ad-hoc payments
`payments` today is one-row-per-transaction, manually entered per student by an admin. There's no concept of a class-wide fee structure (tuition, exam fee, admission fee) that auto-generates monthly dues. Add a `fee_structures` table (per class, per fee type, amount, recurrence) and a scheduled job (or an admin "generate this month's dues" action) that creates `payments` rows in bulk. This is also the natural place to add **due-date SMS/email reminders**.

**Implemented**: `fee_structures` table + CRUD (`backend/routes/fee-structures.js`) + `POST /api/fee-structures/generate-dues` (defaults to current month, idempotent — skips a student+fee-type it already generated for that month) — a new "Fee Structures" admin panel section with a "Generate This Month's Dues" button. SMS/email reminders (part of #7) still not built — this only generates the `payments` rows.

### 7. SMS/email notifications
No notification channel exists at all right now — a parent finds out about their child's absence or a fee due only by logging in and checking. Bangladesh school-management products almost universally integrate a local bulk-SMS gateway (e.g. via a provider like SSL Wireless, Alpha SMS, or similar) for: absence alerts, fee-due reminders, exam-result publication. This is the feature most likely to be the actual differentiator parents notice.

### 8. Report card / tabulation sheet PDF generation
`exam_results` already stores marks per subject per exam; there's no consolidated report card or PDF export. Straightforward with a server-side PDF lib (e.g. `pdfkit` or `puppeteer`-rendered HTML) once the per-subject data exists — it already does.

**Implemented**: `GET /api/exams/:examId/report-card/:studentId` streams a PDF (via `pdfkit`, newly added dependency) with per-subject marks + total, gated by the same `requireOwnStudentOrStaff` check (so a student/parent can only pull their own). Admin panel's exam list has a 📄 button per exam opening a per-student download list. Verified: produces a valid PDF (`file` confirms `PDF document, version 1.3`).

### 9. Formal class-teacher / subject-teacher assignment
Right now `teacher_id` shows up ad hoc on homework/exam-result rows, but there's no structured "this teacher teaches these classes/subjects" mapping. That's what would let you scope a teacher's dashboard/permissions to *their* classes instead of the current all-or-nothing `requireRole('admin','teacher')` pattern — every teacher currently sees every class's data.

**Implemented**: `class_subject_teachers` table + CRUD (`backend/routes/teacher-assignments.js`), a `?mine=true` filter for a teacher to see just their own assignments, new "Teacher Assignments" admin panel section. **Enforcement now added too**: a `requireOwnClassOrAdmin(getClassId)` middleware ([backend/middleware/auth.js](backend/middleware/auth.js)) — admin always passes; a teacher passes if they have **zero** assignments recorded yet (backward-compatible: existing unassigned teachers keep exactly the old broad access) OR the requested class is one of their assigned classes. Applied to attendance view/mark (`GET`/`POST /:classId/:date`), homework creation (`POST /homework`), and exam-results entry (`POST /exams/results`, resolving `class_id` via the exam). Verified live: an unassigned teacher still sees every class (200); once assigned to class 1 only, class 2 correctly 403s while class 1 stays 200; admin unaffected either way. Homework/exam edit-and-delete-by-id routes weren't scoped (lower risk, would need a lookup-then-check per row — left as `requireRole('admin','teacher')`).

### 10. Seat plan / exam scheduling
This is what the README's "সিট প্ল্যান" claim was actually pointing at (see `BUG_REPORT.md` #8) — auto-generating exam seating from roll numbers + room capacity. Natural extension of the existing `exams` module.

**Implemented**: `exam_seat_plans` table + `POST /api/exams/:examId/seat-plan/generate` (rooms + capacity-per-room → sequential roll-number assignment, rejects if capacity is insufficient), whole-class listing (staff-only) and a per-student "my seat" lookup (`requireOwnStudentOrStaff`-gated). Admin panel's exam list has a 🪑 button to generate/view. **Now also surfaced to students/parents**: the "Upcoming Exams" list in both `student-portal.component.ts` and `parent-portal.component.ts` shows "🪑 Room X — Seat Y" under an exam once a seat is assigned (silently hidden if not yet generated).

---

## Longer-term / strategic

### 11. A real automated test suite
Zero backend tests today. This matters concretely: both Critical bugs in `BUG_REPORT.md` (open registration, IDOR) are exactly the class of bug a basic `supertest` suite around auth/authorization would catch before merge, not after a manual audit. Start with the auth + authorization paths specifically, then expand.

**Implemented**: `jest` + `supertest` (`npm test`, `backend/tests/`). `auth.test.js` covers login (success/wrong-password/missing-fields/unknown-user), confirms `/api/auth/register` is gone (404), and the full forgot/reset-password flow. `authorization.test.js` builds its own fixtures (class + 2 students + a student-role user + a parent-role user, all cleaned up in `afterAll`) and asserts the exact IDOR scenarios from `BUG_REPORT.md`: student reads own data (200) vs. another student's (403), parent reads linked child (200) vs. unlinked (403), a student can't submit homework as another student (403), admin/teacher unrestricted (200), no token rejected (401). 17/17 passing. **Coverage is deliberately narrow** — auth/authorization only, since that's where the highest-severity bugs were; CRUD correctness across the other 15+ route files isn't covered.

### 12. Multi-school / multi-tenant support
Branding ("Rowshon Amir Elementary School") is hardcoded into the frontend and seed data. If the intent is ever to sell/deploy this to other schools rather than run it for one, that's a schema change (add a `school_id` to every table) done once, early — much more expensive to retrofit later.

### 13. OMR-based bulk exam scoring
The README claims this exists; it doesn't. A real OMR feature needs: a scan/upload pipeline, an answer-key model, and image-processing to score sheets — meaningfully different work from the current manual marks-entry UI. Worth scoping properly rather than leaving as an unfulfilled claim.

### 14. Mobile app
Also claimed, doesn't exist. Cheapest path: the Angular frontend is already a reasonable candidate for a installable PWA wrapper (which `lab/` already does via `@angular/service-worker`) covering the "check my child's attendance/result" use case, before considering a full native rewrite.

### 15. Unify with BdVirtualLab (`lab/`)
Right now these are two entirely separate apps with separate databases, separate auth, separate deployments. If both serve the same institution, a shared login (SSO) or at minimum a shared user directory would remove real duplication for any user who needs both (e.g. a teacher who also grades on the lab platform).

---

## Suggested sequencing
If I had to pick where to start: **#1 (parent portal) → #6 (fee plans) → #7 (SMS notifications)** is the sequence that turns "admin-only internal tool" into something parents actually interact with — which is usually where a school-management product's actual value (and willingness to pay) shows up. **#11 (tests)** should happen in parallel with whichever of these ships first, not after.
