// ─────────────────────────────────────────────────────────────────────────────
// scripts/build-rulebook.js
// Builds dist/rulebook.md and then splits it into ≤90‑block chunks so each
// upload stays under Notion’s 100‑child limit.
// ─────────────────────────────────────────────────────────────────────────────
import { promises as fs } from 'fs';
import { globSync } from 'glob';

// helper: numeric‑then‑alpha sort
const sortByNumberThenAlpha = (a, b) => {
  const numA = a.match(/^\d+/)?.[0] ?? '';
  const numB = b.match(/^\d+/)?.[0] ?? '';
  if (numA && numB && numA !== numB) return Number(numA) - Number(numB);
  return a.localeCompare(b);
};

// flatten bullet‑inside‑numbered lists (Notion validation)
const flattenMixedLists = md =>
  md.replace(
    /^(\s*\d+\.\s[^\n]+)\n(\s{2,})-\s/gm,
    (_, p, ind) => `${p}\n${ind}– `
  );

// gather & order all .md files
const mdFiles = globSync('**/*.md', {
  ignore: ['node_modules/**', 'dist/**', '.github/**', '**/README.md'],
}).sort(sortByNumberThenAlpha);

// build one big markdown string first
const chunks = [];
for (const file of mdFiles) {
  const rel = file.replace(/\\/g, '/');
  const parts = rel.split('/');

  if (parts.length === 2) {
    const folder = parts[0];
    if (!chunks.some(c => c.startsWith(`# ${folder.replace('-', ' – ')}`))) {
      chunks.push(`\n# ${folder.replace('-', ' – ')}\n`);
    }
    const sub = parts[1].replace('.md', '').replace('-', ' – ');
    chunks.push(`\n## ${sub}\n`);
  } else {
    const title = parts[0].replace('.md', '').replace('-', ' – ');
    chunks.push(`\n# ${title}\n`);
  }
  chunks.push((await fs.readFile(file, 'utf8')).trim());
}

const iso = new Date().toISOString().slice(0, 19) + 'Z';
const header = `---
title: Ubyx Rulebook – Unofficial Living Build
notion_page: https://www.notion.so/2360fffa3b398045958ad82bd626c4a8
---

An unofficial, perhaps more easily digestible, compilation of the Ubyx Rulebook, synced with each new commit (hopefully).

_Last synced: ${iso}_`;

const fullText = flattenMixedLists(`${header}\n${chunks.join('\n\n')}`);

// ─── SPLIT into ≤90‑block chunks (roughly: we split on every 80 blank lines) ──
const parts = [];
let part = [];
let blockCount = 0;
for (const line of fullText.split('\n')) {
  if (line.trim() === '') blockCount++;
  if (blockCount > 80) {          // start a new part
    parts.push(part.join('\n'));
    part = [];
    blockCount = 0;
  }
  part.push(line);
}
if (part.length) parts.push(part.join('\n'));

// write each part
await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir('dist/parts', { recursive: true });

await Promise.all(
  parts.map((txt, i) => fs.writeFile(`dist/parts/part-${i + 1}.md`, txt))
);

console.log(`✅  Wrote ${parts.length} part files under dist/parts/`);
