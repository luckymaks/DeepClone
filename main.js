import { createBigObject } from "./createBigObject.js";
import { deepClone, deepCloneWithHeapLimit } from "./deepClone.js";

const runWithHeapOutOfMemory = "withHeapOutOfMemory";
const maxDepth = 200; // Change maxDepth (e.g use 5) to see "deepCloneWithHeapLimit" works without "heap out of memory".

function main(cloneType) {
    const bomb = createBigObject(maxDepth);
    let clonedObject = {};

    console.time("Clone execution runtime");
    switch (cloneType) {
        case runWithHeapOutOfMemory: {
            // console.info(`Run cloning with "heap out of memory" and maxDepth is: ${maxDepth}`);

            clonedObject = deepCloneWithHeapLimit(bomb);
            break;
        }
        default: {
            // console.info(`Run cloning without "heap out of memory" and maxDepth is: ${maxDepth}`);
            clonedObject = deepClone(bomb)
        }
    }
    console.timeEnd("Clone execution runtime"); // Different runtime for main() and main(runTypeWithoutHeap).
}


main() // Run "deepClone" function with avoiding "heap out of memory".
// main(runWithHeapOutOfMemory) // Run "deepCloneWithHeapLimit" function with "heap out of memory".
