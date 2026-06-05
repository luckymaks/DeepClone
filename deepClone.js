export function deepCloneWithHeapLimit(object) {
    if (object === null || typeof object !== 'object') {
        return object;
    }

    const result = Array.isArray(object) ? [] : {};

    for (const key in object) {
      result[key] = deepCloneWithHeapLimit(object[key]);
    }

    return result;
}

export function deepClone(object, cache = new WeakMap()) {
    if (object === null || typeof object !== 'object') {
        return object;
    }

    if (cache.has(object)) {
        return cache.get(object);
    }

    const clone = Array.isArray(object) ? [] : {};
    cache.set(object, clone);


    for (const key of Object.keys(object)) {
        clone[key] = deepClone(object[key], cache);
    }
    
    return clone;
}