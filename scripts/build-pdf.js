// scripts/build-pdf.js
// A simple script to generate a timestamped PDF from the 'rules' directory.

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

/**
 * Main function to build the rulebook PDF.
 */
async function buildPdf() {
  try {
    // 1. Build the master markdown file from the 'rules' directory
    console.log('🔄  Building master Markdown file...');
    const rulesDir = path.join(process.cwd(), 'rules');
    const distDir = path.join(process.cwd(), 'dist');
    await fs.mkdir(distDir, { recursive: true });

    const entries = (await fs.readdir(rulesDir, { withFileTypes: true }))
      .filter(e => /^\d+/.test(e.name) && (e.isDirectory() || e.name.endsWith('.md')))
      .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));

    const ts = new Date().toISOString();
    const dateForDisplay = ts.slice(0, 10) + ' ' + ts.slice(11, 16);
    const timeForFilename = ts.replace(/[:T]/g, '-').slice(0, 16);

    // 1a. Create YAML metadata for Pandoc
    const metadata = `
---
title: 'Ubyx Rulebook - Unofficial Nightly Build (${dateForDisplay} UTC)'
subtitle: 'You can contribute to the Rulebook at https://github.com/UbyxRules/Ubyx-Rulebook'
geometry: 'margin=1in'
toc: true
toc-depth: 2
---

    `.trim();

    const mainSections = [];

    // Helper to format rule overviews and clean content
    const formatContent = (content) => {
      let processedContent = content;

      // 1. Find and replace the YAML front matter with a bulleted list
      const frontMatterRegex = /^---\n([\s\S]+?)\n---/;
      const match = processedContent.match(frontMatterRegex);

      if (match) {
        const frontMatterBlock = match[0];
        const frontMatterContent = match[1];
        const lines = frontMatterContent.split('\n').filter(line => line.trim() !== '');
        const bulletPoints = lines.map(line => {
          const parts = line.split(':');
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          return `- **${key}**: ${value}`;
        });
        const bulletList = bulletPoints.join('\n');
        processedContent = processedContent.replace(frontMatterBlock, bulletList);
      }

      // 2. CRITICAL: After processing, remove any horizontal rule ONLY from the start or end of the content.
      // This prevents double/triple dividers when joining sections, without removing intentional dividers mid-file.
      return processedContent.trim().replace(/^---\s*(\n|$)|(\n|^)\s*---$/g, '').trim();
    };

    for (const entry of entries) {
      const title = entry.name.replace(/\.md$/i, '').replace(/(\d+)[-_]/, '$1 - ');
      let sectionBody = '';

      if (entry.isFile()) {
        const content = await fs.readFile(path.join(rulesDir, entry.name), 'utf8');
        sectionBody = formatContent(content);
      } else if (entry.isDirectory()) {
        const subSectionParts = [];
        const subFiles = (await fs.readdir(path.join(rulesDir, entry.name)))
          .filter(f => f.endsWith('.md'))
          .sort((a, b) => a.localeCompare(b));

        for (const file of subFiles) {
          const subTitle = file.replace(/\.md$/i, '').replace(/[_-]/g, ' ');
          const content = await fs.readFile(path.join(rulesDir, entry.name, file), 'utf8');
          subSectionParts.push(`## ${subTitle}\n\n${formatContent(content)}`);
        }
        sectionBody = subSectionParts.join('\n\n---\n\n');
      }
      mainSections.push(`# ${title}\n\n${sectionBody}`);
    }

    // Join H1 sections with a DOUBLE divider, and add one after the TOC
    const mdContent = `${metadata}\n\n---\n\n---\n\n${mainSections.join('\n\n---\n\n---\n\n')}`;
    await fs.writeFile(path.join(distDir, 'rulebook.md'), mdContent);
    console.log('✅  Markdown built.');

    // 2. Generate a timestamped PDF using Pandoc
    console.log('🔄  Generating PDF with Pandoc...');
    const pdfFilename = `Ubyx Rulebook Unofficial Nightly Build ${timeForFilename} UTC.pdf`;
    const pdfPath = path.join(distDir, pdfFilename);

    execSync(`pandoc ${path.join(distDir, 'rulebook.md')} -s --toc -o "${pdfPath}"`, { stdio: 'inherit' });
    console.log(`✅  PDF generated at: ${pdfPath}`);

  } catch (error) {
    console.error('❌ An error occurred during the PDF build:', error);
    process.exit(1);
  }
}

buildPdf();
