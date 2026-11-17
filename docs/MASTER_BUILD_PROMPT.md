# MemoNeet — master implementation prompt for an AI coding agent

Copy everything inside **MASTER PROMPT** into an AI coding agent that can edit this repository, run commands, and continue across multiple tool calls. This prompt intentionally makes the content-completion gate explicit: the app is not complete until every syllabus chapter has 400 validated questions.

---

## MASTER PROMPT

You are the senior full-stack engineer and Biology assessment-content editor continuing the existing MemoNeet repository. **Replace and finish the current app in this repository; do not create a second product or a throwaway demo.** Work on the current branch only. The user wants an installable Android APK and an offline NEET Biology study app.

### 1. Non-negotiable goal

Deliver one production-quality app with **exactly 400 genuinely distinct, original MCQs for every included NCERT Biology chapter** across Class 11 and Class 12, plus a clearly separated NEET-pattern practice stage if appropriate. Every question must have four options, exactly one correct answer, and a useful explanation. The count is **400 per chapter**, not 400 for the whole app and not 400 across only some chapters.

A chapter is complete only when it has 400 questions that pass the content and automated checks below. Never claim the app is complete, show a “400” badge, or package a “complete” APK while any chapter is below 400.

The existing app currently has about 100 individually authored questions for “The Living World” and many older template-derived prompts in other chapters. **Do not count those template/rephrased prompts as unique questions. Audit the existing data, discard duplicates and weak variants, and report the real per-chapter count.**

### 2. NCERT coverage and copyright rules

- Interpret “line by line” as **systematic coverage of every examinable concept, definition, distinction, example, diagram/table takeaway, process, and exception** in each chapter. Maintain an internal chapter-section/concept checklist and map each question to a concept ID.
- Write new questions in original language. Do **not** copy/reproduce NCERT passages, exercises, answer keys, diagrams, or a substantial sequence of textbook wording. Do not make close paraphrases whose only change is a synonym or prefix.
- Do not claim official NCERT endorsement. Do not call a question an official PYQ unless its year and source have been independently verified. Prefer labels “original NCERT-aligned practice” and “original NEET-pattern practice.”
- Do not make “99% guaranteed qualification,” score, or admission claims. Explain that practice supports preparation but cannot guarantee an exam result.
- Use reputable biological facts and verify uncertain details against an authorised textbook or official syllabus. If a fact cannot be verified, omit it rather than invent an answer.

### 3. Establish the definitive chapter inventory first

Audit the intended NCERT Biology edition and the applicable NEET syllabus year before authoring. The current UI inventory is below; treat it as an **inventory to verify, not proof that the syllabus is complete**. Add any omitted required NCERT chapters and retire chapters that are no longer part of the selected edition only with a clear migration note:

1. The Living World
2. Biological Classification
3. Plant Kingdom
4. Animal Kingdom
5. Morphology of Flowering Plants
6. Anatomy of Flowering Plants
7. Structural Organisation in Animals
8. Cell: The Unit of Life
9. Biomolecules
10. Cell Cycle and Cell Division
11. Photosynthesis in Higher Plants
12. Respiration in Plants
13. Plant Growth and Development
14. Digestion and Absorption
15. Breathing and Exchange of Gases
16. Body Fluids and Circulation
17. Excretory Products and their Elimination
18. Sexual Reproduction in Flowering Plants
19. Human Reproduction
20. Reproductive Health
21. Principles of Inheritance and Variation
22. Molecular Basis of Inheritance
23. Evolution
24. Human Health and Disease
25. Microbes in Human Welfare
26. Biotechnology: Principles and Processes
27. Biotechnology and its Applications
28. Organisms and Populations
29. Ecosystem
30. Biodiversity and Conservation
31. Environmental Issues
32. Neural Control and Coordination

Give every chapter a stable ID, class/grade, canonical display title, and syllabus/version metadata. Do not silently combine separate chapters or omit chapter sections.

### 4. Question quality contract

Each bank record must include:

```json
{
  "id": "stable unique ID",
  "stage": "Class 11 | Class 12 | NEET practice",
  "classStage": "Class 11 | Class 12",
  "chapterId": "stable chapter ID",
  "chapter": "canonical chapter title",
  "sectionId": "chapter section or concept group",
  "learningObjectiveId": "specific objective ID",
  "topic": "short topic label",
  "questionType": "recall | concept | application | statement-analysis | case-based | data-based",
  "difficulty": "easy | medium | hard",
  "question": "original MCQ stem",
  "options": ["A", "B", "C", "D"],
  "answer": 0,
  "explanation": "Why the answer is correct; address the key misconception where useful.",
  "sourceNote": "NCERT chapter/section + concept, not a copied passage",
  "isVerifiedOfficialPYQ": false
}
```

Quality rules:
- Exactly four **distinct, plausible** options and one unambiguous correct answer. Store answer as a zero-based integer matching the displayed option order.
- Explanations should teach the concept, not merely repeat the answer. Explain calculations and why a tempting distractor is wrong when relevant.
- Questions must be meaningfully different in learning objective, reasoning task, or application. A stem with only a different preamble, swapped option order, synonym substitution, or changed punctuation is a duplicate—not a new question.
- Avoid “all of the above,” “none of the above,” trick wording, ambiguous negation, unsupported facts, accidental clues in option length/grammar, and repeated answer-position patterns.
- Use a balanced distribution of easy, medium, and hard questions and several question types. Do not force case/data items into a chapter when they do not fit.
- Distractors must be biologically plausible but clearly wrong under the stated conditions. Do not use two defensible answers.
- Each item must map to a concept/section. Across a chapter, the 400 questions must cover the chapter broadly rather than concentrate on one memorisable fact.

### 5. Authoring and completion workflow — do not skip stages

1. **Audit:** inspect the repository, current app, chapter bank, tests, APK workflow, and all existing questions. Produce an exact per-chapter count of genuinely distinct valid questions. Identify missing chapters/concepts and duplicates.
2. **Map concepts:** for each chapter, create a section/concept checklist based on the selected NCERT edition. Split long chapters into explicit section IDs. Record how many questions are planned per section; all chapter sections must receive coverage.
3. **Author in reviewable packs:** create chapter data packs in batches of 25–50 questions. Validate each pack before adding the next. Never manufacture the remainder using a small set of stems or permutations.
4. **Deduplicate:** compare against every existing question in the same chapter and across chapters. Reject near-identical stems that test the same fact in the same way. Keep different questions on one concept only when the reasoning task genuinely differs.
5. **Count gate:** after every pack, show counts such as `The Living World: 175/400`. Do not mark a chapter complete until it has 400 valid, distinct questions. Do not claim all chapters are complete until **every** chapter has 400.
6. **Integrate:** use lazy-loaded chapter packs or another maintainable data approach so the offline APK size and startup time remain reasonable. Keep the complete bank available offline after installation.
7. **Verify:** run the content validator, app production build, tests, and Android APK workflow. Fix all failures. Test a sample from every chapter and verify correct answer/explanation alignment.
8. **Communicate honestly:** report completed vs remaining counts chapter by chapter. If work is interrupted, leave the app usable and clearly label incomplete chapters; never say “done” based only on total question count.

### 6. App requirements

Keep the existing product direction and replace the current app content in place:
- No login screen or required cloud account. Keep study data private to the device.
- Three study stages: Class 11 Biology, Class 12 Biology, and clearly labelled original NEET-pattern practice.
- Chapter filters, search, question type/difficulty filters, bookmarks, answer explanations, retry/wrong-answer review, progress/accuracy, and sensible empty/loading/error states.
- Full CRUD for personal questions and notes. Personal questions must be separate from vetted curriculum questions and must never inflate the 400-per-chapter verified-bank count.
- Use IndexedDB (or another robust offline store) for user progress, bookmarks, notes, and user-created items. Include export/import backup. Do not make localStorage the only persistence layer for a large bank.
- Installable PWA and Capacitor Android APK. Make the bank itself bundled/cached so practice works in airplane mode. Keep service-worker cache versioning correct when releasing updates.
- Responsive, accessible UI with answer feedback, keyboard/screen-reader labels, and variable answer positions.
- Do not present the APK or app as a complete question bank until the count gate passes.

### 7. Automated quality gate

Implement `npm run validate:bank` (or equivalent) which fails unless all of the following are true:

- The verified chapter inventory matches the selected edition/syllabus inventory.
- **Every chapter has exactly 400 valid bank questions** (or a documented explicit policy if the target is raised; do not silently accept fewer).
- IDs are globally unique; stems are not exact duplicates within or across chapters.
- Every question has four distinct non-empty options, one valid answer index, a substantive explanation, and valid chapter/section/objective metadata.
- Each chapter’s question-type and difficulty distribution stays within its documented tolerances.
- Similarity checks flag suspicious near-duplicates for human review; a human review checklist is required before marking the pack verified. A hash or unique ID alone does not establish uniqueness.
- Personal questions, demo data, and unverified PYQs are excluded from the verified content count.

Add tests for answer-index correctness, option shuffling, offline access, progress persistence, create/edit/delete, bookmarks, and Android packaging. Update README with exact counts and limitations; never describe a partial bank as complete.

### 8. Build and APK deliverable

- Preserve the current branch; do not switch branches.
- Run `npm ci`, `npm run validate:bank`, `npm run build`, and `npx cap sync android`.
- Run the existing Android GitHub Actions workflow and verify it succeeds. Provide the APK artifact link and simple Android installation steps.
- The APK must contain the latest verified bank offline. If any chapter is below 400, label it “in progress” and do not claim the requested complete app is delivered.

### 9. Final report format

Report:
1. Whether the bank is complete (yes/no).
2. A table with chapter title, valid unique count, target 400, and status.
3. Total valid questions and total required questions.
4. Validation/build/APK workflow results.
5. Any content/source limitations.

**Start by auditing the current repository and running the validator. Then continue authoring and integrating original question packs until every chapter reaches 400. Never replace missing content with repeated templates or pretend the target has been met.**

---
