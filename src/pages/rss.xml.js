// OWNER: Agent 8 (RSS). Feed for The Herd via @astrojs/rss.
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { withBase } from '../utils/paths';

export async function GET(context) {
  const posts = await getCollection('blog');
  const items = posts
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: post.data.tags,
      link: withBase(`/blog/${post.id}/`),
    }));

  return rss({
    title: 'The Herd — a meta dev blog',
    description:
      'Notes from a blog that documents the very demo building it: herdr (a terminal multiplexer), Claude Code, AI subagents, and git worktrees.',
    site: new URL(withBase('/'), context.site ?? 'http://localhost:4321').href,
    items,
    customData: '<language>en-us</language>',
  });
}
