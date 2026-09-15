/**
 * Thin localStorage utility.
 * All reads/writes go through here — never call localStorage directly.
 * Every operation is JSON-safe and catches storage quota errors gracefully.
 */

/**
 * Read an item from localStorage and JSON-parse it.
 * Returns null if the key doesn't exist or JSON is invalid.
 */
export function getItem(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * JSON-stringify a value and write it to localStorage.
 * Returns true on success, false if storage is full or unavailable.
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Quota exceeded or private-browsing restriction — fail silently
    return false;
  }
}

/**
 * Remove a single key from localStorage.
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Remove all keys that start with the given namespace prefix.
 * Useful for clearing all SRA-related data at once.
 */
export function clearNamespace(prefix) {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
