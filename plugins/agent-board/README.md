# agent-board

A Claude Code mod that shows what the session's subagents are doing, in a pane docked on the right of the conversation, so the conversation keeps its full height.

**Cards.** Each running subagent gets a card, stacked in the pane: name, the model it actually ran on, status, what it was asked and who launched it, its live activity (last action, number of actions, time since it started) and the latest message it sent or received. Subagents have no task tools, so a task list (`TaskCreate` / `TaskUpdate` / `TodoWrite`) shows on a card only when the main conversation assigns a task to that agent. Finished agents fold into one "done" line; **clear** hides them. The main conversation gets no card: Claude Code already shows its own task list.

**Opening.** The pane opens by itself when a subagent starts (on a terminal at least 144 columns wide). Once you close it, it stays closed for the session until you type `/agent-board`. `/agent-board graph` opens it on the graph.

**Graph, in the same pane.** `g` switches to the graph, `c` back to the cards. Agents are boxes laid out by spawn depth. Solid lines are spawns; dashed arrows are messages (`SendMessage`) with a count per pair. Messages between a parent and its child are counted on their spawn line; messages between agents that are neither parent and child nor neighbours in a row are listed under the graph. A graph wider than the pane pages by whole boxes with `h` and `l`. The open row under the graph shows an agent's transcript.

The board only watches: it never changes a call, and it never wraps an Agent or Workflow call, so it hears every subagent's events. It sees what happens after it loads in a session.

## Install

Opt-in, from this repo's marketplace (`altaks-claude`). A mod has no skills, so it adds no context cost.

```bash
# From a shell, at user scope (every project); the marketplace is added on the way if needed
claude plugin install agent-board --marketplace /path/to/this/repo --scope user

# Or at the prompt of a terminal session
/plugin install agent-board --marketplace Altaks/.claude

# Turn it back off
claude plugin disable agent-board@altaks-claude
```

## Develop

```bash
claude plugin validate plugins/agent-board   # manifest, hooks module and types
claude plugin test plugins/agent-board       # tests/*.test.ts*
```

`.claude-plugin/types/` is written by Claude Code whenever it loads the mod from a watched folder; it is
git-ignored by the engine and never committed.

