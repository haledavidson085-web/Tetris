import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative asset URLs let the same build run at a GitHub Pages project path.
  base: './',
  plugins: [tailwindcss()],
});
