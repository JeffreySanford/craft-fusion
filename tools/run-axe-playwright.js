#!/usr/bin/env node
// tools/run-axe-playwright.js
// Minimal runner that invokes Playwright and axe-core. Install @axe-core/playwright first.

(async () => {
  try {
    const { chromium } = require('playwright');
    const { injectAxe, checkA11y } = require('@axe-core/playwright');
    const baseUrl = process.env.BASE_URL || 'http://localhost:4200';
    const themes = process.env.THEMES ? process.env.THEMES.split(',') : ['light','dark','vibrant'];

    const browser = await chromium.launch();
    const page = await browser.newPage();

    for (const theme of themes) {
      const url = `${baseUrl}/`;
      console.log(`Running axe on ${url} with theme=${theme}`);
      await page.goto(url);
      // Apply theme via JS if window.ThemeService exists, otherwise set body attribute
      await page.evaluate((t) => {
        try {
          if (window['ThemeService'] && window['ThemeService'].setTheme) {
            window['ThemeService'].setTheme(t);
          } else {
            document.documentElement.setAttribute('data-theme', t);
          }
        } catch (e) {}
      }, theme);

      await injectAxe(page);
      const results = await page.evaluate(async () => await window.axe.run());
      const outPath = `playwright-report/a11y-${theme}.json`;
      require('fs').mkdirSync('playwright-report', { recursive: true });
      require('fs').writeFileSync(outPath, JSON.stringify(results, null, 2));
      console.log(`Wrote ${outPath} — violations: ${results.violations.length}`);
    }

    await browser.close();
  } catch (err) {
    console.error('Error running axe-playwright. Did you install @axe-core/playwright and playwright?');
    console.error(err && err.message ? err.message : err);
    process.exit(2);
  }
})();
