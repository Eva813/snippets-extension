# Implementation Plan: Retro Neobrutalism UI 遷移

**Branch**: `001-retro-neobrutalism-ui` | **Date**: 2025-11-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-retro-neobrutalism-ui/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

將 Chrome/Firefox 擴充功能的所有 UI 元件遷移至 Retro Neobrutalism 設計風格,包含粗邊框(最小 2px)、偏移陰影效果、互動式按鈕動畫,以及高對比色彩方案。使用 Tailwind CSS 自訂設定實現設計標記(design tokens),確保在所有擴充功能頁面(popup、side-panel、content-ui、options、new-tab)上保持視覺一致性,同時維持 WCAG 2.1 AA 可訪問性標準和既有功能完整性。

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: React 18, Vite 5, Tailwind CSS 3.x, Turborepo (monorepo)
**Storage**: chrome.storage.local (用於擴充功能資料持久化)
**Testing**: WebDriverIO (E2E 測試), 支援 Chrome 和 Firefox
**Target Platform**: Chrome/Firefox Extensions (Manifest V3), 最小支援版本 Chrome 88+, Firefox 109+
**Project Type**: Web (monorepo 結構,包含多個擴充功能頁面和共享套件)
**Performance Goals**:
- 按鈕懸停回饋 < 100ms (FR-001, SC-001)
- 動畫過渡時間 100-300ms (FR-006)
- CSS transform 硬體加速用於流暢動畫 (60fps)
**Constraints**:
- 僅使用 Tailwind CSS 實用類別,無自訂 CSS 檔案 (FR-012)
- 遵守 `prefers-reduced-motion` 媒體查詢 (FR-007)
- 維持 WCAG 2.1 AA 對比度比率 4.5:1 (FR-014, SC-003)
- 不影響既有功能和 UX (憲法原則 III)
**Scale/Scope**:
- 5 個擴充功能頁面 (popup, side-panel, content-ui, options, new-tab)
- 共享 UI 套件 (packages/ui) 包含可重用元件
- 預估 20-30 個 React 元件需要樣式更新

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Type Safety & Code Quality ✅ PASS
- **Status**: 符合 - 僅樣式變更,不涉及型別修改
- **Actions**:
  - 確保所有 React 元件的 className props 保持型別安全
  - Tailwind 設定擴展必須通過 TypeScript 類型檢查
  - 執行 `pnpm type-check` 驗證無型別錯誤

### II. Testing Standards ⚠️ REQUIRES ATTENTION
- **Status**: 需要行動 - E2E 測試必須涵蓋視覺回歸
- **Actions**:
  - 為關鍵 UI 元件(按鈕、輸入框、卡片)建立視覺回歸測試
  - 驗證動畫在兩個瀏覽器(Chrome/Firefox)上正確運作
  - 測試 `prefers-reduced-motion` 媒體查詢行為
  - 驗證鍵盤導航和焦點狀態視覺回饋

### III. User Experience Consistency ✅ PASS
- **Status**: 符合 - 本功能核心目標即為建立一致 UX
- **Actions**:
  - 所有 UI 元件在 Chrome 和 Firefox 上呈現相同視覺效果
  - 響應式設計支援最小 320px 至 1920px 寬度 (SC-005)
  - 動畫使用 CSS transform(硬體加速)確保流暢性
  - 錯誤狀態、載入狀態保持視覺一致性

### IV. Performance Requirements ✅ PASS
- **Status**: 符合 - 已定義明確效能目標
- **Performance Targets**:
  - 按鈕懸停回饋 < 100ms (FR-001, SC-001)
  - 動畫過渡 100-300ms (FR-006)
  - 使用 CSS transforms 達成 60fps 動畫
- **Optimization Strategy**:
  - 純 CSS 動畫(無 JavaScript),減少主執行緒負擔
  - 使用 `will-change` 提示瀏覽器優化
  - Tailwind JIT 模式確保最小 CSS bundle size

### V. Browser Compatibility & Extension Architecture ✅ PASS
- **Status**: 符合 - 不影響擴充功能架構
- **Actions**:
  - 樣式變更不涉及 service worker、content script 通訊邏輯
  - Tailwind 設定在 packages/tailwind-config 集中管理
  - 共享 UI 元件(packages/ui)確保跨頁面一致性
  - Chrome 和 Firefox build 使用相同 Tailwind 設定

### Security & Privacy Standards ✅ PASS
- **Status**: 符合 - 純視覺變更,無安全影響
- **Verification**: 不涉及資料處理、API 呼叫或權限變更

### Documentation Language ✅ PASS
- **Status**: 符合 - 所有規格文件使用繁體中文
- **Files**: spec.md, plan.md, research.md, data-model.md, quickstart.md 均為繁體中文

**整體評估**: ✅ **通過 - 可進入 Phase 0 研究階段**

**重點行動項目**:
1. 建立視覺回歸測試策略 (Phase 1)
2. 定義 Tailwind 自訂實用類別用於新野獸主義設計 (Phase 0 研究)
3. 確保可訪問性(WCAG AA)在色彩對比和焦點狀態上 (Phase 1)

---

## Constitution Check - 設計階段後重新評估

*Phase 1 完成日期: 2025-11-11*

### 設計成果檢視

以下設計文件已完成:

1. ✅ **research.md** - 技術研究與決策記錄
   - Tailwind 新野獸主義實現策略
   - 可訪問性動畫模式
   - WCAG 色彩對比度驗證與修正

2. ✅ **data-model.md** - 設計標記資料模型
   - ColorToken, ShadowToken, BorderToken, AnimationToken 定義
   - 型別安全介面設計
   - 驗證規則與關係圖

3. ✅ **quickstart.md** - 開發者快速上手指南
   - 常見任務範例 (Button, Card, Input 元件)
   - 疑難排解指南
   - 測試與部署檢查清單

### 重新評估結果

#### I. Type Safety & Code Quality ✅ PASS (維持)
- **狀態**: 設計階段未引入型別問題
- **新增驗證**:
  - `packages/shared/src/types/design-tokens.ts` 型別定義完整
  - 所有設計標記介面具備明確型別註解
  - data-model.md 中的 TypeScript 範例通過靜態檢查

#### II. Testing Standards ✅ PASS (改進)
- **狀態**: 測試策略已於 quickstart.md 定義
- **已規劃測試**:
  - E2E 視覺回歸測試 (WebDriverIO)
  - 手動測試清單 (視覺、可訪問性、跨瀏覽器)
  - `prefers-reduced-motion` 自動化測試範例
- **實現階段行動**:
  - 建立 `e2e/specs/ui-visual-regression.spec.ts`
  - 為關鍵元件 (Button, Input, Card) 添加快照測試

#### III. User Experience Consistency ✅ PASS (強化)
- **狀態**: 設計系統確保跨頁面一致性
- **設計保證**:
  - 所有元件狀態 (default, hover, active, focus) 統一定義
  - ComponentState 實體模型強制一致性
  - quickstart.md 提供遷移指南確保漸進式更新

#### IV. Performance Requirements ✅ PASS (優化)
- **狀態**: 效能優化策略已記錄
- **設計決策**:
  - 所有動畫使用 CSS Transform (GPU 加速)
  - 動畫時間 100-300ms 符合效能目標
  - Tailwind bundle size 預估增量 +6.7% (可接受)
- **監控計劃**: quickstart.md 包含 bundle size 監控指令

#### V. Browser Compatibility & Extension Architecture ✅ PASS (維持)
- **狀態**: 設計不影響擴充功能架構
- **確認事項**:
  - 樣式變更隔離於 UI 層,不影響 background/content scripts
  - Tailwind 設定支援 Chrome 和 Firefox 構建
  - 共享套件架構 (packages/ui, packages/tailwind-config) 保持不變

#### Security & Privacy Standards ✅ PASS (維持)
- **狀態**: 純視覺變更,無新安全風險
- **確認**: 無資料處理、API 或權限變更

#### Documentation Language ✅ PASS (維持)
- **狀態**: 所有文件使用繁體中文
- **完成文件**: spec.md, plan.md, research.md, data-model.md, quickstart.md

### 新發現的風險與緩解

#### 風險 1: Tailwind JIT 類別遺失
- **發現階段**: Research
- **緩解策略**: 使用 `safelist` + 正確 `content` 路徑配置
- **文件化**: quickstart.md 疑難排解章節

#### 風險 2: 色彩調整影響品牌識別
- **發現階段**: WCAG 驗證
- **緩解策略**: 文件記錄調整理由,提供替代色彩選項
- **決策記錄**: research.md 決策 3

#### 風險 3: 動畫效能在低階裝置
- **發現階段**: Performance analysis
- **緩解策略**: 使用 `transform-gpu`, 避免 layout thrashing
- **測試計劃**: E2E 測試包含效能監控

### 實現階段必要行動

Phase 2 (Tasks generation) 必須包含:

1. **型別安全驗證任務**:
   - 實現 `design-tokens.ts` 型別定義
   - 為 Tailwind config 添加型別檢查
   - 執行 `pnpm type-check` 確保無錯誤

2. **測試實現任務**:
   - 建立視覺回歸測試套件
   - 實現 `prefers-reduced-motion` 測試
   - 添加 Lighthouse accessibility audit

3. **效能監控任務**:
   - 設定 bundle size 上限 (480KB 未壓縮)
   - 添加 CI 管道效能檢查
   - 驗證動畫 60fps 目標

**Phase 1 評估結論**: ✅ **所有憲法原則維持合規,可進入 Phase 2 (Tasks)**

**批准者**: Claude AI Agent
**批准日期**: 2025-11-11

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Monorepo 結構 (Turborepo)
├── chrome-extension/           # Chrome 擴充功能入口點
│   └── src/
│       ├── background/         # Service worker (不涉及 UI 變更)
│       └── manifest.json
│
├── pages/                      # 擴充功能 UI 頁面 (主要變更區域)
│   ├── content/                # Content script (minimal UI impact)
│   ├── content-ui/             # ⭐ React 側邊欄覆蓋層 UI (重點變更)
│   │   └── src/
│   │       ├── components/     # 側邊欄元件 (按鈕、卡片、輸入框)
│   │       └── index.tsx
│   ├── side-panel/             # ⭐ Chrome 原生側邊面板 (重點變更)
│   │   └── src/
│   │       ├── components/     # 表單、清單元件
│   │       └── index.tsx
│   ├── popup/                  # ⭐ 擴充功能彈出視窗 (變更)
│   ├── options/                # ⭐ 選項頁面 (變更)
│   └── new-tab/                # ⭐ 新分頁頁面 (變更)
│
├── packages/                   # 共享套件
│   ├── ui/                     # ⭐⭐ 共享 UI 元件庫 (核心變更)
│   │   └── lib/
│   │       ├── components/     # Button, Input, Card, Modal 等
│   │       └── index.ts
│   ├── tailwind-config/        # ⭐⭐ Tailwind 設定 (核心變更)
│   │   ├── tailwind.config.ts  # 主題擴展、自訂實用類別
│   │   └── base.css            # CSS 變數定義
│   ├── shared/                 # 共享型別和工具 (minimal impact)
│   ├── storage/                # Chrome storage helpers (no change)
│   ├── i18n/                   # 國際化 (no change)
│   └── hmr/                    # HMR (no change)
│
└── e2e/                        # E2E 測試 (新增視覺回歸測試)
    └── specs/
        └── ui-visual-regression.spec.ts  # 新增
```

**Structure Decision**:

此功能採用 **Turborepo monorepo 架構**,主要變更集中在:

1. **packages/tailwind-config/** - 定義新野獸主義設計標記(邊框、陰影、色彩、動畫)
2. **packages/ui/** - 更新共享 UI 元件以應用新設計系統
3. **pages/** - 將新設計套用至所有擴充功能頁面,特別是:
   - **content-ui** - 側邊欄覆蓋層(用戶主要互動介面)
   - **side-panel** - Chrome 原生側邊面板
   - **popup**, **options**, **new-tab** - 其他用戶介面

**變更策略**: 自下而上(bottom-up)
- 先更新 `packages/tailwind-config` 和 `packages/ui`
- 再將變更傳播至各個 `pages/*` 頁面
- 確保 Turborepo 緩存失效並重新建構所有依賴套件

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: ✅ 無違反憲法原則,無需複雜度追蹤

所有憲法檢查項目均通過,此功能為純視覺變更,不引入額外架構複雜度。
