import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

/**
 * Syncs React state with localStorage
 * Automatically persists changes and initializes from storage
 * 
 * @example
 * const [apiKey, setApiKey] = useLocalStorage('api_key', '');
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
    // Initialize from localStorage or use default
    const [storedValue, setStoredValue] = useState<T>(() => {
        return storage.get(key, initialValue);
    });

    // Sync to localStorage on change
    useEffect(() => {
        storage.set(key, storedValue);
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}

/**
 * String-specific version (avoids JSON serialization overhead)
 */
export function useLocalStorageString(
    key: string,
    initialValue: string = ''
): [string, (value: string) => void] {
    const [storedValue, setStoredValue] = useState<string>(() => {
        return storage.getString(key, initialValue);
    });

    useEffect(() => {
        storage.setString(key, storedValue);
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}
