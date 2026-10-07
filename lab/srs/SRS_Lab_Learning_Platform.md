# Software Requirements Specification (SRS)
## Interactive Lab & Study Learning Platform

**Version:** 1.0
**Prepared for:** Development handoff (Claude Code build)
**Date:** July 22, 2026

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for an educational web/app platform that combines **virtual science lab practice** with **chapter-wise theory study and exam practice**, built around students' school textbooks. It is intended to be handed to a development agent (e.g., Claude Code) as a build specification.

### 1.2 Scope
The platform will allow students to:
- Practice virtual lab experiments in **Guided** and **Non-Guided** modes, following a proper lab sequence with safety prerequisites.
- Study theory chapter-by-chapter from their own class textbooks, and practice MCQ and Creative Questions (CQ).
- Take randomized exams with difficulty tiers (Basic / Medium / Advanced).
- Read uploaded books online via a "Book Corner."
- Benefit from automatic question generation derived from book/chapter content analysis ("Book Analysis" engine).

### 1.3 Intended Audience
- Development team / AI coding agent implementing the system.
- Product owner reviewing scope before build.

### 1.4 Definitions
| Term | Meaning |
|---|---|
| MCQ | Multiple Choice Question |
| CQ | Creative Question (Bangladesh curriculum-style structured/essay question) |
| Guide Mode | Lab mode with step-by-step instructions/hints |
| Non-Guide Mode | Lab mode where student performs the experiment independently, without hints |
| Book Corner | In-app digital library/reader |
| SRS | Software Requirements Specification |

---

## 2. Overall Description

### 2.1 Product Perspective
A web-based (and optionally mobile-responsive) education platform with a student-facing app and an admin/content-management backend for uploading books, defining chapters/topics, labs, and questions.

### 2.2 User Classes
1. **Student** — primary user; studies theory, practices labs, takes exams, reads books.
2. **Admin/Teacher (Content Manager)** — uploads books, defines chapters/topics, lab sequences, and question banks (may be manual entry initially, with the Book Analysis engine assisting/automating this later).

### 2.3 Assumptions & Dependencies
- Books are uploaded in a readable digital format (PDF or structured text) that can be parsed for chapter/topic extraction.
- Lab simulations are 2D/interactive UI-based (not physical hardware controlled), unless otherwise clarified.
- Question generation (Book Analysis) may initially rely on manually tagged chapters/topics, with AI-assisted generation as a stretch feature.

---

## 3. Functional Requirements

### FR-1: UI/UX Design (All Pages, Including Login)
**Description:** Every page — including Login, Signup, Dashboard, Lab, Study, Exam, Book Corner — must have a modern, clean, student-friendly UI/UX.

**Requirements:**
- FR-1.1: Consistent design system (colors, typography, spacing, components) across all pages.
- FR-1.2: Login/Signup page redesigned with a modern layout (illustration or branding panel + form panel), clear validation messages, and a "forgot password" flow.
- FR-1.3: Responsive design — usable on desktop, tablet, and mobile screen sizes.
- FR-1.4: Consistent navigation (sidebar or top nav) across Dashboard, Lab, Study, Exam, and Book Corner sections.
- FR-1.5: Loading states, empty states, and error states designed (not just plain text/blank screens).
- FR-1.6: Dark/Light mode is a nice-to-have (optional, not mandatory for v1).

**Acceptance Criteria:** All listed pages follow one unified visual design language; no page uses default/unstyled browser elements.

---

### FR-2: Lab Resource — Guide & Non-Guide Modes
**Description:** For every lab experiment, students can choose between two practice modes.

**Requirements:**
- FR-2.1: Each lab has a **mode selection screen** before starting: "Guided Mode" or "Non-Guided Mode."
- FR-2.2: **Guided Mode:** Step-by-step instructions, hints/tooltips, highlighted next-action, immediate feedback on mistakes.
- FR-2.3: **Non-Guided Mode:** No hints shown; student performs the full experiment sequence independently; feedback (correct/incorrect/score) is given only at the end.
- FR-2.4: Both modes must be built on the same underlying lab simulation/experiment logic (avoid duplicating lab content).
- FR-2.5: Track and store performance data separately for Guided vs Non-Guided attempts (for progress analytics).

**Acceptance Criteria:** Student can freely toggle mode per attempt; system logs which mode was used per session.

---

### FR-3: Study Theory — Chapter-Wise Practice
**Description:** Students study from their actual class textbook content, organized by Subject → Chapter, and practice both MCQ and Creative Questions.

**Requirements:**
- FR-3.1: Student selects **Class** (grade/level) → **Subject** → **Chapter** (free choice, any order, any chapter).
- FR-3.2: For the selected chapter, student can view:
  - Theory/notes content (from Book Analysis / uploaded book data)
  - MCQ practice set
  - Creative Question (CQ) practice set
- FR-3.3: Practice sessions show immediate or end-of-set feedback (correct/incorrect, explanation).
- FR-3.4: Progress per chapter (e.g., % completed, accuracy) is tracked and shown to the student.
- FR-3.5: Student can retry a chapter's question set multiple times (with question rotation — see FR-4).

**Acceptance Criteria:** Student can jump directly to any chapter of any subject without needing to follow chapters sequentially, and get MCQ/CQ practice for that specific chapter.

---

### FR-4: Exam Questions — Randomized & Leveled
**Description:** Every time a student takes an exam/practice test, questions must be randomized, and organized into difficulty tiers.

**Requirements:**
- FR-4.1: Question bank per chapter/topic must be tagged by **difficulty level**: Basic, Medium, Advanced.
- FR-4.2: On each exam attempt, questions are **randomly selected/shuffled** from the available pool (no two attempts show the identical fixed set/order, as long as pool size allows).
- FR-4.3: Student (or system default) can select difficulty level or a mix (e.g., "Balanced: some Basic + Medium + Advanced").
- FR-4.4: Exam engine must avoid immediate repeats of the same question in consecutive attempts where possible (basic anti-repeat logic).
- FR-4.5: Score, time taken, and level-wise breakdown shown after submission.

**Acceptance Criteria:** Two consecutive attempts on the same chapter/subject produce different question sets/orders (given sufficient question pool size); results are broken down by difficulty level.

---

### FR-5: Book Upload / Book Corner
**Description:** A digital library section where uploaded books can be read online by students.

**Requirements:**
- FR-5.1: Admin can upload books (PDF or structured format) tagged by Class + Subject.
- FR-5.2: Students browse Book Corner by Class → Subject → Book.
- FR-5.3: In-app reader (page-by-page or scroll view) — no separate download required to read.
- FR-5.4: Reading progress (last read page) saved per student per book.
- FR-5.5: Basic reader controls: zoom, page navigation, search within book (nice-to-have for v1).

**Acceptance Criteria:** Student can open any uploaded book directly in-browser/in-app and continue from where they left off.

---

### FR-6: Book Analysis Engine
**Description:** The system analyzes uploaded book content to extract topics/chapters and generate chapter/topic-wise questions automatically.

**Requirements:**
- FR-6.1: On upload, the system (or admin tool) extracts/organizes book content into **Chapters → Topics** structure.
- FR-6.2: This chapter/topic structure becomes the source of truth for FR-3 (Study Theory) and FR-4 (Exam Questions).
- FR-6.3: Question generation (MCQ/CQ) is derived from the specific chapter/topic content, not generic/unrelated questions.
- FR-6.4: Admin has a review/edit interface to approve, edit, or correct auto-extracted chapters/topics/questions before they go live to students.
- FR-6.5 (Phase 2 / stretch): AI-assisted question generation directly from book text using an LLM, with admin approval workflow.

**Acceptance Criteria:** Each chapter shown in Study Theory (FR-3) and each exam question (FR-4) can be traced back to a specific book + chapter + topic.

---

### FR-7: Lab Sequence
**Description:** Labs must be organized/arranged following the chapter and topic order of the subject, not randomly listed.

**Requirements:**
- FR-7.1: Each lab experiment is tagged with its corresponding **Subject → Chapter → Topic**.
- FR-7.2: Lab list/menu displays experiments in the same order as the textbook's chapter sequence.
- FR-7.3: Students can also filter/search labs by chapter or topic directly.
- FR-7.4: (Optional) Recommended next lab shown based on current chapter progress in Study Theory.

**Acceptance Criteria:** Lab listing page mirrors the textbook's chapter order; no arbitrary/unordered lab list.

---

### FR-8: Lab Practice Prerequisite (Safety Equipment Selection)
**Description:** Before starting any lab, students must select the required safety equipment for that experiment; the lab will not open until this is completed.

**Requirements:**
- FR-8.1: Each lab has a predefined list of required safety equipment (e.g., gloves, goggles, apron — configurable per lab by admin).
- FR-8.2: Before the lab simulation loads, student is shown a **"Safety Check" screen** listing all required equipment as selectable items (checklist).
- FR-8.3: Student must select/check **all required items** correctly before the "Start Lab" button becomes active.
- FR-8.4: If required equipment is missing/unselected, system blocks lab launch and shows a clear message indicating what's missing.
- FR-8.5: This prerequisite check applies in both Guided and Non-Guided modes (FR-2).
- FR-8.6 (Optional): Incorrect equipment selection (e.g., selecting an item not needed) can be flagged as a minor error/learning point, not just a blocker.

**Acceptance Criteria:** It is impossible to enter the lab simulation screen without first completing the safety equipment checklist correctly.

---

## 4. Data Model (High-Level Entities)

To support the above features, the system needs (at minimum) these core entities:

- **User** (student/admin, class/grade, profile)
- **Subject** (name, class/grade)
- **Chapter** (belongs to Subject, order/sequence number)
- **Topic** (belongs to Chapter)
- **Book** (file, Subject, Class, linked Chapters/Topics via Book Analysis)
- **Question** (type: MCQ/CQ, difficulty: Basic/Medium/Advanced, linked Chapter/Topic, options/answer/explanation)
- **Lab** (name, linked Subject/Chapter/Topic, sequence order, required safety equipment list, guided-mode script/steps)
- **LabAttempt** (student, lab, mode: guided/non-guided, score, timestamp)
- **ExamAttempt** (student, subject/chapter, questions served, score, level breakdown, timestamp)
- **ReadingProgress** (student, book, last page)
- **SafetyEquipment** (name, icon, linked to Labs as required items)

---

## 5. Non-Functional Requirements

- **NFR-1 Performance:** Pages should load within 2–3 seconds on average broadband/mobile data.
- **NFR-2 Usability:** UI should be understandable for school-age students (simple language, clear icons, minimal steps).
- **NFR-3 Reliability:** Exam/lab progress must be saved reliably (no data loss on refresh/disconnect mid-session).
- **NFR-4 Scalability:** Architecture should support adding new classes, subjects, and books without redesign.
- **NFR-5 Security:** Student accounts/login protected (password hashing, session management); admin upload/edit functions restricted to authorized roles.
- **NFR-6 Maintainability:** Question bank, chapters, and lab sequences should be manageable via an admin interface, not hardcoded.

---

## 6. Suggested Build Phases (for Claude Code)

1. **Phase 1 — Core Structure:** Auth (login/signup) with new UI, Class/Subject/Chapter data model, basic Dashboard.
2. **Phase 2 — Study Theory:** Chapter selection flow + MCQ/CQ practice engine (FR-3).
3. **Phase 3 — Exam Engine:** Randomized, leveled question delivery (FR-4).
4. **Phase 4 — Book Corner:** Upload + online reader (FR-5), then Book Analysis structuring (FR-6).
5. **Phase 5 — Lab Module:** Lab sequence by chapter (FR-7), Safety prerequisite checklist (FR-8), then Guided/Non-Guided modes (FR-2).
6. **Phase 6 — UI/UX Polish Pass:** Apply unified design system across all completed pages (FR-1) — can also be done incrementally per phase instead of at the end.

---

## 7. Open Questions (Recommend Clarifying Before/During Build)

- Which subjects/classes are in scope for v1 (e.g., Physics/Chemistry/Biology for a specific grade)?
- Are lab simulations 2D interactive diagrams, drag-and-drop steps, or something more complex (e.g., canvas-based simulation)?
- Is Book Analysis expected to use AI/LLM-based extraction in v1, or manual chapter/topic tagging by admin first?
- Should students track overall progress across Study + Lab + Exam in a unified dashboard/report?
