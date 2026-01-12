# Memorial Timeline — Project Overview

Last updated: 2025-12-30

Purpose

- A focused memorial timeline feature that surfaces three curated items: two historical/personal memorials and one developer/AI artifact. Each item includes provenance, privacy metadata, and an optional link to a longer report or documentation.

What we will ship first

- Three curated tiles visible on the timeline landing page:

 1. Ray Sanford — Historical memorial
 2. Jeffrey Sanford — Personal / Developer milestone
 3. Gotcha Harness — AI Probing & Testing Report (developer artifact)

Why three items

- Keeps the UI focused and respectful while providing a provenance-backed artifact (the Gotcha report) that documents your developer/AI growth.

Where to look in the code

- Frontend timeline service: `apps/craft-web/src/app/projects/family/memorial-timeline/services/timeline.service.ts` (REST + WS logic)
- Client model: `apps/craft-web/src/app/projects/family/memorial-timeline/models/timeline-event.model.ts`
- Page component: `apps/craft-web/src/app/projects/family/memorial-timeline/components/timeline-page/timeline-page.component.ts`
- Presentation components: `components/timeline-list` and `components/timeline-item`
- Backend timeline schema/controller: `apps/craft-nest/src/app/family/timeline/*` (see `schemas/timeline-event.schema.ts`)

Canonical event fields (required for good UX and moderation)

- `id` (string)
- `title` (string)
- `description` (string, 1–3 sentences)
- `date` (ISO date)
- `type` (enum: PERSONAL | FAMILY | HISTORICAL | ANNIVERSARY | PROJECT)
- `createdBy` (user id or display name)
- `visibility` (public | private | moderated)
- optional: `imageUrl`, `actionLink`, `source`, `tags`

Seed payloads (ready-to-edit)

- Ray Sanford (example):

 {
  "title": "In Memoriam: Ray Sanford",
  "description": "Honoring the life of Ray Sanford — devoted family man, storyteller, and lifelong learner.",
  "date": "1945-08-15",
  "type": "HISTORICAL",
  "createdBy": "family-admin",
  "visibility": "moderated",
  "imageUrl": "",
  "actionLink": ""
 }

- Jeffrey Sanford (developer):

 {
  "title": "Jeffrey Sanford — Developer & AI Contributor",
  "description": "Contributed timeline authoring and AI integration work for Craft Fusion.",
  "date": "2025-12-30",
  "type": "PERSONAL",
  "createdBy": "jeffrey",
  "visibility": "public",
  "actionLink": "<https://github.com/JeffreySanford/nx-portfolio>"
 }

- Gotcha Harness — AI Probing & Testing Report:

 {
  "title": "Gotcha Harness — AI Probing & Testing Report",
  "description": "Evidence-based analysis of probing mindset in the codebase, gaps, and a scaffolded gotcha-harness for negative tests.",
  "date": "2025-12-30",
  "type": "PROJECT",
  "createdBy": "jeffrey",
  "visibility": "public",
  "actionLink": "/documentation/projects/memorial-timeline.md",
  "tags": ["testing","security","gotcha"]
 }

UI and behavior recommendations

- Landing: show three primary tiles with title, date, short excerpt, and a "Read more" link.
- Filters: All | Historical | Personal | Project.
- Modal: show full description, media, source/link, and provenance metadata.
- Visibility: if `visibility !== public` show a badge and a way to request access or contact admin.

Moderation & privacy

- Default memorials to `moderated` and require admin approval before public display.
- Audit logs for create/approve actions (server-side) to ensure tamper evidence.
- Sanitize and validate all user-submitted content; images must be uploaded to a controlled store and filenames sanitized.

AI / Developer Growth — what to include in the Gotcha Report

- Executive summary: short statement of purpose and score (probing sophistication). Include the numeric score and confidence level.
- Evidence list: 10–20 repo-grounded items (file path + snippet + why it qualifies + probe type). Link to relevant files in the repo.
- Gaps: explicit missing items (property-based tests, SBOM/CI gates, runtime validation at boundaries, structured abuse-case tests).
- Action plan: 8–10 concrete engineering improvements with exact file locations, sample snippets, and measurable success signals.
- Gotcha harness scaffold: directory listing, three Jest TS tests (validation/auth/malformed), and an Nx test target. Point to `libs/gotcha-harness` for the initial scaffold.

AI Growth Areas (skills and artifacts to document)

- Threat modeling: create a short threat-model document for the timeline feature describing abuse cases and mitigations.
- Property-based testing & fuzzing: add `fast-check` tests for DTOs and parsers.
- CI security gates: add SCA/SBOM generation and secret scanning to CI.
- Observability: instrument audit logs, attach tamper-evident hashes, and export findings to the security tab.
- Responsible AI: document how AI is used (summarization, suggestions), constraints, and human-in-the-loop moderation.

Implementation options (how I can help)

1) Seed only (quick): I add `apps/craft-nest/src/app/family/timeline/seed-events.json` with the three events. You can run the loader script or I can add a small non-prod bootstrap loader.
2) Seed + wire UI (recommended): I create the seed file, add a small loader that runs in development, and update `timeline-page.component.ts` to use `TimelineService.events$` so the UI shows the three tiles.
3) Full flow: seed + wire UI + moderation endpoint + e2e check that seeds appear and visibility behaves correctly.

Next action — confirm how to proceed

- Reply with: `seed-only`, `seed+wire`, or `full-flow` and whether to use the placeholder dates above or provide exact dates/images. If you want privacy, say "use placeholders" and I'll proceed.
