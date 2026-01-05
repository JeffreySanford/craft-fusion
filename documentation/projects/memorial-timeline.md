# Memorial Timeline — Project Overview

Last updated: 2025-12-30

## Current implementation (2025-12-30)

- Backend: `apps/craft-nest` exposes a timeline API using Mongoose schemas. In development the app will start an in-memory MongoDB (mongodb-memory-server) when no `MONGODB_URI` is configured so seeded events are available locally.
- Seed file: `apps/craft-nest/src/app/timeline/timeline/seed-events.json` contains the three curated events (Ray Sanford, Jeffrey Sanford, Gotcha Harness). A dev-only idempotent seeder runs at bootstrap and skips already-present events.
- Server-side AI proxy: AI generation is proxied through `apps/craft-nest/src/app/ai` endpoints and reads `OPENAI_API_KEY` from server-side `ConfigService` (see `.env.example`). Client no longer holds the API key.
- UI: `apps/craft-web` uses `TimelineService` (REST + WS) and `memorial-timeline` components were wired to load initial events on startup. Inline styles were moved into component SCSS for linting and consistency.
- Testing: an e2e spec was added at `apps/craft-nest/test/timeline.e2e-spec.ts` that validates request validation (400 on malformed payloads) and a happy-path create (201). `supertest` is used for HTTP assertions and has been added to devDependencies.

### Dev notes and logs

- When navigating to `/family` locally you may see router lifecycle log entries (Guard checks, ResolveStart/End, Activation events) and auth guard logs such as:

  - `Auth guard: User is authorized to access route {url: '/family'}`
  - `logger.service.ts:353 [OperatorSubscriber] Admin guard: User has admin permissions {url: '/family'}`
  - `logger.service.ts:356 [Object] User navigated to /family`

These are produced by runtime debug logging in the Angular app and the server-side guards/gateway code; they help diagnose activation/guard/resolver flows and verify seeded data is presented after the router finishes navigation.

## Vision and narrative (verbose plan)

The Memorial Timeline is a living, respectful archive for the family. It should feel like an intentional, curated space: part historical record, part memory album, part developer story. The experience is not a social feed. It is a deliberate timeline with context, provenance, and sensitivity. Each entry should be concise enough to scan, yet deep enough to honor the person or moment when expanded. The content should reinforce continuity across generations while still making space for modern artifacts (projects, AI work, or technical milestones) that document the family's ongoing story.

The tone is calm, dignified, and human. The design should support solemn moments without feeling heavy, and celebratory moments without feeling loud. That balance comes from typography, spacing, and a subtle patriotic motif that feels respectful rather than performative. Every visual decision should communicate "care" - for the people represented, for the accuracy of the story, and for the privacy of those involved.

### Experience goals

- Create a focused place to honor key family members and moments without overwhelming the viewer.
- Make the timeline easy to scan, with strong hierarchy (date, title, type, excerpt).
- Provide a "read more" path that respects context and avoids clickbait behaviors.
- Highlight provenance and visibility so users understand why an item is shown.
- Encourage curation and stewardship instead of open, uncontrolled posting.
- Keep the experience performant and stable as the timeline grows.

### Audience and access

- Family members (default audience) see the full experience based on their role.
- Admin or moderator roles approve and curate entries before they are public.
- Optional guests can view a limited, pre-approved selection (future).
- Every event is labeled with visibility to reduce confusion and build trust.

### Storytelling and interaction

- Start with a small, curated set of entries that anchor the story (the three seed items).
- Use type badges and icons to differentiate historical, personal, family, anniversary, and project events.
- Provide quick scanning in the list view, and deeper context in a detail view.
- Allow optional media (photos, scans, documents) with captions and source links.
- Use gentle animations only for entrance and list updates; respect reduced motion.

### Layout and components (conceptual)

- Header: title, short purpose statement, and a subtle patriotic accent.
- Filter controls: All, Historical, Personal, Family, Project, Anniversary (optional Jeffrey AI filter in the AI view).
- Timeline rail: vertical line with nodes anchoring each event.
- Event card: date, title, type badge, short excerpt, optional image, actions.
- Detail view: full description, media gallery, source/provenance, tags, visibility.
- Empty state: "No events found" with guidance on adjusting filters.

### Content and curation workflow

- Seed the timeline with 3-5 carefully written entries that set the tone.
- Each entry should include a clear date, a 1-3 sentence description, and a source.
- Include a "created by" attribution, even if it is "family-admin."
- For sensitive events, keep the entry short and use the detail view for context.
- Encourage updates through a review process, not direct public edits.

### Moderation and privacy workflow (draft)

- New entries default to "moderated" visibility.
- A moderator reviews the content, sources, and tone before approval.
- Approved entries become "public" within the family scope.
- Revisions create an audit trail with timestamps and actor identity.
- Redaction is possible for sensitive content without deleting the event.

### AI assistance (optional, human-in-the-loop)

- AI can draft short summaries or suggest tags, never publish directly.
- AI output must be reviewed and approved by a human moderator.
- The UI should label AI-generated text and allow edits before saving.
- The system should never fabricate facts; it can only summarize provided notes.

### Implementation phases (high-level)

1) Phase 0 - Seed and view
   - Seed events, basic list view, and REST loading.
   - Confirm filters and read-more behavior on the client.
2) Phase 1 - Detail view
   - Modal or routed detail view with expanded text and media.
   - "Source" and "provenance" blocks for transparency.
3) Phase 2 - Curation workflow
   - Authoring UI for moderators, approval flow, and audit logs.
   - Visibility toggles and moderation queue.
4) Phase 3 - Media and storytelling polish
   - Media galleries, decade groupings, and chapter anchors.
   - Optional narrative highlights (featured events).

### Success criteria

- The three seed items read clearly, feel respectful, and are easy to scan.
- Filters and types make the timeline understandable at a glance.
- The detail view feels intentional and grounded in sources.
- Moderation and visibility reduce confusion and protect privacy.

### Open questions

- Do we need a public-facing version, or is this strictly family-only?
- Should dates be exact or month/year when precision is unknown?
- What is the primary source of truth for historical events (docs, oral history, links)?
- How do we want to handle corrections or disputes about an event?

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
- Backend timeline schema/controller: `apps/craft-nest/src/app/timeline/timeline/*` (see `schemas/timeline-event.schema.ts`)

Canonical event fields (required for good UX and moderation)

- Current schema includes `title`, `description`, `date`, `imageUrl`, `actionLink`, and `type` (lowercase values).
- Planned additions for moderation and provenance: `createdBy`, `visibility`, `source`, `tags`, and an audit trail.
- `id` (string)
- `title` (string)
- `description` (string, 1-3 sentences)
- `date` (ISO date)
- `type` (enum: personal | family | historical | anniversary | project)
- `createdBy` (user id or display name)
- `visibility` (public | private | moderated)
- optional: `imageUrl`, `actionLink`, `source`, `tags`

Seed payloads (ready-to-edit)

- Ray Sanford (example):

 {
  "title": "In Memoriam: Ray Sanford",
  "description": "Honoring the life of Ray Sanford - devoted family man, storyteller, and lifelong learner.",
  "date": "1945-08-15",
  "type": "historical",
  "createdBy": "family-admin",
  "visibility": "moderated",
  "imageUrl": "",
  "actionLink": ""
 }

- Jeffrey Sanford (developer):

 {
  "title": "Jeffrey Sanford - Developer & AI Contributor",
  "description": "Contributed timeline authoring and AI integration work for Craft Fusion.",
  "date": "2025-12-30",
  "type": "personal",
  "createdBy": "jeffrey",
  "visibility": "public",
  "actionLink": "<https://github.com/JeffreySanford/nx-portfolio>"
 }

- Gotcha Harness — AI Probing & Testing Report:

 {
  "title": "Gotcha Harness - AI Probing & Testing Report",
  "description": "Evidence-based analysis of probing mindset in the codebase, gaps, and a scaffolded gotcha-harness for negative tests.",
  "date": "2025-12-30",
  "type": "project",
  "createdBy": "jeffrey",
  "visibility": "public",
  "actionLink": "/documentation/projects/memorial-timeline.md",
  "tags": ["testing","security","gotcha"]
 }

UI and behavior recommendations

- Landing: show three primary tiles with title, date, short excerpt, and a "Read more" link.
- Filters: All | Historical | Personal | Family | Project | Anniversary (optional AI view filter).
- Card behavior: show a short description preview with a "Read more" toggle when longer.
- Modal/detail: show full description, media, source/link, and provenance metadata.
- Visibility: if `visibility !== public` show a badge and a way to request access or contact admin.

## Detail view spec (modal or route)

The detail view should feel like a respectful reading room. It is calm, highly legible, and clearly structured so users can move from summary to source without friction. A modal is preferred for quick context, while a routed page supports deep links and sharing. Both should share the same component anatomy and data contract.

### Component anatomy

- Container: `TimelineDetailComponent` (used in a modal dialog or routed page).
- Header region:
  - Title (primary heading).
  - Date + type badge.
  - Visibility badge (public/private/moderated).
  - Close button (modal only) and optional "Back" link (route).
- Body region:
  - Full description text (no truncation).
  - Optional "AI summary" block with clear labeling (if used).
- Media region:
  - Hero image (single imageUrl) with caption and alt text.
  - Gallery grid for additional media (future).
- Metadata panel:
  - Created by, source link, tags, and last updated.
  - Provenance notes (how this entry was verified or curated).
- Actions row:
  - "Learn more" (external actionLink).
  - "Request access" when visibility is private/moderated.
  - Optional "Share" link if allowed.
- Footer:
  - Previous/next navigation within the timeline (optional).

### Data contract (detail view)

Required fields:

- `id`, `title`, `description`, `date`, `type`

Optional fields:

- `imageUrl`, `actionLink`, `tags`, `source`, `createdBy`, `visibility`, `updatedAt`

The detail view should render gracefully when optional fields are missing (no empty panels).

### Behavior and interaction

- Entry point: open from a timeline card (button or card click).
- Deep link: optional `/family/memorial-timeline/:id` route renders the same view.
- The detail view listens for updated event data and refreshes if the record changes.
- "Request access" should route to a contact or access flow (future) when visibility is restricted.
- For external links, open in a new tab with `rel="noopener noreferrer"`.

### States

- Loading: skeleton or spinner while event data resolves.
- Error: non-blocking error message with retry action.
- Not found: friendly 404 copy with a link back to the timeline.
- Restricted: show summary, badges, and request access CTA, but hide sensitive details.

### Accessibility and UX

- Modal traps focus, closes with Escape, and returns focus to the triggering card.
- Clear, descriptive labels for buttons and badges.
- Heading structure is logical and consistent (H2/H3).
- Respects reduced motion preferences.
- Touch targets are at least 44px on mobile.

### Acceptance criteria

- Given an event with a long description, when the detail view opens, the full description is visible without truncation.
- Given an event with `imageUrl`, the hero image renders with alt text and an optional caption.
- Given an event without media, the media region is omitted (no empty containers).
- When the user opens the detail view, focus lands on the title and stays trapped inside the dialog until closed.
- When Escape is pressed (modal), the dialog closes and focus returns to the event card.
- When `/family/memorial-timeline/:id` is visited directly, the detail view loads the event or shows a not-found state.
- When `visibility` is `private` or `moderated`, the view shows a badge and a "Request access" action.
- When `actionLink` is present, the "Learn more" action opens a new tab with `rel="noopener noreferrer"`.
- When the event type is known, the correct badge color and icon display consistently with the list view.
- When the backend updates an event, the detail view refreshes to show the latest content.

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
