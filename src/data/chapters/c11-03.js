// Plant Kingdom: the project owner approved the current reviewed batches.
// The starter records stay unchanged so saved answer indices remain valid.
import { starterQuestions } from './c11-03/starter.js';
import { pack1 } from './c11-03/pack1.js';
import { pack2 } from './c11-03/pack2.js';
import { pack3 } from './c11-03/pack3.js';
import { pack4 } from './c11-03/pack4.js';
import { pteridophyteDraft } from './c11-03/pack5-pteridophyte-draft.js';
import { pteridophyteDraft2 } from './c11-03/pack6-pteridophyte-draft.js';
import { gymnospermDraft } from './c11-03/pack7-gymnosperm-draft.js';
import { angiospermCycleDraft } from './c11-03/pack8-angiosperm-cycle-draft.js';
import { comparativeBotanyDraft } from './c11-03/pack9-comparative-botany-draft.js';

const starterIds = new Set(starterQuestions.map((q) => q.id));
export const questions = [
  ...starterQuestions,
  ...pack1.filter((q) => !starterIds.has(q.id)),
  ...pack2, ...pack3, ...pack4,
  ...pteridophyteDraft, ...pteridophyteDraft2,
  ...gymnospermDraft, ...angiospermCycleDraft, ...comparativeBotanyDraft,
];
