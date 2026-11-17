# MemoNeet — Offline NEET Biology Study Studio

MemoNeet is a private, offline-first Progressive Web App (PWA) and installable Capacitor Android app (`com.memoneet.study`) for NCERT-aligned Class 11 Biology and original Class 11 NEET-pattern practice—with no login, no cloud account, and full on-device IndexedDB persistence plus JSON backup export/import.

> **Question bank: IN PROGRESS.** The published bank contains 1,705 of 7,600 required records: The Living World and Biological Classification each have 400/400, Plant Kingdom 325/400, Animal Kingdom 230/400, Morphology of Flowering Plants 105/400, Cell: The Unit of Life 180/400, and the other 13 chapters 5/400 each. The project owner previously reviewed an earlier snapshot, but has since instructed that further human review is not a publication gate. The 325 subsequently published Plant, Animal, Morphology and Cell items and the later Cell Q002 correction are not covered by that review. Completion means the automated count and checks passed, not that content has been human-reviewed. Automated checks do not establish factual accuracy, originality, distractor plausibility or conceptual distinctness. See `docs/HUMAN_REVIEW_CHECKLIST.md` and the validator for details.

## Key Features

- **Two study tracks:** `Class 11 Biology` and Class 11 `Original NEET-pattern practice` (explicitly distinguished from official past-year exam questions).
- **Rich filtering & search:** Filter by study stage, chapter (`c11-01`..`c11-19`), chapter section, question type (`recall`, `concept`, `application`, `statement-analysis`, `case-based`, `data-based`), difficulty (`easy`, `medium`, `hard`), and full-text search.
- **Focused practice & option shuffling:** Single-best-answer practice with deterministic answer-preserving option shuffling (`src/lib/shuffle.js`), keyboard shortcuts (`A–D` / `1–4`, `←` / `→`, `R` retry), immediate misconception-aware explanations, bookmarks, and a dedicated **Wrong answers** retry queue.
- **19-chapter Syllabus & Status dashboard:** Transparent per-chapter `X/400` completion bars, expandable NCERT section checklists, per-chapter accuracy, and documented NCERT rationalisation / NMC NEET migration notes (`docs/AUDIT_AND_SYLLABUS.md`).
- **Private on-device IndexedDB storage + JSON backup:** Stores answered progress, study streak, bookmarks, personal questions (full CRUD, kept strictly excluded from curriculum chapter counts), and study notes (full CRUD) in IndexedDB (`src/lib/storage.js`), with one-time migration from legacy `localStorage['memoneet-v1']` and JSON export/import (`merge` or `replace`).
- **Scope change and existing data:** Class 12 curriculum packs are retained in the repository but excluded from the active syllabus, app bundle, practice, and counts. Existing Class 12 answers, bookmarks, personal questions and notes remain in IndexedDB and JSON backups; archived personal questions and their progress are hidden from Class 11 practice rather than deleted. Archived notes retain their chapter association.
- **True offline support:** Lazy-loaded per-chapter chunks bundled locally inside `dist/` and precached by a SHA-256 content-versioned service worker (`scripts/build-sw.mjs`), plus self-contained offline assets inside the Capacitor Android APK.

## Scripts & Quality Gates

```bash
npm ci                     # Install locked dependencies
npm run validate:authored  # Validate quality, schema, metadata & deduplication of all authored packs (exits 0)
npm run validate:bank      # Strict completion gate: exits 1 until ALL 19 Class 11 chapters reach 400/400 and pass the automated checks
node scripts/sync-manifest.mjs # Regenerate src/data/bankManifest.js from automatically checked chapter packs
npm run dev                # Start local Vite dev server (0.0.0.0)
npm run build              # Build production bundle + SHA-256 versioned offline service worker (dist/sw.js)
npx cap sync android       # Copy offline dist/ bundle into Capacitor Android project
npm test                   # Run automated Vitest suite (bank integrity, shuffling, IndexedDB, CRUD, SW, Android)
```

## Building & Installing the Android APK

### Via GitHub Actions (recommended)
Every push to `main` or `arena/d2ec1aaf-question` (or manual `workflow_dispatch`) runs `.github/workflows/android-apk.yml`, which executes `npm ci`, `npm run validate:authored`, `npm run build`, `npx cap sync android`, `npm test`, and `./gradlew assembleDebug`, then uploads the APK artifact (`memoneet-in-progress-debug-apk` while any chapter fails a count, similarity, or other completion gate; `memoneet-complete-debug-apk` once `npm run validate:bank` passes across all 19 Class 11 chapters).

### Local Android build (with JDK 21 + Android SDK 36)
```bash
npm ci
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```
The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

### Installing on an Android phone (Android 7.0 / API 24+)
1. Open the completed **Android APK** GitHub Actions workflow run (signed in to GitHub) and download the artifact ZIP (`memoneet-in-progress-debug-apk`).
2. Extract `memoneet-in-progress-debug.apk` on your phone (or transfer it via USB/Files).
3. Tap the `.apk` file in your Android **Files** app. If prompted, allow **Install unknown apps** for Files/Browser, then tap **Install**.
4. Open **MemoNeet**—all bundled chapters, explanations, notes, bookmarks, personal questions, and JSON backup/restore work completely offline (including airplane mode) with no login.

## Content, Copyright & Study Boundaries

- The bundled items are intended as original NCERT-aligned and NEET-pattern educational practice; automated checks cannot establish originality, accuracy, distractor plausibility, or distinctness; later items have not been human-reviewed.
- MemoNeet is an independent study tool and is **not affiliated with or endorsed by NCERT, NMC, or NTA**.
- No item is claimed to be a verified official past-year NEET question (`isVerifiedOfficialPYQ: false`).
- MemoNeet supports structured biology revision and self-testing; it makes **no guarantee of any NEET score, qualification, rank, or medical admission**. Always study alongside the official NCERT Class 11 Biology textbook.
