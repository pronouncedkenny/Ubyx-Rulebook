// ─────────────────────────────────────────────────────────────────────────────
// scripts/build-rulebook.js
// 1. Collects every *.md in numeric‑alpha order
// 2. Turns any colon‑separated metadata block into a Markdown table
// 3. Flattens bullet‑inside‑numbered lists (Notion limitation)
// 4. Writes ONE file  dist/rulebook.md
// ─────────────────────────────────────────────────────────────────────────────
import { promises as fs } from 'fs';
import { globSync } from 'glob';

const sortByNumberThenAlpha = (a, b) => {
  const na = a.match(/^\d+/)?.[0] ?? '';
  const nb = b.match(/^\d+/)?.[0] ?? '';
  if (na && nb && na !== nb) return Number(na) - Number(nb);
  return a.localeCompare(b);
};

// turn colon‑separated block into GFM table
function metaToTable(md) {
  return md.replace(
    /(^|\n)\n?((?:[A-Z][\w ]+: .+\n)+)\n/g,
    (_, pre, block) => {
      const rows = block
        .trim()
        .split('\n')
        .map(l => {
          const [k, v] = l.split(/:\s+/);
          return `| **${k.trim()}** | ${v.trim()} |`;
        })
        .join('\n');
      return `${pre}\n|   |   |\n| --- | --- |\n${rows}\n\n`;
    }
  );
}

// flatten bullet‑inside‑numbered lists
const flattenMixedLists = md =>
  md.replace(
    /^(\s*\d+\.\s[^\n]+)\n(\s{2,})-\s/gm,
    (_, p, ind) => `${p}\n${ind}– `
  );

// gather files
const files = globSync('**/*.md', {
  ignore: ['node_modules/**', 'dist/**', '.github/**', '**/README.md'],
}).sort(sortByNumberThenAlpha);

// assemble
const parts = [];
for (const file of files) {
  const rel = file.replace(/\\/g, '/');
  const segs = rel.split('/');

  if (segs.length === 2) {
    const folder = segs[0].replace('-', ' – ');
    const fname = segs[1].replace('.md', '').replace('-', ' – ');
    if (!parts.some(p => p.startsWith(`# ${folder}`))) parts.push(`\n# ${folder}\n`);
    parts.push(`\n## ${fname}\n`);
  } else {
    const title = segs[0].replace('.md', '').replace('-', ' – ');
    parts.push(`\n# ${title}\n`);
  }
  parts.push(await fs.readFile(file, 'utf8'));
}

const iso = new Date().toISOString().slice(0, 19) + 'Z';
let md = `# Ubyx Rulebook – Unofficial Living Build

An unofficial, perhaps more easily digestible, compilation of the Ubyx Rulebook, synced with each new commit (hopefully).

_Last synced: ${iso}_

${parts.join('\n\n')}`;

// post‑process
md = flattenMixedLists(metaToTable(md));

// write
await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/rulebook.md', md);
console.log('✅  dist/rulebook.md ready');
