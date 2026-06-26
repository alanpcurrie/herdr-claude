// Prefixes an absolute app path with the configured Astro `base`
// (e.g. "/herdr-claude" on GitHub Pages, "" for local dev).
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path}`;
}
