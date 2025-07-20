// ─────────────────────────────────────────────────────────────────────────────
// scripts/build-rulebook.js
// Builds one clean Markdown file (dist/rulebook.md) from every *.md in the repo
// and flattens any “bullet‑inside‑numbered” lists so Notion’s API accepts it.
// ─────────────────────────────────────────────────────────────────────────────

import { promises as fs } from 'fs';
import { globSync } from 'glob';

// ─── helper: numeric folders first (001 < 010) then A‑Z ──────────────────────
function sortByNumberThenAlpha(a, b) {
  const numA = a.match(/^\d+/)?.[0] ?? '';
  const numB = b.match(/^\d+/)?.[0] ?? '';
  if (numA && numB && numA !== numB) return Number(numA) - Number(numB);
  return a.localeCompare(b);
}

// ─── helper: flatten bullet lists nested inside numbered lists ───────────────
// Notion blocks can’t have a bulleted_list_item as a child of numbered_list_item.
// We replace the inner “- ” with an en‑dash “– ” so it becomes a plain paragraph.
function flattenMixedLists(markdown) {
  return markdown.replace(
    /^(\s*\d+\.\s[^\n]+)\n(\s{2,})-\s/gm,
    (_, parent, indent) => `${parent}\n${indent}– `
  );
}

// ─── gather every markdown file (skip dist/, node_modules/, .github/) ────────
const mdFiles = globSync('**/*.md', {
  ignore: ['node_modules/**', 'dist/**', '.github/**', '**/README.md'],
}).sort(sortByNumberThenAlpha);

// ─── assemble ordered chunks ─────────────────────────────────────────────────
const chunks = [];

for (const file of mdFiles) {
  const rel = file.replace(/\\/g, '/');
  const parts = rel.split('/');

  if (parts.length === 2) {
    // e.g. 002-Definitions/Term-A.md
    const folder = parts[0];
    if (!chunks.some(c => c.startsWith(`# ${folder.replace('-', ' – ')}`))) {
      chunks.push(`\n# ${folder.replace('-', ' – ')}\n`);
    }
    const sub = parts[1].replace('.md', '').replace('-', ' – ');
    chunks.push(`\n## ${sub}\n`);
  } else {
    // root‑level file
    const title = parts[0].replace('.md', '').replace('-', ' – ');
    chunks.push(`\n# ${title}\n`);
  }

  const text = await fs.readFile(file, 'utf8');
  chunks.push(text.trim());
}

// ─── front‑matter header + timestamp ─────────────────────────────────────────
const iso = new Date().toISOString().slice(0, 19) + 'Z';
const header = `---
title: Ubyx Rulebook – Unofficial Living Build
notion_page: https://www.notion.so/2360fffa3b398045958ad82bd626c4a8
---

An unofficial, perhaps more easily digestible, compilation of the Ubyx Rulebook, synced with each new commit (hopefully).

_Last synced: ${iso}_`;

// ─── flatten problematic lists and write the file ────────────────────────────
const out = flattenMixedLists(`${header}\n${chunks.join('\n\n')}`);

await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/rulebook.md', out);
console.log('✅  dist/rulebook.md ready');
