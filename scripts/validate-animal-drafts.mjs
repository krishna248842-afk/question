#!/usr/bin/env node
// Validate unpublished Animal Kingdom questions in an isolated full-bank copy.
import { mkdtempSync, mkdirSync, cpSync, appendFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratch = mkdtempSync(path.join(tmpdir(), 'memoneet-animal-draft-'));
try {
  mkdirSync(path.join(scratch, 'src'), { recursive: true });
  cpSync(path.join(root, 'src/data'), path.join(scratch, 'src/data'), { recursive: true });
  cpSync(path.join(root, 'scripts'), path.join(scratch, 'scripts'), { recursive: true });
  writeFileSync(path.join(scratch, 'package.json'), '{"type":"module"}\n');
  appendFileSync(path.join(scratch, 'src/data/chapters/c11-04.js'), `\nimport { animalClassificationDraft } from './c11-04/pack1-classification-draft.js';\nimport { lowerNonchordateDraft } from './c11-04/pack2-lower-nonchordates-draft.js';\nimport { wormDraft } from './c11-04/pack3-worms-draft.js';\nimport { annelidArthropodDraft } from './c11-04/pack4-annelids-arthropods-draft.js';\nimport { molluscEchinodermDraft } from './c11-04/pack5-molluscs-echinoderms-draft.js';\nquestions.push(...animalClassificationDraft, ...lowerNonchordateDraft, ...wormDraft, ...annelidArthropodDraft, ...molluscEchinodermDraft);\n`);
  console.log('Checking unpublished drafts against the full bank; counts are hypothetical and do not alter the app or manifest.');
  const result = spawnSync(process.execPath, ['scripts/validate-bank.mjs', '--allow-incomplete'], { cwd: scratch, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
