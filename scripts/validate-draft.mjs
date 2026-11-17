#!/usr/bin/env node
// Check unpublished batches together against the published bank in a temporary
// copy. Original single-chapter usage remains supported. To include batches from
// multiple chapters, repeat --chapter <id> <module:export> [...].
import { mkdtempSync, mkdirSync, cpSync, appendFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { SYLLABUS_CHAPTERS } from '../src/data/syllabus.js';

const args = process.argv.slice(2);
const usage = 'Usage: node scripts/validate-draft.mjs <chapter-id> <module:export> [...] OR --chapter <chapter-id> <module:export> [...] [--chapter ...]';
const groups = [];
if (args[0] === '--chapter') {
  let current;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--chapter') {
      current = { chapterId: args[++i], specs: [] };
      groups.push(current);
    } else if (current) {
      current.specs.push(args[i]);
    }
  }
} else if (args.length) {
  groups.push({ chapterId: args[0], specs: args.slice(1) });
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seenChapters = new Set();
for (const group of groups) {
  const { chapterId, specs } = group;
  if (!SYLLABUS_CHAPTERS.some(c => c.chapterId === chapterId) || !specs.length || seenChapters.has(chapterId)) {
    console.error(usage);
    process.exit(2);
  }
  seenChapters.add(chapterId);
  group.imports = [];
  group.variables = [];
  for (const [i, spec] of specs.entries()) {
    const match = /^([a-z0-9-]+):([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(spec);
    if (!match || !existsSync(path.join(root, 'src/data/chapters', chapterId, `${match[1]}.js`))) {
      console.error(`Invalid or missing batch: ${spec}`);
      process.exit(2);
    }
    const variable = `draftBatch${i}`;
    group.imports.push(`import { ${match[2]} as ${variable} } from './${chapterId}/${match[1]}.js';`);
    group.variables.push(`...${variable}`);
  }
}
if (!groups.length) {
  console.error(usage);
  process.exit(2);
}
const scratch = mkdtempSync(path.join(tmpdir(), 'memoneet-drafts-'));
try {
  mkdirSync(path.join(scratch, 'src'), { recursive: true });
  cpSync(path.join(root, 'src/data'), path.join(scratch, 'src/data'), { recursive: true });
  cpSync(path.join(root, 'scripts'), path.join(scratch, 'scripts'), { recursive: true });
  writeFileSync(path.join(scratch, 'package.json'), '{"type":"module"}\n');
  for (const group of groups) {
    appendFileSync(path.join(scratch, `src/data/chapters/${group.chapterId}.js`), `\n${group.imports.join('\n')}\nquestions.push(${group.variables.join(', ')});\n`);
  }
  console.log('Checking unpublished drafts in an isolated full-bank copy; displayed counts are not published counts.');
  const result = spawnSync(process.execPath, ['scripts/validate-bank.mjs', '--allow-incomplete'], { cwd: scratch, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
