#!/usr/bin/env node
// tools/check-contrast.js
// Lightweight contrast checker stub. It expects a running dev server or compiled css.
// For full operation install: @axe-core/playwright, color-contrast-checker, playwright

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const contrastSelectors = require('./contrast-selectors.json');

const baseUrl = process.env.BASE_URL || process.env.nx_baseUrl || 'http://localhost:4200';

async function run() {
	console.log('check-contrast: baseUrl=', baseUrl);
	const browser = await chromium.launch();
	const page = await browser.newPage();

	const results = [];
	for (const pageDef of contrastSelectors.pages) {
		const url = baseUrl.replace(/\/$/, '') + pageDef.path;
		console.log(`Visiting ${url}`);
				try {
					await page.goto(url, { waitUntil: 'domcontentloaded' });
				} catch (e) {
			console.warn('Could not load', url, e.message);
			results.push({ page: pageDef.path, error: 'navigation-failed' });
			continue;
		}

		for (const check of contrastSelectors.checks) {
			const nodes = await page.$$(check.selector);
			if (!nodes.length) {
				results.push({ page: pageDef.path, selector: check.selector, result: 'missing' });
				continue;
			}
			for (const node of nodes.slice(0, 5)) {
				const color = await page.evaluate((n) => getComputedStyle(n).color, node);
				const bg = await page.evaluate((n) => {
					let el = n;
					while (el && getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)') el = el.parentElement;
					return el ? getComputedStyle(el).backgroundColor : 'rgb(255,255,255)';
				}, node);
				// Parse rgb(a) strings into numeric channels
				const parse = (str) => {
					const m = str.match(/rgba?\(([^)]+)\)/);
					if (!m) return null;
					const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
					return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] == null ? 1 : parts[3] };
				};
				const fc = parse(color);
				const bc = parse(bg);
				if (!fc || !bc) {
					results.push({ page: pageDef.path, selector: check.selector, result: 'parse-failed', color, bg });
					continue;
				}
				// simple luminance contrast (WCAG) calc
				const lum = (c) => {
					const srgb = [c.r / 255, c.g / 255, c.b / 255].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
					return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
				};
				const L1 = lum(fc);
				const L2 = lum(bc);
				const contrast = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
				const pass = contrast >= check.threshold;
				const snippet = await page.evaluate((n) => {
					return { text: n.innerText ? n.innerText.trim().slice(0,60) : '', html: n.outerHTML ? n.outerHTML.slice(0,200) : '' };
				}, node);
				results.push({ page: pageDef.path, selector: check.selector, contrast: Number(contrast.toFixed(2)), threshold: check.threshold, pass, color, bg, snippet });
			}
		}
	}

	await browser.close();
	const out = path.join('playwright-report', 'contrast-report.json');
	fs.mkdirSync('playwright-report', { recursive: true });
	fs.writeFileSync(out, JSON.stringify(results, null, 2));
	console.log('Wrote', out);
	const failures = results.filter((r) => r.pass === false);
	if (failures.length) {
		console.error('Contrast checks failed:', failures.length);
		process.exit(2);
	}
	console.log('Contrast checks passed');
	process.exit(0);
}

run().catch((e) => {
	console.error('Error:', e && e.message ? e.message : e);
	process.exit(2);
});
