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
