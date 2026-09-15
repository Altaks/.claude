# Java

Used where the platform or the interop demands it: reflection, native bindings, events, item and
message builders, legacy targets. New code goes in the project's primary language unless one of those
reasons applies.

## Modelling

- **Enums with behaviour** for a closed set of variants: an abstract method on the enum and a body per
  constant. This is how you get polymorphism over a fixed set without an `instanceof` ladder, and it is
  the Java counterpart to a sealed hierarchy.
- **`default` methods** to evolve an interface or share behaviour without breaking implementers.
- **Functional interfaces** (`Function`, `Predicate`, `Supplier`, `Consumer`) for strategy and callback
  seams, instead of hand-rolled single-method interfaces.
- **Immutability without records** on an old target: final fields set once in the constructor, no
  setters, and read-only views handed out (`Collections.unmodifiableList`). Where the project already
  uses an annotation processor or an immutable-collections library, use it.

## Absence and errors

- `Optional` for a return value that may be absent. Never `null` as a documented return.
- Return an empty collection, never `null`, so callers do not have to null-check a collection.
- Check every fallible call. A swallowed exception is a bug with a delay fuse; log it with context.
- Custom exceptions carry the situation, not the transport status.

## Standard library

- **`java.time`** for anything date or time related. The legacy date and calendar classes are out.
- **try-with-resources** for anything closeable, over manual finally blocks.
- **Method references** (`User::getName`) over a lambda that only forwards a call.
- Streams and lambdas where they clarify intent, but keep plain loops on hot paths where the stream and
  lambda allocation cost adds up. Measure before choosing.
- Reach for the JDK before adding a dependency: `java.util`, `java.util.concurrent`,
  `java.util.regex` and `java.time` cover an enormous amount.
- **Keep Java sources JDK-native.** Do not call into another runtime's standard library from Java: it
  adds a dependency edge for something the JDK already expresses.

## Interop and platform work

- When Java exists only for reflection or native access, isolate it: one package, documented, with the
  version it is pinned to. Do not "modernise" a version-pinned mapping.
- Methods the platform invokes reflectively must keep the visibility it expects, even when the project
  otherwise defaults to the narrowest one. Comment why.
- Constants live in a dedicated holder, never as literals repeated across call sites.
- Fields and methods carry the same naming discipline as the rest of the project: intent-revealing,
  unabbreviated.

## Layout and build

- One package per concern, mirroring the project's feature split rather than a technical split.
- Target and toolchain pinned in the build file, not assumed from the developer's machine.
- Plugin or module metadata generated from the build configuration where the ecosystem supports it, so
  a declaration in code and a declaration in metadata cannot drift.
- Formatter and static analysis configuration committed, and part of the gate.

## Tests

JUnit 5, mocks for collaborators you own, and the same doctrine as everywhere: assert the exact signal,
prove the test bites by reverting the change, never mock the thing under test.
