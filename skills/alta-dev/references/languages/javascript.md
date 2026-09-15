# JavaScript

For files that genuinely cannot be TypeScript: a tool's config file that its loader reads directly, a
browser extension entry point, a small script, a legacy application. Everything else goes in
TypeScript.

**Justify the choice.** When a file stays JavaScript because a tool requires it, write one line saying
why, next to it or in the project docs. Otherwise the next reader assumes it is an oversight and
converts it, or worse, adds more.

## Keep the safety net

- Type through documentation comments and run the type checker over the file anyway. A JavaScript file
  in a typed project should still be checked.
- No implicit globals. Modules, explicit imports, explicit exports.
- Know which module system the file is loaded with, and use the matching extension convention when the
  ecosystem distinguishes them. Mixing them in one package is where "cannot use import outside a
  module" comes from.

## Correctness

- Strict equality only. The loose one has never made a program more correct.
- Guard clauses and early returns; no nesting three levels deep to handle an error.
- Every promise chain has an error handler; no floating promise.
- Never swallow in a catch: log through the project logger, with context as an object.
- Bound anything that comes from outside before iterating or copying it.
- Native collection methods over hand-rolled loops and index bookkeeping.

## Node scripts

- Pin the runtime version in the toolchain config, not in a comment.
- Read configuration from the environment with an explicit default and a clear failure when a required
  value is missing. Never read a secret file.
- Errors to stderr, results to stdout, meaningful exit codes, so the script composes.
- Anything scheduled or load-bearing graduates out of a script into reviewed, tested code.

## Browser and extension code

- No inline event handlers, no string-built markup from user input. Escape at the sink.
- Keep the content script, the background worker and the page context separate, with an explicit
  message contract between them.
- Build per target environment through the bundler's configuration files rather than branching on a
  global at runtime.
- The manifest and the code must agree on permissions; request the minimum and justify each one.

## Hygiene

Same as TypeScript: remove dead code, no comment that restates the line, kebab-case file names,
documentation comments on exported symbols, formatter and linter committed and part of the gate.
