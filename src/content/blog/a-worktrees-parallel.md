---
title: "Parallel development with git worktrees"
description: "How multiple git worktrees let a herd of agents edit the same repository at once — disjoint file ownership, isolated working directories, and merges that just apply."
pubDate: 2026-06-16
tags: ["git", "worktrees", "parallel", "workflow"]
---

The blog you are reading was built by eight agents working **simultaneously** on
one repository. They did not take turns, they did not share a checkout, and when
they finished, their work merged without a single conflict. The trick that makes
that possible is an old, underused git feature: **worktrees**.

## One repository, many working directories

A normal clone gives you one working directory bound to one branch. `git
worktree` lets a single repository project multiple working directories at once,
each on its own branch, all backed by the same object store.

```bash
# From the main checkout, create eight isolated worktrees
for i in $(seq 1 8); do
  git worktree add ../wt-$i -b agent/$i
done

git worktree list
# /repo        9d78350 [main]
# /repo/../wt-1  9d78350 [agent/1]
# /repo/../wt-2  9d78350 [agent/2]
# ...
```

Each `wt-N` is a real, independent directory on disk. An agent working in `wt-6`
sees its own files, its own `git status`, its own branch — completely unaware
that seven siblings are doing the same thing next door. There is no shared index
to corrupt and no checkout to fight over.

## Disjoint file ownership

Isolation of *directories* is not enough on its own. If two agents both edit
`global.css`, you still get a conflict at merge time even though they never saw
each other's changes. The real discipline is **disjoint file ownership**: before
any agent starts, the conductor assigns each one an exclusive, non-overlapping
set of files.

```
agent/1  →  src/styles/global.css, src/layouts/BaseLayout.astro
agent/2  →  src/components/Header.astro, src/components/Footer.astro
...
agent/6  →  src/content/blog/a-*.md         # these three posts
```

Shared contracts — the content schema, the layout's prop shape, the CSS custom
properties — are frozen *before* the fan-out. Agents read them but never write
them. Each agent edits only the files it owns. When ownership is disjoint, the
union of everyone's diffs touches each line of the repo at most once.

## Merges that just apply

When work is partitioned this way, integration stops being a negotiation. Git's
three-way merge only reports a conflict when two branches change the *same*
region of the *same* file. Disjoint ownership guarantees that never happens, so
every branch fast-forwards cleanly.

```bash
git checkout main
for i in $(seq 1 8); do
  git merge --no-ff agent/$i -m "Merge agent/$i"
done
# Merge made by the 'recursive' strategy. — every time, no conflicts.

# Tidy up
git worktree prune
```

## Why it beats the alternatives

You could give each agent its own *clone*, but clones duplicate the entire
object store and lose the shared history that makes merging trivial. You could
serialise the agents on one branch, but then you have thrown away the
parallelism entirely. Worktrees are the sweet spot: the cheapness and shared
history of a single repository, with the isolation of separate checkouts.

The result is a workflow where adding more agents adds more throughput instead
of more coordination overhead. Partition the files, hand each agent a worktree,
let them run, and merge the lot. The repository never even notices it was being
written by a crowd.
