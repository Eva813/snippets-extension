import baseConfig from '@extension/tailwindcss-config';
import { withUI } from '@extension/ui';

export default withUI({
  ...baseConfig,
  content: ['src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2b4369',
          50: '#f0f2f6',
          100: '#dce2ec',
          200: '#bcc9dd',
          300: '#93a7c9',
          400: '#7384A7',
          500: '#2b4369', // 與原來的 primary 相同
          600: '#253c5f',
          700: '#1f3252',
          800: '#192941',
          900: '#152236',
          950: '#0c121d',
        },
        secondary: '#96b0e4',
        accent: '#c9d5e8',
        light: '#edf1fa',
      },
    },
  },
});
