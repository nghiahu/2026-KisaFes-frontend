# Universal Project Coding Skill

## Activation Test

When this skill is used, the agent must start its implementation report with:

"SKILL_USED: universal-coding-skill"

## Trigger conditions

Use this skill whenever the task involves **implementing, modifying, refactoring, or debugging code** in an existing software project. This includes:

- Adding a new feature or endpoint
- Fixing a bug
- Refactoring existing code
- Modifying UI, logic, schema, config, or tests
- Integrating a new dependency or service

Do **not** use this skill for: creating a brand-new project from scratch with no existing codebase, generating standalone scripts unrelated to a project, or answering general coding questions without a project context.

---

## Purpose

The coding agent must first understand the existing project, then implement the requested change while preserving architecture, conventions, and user-provided specs.

This skill is designed to work with any stack, including but not limited to:

- **Front-end:** React, Next.js, Vue, Nuxt, Svelte, Angular, plain HTML/CSS/JS
- **Back-end:** Spring Boot, Node.js, NestJS, Express, Django, FastAPI, Laravel, Rails, Go, .NET, Rust
- **Mobile:** React Native, Expo, Flutter, Android, iOS
- **Desktop:** Electron, Tauri, JavaFX, Qt, WPF
- **Game/modding:** Minecraft Forge/NeoForge/Fabric, Unity, Godot, Unreal
- **Data/AI:** Python pipelines, notebooks, agents, RAG systems, ML services
- **DevOps:** Docker, CI/CD, deployment scripts, infrastructure config

---

## Core principle

Do **not** force a preferred architecture onto the project.

Your job is to:

1. Read the existing codebase and specs.
2. Identify the project's actual conventions.
3. Reuse what already exists.
4. Implement only what is needed.
5. Document anything important that was not explicit in the spec.
6. Leave the project in a buildable, lintable, testable state whenever possible.

**Rule priority when conflicts arise:**

> User instruction > Explicit spec > Existing project convention > General best practice

If spec conflicts with existing architecture, prefer the existing convention and **document the deviation** in `implement.md`. If the user explicitly asks to change the architecture, follow the user instruction.

---

## Terminology

- **MUST / REQUIRED:** mandatory. Do not skip.
- **MUST NOT:** prohibited.
- **SHOULD:** recommended when applicable.
- **MAY:** optional.
- **"Document"** means record the decision in `implement.md` unless the task is trivial.

---

## Non-negotiable rules

### 1. Read before changing

Before editing any code, inspect the repository to understand the project. For large repos (50+ files), focus on files **directly relevant to the task area** rather than reading everything.

**Minimum inspection checklist:**

- [ ] Folder/module/package structure (`view` root, then relevant subdirectories)
- [ ] Language and framework versions (`package.json`, `build.gradle`, `pyproject.toml`, `go.mod`, etc.)
- [ ] Dependency manager (`npm`/`yarn`/`pnpm`, `maven`/`gradle`, `pip`/`poetry`, etc.)
- [ ] Routing or entrypoint structure
- [ ] Existing naming conventions (files, functions, variables, DB fields)
- [ ] API/client/service boundaries
- [ ] Validation and error-handling patterns
- [ ] Auth/security patterns
- [ ] Data models and persistence strategy
- [ ] UI component system (if frontend)
- [ ] State management and data fetching patterns (if frontend)
- [ ] Localization/i18n strategy
- [ ] Testing setup
- [ ] Lint/type-check/build scripts
- [ ] Existing implementations **similar to the requested feature**

**How to inspect efficiently:**

```bash
# Start with structure
view /path/to/project

# Find relevant files quickly
find . -name "*.ts" -path "*/feature-name/*" | head -20
grep -r "similarFunctionName" --include="*.ts" -l

# Check package info
cat package.json
cat pyproject.toml
```

Do **not** rename, restructure, or migrate large areas of the project unless the user or spec explicitly asks for it.

**When the project has no established convention** (new/empty project): apply the most widely-used convention for the detected stack (e.g., feature-folder structure for React, layered architecture for Spring Boot) and document the choice in `implement.md`.

---

### 2. Spec-first implementation

Treat user-provided specs, screenshots, tickets, comments, README files, API contracts, and existing code as the source of truth.

**When a spec exists:**

- Implement explicit requirements first
- Preserve required route names, endpoint names, DTO shapes, UI states, database fields, event names, and acceptance criteria
- Do not silently remove requirements
- Do not replace real data with fake/mock data unless the spec allows it
- Do not invent unrelated features
- If the spec conflicts with existing project conventions, prefer the existing convention and document the deviation

**When no complete spec exists:**

- Infer the smallest safe implementation from the existing project
- Avoid overengineering
- Document assumptions clearly in `implement.md`

---

### 3. Preserve architecture

Follow the project's existing architecture instead of imposing a new one.

Examples:

- If the backend uses service/controller/repository layers, keep that separation
- If the backend uses handlers/use-cases/domain modules, follow that style
- If the frontend uses hooks/services/components, keep API calls out of UI components
- If the project uses feature folders, add code inside the relevant feature folder
- If the project uses shared packages in a monorepo, reuse those packages
- If the project uses generated API clients/types, regenerate or update them properly
- If the project has a custom response wrapper, error format, event bus, storage service, logger, or config system, reuse it

Do not create a parallel architecture for one new feature.

---

### 4. Separation of concerns

Keep responsibilities clear.

- **UI:** render state and call hooks/actions/services — no persistence or business logic
- **Controllers/routes/handlers:** validate request shape, resolve context, call application logic, format responses
- **Services/use-cases:** own business rules, permissions, transactions, orchestration, and side effects
- **Data access:** stay in repositories/ORM models/queries/adapters according to project pattern
- **Mapping/serialization:** do not leak internal entities or infrastructure fields
- **Reusable logic:** extract only when genuinely reused or improves clarity

---

### 5. Type safety and contracts

Use the strongest type system available in the project.

Required:

- Avoid `any`, raw maps, untyped objects, or magic strings where the stack supports better typing
- Define request/response types, DTOs, schemas, interfaces, structs, enums, or models according to project style
- Keep frontend and backend contracts aligned
- Update validation schemas when data shapes change
- Update generated types or API clients if the project uses generation
- Keep nullability/optional fields explicit

---

### 6. Real data over mock data

If a feature is meant to use real project data:

- Read/write from the existing database, API, filesystem, game registry, storage service, or external integration as appropriate
- Do not hardcode demo records into production code
- Do not use fake counters, fake users, fake videos, fake items, or fake responses
- If a dependency is not ready, use a clearly marked feature flag, adapter, TODO, or empty state and document it

Mock data is acceptable only in tests, Storybook/examples, local fixtures, or when the user/spec explicitly asks for a mock.

---

### 7. Security and permissions

Server-side or authoritative-side validation is required for all sensitive operations.

Check, depending on the project:

- Authentication
- Authorization/roles/ownership
- Visibility/privacy rules
- Input validation and sanitization
- Rate limiting/spam prevention when infrastructure exists
- File upload restrictions
- Path traversal prevention
- CORS/origin policy
- CSRF/session rules
- Token/session handling
- WebSocket/subscription membership
- Secret handling
- Private storage keys and signed/public URLs
- Game/server command permission levels
- Admin-only/moderator-only actions

**Never trust client-provided ownership fields** such as `userId`, `ownerId`, `authorId`, `senderId`, `reporterId`, `role`, or `isAdmin`.

---

### 8. Data correctness

Maintain consistent state.

Required when applicable:

- Use transactions around multi-step mutations
- Prevent duplicate records with unique constraints or idempotent logic
- Keep counters non-negative
- Return final authoritative state after toggle-like operations
- Handle soft delete consistently
- Filter inactive/deleted/private records in public reads
- Handle pagination and sorting deterministically
- Avoid race conditions where reasonable
- Do not break existing migrations or seed data
- Preserve backward compatibility unless explicitly allowed to break it

---

### 9. UX and UI quality

For user-facing features, provide all essential states:

- Loading
- Success
- Empty
- Error
- Disabled
- Unauthenticated
- Unauthorized
- Offline/network failure where relevant
- Optimistic update rollback where optimistic UI is used

Respect the existing design system:

- Reuse existing components
- Reuse spacing, colors, typography, icons, modal/sheet/toast patterns
- Support responsive layouts if the app supports multiple screen sizes
- Maintain accessibility basics: labels, focus, keyboard navigation, ARIA where relevant
- Do not duplicate components with the same responsibility

---

### 10. Internationalization

If the project has i18n/localization:

- Every user-facing string must go through the existing i18n system
- Update all required locale files
- Avoid hardcoding one language in components
- Use consistent keys and namespaces
- Include fallback text only if the project already uses that pattern

If the project has no i18n, follow the existing text style and note in `implement.md` that no i18n system exists.

---

### 11. Errors and logging

Follow the project's existing error-handling style.

Required:

- Return errors using the project's standard response/exception format
- Do not expose stack traces, secrets, storage keys, SQL details, or internal infrastructure paths to users
- Log useful debugging information server-side where the project has logging
- Preserve user-friendly messages in UI
- Handle failed API calls and failed mutations cleanly

---

### 12. Performance

Avoid obvious performance regressions.

Consider:

- Pagination/infinite scroll for large lists
- Indexes for new database queries
- Avoiding N+1 queries
- Caching where the project already uses it
- Debouncing search/autocomplete
- Lazy loading heavy UI/media
- Cleanup of subscriptions/listeners/timers
- Avoiding unnecessary rerenders
- Streaming/chunking large files where applicable
- Not loading entire datasets when a targeted query is enough

---

### 13. Testing and verification

Before finishing, run the most relevant checks available in the project.

Examples:

- lint
- type-check
- unit tests
- integration tests
- build
- format check
- backend test suite
- frontend test suite
- migration validation
- game/mod data generation
- Docker build
- smoke test command

**When a check cannot run** (missing env vars, services, credentials, or time):

1. Document in `implement.md` section 10: which command, why it could not run, and what would be needed to run it.
2. Do **not** claim the check passed.
3. Continue with the task only if the blocker is environmental (not a code error you introduced).

**When a check fails due to your changes:** fix the failure before completing the task. Do not hand off broken code.

**When a check fails due to pre-existing issues:** document separately in `implement.md` under "Known limitations / follow-up" and do not count them as your failures.

---

## Required implementation record

### When to create `implement.md`

Create or update `implement.md` for any task that involves:

- New files or schema changes
- Changes to public API contracts or data models
- Security or permission changes
- Non-obvious decisions or trade-offs
- Deviations from the spec

**Skip for trivial tasks** such as: typo fixes, minor copy changes, or single-line adjustments with no architectural implications. In those cases, a brief inline comment in the code is sufficient.

### File location

- Feature folder for feature-specific work
- Repo root for cross-cutting work
- `docs/` folder if the project stores implementation notes there

If `implement.md` already exists, **update it** instead of overwriting — append new sections or update relevant ones, preserving useful history.

---

## `implement.md` template

```md
# Implementation Notes — <Feature or Task Name>

## 1. Summary

<Short description of what was implemented.>

## 2. Specs used

- <spec file / ticket / screenshot / user instruction>

## 3. Project conventions detected

- Architecture: <observed architecture>
- Naming: <observed naming convention>
- API pattern: <observed API/response pattern>
- UI pattern: <observed component/hook/service pattern>
- Validation/error pattern: <observed pattern>
- Note: <"no existing convention found — applied [X] as default" if applicable>

## 4. Files changed

- `<path>` — <what changed>

## 5. Decisions not explicitly in the spec

- <decision> — <reason>

## 6. Changes required by existing code

- <change> — <why it was needed>

## 7. Trade-offs

- <trade-off> — <impact>

## 8. Deviations from spec

- <deviation or "None"> — <reason / follow-up>

## 9. Data / API / schema notes

- <new endpoint / field / migration / config / permission / event>

## 10. Testing and verification

- `<command>` — <passed / failed / not run — reason>

## 11. Known limitations and follow-up

- <item or "None">
```

---

## Implementation workflow

### Step 1 — Understand

- Read the user request and all provided specs.
- Inspect the project structure (use the minimum inspection checklist from Rule #1).
- Find similar existing code to use as a reference.
- Identify where the change belongs in the existing architecture.
- If the project has no conventions, note that and proceed with stack defaults.

### Step 2 — Plan minimally

Create a small implementation plan covering only:

- Backend/data changes if needed
- Frontend/UI changes if needed
- Config or migration changes if needed
- Tests or verification commands

MUST prefer targeted changes over rewrites. If more than ~10 files are needed but they are **directly required** by the requested feature, continue and document why in `implement.md`. Stop and confirm with the user only when the change requires broad rewrites, cross-cutting architecture changes, destructive operations, or touching unrelated modules.

### Step 3 — Implement

- Add/modify the smallest necessary set of files.
- Reuse existing utilities.
- Keep contracts typed.
- Keep errors and responses consistent.
- Add user-facing states if UI is involved.
- Update locale files if i18n exists.

### Step 4 — Record decisions

Create or update `implement.md` with the required implementation record (see threshold above).

This is mandatory for non-trivial tasks.

### Step 5 — Verify

Run relevant checks.

- Fix failures caused by your changes.
- Document unrelated/pre-existing failures separately.
- Do not claim success if required checks did not pass.
- If checks could not run due to environment, document exactly what is needed.

### Step 6 — Final response

Return a structured implementation summary:

1. **Summary** — what was implemented
2. **Files changed** — important files created or modified
3. **Behavior implemented** — what the feature now does
4. **Checks run** — commands executed and their results
5. **Known limitations** — anything the project owner must know before merging
6. **Implementation record location** — path to `implement.md`

Do not paste large code blocks in the final response when files were already edited.

---

## Stack-specific adaptation rules

### Backend projects

- Keep request/response contracts explicit
- Validate input server-side
- Enforce permissions server-side
- Use services/use-cases for business logic
- Use transactions for multi-write operations
- Avoid exposing ORM entities directly unless the project intentionally does so
- Update migrations/schema safely
- Add indexes for new query patterns
- Keep public/private data boundaries clear

### Frontend projects

- Reuse existing components and API clients
- Keep API calls in services/hooks/actions according to project style
- Define types for API responses and UI state
- Handle loading/empty/error states
- Avoid duplicate components
- Support responsive behavior if the app is responsive
- Update i18n files if i18n exists
- Avoid hardcoded URLs and secrets

### Mobile projects

- Handle safe areas, keyboard overlap, permissions, app lifecycle, and offline/network states
- Use existing navigation patterns
- Keep native permissions explicit
- Test on relevant screen sizes where possible

### Game/mod projects

- Register items/blocks/entities/events through the correct registry lifecycle
- Keep client-only code separate from server/common code
- Avoid breaking save compatibility unless explicitly required
- Use data generation/resources/assets according to the project style
- Document IDs, registries, config keys, recipes, loot tables, tags, and compatibility notes

### CLI/tooling projects

- Keep command flags documented
- Validate arguments
- Return meaningful exit codes
- Avoid destructive defaults
- Support dry-run if the project already has that pattern
- Preserve script portability

### AI/data projects

- Keep prompts/configs versioned where the project does so
- Avoid leaking secrets or private data
- Document model/provider assumptions
- Make data paths configurable
- Preserve reproducibility where possible
- Evaluate outputs with existing tests or sample cases

### DevOps/infrastructure projects

- Do not hardcode secrets
- Update example env files if new variables are needed
- Keep Docker/CI scripts compatible with current package manager
- Document migration/deployment steps
- Avoid destructive infrastructure changes without explicit instruction

---

## Scope control

MUST prefer targeted changes over rewrites.

MUST NOT:
- Reformat unrelated files
- Rename existing modules/components without necessity
- Upgrade dependencies unless required by the task
- Change public APIs unless required by the spec/user
- Mix unrelated cleanup with the requested task

---

## Ambiguity handling

Do not block on minor ambiguity when the existing project convention or spec provides a safe default.

Ask the user only when ambiguity affects:
- Data loss
- Security/permissions
- Billing/cost
- Public API breaking changes
- Irreversible schema or architecture decisions
- User-visible behavior with multiple equally valid interpretations

Otherwise, make the smallest safe assumption and document it in `implement.md`.

---

## Dependency policy

MUST NOT add a new dependency if existing project utilities can solve the task.

When adding a dependency:
- Justify it in `implement.md`
- Use the existing package manager and update the lockfile
- Avoid abandoned, insecure, or oversized dependencies when a smaller project-native solution exists
- Do not add dependencies for trivial helpers

---

## Generated files

If a file is generated (e.g. from OpenAPI, GraphQL schema, protobuf, ORM codegen):
- MUST NOT edit it manually unless project convention explicitly allows it
- Update the source schema/spec instead
- Regenerate using the project command
- If regeneration cannot run, document the command and blocker in `implement.md`

---

## Environment variables and secrets

If new environment variables are introduced:
- Update `.env.example`, config docs, or deployment docs according to project convention
- MUST NOT print or commit real secrets
- Document required/optional variables in `implement.md`

---

## Database migration rules

For schema changes:
- Use the project's migration tool
- MUST NOT edit old migrations that may already be applied unless project convention allows it
- Preserve backward compatibility where possible
- Add indexes for new query patterns
- Document default values, backfills, and destructive changes in `implement.md`
- Document rollback/manual recovery notes when relevant

---

## Anti-patterns to avoid

Do not:

- Ignore the spec or implement from memory without reading the repo
- Create a new architecture beside the existing one
- Duplicate components/services already present
- Hardcode fake data into production paths
- Expose internal entities, secrets, storage keys, stack traces, or private URLs
- Trust client-provided ownership or role fields
- Skip error/loading/empty states in UI
- Use untyped objects when the project supports typed contracts
- Silently omit requirements
- Claim tests passed if they were not run or could not run
- Overwrite existing `implement.md` history without preserving useful context
- Start implementing before reading the project (even for "simple" tasks)
- Plan a rewrite when a targeted change was asked for
- Create `implement.md` for trivial single-line fixes and inflate noise
- Add a dependency when an existing utility solves the task
- Edit generated files manually when a source schema and regeneration command exist
- Reformat, rename, or clean up unrelated code as part of a targeted task
- Block on minor ambiguity when the existing convention provides a safe default

---

## Definition of done

A task is **done** only when:

- [ ] The requested behavior is implemented according to the spec and existing project conventions
- [ ] Required contracts/types/schemas are updated
- [ ] User-facing UI states are handled where relevant
- [ ] Security/permission checks are enforced where relevant
- [ ] Real data is used where required
- [ ] i18n is updated if the project has i18n
- [ ] Relevant tests/checks were run — or honestly documented as skipped/failed with reasons
- [ ] `implement.md` records decisions, trade-offs, deviations, and follow-up notes (for non-trivial tasks)

---

## Project-Specific Rules (KisaFres Frontend)

### 1. Tech Stack & Architecture
- **Framework:** React + Vite + TypeScript.
- **Styling:** Tailwind CSS + custom UI components (Slate/Blue palette, `text-[#3B82F6]`, `bg-[#EEF2FF]`).
- **State Management:** Redux Toolkit (`store/slices/`) for global state, `useState` for UI state.
- **API & Networking:** Axios with custom `axiosClient` interceptors (`services/axiosClient.ts`). Do not call `axios` directly from components.
- **Icons:** `lucide-react`, centrally exported via `src/assets/icons/index.tsx`. Use `<Icons.user />` pattern.

### 2. Reusable UI Components
- **Modals:** Use `ConfirmModal.tsx`, `PermissionDeniedToast.tsx`, `SessionExpiredModal.tsx` from `src/components/common/`.
- **Dropdowns:** Use `UserDropdown.tsx`. Implement `handleClickOutside` listeners. Use `createPortal` for dropdown menus to prevent clipping.

### 3. KisaFres Specific Pitfalls & Optimizations
- **Task Creation in Sprints:** The backend `createTask` API defaults to the backlog. Call `sprintService.moveTaskToSprint(res.id, sprintId)` immediately after creation to assign it to a sprint.
- **Optimistic UI:** For drag/drop and status changes, update local state `setTasks` before API response. Revert if API fails.
- **Component Size:** Abstract sub-components if a file exceeds 800 lines (e.g., `ProjectBacklog.tsx`).
- **Types:** Do NOT define large interfaces in components. Use `src/types/` or dedicated `types.ts`.
