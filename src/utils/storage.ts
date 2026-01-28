/**
 * Safe localStorage wrapper with error handling
 * Prevents crashes from quota exceeded, private mode, etc.
 */
export const storage = {
    /**
     * Get a JSON-parsed value from localStorage
     */
    get<T>(key: string, fallback: T): T {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch {
            return fallback;
        }
    },

    /**
     * Get a string value from localStorage
     */
    getString(key: string, fallback: string = ''): string {
        try {
            return localStorage.getItem(key) ?? fallback;
        } catch {
            return fallback;
        }
    },

    /**
     * Set a value in localStorage (JSON.stringify)
     */
    set<T>(key: string, value: T): boolean {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set failed:', e);
            return false;
        }
    },

    /**
     * Set a string value in localStorage
     */
    setString(key: string, value: string): boolean {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.error('Storage set failed:', e);
            return false;
        }
    },

    /**
     * Remove a key from localStorage
     */
    remove(key: string): boolean {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Clear all localStorage
     */
    clear(): boolean {
        try {
            localStorage.clear();
            return true;
        } catch {
            return false;
        }
    },
};
