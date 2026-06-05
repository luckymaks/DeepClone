export function createBigObject(maxDepth) {
    const massiveData = {
        data: "A".repeat(1024),
        metadata: new Array(1024).fill("random-value"),
    };

    const cache = new Map();

    function build(currentDepth) {
        if (currentDepth >= maxDepth) {
            return massiveData;
        }

        if (cache.has(currentDepth)) {
            return cache.get(currentDepth);
        }

        const siblingNode = build(currentDepth + 1);

        const node = {
            id: `level-${currentDepth}`,
            branchA: siblingNode,
            branchB: siblingNode,
            branchC: siblingNode,
            branchD: siblingNode
        };

        cache.set(currentDepth, node);
        
        return node;
    }

    return build(0);
}