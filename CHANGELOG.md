# Changelog

## v1.1.0

- Add: Added `create_memo`, a read-only wrapper around `create_signal`.
- Change: Ref syntax now requires explicit strategy; use `ref: ["on_create", signal.set]` instead of `ref: () => signal.set`. Old syntax deprecated.
- Known issue: `create_memo` and `create_signal` computations are not memoized (#1).

## v1.0.3

- Fix: Setting attribute to `undefined` was using the string "undefined" instead of removing the attribute.

## v1.0.2

- Fix: Individual entries inside render arrays were not reactive.

## v1.0.1

- Better handling for raw strings. Strings are treated as text nodes more consistently.

## v1.0.0

- Initial publish.
