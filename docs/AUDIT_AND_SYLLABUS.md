# MemoNeet Legacy Question-Bank Audit & Definitive NCERT / NEET Syllabus

## 1. Phase-1 Audit of Existing Question Bank

Before writing any new code or content, the prior MemoNeet question bank (`src/data/questions.js`, 450 raw records) was audited with automated uniqueness, schema, and stem-pattern analysis:

| Metric | Legacy Count | Audit Finding |
|---|---:|---|
| Raw records in `src/data/questions.js` | 450 | 100 in *The Living World* + 350 across 31 other chapters |
| Template-wrapped duplicates (`In NEET Biology, consider…`, `A student reviewing…`, etc.) | 315 | 35 seed questions × 9 mechanical wrapper preambles — **discarded** |
| Semantic/reworded duplicates inside *The Living World* | 23 | Repeated same concept with slightly rephrased stems — **discarded** |
| Unique items in retired chapters (*Digestion and Absorption*, *Environmental Issues*) | 2 | Retired from rationalised NCERT & NMC NEET (UG) — **not carried over** |
| Genuinely distinct valid items in active syllabus | **110** | 77 in *The Living World* + 33 across 29 other retained chapters + 0 in 2 omitted required chapters |
| Chapters genuinely at 400/400 in legacy repo | **0 / 32** | Every legacy UI `"400+"` badge was inaccurate and removed |

Legacy templated prompts and detected rephrased duplicates were discarded. The replacement records (`src/data/chapters/c11-01.js`..`c12-13.js`) are subject to automated checks, which cannot prove originality, factual correctness, distractor plausibility, or conceptual distinctness. The owner has requested no further human-review gate; new material must not be described as human-reviewed.

## 2. Definitive Syllabus Standard & Migration Notes

- **Textbook standard:** Rationalised NCERT Biology (Class 11 & Class 12, 2025–26 Edition)
- **Exam alignment:** NMC NEET (UG) Biology Syllabus (2024–2026)
- **Total required chapters:** **32** (19 Class 11 + 13 Class 12)
- **Target per chapter:** **400** validated unique original single-best-answer MCQs (**12,800** total)
- **Canonical machine-readable specification:** `src/data/syllabus.js` (includes per-chapter stable IDs `c11-01`–`c11-19` and `c12-01`–`c12-13`, 5–6 section checklists per chapter, and exact section quotas summing to 400/chapter)

### Added Required Chapters (2 — previously omitted)
1. **`c11-17` — Locomotion and Movement** (Class 11, Rationalised Ch. 17, Unit V Human Physiology): Actively included in both rationalised NCERT Class 11 Biology and the NMC NEET (UG) syllabus (amoeboid/ciliary/muscular movement, sarcomere & sliding filament mechanism, axial/appendicular skeleton, joints, musculoskeletal disorders).
2. **`c11-19` — Chemical Coordination and Integration** (Class 11, Rationalised Ch. 19, Unit V Human Physiology): Actively included in both rationalised NCERT Class 11 Biology and the NMC NEET (UG) syllabus (hypothalamus, pituitary, pineal, thyroid, parathyroid, thymus, adrenal, pancreas, gonads, non-endocrine tissue hormones, membrane vs intracellular receptor mechanisms).

### Retired Chapters (Explicit Migration Record)
1. **Digestion and Absorption** (former Class 11 Ch. 16): Deleted in full from rationalised NCERT Class 11 Biology and removed from the NMC NEET (UG) syllabus.
2. **Environmental Issues** (former Class 12 Ch. 16): Deleted in full from rationalised NCERT Class 12 Biology and removed from the NMC NEET (UG) syllabus.
3. **Confirmed previously excluded rationalised chapters:** *Transport in Plants* (former Class 11 Ch. 11), *Mineral Nutrition* (former Class 11 Ch. 12), *Reproduction in Organisms* (former Class 12 Ch. 1), and *Strategies for Enhancement in Food Production* (former Class 12 Ch. 9).

### NMC Supplemental Sub-Topic Scope Note
- In `c11-01` (*The Living World*), sections `s1`–`s5` focus directly on core rationalised NCERT content (diversity, binomial nomenclature, classification, taxonomic categories, species–kingdom hierarchy & Table 1.1), while `s6` covers systematic/diagnostic comparisons and NCERT-grounded identification keys.
- In `c11-05` (*Morphology of Flowering Plants*) and `c11-07` (*Structural Organisation in Animals*), NMC supplemental family comparisons and frog (*Rana tigrina*) organ-system coverage are mapped inside their respective chapter sections (`c11-05-s5`, `c11-07-s4`, `c11-07-s5`).
