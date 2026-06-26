// @ts-check
import { defineConfig } from 'astro/config';

// Only apply the GitHub Pages project subpath when building in CI.
const isCI = process.env.GITHUB_ACTIONS === 'true';

// https://astro.build/config
export default defineConfig({
  site: isCI ? 'https://alanpcurrie.github.io' : 'http://localhost:4321',
  base: isCI ? '/herdr-claude' : '/',
  markdown: {
    shikiConfig: {
      theme: 'dracula',
      wrap: true,
    },
  },
});
