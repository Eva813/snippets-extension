# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome/Firefox extension built with React, TypeScript, and Vite using a monorepo structure with Turborepo. It's a snippet management system that allows users to insert text snippets via shortcuts into any web page.

## Key Development Commands

### Building and Development
- `pnpm dev` - Start development server for Chrome (requires admin on Windows)
- `pnpm dev:firefox` - Start development server for Firefox
- `pnpm build` - Production build for Chrome
- `pnpm build:firefox` - Production build for Firefox
- `pnpm zip` - Build and create distribution zip for Chrome
- `pnpm zip:firefox` - Build and create distribution zip for Firefox

### Code Quality
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm lint:fix` - Fix all linting issues
- `pnpm type-check` - Run TypeScript type checking
- `pnpm prettier` - Format code with Prettier

### Testing
- `pnpm e2e` - Run end-to-end tests (Chrome)
- `pnpm e2e:firefox` - Run end-to-end tests (Firefox)

### Package Management
- `pnpm i <package> -w` - Install package at workspace root
- `pnpm i <package> -F <module-name>` - Install package for specific module

## Architecture Overview

### Core Components

1. **Background Script** (`chrome-extension/src/background/`)
   - Service worker handling extension lifecycle
   - Manages user authentication state and icon updates
   - Fetches snippet data from remote API
   - Handles inter-component communication

2. **Content Scripts** (`pages/content/`)
   - Main content script that initializes on all web pages
   - Manages cursor tracking, input handling, and prompt management
   - Handles user authentication state changes
   - Text insertion service for various HTML elements

3. **Content UI** (`pages/content-ui/`)
   - React-based side panel overlay
   - Displays snippet folders and allows snippet insertion
   - Toggle modes: push (adjusts page layout) or overlay (floats over content)

4. **Side Panel** (`pages/side-panel/`)
   - Alternative UI using Chrome's native side panel API
   - Form rendering for dynamic snippet insertion

### Key Services

- **insertionService.ts**: Unified content insertion handling input elements, textareas, and contentEditable elements
- **promptManager.ts**: Manages snippet cache and retrieval by shortcut
- **messageHandler.ts**: Handles communication between content script and background
- **cursorTracker.ts**: Tracks cursor position for insertion
- **safetyManager.ts**: Validates safe operation contexts

### Shared Packages

- `shared`: Common types, utilities, and components
- `storage`: Chrome storage API helpers
- `i18n`: Internationalization with type safety
- `hmr`: Custom hot module reload for development
- `ui`: Shared UI components and Tailwind config

## Development Notes

### Extension Structure
- Uses Manifest V3 with service worker background script
- Content scripts inject on all websites (`*://*/*`)
- Communicates with remote API at `https://linxly-nextjs.vercel.app`
- Supports both Chrome and Firefox with conditional builds

### Authentication Flow
- Users authenticate through web app
- Extension tracks login state in chrome.storage.local
- Icon changes based on authentication status
- Features only initialize when user is logged in

### Text Insertion
- Supports input elements, textareas, and contentEditable elements
- Handles cursor position tracking and restoration
- Uses DOM selection API for contentEditable elements
- Falls back to direct text manipulation for input elements

### Build System
- Turborepo manages monorepo builds
- Vite for fast development and building
- ESBuild for extension script bundling
- Environment-specific builds via cross-env

### Testing
- WebDriverIO for end-to-end testing
- Tests extension functionality across different browsers
- Automated zip creation and testing pipeline