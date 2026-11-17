import { CHAPTER_TARGET } from '../data/syllabus.js';

/**
 * Pure filter for verified curriculum and personal study questions.
 */
export function filterQuestions(
  questions,
  {
    page = 'Question bank',
    stage = 'All stages',
    chapterId = 'all',
    sectionId = 'all',
    questionType = 'all',
    difficulty = 'all',
    search = '',
    bookmarks = [],
    answered = {},
  } = {}
) {
  const bookmarkSet = new Set(bookmarks);
  const qLower = String(search || '').trim().toLowerCase();

  return questions.filter((q) => {
    // View/page scoping — keeps personal items separate from verified-only curriculum view when needed
    if (page === 'My questions' && !q.custom) return false;
    if (page === 'Question bank' && q.custom) return false;
    if (page === 'Bookmarks' && !bookmarkSet.has(q.id)) return false;
    if (page === 'Wrong answers' && answered[q.id]?.correct !== false) return false;
    if (page === 'Completed' && !answered[q.id]) return false;

    // Stage scoping: Class 11, Class 12, and clearly separated NEET-pattern practice
    if (stage !== 'All stages' && q.stage !== stage) return false;

    // Chapter, section, question type, difficulty
    if (chapterId !== 'all' && q.chapterId !== chapterId) return false;
    if (sectionId !== 'all' && q.sectionId !== sectionId) return false;
    if (questionType !== 'all' && q.questionType !== questionType) return false;
    if (difficulty !== 'all' && q.difficulty !== difficulty) return false;

    if (qLower) {
      const hay = `${q.question} ${q.chapter} ${q.topic} ${q.explanation} ${q.questionType}`.toLowerCase();
      if (!hay.includes(qLower)) return false;
    }
    return true;
  });
}

/**
 * Computes automated chapter completion status — NEVER mixes personal items into the bank count
 * and NEVER marks any chapter complete below CHAPTER_TARGET (400).
 */
export function getChapterCompletionMeta(manifestChapter) {
  const validCount = Number(manifestChapter?.validCount) || 0;
  const target = CHAPTER_TARGET;
  const isComplete =
    validCount === target &&
    manifestChapter?.status === 'complete';
  const percent = Math.min(100, Math.round((validCount / target) * 100));
  return {
    validCount,
    target,
    remaining: Math.max(0, target - validCount),
    isComplete,
    percent,
    badgeText: isComplete
      ? `Complete · ${validCount}/${target}`
      : validCount === target ? 'In progress · checks pending' : `In progress · ${validCount}/${target}`,
  };
}

export function computeProgressSummary(answered = {}, validIdSet = null) {
  const entries = Object.values(answered).filter((r) =>
    validIdSet ? validIdSet.has(r.questionId) : true
  );
  const attempted = entries.length;
  const correct = entries.filter((r) => r.correct).length;
  const wrong = attempted - correct;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  return { attempted, correct, wrong, accuracy };
}
