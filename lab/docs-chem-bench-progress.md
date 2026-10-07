# Chemistry Lab Bench — progress (2026-10-07)

## Done
- New animated virtual bench replaces the form-style mixing lab at route `/simulate/chemistry` (key `chem-mixing`; attempts, guided steps, safety gate, notebook all unchanged).
- Files (all in `lab/frontend/src/app/`):
  - `components/chem-bench.component.ts` — UI, animations (Web Animations API + CSS, no new dependency)
  - `data/chem-bench-engine.ts` — pure reaction engine; vessel state is **derived from contents** using the existing `REACTIONS` / `INDICATOR_BEHAVIOR` data
  - `data/chem-bench-art.ts` — SVG art for bottles and tools
  - `app.routes.ts` — route now loads `ChemBenchComponent`. Old `simulation-chemistry.component.ts` + `chem-beaker-3d` kept but unused.
- Equipment: 3 test tubes + rack, beaker, conical flask, funnel + filter paper, dropper, spoon, forceps, glass rod, Bunsen burner, wash/empty, vessel-to-vessel transfer (filters when target has funnel; precipitate stays on paper).
- Reagent cabinet shelved in order: Acids, Bases, Salts, Metals, Indicators. Each stocked as the right container (bottle / powder jar / metal jar / dropper bottle) and needs the right tool (pour/dropper, spoon, forceps, dropper).
- Effects: pour stream, drops, grains, falling metal, rising liquid, colour change, precipitate settling, bubbles, heat flame, stir, wrong-tool / overflow warnings (counted as mistakes).
- "Watch an experiment" presets auto-run the same animated actions in Test tube 1.

## Verified (headless Chrome, local)
Pour HCl → Zn with forceps (H₂ result), AgNO₃ + NaCl → precipitate → funnel filter into flask, NaOH + phenolphthalein dropper → pink, preset auto-demo, burner, stir, mobile width renders. No console errors.

## Not done / known gaps
- Only acid/base/salt/metal/indicator data (existing 5 categories). Other NCTB chapters (12 seeded) not yet given bench experiments.
- Drag-and-drop is desktop-only; touch uses tap (pick bottle → tap vessel).
- Reaction products are not tracked as new reactants (e.g. no 2-step reactions); a filtered/poured mixture is inert.
- Guided steps text is still the old script (written for slots); should be rewritten for bench actions.
- Titration lab (`chem-titration`) untouched.
- No automated tests.

## Next phase suggestion
1. Rewrite guided steps for the bench (DB `simulations.config.guidedSteps`).
2. Extend data for more chapters (gas collection, flame test, salt crystallisation).
3. Retire old mixing component once the bench is accepted.

---
## Update 2 (2026-10-07) — amounts, reaction button, time, explanations, quick menu
- **Amounts (native units):** liquids mL, powders/metals g, indicators in drops (1 drop = 0.05 mL). Per-action slider/number/chips under the hint bar. Vessel capacities: tube 20 mL, beaker/flask 100 mL.
- **Ingredient table:** per vessel in the right panel — name, amount, moles. Moles assume every solution = 1 mol/L (stated in the panel).
- **"বিক্রিয়া ঘটান" button:** adding chemicals no longer reacts them. Phases per vessel: fresh → reacting → settled. On finish the contents are replaced by leftover excess + one product solution (+ precipitate), so later additions react correctly.
- **Reaction time:** τ per reaction (`chem-bench-explain.ts`), × metal size factor, ÷ 2^((T−25)/10); burner raises temperature; time-lapse 1×/5×/20×/60×, pause, finish. Gas volume (24 L/mol), precipitate (mmol) and ΔT (ΔH values are approximate teaching values) evolve with progress.
- **Bangla explanation panel:** what / why / how (with ionic equation) / quantity calculation (limiting + excess) / time & temperature / use / safety. No-reaction explains *why not* (activity series, no insoluble product, acid+acid, etc.). Pairs absent from the lab data are shown as “❔ not modelled”, never as “no reaction”.
- **Risk warnings:** H₂ + open flame (danger), NH₃, CO₂ foam overflow, large exotherm, boiling, empty-vessel heating, per-chemical hazards (corrosive/toxic), overflow, wrong tool, pouring unreacted mixtures.
- **Quick reaction menu (⌨️ লিখে বিক্রিয়া করুন):** type e.g. `HCl + NaOH + ফেনলফথ্যালিন`, edit mL/g/drops, choose vessel size and heating, get the same full result without animation; button sends the setup to the bench.
- Extra reactions generated: all acid×base neutralizations, metals + H₂SO₄, Na₂CO₃ + H₂SO₄, AgNO₃+HCl, H₂SO₄+BaCl₂, Pb(NO₃)₂+Na₂SO₄.

### Known gaps
- Explanations are Bangla only (English UI shows Bangla explanation text).
- Transferring a reacted mixture makes it inert (excess reagents only keep their acid/base character).
- Concentration is fixed at 1 M; no concentrated-acid cases.
- Guided steps text still the old script.

---
## Update 3 (2026-10-07) — empty buttons + realistic visual cues
- **Empty:** "🗑 খালি করুন" under every vessel that has contents (also clears funnel/flame/temperature/explanation); "🗑 সব পাত্র খালি করুন" in the tray header. Wash tool still works.
- **Realistic cues (all derived from the reaction engine, `chem-bench-engine.ts` View):** thermometer per vessel (shown for the active vessel or when >30 °C; reaction heat is kept and cools ~0.35 °C per simulated second), hot glass glow >45 °C, steam above ≥75 °C, pungent NH₃ fumes, white fumes for HCl + NH₄OH, foam on CO₂ reactions, cloudy suspension + falling flakes while a precipitate forms then settling to a layer, metal pieces get a coloured deposit (Cu on Fe/Zn/Al) and a silver "tree" on Cu + AgNO₃, powders drawn as grains, colourless liquids drawn translucent.
- Verified in headless Chrome: AgNO₃+NaCl (flakes → white layer), Na₂CO₃+HCl (bubbles/foam), Ca(OH)₂+NH₄Cl (fumes), Mg+HCl (40 °C then cooling), Cu+AgNO₃ (silver tree, blue solution), empty button.
- Not visually verified: boiling/steam >75 °C, white HCl+NH₄OH fumes, glow class.
