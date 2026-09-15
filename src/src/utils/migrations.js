/**
 * localStorage migration utility.
 * Run once at app startup. If the stored schema version is older than SCHEMA_VERSION,
 * clear stale data that would crash the new code and write the new version.
 *
 * This is intentionally conservative: we clear chat sessions (small loss) rather than
 * risk a crash from shape mismatches. Shopping lists and catalog overrides are preserved
 * where possible, cleared only if the shape is irrecoverably wrong.
 */

import { getItem, setItem, removeItem } from './storage.js';
import {
  SCHEMA_VERSION,
  SRA_SCHEMA_VERSION_KEY,
  SRA_SESSION,
  SRA_CATALOG_OVERRIDES,
  SRA_PREFERENCES,
} from './constants.js';

export function runMigrations() {
  const stored = getItem(SRA_SCHEMA_VERSION_KEY) ?? 0;

  if (stored === SCHEMA_VERSION) return; // nothing to do

  console.info(`[migration] Upgrading localStorage schema from v${stored} to v${SCHEMA_VERSION}`);

  if (stored < 2) {
    // v1 → v2: chat session shape changed (phase field added), clear it
    removeItem(SRA_SESSION);

    // Preferences didn't exist — initialize defaults
    const existing = getItem(SRA_PREFERENCES);
    if (!existing) {
      setItem(SRA_PREFERENCES, { currency: 'GBP', style: 'modern' });
    }

    // Catalog overrides: if old shape (array vs object), clear it
    const overrides = getItem(SRA_CATALOG_OVERRIDES);
    if (overrides && !Array.isArray(overrides)) {
      removeItem(SRA_CATALOG_OVERRIDES);
    }
  }

  setItem(SRA_SCHEMA_VERSION_KEY, SCHEMA_VERSION);
}
