#!/usr/bin/env node
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  CHAPTER_TARGET,
  QUALITY_TOLERANCES,
  SYLLABUS_CHAPTERS,
  SYLLABUS_META,
  VALID_CLASS_STAGES,
  VALID_DIFFICULTIES,
  VALID_QUESTION_TYPES,
  VALID_STAGES,
} from '../src/data/syllabus.js';
import * as REVIEW_REGISTRY from '../src/data/reviewRegistry.js';
const { PACK_REVIEWS, OWNER_REVIEW } = REVIEW_REGISTRY;

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CHAPTERS_DIR = path.join(ROOT, 'src', 'data', 'chapters');

const args = process.argv.slice(2);
const allowIncomplete = args.includes('--allow-incomplete');
const chapterFilterIdx = args.indexOf('--chapter');
const chapterFilter = chapterFilterIdx >= 0 ? args[chapterFilterIdx + 1] : null;
const jsonOutput = args.includes('--json');

const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'in', 'to', 'for', 'and', 'or', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'by', 'on', 'at', 'with', 'from', 'as', 'that', 'this', 'these', 'those',
  'which', 'what', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'following',
  'statement', 'statements', 'correct', 'correctly', 'incorrect', 'most', 'best', 'true',
  'false', 'select', 'choose', 'identify', 'about', 'regarding', 'during', 'between', 'into',
  'through', 'than', 'its', 'their', 'it', 'they', 'them', 'one', 'two', 'each', 'both',
  'does', 'do', 'did', 'has', 'have', 'had', 'can', 'may', 'would', 'should', 'could', 'not',
  'only', 'all', 'such', 'because', 'while', 'whereas', 'among', 'within', 'describes',
  'represents', 'refers', 'called', 'known', 'example', 'feature', 'characteristic', 'option',
  'student', 'biologist', 'organism', 'organisms', 'given', 'below', 'pair', 'matched',
]);

const FORBIDDEN_OPTION_PATTERNS = [
  /^all of the above\.?$/i,
  /^none of the above\.?$/i,
  /^all of these\.?$/i,
  /^none of these\.?$/i,
  /^both\s*\(?[a-d]\)?\s*and\s*\(?[a-d]\)?(\s*only)?\.?$/i,
  /^either\s*\(?[a-d]\)?\s*or\s*\(?[a-d]\)?\.?$/i,
  /^\(?[a-d]\)?\s*,\s*\(?[a-d]\)?\s*and\s*\(?[a-d]\)?\.?$/i,
];

const TEMPLATE_WRAPPER_PATTERNS = [
  /^choose the correct answer:\s*/i,
  /^a student revises .+?\. which statement is correct\?\s*/i,
  /^for neet biology, identify the correct match:\s*/i,
  /^which option best completes the ncert-aligned statement\?\s*/i,
  /^concept check\s*[—-].+?:\s*/i,
  /^select the most accurate answer\.\s*/i,
  /^in a single-best-answer question on .+?, the answer is:\s*/i,
  /^recall the key fact from .+?:\s*/i,
];

export function normalizeStem(value) {
  let s = String(value || '').toLocaleLowerCase('en');
  for (const re of TEMPLATE_WRAPPER_PATTERNS) {
    s = s.replace(re, '');
  }
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function contentTokens(text) {
  const norm = normalizeStem(text);
  const tokens = norm.split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(tokens);
}

function jaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  const [small, large] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  for (const item of small) {
    if (large.has(item)) inter++;
  }
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function normalizedOptionKey(options) {
  return options
    .map((o) => normalizeStem(o))
    .sort()
    .join('||');
}

async function main() {
  const qualityErrors = [];
  const countErrors = [];
  const warnings = [];

  // 1. Validate syllabus blueprint integrity
  if (SYLLABUS_CHAPTERS.length !== SYLLABUS_META.totalChapters) {
    qualityErrors.push(
      `Syllabus mismatch: expected ${SYLLABUS_META.totalChapters} chapters, found ${SYLLABUS_CHAPTERS.length}`
    );
  }
  const seenChapterIds = new Set();
  const seenChapterTitles = new Set();
  const seenSectionIds = new Set();

  for (const ch of SYLLABUS_CHAPTERS) {
    if (seenChapterIds.has(ch.chapterId)) qualityErrors.push(`Duplicate chapterId: ${ch.chapterId}`);
    seenChapterIds.add(ch.chapterId);
    if (seenChapterTitles.has(ch.title)) qualityErrors.push(`Duplicate chapter title: ${ch.title}`);
    seenChapterTitles.add(ch.title);
    if (!VALID_CLASS_STAGES.includes(ch.classStage)) {
      qualityErrors.push(`${ch.chapterId}: invalid classStage ${ch.classStage}`);
    }
    if (ch.targetCount !== CHAPTER_TARGET) {
      qualityErrors.push(`${ch.chapterId}: targetCount must be ${CHAPTER_TARGET}, got ${ch.targetCount}`);
    }
    const sectionSum = ch.sections.reduce((acc, s) => acc + s.plannedCount, 0);
    if (sectionSum !== CHAPTER_TARGET) {
      qualityErrors.push(
        `${ch.chapterId} (${ch.title}): section plannedCount sum is ${sectionSum}, expected ${CHAPTER_TARGET}`
      );
    }
    for (const s of ch.sections) {
      if (seenSectionIds.has(s.sectionId)) qualityErrors.push(`Duplicate sectionId: ${s.sectionId}`);
      seenSectionIds.add(s.sectionId);
    }
  }

  // Check for unexpected chapter files on disk
  if (fs.existsSync(CHAPTERS_DIR) && !chapterFilter) {
    const entries = fs.readdirSync(CHAPTERS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.js')) {
        const id = entry.name.replace(/\.js$/, '');
        if (!seenChapterIds.has(id)) {
          qualityErrors.push(`Unexpected chapter pack file not in syllabus inventory: ${entry.name}`);
        }
      }
    }
  }

  // 2. Validate every chapter pack and every question record
  const globalIds = new Map();
  const globalStems = new Map();
  const globalSimilarityItems = [];
  const chapterSummaries = [];
  let totalValid = 0;

  const targetChapters = chapterFilter
    ? SYLLABUS_CHAPTERS.filter((c) => c.chapterId === chapterFilter || c.title === chapterFilter)
    : SYLLABUS_CHAPTERS;

  if (targetChapters.length === 0) {
    console.error(`No syllabus chapter matches filter: ${chapterFilter}`);
    process.exit(1);
  }

  for (const ch of targetChapters) {
    const filePath = path.join(CHAPTERS_DIR, `${ch.chapterId}.js`);
    let items = [];
    if (!fs.existsSync(filePath)) {
      countErrors.push(`${ch.chapterId} (${ch.title}): missing chapter pack file src/data/chapters/${ch.chapterId}.js`);
    } else {
      const mod = await import(pathToFileURL(filePath).href);
      if (!Array.isArray(mod.questions)) {
        qualityErrors.push(`${ch.chapterId}: pack must export const questions = [...]`);
      } else {
        items = mod.questions;
      }
    }

    const validSections = new Set(ch.sections.map((s) => s.sectionId));
    const sectionCounts = Object.fromEntries(ch.sections.map((s) => [s.sectionId, 0]));
    const diffCounts = { easy: 0, medium: 0, hard: 0 };
    const typeCounts = Object.fromEntries(VALID_QUESTION_TYPES.map((t) => [t, 0]));
    const answerCounts = [0, 0, 0, 0];
    const stageCounts = { 'Class 11': 0, 'Class 12': 0, 'NEET practice': 0 };

    const preparedForSimilarity = [];
    let consecutiveAnswer = -1;
    let consecutiveRun = 0;
    let longestAnswerIsCorrectCount = 0;
    let chapterValidCount = 0;

    for (let idx = 0; idx < items.length; idx++) {
      const q = items[idx];
      const label = q?.id || `${ch.chapterId}[${idx}]`;
      let recordOk = true;

      if (!q || typeof q !== 'object') {
        qualityErrors.push(`${label}: record is not an object`);
        continue;
      }

      // Exclude personal/custom/demo records from verified bank
      if (q.custom || q.demo || /^(custom|demo|seed)-/i.test(String(q.id || ''))) {
        qualityErrors.push(`${label}: personal, demo, or legacy template seed record is forbidden in verified bank`);
        recordOk = false;
      }

      // ID check
      if (typeof q.id !== 'string' || !/^[a-z0-9][a-z0-9-]{4,40}$/.test(q.id)) {
        qualityErrors.push(`${label}: invalid id format`);
        recordOk = false;
      } else if (globalIds.has(q.id)) {
        qualityErrors.push(`Duplicate ID "${q.id}" in ${ch.chapterId} and ${globalIds.get(q.id)}`);
        recordOk = false;
      } else {
        globalIds.set(q.id, ch.chapterId);
      }

      // Stage & classStage
      if (!VALID_STAGES.includes(q.stage)) {
        qualityErrors.push(`${label}: invalid stage "${q.stage}"`);
        recordOk = false;
      }
      if (q.classStage !== ch.classStage) {
        qualityErrors.push(`${label}: classStage "${q.classStage}" must match chapter classStage "${ch.classStage}"`);
        recordOk = false;
      }
      if ((q.stage === 'Class 11' || q.stage === 'Class 12') && q.stage !== ch.classStage) {
        qualityErrors.push(`${label}: stage "${q.stage}" conflicts with chapter classStage "${ch.classStage}"`);
        recordOk = false;
      }

      // Chapter / section / objective / topic
      if (q.chapterId !== ch.chapterId) {
        qualityErrors.push(`${label}: chapterId "${q.chapterId}" expected "${ch.chapterId}"`);
        recordOk = false;
      }
      if (q.chapter !== ch.title) {
        qualityErrors.push(`${label}: chapter "${q.chapter}" expected "${ch.title}"`);
        recordOk = false;
      }
      if (!validSections.has(q.sectionId)) {
        qualityErrors.push(`${label}: invalid sectionId "${q.sectionId}" for chapter ${ch.chapterId}`);
        recordOk = false;
      }
      if (typeof q.learningObjectiveId !== 'string' || q.learningObjectiveId.trim().length < 5) {
        qualityErrors.push(`${label}: missing or invalid learningObjectiveId`);
        recordOk = false;
      }
      if (typeof q.topic !== 'string' || q.topic.trim().length < 3 || q.topic.trim().length > 90) {
        qualityErrors.push(`${label}: topic must be 3–90 chars`);
        recordOk = false;
      }

      // questionType & difficulty
      if (!VALID_QUESTION_TYPES.includes(q.questionType)) {
        qualityErrors.push(`${label}: invalid questionType "${q.questionType}"`);
        recordOk = false;
      }
      if (!VALID_DIFFICULTIES.includes(q.difficulty)) {
        qualityErrors.push(`${label}: invalid difficulty "${q.difficulty}"`);
        recordOk = false;
      }

      // Question stem checks
      if (typeof q.question !== 'string' || q.question.trim().length < 22) {
        qualityErrors.push(`${label}: question stem missing or too short (<22 chars)`);
        recordOk = false;
      } else {
        for (const re of TEMPLATE_WRAPPER_PATTERNS) {
          if (re.test(q.question.trim())) {
            qualityErrors.push(`${label}: stem uses a forbidden template preamble`);
            recordOk = false;
            break;
          }
        }
        const normStem = normalizeStem(q.question);
        if (globalStems.has(normStem)) {
          qualityErrors.push(
            `Duplicate stem between ${label} (${ch.title}) and ${globalStems.get(normStem)}`
          );
          recordOk = false;
        } else {
          globalStems.set(normStem, `${label} (${ch.title})`);
        }
      }

      // Options & answer index
      if (
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        q.options.some((opt) => typeof opt !== 'string' || !opt.trim())
      ) {
        qualityErrors.push(`${label}: expected exactly 4 non-empty string options`);
        recordOk = false;
      } else {
        const distinctOpts = new Set(q.options.map((o) => normalizeStem(o)));
        if (distinctOpts.size !== 4) {
          qualityErrors.push(`${label}: options are not 4 distinct choices`);
          recordOk = false;
        }
        for (const opt of q.options) {
          const trimmed = opt.trim();
          if (FORBIDDEN_OPTION_PATTERNS.some((re) => re.test(trimmed))) {
            qualityErrors.push(`${label}: forbidden option wording "${trimmed}"`);
            recordOk = false;
          }
        }
      }

      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
        qualityErrors.push(`${label}: answer must be an integer 0..3`);
        recordOk = false;
      } else {
        answerCounts[q.answer]++;
        if (q.answer === consecutiveAnswer) {
          consecutiveRun++;
          if (consecutiveRun > QUALITY_TOLERANCES.answerIndex.maxConsecutiveSame) {
            qualityErrors.push(
              `${label}: repeated answer position ${q.answer} for ${consecutiveRun} consecutive items`
            );
            recordOk = false;
          }
        } else {
          consecutiveAnswer = q.answer;
          consecutiveRun = 1;
        }

        if (Array.isArray(q.options) && q.options.length === 4) {
          const correctLen = q.options[q.answer].trim().length;
          const otherAvg =
            q.options
              .filter((_, i) => i !== q.answer)
              .reduce((sum, o) => sum + o.trim().length, 0) / 3;
          if (otherAvg > 0 && correctLen > otherAvg * 1.85 && correctLen - otherAvg > 28) {
            longestAnswerIsCorrectCount++;
          }
        }
      }

      // Explanation & sourceNote & PYQ honesty
      if (
        typeof q.explanation !== 'string' ||
        q.explanation.trim().length < QUALITY_TOLERANCES.minExplanationLength
      ) {
        qualityErrors.push(
          `${label}: explanation must be at least ${QUALITY_TOLERANCES.minExplanationLength} characters`
        );
        recordOk = false;
      } else if (
        Array.isArray(q.options) &&
        Number.isInteger(q.answer) &&
        normalizeStem(q.explanation) === normalizeStem(q.options[q.answer])
      ) {
        qualityErrors.push(`${label}: explanation merely repeats the correct option`);
        recordOk = false;
      }

      if (
        typeof q.sourceNote !== 'string' ||
        q.sourceNote.trim().length < QUALITY_TOLERANCES.minSourceNoteLength
      ) {
        qualityErrors.push(`${label}: sourceNote missing or too short`);
        recordOk = false;
      }

      if (typeof q.isVerifiedOfficialPYQ !== 'boolean') {
        qualityErrors.push(`${label}: isVerifiedOfficialPYQ must be boolean`);
        recordOk = false;
      } else if (q.isVerifiedOfficialPYQ === true) {
        if (!Number.isInteger(q.verifiedPyqYear) || typeof q.verifiedPyqSource !== 'string' || !q.verifiedPyqSource.trim()) {
          qualityErrors.push(`${label}: isVerifiedOfficialPYQ=true requires verifiedPyqYear and verifiedPyqSource`);
          recordOk = false;
        }
      }

      // Check prohibited marketing claims
      const combinedText = `${q.question} ${q.explanation} ${q.sourceNote}`;
      if (/99%\s*guarantee|guaranteed\s+(qualification|selection|admission|rank)|endorsed by ncert/i.test(combinedText)) {
        qualityErrors.push(`${label}: contains prohibited guarantee or endorsement claim`);
        recordOk = false;
      }

      if (recordOk) {
        chapterValidCount++;
        sectionCounts[q.sectionId]++;
        diffCounts[q.difficulty]++;
        typeCounts[q.questionType]++;
        stageCounts[q.stage]++;
        preparedForSimilarity.push({
          id: q.id,
          stemTokens: contentTokens(q.question),
          combinedTokens: contentTokens(`${q.question} ${q.options[q.answer]}`),
          optKey: normalizedOptionKey(q.options),
          answerText: normalizeStem(q.options[q.answer]),
          topic: q.topic,
        });
      }
    }

    // 3. Pairwise near-duplicate similarity check within chapter
    let nearDupFlags = 0;
    for (let i = 0; i < preparedForSimilarity.length; i++) {
      const a = preparedForSimilarity[i];
      for (let j = i + 1; j < preparedForSimilarity.length; j++) {
        const b = preparedForSimilarity[j];
        const stemSim = jaccard(a.stemTokens, b.stemTokens);
        const sameOpts = a.optKey === b.optKey;
        const sameAnswer = a.answerText === b.answerText && a.answerText.length > 3;

        if (stemSim >= QUALITY_TOLERANCES.nearDuplicateErrorJaccard) {
          qualityErrors.push(
            `${ch.chapterId}: near-duplicate stems (${(stemSim * 100).toFixed(0)}% overlap) between ${a.id} and ${b.id}`
          );
        } else if (sameOpts && stemSim >= 0.45) {
          qualityErrors.push(
            `${ch.chapterId}: identical option set with similar stem (${(stemSim * 100).toFixed(0)}%) between ${a.id} and ${b.id}`
          );
        } else if (sameAnswer && stemSim >= 0.62) {
          qualityErrors.push(
            `${ch.chapterId}: same correct answer with near-duplicate stem (${(stemSim * 100).toFixed(0)}%) between ${a.id} and ${b.id}`
          );
        } else if (stemSim >= QUALITY_TOLERANCES.nearDuplicateWarnJaccard) {
          nearDupFlags++;
          if (nearDupFlags <= 5) {
            warnings.push(
              `[SIMILARITY FLAG] ${ch.chapterId}: ${a.id} vs ${b.id} stem similarity ${(stemSim * 100).toFixed(0)}%`
            );
          }
        }
      }
    }

    // Compare with earlier chapters too: exact global matching alone cannot catch
    // reworded stems that cross a syllabus boundary. A chapter-filtered run is
    // intentionally scoped; the full-bank gate performs the cross-chapter check.
    for (const a of preparedForSimilarity) {
      for (const b of globalSimilarityItems) {
        const stemSim = jaccard(a.stemTokens, b.stemTokens);
        if (stemSim >= QUALITY_TOLERANCES.nearDuplicateErrorJaccard ||
            (a.optKey === b.optKey && stemSim >= 0.45) ||
            (a.answerText === b.answerText && a.answerText.length > 3 && stemSim >= 0.62)) {
          qualityErrors.push(`Cross-chapter near-duplicate stems (${(stemSim * 100).toFixed(0)}% overlap) between ${a.id} and ${b.id}`);
        } else if (stemSim >= QUALITY_TOLERANCES.nearDuplicateWarnJaccard) {
          nearDupFlags++;
          b.crossChapterFlags++;
          if (nearDupFlags <= 5) warnings.push(`[SIMILARITY FLAG] cross-chapter ${a.id} vs ${b.id} stem similarity ${(stemSim * 100).toFixed(0)}%`);
        }
      }
    }
    globalSimilarityItems.push(...preparedForSimilarity.map((q) => ({ ...q, chapterId: ch.chapterId, crossChapterFlags: 0 })));

    // 4. Distribution tolerance checks (for any chapter with >= 25 items)
    const n = items.length;
    if (n >= 25) {
      for (const [diff, bounds] of Object.entries(QUALITY_TOLERANCES.difficulty)) {
        const share = diffCounts[diff] / n;
        if (share < bounds.min || share > bounds.max) {
          qualityErrors.push(
            `${ch.chapterId}: difficulty "${diff}" share ${(share * 100).toFixed(1)}% outside [${bounds.min * 100}%, ${bounds.max * 100}%]`
          );
        }
      }
      const usedTypes = Object.entries(typeCounts).filter(([, c]) => c > 0);
      if (usedTypes.length < QUALITY_TOLERANCES.questionType.minDistinctTypes) {
        qualityErrors.push(
          `${ch.chapterId}: uses only ${usedTypes.length} questionTypes; need at least ${QUALITY_TOLERANCES.questionType.minDistinctTypes}`
        );
      }
      for (const [t, c] of usedTypes) {
        if (c / n > QUALITY_TOLERANCES.questionType.maxSingleTypeShare) {
          qualityErrors.push(
            `${ch.chapterId}: questionType "${t}" is ${((c / n) * 100).toFixed(1)}% (max ${QUALITY_TOLERANCES.questionType.maxSingleTypeShare * 100}%)`
          );
        }
      }
      if (typeCounts.recall / n > QUALITY_TOLERANCES.questionType.maxRecallShare) {
        qualityErrors.push(
          `${ch.chapterId}: recall share ${((typeCounts.recall / n) * 100).toFixed(1)}% exceeds max ${QUALITY_TOLERANCES.questionType.maxRecallShare * 100}%`
        );
      }
      for (let ai = 0; ai < 4; ai++) {
        const aShare = answerCounts[ai] / n;
        if (
          aShare < QUALITY_TOLERANCES.answerIndex.minPerOption ||
          aShare > QUALITY_TOLERANCES.answerIndex.maxPerOption
        ) {
          qualityErrors.push(
            `${ch.chapterId}: answer index ${ai} (${String.fromCharCode(65 + ai)}) share ${(aShare * 100).toFixed(1)}% outside [${QUALITY_TOLERANCES.answerIndex.minPerOption * 100}%, ${QUALITY_TOLERANCES.answerIndex.maxPerOption * 100}%]`
          );
        }
      }
      const neetShare = stageCounts['NEET practice'] / n;
      if (
        neetShare < QUALITY_TOLERANCES.stageSplit.minNeetPracticeShare ||
        neetShare > QUALITY_TOLERANCES.stageSplit.maxNeetPracticeShare
      ) {
        qualityErrors.push(
          `${ch.chapterId}: NEET practice share ${(neetShare * 100).toFixed(1)}% outside [${QUALITY_TOLERANCES.stageSplit.minNeetPracticeShare * 100}%, ${QUALITY_TOLERANCES.stageSplit.maxNeetPracticeShare * 100}%]`
        );
      }
      if (longestAnswerIsCorrectCount / n > 0.22) {
        qualityErrors.push(
          `${ch.chapterId}: option-length giveaway detected in ${longestAnswerIsCorrectCount}/${n} items (>22%)`
        );
      }
      // Every declared section must have coverage
      for (const sec of ch.sections) {
        const sc = sectionCounts[sec.sectionId] || 0;
        if (sc === 0) {
          qualityErrors.push(`${ch.chapterId}: section ${sec.sectionId} ("${sec.title}") has 0 questions`);
        } else if (n === CHAPTER_TARGET && sc < Math.floor(sec.plannedCount * 0.6)) {
          qualityErrors.push(
            `${ch.chapterId}: section ${sec.sectionId} has only ${sc} items (planned ${sec.plannedCount})`
          );
        }
      }
    }

    // 5. Track actual owner review separately from automated completion.
    const review = PACK_REVIEWS[ch.chapterId];
    const contentSha256 = createHash('sha256').update(JSON.stringify(items)).digest('hex');
    const reviewedSnapshot = OWNER_REVIEW?.chapters?.[ch.chapterId];
    const reviewSnapshotCurrent = Boolean(
      OWNER_REVIEW?.checklistComplete && reviewedSnapshot &&
      reviewedSnapshot.reviewedCount === items.length && reviewedSnapshot.contentSha256 === contentSha256
    );
    const reviewComplete = Boolean(
      review && review.checklistComplete === true && review.reviewedCount === CHAPTER_TARGET &&
      typeof review.reviewerName === 'string' && review.reviewerName.trim().length > 0 &&
      typeof review.reviewedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(review.reviewedDate) &&
      typeof review.contentSha256 === 'string' &&
      review.contentSha256 === contentSha256
    );

    if (chapterValidCount === CHAPTER_TARGET && nearDupFlags > 0) {
      countErrors.push(`${ch.chapterId} (${ch.title}): ${nearDupFlags} similarity flag(s) require resolution before completion`);
    }

    if (chapterValidCount !== CHAPTER_TARGET || items.length !== CHAPTER_TARGET) {
      countErrors.push(
        `${ch.chapterId} (${ch.title}): expected exactly ${CHAPTER_TARGET} valid questions, found ${chapterValidCount}`
      );
    }

    const isComplete =
      chapterValidCount === CHAPTER_TARGET &&
      items.length === CHAPTER_TARGET &&
      nearDupFlags === 0;

    totalValid += chapterValidCount;
    chapterSummaries.push({
      chapterId: ch.chapterId,
      order: ch.order,
      classStage: ch.classStage,
      title: ch.title,
      validCount: chapterValidCount,
      rawCount: items.length,
      target: CHAPTER_TARGET,
      status: isComplete ? 'COMPLETE' : 'IN PROGRESS',
      reviewComplete,
      reviewSnapshotCurrent,
      nearDupFlags,
      diffCounts,
      typeCounts,
      stageCounts,
      answerCounts,
      sectionCounts,
    });
  }

  // Cross-chapter flags are discovered when the later chapter is inspected;
  // apply them to earlier chapters as well, before producing completion status.
  for (const summary of chapterSummaries) {
    const earlierFlags = globalSimilarityItems
      .filter((item) => item.chapterId === summary.chapterId)
      .reduce((sum, item) => sum + item.crossChapterFlags, 0);
    if (earlierFlags) {
      summary.nearDupFlags += earlierFlags;
      summary.status = 'IN PROGRESS';
      if (summary.validCount === CHAPTER_TARGET) {
        countErrors.push(`${summary.chapterId} (${summary.title}): ${earlierFlags} cross-chapter similarity flag(s) require resolution before completion`);
      }
    }
  }

  const totalRequired = targetChapters.length * CHAPTER_TARGET;
  const completeChapters = chapterSummaries.filter((c) => c.status === 'COMPLETE').length;
  const bankComplete =
    !chapterFilter &&
    qualityErrors.length === 0 &&
    countErrors.length === 0 &&
    completeChapters === SYLLABUS_CHAPTERS.length &&
    totalValid === SYLLABUS_META.totalTargetQuestions;

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          bankComplete,
          totalValid,
          totalRequired,
          completeChapters,
          totalChapters: targetChapters.length,
          qualityErrorCount: qualityErrors.length,
          countErrorCount: countErrors.length,
          warningCount: warnings.length,
          chapters: chapterSummaries,
          qualityErrors,
          countErrors,
          warnings,
        },
        null,
        2
      )
    );
  } else {
    console.log(`Syllabus: ${SYLLABUS_META.editionLabel} · ${SYLLABUS_META.examAlignmentLabel}`);
    console.log(
        `Automatically checked records: ${totalValid} / ${totalRequired} questions (${completeChapters}/${targetChapters.length} chapters complete)`
    );
    console.log(`Overall bank complete: ${bankComplete ? 'YES' : 'NO (IN PROGRESS — do not label complete)'}`);
    console.log('\nPer-chapter gate:');
    for (const c of chapterSummaries) {
      const reviewNote = c.reviewComplete ? ' [human-reviewed]' : '';
      const simNote = c.nearDupFlags ? ` [${c.nearDupFlags} similarity review flag(s)]` : '';
      console.log(
        `- [${c.chapterId}] ${c.title} (${c.classStage}): ${c.validCount}/${c.target} ${c.status}${reviewNote}${simNote}`
      );
    }
    if (warnings.length) {
      console.warn(`\nSimilarity / review warnings (${warnings.length}):`);
      console.warn(warnings.slice(0, 30).map((w) => `  ${w}`).join('\n'));
    }
  }

  const fatalErrors = allowIncomplete ? qualityErrors : [...qualityErrors, ...countErrors];
  if (fatalErrors.length > 0) {
    if (!jsonOutput) {
      console.error(
        `\nVALIDATION FAILED (${qualityErrors.length} quality error(s), ${countErrors.length} completion-gate error(s)).`
      );
      console.error(fatalErrors.slice(0, 60).map((e) => `- ${e}`).join('\n'));
      if (fatalErrors.length > 60) {
        console.error(`... plus ${fatalErrors.length - 60} more issue(s).`);
      }
    }
    process.exitCode = 1;
  } else if (allowIncomplete && countErrors.length > 0) {
    if (!jsonOutput) {
      console.log(
        `\nAUTOMATED CHECKS PASSED (0 detected schema/distribution/duplicate errors across ${totalValid} records; accuracy and distinctness are not guaranteed).`
      );
      console.log(
        `COMPLETION GATE STILL OPEN: ${countErrors.length} count or similarity requirement(s) unmet (run "npm run validate:bank" for strict failure gate).`
      );
    }
  } else if (!jsonOutput) {
    console.log(`\nVALIDATION PASSED: all ${targetChapters.length} chapter(s) have ${CHAPTER_TARGET}/${CHAPTER_TARGET} validated questions.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
