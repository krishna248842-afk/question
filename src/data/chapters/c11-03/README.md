# Plant Kingdom draft packs

`pack1.js`–`pack4.js` contain a work-in-progress draft of Q001–Q200. They are **not imported by the published chapter module**, not counted in the manifest, and not included in the app build. Q001–Q005 overlap the currently published starter pack, so only 195 of these draft positions are additional.

A temporary chapter-scoped validation of these four packs reported two distribution failures: hard difficulty 13.5% (minimum 14%) and NEET practice 37% (maximum 36%). This does not assess biological accuracy, copyright, or meaningful duplication; individual items and distractors require independent editorial review and corrections before publication. Do not sign off these drafts as human-reviewed without a documented human reviewer.

Two additional unpublished batches are `pack5-pteridophyte-draft.js` (Q223–Q247) and `pack7-gymnosperm-draft.js` (Q302–Q326), 25 items each. Together with packs 1–4, they contain 250 draft records, including the five starter positions already published. Q201–Q222, Q248–Q301, and Q327–Q400 remain unwritten. Draft numbering reserves these gaps for planned coverage; it does not imply completed packs.

Run `node scripts/validate-plant-drafts.mjs` to check the combined drafts against the entire published bank in a temporary copy without modifying the application or manifest. The combined draft passed automated checks with no detected errors or similarity warnings, but those checks cannot establish originality, accuracy, plausible distractors, or conceptual distinctness. Editorial and independent human review remain necessary, particularly because earlier draft packs contain repeated concepts and other possible quality issues. The published chapter remains at 5/400, in progress.
