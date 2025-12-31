const { chromium } = require('playwright');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:4200';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log('Visiting', base);
  await page.goto(base, { waitUntil: 'networkidle' });

  const rootVars = await page.evaluate(() => ({
    doc: window.getComputedStyle(document.documentElement).getPropertyValue('--md-sys-color-on-primary'),
    body: window.getComputedStyle(document.body).getPropertyValue('--md-sys-color-on-primary'),
    primary: window.getComputedStyle(document.body).getPropertyValue('--md-sys-color-primary'),
  }));

  console.log('Root/body var --md-sys-color-on-primary:', rootVars);

  // Dump stylesheet rules that mention relevant selectors to help find overrides
  const matchingRules = await page.evaluate(() => {
    const matches = [];
    for (const ss of Array.from(document.styleSheets)) {
      let rules;
      try {
        rules = ss.cssRules;
      } catch (e) {
        continue;
      }
      for (const r of Array.from(rules)) {
        try {
          const txt = r.cssText || '';
          if (txt.includes('.menu-item') || txt.includes('mat-mdc-raised-button') || txt.includes('mat-unthemed')) {
            matches.push({ href: ss.href || 'inline', css: txt.slice(0, 800) });
          }
        } catch (e) {
          // ignore
        }
      }
    }
    return matches.slice(0, 20);
  });

  console.log('Found stylesheet snippets mentioning menu-item/mat-mdc-raised-button (up to 20):');
  matchingRules.forEach((r, i) => console.log(i, r.href, '\n', r.css));

  // Selector targeting raised menu buttons used in the report
  const sel = 'button.mat-mdc-raised-button.menu-item, button.mdc-button--raised.menu-item, button.menu-item.mdc-button--raised';
  const els = await page.$$(sel);
  console.log('Found', els.length, 'candidate raised menu buttons');

  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    const outer = await el.evaluate(n => n.outerHTML);
    const text = await el.evaluate(n => n.innerText.trim());
    const computed = await el.evaluate(n => {
      const cs = window.getComputedStyle(n);
      return {
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        opacity: cs.opacity,
        mixBlendMode: cs.mixBlendMode || null,
        zIndex: cs.zIndex,
        var_on_primary: cs.getPropertyValue('--md-sys-color-on-primary') || null,
        var_primary: cs.getPropertyValue('--md-sys-color-primary') || null,
      };
    });
    const inline = await el.evaluate(n => ({ color: n.style.color || null, background: n.style.background || null }));
    const classes = await el.evaluate(n => Array.from(n.classList));
    // find nearest ancestor that sets background-color or color via inline style
    const ancestorInfo = await el.evaluate(n => {
      const chain = [];
      let cur = n;
      while (cur) {
        const cs = window.getComputedStyle(cur);
        chain.push({ tag: cur.tagName, classes: Array.from(cur.classList), color: cs.color, bg: cs.backgroundColor });
        cur = cur.parentElement;
      }
      return chain.slice(0, 10);
    });

    console.log('---');
    console.log('index:', i, 'text:', text);
    console.log('classes:', classes.join(' '));
    console.log('outerHTML snippet:', outer.slice(0, 300).replace(/\n/g, ''));
    console.log('computed:', computed);
    console.log('inline styles:', inline);
    console.log('ancestor chain (up to 10):');
    ancestorInfo.forEach((a, idx) => console.log(idx, a.tag, a.classes.join(' '), 'color:', a.color, 'bg:', a.bg));
  }

  await browser.close();
  process.exit(0);
})();
