import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from "vite-plugin-dts";


export default defineConfig({
    plugins: [vue(), dts()],
    build: {
        minify: true,
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'VuePdfViewer',
            fileName: 'index',
            formats: ['es', 'cjs']
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