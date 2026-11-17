# MemoNeet Editorial & Human-Review Checklist

Every 25–50-question batch and every complete 400-question chapter pack must satisfy both automated validation (`scripts/validate-bank.mjs`) and the editorial review checklist below before being recorded in `src/data/reviewRegistry.js`:

1. **Original wording & copyright safety:** Every stem, option set, and explanation is freshly written in original instructional language—never copied or closely paraphrased from NCERT paragraphs, end-of-chapter exercises, answer keys, Exemplar items, or copyrighted coaching banks.
2. **Biological & NCERT accuracy:** Every tested fact, taxonomic rank, structural term, physiological pathway, equation, and historical landmark is faithful to rationalised NCERT Class 11/12 Biology; no fabricated values or speculative claims.
3. **Single unambiguous best answer:** Exactly one of the four options is scientifically correct (`answer` ∈ `{0, 1, 2, 3}`); no question has two defensible options, trick phrasing, ambiguous double negation, `"all of the above"`, or `"none of the above"`.
4. **Parallel, plausible distractors:** All four options share comparable grammatical form, specificity, and length so option length or phrasing does not leak the correct choice.
5. **Genuine conceptual distinctness:** Automated Jaccard token/shingle similarity checks are paired with manual pack-by-pack inspection to confirm no two items test the exact same fact via synonym swaps, option permutations, or boilerplate preambles.
6. **Cognitive & difficulty balance:** Spans `recall`, `concept`, `application`, `statement-analysis`, `case-based`, and `data-based` formats across `easy`, `medium`, and `hard` tolerances, with balanced `0..3` stored answer distribution plus live option shuffling in the app.
7. **Substantive teaching explanation:** Every explanation clearly states why the correct option holds and clarifies the chief distractor misconception(s).
8. **Honest source attribution:** `isVerifiedOfficialPYQ` is `false` on all original items, and `NEET practice` items are explicitly labelled *Original NEET-pattern practice (not a verified official PYQ)*.

## Signed-Off Chapters
- **`c11-01` — The Living World (Class 11):** `pack1`–`pack8` (Q001–Q400, 400/400) — Passed strict automated validation (0 errors, 0 near-duplicate warnings across 79,800 stem pairs) and full checklist inspection (`reviewRegistry.js`).
- **`c11-02`..`c11-19`, `c12-01`..`c12-13`:** Remain `IN PROGRESS` (`checklistComplete: false`) until all 8 reviewable 50-question packs per chapter reach 400/400 validated unique items.
