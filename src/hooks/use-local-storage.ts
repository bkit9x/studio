
"use client";

import { useState, useEffect, useCallback } from 'react';

// Custom event to notify other components using the same local storage key
const dispatchStorageEvent = (key: string, newValue: any) => {
  if (typeof window !== 'undefined') {
    // We use a custom event name to avoid conflicts and to signify it's an app-internal event
    window.dispatchEvent(new CustomEvent(`app-storage-${key}`, { detail: newValue }));
  }
};


export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const isClient = typeof window !== 'undefined';

  // Read value from localStorage
  const readValue = useCallback((): T => {
    if (!isClient) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) as T : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [isClient, initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  // This effect runs once on mount to initialize the state from localStorage.
  useEffect(() => {
    setStoredValue(readValue());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (!isClient) {
        console.warn('Attempted to set localStorage value on the server.');
        return;
      }
      try {
        const valueToStore = value instanceof Function ? value(readValue()) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        setStoredValue(valueToStore);
        dispatchStorageEvent(key, valueToStore);
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [isClient, key, readValue]
  );
  
  // Listen for changes to the local storage from other tabs/windows or our custom event
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent | CustomEvent) => {
      let eventKey;
      let eventNewValue;

      if (event instanceof StorageEvent) {
          eventKey = event.key;
          eventNewValue = event.newValue;
      } else if (event instanceof CustomEvent) {
          eventKey = key; // Custom event is keyed by its name listener
          eventNewValue = JSON.stringify(event.detail);
      }

      if (eventKey === key && eventNewValue) {
        try {
            setStoredValue(JSON.parse(eventNewValue));
        } catch (error) {
            console.warn(`Error parsing storage event value for key "${key}":`, error);
        }
      }
    };

    if (isClient) {
      const customEventName = `app-storage-${key}`;
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener(customEventName, handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener(customEventName, handleStorageChange);
      };
    }
  }, [key, isClient]);

  return [storedValue, setValue];
}
