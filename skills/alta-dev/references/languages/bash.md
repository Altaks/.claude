# Bash et scripts shell

A shell script is production code the moment CI or a deployment depends on it. Treat it as such, and
recognise when it should stop being a shell script.

## The header, always

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
```

- `-e` stops on the first failure, `-u` on an unset variable, `-o pipefail` on a failure anywhere in a
  pipe. Without these three, a script keeps going after the step that mattered failed, which is the
  worst outcome available.
- Where a command is allowed to fail, say so explicitly (`|| true`) with a comment on why, rather than
  disabling the flags.
- `trap` a cleanup function for temporary files and background processes, so the error path leaves
  nothing behind.

## Quoting and expansion

- **Quote every expansion**: `"$var"`, `"${arr[@]}"`, `"$(cmd)"`. An unquoted variable is a word-split
  and glob waiting for a path with a space.
- `"${var:?message}"` for a required value, `"${var:-default}"` for an optional one. That is how a
  missing input fails loud at the top instead of producing an empty string three commands later.
- Never parse `ls`. Use a glob, `find -print0` with `read -d ''`, or the language you should have used.
- `[[ ]]` over `[ ]`, `$(...)` over backticks, arrays over space-separated strings.

## Structure

- Functions with local variables (`local`), one job each, and a `main` called at the bottom so the file
  reads top-down.
- Constants at the top, uppercase, and paths derived from the script's own location rather than assumed
  from the caller's working directory.
- Arguments parsed explicitly with a usage function; print it and exit non-zero on a bad invocation.
- Errors to stderr, results to stdout, meaningful exit codes, so the script composes in a pipe.
- Log what a long step is doing. A silent script that runs for four minutes is indistinguishable from a
  hung one.

## Safety

- Nothing destructive without a confirmation or an explicit flag, and a dry-run mode for anything that
  deletes, overwrites or deploys.
- Never `rm -rf "$dir"` where `$dir` could be empty. Validate first, or use `${dir:?}`.
- Never read a secret file, never echo a secret, never pass one on a command line where the process
  table can see it.
- Idempotent where it can be: running it twice should not double anything.

## Know when to stop

The shell is right for orchestration: call tools, move files, wire a pipeline. It is wrong for logic. If
the script grows conditionals over parsed data, arithmetic that matters, or anything needing tests,
rewrite it in the project's language. A hundred-line shell script with no tests, in a pipeline, is a
liability.

## Gate

- ShellCheck on every script, in CI, and fix the findings rather than disabling the rules.
- A formatter if the project has one.
- The task runner (`just`, `make`) is the entry point humans use; the scripts are what it calls.
- Every script starts with a comment saying what it does and who runs it, since the file name never
  says enough.
