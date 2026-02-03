import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Mil-avia-o-e-RBF-taxi-aereo/',
  build: {
    outDir: 'docs',
  }
})
