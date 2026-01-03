
// Accessing indexedDB on the server causes a ReferenceError in some dependencies.
// We polyfill it with a no-op implementation for SSR.

if (typeof window === "undefined" && typeof global !== "undefined") {
    const noop = () => { };
    const dummyIDBRequest = {
        result: null,
        error: null,
        source: null,
        transaction: null,
        readyState: "done",
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: () => false,
    };

    const dummyIDB = {
        open: () => dummyIDBRequest,
        deleteDatabase: () => dummyIDBRequest,
        cmp: () => 0,
        databases: () => Promise.resolve([]),
    };

    // @ts-ignore
    if (!global.indexedDB) {
        // @ts-ignore
        global.indexedDB = dummyIDB;
    }

    // @ts-ignore
    if (!global.IDBKeyRange) {
        // @ts-ignore
        global.IDBKeyRange = { bound: noop, lowerBound: noop, upperBound: noop, only: noop };
    }
}
