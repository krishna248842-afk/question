# Plant Kingdom batches

The project owner approved the existing records on 2026-11-17. The starter questions and the reviewed batches in this directory are now imported by the chapter module and included in the app. The starter Q001–Q005 remain unchanged; duplicates of those five in `pack1.js` are excluded from the published array.

The published chapter contains 300 records and remains **in progress**. `pack9-comparative-botany-draft.js` contains 25 new questions (Q201–Q222 and Q273–Q275); these are not imported into the app or included in the published count. Q276–Q301 and Q352–Q400 remain unwritten. The new draft uses supplementary botany sources alongside NCERT where indicated; reviewers should check the suitability of that depth, biological accuracy, originality, distractors and conceptual overlap before publication. The earlier owner attestation in `src/data/reviewRegistry.js` does not cover the new draft.

Check the draft in a temporary full-bank copy without publishing it:

```sh
node scripts/validate-draft.mjs c11-03 pack9-comparative-botany-draft:comparativeBotanyDraft
```

To include all current Cell drafts in the same check (including cross-chapter similarity detection):

```sh
node scripts/validate-draft.mjs \
  --chapter c11-03 pack9-comparative-botany-draft:comparativeBotanyDraft \
  --chapter c11-08 pack1-cell-diversity-draft:cellDiversityDraft \
    pack2-prokaryote-draft:prokaryoteDraft pack3-membranes-draft:membranesDraft \
    pack4-endomembrane-draft:endomembraneDraft
```

Automated checks cannot establish accuracy or conceptual distinctness.
