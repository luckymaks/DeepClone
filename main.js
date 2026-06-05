import { createBigObject } from "./createBigObject.js";
import { deepClone, deepCloneWithHeapLimit } from "./deepClone.js";

const runWithHeapOutOfMemory = "withHeapOutOfMemory";
function main(cloneType) {
    const bomb = createBigObject(200); // Chenge maxDepth (e.g use 5) to see "deepCloneWithHeapLimit" works without "heap out of memory".
    let clonedObject = {};

    console.time("Clone execution runtime");
    switch (cloneType) {
        case runWithHeapOutOfMemory: {
            clonedObject = deepCloneWithHeapLimit(bomb);
            break;
        }
        default: {
            clonedObject =deepClone(bomb)
        }
    }
    console.timeEnd("Clone execution runtime"); // Different runtime for main() and main(runTypeWithoutHeap).
}


main() // Run "deepClone" function with avoiding "heap out of memory".
//main(runWithHeapOutOfMemory) // Run "deepCloneWithHeapLimit" function with "heap out of memory".
