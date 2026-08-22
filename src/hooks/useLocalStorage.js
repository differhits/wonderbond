import { useState, useEffect } from 'react';

/**
 * useLocalStorage — drop-in replacement for useState that persists to localStorage.
 * Falls back to initialValue on first load or parse error.
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      console.warn(`useLocalStorage: failed to write "${key}"`, err);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
