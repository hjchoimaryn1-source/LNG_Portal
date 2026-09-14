// src/cmms-field-guard/storage/StorageInterceptor.ts
//
// FIELD_CLIENT deterrent only: replaces window.localStorage/sessionStorage
// with an in-memory, Map-backed Storage-compatible store so field-session
// state (tab switches, in-progress form drafts) still round-trips normally,
// but nothing ever touches disk, IndexedDB, or any browser persistence API.
// NOTE FOR HJ: on page refresh/reload this in-memory store resets (expected,
// since it never touches disk) — intended "zero disk trace on exit"
// behavior, but in-progress field-entry state does not survive a manual
// refresh. Flag this UX trade-off if it becomes an issue in practice.
// This is a best-effort in-session deterrent, not a security boundary — a
// user with DevTools access before this guard installs (e.g. a race at page
// load) or via a browser extension could bypass it. Callers must invoke this
// explicitly once isField is known; it must never self-invoke on module
// load, since DEV mode must keep real storage.

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  return memoryStorage;
}

function lockStorage(propertyName: 'localStorage' | 'sessionStorage'): void {
  const memoryStorageInstance = createMemoryStorage();
  Object.defineProperty(window, propertyName, {
    configurable: true,
    get: () => memoryStorageInstance,
  });
}

export function installFieldStorageGuard(): void {
  if (typeof window === 'undefined') {
    return;
  }
  lockStorage('localStorage');
  lockStorage('sessionStorage');
}
