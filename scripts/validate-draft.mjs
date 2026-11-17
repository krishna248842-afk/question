#!/usr/bin/env node
// Check unpublished batch modules against the complete published bank in an
// isolated temporary copy, without changing the real chapter or manifest.
// Usage: node scripts/validate-draft.mjs c11-08 pack1-cell-diversity-draft:cellDiversityDraft [...]
import { mkdtempSync, mkdirSync, cpSync, appendFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { SYLLABUS_CHAPTERS } from '../src/data/syllabus.js';

const [chapterId, ...specs] = process.argv.slice(2);
if (!SYLLABUS_CHAPTERS.some(c => c.chapterId === chapterId) || specs.length === 0) {
  console.error('Usage: node scripts/validate-draft.mjs <chapter-id> <module-name:export-name> [...]');
  process.exit(2);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imports = [];
const variables = [];
for (const [i, spec] of specs.entries()) {
  const match = /^([a-z0-9-]+):([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(spec);
  if (!match || !existsSync(path.join(root, 'src/data/chapters', chapterId, `${match[1]}.js`))) {
    console.error(`Invalid or missing batch: ${spec}`);
    process.exit(2);
  }
  const variable = `draftBatch${i}`;
  imports.push(`import { ${match[2]} as ${variable} } from './${chapterId}/${match[1]}.js';`);
  variables.push(`...${variable}`);
}
const scratch = mkdtempSync(path.join(tmpdir(), 'memoneet-drafts-'));
try {
  mkdirSync(path.join(scratch, 'src'), { recursive: true });
  cpSync(path.join(root, 'src/data'), path.join(scratch, 'src/data'), { recursive: true });
  cpSync(path.join(root, 'scripts'), path.join(scratch, 'scripts'), { recursive: true });
  writeFileSync(path.join(scratch, 'package.json'), '{"type":"module"}\n');
  appendFileSync(path.join(scratch, `src/data/chapters/${chapterId}.js`), `\n${imports.join('\n')}\nquestions.push(${variables.join(', ')});\n`);
  console.log('Checking unpublished drafts in an isolated full-bank copy; displayed counts are not published counts.');
  const result = spawnSync(process.execPath, ['scripts/validate-bank.mjs', '--allow-incomplete'], { cwd: scratch, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
