#!/usr/bin/env node
// tools/oscal-export.js
// Converts all HTML OSCAL reports in oscal-analysis/ to PDF and Markdown (legendary, vibrant)

const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const TurndownService = require('turndown');
const chalk = require('chalk');

// Patch for Chalk v5+ ESM default import style
// (Chalk v5+ requires: import chalk from 'chalk'; const c = new chalk.Instance(); c.cyan(...))
// For CJS, use Chalk v4 API: chalk.cyan(...)
// This patch ensures compatibility for both
const getChalk = () => {
  if (typeof chalk === 'function') return chalk; // v4
  if (chalk && typeof chalk.default === 'function') return chalk.default; // v5 ESM interop
  return chalk;
};
const c = getChalk();

const OSCAL_DIR = path.join(__dirname, '../oscal-analysis');
const LEGENDARY_BANNER = `\n<div style=\"background: linear-gradient(90deg,#0ff,#0f0,#00f,#f0f,#f00,#ff0,#0ff); color:#fff; font-size:2em; font-weight:bold; text-align:center; padding:1em; border-radius:1em; margin-bottom:1em; animation: legendary 2s infinite alternate;\">🛡️ LEGENDARY OSCAL REPORT 🛡️</div>\n<style>@keyframes legendary {0%{filter:brightness(1);}100%{filter:brightness(1.3);}}</style>`;

async function injectLegendaryBanner(htmlPath) {
  let html = await fs.readFile(htmlPath, 'utf8');
  if (!html.includes('LEGENDARY OSCAL REPORT')) {
    html = html.replace(/<body[^>]*>/i, m => m + LEGENDARY_BANNER);
    await fs.writeFile(htmlPath, html, 'utf8');
  }
  return html;
}

function getReportTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return match ? match[1] : 'OSCAL Report';
}

async function htmlToPdf(htmlPath, pdfPath) {
  await injectLegendaryBanner(htmlPath);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  await browser.close();
}

async function htmlToMarkdown(htmlPath, mdPath) {
  const html = await injectLegendaryBanner(htmlPath);
  const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  try {
    require('turndown-plugin-gfm').gfm && turndownService.use(require('turndown-plugin-gfm').gfm);
  } catch {}
  const title = getReportTitle(html);
  let markdown = `# 🛡️ LEGENDARY OSCAL REPORT\n\n**${title}**\n\n---\n`;
  markdown += turndownService.turndown(html);
  markdown += '\n\n---\n_Note: Charts, tables, and infographics are preserved as much as possible. For full fidelity, view the PDF or HTML version._\n';
  await fs.writeFile(mdPath, markdown, 'utf8');
}

async function main() {
  const files = await fs.readdir(OSCAL_DIR);
  const htmlReports = files.filter(f => f.endsWith('.html') && f.includes('report'));
  if (htmlReports.length === 0) {
    console.log(c.yellow('No HTML OSCAL reports found in oscal-analysis/'));
    return;
  }
  for (const htmlFile of htmlReports) {
    const htmlPath = path.join(OSCAL_DIR, htmlFile);
    const base = htmlFile.replace(/\.html$/, '');
    const pdfPath = path.join(OSCAL_DIR, base + '.pdf');
    const mdPath = path.join(OSCAL_DIR, base + '.md');
    console.log(c.cyan(`Converting ${htmlFile} → PDF/Markdown...`));
    try {
      await htmlToPdf(htmlPath, pdfPath);
      console.log(c.green(`  ✓ PDF: ${path.basename(pdfPath)}`));
    } catch (e) {
      console.log(c.red(`  ✗ PDF failed: ${e}`));
    }
    try {
      await htmlToMarkdown(htmlPath, mdPath);
      console.log(c.green(`  ✓ Markdown: ${path.basename(mdPath)}`));
    } catch (e) {
      console.log(c.red(`  ✗ Markdown failed: ${e}`));
    }
  }
  console.log(c.bold.green('All conversions complete!'));
}

main().catch(e => { console.error(e); process.exit(1); });
