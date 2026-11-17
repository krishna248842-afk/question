import { CHAPTER_BY_ID } from './syllabus.js';

// Deterministic option-order permutation table so stored 0-based `answer` indices
// are evenly distributed across A(0), B(1), C(2), D(3) with no repeated streaks,
// while preserving an exact match between `options[answer]` and the authored correct choice.
const ANSWER_SCHEDULE = [1, 3, 0, 2, 3, 1, 2, 0, 2, 0, 3, 1, 0, 2, 1, 3];

const PERM_ORDERS = [
  [1, 2, 3],
  [2, 3, 1],
  [3, 1, 2],
  [1, 3, 2],
  [2, 1, 3],
  [3, 2, 1],
];

/**
 * Formats an individually authored MCQ tuple into the canonical MemoNeet bank schema.
 * Tuple order:
 * [num, sectionSuffix, objectiveSlug, stageFlag ('C'|'N'), topic, questionType, difficulty,
 *  question, [correctOption, distractor1, distractor2, distractor3], explanation, sourceNote]
 */
export function createChapterPack(chapterId, tuples) {
  const ch = CHAPTER_BY_ID.get(chapterId);
  if (!ch) throw new Error(`Unknown chapterId: ${chapterId}`);

  return tuples.map((row) => {
    const [
      num,
      secSuffix,
      objSlug,
      stageFlag,
      topic,
      questionType,
      difficulty,
      question,
      rawOptions,
      explanation,
      sourceNote,
    ] = row;

    const id = `${chapterId}-q${String(num).padStart(3, '0')}`;
    const targetPos = ANSWER_SCHEDULE[(num - 1) % ANSWER_SCHEDULE.length];
    const dOrder = PERM_ORDERS[(num * 5 + ch.order) % PERM_ORDERS.length];
    const distractors = dOrder.map((idx) => rawOptions[idx]);

    const options = [];
    let dIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (i === targetPos) {
        options.push(rawOptions[0]);
      } else {
        options.push(distractors[dIdx++]);
      }
    }

    return {
      id,
      stage: stageFlag === 'N' ? 'NEET practice' : ch.classStage,
      classStage: ch.classStage,
      chapterId: ch.chapterId,
      chapter: ch.title,
      sectionId: `${chapterId}-${secSuffix}`,
      learningObjectiveId: `${chapterId}-${secSuffix}-${objSlug}`,
      topic,
      questionType,
      difficulty,
      question,
      options,
      answer: targetPos,
      explanation,
      sourceNote,
      isVerifiedOfficialPYQ: false,
    };
  });
}
