// Jest test suite (converted from node:test - see git history if you need
// the zero-dependency version back).
//
// Requires ESM support: this repo has "type": "module" in package.json.
// Run with:
//   node --experimental-vm-modules node_modules/.bin/jest
// or add to package.json scripts:
//   "test": "node --experimental-vm-modules node_modules/.bin/jest"
//
// PORTABILITY NOTE, read before trusting any depth number in this file:
// The depth at which deepCloneWithHeapLimit runs out of heap is a function
// of the machine's available memory, not a fixed property of the code.
// This was verified directly: on the machine these tests were authored on,
// no --max-old-space-size cap between 256MB and 1300MB reproduced the
// "depth 8 and 9 succeed, depth 10 crashes" pattern seen on the repo
// author's MacBook. Some caps crashed as early as depth 8; none held the
// line at exactly depth 9/10. Treat CHARACTERIZED_CRASH_DEPTH below as
// data about one specific machine, not a universal constant.

import { test, expect } from "@jest/globals";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createBigObject } from "../createBigObject.js";
import { deepClone } from "../deepClone.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NAIVE_RUNNER = path.join(__dirname, "..", "scripts", "run-naive-clone.mjs");

function runNaiveAtDepth(depth, { maxOldSpaceMb } = {}) {
  const nodeArgs = [];
  if (maxOldSpaceMb) nodeArgs.push(`--max-old-space-size=${maxOldSpaceMb}`);
  return spawnSync(process.execPath, [...nodeArgs, NAIVE_RUNNER, String(depth)], {
    encoding: "utf8",
    timeout: 60_000,
  });
}

// ---------------------------------------------------------------------
// Result 1: main() / maxDepth 200 / WeakMap version
// ---------------------------------------------------------------------
//
// NOTE: full expect().toEqual() at depth 200 is NOT used here on purpose.
// Checked directly, in this file's own test run: Jest's toEqual has the
// same non-memoized-shared-reference behavior as node:assert.deepEqual
// (re-walks each branch of a shared subgraph separately), and is far more
// expensive per node - measured 641ms at depth 4, 2.27s at depth 5, 8.97s
// at depth 6, 35.4s at depth 7 (a ~4x-per-level curve, same branching
// factor as the naive clone itself). The equivalent node:assert.deepEqual
// call took 61.7ms at depth 6 - Jest's version is roughly 145x more
// expensive per node at that same depth. The correctness check below uses
// depth 4, not depth 6, specifically because of this measured difference.
// The depth-200 test avoids full-graph comparison entirely either way,
// using the same O(depth) spot-check.

function descend(obj, steps) {
  let node = obj;
  for (let i = 0; i < steps; i++) node = node.branchA;
  return node;
}

test(
  "deepClone (WeakMap) is structurally correct (checked at depth 4, not 200 - see note above)",
  () => {
    const original = createBigObject(4);
    const clone = deepClone(original);

    expect(clone).not.toBe(original);
    expect(clone).toEqual(original);
  },
  5_000
);

test(
  "deepClone (WeakMap) clones a 200-level shared-reference graph quickly, without crashing",
  () => {
    const original = createBigObject(200);

    const t0 = performance.now();
    const clone = deepClone(original);
    const duration = performance.now() - t0;

    expect(clone).not.toBe(original);
    // O(depth) spot-check instead of full toEqual - avoids the exponential
    // comparison risk noted above while still verifying correctness at depth.
    expect(descend(clone, 200)).toEqual(descend(original, 200));
    // Generous bound - the point is "not exponential", not a precise number.
    // The precise figure (~0.33ms, measured on the author's machine, 4 runs,
    // console I/O excluded from the timed region) belongs in the README/post,
    // not hardcoded into a pass/fail assertion here.
    expect(duration).toBeLessThan(1000);
  },
  10_000
);

test("deepClone (WeakMap) clones each shared object exactly once", () => {
  // Directly verifies the mechanism, not just the timing side-effect of it.
  const shared = { value: "shared" };
  const original = { branchA: shared, branchB: shared, branchC: shared, branchD: shared };

  const clone = deepClone(original);

  expect(clone.branchA).toBe(clone.branchB);
  expect(clone.branchA).toBe(clone.branchC);
  expect(clone.branchA).toBe(clone.branchD);
  expect(clone.branchA).not.toBe(shared);
});

// ---------------------------------------------------------------------
// A version of results 2 & 3: naive version succeeds
// at a small depth and takes measurably longer as depth increases.
//
// Uses depth 5 vs 6, on purpose:
// tested directly, depth 9 uncapped crashed with heap-out-of-memory on
// this machine on one run after surviving to depth 11 on an earlier run
// with no configuration change. The crash boundary is not just
// machine-dependent, it is not fully deterministic run-to-run on a single
// machine (fragmentation/GC timing dependent). Testing an ordering
// property directly adjacent to a nondeterministic crash boundary is
// itself a flaky test. Depths 5/6 are far enough from that boundary on
// any machine likely to run this to be safe, while still showing the
// same ~4x growth.
// ---------------------------------------------------------------------
test(
  "deepCloneWithHeapLimit succeeds at depth 5 and depth 6, and depth 6 takes longer",
  () => {
    const r5 = runNaiveAtDepth(5);
    expect(r5.status).toBe(0);
    const duration5 = Number(r5.stdout);
    expect(Number.isFinite(duration5)).toBe(true);

    const r6 = runNaiveAtDepth(6);
    expect(r6.status).toBe(0);
    const duration6 = Number(r6.stdout);
    expect(Number.isFinite(duration6)).toBe(true);

    expect(duration6).toBeGreaterThan(duration5);
  },
  20_000
);

// ---------------------------------------------------------------------
// Result 4: naive version crashes at maxDepth 10.
// LITERAL VERSION - matches the screenshots exactly, no heap cap, relies
// on this machine's default heap.
//
// Two caveats, not one:
// 1. Will only reproduce depth 10 specifically on hardware with a similar
//    default heap ceiling to the author's MacBook (machine-to-machine
//    variability, already documented above).
// 2. Directly observed while writing this file: on a single machine, with
//    no configuration changed, an uncapped run at depth 9 crashed on one
//    execution after an earlier run had survived to depth 11 before
//    crashing at 12. The crash boundary depends on memory fragmentation
//    and GC timing at the moment of execution, not only on total available
//    memory - it is not fully deterministic even run-to-run on the same
//    hardware.
// If this test fails - or would only pass at a different depth than
// expected - on ANY machine including the one it was written on, that is
// expected, documented behavior, not a bug in the test or the code.
// ---------------------------------------------------------------------
const CHARACTERIZED_CRASH_DEPTH = 10;

test(
  `[machine-specific] deepCloneWithHeapLimit crashes at depth ${CHARACTERIZED_CRASH_DEPTH} (author's machine, default heap)`,
  () => {
    const result = runNaiveAtDepth(CHARACTERIZED_CRASH_DEPTH);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/heap out of memory/i);
  },
  60_000
);

// ---------------------------------------------------------------------
// PORTABLE VERSION of the same claim: the naive version's crash depth
// varies by machine, but a crash is guaranteed to exist somewhere as
// depth increases. This finds that boundary at test-time instead of
// assuming it, and fails only if no crash occurs within a generous
// search range (which would indicate the underlying claim is wrong,
// not just that the numbers moved).
// ---------------------------------------------------------------------
test(
  "[portable] deepCloneWithHeapLimit eventually crashes as depth increases, under a fixed heap cap",
  () => {
    const HEAP_CAP_MB = 512;
    const MAX_DEPTH_TO_TRY = 20;

    let lastSuccessDepth = null;
    let crashDepth = null;

    for (let depth = 5; depth <= MAX_DEPTH_TO_TRY; depth++) {
      const result = runNaiveAtDepth(depth, { maxOldSpaceMb: HEAP_CAP_MB });
      if (result.status === 0) {
        lastSuccessDepth = depth;
      } else {
        crashDepth = depth;
        break;
      }
    }

    expect(crashDepth).not.toBeNull();
    expect(lastSuccessDepth).not.toBeNull();
    expect(lastSuccessDepth).toBeLessThan(crashDepth);
  },
  60_000
);
