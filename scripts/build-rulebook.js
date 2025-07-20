// scripts/build-rulebook.js
// -------------------------
import { promises as fs } from 'fs';
import path from 'path';
import glob from 'glob';

// ----- helper: sort 001‑something before 002‑something, then A‑Z -----
const sortByNumberThenAlpha = (a, b) => {
  const numA = a.match(/^\d+/)?.[0] ?? '';
  const numB = b.match(/^\d+/)?.[0] ?? '';
  if (numA && numB && numA !== numB) return Number(numA) - Number(numB);
  return a.localeCompare(b);
};

// ----- gather every markdown file in repo, but ignore .github etc -----
const mdFiles = glob.sync('**/*.md', {
  ignore: ['node_modules/**', 'dist/**', '.github/**', '**/README.md'],
});

mdFiles.sort(sortByNumberThenAlpha);

const chunks = [];

for (const file of mdFiles) {
  const rel = file.replace(/\\/g, '/');
  const parts = rel.split('/');

  // folder header (e.g. 002 – Definitions)
  if (parts.length === 2) {
    const folder = parts[0];
    if (!chunks.some(c => c.startsWith(`# ${folder}`))) {
      const clean = folder.replace('-', ' – ');
      chunks.push(`\n# ${clean}\n`);
    }
    // sub‑header for the file
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

// ----- prepend title + intro + timestamp -----
const iso = new Date().toISOString().slice(0, 19) + 'Z';
const header = `# Ubyx Rulebook – Unofficial Living Build

An unofficial, perhaps more easily digestible, compilation of the Ubyx Rulebook, synced with each new commit (hopefully).

_Last synced: ${iso}_`;

const out = `${header}\n${chunks.join('\n\n')}`;

await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/rulebook.md', out);
console.log('✅  dist/rulebook.md ready');
