// Design Tokens for Retro Neobrutalism UI
// Based on data-model.md specification

export type ThemeMode = 'light' | 'dark' | 'both';

export type TokenCategory = 'color' | 'shadow' | 'border' | 'spacing' | 'typography' | 'animation' | 'radius';

export interface DesignToken {
  id: string;
  name: string;
  category: TokenCategory;
  value: string | number | Record<string, unknown>;
  mode: ThemeMode;
  isAccessible?: boolean;
  description?: string;
}

export type ColorRole =
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

export type ShadowSize = 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'input';

export interface ShadowValue extends Record<string, unknown> {
  offsetX: string;
  offsetY: string;
  blur: string;
  spread: string;
  color: string;
}

export interface ShadowToken extends DesignToken {
  category: 'shadow';
  value: ShadowValue;
  size: ShadowSize;
  direction?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export type BorderWeight = 'default' | 'bold' | 'thin';

export interface BorderValue extends Record<string, unknown> {
  width: string;
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
}

export interface BorderToken extends DesignToken {
  category: 'border';
  value: BorderValue;
  weight: BorderWeight;
}

export type AnimationType = 'transition' | 'keyframe' | 'transform';

export interface AnimationValue extends Record<string, unknown> {
  duration: string;
  timingFunction: string;
  delay?: string;
  iterationCount?: number | 'infinite';
}

export interface AnimationToken extends DesignToken {
  category: 'animation';
  value: AnimationValue;
  type: AnimationType;
  respectsMotionPreference: boolean;
}

export type StateName = 'default' | 'hover' | 'active' | 'focus' | 'focus-visible' | 'disabled';

export interface StateCondition {
  pseudoClass?: ':hover' | ':active' | ':focus' | ':focus-visible' | ':disabled';
  motionPreference?: 'safe' | 'reduce';
  custom?: string;
}

export interface ComponentState {
  name: StateName;
  priority: number;
  tokens: {
    colors?: Record<string, string>;
    shadows?: string;
    borders?: string;
    transforms?: string;
    animations?: string;
  };
  condition: StateCondition;
}

export interface ThemeConfig {
  mode: ThemeMode;
  tokens: Record<TokenCategory, DesignToken[]>;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}
