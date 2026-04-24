/**
 * Wrapper for localStorage to prevent crashes in private modes or restricted environments
 */
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Storage access denied', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Storage write denied', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage remove denied', e);
    }
  },
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Storage clear denied', e);
    }
  },
  parseJSON: <T>(key: string, fallback: T): T => {
    try {
      const data = safeStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }
};
