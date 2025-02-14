import { resolve } from 'node:path';
import { withPageConfig } from '@extension/vite-config';

const rootDir = resolve(__dirname);
const srcDir = resolve(rootDir, 'src');

export default withPageConfig({
  resolve: {
    alias: {
      '@src': srcDir,
    },
  },
  publicDir: resolve(rootDir, 'public'),
  build: {
    outDir: resolve(rootDir, '..', '..', 'dist', 'side-panel'),
    rollupOptions: {
      // 多入口設定，指定每個 HTML 為一個 entry point
      input: {
        main: resolve(__dirname, 'index.html'),
        form: resolve(__dirname, 'formLoader.html')
      }
    }
  },
});
