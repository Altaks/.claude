# IoT et embarqué

Microcontrollers, sensor nodes, acquisition systems, bare-metal games and firmware. Read with
`systems.md` (resources and performance) and `networking.md` (the uplink).

## Separate the hardware from the application

The single most valuable boundary on a constrained device:

```
HARD/ (or drivers/)   registers, GPIO, timers, display driver, interrupt handlers
APP/  (or game/, logic/)  the behaviour, which never touches a register directly
```

The application calls `display.drawSprite(...)` or `sensors.readTemperature()`, never a register
write. That is what lets you change the board, the screen or the sensor without touching the logic,
and what lets the logic be reasoned about on paper.

On a richer platform the same rule produces one module per peripheral, each with its own header:
presence sensor, air quality, temperature and humidity, LED, display, clock, storage, access point,
station mode, web server, uplink. Each exposes the intent (`isSomeonePresent()`), not the wiring.

## Configuration without reflashing

A device that needs a rebuild to change a network or a threshold is a device nobody can deploy.

- Persist the configuration in on-device storage, with a documented layout and a safe default when it
  is missing or corrupt.
- Expose a configuration surface: an access-point mode plus a small served web UI, a serial command
  set, or both. Keep the served assets as files rather than string literals in the firmware.
- Boot into a known-good state on first start, and make the reset-to-factory path explicit.
- Never hardcode credentials, endpoints or thresholds in the sources.

## Constrained resources

- Fixed-size buffers and static allocation where possible. Dynamic allocation on a microcontroller is
  a fragmentation problem waiting to happen.
- Know the stack budget, especially with interrupt handlers layered on top.
- Sleep aggressively when idle if the device is battery-powered; the duty cycle is a design parameter,
  not an afterthought.
- Bound every input coming off the wire or the bus before copying it anywhere.

## Interrupts and timing

- An interrupt handler does the minimum: read, store, set a flag. Everything else runs in the main
  loop.
- State shared between an interrupt and the main loop is declared as such and accessed under a
  documented discipline. This is the one place a global is defensible; isolate it in one file.
- Time comes from a timer, not from counting loop iterations. Blocking delays in the main loop are a
  design smell: prefer a scheduler based on elapsed time.
- A watchdog for anything unattended, and a reason to be confident it will actually fire.

## The uplink

- The device is the least reliable node in the system: assume the network drops, the server rejects,
  and the clock drifts.
- Buffer readings locally and send in batches with retries and backoff; drop the oldest under
  pressure, with a documented policy.
- Send typed, versioned payloads. A sensor reading carries its unit and its timestamp.
- Never trust the device on the server side: validate ranges, rate-limit per device, authenticate each
  one.
- Time synchronisation is explicit (network time, with a documented fallback), because correlated data
  from unsynchronised nodes is unusable.

## The whole system

An IoT project is at least three deliverables: the firmware, the backend that ingests, and the
interface that displays. Keep them in one repository or one documented set, with the payload contract
written down and shared, and a diagram of the acquisition chain from sensor to screen.

## Verification

- Unit-test the pure parts (decoding, thresholds, state machines) on the host, not on the device.
- A hardware-in-the-loop or manual test procedure is written down as an ordered checklist, since much
  of the behaviour cannot be automated. That checklist is part of the deliverable.
- Log over serial with levels, and keep the verbose paths compiled out of the shipped build.
