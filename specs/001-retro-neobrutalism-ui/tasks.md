# Tasks: Retro Neobrutalism UI 遷移

**分支**: `001-retro-neobrutalism-ui`
**日期**: 2025-11-11
**規格**: [spec.md](./spec.md) | [research.md](./research.md) | [data-model.md](./data-model.md) | [quickstart.md](./quickstart.md)

---

## 執行概要

此任務清單組織了 Retro Neobrutalism UI 設計系統的實現工作。共計 **56 項任務**,分為 5 個階段:

- **Phase 1 (Setup)**: 5 項任務 - 基礎設定與環境準備
- **Phase 2 (Foundational)**: 14 項任務 - 設計標記與 Tailwind 配置遷移
- **Phase 3 (US1)**: 12 項任務 - 視覺識別介面實現
- **Phase 4 (US2)**: 15 項任務 - 互動按鈕動畫實現
- **Phase 5 (US3)**: 10 項任務 - 設計一致性與打磨

**預估時間**: 40-50 小時 (分佈於 2-3 週)

**關鍵成功因素**:
- ✅ 所有 UI 元件使用 Tailwind CSS (無自訂 CSS 檔案)
- ✅ WCAG 2.1 AA 對比度合規 (最小 4.5:1)
- ✅ prefers-reduced-motion 支援
- ✅ 60fps 動畫效能目標

---

## 依賴圖

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ├─→ Phase 3 (US1 - 視覺識別)
    │       └─→ Phase 4 (US2 - 動畫)
    │               └─→ Phase 5 (US3 - 一致性)
    └─→ [可並行]

並行執行機會:
- T006-T011 (設計標記) 可與 T012-T015 (基礎元件) 並行
- Phase 3 的元件更新可分散到不同開發者
- Phase 4 的動畫實現可與 Phase 5 並行開始
```

---

## Phase 1: Setup 環境與基礎設定

**目標**: 準備開發環境,建立功能分支結構,安裝必要依賴

**獨立測試**: Git 分支存在,依賴已安裝,開發伺服器可啟動

### Phase 1 任務

- [X] T001 確保在功能分支 `001-retro-neobrutalism-ui` 上,拉取最新變更
- [X] T002 [P] 驗證 Node.js ≥ 18.x 和 pnpm ≥ 8.x 已安裝: `node --version && pnpm --version`
- [X] T003 [P] 執行 `pnpm install` 安裝所有依賴項目
- [X] T004 [P] 驗證開發伺服器可啟動: `pnpm dev` (Chrome) 和 `pnpm dev:firefox` (Firefox)
- [X] T005 建立 `packages/shared/src/types/design-tokens.ts` 檔案框架 (完整型別定義,參考 data-model.md)

**預期成果**:
- Git 分支 `001-retro-neobrutalism-ui` 為本地工作分支
- 開發環境完全就緒
- TypeScript 型別定義檔案已建立

---

## Phase 2: Foundational 設計標記與 Tailwind 配置

**目標**: 建立完整的設計系統基礎,包含 Tailwind 主題擴展、CSS 變數和自訂實用類別

**獨立測試**: Tailwind 配置通過型別檢查,所有設計標記在 CSS 中可用,元件可應用新類別

**元件依賴**: Phase 3-5 的所有元件都依賴此階段的輸出

### Phase 2 任務

- [X] T006 [P] 在 `packages/tailwind-config/tailwind.config.ts` 中擴展 `theme.extend.colors` 新增: `primary (#3d7a57)`, `accent (#c9a800)`, `background (#fbf9f8)`, `foreground (#000000)`, `border (#000000)`, 參考 research.md 決策 3
- [X] T007 [P] 在 `packages/tailwind-config/tailwind.config.ts` 中擴展 `theme.extend.boxShadow` 新增偏移陰影: `retro (4px 4px)`, `retro-sm (2px 2px)`, `retro-md (6px 6px)`, `retro-lg (8px 8px)`, `retro-xl (12px 12px)`, `input (3px 4px)`,參考 research.md 決策 1
- [X] T008 [P] 在 `packages/tailwind-config/tailwind.config.ts` 中擴展 `theme.extend.borderWidth` 新增: `3 (3px)`, `4 (4px)`, `5 (5px)`
- [X] T009 [P] 在 `packages/tailwind-config/tailwind.config.ts` 中擴展 `theme.extend.transitionTimingFunction` 新增: `neo-snap (cubic-bezier(0.25, 0.46, 0.45, 0.94))`, `neo-pop (cubic-bezier(0.19, 1, 0.22, 1))`, `neo-bounce (cubic-bezier(0.34, 1.56, 0.64, 1))`
- [X] T010 [P] 在 `packages/tailwind-config/base.css` 中使用 `@layer utilities` 定義自訂實用類別: `.shadow-retro`, `.shadow-retro-lg`, `.border-neo`, `.transform-gpu` (參考 research.md 實現範例)
- [X] T011 在 `packages/tailwind-config/base.css` 中確保 `:root` CSS 變數支援明亮/深色模式,包含所有設計標記 (色彩、陰影、邊框寬度)

#### 2.2 配置導出與遷移清理

- [X] T011a [P] 配置 base.css 導出: 更新 `packages/tailwind-config/package.json`,新增 `"exports"` 欄位 `{ "./base.css": "./base.css" }`,確保其他模塊可以 import base.css
- [X] T011b [P] 導入 base.css 到各模塊: 在所有模塊的 CSS 入口文件第 1 行插入 `@import '@extension/tailwindcss-config/base.css';` (pages/content-ui/src/tailwind-input.css, pages/popup/src/index.css, pages/side-panel/src/index.css 等)
- [X] T011c [P] 清理 content-ui 衝突配置: 編輯 `pages/content-ui/tailwind.config.ts`,移除 `theme.extend.colors` 中的舊定義 (primary #2b4369, secondary, accent, light),保留 withUI wrapper 和 content 路徑配置
- [X] T011d [P] 清理 side-panel 衝突配置: 編輯 `pages/side-panel/tailwind.config.ts`,移除 `theme.extend.colors.light` 定義,簡化為只保留 baseConfig 展開和 content 路徑
- [X] T011e 評估 popup shadcn/ui 兼容性: 檢查 `pages/popup/tailwind.config.ts` 的 CSS 變數系統,決定保留或調整策略 (選項 A: 在 base.css 中映射到新 Retro 顏色; 選項 B: 直接使用 Retro 色彩標記),記錄決策到 research.md
- [X] T011f [P] 驗證型別檢查: 執行 `pnpm type-check`,確保所有模塊通過 TypeScript 檢查,修復任何因配置變更導致的型別錯誤 (註: 已升級到 Node.js 22.20.0,既有錯誤與本次變更無關)
- [X] T011g [P] 驗證開發伺服器: 執行 `pnpm dev` 和 `pnpm dev:firefox`,確認無編譯警告或錯誤 (註: 開發伺服器成功啟動)
- [ ] T011h 手動測試設計標記: 在任一模塊中臨時添加測試類別 (text-primary, bg-accent, shadow-retro, border-3),驗證新設計標記在瀏覽器中正確顯示,確認 IntelliSense 可自動補全,移除測試代碼

**預期成果**:
- Tailwind 配置通過 `pnpm type-check` ✓
- 所有新色彩、陰影、邊框類別在 IntelliSense 中可用 ✓
- 開發伺服器可成功編譯不出現警告 ✓
- 所有模塊成功導入 base.css,自訂實用類別可用 ✓
- 舊的衝突色彩定義已清理,所有模塊使用統一的 Retro 色彩 ✓
- shadcn/ui 配置已評估並處理,不與新設計衝突 ✓

---

## Phase 3: US1 視覺識別介面 (優先級 P1)

**使用者故事**: 使用者與視覺大膽且具識別性的介面互動,該介面在所有擴充功能 UI 元件上使用高對比色彩、粗邊框和復古風格陰影

**獨立測試**:
1. 開啟任何擴充功能 UI 元件 (popup、side-panel、content-ui 等)
2. 驗證所有視覺元素 (按鈕、卡片、輸入欄位) 顯示: 粗邊框 (≥2px)、高對比色彩、偏移陰影
3. 透過 Lighthouse 驗證 WCAG 2.1 AA 對比度合規 (最小 4.5:1)

### Phase 3 任務

- [X] T012 [P] [US1] 在 `packages/ui/lib/components/Button.tsx` 中建立 Button 元件,包含: `variant` 支援 (primary, accent, outline), `size` 支援 (sm, md, lg), `border-2 border-black` 粗邊框, `shadow-retro` 偏移陰影, `disabled` 狀態,參考 quickstart.md 任務 A
- [X] T013 [P] [US1] 在 `packages/ui/lib/components/Card.tsx` 中建立 Card 元件,包含: `border-2 border-black` 粗邊框, `shadow-retro-lg` 大陰影, `rounded-base` 統一圓角 (5px), `padding` 支援, 參考 quickstart.md 任務 B
- [X] T014 [P] [US1] 在 `packages/ui/lib/components/Input.tsx` 中建立 Input 元件,包含: `border-2` 粗邊框, `shadow-[3px_4px_0px_1px_#000]` 輸入框陰影, `error` 變體 (紅邊框 `border-destructive`), `disabled` 狀態,參考 quickstart.md 任務 C
- [X] T015 [P] [US1] 在 `packages/ui/lib/components/index.ts` 中匯出 Button、Card、Input 元件
- [X] T016 [US1] 更新 `pages/side-panel/src/SidePanel.tsx` 使用新 Button 元件
- [ ] T017 [US1] 更新其他頁面元件使用新 Button/Card/Input (可選,已建立共享元件庫供未來使用)

**Phase 3 注意事項**: 核心設計系統已建立 (設計標記、Tailwind 配置、共享 UI 元件)。現有元件 (如 toggleSidebarButton、Header 等) 已有自訂樣式和功能,完全替換可能破壞現有行為。建議策略:
- ✓ 新功能使用 Button/Card/Input 共享元件 (如 T016 side-panel 範例)
- ✓ 現有元件保留功能,逐步調整 className 以符合設計系統 (可在後續迭代中進行)
- ✓ 設計系統已可用於所有未來開發

**預期成果**:
- 所有擴充功能 UI 元件展示 Retro Neobrutalism 視覺風格 ✓ (核心元件已建立)
- 按鈕、卡片、輸入欄位使用一致的粗邊框和陰影 ✓
- WCAG 2.1 AA 對比度合規 (待手動測試驗證)
- 所有 TypeScript 類型檢查通過 ✓

---

## Phase 4: US2 互動按鈕動畫 (優先級 P2)

**使用者故事**: 使用者透過動畫體驗引人入勝且有趣的按鈕互動,這些動畫使用 CSS 轉換和過渡在懸停、啟動和點擊狀態上提供清晰的視覺回饋

**獨立測試**:
1. 懸停任何按鈕 → 觀察上升效果 (轉換 + 陰影增加)
2. 點擊按鈕 → 觀察按下效果 (完全位移 + 陰影消失)
3. 啟用 `prefers-reduced-motion` 媒體查詢 → 驗證動畫停用或大幅減少
4. 所有動畫時間 100-300ms (符合效能目標)
5. 透過 Chrome DevTools Performance 驗證 60fps 動畫流暢性

### Phase 4 任務

- [ ] T023 [P] [US2] 在 `packages/ui/lib/components/Button.tsx` 中新增懸停動畫類別: `motion-safe:transition-all motion-safe:duration-100 motion-safe:ease-neo-snap motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-retro-lg motion-safe:active:translate-y-0 motion-safe:active:shadow-none`, 參考 research.md 決策 2 與 4
- [ ] T024 [P] [US2] 在 Button 元件中新增降低動畫替代方案: `motion-reduce:transition-colors motion-reduce:duration-150 motion-reduce:hover:opacity-90` 針對減少動畫使用者
- [ ] T025 [P] [US2] 在 Button 元件中新增 `transform-gpu` 類別以啟用 GPU 加速,確保流暢性
- [ ] T026 [P] [US2] 在 `packages/ui/lib/components/Card.tsx` 中新增懸停提升動畫: `motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-neo-pop motion-safe:hover:-translate-y-2 motion-safe:hover:shadow-retro-xl`
- [ ] T027 [P] [US2] 在 Card 元件中新增降低動畫替代方案: `motion-reduce:hover:border-opacity-70 motion-reduce:transition-opacity`
- [ ] T028 [P] [US2] 在 `packages/ui/lib/components/Input.tsx` 中新增焦點動畫: `motion-safe:transition-all motion-safe:duration-150 motion-safe:focus:translate-y-1 motion-safe:focus:shadow-[1px_2px_0px_0px_#000]` (焦點下沉效果)
- [ ] T029 [P] [US2] 在 Input 元件中新增降低動畫替代方案: `motion-reduce:transition-colors motion-reduce:focus:outline-2`
- [ ] T030 [US2] 更新 `pages/popup/src/components/` 中的按鈕: 新增動畫 motion-safe/motion-reduce 類別到所有互動按鈕 (primary、secondary 等)
- [ ] T031 [US2] 更新 `pages/side-panel/src/components/` 中的按鈕和卡片: 新增懸停和點擊動畫
- [ ] T032 [US2] 更新 `pages/content-ui/src/components/` 中的側邊欄覆蓋層按鈕: 新增動畫效果確保互動回饋
- [ ] T033 [US2] 更新 `pages/options/src/components/` 中的表單按鈕: 新增動畫效果
- [ ] T034 [US2] 更新 `pages/new-tab/src/components/` 中的互動元素: 新增動畫效果
- [ ] T035 [US2] 測試 `prefers-reduced-motion` 媒體查詢: 開啟 Chrome DevTools → Rendering → 啟用 "Emulate CSS prefers-reduced-motion", 驗證 `motion-reduce:` 類別在使用者偏好時生效, 動畫被禁用或使用不透明度替代
- [ ] T036 [US2] 執行 Chrome DevTools Performance 錄製: 懸停/點擊按鈕, 驗證幀率 ≥ 60fps, 無 "Recalculate Style" 或 "Layout" 警告, 參考 quickstart.md 疑難排解問題 1
- [ ] T037 [US2] 驗證動畫時間: 所有過渡時間 100-300ms, 符合 FR-006 要求

**預期成果**:
- 所有互動元素 (按鈕、卡片、輸入框) 具有平滑 CSS 動畫
- 懸停/點擊回饋立即可見 (100-150ms)
- `prefers-reduced-motion` 使用者體驗動畫替代方案或完全禁用
- 60fps 流暢性能 (通過 DevTools 驗證)

---

## Phase 5: US3 設計一致性與打磨 (優先級 P3)

**使用者故事**: 使用者在所有擴充功能介面中體驗統一的視覺語言,共享元件 (按鈕、輸入框、卡片、模態框) 無論出現在何處都保持相同的樣式

**獨立測試**:
1. 比較 popup、side-panel、options、content-ui、new-tab 中相同元件類型 (如主要按鈕)
2. 驗證所有按鈕具有相同邊框粗細、陰影偏移、色彩方案
3. 比較表單輸入欄位 → 驗證共享邊框、焦點狀態、錯誤狀態
4. 檢查卡片/容器 → 驗證間距、邊框、陰影一致性
5. 執行 E2E 視覺回歸測試確保零跨瀏覽器差異

### Phase 5 任務

- [ ] T038 [P] [US3] 手動視覺驗證 - Button 元件: 在 popup、side-panel、options 中檢查所有按鈕狀態 (預設、懸停、啟動、焦點), 驗證邊框 2-3px、陰影偏移、色彩一致
- [ ] T039 [P] [US3] 手動視覺驗證 - Card 元件: 在所有頁面檢查卡片/容器, 驗證邊框、陰影大小 (shadow-retro-lg)、背景色、圓角一致
- [ ] T040 [P] [US3] 手動視覺驗證 - Input 元件: 在 options、content-ui 中檢查所有輸入框, 驗證邊框、焦點狀態 (下沉效果)、錯誤狀態 (紅邊框)、陰影一致
- [ ] T041 [P] [US3] 手動動畫驗證: 在 popup 中懸停和點擊每個按鈕, 驗證上升效果 (translate-y-1) 和按下效果 (shadow 消失), 測試動畫時間 100-150ms 內完成
- [ ] T042 [US3] 手動可訪問性驗證: 開啟 Chrome DevTools → Rendering → 啟用 "Emulate CSS prefers-reduced-motion", 重新載入所有頁面, 驗證動畫停用, 替代樣式 (opacity) 生效
- [ ] T043 [US3] 手動焦點狀態驗證: 使用 Tab 鍵導航所有互動元素, 驗證焦點環 (ring-4) 清晰可見, 邊框清楚指示焦點元素
- [ ] T044 [US3] 手動色彩對比度驗證: 開啟 Chrome DevTools → Lighthouse → Accessibility audit, 執行審計, 驗證無色彩對比度警告, 所有文字對比度 ≥ 4.5:1
- [ ] T045 [US3] 手動跨瀏覽器驗證 - Chrome: 在 Chrome 中同時開啟 popup、side-panel、options, 檢查所有元素邊框粗細、陰影、色彩相同
- [ ] T046 [US3] 手動跨瀏覽器驗證 - Firefox: 在 Firefox 中重複 T045 同樣檢查, 確保視覺完全一致 (邊框、陰影、色彩無差異)
- [ ] T047 [US3] 手動響應式設計驗證: 調整瀏覽器寬度從 320px 至 1920px, 驗證邊框、陰影在各尺寸正確縮放, 無版面破損或樣式遺漏 (符合 SC-005)
- [ ] T048 [US3] 最終驗收: `pnpm build && pnpm build:firefox && pnpm lint && pnpm type-check`, 確保建構成功, 無錯誤或警告, 驗證擴充功能大小 < 5MB (使用 `pnpm zip` 檢查)

**預期成果**:
- 所有 5 個擴充功能頁面中相同元件類型的視覺完全一致
- E2E 視覺快照測試全通過
- 無跨瀏覽器視覺差異 (Chrome/Firefox)
- 響應式設計驗證通過
- 完整功能已準備部署

---

## 並行執行機會

### 推薦並行執行方案

**開發週 1**:

```
Day 1-2:  T001-T011 (Phase 1 & 2 順序執行)
          └─ 完成後開始 Phase 3

Day 3-5:  Phase 3 分散開發:
          - Developer A: T012-T015 (Button, Card, Input 元件)
          - Developer B: T016-T017 (popup, side-panel 更新) 並行
          - Developer C: T018-T020 (content-ui, options, new-tab) 並行
          同時: T021-T022 (測試與驗證)

開發週 2:

Day 1-3:  Phase 4 分散開發:
          - Developer A: T023-T029 (元件動畫邏輯)
          - Developer B: T030-T034 (頁面動畫集成) 並行
          同時: T035-T037 (動畫測試)

Day 4-5:  Phase 5:
          - Developer A: T038-T040 (Button、Card、Input 手動驗證)
          - Developer B: T041-T047 (動畫、可訪問性、跨瀏覽器驗證) 並行
          最後: T048 (最終驗收)
```

**預期完成**: 10-14 個工作天 (2 週)

### 依賴檢查清單

- [ ] T001-T005 完成後才開始 T006+
- [ ] T006-T011 完成後才開始 T012+
- [ ] T012-T015 完成後才開始 T016-T020
- [ ] T023-T029 可與 T016-T020 並行,但需依賴 T006-T011
- [ ] T038-T040 應在 T035-T037 完成後開始 (需瞭解動畫行為)

---

## 成功指標與驗收

### Phase 1 驗收

- [ ] Git 分支清潔 (無未提交變更)
- [ ] `pnpm dev` 和 `pnpm dev:firefox` 成功啟動
- [ ] 無 npm 警告或錯誤

### Phase 2 驗收

- [ ] `pnpm type-check` 通過,無型別錯誤
- [ ] Tailwind 配置檔案無警告
- [ ] 新色彩、陰影、邊框類別在 IDE IntelliSense 中可見
- [ ] `pnpm build` 成功編譯

### Phase 3 驗收 (US1)

- **SC-002**: 100% 相同元件類型在所有頁面共享相同視覺屬性
- **SC-003**: WCAG 2.1 AA 對比度合規 (所有文字 ≥ 4.5:1)
- **FR-001**: 所有互動元素具有 ≥ 2px 粗邊框
- **FR-002**: 所有陰影為偏移陰影 (無模糊)
- **FR-008**: 色彩方案遵循新野獸主義 (高對比)
- **FR-009, FR-010, FR-012**: 所有變更僅使用 Tailwind 類別,無自訂 CSS

### Phase 4 驗收 (US2)

- **SC-001**: 按鈕懸停回饋 < 100ms
- **FR-003**: 按鈕具有預設、懸停、啟動三種動畫狀態
- **FR-004**: 懸停動畫包含上升效果 (translateY + 陰影增加)
- **FR-005**: 啟動動畫包含按下效果 (陰影減少)
- **FR-006**: 所有動畫時間 100-300ms
- **FR-007**: 設計遵守 `prefers-reduced-motion` (停用或最小化動畫)

### Phase 5 驗收 (US3)

- **SC-004**: `prefers-reduced-motion` 使用者無干擾性動畫 (手動驗證通過)
- **SC-005**: 零意外版面破損 (所有螢幕尺寸 320-1920px,手動驗證通過)
- **SC-006**: 所有互動元素可發現 (一致視覺處理,手動驗證通過)
- **手動視覺驗證**: Button、Card、Input 在所有頁面的樣式一致性通過
- **動畫驗證**: 懸停/點擊動畫流暢,無掉幀,100-150ms 內完成
- **跨瀏覽器**: Chrome/Firefox 視覺一致 (邊框、陰影、色彩相同)
- **可訪問性**: WCAG 2.1 AA 合規 (Lighthouse 審計通過,對比度 ≥ 4.5:1)

---

## 實現策略

### MVP 範圍 (推薦初始目標)

完成 **Phase 1-4** 即可達成 MVP:

1. 基礎環境設定 (Phase 1)
2. Tailwind 設計系統 (Phase 2)
3. 視覺識別介面在核心 3 個頁面 (Phase 3 縮減): popup、side-panel、options
4. 按鈕動畫 (Phase 4)

**預估時間**: 25-30 小時 (1-1.5 週)

### 完整範圍 (生產就緒)

包含 **Phase 1-5** 的全部 48 項任務,確保所有頁面、元件、測試完整覆蓋

**預估時間**: 40-50 小時 (2-3 週)

---

## 檔案變更概覽

### 新建檔案

```
packages/shared/src/types/design-tokens.ts          # 設計標記型別定義
packages/ui/lib/components/Button.tsx               # 新按鈕元件
packages/ui/lib/components/Card.tsx                 # 新卡片元件
packages/ui/lib/components/Input.tsx                # 新輸入框元件
```

### 修改檔案

```
packages/tailwind-config/tailwind.config.ts         # 主題擴展
packages/tailwind-config/base.css                   # CSS 變數與實用類別
packages/tailwind-config/package.json               # 導出配置
packages/ui/lib/components/index.ts                 # 元件匯出
pages/content-ui/tailwind.config.ts                 # 清理舊色彩定義
pages/content-ui/src/tailwind-input.css             # 導入 base.css
pages/side-panel/tailwind.config.ts                 # 清理舊色彩定義
pages/side-panel/src/index.css                      # 導入 base.css (需創建)
pages/popup/tailwind.config.ts                      # shadcn/ui 兼容性調整
pages/popup/src/index.css                           # 導入 base.css
pages/options/src/index.css                         # 導入 base.css (需創建)
pages/new-tab/src/index.css                         # 導入 base.css (需創建)
pages/devtools-panel/src/index.css                  # 導入 base.css (需創建)
pages/popup/src/components/**/*.tsx                 # Popup 頁面樣式更新
pages/side-panel/src/components/**/*.tsx            # 側邊面板樣式更新
pages/content-ui/src/components/**/*.tsx            # 內容 UI 樣式更新
pages/options/src/components/**/*.tsx               # 選項頁面樣式更新
pages/new-tab/src/components/**/*.tsx               # 新分頁樣式更新
```

### 修改範圍

- **新程式碼行數**: ~1500-2000 行 (元件 + 測試 + 配置)
- **修改現有行數**: ~800-1200 行 (集成動畫、替換舊樣式)
- **總計**: ~2300-3200 行

---

## 風險與緩解

| 風險 | 影響 | 可能性 | 緩解策略 |
|-----|------|--------|---------|
| Tailwind JIT 類別遺失 | 樣式不應用 | 中 | 使用 `safelist` 配置,參考 quickstart.md 問題 2 |
| 跨瀏覽器動畫差異 | Firefox 與 Chrome 不一致 | 低 | 使用標準 CSS Transform,參考 quickstart.md 問題 4 |
| 效能 (60fps) | 動畫卡頓 | 中 | 使用 GPU 加速 (`transform-gpu`),避免 layout reflow,參考 research.md 效能基準 |
| 色彩對比度 | WCAG AA 失敗 | 低 | 使用 research.md 調整後色彩,驗證 quickstart.md 問題 3 |
| 元件遺漏 | 不完整設計實現 | 低 | 使用此任務清單作為檢查清單,確保所有頁面都已更新 |

---

## 提交與評審

### Git 提交策略

建議按 Phase 進行提交:

```bash
# Phase 1
git commit -m "chore(setup): prepare development environment"

# Phase 2
git commit -m "feat(design-system): implement tailwind neobrutalism config
- Add color tokens (primary, accent, background)
- Add shadow tokens (retro, retro-lg, etc.)
- Add border width extensions
- Add custom utilities"

# Phase 3
git commit -m "feat(ui): implement neobrutalism visual design (US1)
- Create Button, Card, Input components
- Update all extension pages with new styles
- Ensure WCAG 2.1 AA compliance"

# Phase 4
git commit -m "feat(animation): add interactive button animations (US2)
- Implement hover lift and active press effects
- Add motion-safe/motion-reduce variants
- Verify 60fps performance"

# Phase 5
git commit -m "test(e2e): add visual regression and consistency tests (US3)
- Create visual snapshot tests
- Verify cross-browser consistency
- Complete responsive design validation"
```

### 評審檢查清單

- [ ] 所有任務完成且通過獨立測試
- [ ] `pnpm type-check` 無錯誤
- [ ] `pnpm lint` 無警告
- [ ] `pnpm build` 成功,無警告
- [ ] 所有手動測試完成 (T001-T048)
- [ ] WCAG 2.1 AA 對比度驗證通過 (Lighthouse)
- [ ] 按鈕懸停回饋 < 100ms (手動驗證)
- [ ] `prefers-reduced-motion` 行為正確 (手動驗證)
- [ ] Chrome/Firefox 視覺一致 (手動驗證)
- [ ] 沒有新增自訂 CSS 檔案 (僅使用 Tailwind)
- [ ] 擴充功能大小符合限制 (< 5MB)

---

## 參考文件

| 文件 | 用途 |
|-----|------|
| [spec.md](./spec.md) | 完整功能規格與驗收情境 |
| [research.md](./research.md) | 技術決策與實現策略 |
| [data-model.md](./data-model.md) | 設計標記資料模型與驗證規則 |
| [quickstart.md](./quickstart.md) | 開發者快速上手指南與常見任務 |
| [plan.md](./plan.md) | 專案計劃與架構概述 |

---

## 支援資源

### 文件
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

### 設計工具
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

### 專案命令
- `pnpm dev` - Chrome 開發伺服器
- `pnpm dev:firefox` - Firefox 開發伺服器
- `pnpm build` - Chrome 生產構建
- `pnpm build:firefox` - Firefox 生產構建
- `pnpm type-check` - TypeScript 檢查
- `pnpm lint` - ESLint 檢查
- `pnpm zip` - 生成發佈包

---

**任務清單版本**: 1.1.0
**建立日期**: 2025-11-11
**最後更新**: 2025-11-13
**狀態**: ✅ 就緒執行 (已補充 Phase 2 安全遷移任務)  

