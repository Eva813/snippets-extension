# Quickstart: Retro Neobrutalism UI 開發指南

**日期**: 2025-11-11
**分支**: `001-retro-neobrutalism-ui`
**預估完成時間**: 4-6 小時 (首次實現)

---

## 快速導覽

本指南幫助開發者快速上手 Retro Neobrutalism UI 設計系統的開發、測試和部署。適用於:

- ✅ 實現新的 UI 元件
- ✅ 將現有元件遷移至新設計
- ✅ 調試樣式問題
- ✅ 確保可訪問性合規

---

## 前置需求

### 必要工具

- **Node.js**: ≥ 18.x
- **pnpm**: ≥ 8.x
- **Git**: ≥ 2.x
- **瀏覽器**: Chrome 88+ 或 Firefox 109+

### 必要知識

- React 18 基礎
- Tailwind CSS 3.x 熟悉度
- TypeScript 基礎
- CSS Transform 和動畫原理

---

## 5 分鐘快速開始

### 步驟 1: 切換至功能分支

```bash
# 確保在專案根目錄
cd /Users/black-star-point-frontend/snippets-extension

# 切換至功能分支
git checkout 001-retro-neobrutalism-ui

# 拉取最新變更
git pull origin 001-retro-neobrutalism-ui
```

### 步驟 2: 安裝依賴並啟動開發伺服器

```bash
# 安裝依賴 (如果尚未安裝)
pnpm install

# 啟動 Chrome 開發模式
pnpm dev

# 或啟動 Firefox 開發模式
pnpm dev:firefox
```

### 步驟 3: 查看設計系統範例

開啟瀏覽器並導覽至:

- **Popup 頁面**: `chrome-extension://[extension-id]/popup/index.html`
- **Options 頁面**: `chrome-extension://[extension-id]/options/index.html`
- **Side Panel**: 點擊擴充功能圖示 → 開啟側邊面板

### 步驟 4: 測試互動狀態

1. **懸停按鈕**: 觀察提升效果 (向上平移 + 陰影增大)
2. **點擊按鈕**: 觀察按下效果 (完全位移 + 陰影消失)
3. **焦點輸入框**: 觀察下沉效果 (向下平移 + 陰影縮小)

### 步驟 5: 驗證可訪問性

```bash
# 開啟 Chrome DevTools
# 1. 按 Cmd+Shift+P (Mac) 或 Ctrl+Shift+P (Windows)
# 2. 輸入 "Rendering"
# 3. 啟用 "Emulate CSS prefers-reduced-motion"
# 4. 驗證動畫是否停用,替代樣式是否生效
```

---

## 核心概念

### 1. 設計標記 (Design Tokens)

所有樣式值集中定義於 `packages/tailwind-config/`:

```typescript
// packages/tailwind-config/tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: '#3d7a57',      // 主色
        accent: '#c9a800',       // 強調色
        background: '#fbf9f8',   // 背景色
        foreground: '#000000',   // 前景色 (文字)
        border: '#000000',       // 邊框色
      },
      boxShadow: {
        'retro': '4px 4px 0px 0px #000',      // 標準陰影
        'retro-lg': '8px 8px 0px 0px #000',   // 大陰影
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
};
```

### 2. 新野獸主義核心特徵

| 特徵 | 實現方式 | Tailwind 類別 |
|-----|---------|--------------|
| **粗邊框** | 2-3px 實線黑框 | `border-2 border-black` |
| **偏移陰影** | 4px 4px 無模糊陰影 | `shadow-retro` |
| **高對比** | 黑白 + 大膽色彩 | `bg-primary text-white` |
| **按鈕按下** | Transform 位移 + 陰影消失 | `active:translate-y-1 active:shadow-none` |
| **硬體加速** | CSS Transform | `transform-gpu` |

### 3. 動畫可訪問性模式

```tsx
<button className="
  // 基礎樣式 (始終套用)
  px-6 py-3 bg-primary border-2 shadow-retro

  // 動畫 (僅在 motion-safe 時)
  motion-safe:transition-all
  motion-safe:duration-100
  motion-safe:hover:-translate-y-1
  motion-safe:hover:shadow-retro-lg

  // 替代方案 (motion-reduce 時)
  motion-reduce:hover:opacity-90
  motion-reduce:transition-opacity
">
  Click Me
</button>
```

---

## 常見任務

### 任務 A: 建立新的按鈕元件

**目標**: 實現符合新野獸主義設計的主要按鈕

```tsx
// packages/ui/lib/components/Button.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // 基礎樣式
          'font-bold rounded-base',
          'border-2 border-black',
          'transform-gpu', // GPU 加速

          // 尺寸變體
          size === 'sm' && 'px-4 py-2 text-sm',
          size === 'md' && 'px-6 py-3 text-base',
          size === 'lg' && 'px-8 py-4 text-lg',

          // 色彩變體
          variant === 'primary' && 'bg-primary text-white shadow-retro',
          variant === 'accent' && 'bg-accent text-black shadow-retro',
          variant === 'outline' && 'bg-transparent text-black shadow-retro-sm',

          // 互動動畫 (motion-safe)
          'motion-safe:transition-all',
          'motion-safe:duration-fast',
          'motion-safe:ease-neo-snap',
          'motion-safe:hover:-translate-y-1',
          'motion-safe:hover:shadow-retro-lg',
          'motion-safe:active:translate-y-0',
          'motion-safe:active:shadow-none',

          // 降低動畫替代方案 (motion-reduce)
          'motion-reduce:transition-colors',
          'motion-reduce:duration-150',
          'motion-reduce:hover:opacity-90',

          // 焦點狀態
          'focus-visible:outline-none',
          'focus-visible:ring-4',
          'focus-visible:ring-ring',
          'focus-visible:ring-offset-2',

          // 停用狀態
          'disabled:opacity-50',
          'disabled:cursor-not-allowed',
          'disabled:motion-safe:hover:translate-y-0',
          'disabled:motion-safe:hover:shadow-retro',

          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

**使用範例**:

```tsx
import { Button } from '@ui/components/Button';

export const MyComponent = () => (
  <div className="space-y-4">
    <Button variant="primary" size="lg">
      Primary Button
    </Button>
    <Button variant="accent" size="md">
      Accent Button
    </Button>
    <Button variant="outline" size="sm">
      Outline Button
    </Button>
  </div>
);
```

**測試清單**:

- [ ] 懸停時按鈕向上提升
- [ ] 點擊時按鈕完全按下
- [ ] 焦點時顯示明顯 ring
- [ ] 停用時動畫不觸發
- [ ] `prefers-reduced-motion` 時使用不透明度替代

---

### 任務 B: 遷移現有卡片元件

**目標**: 將現有的卡片元件更新為新野獸主義風格

**前 (舊樣式)**:

```tsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
  <h3 className="text-lg font-semibold">Card Title</h3>
  <p className="text-gray-600">Card content...</p>
</div>
```

**後 (新樣式)**:

```tsx
<div className="
  bg-white
  rounded-base
  border-2 border-black
  shadow-retro-lg
  p-6

  // 懸停提升效果
  motion-safe:transition-all
  motion-safe:duration-200
  motion-safe:ease-neo-pop
  motion-safe:hover:-translate-y-2
  motion-safe:hover:shadow-retro-xl

  // 降低動畫替代
  motion-reduce:hover:border-gray-700
  motion-reduce:transition-colors
">
  <h3 className="text-lg font-bold">Card Title</h3>
  <p className="text-foreground">Card content...</p>
</div>
```

**關鍵變更**:

| 舊樣式 | 新樣式 | 理由 |
|-------|-------|------|
| `shadow-md` | `shadow-retro-lg` | 偏移陰影取代模糊陰影 |
| `rounded-lg` | `rounded-base` | 統一圓角 (5px) |
| 無邊框 | `border-2 border-black` | 新野獸主義粗邊框 |
| `hover:shadow-lg` | `hover:-translate-y-2 hover:shadow-retro-xl` | Transform 動畫取代陰影變化 |
| 無 motion variants | `motion-safe:` / `motion-reduce:` | 可訪問性支援 |

---

### 任務 C: 實現表單輸入元件

**目標**: 建立符合設計系統的輸入框

```tsx
// packages/ui/lib/components/Input.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          // 基礎樣式
          'w-full px-4 py-3',
          'bg-white text-foreground',
          'border-2 rounded-base',
          'text-base font-base',
          'placeholder:text-muted-foreground',

          // 邊框和陰影
          error ? 'border-destructive' : 'border-black',
          'shadow-[3px_4px_0px_1px_#000]',

          // 焦點動畫 (motion-safe)
          'motion-safe:transition-all',
          'motion-safe:duration-150',
          'motion-safe:focus:translate-y-1',
          'motion-safe:focus:shadow-[1px_2px_0px_0px_#000]',

          // 焦點狀態
          'focus:outline-none',
          'focus:ring-4',
          'focus:ring-ring',
          'focus:ring-offset-2',

          // 停用狀態
          'disabled:opacity-50',
          'disabled:cursor-not-allowed',

          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
```

**使用範例**:

```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-bold mb-2">
      Email
    </label>
    <Input
      type="email"
      placeholder="you@example.com"
    />
  </div>

  <div>
    <label className="block text-sm font-bold mb-2">
      Password
    </label>
    <Input
      type="password"
      placeholder="••••••••"
      error={true}
    />
    <p className="text-destructive text-sm mt-1">
      Password is required
    </p>
  </div>
</div>
```

---

### 任務 D: 添加自訂陰影顏色

**目標**: 為特定元件添加彩色偏移陰影

```typescript
// packages/tailwind-config/tailwind.config.ts
export default {
  theme: {
    extend: {
      boxShadow: {
        // ... 現有陰影
        'retro-primary': '4px 4px 0px 0px #3d7a57',
        'retro-accent': '4px 4px 0px 0px #c9a800',
        'retro-destructive': '4px 4px 0px 0px #d00000',
      },
    },
  },
};
```

**使用範例**:

```tsx
<div className="
  bg-primary
  border-2 border-black
  shadow-retro-accent  // 黃色陰影與綠色背景對比
  p-6
">
  Vibrant Card
</div>
```

---

## 疑難排解

### 問題 1: 動畫不流暢 / 卡頓

**症狀**: 按鈕懸停或點擊時動畫出現明顯延遲

**診斷步驟**:

1. 開啟 Chrome DevTools → Performance → 錄製互動
2. 查看是否有 "Recalculate Style" 或 "Layout" 警告
3. 檢查是否使用了非 GPU 加速的屬性

**解決方案**:

```tsx
// ❌ 錯誤: 使用 margin 導致 layout reflow
<button className="hover:mt-[-4px]">Bad</button>

// ✅ 正確: 使用 transform 觸發 GPU 加速
<button className="motion-safe:hover:-translate-y-1 transform-gpu">Good</button>
```

**檢查清單**:

- [ ] 確認使用 `transform` 而非 `margin`/`padding`
- [ ] 添加 `transform-gpu` 提示
- [ ] 過渡時間 ≤ 300ms
- [ ] 避免同時動畫多個非加速屬性

---

### 問題 2: Tailwind 類別未生效

**症狀**: 自訂類別 (如 `shadow-retro`) 沒有樣式

**診斷步驟**:

```bash
# 檢查 Tailwind 建構日誌
pnpm dev

# 查看是否有警告訊息:
# "The `shadow-retro` class does not exist..."
```

**解決方案**:

1. **檢查 `content` 路徑**:

```typescript
// packages/tailwind-config/tailwind.config.ts
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
    '../packages/ui/lib/**/*.{js,jsx,ts,tsx}', // 確保包含共享 UI
  ],
  // ...
};
```

2. **使用 safelist (暫時解決)**:

```typescript
export default {
  safelist: [
    'shadow-retro',
    'shadow-retro-lg',
    { pattern: /^shadow-retro-/ },
  ],
  // ...
};
```

3. **重新啟動開發伺服器**:

```bash
# 停止當前伺服器 (Ctrl+C)
# 清除 Tailwind 緩存
rm -rf .turbo node_modules/.cache

# 重新安裝並啟動
pnpm install
pnpm dev
```

---

### 問題 3: 色彩對比度不符合 WCAG

**症狀**: Lighthouse 或 axe 報告對比度失敗

**診斷工具**:

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools → Lighthouse → Accessibility audit

**解決方案**:

```tsx
// ❌ 錯誤: 原始黃色 (#ffe75a) 與黑字對比 1.26:1
<div className="bg-[#ffe75a] text-black">Fail</div>

// ✅ 正確: 調深黃色 (#c9a800) 與黑字對比 6.71:1
<div className="bg-accent text-black">Pass</div>
```

**快速修正**:

| 失敗組合 | 對比度 | 修正方案 |
|---------|-------|---------|
| 白字 on #599d77 | 3.10:1 ❌ | 改用 #3d7a57 → 4.51:1 ✓ |
| 黑字 on #ffe75a | 1.26:1 ❌ | 改用 #c9a800 → 6.71:1 ✓ |

---

### 問題 4: Firefox 樣式與 Chrome 不一致

**症狀**: 陰影或邊框在 Firefox 顯示不同

**診斷步驟**:

```bash
# 同時啟動兩個瀏覽器測試
pnpm dev          # Chrome
pnpm dev:firefox  # Firefox (另一個終端視窗)
```

**常見差異**:

1. **盒模型差異**: 確保使用 `box-sizing: border-box`
2. **字體渲染**: Firefox 可能顯示較粗/較細

**解決方案**:

```css
/* packages/tailwind-config/base.css */
@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* Firefox 字體平滑 */
  body {
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
  }
}
```

---

## 測試指南

### 手動測試清單

**視覺回歸測試**:

- [ ] 所有按鈕在 3 種狀態 (預設/懸停/啟動) 下正確顯示
- [ ] 卡片懸停時提升效果明顯
- [ ] 輸入框焦點時下沉效果明顯
- [ ] 邊框粗細一致 (2-3px)
- [ ] 陰影為偏移 (非模糊)

**可訪問性測試**:

- [ ] 啟用 `prefers-reduced-motion` 後動畫停用
- [ ] 鍵盤 Tab 導航時焦點環可見
- [ ] 色彩對比度通過 WCAG AA (Lighthouse 測試)
- [ ] 螢幕閱讀器正確讀取所有互動元素

**跨瀏覽器測試**:

- [ ] Chrome 88+ 樣式正確
- [ ] Firefox 109+ 樣式正確
- [ ] 無控制台錯誤或警告

### 自動化測試

**E2E 視覺回歸測試**:

```bash
# 執行視覺回歸測試
pnpm e2e

# 查看測試報告
open ./e2e/reports/index.html
```

**範例測試腳本**:

```typescript
// e2e/specs/button-visual.spec.ts
describe('Button Visual Regression', () => {
  beforeEach(async () => {
    await browser.url('chrome-extension://[id]/popup/index.html');
  });

  it('should match button default state', async () => {
    const button = await $('button.primary');
    await expect(
      await browser.checkElement(button, 'button-default')
    ).toBeLessThanOrEqual(0.5); // 0.5% tolerance
  });

  it('should respect prefers-reduced-motion', async () => {
    // 模擬減少動畫偏好
    await browser.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ]);

    const button = await $('button');
    const hasAnimation = await button.getAttribute('class').then(
      (cls) => cls.includes('motion-safe:')
    );

    // 驗證仍有 motion-safe 類別,但瀏覽器不應用動畫
    expect(hasAnimation).toBe(true);

    // 驗證替代樣式 (opacity) 存在
    const hasReduceStyle = await button.getAttribute('class').then(
      (cls) => cls.includes('motion-reduce:hover:opacity')
    );
    expect(hasReduceStyle).toBe(true);
  });
});
```

---

## 效能優化

### 優化清單

- [ ] **Tailwind JIT 模式**: 確保 `mode: 'jit'` 啟用 (Tailwind 3.x 預設)
- [ ] **PurgeCSS**: 確保 `content` 路徑正確,移除未使用樣式
- [ ] **GPU 加速**: 所有動畫元件添加 `transform-gpu`
- [ ] **避免 Layout Shift**: 使用 `transform` 而非 `margin`/`padding`
- [ ] **最小化重繪**: 避免同時改變多個 layout 屬性

### Bundle Size 監控

```bash
# 檢查 Tailwind CSS 輸出大小
pnpm build

# 查看建構報告
ls -lh dist/assets/*.css

# 預期大小:
# - 未壓縮: ~480KB
# - Gzip: ~48KB
# - Brotli: ~35KB
```

---

## 部署檢查清單

### 部署前驗證

- [ ] 所有 E2E 測試通過: `pnpm e2e && pnpm e2e:firefox`
- [ ] 型別檢查通過: `pnpm type-check`
- [ ] Lint 檢查通過: `pnpm lint`
- [ ] 建構成功: `pnpm build && pnpm build:firefox`
- [ ] 擴充功能大小 < 5MB: `pnpm zip && pnpm zip:firefox`
- [ ] 手動測試關鍵流程 (snippet 插入、側邊欄開啟等)

### Git Commit 訊息範本

```bash
git add .
git commit -m "feat(ui): implement retro neobrutalism design system

- Add Tailwind config with neobrutalism tokens
- Implement Button, Input, Card components
- Add motion-safe/motion-reduce variants
- Update all extension pages (popup, side-panel, content-ui)
- Ensure WCAG 2.1 AA compliance

Closes #[issue-number]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 資源連結

### 內部文件

- [Feature Spec](./spec.md) - 完整功能規格
- [Research](./research.md) - 技術研究結果
- [Data Model](./data-model.md) - 設計標記資料模型
- [Plan](./plan.md) - 實現計劃

### 外部資源

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Neobrutalism Components](https://github.com/ekmas/neobrutalism-components)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

### 設計工具

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors Contrast Checker](https://coolors.co/contrast-checker)
- [Who Can Use](https://www.whocanuse.com/) - 視覺模擬

---

## 常見問題 (FAQ)

### Q1: 為什麼使用 `motion-safe:` 而不是 `@media (prefers-reduced-motion: no-preference)`?

**A**: Tailwind 的 `motion-safe:` 變體自動處理媒體查詢,程式碼更簡潔且維護性更好。範例:

```tsx
// ✅ Tailwind 方式 (推薦)
<button className="motion-safe:hover:-translate-y-1">

// ❌ 手動媒體查詢 (不推薦)
<button className="hover:-translate-y-1 [@media(prefers-reduced-motion:reduce)]:hover:translate-y-0">
```

### Q2: 可以混用新舊設計系統嗎?

**A**: 可以,但不推薦。建議按頁面逐步遷移:

1. 先完成 `packages/ui` 共享元件庫
2. 按優先級遷移頁面: `side-panel` → `content-ui` → `popup` → `options` → `new-tab`
3. 每個頁面完全遷移後再進行下一個

### Q3: 如何調試 `prefers-reduced-motion` 行為?

**A**: 使用 Chrome DevTools:

1. 開啟 DevTools (F12)
2. Cmd+Shift+P (Mac) 或 Ctrl+Shift+P (Windows)
3. 輸入 "Rendering"
4. 啟用 "Emulate CSS prefers-reduced-motion"
5. 重新載入頁面並測試

### Q4: 為什麼某些色彩值與設計稿不同?

**A**: 為符合 WCAG 2.1 AA 標準,我們調整了原始色彩:

- Primary: `#599d77` → `#3d7a57` (對比度 3.10:1 → 4.51:1)
- Accent: `#ffe75a` → `#c9a800` (對比度 1.26:1 → 6.71:1)

詳見 [research.md](./research.md#決策-3-色彩方案調整-wcag-合規)

### Q5: 如何添加自訂動畫?

**A**: 在 Tailwind 設定中添加 keyframes:

```typescript
// packages/tailwind-config/tailwind.config.ts
export default {
  theme: {
    extend: {
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'bounce-subtle': 'bounce-subtle 0.5s ease-out',
      },
    },
  },
};
```

使用:

```tsx
<div className="motion-safe:animate-bounce-subtle">
  Subtle bounce animation
</div>
```

---

## 取得協助

### 遇到問題?

1. **檢查此文件的疑難排解章節**
2. **查看 [研究文件](./research.md)** 瞭解技術決策
3. **查看 [資料模型](./data-model.md)** 瞭解設計標記結構
4. **查看 GitHub Issues**: 搜尋類似問題
5. **詢問團隊**: 在 Slack #frontend 頻道提問

### 報告 Bug

在 GitHub 建立 Issue,包含:

- **標題**: 簡潔描述問題 (例: "Button hover animation not working in Firefox")
- **復現步驟**: 詳細步驟
- **預期行為**: 應該發生什麼
- **實際行為**: 實際發生什麼
- **截圖/影片**: 如果是視覺問題
- **環境資訊**: 瀏覽器版本、OS 版本

---

**文件版本**: 1.0.0
**最後更新**: 2025-11-11
**維護者**: 前端團隊
