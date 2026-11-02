import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative asset URLs work both at the domain root and under a GitHub Pages
// project path such as https://<user>.github.io/<repository>/.
export default defineConfig({
  base: './',
  plugins: [react()],
})
