# DeepClone

A deep clone implementation that avoids the exponential blowup naive recursive solutions hit when an object graph has heavily shared references — not just circular ones.

## The problem

A standard recursive deep clone re-clones every reference it walks into, with no check for whether it already cloned that exact object. If the same nested object is reachable through multiple properties — shared config, cached lookups, normalized state — the naive version clones it once per path instead of once total. With enough sharing and depth, that's exponential work, and the process runs out of heap.

## Files

- `createBigObject.js` — builds a test object with 4 branches per level, where all 4 branches at a given level point to the exact same nested object. No circular references. Just heavy reference sharing, deep enough to force the naive version to fail.
- `deepClone.js`
  - `deepCloneWithHeapLimit(object)` — naive recursive version. Crashes with a heap out-of-memory error once the shared graph is deep enough. The exact depth depends on your machine's available heap.
  - `deepClone(object)` — fixed version. Uses a `WeakMap` to track objects already cloned by reference, so any object is cloned exactly once no matter how many places point to it.

## Run it

```
node main.js
```

This runs `deepClone()` (the `WeakMap` version) by default, on a 200-level-deep shared-reference graph. It finishes in a couple of milliseconds and logs the runtime via `console.time`/`console.timeEnd` — no other output.

To see the naive version fail: open `main.js`, comment out `main()`, uncomment `main(runWithHeapOutOfMemory)`, and run it again. It will crash with a heap out-of-memory error once it hits your machine's memory ceiling.

## Why WeakMap and not Map

A `Map` would work functionally, but it holds strong references to every object passed through it, keeping them from being garbage collected for the life of the cache. `WeakMap` holds weak references, so once nothing else points to the original object, the cache entry can be collected too.

## License

MIT
