# Chemistry study notes + question bank — progress (Class 11 & 12)

## Source and method
- Class 11: NCTB Class 11 book (`lab/text-books/class-11-12/Chemistry_First_part_Class_11.pdf`; same file as `ntrca-book/.../Chemistry-1st-year-1st-paper.pdf`).
- Class 12: private publisher's HSC 2nd-paper guide (same file as `ntrca-book/.../Class-12-Chemistry-2nd-year-2nd-paper.pdf`), not NCTB. Written in our own words.
- Pages were rendered and read by agents; every topic = one book section (X.Y). Output JSON: `backend/db/data/chemistry-11/bank/b*.json`, `chemistry-12/bank/k*.json`.
- Seed: `node backend/db/seed-chemistry-hsc.js <11|12>` (local). Production: `POST /api/admin/seed-chemistry-hsc/<cls>?chapter=N` as system_admin.
- Questions are AI-written from the book pages; a teacher should review them. Book errors the agents noticed were avoided (see each file's `notes`).

## Status
| | Chapters | Topics | MCQ | CQ | Local DB | Production |
|---|---|---|---|---|---|---|
| Class 11 | 5 | 112 | 757 | 43 | seeded | seeded (deployed) |
| Class 12 | 12 of 12 | 382 | 1,731 | 89 | seeded | NOT seeded |

## Pending
- Class 12 production seed + deploy: not done (user has not asked yet).
- Class 12 chapter titled "তড়িৎ রসায়ন" is an older chapter already in the database (not from this book).
- Class 12 sections numbered like 1.47(ক) were folded into their parent topic; 4.14-style sub-boundaries may overlap slightly between chunks.
