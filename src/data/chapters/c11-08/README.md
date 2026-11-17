# Cell: The Unit of Life — unpublished batches

Four new, individually authored 25-question batches (Q006–Q105) are stored here. They are **not imported by the published chapter module** and are excluded from the manifest and the app. The owner's earlier review attestation covered only the records that existed at commit `df3f8e03a325b7c100e48670c1c16554fc2e72f8`, not these later drafts. They require editorial and human review before publication.

The existing published item `c11-08-q002` was corrected after that attestation to distinguish NCERT's historical mesosome account from the modern interpretation that many observed mesosomes are fixation artifacts. Its stored answer position is unchanged, but the changed content is **not covered by the earlier review hash** and needs renewed human review. The chapter remains in progress.

To check all four drafts against the entire published bank in a temporary copy, without changing published files or counts:

```sh
node scripts/validate-draft.mjs c11-08 \
  pack1-cell-diversity-draft:cellDiversityDraft \
  pack2-prokaryote-draft:prokaryoteDraft \
  pack3-membranes-draft:membranesDraft \
  pack4-endomembrane-draft:endomembraneDraft
```

Automated schema, distribution and similarity checks cannot establish scientific correctness, originality or true conceptual distinctness. Resolve all such issues during editorial review.
