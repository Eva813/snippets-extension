# Copilot Instructions for `snippets-extension`

## Overview
This monorepo is a Chrome/Firefox extension project using React, TypeScript, Vite, and Turborepo. It is organized into:
- `chrome-extension/`: Chrome extension entry, manifest, and background scripts
- `pages/`: Each subfolder is a browser page (content, popup, options, devtools, etc.)
- `packages/`: Shared and utility packages (i18n, UI, storage, shared, etc.)

## Key Architectural Patterns
- **Shared code**: Use packages in `packages/` for cross-page logic, types, and UI. Import via `@extension/*` aliases.
- **Prompt/shortcut system**: Content scripts detect user shortcuts and trigger prompt insertions. See `pages/content/src/input/inputHandler.ts` for the main logic.
- **i18n**: Managed in `packages/i18n`. Add/remove languages in `locales/`, then run `pnpm genenrate-i18n` to update types and helpers.
- **UI**: Shared React components and Tailwind config in `packages/ui`. Use `withUI` for Tailwind config merging.
- **HMR**: Custom hot module reload for extension development in `packages/hmr`.

## Developer Workflows
- **Install dependencies**: `npm install -g pnpm` then `pnpm install`
- **Development**: `pnpm dev` (Chrome), `pnpm dev:firefox` (Firefox)
- **Build**: `pnpm build` (Chrome), `pnpm build:firefox` (Firefox)
- **E2E tests**: `pnpm e2e` (see `tests/e2e/`)
- **Zip for release**: `pnpm zip` (see `packages/zipper`)
- **Add dependency to root**: `pnpm i <package> -w`
- **Add dependency to package**: `pnpm i <package> -F <package>`

## Project Conventions
- **TypeScript only**; use strict types and shared types from `@extension/shared`
- **React 18** for UI; all UI should be in `pages/*/src` or `packages/ui`
- **Tailwind** for styling; extend via `tailwind.config.ts` and `withUI`
- **i18n**: Use the `t` function from `@extension/i18n` for all user-facing text
- **Prompt system**: Use `getPromptByShortcut` and related helpers for snippet/shortcut logic
- **Background/content communication**: Use `chrome.runtime.sendMessage` for cross-context actions

## Integration Points
- **Chrome APIs**: Use `chrome.*` APIs for extension features (background, storage, messaging)
- **Vite**: All builds and dev servers use Vite; config in each page/package
- **Turborepo**: Orchestrates builds and caching across packages/pages

## Examples
- **Add a new UI component**: Place in `packages/ui/lib/components/`, export from `index.ts`, and use in any page
- **Add a new prompt**: Update prompt logic in `pages/content/src/prompt/`
- **Add a new language**: Add folder to `packages/i18n/locales/`, run `pnpm genenrate-i18n`

## References
- Main README: [`README.md`](../../README.md)
- i18n: [`packages/i18n/README.md`](../packages/i18n/README.md)
- UI: [`packages/ui/README.md`](../packages/ui/README.md)
- Shared: [`packages/shared/README.md`](../packages/shared/README.md)

---
For any unclear or missing conventions, please ask for clarification or check the referenced files above.


----

### about react code review

You are tasked with reviewing a React codebase. Carefully analyze the provided code to identify issues, suggest improvements, and ensure best practices are followed. Focus on component structure, state management, hooks usage, code readability, performance optimizations, and potential bugs or security vulnerabilities. Break down your feedback into clear, actionable points and explain the reasoning behind each suggestion. If relevant, include code snippets to illustrate improvements or corrections clearly.

main focus on: $ARGUMENTS

# Review Focus Areas

Consider:

- Code quality and adherence to modern React best practices
- Correct usage of React hooks and avoidance of common pitfalls
- Performance optimizations, including unnecessary re-renders and stale closures
- Derived State anti-patterns and proper state management
- Lazy initialization of expensive state calculations
- Avoiding over-fragmentation and excessive component nesting
- Readability, naming clarity, and maintainability of the codebase
- Component responsibility (SRP) and reusability
- Proper cleanup in useEffect (timers, subscriptions, etc.)
- Security concerns such as unsafe HTML injection (e.g., XSS via dangerouslySetInnerHTML)
- Correct handling of asynchronous behavior (e.g., fetch, debounce, throttling)
- Accessibility considerations (e.g., alt text, ARIA roles, focus management)
- Proper usage of TypeScript types or PropTypes, if applicable
- Lint and runtime warning checks

# Review Process

1. Review overall project structure and code organization
2. Analyze individual components for clarity, reusability, and hook usage
3. Identify unnecessary re-renders or unstable references (e.g., stale closures, missing deps)
4. Check for improper state usage, derived state, and lifting state unnecessarily
5. Look for potential bugs, missing cleanups, or unhandled edge cases
6. Highlight security or accessibility concerns
7. Summarize recommendations with examples where needed

# Output Format

Provide a detailed review report formatted with clear sections and bullet points. Use code blocks for example snippets. Conclude with a summary of key recommendations.

This review format ensures thorough evaluation of:

- Component quality and responsibilities
- State and side-effect management
- Code maintainability and readability
- Performance and re-render efficiency
- Accessibility and security

Best practices reminders for React reviewers:

- Ensure functions and dependencies in useEffect/useCallback/useMemo are stable and accurate
- Avoid defining functions or objects inline when passed as props to memoized components
- Prefer colocation of state near where it’s used, rather than lifting unnecessarily
- Avoid duplicating logic — follow DRY principles
- Ensure accessibility basics like keyboard navigation and alt attributes
- Don’t mutate state directly
- Prefer controlled components for forms unless intentionally using uncontrolled ones
