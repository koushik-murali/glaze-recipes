/**
 * Generate a UUID v4 string
 * Compatible with all browsers including older mobile browsers
 */
export function generateUUID(): string {
  // Try to use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a shorter ID for temporary use
 * Useful for client-side only IDs that don't need full UUID format
 */
export function generateShortId(): string {
  return Math.random().toString(36).substr(2, 9);
}
