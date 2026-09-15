# C

The language has no module system, no ownership model and no error channel. You supply all three by
convention, and the convention has to be visible in the tree.

## Modules are directories and headers

```
main.c
network/       address.c/.h        the socket layer
network/dialog/ requests.c/.h  response.c/.h    the protocol layer on top of it
files/         files.c/.h          filesystem access
logging/       logging.c/.h        one logging surface for everyone
util/          date.c/.h  math.c/.h  date/hashmap.c/.h    generic helpers
content/       static assets, not code
```

- One directory per concern, nested when a concern has sub-parts. The directory name is the module
  name.
- Each unit is a `.c` / `.h` pair. **The header is the public interface**: it declares only what callers
  need. Everything else is `static` in the `.c`.
- One shared types header for the vocabulary types, owning nothing else.
- Include guards or `#pragma once` in every header. No header may depend on being included after
  another.
- The build file lists the modules explicitly, so the dependency graph is readable in one place.
- No global mutable state unless the platform forces it. When it does, isolate it in one file with a
  documented access discipline.

## Ownership by convention

- Every allocation has exactly one owner and one release path, and the header comment says who frees.
- Allocate and free at the same level of abstraction: the function that opens closes, or hands the
  responsibility over explicitly in its documented contract.
- Free on the error path too. That is what makes early returns safe. A single cleanup label at the end
  of a function beats five duplicated free sequences.
- Null the pointer after freeing it when the variable outlives the free.

## Errors

- **Check every fallible call**: allocation, read, write, open, socket operation, conversion. An
  unchecked return is where the crash comes from.
- One error convention for the whole project: a negative return, an out parameter, or an error enum.
  Pick one and never mix them.
- Report through the logging module, with the operation and the reason. Never a bare `printf` scattered
  through the code.

## Buffers and input

- Length before content, always. Bound every copy, every loop over external input, every index.
- Prefer the bounded functions and pass the real size of the destination, not the size you assumed.
- Validate what came off the wire or the bus before it reaches any parser.
- Zero-initialise structures that will be partly filled.

## Style

- Constants in a dedicated header, named for the concept. No magic literal for a port, a size, a
  timeout or an offset.
- Intent-revealing names, unabbreviated, even for locals that live more than three lines.
- One level of abstraction per function. A function that both parses and responds is two functions.
- Comment the why: the protocol quirk, the alignment requirement, the reason the obvious approach fails.

## Build and verification

- A single build definition (CMake or a Makefile) that a stranger can run from the README.
- Warnings on, and warnings treated as errors once the codebase is clean.
- Run the sanitizers (address, undefined behaviour) in development and in CI: they find the class of bug
  that unit tests never will.
- Test the pure parts on the host. When a project has no tests, say so in the README rather than
  implying coverage that does not exist.
