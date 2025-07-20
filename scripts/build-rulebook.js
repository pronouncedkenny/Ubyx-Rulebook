// ─────────────────────────────────────────────────────────────────────────────
// scripts/build-rulebook.js
// 1. Concatenates every Markdown file in the repo in numeric‑then‑alpha order
// 2. Flattens “bullet‑inside‑numbered” lists so Notion accepts them
// 3. Splits the result into ≤ 80‑line “part” files (< 100 Notion blocks each)
//    and writes them to  dist/parts/part‑N.md
// ─────────────────────────────────────────────────────────────────────────────
import { promises as fs } from 'fs';
import { globSync } from 'glob';

// numeric‑then‑alpha sort helper
const sortByNumberThenAlpha = (a, b) => {
  const na = a.match(/^\d+/)?.[0] ?? '';
  const nb = b.match(/^\d+/)?.[0] ?? '';
  if (na && nb && na !== nb) return Number(na) - Number(nb);
  return a.localeCompare(b);
};

// flatten bullet‑inside‑numbered lists (Notion disallows that nesting)
const flattenMixedLists = md =>
  md.replace(
    /^(\s*\d+\.\s[^\n]+)\n(\s{2,})-\s/gm,
    (_, p, ind) => `${p}\n${ind}– `
  );

// gather Markdown files
const files = globSync('**/*.md', {
  ignore: ['node_modules/**', 'dist/**', '.github/**', '**/README.md'],
}).sort(sortByNumberThenAlpha);

// assemble one big Markdown string
const chunks = [];
for (const file of files) {
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

// simple header (no YAML front‑matter so it won’t appear in Notion)
const iso = new Date().toISOString().slice(0, 19) + 'Z';
const header = `# Ubyx Rulebook – Unofficial Living Build

An unofficial, perhaps more easily digestible, compilation of the Ubyx Rulebook, synced with each new commit (hopefully).

_Last synced: ${iso}_`;

const full = flattenMixedLists(`${header}\n${chunks.join('\n\n')}`);

// split into parts ≈ 80 blank lines each (< 100 Notion blocks)
const lines = full.split('\n');
const parts = [];
let buf = [];
let blanks = 0;

for (const line of lines) {
  if (line.trim() === '') blanks++;
  if (blanks > 80) {
    parts.push(buf.join('\n'));
    buf = [];
    blanks = 0;
  }
  buf.push(line);
}
if (buf.length) parts.push(buf.join('\n'));

// write the part files
await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir('dist/parts', { recursive: true });

await Promise.all(
  parts.map((txt, i) => fs.writeFile(`dist/parts/part-${i + 1}.md`, txt))
);

console.log(`✅  Wrote ${parts.length} part file(s) to dist/parts/`);
