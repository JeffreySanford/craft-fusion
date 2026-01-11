#!/usr/bin/env node
// scripts/tools/oscal-export.js
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

// Platform-agnostic path handling
const isWindows = process.platform === 'win32';
const HOME_DIR = process.env.HOME || process.env.USERPROFILE;
const DEFAULT_CACHE_DIR = path.join(HOME_DIR, '.cache', 'puppeteer');

// Use proper path separator based on platform
const OSCAL_DIR = path.join(__dirname, '..', '..', 'oscal-analysis');
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
  let browser = null;
  try {
    await injectLegendaryBanner(htmlPath);
    
    // Configure browser launch options based on platform
    const launchOptions = { 
      headless: 'new', 
      args: ['--no-sandbox'] 
    };
    
    // Launch browser
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
    
    // Configure PDF options
    const pdfOptions = {
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      }
    };
    
    // Generate PDF
    await page.pdf(pdfOptions);
    return true;
  } catch (error) {
    console.error(`  ${c.red('✗')} PDF failed: ${error.message}`);
    return false;
  } finally {
    // Ensure browser is closed even if there's an error
    if (browser) await browser.close();
  }
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

// Main export function
async function exportOscalReports() {
  try {
    // Create oscal-analysis directory if it doesn't exist
    if (!await fs.exists(OSCAL_DIR)) {
      await fs.mkdir(OSCAL_DIR, { recursive: true });
    }
    
    // Get all HTML files in the oscal-analysis directory
    const files = await fs.readdir(OSCAL_DIR);
    const htmlFiles = files.filter(file => file.endsWith('.html'));

    if (htmlFiles.length === 0) {
      console.log(c.yellow('No HTML reports found in ' + OSCAL_DIR));
      return;
    }

    console.log(c.cyan(`Found ${htmlFiles.length} HTML reports to process`));
    
    // Process each HTML file
    for (const htmlFile of htmlFiles) {
      const htmlPath = path.join(OSCAL_DIR, htmlFile);
      const baseName = htmlFile.replace(/\.html$/, '');
      const pdfPath = path.join(OSCAL_DIR, `${baseName}.pdf`);
      const mdPath = path.join(OSCAL_DIR, `${baseName}.md`);
      
      console.log(c.cyan(`Converting ${htmlFile} → PDF/Markdown...`));
      
      // Convert to PDF
      const pdfSuccess = await htmlToPdf(htmlPath, pdfPath);
      if (pdfSuccess) {
        console.log(`  ${c.green('✓')} PDF: ${pdfPath}`);
      }
      
      // Convert to Markdown
      try {
        await htmlToMarkdown(htmlPath, mdPath);
        console.log(`  ${c.green('✓')} Markdown: ${mdPath}`);
      } catch (error) {
        console.error(`  ${c.red('✗')} Markdown failed: ${error.message}`);
      }
    }
    
    console.log(c.green('All conversions complete!'));
  } catch (error) {
    console.error(c.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

// Run the export function
exportOscalReports();
