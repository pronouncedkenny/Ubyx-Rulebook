// ─────────────────────────────────────────────────────────────────────────────
// scripts/build-rulebook.js
// Builds ONE file  dist/rulebook.md  and flattens bullet‑inside‑numbered lists
// so Notion’s API accepts it.  No splitting needed.
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

// build the combined markdown
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

// front‑matter header + timestamp
const iso = new Date().toISOString().slice(0, 19) + 'Z';
const header = `---
title: Ubyx Rulebook – Unofficial Living Build
notion_page: https://www.notion.so/2360fffa3b398045958ad82bd626c4a8
---

An unofficial, perhaps more easily digestible, compilation of the Ubyx Rulebook, synced with each new commit (hopefully).

_Last synced: ${iso}_`;

const out = flattenMixedLists(`${header}\n${chunks.join('\n\n')}`);

// write the file
await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/rulebook.md', out);
console.log('✅  dist/rulebook.md ready');
