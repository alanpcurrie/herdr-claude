# The Herd Builds a Blog — Design

**Date:** 2026-06-26
**Goal:** A visually impressive demo showcasing Claude Code subagents orchestrated
via **herdr** terminal multiplexing and **git worktrees**, all collaborating to
build an Astro blog. The demo is complete when the blog runs on **port 4321**.

## Concept

One herdr workspace with a tab split into an **8-pane grid**. Each pane runs a
**real `claude` agent** in **its own git worktree**, building one disjoint slice
of the same Astro blog. The main session conducts: scaffold → fan-out → wait →
merge → launch.

Blog theme: a meta dev blog about herdr, Claude Code, agents, and worktrees.

## Flow

1. **Scaffold (solo):** minimal-but-working Astro blog committed to `main`.
   Guarantees 4321 serves even before enhancement; gives agents a known skeleton
   (content-collection schema, working stubs of every owned file).
2. **Fan-out:** 8 git worktrees `../wt-1..8` on branches `agent/1..8`; herdr
   8-pane grid.
3. **Build:** `herdr agent start` launches a real `claude` per pane (`--cwd`
   worktree, edits auto-approved, tight per-slice prompt).
4. **Barrier:** `herdr agent wait --status idle` on all 8.
5. **Merge:** main session commits each worktree, merges `agent/1..8` into `main`.
   Additive/clean by design (disjoint ownership).
6. **Launch + verify:** `astro dev --background --port 4321`, curl HTTP 200.

## Disjoint file ownership (clean-merge guarantee)

Each agent edits ONLY its files. The scaffold contains a working stub of each, so
merging 8 branches that each modify different files never conflicts.

| # | Agent | Owns |
|---|-------|------|
| 1 | Design system | `src/styles/global.css` |
| 2 | Base layout + SEO head | `src/layouts/BaseLayout.astro`, `src/components/Head.astro` |
| 3 | Header/nav + footer | `src/components/Header.astro`, `Footer.astro` |
| 4 | Homepage | `src/pages/index.astro` |
| 5 | Blog index + post layout + route | `src/pages/blog/index.astro`, `src/pages/blog/[...slug].astro`, `src/layouts/PostLayout.astro` |
| 6 | Posts batch A | `src/content/blog/a-*.md` |
| 7 | Posts batch B + About | `src/content/blog/b-*.md`, `src/pages/about.astro` |
| 8 | RSS + config | `src/pages/rss.xml.js`, `astro.config.mjs` |

## Shared contracts (fixed by scaffold, written into prompts)

- `BaseLayout` props: `{ title: string, description?: string }`; renders Header,
  `<slot/>`, Footer; imports `../styles/global.css`.
- `PostLayout` props: `{ frontmatter }`; renders post body via `<slot/>`.
- Blog frontmatter schema: `title, description, pubDate, tags[]`.
- Routes: `/`, `/blog`, `/blog/<id>`, `/about`, `/rss.xml`.

## Risks / decisions

- Individual worktrees won't fully build in isolation (cross-references); only the
  merged tree is verified. Acceptable.
- Main session does commit+merge, not the agents — more robust.
- Real API budget across 8 concurrent agents — user opted in.
