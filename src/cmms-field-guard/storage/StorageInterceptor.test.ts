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

  it('FIELD_CLIENT mode: setItem/getItem round-trip returns null after guard install', () => {
    installFieldStorageGuard();

    window.localStorage.setItem('permitDraft', 'value');
    expect(window.localStorage.getItem('permitDraft')).toBeNull();

    window.sessionStorage.setItem('permitDraft', 'value');
    expect(window.sessionStorage.getItem('permitDraft')).toBeNull();
  });

  it('DEV mode: real localStorage still works when guard is not installed', () => {
    window.localStorage.setItem('permitDraft', 'value');
    expect(window.localStorage.getItem('permitDraft')).toBe('value');
  });
});
