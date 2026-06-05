# The alternitive of DeepClone funciton.

## Files:

**main.js** - the main file where a big object is created and run deepClone funciton.

**createBigObject.js** - generats an object with nested objects based on `maxDepth` param.

**deepClone.js** - the alternative function of deeping clone:
1. **deepCloneWithHeapLimit(object)** - basic/simple deepClone function. When run it, the proccess will be crushed with "heap out of memory" error.
2. **deepClone(objct)** - the improved function that uses *new WeakMap()* that allows avoid getting an error `heap out of memory`.

## To run the `main()` function use:
```
node main.js
```

When the command is run, in the console will be `success result`. It means that `main.js` file runs `deepClone()` function by default.

Open `main.js` file and comment `main()`, then uncomment `main(runWithHeapOutOfMemory)`. After that run `node main.js` and the proccess will be crushed with `heap out of memory` error.