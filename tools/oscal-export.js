// tools/oscal-export.js
// Exports all HTML reports in oscal-analysis/ to PDF using Puppeteer
// Usage: node tools/oscal-export.js

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const OSCAL_DIR = path.resolve(__dirname, '../oscal-analysis');

async function exportHtmlToPdf(htmlPath, pdfPath) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  await browser.close();
}

async function main() {
  const files = fs.readdirSync(OSCAL_DIR);
  const htmlFiles = files.filter(f => f.endsWith('.html'));
  if (htmlFiles.length === 0) {
    console.log('No HTML reports found in', OSCAL_DIR);
    return;
  }
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(OSCAL_DIR, htmlFile);
    const pdfPath = htmlPath.replace(/\.html$/, '.pdf');
    try {
      console.log(`Exporting ${htmlFile} to PDF...`);
      await exportHtmlToPdf(htmlPath, pdfPath);
      console.log(`✓ Exported: ${pdfPath}`);
    } catch (err) {
      console.error(`Failed to export ${htmlFile}:`, err.message);
    }
  }
  // Markdown export placeholder (not implemented)
  // You can use a library like 'turndown' for HTML to Markdown if needed
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
