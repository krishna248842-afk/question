// Animal Kingdom: the project owner approved the current reviewed batches.
import { starterQuestions } from './c11-04/starter.js';
import { animalClassificationDraft } from './c11-04/pack1-classification-draft.js';
import { lowerNonchordateDraft } from './c11-04/pack2-lower-nonchordates-draft.js';
import { wormDraft } from './c11-04/pack3-worms-draft.js';
import { annelidArthropodDraft } from './c11-04/pack4-annelids-arthropods-draft.js';
import { molluscEchinodermDraft } from './c11-04/pack5-molluscs-echinoderms-draft.js';
import { chordateDraft } from './c11-04/pack6-chordates-draft.js';
import { fishesAmphibiaDraft } from './c11-04/pack7-fishes-amphibia-draft.js';
import { amnioteDraft } from './c11-04/pack8-amniotes-draft.js';

export const questions = [
  ...starterQuestions, ...animalClassificationDraft, ...lowerNonchordateDraft,
  ...wormDraft, ...annelidArthropodDraft, ...molluscEchinodermDraft,
  ...chordateDraft, ...fishesAmphibiaDraft, ...amnioteDraft,
];
