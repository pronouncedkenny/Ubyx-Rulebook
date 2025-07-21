// ─────────────────────────────────────────────────────────────────────────────
// nightly_pdf_sync.js
//
//  • Concatenates every *.md in the repo in numeric / alpha order
//  • Builds a PDF with Pandoc
//  • Saves that PDF to the branch  "pdf-build"  under a date‑stamped filename
//  • Appends a new file‑block to the chosen Notion page so every nightly
//    build is archived and time‑stamped for readers
// ─────────────────────────────────────────────────────────────────────────────
import { execSync }      from 'child_process';
import { promises as fs} from 'fs';
import { globSync }      from 'glob';
import { Client }        from '@notionhq/client';

// ── environment --------------------------------------------------------------
const { GH_PAT, GITHUB_REPOSITORY, NOTION_TOKEN, NOTION_PAGE_ID } = process.env;
if (!GH_PAT || !GITHUB_REPOSITORY || !NOTION_TOKEN || !NOTION_PAGE_ID) {
  console.error('❌  Required env vars: GH_PAT, GITHUB_REPOSITORY, NOTION_TOKEN, NOTION_PAGE_ID');
  process.exit(1);
}

// ── 1. build one big Markdown file -----------------------------------------
const sortNumAlpha = (a, b) => {
  const na = a.match(/^\d+/)?.[0] || '';
  const nb = b.match(/^\d+/)?.[0] || '';
  if (na && nb && na !== nb) return Number(na) - Number(nb);
  return a.localeCompare(b);
};

const files = globSync('**/*.md', {
  ignore: ['node_modules/**', '.github/**', 'dist/**'],
}).sort(sortNumAlpha);

let markdown = '';
for (const f of files) markdown += await fs.readFile(f, 'utf8') + '\n\n';

await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/rulebook.md', markdown.trim());

// ── 2. build PDF with Pandoc -------------------------------------------------
execSync('pandoc dist/rulebook.md -s -o dist/rulebook.pdf', { stdio: 'inherit' });
console.log('✅  PDF built');

// ── 3. push the PDF to branch  "pdf-build"  under a dated filename ----------
const stamp      = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16); // 2025-07-22-02-00
const pdfName    = `rulebook-${stamp}.pdf`;
const localCopy  = `./${pdfName}`;
await fs.copyFile('dist/rulebook.pdf', localCopy);

execSync('git config user.email "bot@github"');
execSync('git config user.name  "GitHub Action"');
execSync('git checkout -B pdf-build');            // create / reset local branch
execSync(`git add ${pdfName}`);
execSync(`git commit -m "nightly PDF ${stamp}"`);
execSync(`git push -f https://${GH_PAT}@github.com/${GITHUB_REPOSITORY}.git pdf-build`,
         { stdio: 'inherit' });

const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/pdf-build/${pdfName}`;

// ── 4. append a file-block in Notion (archive grows nightly) ----------------
const notion = new Client({ auth: NOTION_TOKEN });

await notion.blocks.children.append({
  block_id: NOTION_PAGE_ID,
  children: [{
    object: 'block',
    type  : 'file',
    file  : {
      type: 'external',
      external: { url: rawUrl }
    },
    caption: [{
      type  : 'text',
      text  : { content: `Nightly build ${stamp} UTC` }
    }]
  }]
});

console.log('📌  Notion page updated with new PDF block');
