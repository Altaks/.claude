# model-gatekeeper

A Claude Code mod that picks a model tier for each subagent as it starts, so Opus is not the default for every job.

When a subagent starts with no model named:

1. A fork, a resumed agent, a workflow agent, a `Plan` agent or a custom agent type is left alone.
2. `Explore`, `claude-code-guide` and `statusline-setup` run on haiku.
3. `general-purpose` and `claude` agents are classified by a small model as `simple-lookup`, `standard-coding` or `hard-reasoning`, then routed to haiku, sonnet or opus. If the classifier fails, the agent runs on sonnet.
4. Nothing is routed above the model of whoever spawned the agent. A pick equal to it leaves the agent on that exact model.

An explicit `model` on the Agent call always wins. Any error lets the spawn go ahead as asked.

It routes at spawn time, after auto mode has reviewed the Agent call as Claude wrote it. Rewriting the call itself makes auto mode refuse it. For the same reason, effort is not changed: subagents keep the session's effort.

`/gatekeeper` lists the last decisions and the estimated savings. `/gatekeeper off` and `/gatekeeper on` switch routing for the session.

A segment of the status line, right after its first part (the model, in the usual layouts) and in the
line's own ` | ` separator, counts the routed subagents per tier (`●2 ●1`, haiku green, sonnet blue, opus
violet; unused tiers hidden) and the estimated savings (`~$0.40 éco.`): when a routed agent reports,
its cost is priced again at its parent's model, from list prices (`hooks/savings.ts`). It is an estimate
like Claude Code's own cost figure, and on a subscription a share of usage rather than a bill. A line
with no ` | ` gets the segment at its end; a line managed settings own is left alone. It shows `gk off`
while routing is off.

Each subagent's row in the agent list reads as a branch of the spawn tree, `├─` or `└─` for the last
child, then its type (and name), the model it runs on, coloured by tier (haiku green, sonnet blue, opus
violet), what it is doing and its tokens. Claude Code keeps drawing the nesting; the mod writes the text
after it. A row the person's settings already draw is left alone.

Not gated: workflow agents (their script picks), and agents spawned by a subagent. The main conversation's model is never changed, to keep its prompt cache.

## Install

Opt-in, from this repo's marketplace (`altaks-claude`). A mod has no skills, so it adds no context cost.

```bash
# From a shell, at user scope (every project); the marketplace is added on the way if needed
claude plugin install model-gatekeeper --marketplace /path/to/this/repo --scope user

# Or at the prompt of a terminal session
/plugin install model-gatekeeper --marketplace Altaks/.claude

# Turn it back off
claude plugin disable model-gatekeeper@altaks-claude
```

## Develop

```bash
claude plugin validate plugins/model-gatekeeper   # manifest, hooks module and types
claude plugin test plugins/model-gatekeeper       # tests/*.test.ts*
```

`.claude-plugin/types/` is written by Claude Code whenever it loads the mod from a watched folder; it is
git-ignored by the engine and never committed.

