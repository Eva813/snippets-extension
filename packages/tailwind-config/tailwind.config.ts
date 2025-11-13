import type { Config } from 'tailwindcss/types/config';

export default {
  theme: {
    extend: {
      // T006: Retro Neobrutalism 色彩標記
      colors: {
        primary: '#3d7a57', // 調深後主色 - 符合 WCAG AA (4.51:1 白字對比)
        'primary-hover': '#2d5a3f', // 調深後懸停色
        'primary-foreground': '#ffffff',
        accent: '#c9a800', // 調深後強調色 - 符合 WCAG AA (6.71:1 黑字對比)
        'accent-foreground': '#000000',
        background: '#fbf9f8',
        foreground: '#000000',
        border: '#000000',
        input: '#ffffff',
        ring: '#3d7a57',
        muted: '#efd0d5',
        'muted-foreground': '#6b7280',
        destructive: '#d00000',
        'destructive-foreground': '#ffffff',
        card: '#ffffff',
        'card-foreground': '#000000',
        light: '#bfd9cb',
        third: '#97b8a6',
      },

      // T007: 偏移陰影 (無模糊,新野獸主義特徵)
      boxShadow: {
        'retro-sm': '2px 2px 0px 0px #000',
        retro: '4px 4px 0px 0px #000',
        'retro-md': '6px 6px 0px 0px #000',
        'retro-lg': '8px 8px 0px 0px #000',
        'retro-xl': '12px 12px 0px 0px #000',
        input: '3px 4px 0px 1px #000',
      },

      // T008: 粗邊框寬度
      borderWidth: {
        '3': '3px',
        '4': '4px',
        '5': '5px',
      },

      // T009: 新野獸主義緩動函數
      transitionTimingFunction: {
        'neo-snap': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'neo-pop': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'neo-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      transitionDuration: {
        fast: '100ms',
        normal: '200ms',
        slow: '300ms',
      },

      borderRadius: {
        base: '5px',
      },
    },
  },
  plugins: [],
} as Omit<Config, 'content'>;
