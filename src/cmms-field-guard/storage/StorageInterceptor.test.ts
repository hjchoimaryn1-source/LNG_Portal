// src/cmms-field-guard/storage/StorageInterceptor.test.ts
//
// No jsdom/happy-dom is installed in this repo (node-only vitest env), so a
// minimal in-memory Storage stand-in is used as `window` instead of a real
// DOM global, avoiding a new test-only dependency for this one guard file.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installFieldStorageGuard } from './StorageInterceptor';

function createRealStorageStub(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
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
}

describe('installFieldStorageGuard', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createRealStorageStub(),
      sessionStorage: createRealStorageStub(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('FIELD_CLIENT mode: setItem/getItem round-trips within the session via in-memory store', () => {
    const originalLocalStorage = window.localStorage;

    installFieldStorageGuard();

    window.localStorage.setItem('permitDraft', 'value');
    expect(window.localStorage.getItem('permitDraft')).toBe('value');

    window.sessionStorage.setItem('permitDraft', 'value');
    expect(window.sessionStorage.getItem('permitDraft')).toBe('value');

    // Confirm no writes reach the pre-guard (jsdom-backing-equivalent) stub.
    expect(originalLocalStorage.getItem('permitDraft')).toBeNull();
  });

  it('FIELD_CLIENT mode: removeItem/clear/key/length behave like real Storage', () => {
    installFieldStorageGuard();

    window.localStorage.setItem('a', '1');
    window.localStorage.setItem('b', '2');
    expect(window.localStorage.length).toBe(2);
    expect(window.localStorage.key(0)).toBe('a');

    window.localStorage.removeItem('a');
    expect(window.localStorage.getItem('a')).toBeNull();
    expect(window.localStorage.length).toBe(1);

    window.localStorage.clear();
    expect(window.localStorage.length).toBe(0);
  });

  it('DEV mode: real localStorage is untouched when guard is not installed', () => {
    window.localStorage.setItem('permitDraft', 'value');
    expect(window.localStorage.getItem('permitDraft')).toBe('value');
  });
});
