import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from "vite-plugin-dts";
import { visualizer } from 'rollup-plugin-visualizer'


export default defineConfig({
    plugins: [vue(), dts(),visualizer({
        filename: 'dependency-check-report/index.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true
      })],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'VuePdfViewer',
            fileName: 'index',
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue'
                }
            }
        }
    },
})