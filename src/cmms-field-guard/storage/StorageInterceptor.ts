// src/cmms-field-guard/storage/StorageInterceptor.ts
//
// FIELD_CLIENT deterrent only: replaces window.localStorage/sessionStorage
// with a no-op Proxy so casual persistence to disk is silently discarded on
// shared field terminals. This is a best-effort in-session deterrent, not a
// security boundary — a user with DevTools access before this guard installs
// (e.g. a race at page load) or via a browser extension could bypass it.
// Callers must invoke this explicitly once isField is known; it must never
// self-invoke on module load, since DEV mode must keep real storage.

function createNoopStorage(): Storage {
  const noop: Storage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    get length() {
      return 0;
    },
  };
  return noop;
}

function lockStorage(propertyName: 'localStorage' | 'sessionStorage'): void {
  const noopStorage = createNoopStorage();
  Object.defineProperty(window, propertyName, {
    configurable: true,
    get: () => noopStorage,
  });
}

export function installFieldStorageGuard(): void {
  if (typeof window === 'undefined') {
    return;
  }
  lockStorage('localStorage');
  lockStorage('sessionStorage');
}
