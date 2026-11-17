import 'fake-indexeddb/auto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  CHAPTER_TARGET,
  SYLLABUS_CHAPTERS,
  SYLLABUS_META,
  SYLLABUS_MIGRATION,
  VALID_DIFFICULTIES,
  VALID_QUESTION_TYPES,
  VALID_STAGES,
} from '../src/data/syllabus.js';
import { BANK_MANIFEST, MANIFEST_BY_CHAPTER_ID } from '../src/data/bankManifest.js';
import {
  CHAPTER_IMPORTERS,
  clearChapterPackCache,
  getCachedChapterCount,
  loadChapterPack,
  loadChapterPacks,
  resolveChapterIdsForSelection,
} from '../src/data/loader.js';
import { presentQuestionOptions } from '../src/lib/shuffle.js';
import {
  DB_NAME,
  LEGACY_LOCALSTORAGE_KEY,
  buildBackupPayload,
  computeStudyStreak,
  deletePersonalQuestion,
  deleteStudyNote,
  importBackupPayload,
  loadStudyState,
  persistAnswer,
  persistBookmarkToggle,
  resetAnsweredProgress,
  savePersonalQuestion,
  savePreferences,
  saveStudyNote,
  toDateKey,
} from '../src/lib/storage.js';
import {
  computeProgressSummary,
  filterQuestions,
  getChapterCompletionMeta,
} from '../src/lib/bankFilter.js';

const ROOT = process.cwd();

async function wipeTestDb() {
  await new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

describe('Syllabus audit & completion honesty gates', () => {
  it('establishes all 32 rationalised NCERT / NMC NEET Biology chapters totaling 12,800 target questions', () => {
    expect(SYLLABUS_CHAPTERS).toHaveLength(32);
    expect(SYLLABUS_CHAPTERS.filter((c) => c.classStage === 'Class 11')).toHaveLength(19);
    expect(SYLLABUS_CHAPTERS.filter((c) => c.classStage === 'Class 12')).toHaveLength(13);
    expect(SYLLABUS_META.totalTargetQuestions).toBe(12800);

    const titles = new Set(SYLLABUS_CHAPTERS.map((c) => c.title));
    expect(titles.has('Locomotion and Movement')).toBe(true);
    expect(titles.has('Chemical Coordination and Integration')).toBe(true);
    expect(titles.has('Digestion and Absorption')).toBe(false);
    expect(titles.has('Environmental Issues')).toBe(false);
    expect(SYLLABUS_MIGRATION.addedRequiredChapters).toHaveLength(2);
    expect(SYLLABUS_MIGRATION.retiredChapters.length).toBeGreaterThanOrEqual(2);

    for (const ch of SYLLABUS_CHAPTERS) {
      const plannedSum = ch.sections.reduce((acc, s) => acc + s.plannedCount, 0);
      expect(plannedSum).toBe(CHAPTER_TARGET);
      expect(CHAPTER_IMPORTERS[ch.chapterId]).toBeTypeOf('function');
    }
  });

  it('requires the target count and human sign-off for a complete chapter', () => {
    expect(BANK_MANIFEST.totalChapters).toBe(32);
    expect(BANK_MANIFEST.totalRequired).toBe(12800);
    expect(BANK_MANIFEST.totalValid).toBe(BANK_MANIFEST.chapters.reduce((n, c) => n + c.validCount, 0));
    for (const ch of BANK_MANIFEST.chapters) {
      const meta = getChapterCompletionMeta(ch);
      if (meta.isComplete) {
        expect(ch.validCount).toBe(CHAPTER_TARGET);
        expect(ch.reviewComplete).toBe(true);
      } else {
        expect(meta.badgeText).toMatch(/^In progress · /);
        if (ch.validCount === CHAPTER_TARGET) expect(meta.badgeText).toContain('review pending');
      }
    }
    expect(BANK_MANIFEST.completeChapters).toBe(BANK_MANIFEST.chapters.filter((ch) => getChapterCompletionMeta(ch).isComplete).length);
    expect(getChapterCompletionMeta({ validCount: 400, status: 'complete', reviewComplete: true }).isComplete).toBe(true);
    expect(getChapterCompletionMeta({ validCount: 399, status: 'complete', reviewComplete: true }).isComplete).toBe(false);
  });

  it('checks the manifest against the validator and enforces the strict completion gate', () => {
    const report = JSON.parse(execFileSync(
      process.execPath,
      ['scripts/validate-bank.mjs', '--allow-incomplete', '--json'],
      { cwd: ROOT, encoding: 'utf8' }
    ));
    expect(report.qualityErrorCount).toBe(0);
    expect(report.totalValid).toBe(BANK_MANIFEST.totalValid);
    expect(report.completeChapters).toBe(BANK_MANIFEST.completeChapters);
    expect(report.bankComplete).toBe(BANK_MANIFEST.bankComplete);
    for (const summary of report.chapters) {
      const ch = MANIFEST_BY_CHAPTER_ID.get(summary.chapterId);
      expect(ch.validCount).toBe(summary.validCount);
      expect(ch.reviewComplete).toBe(summary.reviewComplete);
      expect(ch.status).toBe(summary.status === 'COMPLETE' ? 'complete' : 'in-progress');
    }

    let strictStatus = 0;
    try {
      execFileSync(process.execPath, ['scripts/validate-bank.mjs'], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
    } catch (err) { strictStatus = err.status; }
    expect(strictStatus).toBe(report.bankComplete ? 0 : 1);
  });
});

describe('Unpublished draft isolation', () => {
  it('checks the plant and animal drafts together without changing the published manifest', async () => {
    const manifestPath = path.join(ROOT, 'src/data/bankManifest.js');
    const chapterPath = path.join(ROOT, 'src/data/chapters/c11-03.js');
    const beforeManifest = fs.readFileSync(manifestPath, 'utf8');
    const beforeChapter = fs.readFileSync(chapterPath, 'utf8');
    const output = execFileSync(process.execPath, ['scripts/validate-plant-drafts.mjs', '--with-animal'], {
      cwd: ROOT, encoding: 'utf8',
    });
    expect(output).toContain('Counts below are hypothetical');
    expect(output).toContain('0 detected schema/distribution/duplicate errors');
    const animalBatches = await Promise.all([
      import('../src/data/chapters/c11-04/pack1-classification-draft.js').then(m => m.animalClassificationDraft),
      import('../src/data/chapters/c11-04/pack2-lower-nonchordates-draft.js').then(m => m.lowerNonchordateDraft),
      import('../src/data/chapters/c11-04/pack3-worms-draft.js').then(m => m.wormDraft),
      import('../src/data/chapters/c11-04/pack4-annelids-arthropods-draft.js').then(m => m.annelidArthropodDraft),
      import('../src/data/chapters/c11-04/pack5-molluscs-echinoderms-draft.js').then(m => m.molluscEchinodermDraft),
    ]);
    const draftIds = animalBatches.flat().map(q => q.id);
    expect(new Set(draftIds).size).toBe(draftIds.length);
    const animalCount = MANIFEST_BY_CHAPTER_ID.get('c11-04').validCount + draftIds.length;
    expect(output).toContain(`Animal Kingdom (Class 11): ${animalCount}/400 IN PROGRESS`);
    expect(fs.readFileSync(manifestPath, 'utf8')).toBe(beforeManifest);
    expect(fs.readFileSync(chapterPath, 'utf8')).toBe(beforeChapter);
    expect((await loadChapterPack('c11-03')).length).toBe(MANIFEST_BY_CHAPTER_ID.get('c11-03').validCount);
    expect((await loadChapterPack('c11-04')).length).toBe(MANIFEST_BY_CHAPTER_ID.get('c11-04').validCount);
  });
});

describe('Documented human review', () => {
  it('does not accept an unsigned checklist as human review', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memoneet-review-'));
    try {
      fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
      fs.cpSync(path.join(ROOT, 'src/data'), path.join(dir, 'src/data'), { recursive: true });
      fs.cpSync(path.join(ROOT, 'scripts'), path.join(dir, 'scripts'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}');
      fs.writeFileSync(path.join(dir, 'src/data/reviewRegistry.js'),
        `export const PACK_REVIEWS = { 'c11-01': { checklistComplete: true, reviewedCount: 400, reviewedDate: '2026-11-17' } };`);
      let result;
      try {
        execFileSync(process.execPath, ['scripts/validate-bank.mjs', '--chapter', 'c11-01'], { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
      } catch (err) { result = err; }
      expect(result?.status).toBe(1);
      expect(String(result.stderr)).toContain('human review checklist sign-off is incomplete');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('Cross-chapter duplicate detection', () => {
  it('rejects reworded stems across chapters, not only exact matches', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memoneet-validator-'));
    try {
      fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
      fs.cpSync(path.join(ROOT, 'src/data'), path.join(dir, 'src/data'), { recursive: true });
      fs.cpSync(path.join(ROOT, 'scripts'), path.join(dir, 'scripts'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}');
      const [source] = await loadChapterPack('c11-01');
      const fixture = path.join(dir, 'src/data/chapters/c11-04.js');
      fs.appendFileSync(fixture, `\nquestions[0].question = ${JSON.stringify(source.question + ' independently')};\n`);
      let result;
      try {
        execFileSync(process.execPath, ['scripts/validate-bank.mjs', '--allow-incomplete'], { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
      } catch (err) { result = err; }
      expect(result?.status).toBe(1);
      expect(String(result.stderr)).toContain('Cross-chapter near-duplicate stems');
      expect(String(result.stderr)).toContain('c11-04-q001 and c11-01-q001');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('Answer-index correctness, option shuffling & lazy chapter packs', () => {
  it('validates 0-based answer index, 4 distinct options, and metadata across all authored items', async () => {
    clearChapterPackCache();
    expect(getCachedChapterCount()).toBe(0);

    const c1 = await loadChapterPack('c11-01');
    expect(c1).toHaveLength(400);
    expect(getCachedChapterCount()).toBe(1);

    // Balanced stored answer positions across The Living World
    const answerCounts = [0, 0, 0, 0];
    for (const q of c1) answerCounts[q.answer]++;
    expect(answerCounts).toEqual([100, 100, 100, 100]);

    const allIds = resolveChapterIdsForSelection({ stage: 'All stages', chapterId: 'all' });
    const allQuestions = await loadChapterPacks(allIds);
    expect(allQuestions).toHaveLength(BANK_MANIFEST.totalValid);
    expect(getCachedChapterCount()).toBe(32);

    const idSet = new Set();
    for (const q of allQuestions) {
      expect(idSet.has(q.id)).toBe(false);
      idSet.add(q.id);
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.trim().toLowerCase())).size).toBe(4);
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(3);
      expect(q.options[q.answer].trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThanOrEqual(55);
      expect(VALID_STAGES).toContain(q.stage);
      expect(VALID_QUESTION_TYPES).toContain(q.questionType);
      expect(VALID_DIFFICULTIES).toContain(q.difficulty);
      expect(q.isVerifiedOfficialPYQ).toBe(false);
      expect(q.custom).toBeUndefined();
    }
  });

  it('preserves exact correct option correspondence across option shuffling and reverses user choices', async () => {
    const [sample] = await loadChapterPack('c11-01');
    const canonicalCorrect = sample.options[sample.answer];
    const observedPositions = new Set();

    for (let s = 0; s < 40; s++) {
      const view = presentQuestionOptions(sample, { shuffle: true, seed: `seed-${s}` });
      expect(view.options).toHaveLength(4);
      expect(view.options[view.answer]).toBe(canonicalCorrect);
      expect(view.toOriginalIndex(view.answer)).toBe(sample.answer);
      expect(view.toDisplayIndex(sample.answer)).toBe(view.answer);
      for (let d = 0; d < 4; d++) {
        expect(sample.options[view.toOriginalIndex(d)]).toBe(view.options[d]);
      }
      observedPositions.add(view.answer);
    }
    // Across 40 seeds, shuffling hits all 4 display positions A, B, C, D
    expect(observedPositions.size).toBe(4);

    const fixed = presentQuestionOptions(sample, { shuffle: false });
    expect(fixed.options).toEqual(sample.options);
    expect(fixed.answer).toBe(sample.answer);
  });
});

describe('IndexedDB progress persistence, CRUD, bookmarks, wrong-answer retry & backup', () => {
  const memoryLocalStorage = new Map();

  beforeEach(async () => {
    await wipeTestDb();
    memoryLocalStorage.clear();
    globalThis.localStorage = {
      getItem: (k) => (memoryLocalStorage.has(k) ? memoryLocalStorage.get(k) : null),
      setItem: (k, v) => memoryLocalStorage.set(k, String(v)),
      removeItem: (k) => memoryLocalStorage.delete(k),
      clear: () => memoryLocalStorage.clear(),
    };
  });

  it('persists answers, retry corrections, study streaks, bookmarks, and preferences in IndexedDB', async () => {
    const now = Date.UTC(2026, 10, 17, 10, 0, 0);
    const yesterday = now - 86400000;

    await persistAnswer('c11-01-q001', { correct: true, choice: 0, timestamp: yesterday });
    await persistAnswer('c11-01-q002', { correct: false, choice: 2, timestamp: now });
    expect(await persistBookmarkToggle('c11-01-q002')).toBe(true);
    await savePreferences({ shuffleOptions: false });

    const reloaded = await loadStudyState();
    expect(reloaded.storageBackend).toBe('indexeddb');
    expect(reloaded.preferences.shuffleOptions).toBe(false);
    expect(reloaded.bookmarks).toEqual(['c11-01-q002']);
    expect(computeStudyStreak(reloaded.activityDays, now)).toBe(2);

    const summary1 = computeProgressSummary(reloaded.answered);
    expect(summary1).toEqual({ attempted: 2, correct: 1, wrong: 1, accuracy: 50 });

    // Wrong-answer filter returns only q002, then retrying it correctly clears it from wrong list
    const c1 = await loadChapterPack('c11-01');
    const wrongBefore = filterQuestions(c1, {
      page: 'Wrong answers',
      answered: reloaded.answered,
    });
    expect(wrongBefore.map((q) => q.id)).toEqual(['c11-01-q002']);

    await persistAnswer('c11-01-q002', { correct: true, choice: 1, timestamp: now + 5000 });
    const afterRetry = await loadStudyState();
    expect(afterRetry.answered['c11-01-q002'].attempts).toBe(2);
    expect(afterRetry.answered['c11-01-q002'].correct).toBe(true);
    expect(
      filterQuestions(c1, { page: 'Wrong answers', answered: afterRetry.answered })
    ).toHaveLength(0);

    // Toggle bookmark off
    expect(await persistBookmarkToggle('c11-01-q002')).toBe(false);
    expect((await loadStudyState()).bookmarks).toEqual([]);
  });

  it('supports full personal question & note CRUD while isolating personal items from verified bank counts', async () => {
    const createdQ = await savePersonalQuestion({
      chapterId: 'c11-02',
      stage: 'Class 11',
      topic: 'Diatoms',
      questionType: 'recall',
      difficulty: 'easy',
      question: 'Which wall component renders diatom frustules virtually indestructible in marine sediments?',
      options: ['Embedded silica', 'Peptidoglycan', 'Chitin microfibrils', 'Suberin lamellae'],
      answer: 0,
      explanation: 'Diatom cell walls are impregnated with silica, producing persistent diatomaceous earth.',
    });
    expect(createdQ.custom).toBe(true);
    expect(createdQ.id.startsWith('custom-')).toBe(true);

    const updatedQ = await savePersonalQuestion(
      { ...createdQ, difficulty: 'medium', topic: 'Chrysophytes & diatomite' },
      createdQ.id
    );
    expect(updatedQ.id).toBe(createdQ.id);
    expect(updatedQ.difficulty).toBe('medium');

    // Personal questions never show up in verified Question bank view and never change manifest count
    const c2 = await loadChapterPack('c11-02');
    const pool = [updatedQ, ...c2];
    expect(filterQuestions(pool, { page: 'Question bank' })).toHaveLength(c2.length);
    expect(filterQuestions(pool, { page: 'My questions' })).toHaveLength(1);
    expect(MANIFEST_BY_CHAPTER_ID.get('c11-02').validCount).toBe(c2.length);

    // Notes CRUD
    const note = await saveStudyNote({
      title: 'ICBN vs ICZN',
      text: 'Tautonyms are valid in ICZN (Naja naja) but disallowed under ICBN.',
      chapterId: 'c11-01',
    });
    const editedNote = await saveStudyNote(
      { ...note, text: `${note.text} Remember Mangifera indica.` },
      note.id
    );
    expect((await loadStudyState()).notes[0].text).toContain('Mangifera indica');

    // Export backup, wipe DB, re-import backup, verify everything restored
    const snapshot = buildBackupPayload(await loadStudyState());
    await resetAnsweredProgress();
    await deletePersonalQuestion(updatedQ.id);
    await deleteStudyNote(editedNote.id);
    expect((await loadStudyState()).customQuestions).toHaveLength(0);
    expect((await loadStudyState()).notes).toHaveLength(0);

    const restored = await importBackupPayload(snapshot, { mode: 'replace' });
    expect(restored.customQuestions).toHaveLength(1);
    expect(restored.customQuestions[0].topic).toBe('Chrysophytes & diatomite');
    expect(restored.notes).toHaveLength(1);
    expect(restored.notes[0].title).toBe('ICBN vs ICZN');
  });

  it('migrates legacy localStorage memoneet-v1 user data once into IndexedDB', async () => {
    const ts = Date.UTC(2026, 10, 16, 8, 0, 0);
    localStorage.setItem(
      LEGACY_LOCALSTORAGE_KEY,
      JSON.stringify({
        favorites: ['c11-01-q010'],
        answered: { 'c11-01-q010': { correct: true, choice: 1, date: ts } },
        notes: [{ id: 1, text: 'Legacy revision note on taxonomic hierarchy' }],
        custom: [
          {
            chapter: 'The Living World',
            stage: 'Class 11',
            topic: 'Herbarium',
            question: 'What is omitted from a standard herbarium label?',
            options: ['Collector name', 'DNA chromatogram', 'Plant family', 'Collection locality'],
            answer: 1,
            explanation: 'Standard herbarium labels record locality, date, names, family, and collector, not DNA traces.',
          },
        ],
      })
    );

    const migrated = await loadStudyState();
    expect(migrated.bookmarks).toEqual(['c11-01-q010']);
    expect(migrated.answered['c11-01-q010'].correct).toBe(true);
    expect(migrated.notes).toHaveLength(1);
    expect(migrated.customQuestions).toHaveLength(1);
    expect(migrated.activityDays).toContain(toDateKey(ts));
  });
});

describe('Offline PWA bundle & Capacitor Android packaging verification', () => {
  it('verifies production dist/, versioned service worker precache, and synced Android web assets', () => {
    const distDir = path.join(ROOT, 'dist');
    const swPath = path.join(distDir, 'sw.js');
    expect(fs.existsSync(path.join(distDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(swPath)).toBe(true);

    const swText = fs.readFileSync(swPath, 'utf8');
    expect(swText).toMatch(/CACHE_NAME = "memoneet-offline-[0-9a-f]{12}"/);
    // All generated JS/CSS assets including lazy chapter pack chunks must be precached for offline use
    const assetFiles = fs.readdirSync(path.join(distDir, 'assets'));
    expect(assetFiles.length).toBeGreaterThanOrEqual(32);
    for (const file of assetFiles) {
      expect(swText).toContain(`/assets/${file}`);
    }

    // Verify Capacitor Android configuration & synced web bundle
    const capCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'capacitor.config.json'), 'utf8'));
    expect(capCfg.appId).toBe('com.memoneet.study');
    expect(capCfg.webDir).toBe('dist');

    const gradle = fs.readFileSync(path.join(ROOT, 'android/app/build.gradle'), 'utf8');
    expect(gradle).toContain('applicationId "com.memoneet.study"');
    expect(gradle).toContain('versionName "1.1.0-progress"');

    const androidManifest = fs.readFileSync(
      path.join(ROOT, 'android/app/src/main/AndroidManifest.xml'),
      'utf8'
    );
    expect(androidManifest).toContain('MainActivity');

    const androidAssetsIndex = path.join(
      ROOT,
      'android/app/src/main/assets/public/index.html'
    );
    expect(fs.existsSync(androidAssetsIndex)).toBe(true);
    const androidAssetChunks = fs.readdirSync(
      path.join(ROOT, 'android/app/src/main/assets/public/assets')
    );
    expect(androidAssetChunks.length).toBe(assetFiles.length);
  });
});
