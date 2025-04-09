import { resolve } from 'node:path';
import { makeEntryPointPlugin } from '@extension/hmr';
import { isDev, withPageConfig } from '@extension/vite-config';

const rootDir = resolve(__dirname);
const srcDir = resolve(rootDir, 'src');

// export default withPageConfig({
//   resolve: {
//     alias: {
//       '@src': srcDir,
//     },
//   },
//   plugins: [isDev && makeEntryPointPlugin()],
//   publicDir: resolve(rootDir, 'public'),
//   build: {
//     lib: {
//       entry: resolve(srcDir, 'index.tsx'),
//       name: 'contentUI',
//       formats: ['iife'],
//       fileName: 'index',
//     },
//     outDir: resolve(rootDir, '..', '..', 'dist', 'content-ui'),
//   },
// });

export default withPageConfig({
  resolve: {
    alias: {
      '@src': srcDir,
    },
  },
  // plugins: [isDev && makeEntryPointPlugin()],
  publicDir: resolve(rootDir, 'public'),
  build: {
    outDir: resolve(rootDir, '..', '..', 'dist', 'content-ui'),
    rollupOptions: {
      // 多入口設定，指定每個 HTML 為一個 entry point
      input: {
        main: resolve(__dirname, 'index.html'),
        form: resolve(__dirname, 'formLoader.html')
      }
    }
  },
});
