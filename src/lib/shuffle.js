// Deterministic option shuffler preserving exact 0-based answer-index correspondence.

function hashString(input) {
  let h = 2166136261 >>> 0;
  const s = String(input);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function nextUint32(state) {
  // Mulberry32 PRNG step
  let t = (state + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0);
}

/**
 * Presents a question's 4 options in either canonical or deterministically shuffled order,
 * remapping the 0-based `answer` index so `options[answer]` ALWAYS equals the original correct option.
 * Returns { options, answer, indexMap } where `indexMap[displayIdx] === originalIdx`.
 */
export function presentQuestionOptions(question, { shuffle = true, seed = 'session-0' } = {}) {
  if (!question || !Array.isArray(question.options) || question.options.length !== 4) {
    throw new Error('Question must have exactly 4 options');
  }
  if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) {
    throw new Error('Question answer must be a 0-based integer 0..3');
  }

  const indexMap = [0, 1, 2, 3];
  if (shuffle) {
    let state = hashString(`${question.id}::${seed}`);
    for (let i = indexMap.length - 1; i > 0; i--) {
      state = nextUint32(state);
      const j = state % (i + 1);
      [indexMap[i], indexMap[j]] = [indexMap[j], indexMap[i]];
    }
  }

  const options = indexMap.map((origIdx) => question.options[origIdx]);
  const answer = indexMap.indexOf(question.answer);

  return {
    options,
    answer,
    indexMap,
    toOriginalIndex: (displayIndex) => indexMap[displayIndex],
    toDisplayIndex: (originalIndex) => indexMap.indexOf(originalIndex),
  };
}
