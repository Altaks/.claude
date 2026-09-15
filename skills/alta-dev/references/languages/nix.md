# Nix

Declarative system and development environments. The value is reproducibility, so anything that makes a
build or a machine non-reproducible cancels the point of using it.

## Flakes and pinning

- A flake with its lock file committed. That lock is the reproducibility guarantee; a floating input is
  a machine that will differ from itself next month.
- Inputs named explicitly and followed where they share a dependency, so the closure does not silently
  contain three revisions of the same thing.
- Update inputs deliberately, in their own commit, with the reason. Never bundle an input bump with a
  configuration change.
- Outputs declared for every consumer the repository actually has: the system configurations, the
  development shells, the packages, the formatter.

## Structure

- Split by concern into modules rather than one growing file: hardware, desktop, services, users,
  networking, per-host overrides.
- One directory per host, importing the shared modules and adding only what is genuinely specific to
  that machine.
- Options with types, defaults and descriptions when you write your own module. A module that only
  works because of what the caller happens to set is a hidden coupling.
- Overlays for package modifications, kept minimal and commented with the upstream reason, so they can
  be dropped when it lands.

## Style

- `let ... in` for anything computed twice; a repeated expression is the Nix magic value.
- Attribute sets over positional arguments, named arguments over a long tuple.
- Do not shell out to imperative commands from an activation script when a declarative option exists.
  The whole point is that the state is described, not applied.
- Keep the configuration readable by someone who does not know Nix: comment what a block achieves, not
  how the language works.

## Secrets

Nix store paths are world-readable. A secret written into the configuration is a secret published to
every user on the machine. Use the ecosystem's secret mechanism (an encrypted store decrypted at
activation), never a literal, and never a path outside the repository that the flake silently depends
on.

## Development shells

- A development shell per project, giving exactly the toolchain the project needs, so a contributor
  runs one command and has the right versions.
- Keep it consistent with whatever the project's other version manager pins, or there are two sources of
  truth and they will disagree.

## Gate

- The formatter and the linter run in CI, and evaluation is checked for every declared output.
- Build the system configuration in CI where feasible: an evaluation error found at rebuild time is
  found on the machine you are trying to fix.
- The README says how to rebuild, how to roll back, and what the installation script does before anyone
  is asked to run it.
