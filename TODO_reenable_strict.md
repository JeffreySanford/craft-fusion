Re-enable TypeScript / Angular strictness (apps/craft-web)

Context:
- During recent admin-area and template fixes, TypeScript and Angular template strictness were temporarily relaxed in the `apps/craft-web` tsconfig files to speed iteration and reduce blocking diagnostics.

Affected files (temporary changes):
- apps/craft-web/tsconfig.json
- apps/craft-web/tsconfig.app.json

Goal:
- Restore `strict` type-checking and Angular template strictness, and then resolve the resulting type/template errors so the project runs with full type-safety.

Recommended steps:
1. Revert the tsconfig changes (set `strict: true` and restore `noUnusedLocals`, `noUnusedParameters`, and any Angular template strict flags to their previous values).

2. Run the build and collect diagnostics:

   pnpm dlx nx build craft-web --verbose

3. Triage errors by category and create focused PRs:
   - HttpClient / headers typing (ApiService) — fix overload/signatures
   - Logger indexing / Record typing (LoggerService) — add explicit index signatures or guards
   - `unknown` → narrow or type assertions where appropriate
   - Template bindings: add `!` non-null assertions where truly safe or adjust component types

4. Prefer small PRs that enable strictness for a limited set of files (e.g., fix ApiService in one PR), run build + tests, then expand.

5. After all errors are fixed and CI passes, remove any remaining temporary workarounds.

Owner: frontend lead + PR authors
Priority: High — do not merge to protected branches while strictness is disabled.

Notes:
- If you need temporary bypass for a single file, consider using `// @ts-ignore` with a follow-up TODO and link to this file so it gets tracked.
- Keep reviewers aware: include the diagnostics snapshot in PR descriptions to speed review.
