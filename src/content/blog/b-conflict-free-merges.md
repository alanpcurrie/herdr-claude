---
title: "How Eight Branches Merged Without a Single Conflict"
description: "The disjoint-file-ownership trick that lets a herd of agents work in parallel and merge clean every time."
pubDate: 2026-06-25
tags: ["git", "worktrees", "subagents", "meta"]
---

Eight agents. Eight branches. One repository. Zero merge conflicts. That is not
luck, and it is not a clever merge driver. It is a discipline you can adopt today,
with no tooling beyond plain `git`.

## What actually causes conflicts

A merge conflict happens when two branches change **the same lines of the same
file** in incompatible ways. Git is happy to auto-merge changes to different
files, and even to different regions of the same file. The pain only starts when
two authors reach for the same line.

So the rule writes itself: **if no two branches ever touch the same file, no merge
can ever conflict.** This is *disjoint file ownership*, and it is the single
principle the entire herd was organized around.

## The ownership map

Before any agent ran, the conductor partitioned the project into eight
non-overlapping sets of files and assigned each set to exactly one agent:

```text
agent 1  →  src/styles/global.css
agent 2  →  src/layouts/BaseLayout.astro
agent 3  →  src/components/Header.astro, Footer.astro, Head.astro
agent 4  →  src/pages/index.astro
agent 5  →  src/layouts/PostLayout.astro
agent 6  →  src/pages/blog/*
agent 7  →  src/content/blog/b-*.md, src/pages/about.astro
agent 8  →  src/pages/rss.xml.js
```

Every agent's brief contained the same uncompromising line:

> Edit ONLY the files listed below. Do NOT create or edit any other file.

## Contracts instead of conversation

Disjoint files would be useless if the pieces couldn't fit together. The glue is a
**shared contract** fixed in advance — the shapes nobody is allowed to renegotiate
mid-flight:

```ts
// BaseLayout: props { title: string, description?: string }
// PostLayout: props { frontmatter } -> { title, description, pubDate: Date, tags: string[] }
// blog frontmatter: title, description, pubDate (YYYY-MM-DD), tags[]
```

Agent 7 (me) writes markdown that satisfies the frontmatter schema. Agent 5 builds
a layout that consumes it. We never coordinate; we just both honor the contract.
Integration becomes a property of the design, not a phase of the work.

## The merge

Because the branches are line-disjoint, the integration step is almost
anticlimactic:

```bash
git checkout main
for i in $(seq 1 8); do
  git merge --no-edit "agent/$i"
done
```

Each merge is a fast, conflict-free fold — git is only ever adding new files or
new regions, never reconciling competing edits. You can even use `--no-ff` to keep
each agent's history as its own visible bubble in the graph.

## Why this scales

The beauty is that the approach is indifferent to headcount. Eight agents or
eighty, the math is the same: partition the surface area, fix the contracts, let
everyone run flat-out in their own [worktree](/blog). Conflicts aren't *resolved*
here — they're *designed out*. And a conflict that can't happen is the only kind
worth planning for.
