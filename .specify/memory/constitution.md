<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 → 2.0.0 (Major: Added brownfield discipline)
Modified Principles:
  - Added: Brownfield Project Discipline (3 core principles)
  - Enhanced: Testing Standards → Brownfield Testing Discipline
  - Enhanced: Browser Architecture → Tech Stack Stability & Standards
Added Sections:
  - Brownfield Project Discipline (NON-NEGOTIABLE)
  - Change Classification (allowed vs prohibited changes)
  - Brownfield Development Workflow
Removed Sections: N/A
Templates Requiring Updates:
  ⚠ plan-template.md - Should reference brownfield minimal change principle
  ⚠ spec-template.md - Should warn against unnecessary refactoring
  ⚠ tasks-template.md - Should categorize changes as minimal/surgical
Follow-up TODOs:
  - Verify existing code aligns with brownfield principles
  - Update .claude/CLAUDE.md to reference brownfield discipline
  - Communicate brownfield principles to all contributors
-->

# PromptBear Chrome Extension Constitution (Brownfield Project)

## Core Principles

### 0. Brownfield Project Discipline (NON-NEGOTIABLE)

This is a production browser extension project with active users. Code stability and reliability are paramount.

#### Rule I: Respect the Brownfield Codebase

**ABSOLUTELY FORBIDDEN** to refactor or modify existing, working code without explicit user request.
**MUST** make surgical, minimal changes only to the specific parts requested.
**MUST** preserve existing architecture, patterns, and code style.
**NEVER** refactor unless the user explicitly states "refactor" or "restructure".

**Rationale**: This is a live production extension. Unnecessary changes risk breaking existing functionality and endangering user trust. Job security depends on respecting the existing codebase.

#### Rule II: Minimal Change Principle

Every modification **MUST** be the minimum change necessary to achieve the stated goal.
**MUST** avoid touching unrelated files, functions, or code lines.
**MUST** preserve existing comments, formatting, and structure unless those specific items are explicitly targeted for change.

**Rationale**: Minimizing change scope reduces risk, simplifies code review, and maintains system stability in a brownfield environment.

#### Rule III: Explicit Permission Required

Code changes, architectural decisions, and dependency updates **REQUIRE** explicit user approval before implementation.
**MUST** present options and wait for confirmation.
**ABSOLUTELY FORBIDDEN** to autonomously modify code structure, add libraries, or change build configuration.

**Rationale**: User retains control over all changes to protect production stability and ensure alignment with team standards.

### I. Type Safety & Code Quality (NON-NEGOTIABLE)

All code MUST adhere to strict type safety and quality standards:

- **TypeScript strict mode** is mandatory for all `.ts` and `.tsx` files
- **ESLint** must pass with zero errors before any commit or PR merge
- **Prettier** formatting must be applied consistently across the codebase
- **Type-check** must pass for all modules in the monorepo
- No `any` types except when interfacing with untyped third-party libraries (must be
  documented with `// @ts-expect-error` and justification)
- All exported functions and components MUST have explicit type annotations
- Shared types MUST be defined in the `packages/shared` module

**Rationale**: Type safety prevents runtime errors, improves maintainability, and enables
better IDE support. Consistent code quality reduces technical debt and onboarding friction.

### II. Brownfield Testing Discipline

Existing tests **MUST** continue passing after all changes. New features **SHOULD** include tests when requested.

#### Testing Framework Stack
- **E2E tests**: WebdriverIO v9 + Mocha (MANDATORY for user-facing features)
- **Unit tests**: Vitest (RECOMMENDED but optional)
- **Code quality**: ESLint, Prettier, TypeScript strict mode

#### Test Execution Requirements
**ABSOLUTELY FORBIDDEN** to modify or remove existing test files unless explicitly instructed.

**E2E tests are MANDATORY for**:
- Text snippet insertion workflows
- Authentication state changes
- Sidebar/panel UI interactions
- Cross-browser functionality (Chrome & Firefox)

**Integration tests are REQUIRED for**:
- Background script ↔ content script communication
- API integration with PromptBear platform
- Storage operations (chrome.storage.local)

**Unit tests are RECOMMENDED for**:
- Service layer logic (insertionService, promptManager, etc.)
- Utility functions in packages/shared
- Complex state transformations

#### Test Commands
- `pnpm e2e` - Run E2E tests for Chrome
- `pnpm e2e:firefox` - Run E2E tests for Firefox
- `pnpm test` - Run unit tests (Vitest)
- `pnpm type-check` - TypeScript validation
- `pnpm lint` - ESLint validation

**Quality Gate**: All E2E tests must pass before merging to main branch. Run both Chrome and Firefox tests to validate cross-browser compatibility.

**Rationale**: Test suite protects against regressions. In brownfield projects, maintaining existing test coverage is critical. E2E tests ensure user workflows remain functional.

### III. User Experience Consistency

All user-facing features MUST maintain consistent UX across browsers and contexts:

- **Manifest V3 compliance** is mandatory - no Manifest V2 patterns
- **Cross-browser parity**: Features must work identically in Chrome and Firefox unless
  browser limitations prevent it (document exceptions in code comments)
- **Responsive design**: All UI components (sidebar, popup, side panel) must adapt to
  different viewport sizes
- **Loading states**: Show appropriate feedback for async operations (API calls, snippet
  fetching)
- **Error handling**: User-facing errors must be clear, actionable, and localized via i18n
- **Keyboard accessibility**: All interactive elements must be keyboard navigable
- **Visual consistency**: Follow Tailwind CSS design system defined in `packages/ui`

**Rationale**: Consistent UX builds user trust and reduces support burden. Cross-browser
support maximizes user reach. Accessibility ensures inclusive design.

### IV. Performance Requirements

Performance targets for core operations:

- **Snippet insertion**: < 100ms from shortcut trigger to text insertion (p95)
- **Sidebar rendering**: < 300ms initial load time for snippet list
- **Bundle size**: Extension package must be < 5MB total (uncompressed)
- **Memory footprint**: Content script must use < 50MB memory per tab
- **API response handling**: Background script must handle API responses within 2 seconds
- **Cold start**: Extension initialization (service worker) < 500ms

**Optimization requirements**:

- Use code splitting and lazy loading for non-critical UI components
- Cache snippet data in chrome.storage.local to minimize API calls
- Debounce/throttle user input handlers appropriately
- Minimize DOM manipulations in content scripts
- Use React.memo and useMemo for expensive component renders

**Rationale**: Fast performance is critical for a productivity tool. Users expect instant
snippet insertion. Slow extensions create friction and abandonment.

### V. Browser Compatibility & Extension Architecture

Extension architecture must follow platform best practices:

- **Service Worker**: Background script must be stateless and handle cold restarts
- **Content Script isolation**: Use messaging API for all background ↔ content communication
- **Storage limits**: Respect chrome.storage.local quotas (10MB limit)
- **Permission minimalism**: Request only necessary permissions in manifest.json
- **Feature detection**: Use runtime checks for browser-specific APIs before usage
- **Build targets**: Maintain separate build outputs for Chrome and Firefox via Vite config

**Architecture patterns**:

- Content scripts register message handlers via messageHandler.ts
- Background script manages global state (auth, API communication)
- UI components (content-ui, side-panel) remain presentation-focused
- Services (insertionService, promptManager) encapsulate business logic

**Rationale**: Manifest V3 enforces stateless service workers. Proper architecture prevents
race conditions and ensures extension reliability across browser restarts.

### VI. Tech Stack Stability & Standards

**MUST** follow the project's established technology stack. **NEVER** upgrade major versions or introduce new frameworks without explicit approval.

#### Core Technology Stack
- **TypeScript**: 5.5.4 (strict mode enabled)
- **React**: 18.3.1
- **Build Tool**: Vite 6.0.5
- **Monorepo**: Turborepo 2.3.3 with pnpm workspaces
- **Styling**: Tailwind CSS 3.4.14
- **Testing**: WebdriverIO v9 + Mocha (E2E), Vitest (unit)
- **Extension API**: Manifest V3, webextension-polyfill 0.12.0

#### Stability Requirements
**MUST** adhere to existing TypeScript patterns and Vite/React conventions found in the codebase.
**MUST** use the project's established dependencies (versions listed above).
**ABSOLUTELY FORBIDDEN** to upgrade major versions without explicit approval.
**ABSOLUTELY FORBIDDEN** to introduce new frameworks, build tools, or architectural patterns without approval.

#### Browser Extension Specifics
- **Manifest V3 compliance** is mandatory - no Manifest V2 patterns
- **Cross-browser support**: Chrome and Firefox via conditional builds (`__FIREFOX__` flag)
- **Service Worker**: Background script must be stateless (Manifest V3 requirement)
- **Content Script isolation**: Use messaging API for all background ↔ content communication
- **Storage limits**: Respect chrome.storage.local quotas (10MB limit)

**Rationale**: Technology stack stability is critical for brownfield projects. Version changes can trigger cascading breaking changes across the codebase. Browser extension architecture must follow platform best practices.

## Change Classification

### Allowed Changes (Require User Request)
- Fix specific bugs in identified functions/components
- Create new features in new files
- Add E2E tests for new features (when requested)
- Add unit tests (optional/recommended)
- Update documentation
- Security dependency patches (with approval)

### Prohibited Changes (Unless Explicitly Requested)
- Refactoring existing working code
- Changing file/folder structure or architecture
- Modifying coding patterns or conventions
- Upgrading major dependency versions
- Removing or reorganizing existing features
- Modifying or deleting existing tests
- Introducing new frameworks or libraries

## Security & Privacy Standards

All code MUST follow security best practices:

- **API authentication**: Store auth tokens securely in chrome.storage.local (never in
  localStorage or sessionStorage accessible to web pages)
- **Content Security Policy**: Follow strict CSP defined in manifest.json
- **XSS prevention**: Sanitize all user input before insertion into DOM
- **HTTPS only**: All API calls must use HTTPS (enforced via VITE_API_DOMAIN)
- **Permission justification**: Document why each permission in manifest.json is needed
- **Third-party code**: Audit all external dependencies for security vulnerabilities
- **Data minimization**: Only collect/store data essential for functionality
- **No sensitive data logging**: Never log auth tokens, API keys, or user passwords

**Rationale**: Extensions have elevated privileges. Security breaches erode user trust and
can lead to store removal. Privacy protection is both ethical and legally required.

## Development Workflow

### Brownfield Change Protocol

**Before Changes**:
1. **Carefully read** the requested change
2. **Identify** the minimum set of files that need modification
3. **Propose** specific changes if scope is unclear
4. **Wait** for explicit approval if requirements are ambiguous

**During Implementation**:
1. **Only modify** the requested portions
2. **Preserve** all existing code style and structure
3. **Test** that existing functionality still works
4. **Verify** no unintended side effects

**After Changes**:
1. **Report** exactly what was changed and why
2. **Confirm** all tests still pass
3. **Wait** for user verification before considering work complete

### Pre-commit Requirements

All code changes MUST follow this workflow:

**Pre-commit requirements**:

1. Run `pnpm lint:fix` to auto-fix linting issues
2. Run `pnpm type-check` to validate TypeScript
3. Run `pnpm prettier` to format code
4. Ensure relevant tests pass (unit, integration, or E2E)

**Pull request requirements**:

1. PR title follows conventional commits format: `type(scope): description`
   - Types: feat, fix, refactor, test, docs, chore, perf, ci
   - Example: `feat(content-script): add support for contentEditable elements`
2. PR description includes:
   - What changed and why
   - Testing performed (manual + automated)
   - Screenshots/videos for UI changes
   - Breaking changes (if any)
3. All CI checks must pass (lint, type-check, build, tests)
4. At least one code review approval required
5. Squash merge to main to keep history clean

**Quality gates**:

- **Build**: `pnpm build` and `pnpm build:firefox` must succeed
- **Linting**: `pnpm lint` must pass with zero errors
- **Type safety**: `pnpm type-check` must pass with zero errors
- **Tests**: `pnpm e2e` and `pnpm e2e:firefox` must pass for feature PRs
- **Bundle size**: Check that extension size stays under 5MB

**Branch strategy**:

- `main` branch is protected and always deployable
- Feature branches: `feat/###-feature-name`
- Bugfix branches: `fix/###-issue-description`
- No direct commits to main

**Rationale**: Consistent workflow prevents broken deployments. Code review catches bugs and
knowledge-shares. Automated checks enforce quality standards at scale.

## Governance

This constitution governs all development work on the PromptBear Chrome Extension project.

**Amendment procedure**:

1. Propose changes via GitHub issue with label `constitution-amendment`
2. Document rationale and impact on existing code
3. Require approval from project maintainers
4. Update constitution version following semantic versioning
5. Update all dependent templates (plan, spec, tasks) to reflect changes
6. Communicate changes to all contributors

**Version policy**:

- **MAJOR** (X.0.0): Backward incompatible principle removals or redefinitions
- **MINOR** (0.X.0): New principles added or materially expanded guidance
- **PATCH** (0.0.X): Clarifications, wording fixes, non-semantic refinements

**Compliance enforcement**:

- All PRs must verify alignment with constitution principles
- Code reviews must explicitly check for principle violations
- Constitution violations require documented justification in PR description
- Repeated violations trigger architectural review discussion

**Runtime guidance**:

- Development guidance is documented in `.claude/CLAUDE.md`
- Template guidance is in `.specify/templates/`
- Onboarding documentation is in `README.md`

**Documentation Language:**

- All specifications, plans, and user-facing documentation MUST be written in Traditional Chinese (zh-TW)
- Code comments and technical documentation MAY use English for technical clarity
- Commit messages and internal development notes MAY use English

**Version**: 2.0.0 | **Ratified**: 2025-11-11 | **Last Amended**: 2025-12-08