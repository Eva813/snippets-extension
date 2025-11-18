<!--
SYNC IMPACT REPORT
==================
Version Change: NEW → 1.0.0 (Initial constitution)
Modified Principles: N/A (new document)
Added Sections:
  - Core Principles (5 principles)
  - Security & Privacy Standards
  - Development Workflow
Removed Sections: N/A
Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section aligns
  ✅ spec-template.md - Requirements align with principles
  ✅ tasks-template.md - Task categorization aligns
Follow-up TODOs: None
-->

# PromptBear Chrome Extension Constitution

## Core Principles

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

### II. Testing Standards

Testing requirements vary by component criticality:

- **E2E tests** are MANDATORY for all user-facing features that involve:
  - Text snippet insertion workflows
  - Authentication state changes
  - Sidebar/panel UI interactions
  - Cross-browser functionality (Chrome & Firefox)
- **Integration tests** are REQUIRED for:
  - Background script communication with content scripts
  - API integration with PromptBear platform
  - Storage operations (chrome.storage.local)
- **Unit tests** are RECOMMENDED for:
  - Service layer logic (insertionService, promptManager, etc.)
  - Utility functions in packages/shared
  - Complex state transformations

**Test execution**: All tests must pass before merging to main branch. Run `pnpm e2e` and
`pnpm e2e:firefox` to validate cross-browser compatibility.

**Rationale**: E2E tests ensure user workflows work correctly. Integration tests verify
component communication. Unit tests provide fast feedback during development.

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

**Version**: 1.0.0 | **Ratified**: 2025-11-11 | **Last Amended**: 2025-11-11
