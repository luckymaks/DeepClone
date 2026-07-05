// Runs deepCloneWithHeapLimit at a given depth, in its own process.
// A V8 "heap out of memory" error is a fatal process abort, not a
// catchable JS exception — this has to run isolated so a crash at
// one depth doesn't take down the test runner or other test cases.
//
// Usage: node run-naive-clone.mjs <depth>
// On success: prints the runtime in ms to stdout, exits 0.
// On heap exhaustion: process aborts with a non-zero exit code
// and V8's fatal error text on stderr — the caller checks for that.

import { createBigObject } from "../createBigObject.js";
import { deepCloneWithHeapLimit } from "../deepClone.js";

const depth = Number(process.argv[2]);
if (!Number.isInteger(depth) || depth < 0) {
  console.error(`Invalid depth argument: ${process.argv[2]}`);
  process.exit(2);
}

const t0 = performance.now();
deepCloneWithHeapLimit(createBigObject(depth));
const duration = performance.now() - t0;

process.stdout.write(String(duration));
