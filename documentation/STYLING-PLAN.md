# Styling Plan — MD3, Accessibility, and CI Integration

## Goals

- Maintain three distinct, high-quality themes: `light`, `dark`, and `vibrant` (expressive MD3 variant).
- Centralize MD3 tokens as CSS custom properties to enable runtime theming and dynamic overrides.
- Ensure every styling change is validated by linting and automated accessibility/contrast checks before merge.
- Keep a fast developer feedback loop: stylelint + Sass checks locally and in CI; contrast checks during PR validation.

## High-level approach

1. Keep `@use` at the top of all Sass module files; move font `@import` into `index.html`.
2. Centralize tokens in `apps/craft-web/src/styles/*` using CSS custom properties (MD3 mapping files already present).
  
### Make `vibrant` token emission authoritative

Emit MD3 CSS custom properties for the `vibrant` theme class exactly like `light` and `dark` so runtime theming consistently resolves `var(--md-sys-*)` tokens. Avoid runtime inline fallbacks and `!important` overrides except during temporary migrations. This reduces visual drift and keeps components purely token-driven.

Implementation note: add a `$md-sys-vibrant` map inside `apps/craft-web/src/styles/_md3-tokens-overrides.scss` and call `@include md3.emit-css-vars($md-sys-vibrant)` inside a `.vibrant-theme` block. See the repo change that authoritatively emits `--md-sys-color-primary` / `--md-sys-color-on-primary`.
3. Run `stylelint` and Sass compile checks on each change; enforce `color-function-notation: modern` but avoid brittle alpha-only enforcement unless config supports it project-wide.
4. Run automated contrast checks for each theme (light/dark/vibrant) against key pages/components.
5. Add an Nx target and npm scripts to make checks easy to run locally and in CI.

## Tools recommended

- stylelint (already configured): lint SCSS and enforce color-function/formatting rules.
- Sass compiler (node-sass/dart-sass) via the build pipeline to catch `@use` ordering errors.
- Playwright + axe-core (`@axe-core/playwright`) or Pa11y for automated accessibility tests that include color-contrast checks. Playwright is already used in the repo; integrating `@axe-core/playwright` is straightforward.
- color-contrast-cli / color-contrast-checker (small Node utilities) for scanning CSS variables and ensuring WCAG contrast ratios for text and UI elements.

## Sample local install (developer machine)

Run from repository root:

```bash
# Install recommended QA deps (devDependencies)
pnpm add -D @axe-core/playwright axe-playwright color-contrast-checker pa11y
```

## Sample npm scripts to add (package.json)

```json
{
  "scripts": {
    "lint:styles": "pnpm exec stylelint \"apps/craft-web/src/**/*.scss\" --config stylelint.config.js",
    "check:sass": "pnpm exec sass --no-source-map apps/craft-web/src/styles:tmp/css --style=compressed",
    "check:contrast": "node tools/check-contrast.js",
    "test:a11y": "node tools/run-axe-playwright.js",
    "check:styles": "pnpm run lint:styles && pnpm run check:sass && pnpm run check:contrast"
  }
}
```

`tools/check-contrast.js` and `tools/run-axe-playwright.js` are small helpers (see suggestions below) that run color-contrast checks and axe tests across chosen routes.

## Sample Nx target (project.json) — `craft-web`

Add under `targets` in `apps/craft-web/project.json`:

```json
"check:styles": {
  "executor": "@nrwl/workspace:run-commands",
  "options": {
    "commands": [
      { "command": "pnpm run lint:styles" },
      { "command": "pnpm run check:sass" },
      { "command": "pnpm run check:contrast" }
    ],
    "parallel": false
  }
}
```

This lets reviewers run `pnpm dlx nx run craft-web:check:styles` and CI to call the same target.

## Contrast testing strategy

- Run automated contrast checks in CI for all three theme variants. Produce a machine-readable report (JSON) and a human-friendly summary with failures.
- Focus contrast checking on:
  - Text at expected font sizes (body, captions, headings, captions/buttons).
  - Key interactive controls (primary/secondary buttons, chips, table row hover states).
  - Foreground-on-background token pairs (primary on surface, on-primary, on-surface-disabled, etc.).
- For vibrant theme, require WCAG AA for body text and at least large-text AA for decorative overlays; be prepared to accept design-driven exceptions recorded in a `CONTRAST-EXCEPTIONS.md` file with justification.

## Implementation notes and sample helpers

- `tools/run-axe-playwright.js`: script that launches Playwright, loads a set of routes with each theme applied (by toggling the theme class or CSS vars), runs `axe.run()` and writes results under `playwright-report/a11y-theme-<theme>.json`.
- `tools/check-contrast.js`: script that loads compiled CSS or the live page via Playwright and uses `color-contrast-checker` to assert contrast ratios for a set of selectors or CSS variable pairs.

## Developer workflow (recommended)

- Locally, run `pnpm run check:styles` before opening a PR.
- CI pipeline: run `pnpm dlx nx run craft-web:check:styles` as part of the `lint` or `test` stage; fail the build on critical contrast failures.
- For design exceptions, open a PR describing the reason and add the selector to `CONTRAST-EXCEPTIONS.md` with a short justification.

## Where the theme selector lives

- The footer theme-cycle control was implemented (TODO shows completed). If you want a visible dropdown selector instead of a cycle control, we can add a more explicit selector UI component in `apps/craft-web/src/app/layout/footer` and wire it to the `ThemeService`.

## Next practical steps I can take now (pick one or ask me to do all)

- Add `documentation/STYLING-PLAN.md` (this file) to the repo.  
- Implement minimal `tools/run-axe-playwright.js` and `tools/check-contrast.js` helpers and add `npm` scripts.  
- Add the Nx `check:styles` target to `apps/craft-web/project.json`.  
- Finish formatting/line-length fixes across remaining SCSS files, then split `record-list.component.scss` into partials and create `apps/craft-web/src/app/projects/table/styles/index` manifest.

---

If you want, I can proceed to implement the helper scripts and Nx target now, or I can first finish the formatting fixes before splitting `record-list.component.scss` (recommended to avoid churn).
