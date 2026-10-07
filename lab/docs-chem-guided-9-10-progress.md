# Chemistry guided course — Class 9-10 (progress, 2026-10-07)

## Done (Phase 1: Class 9-10)
- **Source work:** all 12 chapters of the NCTB Class 9-10 Chemistry book (pdf, scanned) were read page-by-page as images (printed page = pdf page − 5). One JSON per chapter: `backend/db/data/chemistry-9-10/reactions/chNN.json` (every item cites a printed page; `confidence` = read / partly-legible / inferred).
- **Generator:** `backend/db/data/chemistry-9-10/build-curriculum.mjs` → `frontend/src/app/data/chem-curriculum-9-10.generated.ts`. It only models an item on the bench if its equation is balanced (atom-checked), has exactly 2 shelf-able reactants, is ≤100 °C and not a gas reactant; everything else becomes an **explanation card** with the reason. Re-run `node build-curriculum.mjs` after editing a chapter JSON.
- **Result:** 47 guided bench experiments (incl. 21 in ch.9), 230 explanation cards, 20 new reactions, 17 new chemicals (water, CaCO₃, MgCO₃, NaHCO₃, CaO, Al₂O₃, CuO, Al(OH)₃, Mg(OH)₂, Al/Fe/Cu/Zn nitrates, FeSO₄, CaCl₂, CaC₂). Shelf now has 41 bottles in 8 groups (+ oxides, non-metals, organic/others).
- **Guided mode UI:** pick chapter → topic → experiment; steps are serial and auto-checked (take the right chemical in the right amount in Test tube 1 → heat/filter if needed → "বিক্রিয়া ঘটান" → observe → "বুঝেছি"). "✨ আমার জন্য সাজিয়ে দিন" selects tool/reagent/amount; wrong order/vessel/chemical gives a warning and counts a mistake.
- Engine: `Chemical.conc/molarMass/dispense`, endothermic reactions (temperature drop), flammable-gas flame warning also for C₂H₂.

## Things to know (data integrity)
- The book's section headings differ from the 72 topics in the DB for ch.5, 7, 9, 11, 12 (the topics were authored earlier, not from the book). Items are mapped to the nearest topic; the DB topic list was **not** changed.
- Chapters 3 (পদার্থের গঠন) and 5 have no bench-able reaction in the book → only cards/none.
- Some equations in the book are unbalanced or only inferred; those are marked "যাচাই বাকি" in the UI.
- ΔH values: from the book where given (e.g. CaO + H₂O −63.95 kJ, p.173); NH₄Cl dissolution (+14.8 kJ/mol) and default exotherms are textbook-level approximations.

## Not done
- Class 11 and Class 12 (chapter/topic structure is not in the DB yet; PDFs are scanned → same method needed).
- Cards are text only (no animation); heating >100 °C, electrolysis, cells, organic synthesis are explanation-only.
- No quiz at the end of an experiment; no teacher dashboard for guided progress.


---
## Update 2 — Class 9-10 completed
- **Real book structure:** each chapter's *actual* numbered sections (with printed start pages) were extracted (`reactions/chNN.sections.json`) and replace the old generic 6-topic list in the guided course UI; every item is placed in the section by its book page.
- **73 guided experiments** (47 reaction-based + 26 observation-only "demo" experiments), **219 explanation cards**, **26 new chemicals** (incl. water, KMnO₄, solid NaCl, CuSO₄·5H₂O, AgCl, naphthalene, kerosene, ink, lemon juice, soap solution, hydroxides/oxides/carbonates/nitrates, CaC₂).
- **New engine capabilities:** dissolution/diffusion of solids and dyes (speed depends on temperature), solubility (soluble / insoluble / solvent-dependent), pH calculation (strong/weak acids and bases, salt hydrolysis) with a live pH chip, indicator colours from pH (universal indicator colours follow book fig. 9.01; litmus; phenolphthalein), endothermic cooling, beaker-scale solution preparation with computed molarity, boiling-point experiment with a temperature gate.
- **Per chapter (experiments, cards):** 1:(4,6) 2:(4,10) 3:(0,0 — pure theory) 4:(2,17) 5:(5,17) 6:(7,10) 7:(10,31) 8:(3,25) 9:(33,27) 10:(1,31) 11:(2,22) 12:(2,23).
- **Still marked "যাচাই বাকি":** 11 experiments / 24 cards (equation inferred or partly legible in the book scan).
- **Not on the bench by design (cards):** strong heating >100 °C, electrolysis/cells, burning in air, gas reagents (CO₂, NH₃, C₂H₄…), organic synthesis, industrial processes, hydrates, soap making.
- Quick checks done: guided runs for boiling water, KMnO₄ (hot), pH of HCl / lemon juice, salt-solution pH; 7 reaction results in the quick menu; qty/pH/ΔT values verified against hand calculation (e.g. 0.5 g NH₄Cl in 10 mL → pH ≈ 4.6, Na₂CO₃ → pH ≈ 12).
- Class 11-12: not started.
