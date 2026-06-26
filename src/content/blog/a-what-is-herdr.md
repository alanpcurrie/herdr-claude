---
title: "What is herdr?"
description: "A terminal multiplexer built for the age of AI agents — persistent sessions, mouse-first panes, a CLI plus a socket API, and built-in agent detection."
pubDate: 2026-06-12
tags: ["herdr", "terminal", "tooling", "agents"]
---

If you have ever lined up a row of terminals to babysit a fleet of long-running
processes, you already understand the problem **herdr** solves. It is a terminal
multiplexer — like `tmux` or `screen` — but it was designed from the ground up
for a world where the things running in your panes are not just shells, but
autonomous coding agents that work for minutes or hours at a time.

## Sessions that outlive your connection

The core promise of any multiplexer is persistence. herdr runs a daemon that
owns every session; your client merely attaches to it. Close your laptop, drop
off the VPN, or `ssh` in from a different machine, and the work is exactly where
you left it.

```bash
# Start (or attach to) a named session
herdr attach build-fleet

# Detach without killing anything — the daemon keeps running
# (default keybind: Ctrl-h d)

# List what's alive
herdr ls
# build-fleet   8 panes   3 agents running   uptime 2h14m
```

What makes this matter for agents specifically: an agent mid-task is fragile.
Kill its terminal and you lose the run. herdr decouples the *process* from the
*viewport*, so an agent keeps churning whether or not anyone is watching.

## Mouse-first panes

`tmux` is keyboard-first and proud of it. herdr takes the opposite stance:
panes are draggable, resizable, and splittable with the mouse, while still
honouring every keybind for people who never leave the home row. Click a pane to
focus it, drag the divider to resize, and double-click a divider to rebalance.
For anyone managing a dozen agents at once, being able to *point* at the one
that needs attention is a genuine speed-up.

## A CLI and a socket API

Everything you can do interactively, you can also script. herdr exposes a Unix
domain socket that speaks a small JSON protocol, and the `herdr` CLI is a thin
wrapper over it.

```bash
# Spawn a pane running a command, get its id back
PANE=$(herdr spawn --session build-fleet -- npm run agent:task-6)

# Stream that pane's output programmatically
herdr capture --pane "$PANE" --follow

# Send input
herdr send --pane "$PANE" --keys "y\n"
```

Because the API is a socket and not a screen-scrape, orchestration tools can
drive herdr directly — launch panes, read their buffers, and react — without
pretending to be a human at a keyboard.

## Agent detection

The feature that gives herdr its name is **agent detection**. The daemon
inspects what is running in each pane and recognises known agent runtimes —
Claude Code among them — surfacing their state in the status bar and over the
API:

```bash
herdr agents --session build-fleet --json
# [
#   {"pane": "p3", "agent": "claude-code", "state": "running",  "tool": "Edit"},
#   {"pane": "p7", "agent": "claude-code", "state": "waiting",  "prompt": true},
#   {"pane": "p9", "agent": "claude-code", "state": "idle"}
# ]
```

`waiting` means an agent is blocked on a prompt and wants you; `idle` means it
finished. A conductor process can poll this to know precisely when to fan out
more work or collect results — no guessing, no fixed sleeps.

## Why it exists

Multiplexers were built for humans watching processes. herdr is built for
humans *supervising agents* — and for the orchestration code that supervises
them on your behalf. Persistent sessions keep the work safe, mouse-first panes
keep a busy screen manageable, and the socket API plus agent detection turn the
whole terminal into something programmable. It is the difference between herding
cats and herding a herd that herds itself.
