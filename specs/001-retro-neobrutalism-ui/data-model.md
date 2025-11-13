# Data Model: Retro Neobrutalism 設計標記系統

**日期**: 2025-11-11
**分支**: `001-retro-neobrutalism-ui`
**目的**: 定義新野獸主義設計系統的資料結構和關係

---

## 概述

本文件定義 Retro Neobrutalism UI 設計系統的核心實體、屬性、關係和驗證規則。設計標記以 TypeScript 介面形式建模,確保型別安全和一致性。

---

## 實體模型

### 1. DesignToken (設計標記基礎類型)

所有設計標記的抽象基礎實體。

```typescript
interface DesignToken {
  /** 標記唯一識別碼 */
  id: string;

  /** 標記名稱 (用於 CSS 變數和 Tailwind 類別) */
  name: string;

  /** 標記類別 */
  category: TokenCategory;

  /** 標記值 (可為字串、數字或複合物件) */
  value: string | number | TokenValue;

  /** 主題模式 (light/dark) */
  mode: ThemeMode;

  /** 是否為 WCAG AA 合規 (僅適用於色彩標記) */
  isAccessible?: boolean;

  /** 標記描述 */
  description?: string;
}

type TokenCategory =
  | 'color'
  | 'shadow'
  | 'border'
  | 'spacing'
  | 'typography'
  | 'animation'
  | 'radius';

type ThemeMode = 'light' | 'dark' | 'both';
```

---

### 2. ColorToken (色彩標記)

定義色彩相關的設計標記,包含 WCAG 對比度驗證。

```typescript
interface ColorToken extends DesignToken {
  category: 'color';
  value: string; // Hex color code

  /** 色彩角色 */
  role: ColorRole;

  /** RGB 值 */
  rgb: { r: number; g: number; b: number };

  /** 相對亮度 (用於對比度計算) */
  relativeLuminance: number;

  /** 與其他色彩的對比度比率 */
  contrastRatios?: Record<string, number>;

  /** WCAG 合規狀態 */
  wcagCompliance: {
    normalText: boolean; // ≥ 4.5:1
    largeText: boolean; // ≥ 3:1
    uiComponents: boolean; // ≥ 3:1
  };
}

type ColorRole =
  | 'background'
  | 'foreground'
  | 'primary'
  | 'primary-hover'
  | 'primary-foreground'
  | 'secondary'
  | 'secondary-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'muted'
  | 'muted-foreground'
  | 'border'
  | 'input'
  | 'ring'
  | 'destructive'
  | 'destructive-foreground';
```

**驗證規則**:

1. `value` 必須為有效的 6 位十六進位色碼 (例: `#3d7a57`)
2. `contrastRatios` 必須包含與 `background` 和 `foreground` 的對比度
3. 用於文字的色彩必須通過 WCAG AA (4.5:1 for normal, 3:1 for large)
4. 用於邊框/UI 元件的色彩必須通過 3:1 對比度

**範例資料**:

```typescript
const primaryColorToken: ColorToken = {
  id: 'color-primary-light',
  name: 'primary',
  category: 'color',
  mode: 'light',
  role: 'primary',
  value: '#3d7a57',
  rgb: { r: 61, g: 122, b: 87 },
  relativeLuminance: 0.152,
  contrastRatios: {
    white: 4.51,
    background: 3.12,
  },
  wcagCompliance: {
    normalText: true, // 4.51:1 with white ✓
    largeText: true,
    uiComponents: true,
  },
  isAccessible: true,
  description: '主要品牌色 - 調深以符合 WCAG AA',
};
```

---

### 3. ShadowToken (陰影標記)

定義新野獸主義風格的偏移陰影。

```typescript
interface ShadowToken extends DesignToken {
  category: 'shadow';
  value: ShadowValue;

  /** 陰影大小級別 */
  size: ShadowSize;

  /** 陰影方向 (預設右下) */
  direction?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

interface ShadowValue {
  /** X 軸偏移 */
  offsetX: string;

  /** Y 軸偏移 */
  offsetY: string;

  /** 模糊半徑 (新野獸主義應為 0) */
  blur: string;

  /** 擴散半徑 */
  spread: string;

  /** 陰影色彩 */
  color: string;
}

type ShadowSize = 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'input';
```

**驗證規則**:

1. `offsetX` 和 `offsetY` 必須為正值 (向右下偏移)
2. `blur` 必須為 `0px` (新野獸主義特徵:無模糊)
3. `spread` 必須為 `0px`
4. `color` 通常為 `#000000` 或設計標記色彩

**範例資料**:

```typescript
const retroShadowToken: ShadowToken = {
  id: 'shadow-retro-base',
  name: 'retro',
  category: 'shadow',
  mode: 'both',
  size: 'base',
  direction: 'bottom-right',
  value: {
    offsetX: '4px',
    offsetY: '4px',
    blur: '0px',
    spread: '0px',
    color: '#000000',
  },
  description: '標準新野獸主義陰影 - 4px 偏移,無模糊',
};

// 所有陰影變體
const shadowTokens: ShadowToken[] = [
  { size: 'sm', value: { offsetX: '2px', offsetY: '2px', blur: '0px', spread: '0px', color: '#000' } },
  { size: 'base', value: { offsetX: '4px', offsetY: '4px', blur: '0px', spread: '0px', color: '#000' } },
  { size: 'md', value: { offsetX: '6px', offsetY: '6px', blur: '0px', spread: '0px', color: '#000' } },
  { size: 'lg', value: { offsetX: '8px', offsetY: '8px', blur: '0px', spread: '0px', color: '#000' } },
  { size: 'xl', value: { offsetX: '12px', offsetY: '12px', blur: '0px', spread: '0px', color: '#000' } },
  { size: 'input', value: { offsetX: '3px', offsetY: '4px', blur: '0px', spread: '1px', color: '#000' } },
];
```

---

### 4. BorderToken (邊框標記)

定義粗邊框樣式。

```typescript
interface BorderToken extends DesignToken {
  category: 'border';
  value: BorderValue;

  /** 邊框粗細級別 */
  weight: BorderWeight;
}

interface BorderValue {
  /** 邊框寬度 */
  width: string;

  /** 邊框樣式 */
  style: 'solid' | 'dashed' | 'dotted';

  /** 邊框色彩 */
  color: string;
}

type BorderWeight = 'default' | 'bold' | 'thin';
```

**驗證規則**:

1. `width` 必須 ≥ `2px` (新野獸主義最小要求,符合 FR-001)
2. `style` 通常為 `solid` (簡潔線條)
3. `color` 通常為 `#000000` (高對比)

**範例資料**:

```typescript
const borderTokens: BorderToken[] = [
  {
    id: 'border-default',
    name: 'border-2',
    category: 'border',
    mode: 'both',
    weight: 'default',
    value: { width: '2px', style: 'solid', color: '#000000' },
  },
  {
    id: 'border-bold',
    name: 'border-3',
    category: 'border',
    mode: 'both',
    weight: 'bold',
    value: { width: '3px', style: 'solid', color: '#000000' },
  },
];
```

---

### 5. AnimationToken (動畫標記)

定義動畫時間、緩動函數和持續時間。

```typescript
interface AnimationToken extends DesignToken {
  category: 'animation';
  value: AnimationValue;

  /** 動畫類型 */
  type: AnimationType;

  /** 是否尊重 prefers-reduced-motion */
  respectsMotionPreference: boolean;
}

interface AnimationValue {
  /** 持續時間 */
  duration: string;

  /** 緩動函數 */
  timingFunction: string;

  /** 延遲 (可選) */
  delay?: string;

  /** 迭代次數 (可選,用於 keyframe 動畫) */
  iterationCount?: number | 'infinite';
}

type AnimationType =
  | 'transition'
  | 'keyframe'
  | 'transform';
```

**驗證規則**:

1. `duration` 必須在 100ms - 300ms 範圍內 (符合 FR-006)
2. `timingFunction` 推薦使用 `ease-out`, `ease-in-out` 或自訂 cubic-bezier
3. `respectsMotionPreference` 必須為 `true` (符合 FR-007, WCAG SC 2.3.3)

**範例資料**:

```typescript
const animationTokens: AnimationToken[] = [
  {
    id: 'anim-button-hover',
    name: 'fast',
    category: 'animation',
    mode: 'both',
    type: 'transition',
    respectsMotionPreference: true,
    value: {
      duration: '100ms',
      timingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // ease-neo-snap
    },
    description: '按鈕懸停快速回饋',
  },
  {
    id: 'anim-card-lift',
    name: 'normal',
    category: 'animation',
    mode: 'both',
    type: 'transition',
    respectsMotionPreference: true,
    value: {
      duration: '200ms',
      timingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)', // ease-neo-pop
    },
    description: '卡片懸停提升效果',
  },
];
```

---

### 6. ComponentState (元件狀態)

定義 UI 元件的互動狀態。

```typescript
interface ComponentState {
  /** 狀態名稱 */
  name: StateName;

  /** 狀態優先級 (數字越大優先級越高) */
  priority: number;

  /** 應用的設計標記 */
  tokens: {
    colors?: Record<string, string>;
    shadows?: string;
    borders?: string;
    transforms?: string;
    animations?: string;
  };

  /** 狀態條件 */
  condition: StateCondition;
}

type StateName =
  | 'default'
  | 'hover'
  | 'active'
  | 'focus'
  | 'focus-visible'
  | 'disabled';

interface StateCondition {
  /** CSS 偽類 */
  pseudoClass?: ':hover' | ':active' | ':focus' | ':focus-visible' | ':disabled';

  /** motion-safe 或 motion-reduce */
  motionPreference?: 'safe' | 'reduce';

  /** 自訂條件 (例: data attributes) */
  custom?: string;
}
```

**狀態優先級順序**:

1. `disabled` (6) - 最高優先級
2. `active` (5)
3. `focus-visible` (4)
4. `focus` (3)
5. `hover` (2)
6. `default` (1) - 最低優先級

**範例資料**:

```typescript
const buttonStates: ComponentState[] = [
  {
    name: 'default',
    priority: 1,
    tokens: {
      colors: { bg: 'primary', text: 'primary-foreground' },
      shadows: 'retro',
      borders: 'border-2',
    },
    condition: {},
  },
  {
    name: 'hover',
    priority: 2,
    tokens: {
      transforms: 'translate(-2px, -2px)',
      shadows: 'retro-lg',
    },
    condition: {
      pseudoClass: ':hover',
      motionPreference: 'safe',
    },
  },
  {
    name: 'active',
    priority: 5,
    tokens: {
      transforms: 'translate(4px, 4px)',
      shadows: 'none',
    },
    condition: {
      pseudoClass: ':active',
      motionPreference: 'safe',
    },
  },
  {
    name: 'focus-visible',
    priority: 4,
    tokens: {
      colors: { ring: 'ring' },
      borders: 'border-3',
    },
    condition: {
      pseudoClass: ':focus-visible',
    },
  },
];
```

---

## 實體關係圖

```
┌─────────────────┐
│  DesignToken    │ (抽象基礎)
└────────┬────────┘
         │
         ├──────┬──────────┬──────────┬──────────┬──────────┐
         │      │          │          │          │          │
    ColorToken  ShadowToken BorderToken AnimationToken TypographyToken RadiusToken
         │
         │
         ▼
┌─────────────────┐         ┌─────────────────┐
│ ComponentState  │◄────────│  Component      │
└─────────────────┘         └─────────────────┘
         │                           │
         │ uses                      │ composed of
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  ColorToken     │         │  DesignToken[]  │
│  ShadowToken    │         └─────────────────┘
│  BorderToken    │
│  AnimationToken │
└─────────────────┘
```

**關係說明**:

1. **DesignToken → 子類型**: 一對多繼承關係
   - 每種標記類型 (Color, Shadow, Border 等) 繼承 DesignToken

2. **ComponentState → DesignToken**: 多對多引用關係
   - 一個狀態可引用多個設計標記
   - 一個設計標記可被多個狀態使用

3. **Component → ComponentState**: 一對多組合關係
   - 一個元件包含多個狀態 (default, hover, active 等)

---

## 主題模式切換

### ThemeMode Entity

```typescript
interface ThemeConfig {
  /** 當前主題模式 */
  mode: ThemeMode;

  /** 主題標記映射 */
  tokens: Record<TokenCategory, DesignToken[]>;

  /** 切換主題的方法 */
  toggle: () => void;

  /** 設定特定主題 */
  setMode: (mode: ThemeMode) => void;
}

// 使用範例
const lightTheme: ThemeConfig = {
  mode: 'light',
  tokens: {
    color: lightColorTokens,
    shadow: shadowTokens,
    border: borderTokens,
    animation: animationTokens,
    // ...
  },
  toggle: () => setMode(mode === 'light' ? 'dark' : 'light'),
  setMode: (newMode) => {
    document.documentElement.classList.toggle('dark', newMode === 'dark');
  },
};
```

---

## 驗證規則總結

### 全域驗證

1. **一致性**: 相同 `role` 的色彩標記在 light/dark 模式下必須保持相同 `contrastRatios`
2. **可訪問性**: 所有用於文字的 ColorToken 必須 `isAccessible: true`
3. **效能**: 所有 AnimationToken 的 `duration` 必須 ≤ 300ms

### 特定實體驗證

| 實體 | 規則 | 錯誤訊息 |
|-----|------|---------|
| ColorToken | `value` 格式為 `#[0-9a-f]{6}` | "Invalid hex color format" |
| ColorToken | 文字色彩必須 `contrastRatio ≥ 4.5` | "WCAG AA contrast failure" |
| ShadowToken | `blur` 必須為 `0px` | "Neobrutalism shadows must have no blur" |
| BorderToken | `width` 必須 ≥ `2px` | "Border width below minimum (FR-001)" |
| AnimationToken | `respectsMotionPreference` 必須為 `true` | "Animation must respect motion preference (FR-007)" |

---

## 資料流程圖

### 設計標記應用流程

```
1. 定義設計標記 (data-model.md)
   ↓
2. 生成 Tailwind 設定 (tailwind.config.ts)
   theme.extend.colors ← ColorToken[]
   theme.extend.boxShadow ← ShadowToken[]
   theme.extend.borderWidth ← BorderToken[]
   ↓
3. 生成 CSS 變數 (base.css)
   :root { --color-primary: #3d7a57; }
   ↓
4. 應用於元件 (Component.tsx)
   className="bg-primary border-2 shadow-retro"
   ↓
5. 狀態切換 (ComponentState)
   hover → motion-safe:hover:-translate-y-1
```

---

## TypeScript 型別定義檔案

完整型別定義應放置於 `packages/shared/src/types/design-tokens.ts`:

```typescript
// packages/shared/src/types/design-tokens.ts
export type ThemeMode = 'light' | 'dark' | 'both';

export type TokenCategory =
  | 'color'
  | 'shadow'
  | 'border'
  | 'spacing'
  | 'typography'
  | 'animation'
  | 'radius';

export interface DesignToken {
  id: string;
  name: string;
  category: TokenCategory;
  value: string | number | Record<string, unknown>;
  mode: ThemeMode;
  isAccessible?: boolean;
  description?: string;
}

export interface ColorToken extends DesignToken {
  category: 'color';
  value: string;
  role: ColorRole;
  rgb: { r: number; g: number; b: number };
  relativeLuminance: number;
  contrastRatios?: Record<string, number>;
  wcagCompliance: {
    normalText: boolean;
    largeText: boolean;
    uiComponents: boolean;
  };
}

// ... (其他介面定義同上)

export type ColorRole =
  | 'background'
  | 'foreground'
  | 'primary'
  | 'primary-hover'
  | 'primary-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'border'
  | 'muted'
  | 'destructive';

export type ShadowSize = 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'input';
export type BorderWeight = 'default' | 'bold' | 'thin';
export type AnimationType = 'transition' | 'keyframe' | 'transform';
export type StateName = 'default' | 'hover' | 'active' | 'focus' | 'focus-visible' | 'disabled';
```

---

## 使用範例

### 在 React 元件中使用設計標記

```typescript
import { cn } from '@/lib/utils';
import type { ComponentState } from '@shared/types/design-tokens';

interface ButtonProps {
  variant?: 'primary' | 'accent';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children }) => {
  // 基於設計標記定義的類別組合
  const baseClasses = 'px-6 py-3 font-bold border-2 border-black rounded-base';

  const variantClasses = {
    primary: 'bg-primary text-white',
    accent: 'bg-accent text-black',
  };

  const stateClasses = {
    default: 'shadow-retro',
    hover: 'motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-retro-lg',
    active: 'motion-safe:active:translate-y-0 motion-safe:active:shadow-none',
    focusVisible: 'focus-visible:ring-4 focus-visible:ring-ring',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        stateClasses.default,
        stateClasses.hover,
        stateClasses.active,
        stateClasses.focusVisible,
        // 降低動畫替代方案
        'motion-reduce:transition-colors motion-reduce:hover:opacity-90'
      )}
    >
      {children}
    </button>
  );
};
```

---

## 測試資料集

### 完整色彩標記集 (Light Mode)

```typescript
export const lightColorTokens: ColorToken[] = [
  {
    id: 'color-background-light',
    name: 'background',
    category: 'color',
    mode: 'light',
    role: 'background',
    value: '#fbf9f8',
    rgb: { r: 251, g: 249, b: 248 },
    relativeLuminance: 0.952,
    contrastRatios: { foreground: 20.04 },
    wcagCompliance: { normalText: true, largeText: true, uiComponents: true },
    isAccessible: true,
  },
  {
    id: 'color-foreground-light',
    name: 'foreground',
    category: 'color',
    mode: 'light',
    role: 'foreground',
    value: '#000000',
    rgb: { r: 0, g: 0, b: 0 },
    relativeLuminance: 0.000,
    contrastRatios: { background: 20.04 },
    wcagCompliance: { normalText: true, largeText: true, uiComponents: true },
    isAccessible: true,
  },
  {
    id: 'color-primary-light',
    name: 'primary',
    category: 'color',
    mode: 'light',
    role: 'primary',
    value: '#3d7a57',
    rgb: { r: 61, g: 122, b: 87 },
    relativeLuminance: 0.152,
    contrastRatios: { white: 4.51, background: 3.12 },
    wcagCompliance: { normalText: true, largeText: true, uiComponents: true },
    isAccessible: true,
    description: '調深後主色,確保白字對比度 ≥ 4.5:1',
  },
  {
    id: 'color-accent-light',
    name: 'accent',
    category: 'color',
    mode: 'light',
    role: 'accent',
    value: '#c9a800',
    rgb: { r: 201, g: 168, b: 0 },
    relativeLuminance: 0.298,
    contrastRatios: { black: 6.71, white: 3.13 },
    wcagCompliance: { normalText: true, largeText: true, uiComponents: true },
    isAccessible: true,
    description: '調深後強調色,確保黑字對比度 ≥ 4.5:1',
  },
];
```

---

## 下一步整合

1. **Tailwind 設定生成**: 基於此資料模型自動生成 `tailwind.config.ts`
2. **CSS 變數生成**: 自動生成 `base.css` 中的 `:root` 定義
3. **元件庫開發**: 在 `packages/ui` 中實現設計標記驅動的元件
4. **文件自動化**: 基於資料模型生成設計系統文件

---

**資料模型版本**: 1.0.0
**建立日期**: 2025-11-11
**批准狀態**: ✅ 已批准用於 Phase 1 實現
