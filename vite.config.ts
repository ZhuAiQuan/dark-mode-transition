import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts'

export default defineConfig(({ command }) => {
  // 本地调试：直接跑 demo，吃源码，支持 HMR
  if (command === 'serve') {
    return {
      root: resolve(__dirname, 'src/demo'),
      publicDir: false,
      server: {
        open: true,
        fs: {
          allow: [resolve(__dirname)],
        },
      },
    }
  }

  // 发布构建：打成库
  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'dark-mode-transition',
        fileName: (format) => `dark-mode-transition.${format}.js`,
      },
      rollupOptions: {
        // 确保外部化处理那些你不想打包进库的依赖
        external: ['react'],
      },
    },
    plugins: [
      dts({
        insertTypesEntry: true,
        outDir: 'dist/types',
      }),
    ],
  }
})