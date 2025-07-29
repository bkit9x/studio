
"use client";

import { useState, useEffect, useCallback } from 'react';

// Custom event to notify other components using the same local storage key
const dispatchStorageEvent = (key: string, newValue: any) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(newValue) }));
  }
};


export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const isClient = typeof window !== 'undefined';

  const readValue = useCallback((): T => {
    if (!isClient) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [isClient, initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        dispatchStorageEvent(key, valueToStore); // Dispatch event on change
      }
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [isClient, key, storedValue]);
  
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  // Listen for changes to the local storage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        setStoredValue(JSON.parse(event.newValue));
      }
    };

    if (isClient) {
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [key, isClient]);

  return [storedValue, setValue];
}
