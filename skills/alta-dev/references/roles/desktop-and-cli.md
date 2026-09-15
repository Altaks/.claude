# Logiciel client : desktop, CLI, TUI

Standalone applications: GUI tools, command-line utilities, tray apps, engines. **Read `ui-ux.md`
first**: a command output and a help text are user interfaces too. Then `architecture.md` and
`systems.md`.

## The core / shell split

The rule that makes a desktop or CLI application testable and portable:

```
<project>_core/    all logic, zero UI dependency: traits, providers, transfers, config, runtime
<project>/         the shell: window, panels, theme, argument parsing. Depends on core.
```

The core compiles and its tests run without a display, a terminal or a window manager. The shell is
thin: it turns input into calls and results into pixels or lines. Any logic you find yourself writing
in a view or in the argument parser belongs in the core.

The same split holds for a game (engine versus rendering), an engine (compute versus front end), and
a tray app (watcher versus menu).

## Abstract the backends behind one trait

When the tool speaks to several interchangeable systems (a filesystem, FTP, SFTP, S3, SMB, WebDAV, or
several data sources), define **one interface** describing the operation set and give each backend its
own implementation file. The UI knows the interface, never the backend.

Add a backend by adding a file plus a registration, never by adding a branch. Keep the interface at
the level of the user's intent (list, browse, transfer with progress), not at the level of one
protocol's vocabulary.

## Async and responsiveness

- Never block the UI thread. Long operations run off it and report progress through a channel or the
  framework's spawn primitive.
- Progress is a first-class output: a transfer without progress reporting is unfinished.
- Cancellation is designed in, not bolted on. Every long operation can be aborted and leaves a
  consistent state.
- Do not drag a full async runtime into a layer that does not need one.

## CLI ergonomics

- One binary, subcommands with a clear verb. `--help` is the documentation of first resort and must be
  accurate.
- Exit codes mean something: zero on success, distinct non-zero codes for distinct failures.
- Errors go to stderr, results to stdout, so the tool composes in a pipe.
- Nothing destructive without confirmation or an explicit flag; a dry-run mode for anything that
  deletes or overwrites.
- Respect the environment: no colour when not a TTY, honour the standard config and cache locations,
  read configuration from a file with flags overriding it.

## Configuration and secrets

Typed configuration parsed once at startup and validated there. A committed template documents every
key; the real file with credentials never enters the repository. Deterministic local development
credentials belong in the toolchain config, not in source.

## Packaging

- The build produces artefacts for every target platform the README claims to support, and CI proves
  it by building them.
- System dependencies are listed explicitly per platform in the README, with the install command.
- A task runner target exists for each thing a human does: run, test, lint, format, package, and
  bringing up the local services the integration tests need.
