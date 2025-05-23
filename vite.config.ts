import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'dark-mode-transition',
      fileName: (format) => `dark-mode-transition.${format}.js`,
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['react'],
    }
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types',
    })
  ]
})