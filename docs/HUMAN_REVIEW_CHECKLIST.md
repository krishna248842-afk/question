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

## Review status

On 2026-11-17 the project owner stated that they personally reviewed and approved all then-existing published questions and the Plant Kingdom and Animal Kingdom drafts against this checklist. This is a user attestation, not an independently verified external audit. It covers the records at source commit `df3f8e03a325b7c100e48670c1c16554fc2e72f8`; it does not apply to future questions. The exact chapter record counts and SHA-256 digests of their canonical JSON representation are recorded in `src/data/reviewRegistry.js`.

The Living World and Biological Classification each have 400 records and meet the owner-attested and automated chapter gates. Plant Kingdom has 300, Animal Kingdom 205, and the other chapters 5 each; they remain **in progress**. The owner's attestation covers the earlier record snapshots, not later changes: `c11-08-q002` was corrected after the sign-off and its revised wording requires renewed human review. The 100 subsequent Cell chapter drafts have not been approved or published. Automated checks cannot establish originality, factual accuracy, plausible distractors or genuine conceptual distinctness on their own.

A completed review entry must record the reviewer's name, date, count, checklist completion and content digest. Any content change invalidates the digest and requires renewed human review before the chapter can be marked complete again. Reviewers must resolve all similarity flags and document their decisions before sign-off.
