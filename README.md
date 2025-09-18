# PromptBear Chrome Extension

<div align="center">

![](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![](https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![](https://badges.aleen42.com/src/vitejs.svg)
![](https://img.shields.io/badge/Chrome_Extension-MV3-green?style=flat-square)

**Language**: [English](README.md) | [繁體中文](README.zh-TW.md)

</div>

## Introduction

PromptBear is a powerful productivity Chrome extension designed for managing and inserting text snippets (code snippets). It allows users to quickly insert predefined text content into any webpage through custom shortcuts, significantly boosting work efficiency.

### Core Features

- **Smart Text Insertion**: Support for quick text snippet insertion on any webpage
- **Custom Shortcuts**: Set unique keyboard combinations for each snippet
- **Folder Management**: Organize your code snippets and text templates systematically
- **Shared Folders**: Share snippets with team members with permission management
- **Smart Forms**: Support dynamic forms with variable input during insertion
- **Cloud Sync**: Seamless integration with PromptBear platform for cloud storage and sync
- **Context Menu**: Right-click to add selected text directly to PromptBear platform
- **Sidebar Management**: Convenient sidebar interface for managing all snippets

### 🎯 Use Cases

- **Programming**: Quick insertion of common code templates and function snippets
- **Customer Service**: Standardized customer service reply templates
- **Email Templates**: Common email formats and signatures
- **Social Media**: Preset reply content and hashtags

## 🏗️ Technical Architecture

This project adopts a modern frontend technology stack based on Chrome Extension Manifest V3 specification:

### Core Technologies

- **Framework**: React 18.3.1 + TypeScript 5.5.4
- **Build Tool**: Vite 6.0.5 + Turborepo 2.3.3
- **UI Framework**: Tailwind CSS 3.4.14
- **Content Editor**: TipTap 2.26.1 (Rich text editing)
- **Package Manager**: pnpm 9.15.1 (Monorepo management)

### Project Structure

```
snippets-extension/
├── chrome-extension/          # Extension core
│   ├── src/background/        # Background Script (Service Worker)
│   ├── manifest.js           # Manifest configuration
│   └── public/               # Static assets (icons, etc.)
├── pages/                    # Various page components
│   ├── content/              # Content Script (core insertion logic)
│   ├── content-ui/           # Sidebar UI interface
│   ├── popup/                # Popup window
│   ├── options/              # Settings page
│   ├── side-panel/           # Side panel
│   └── ...                   # Other pages
├── packages/                 # Shared packages
│   ├── shared/               # Shared utilities and types
│   ├── storage/              # Storage management
│   ├── i18n/                 # Internationalization
│   └── ...                   # Other packages
└── tests/                    # E2E tests
```

## 📦 Installation & Development

### System Requirements

- Node.js >= 20
- pnpm >= 9.15.1
- Chrome/Firefox browser

### Development Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/Eva813/snippets-extension.git
cd snippets-extension
```

2. **Install dependencies**
```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Install project dependencies
pnpm install
```

3. **Development mode**
```bash
# Chrome development
pnpm dev

# Firefox development
pnpm dev:firefox
```

4. **Load the extension**

**Chrome:**
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

**Firefox:**
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `dist/manifest.json` file

### Production Build

```bash
# Chrome build
pnpm build

# Firefox build
pnpm build:firefox

# Build and package ZIP
pnpm zip
```

## Main Feature Modules

### 1. Content Script System
- **Location**: `pages/content/`
- **Function**: Responsible for inserting text snippets into webpages
- **Core Files**:
  - `input/inputHandler.ts`: Handle various input fields
  - `cursor/cursorTracker.ts`: Cursor position tracking
  - `prompt/promptManager.ts`: Snippet cache management

### 2. Background Script
- **Location**: `chrome-extension/src/background/`
- **Function**: Extension's core logic and API communication
- **Main Features**:
  - User login status management
  - API request handling
  - Context menu functionality
  - Snippet data synchronization

### 3. Sidebar UI
- **Location**: `pages/content-ui/`
- **Function**: Provides visual snippet management interface
- **Features**:
  - Folder browsing
  - Snippet search
  - Shared folder management
  - Real-time insertion preview

### 4. Sharing System
- **Function**: Support team collaboration with snippet sharing
- **Permission Management**: View/edit permission control
- **API Integration**: Seamless integration with PromptBear platform

## 🛠️ Development Commands

```bash
# Development
pnpm dev                    # Start Chrome development mode
pnpm dev:firefox           # Start Firefox development mode

# Build
pnpm build                 # Production build (Chrome)
pnpm build:firefox         # Production build (Firefox)
pnpm zip                   # Build and package ZIP

# Code Quality
pnpm lint                  # ESLint check
pnpm lint:fix              # Auto-fix ESLint issues
pnpm prettier              # Prettier formatting
pnpm type-check            # TypeScript type checking

# Testing
pnpm e2e                   # E2E testing
pnpm e2e:firefox           # Firefox E2E testing

# Cleanup
pnpm clean                 # Clean all build files
pnpm clean:install         # Reinstall dependencies
```

## API Integration

This extension integrates with the PromptBear platform (`https://linxly-nextjs.vercel.app`):

### Main API Endpoints
- **User Authentication**: `/api/auth/*`
- **Snippet Management**: `/api/v1/prompts/*`
- **Folder Management**: `/api/v1/folders/*`
- **Sharing Features**: `/api/v1/shared-folders/*`

### Environment Configuration
Create a `.env` file to set environment variables:
```bash
VITE_API_DOMAIN=https://linxly-nextjs.vercel.app
VITE_VERCEL_PREVIEW_BYPASS=your_bypass_token
```

## 🚢 Deployment & Publishing

### Automated Deployment
The project is configured with GitHub Actions automated workflows:

1. **Version Release**: `pnpm update-version` to update version number
2. **Build & Package**: Automatically build Chrome and Firefox versions
3. **Store Upload**: Automatically upload to extension stores (requires API key configuration)

### Manual Deployment
```bash
# 1. Update version number
pnpm update-version

# 2. Build and package
pnpm zip

# 3. Upload to Chrome Web Store or Firefox Add-ons
```

### Code Standards
- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Run `pnpm lint` and `pnpm type-check` before committing
- Add appropriate tests for new features


---

**Developed and maintained by [Eva813](https://github.com/Eva813)**

> 💡 **Tip**: This extension aims to enhance the productivity of developers and content creators. If you have any suggestions for improvement or encounter issues, feel free to contact us anytime!