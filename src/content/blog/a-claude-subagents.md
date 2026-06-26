---
title: "Orchestrating Claude Code subagents"
description: "Fan-out, barriers, and waiting on agent status — the patterns a conductor uses to turn one Claude Code session into a coordinated herd that ships in parallel."
pubDate: 2026-06-20
tags: ["claude-code", "agents", "orchestration", "parallel"]
---

A single Claude Code session is a capable engineer. A *herd* of them, properly
conducted, is a team. The difference is orchestration: deciding what runs in
parallel, where everything must regroup, and how the conductor knows when an
agent is done. These are the same primitives concurrent programming has always
used — fan-out, barriers, and status waits — applied to a fleet of reasoning
agents.

## Fan-out

Fan-out is the easy, high-leverage move: take work that decomposes into
independent pieces and dispatch each piece to its own subagent. The only rule is
that the pieces must not share mutable state — which, in a codebase, means
**disjoint file ownership** so two agents never write the same file.

```bash
# Conductor spawns one Claude Code agent per task, each in its own worktree
for task in tasks/*.md; do
  herdr spawn --session herd -- \
    claude-code --task "$task" --yolo &
done
# Eight agents now editing eight disjoint slices of the repo at once.
```

Each agent gets a self-contained task spec: the files it owns, the shared
contracts it must honour, and a clear definition of done. Then it runs
autonomously. Done well, eight agents finish in roughly the time one would have
taken for its slice.

## Barriers

Fan-out without a regroup point is chaos. A **barrier** is the place where the
conductor waits for *every* dispatched agent to finish before moving on — you
cannot merge branches until all of them exist, and you cannot run the build
until the merge is done.

```text
   fan-out ─┬─ agent/1 ─┐
            ├─ agent/2 ─┤
            ├─ ...      ├─►  ▌BARRIER▐  ─►  merge ─► install ─► build
            └─ agent/8 ─┘
```

The barrier is what converts a swarm of independent runs back into a single,
ordered pipeline. Everything before it is parallel; everything after it depends
on the whole batch being complete.

## Waiting on agent status

The naive barrier is a fixed `sleep` — and it is always wrong, either wasting
time or cutting an agent off mid-edit. The robust approach is to **poll real
agent status**. This is exactly what herdr's agent detection exposes, so the
conductor can block on facts instead of timers.

```bash
# Block until every agent in the session reports a terminal state
until ! herdr agents --session herd --json \
      | jq -e 'any(.[]; .state == "running")' >/dev/null; do
  sleep 2
done

# Distinguish "finished" from "stuck waiting for a human"
herdr agents --session herd --json \
  | jq -r '.[] | select(.state == "waiting") | .pane'
# p7   ← this agent hit a prompt and needs intervention
```

A `waiting` agent is blocked on input and should be surfaced to a human; an
`idle` agent has genuinely finished and is safe to collect. Polling status lets
the conductor proceed the instant the last agent lands — no sooner, no later.

## Conducting the herd

Put the three together and you have a conductor loop: **fan out** the tasks,
**wait** on status until the herd goes quiet, hit the **barrier**, then merge,
build, and verify. If an agent fails or stalls at a prompt, the conductor can
re-dispatch just that slice rather than restarting the batch.

The mental shift is from *doing the work* to *designing the work so it can be
done in parallel and reassembled cleanly*. Decompose into disjoint tasks, give
each a sharp spec, dispatch, and regroup on real signals. The conductor never
writes a line of the blog — it just makes sure eight agents that have never met
ship one coherent thing together.
