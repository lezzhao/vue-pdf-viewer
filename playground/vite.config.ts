import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '^/api': {
        target: 'https://www13.teacherin.vip/',
        changeOrigin: true
      },
      '^/avt01': {
        target: 'https://avatar13.eeo.im/',
        changeOrigin: true
      },
      '^/file01': {
        target: 'https://cloudfile13.eeo.im/',
        changeOrigin: true
      },
      '^/2F_': {
        target: 'https://ugcfile13.teacherin.vip',
        changeOrigin: true
      },
      '^/files/coverimg': {
        target: 'https://dynamic13.teacherin.vip',
        changeOrigin: true
      },
      '^/api/v1/wsrepos': {
        target: 'ws://10.254.77.225:3000',
        ws: true
      }
    }
  }
})
