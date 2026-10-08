# Chemistry guided course — Class 11 & 12 progress

## Sources
- **Class 11:** NCTB Class 11 chemistry book (`lab/text-books/class-11-12/`), 19 page chunks, printed pages cited on every item.
- **Class 12:** `Chemistry_Second_part_Class_12.pdf` is a **private publisher's HSC guide for the old syllabus, not the NCTB textbook**. Items are reworded in our own Bangla. Printed equations that were unbalanced are given balanced, with the printed form kept in `equation_printed`.

## Pipeline
- Raw extraction: `lab/backend/db/data/chemistry-11/reactions/c11-NN.json`, `chemistry-12/reactions/c12-NN.json`
- Generator: `lab/backend/db/data/build-curriculum-11-12.mjs` (shared: `chem-dict.mjs`, `chem-helpers.mjs`; diagnostic: `diag-11-12.mjs`)
- Output: `lab/frontend/src/app/data/chem-curriculum-11-12.generated.ts` (`GEN_BOOKS['11'|'12']`), merged in `chem-curriculum-9-10.ts` (EXPERIMENTS/CARDS/CHAPTERS/reactions/kinetics) and `chem-extra-data.ts` (chemicals).

## Result (generated)
| Book | Items | Bench-tagged | Modelled labs | Cards |
|---|---|---|---|---|
| Class 11 | 577 | 209 | 41 experiments | 519 |
| Class 12 | 1377 | 426 | 74 experiments | 1287 |

Rule: an item becomes a guided lab only if its equation is balanced, has exactly 2 reactants that exist on the bench, and needs no gas/strong heating. Everything else is an explanation card. Nothing is invented. Items whose confidence is not "read" are flagged "যাচাই বাকি".

## Known limits
- Class 11 chapters 1–3 are mostly theory, so few labs.
- Class 12 is mostly organic chemistry (gases, reflux, catalysts), so mostly cards.
- Ion tests (Fe²⁺, NH₄⁺ …) are cards because ions are not shelf chemicals.
- Class 12 chapter titles were derived from the book's contents and the extracted sections; they need a check.
- Class 12 chunk 19 items under section "12.22?" have an inferred section number.
- Initial bundle grew; `angular.json` initial budget raised to warn 4 MB / error 6 MB. Production build passes (transfer ≈ 324 kB).

## QA done
`tsc` clean; `ng build --configuration production` OK; Playwright: book selector shows Class 11/12 chapters; Class 11 ch.1 experiment runs through the guided steps; labs page: student 75 chemistry labs (Class 9–10 only), system admin 190 across all books.

## Not done
Not committed, pushed or deployed. Class 11/12 experiments have not been checked one by one against the books.
