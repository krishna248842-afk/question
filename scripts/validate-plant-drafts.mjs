#!/usr/bin/env node
// Exercise unpublished Plant Kingdom drafts against the full bank without ever
// publishing them, mutating the checked-in chapter index, or syncing a manifest.
import { mkdtempSync, mkdirSync, cpSync, appendFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratch = mkdtempSync(path.join(tmpdir(), 'memoneet-plant-draft-'));
try {
  mkdirSync(path.join(scratch, 'src'), { recursive: true });
  cpSync(path.join(root, 'src/data'), path.join(scratch, 'src/data'), { recursive: true });
  cpSync(path.join(root, 'scripts'), path.join(scratch, 'scripts'), { recursive: true });
  writeFileSync(path.join(scratch, 'package.json'), '{"type":"module"}\n');
  writeFileSync(path.join(scratch, 'src/data/chapters/c11-03.js'), `
import { pack1 } from './c11-03/pack1.js';
import { pack2 } from './c11-03/pack2.js';
import { pack3 } from './c11-03/pack3.js';
import { pack4 } from './c11-03/pack4.js';
import { pteridophyteDraft } from './c11-03/pack5-pteridophyte-draft.js';
import { pteridophyteDraft2 } from './c11-03/pack6-pteridophyte-draft.js';
import { gymnospermDraft } from './c11-03/pack7-gymnosperm-draft.js';
import { angiospermCycleDraft } from './c11-03/pack8-angiosperm-cycle-draft.js';
export const questions = [...pack1, ...pack2, ...pack3, ...pack4, ...pteridophyteDraft, ...pteridophyteDraft2, ...gymnospermDraft, ...angiospermCycleDraft];
`);
  if (process.argv.includes('--with-animal')) {
    appendFileSync(path.join(scratch, 'src/data/chapters/c11-04.js'), `\nimport { animalClassificationDraft } from './c11-04/pack1-classification-draft.js';\nquestions.push(...animalClassificationDraft);\n`);
  }
  console.log('Checking unpublished drafts against the full bank. Counts below are hypothetical and do not alter the app or manifest.');
  const result = spawnSync(process.execPath, ['scripts/validate-bank.mjs', '--allow-incomplete'], {
    cwd: scratch, stdio: 'inherit',
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
