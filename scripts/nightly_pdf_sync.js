// ─────────────────────────────────────────────────────────────────────────────
// nightly_pdf_sync.js
//  ▸ 1) Aggregate every *.md in numeric‑alpha order.
//  ▸ 2) Generate dist/rulebook.pdf with Pandoc.
//  ▸ 3) Push that PDF to branch "pdf-build" (overwrite, so URL is stable).
//  ▸ 4) Call Notion API and insert‑or‑replace a file‑block that embeds the PDF
//       via its raw.githubusercontent URL (with a busting ?ts=TIMESTAMP).
// ─────────────────────────────────────────────────────────────────────────────
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { globSync } from 'glob';
import fetch from 'node-fetch';
import path from 'path';

// ---------- 0. env ----------
const {
  GH_PAT,
  GITHUB_REPOSITORY, // owner/repo
  NOTION_TOKEN,
  NOTION_PAGE_ID,
} = process.env;
if (!GH_PAT || !GITHUB_REPOSITORY || !NOTION_TOKEN || !NOTION_PAGE_ID) {
  console.error('❌ Missing env vars'); process.exit(1);
}

// ---------- 1. build one big Markdown ----------
const sortNumAlpha = (a, b) => {
  const na = a.match(/^\d+/)?.[0] || ''; const nb = b.match(/^\d+/)?.[0] || '';
  return na && nb && na !== nb ? na - nb : a.localeCompare(b);
};
const files = globSync('**/*.md', { ignore: ['node_modules/**', '.github/**', 'dist/**'] })
  .sort(sortNumAlpha);
let md = '# Ubyx Rulebook – Unofficial Living Build\n\n';
for (const f of files) md += (await fs.readFile(f, 'utf8')) + '\n\n';
await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/rulebook.md', md.trim());

// ---------- 2. use Pandoc to make PDF ----------
execSync('pandoc dist/rulebook.md -s -o dist/rulebook.pdf', { stdio: 'inherit' });

// ---------- 3. push PDF to pdf-build branch ----------
execSync('git config user.email "bot@github" && git config user.name "GH Action"', { stdio: 'inherit' });
execSync('git checkout -B pdf-build', { stdio: 'inherit' });
await fs.copyFile('dist/rulebook.pdf', 'rulebook.pdf');
execSync('git add rulebook.pdf');
execSync('git commit -m "nightly PDF build" || true');
execSync(`git push -f https://${GH_PAT}@github.com/${GITHUB_REPOSITORY}.git pdf-build`, { stdio: 'inherit' });

// public raw URL (constant)
const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/pdf-build/rulebook.pdf?ts=${Date.now()}`;

// ---------- 4. upsert file‑block in Notion ----------
const notion = await import('@notionhq/client').then(m => new m.Client({ auth: NOTION_TOKEN }));
const kids = await notion.blocks.children.list({ block_id: NOTION_PAGE_ID, page_size: 20 });
let fileBlock = kids.results.find(b => b.type === 'file' && b.file?.external?.url?.includes('rulebook.pdf'));
if (fileBlock) {
  await notion.blocks.update({
    block_id: fileBlock.id,
    file: { type: 'external', external: { url: rawUrl } },
  });
  console.log('🔄 Notion file block updated.');
} else {
  await notion.blocks.children.append({
    block_id: NOTION_PAGE_ID,
    children: [{
      object: 'block',
      type: 'file',
      file: { type: 'external', external: { url: rawUrl } },
    }],
  });
  console.log('➕ Notion file block added.');
}
