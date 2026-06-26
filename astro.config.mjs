// @ts-check
import { defineConfig } from 'astro/config';

// Only apply the GitHub Pages project subpath when building in CI.
const isCI = process.env.GITHUB_ACTIONS === 'true';
const base = isCI ? '/herdr-claude' : '/';
const basePrefix = base.replace(/\/$/, '');

// Markdown content links (e.g. "/blog/foo") are plain HTML, not Astro
// templates, so they never pass through the withBase() helper used in
// .astro files. This rehype plugin prefixes absolute internal links the
// same way, for every post automatically.
function rehypeBaseLinks() {
  return (tree) => {
    /** @param {any} node */
    function visit(node) {
      if (node.type === 'element' && node.tagName === 'a') {
        const href = node.properties?.href;
        if (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')) {
          node.properties.href = `${basePrefix}${href}`;
        }
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  site: isCI ? 'https://alanpcurrie.github.io' : 'http://localhost:4321',
  base,
  markdown: {
    rehypePlugins: [rehypeBaseLinks],
    shikiConfig: {
      theme: 'dracula',
      wrap: true,
    },
  },
});
