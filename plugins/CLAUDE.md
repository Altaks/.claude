# Editing a mod

A mod is a plugin whose `hooks/hooks.json` names a TypeScript hooks module (`plugins/model-gatekeeper`).
Load the `plugin-authoring` skill before changing one: it writes this build's API types, which are the
reference.

- Gate: `claude plugin validate plugins/<mod>` (manifest, module, types) and
  `claude plugin test plugins/<mod>` (`tests/*.test.ts*`), both clean.
- Never commit `.claude-plugin/types/`: Claude Code writes it on load and git-ignores it itself.
- A mod never rewrites a tool call's input to change behaviour: auto mode refuses the rewritten call.
  Act at a later event instead (`model-gatekeeper` sets the model at `agent.spawn`).
- A hook that wraps an `Agent` or `Workflow` call stops hearing the agents it spawns: match tool calls
  so those two are left out.
