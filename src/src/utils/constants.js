/**
 * localStorage key names used across the app.
 * Import from here — never hard-code key strings inline.
 */

// ── Schema versioning ────────────────────────────────────────────────────────
/** Increment this whenever the localStorage schema changes in a breaking way */
export const SCHEMA_VERSION = 2;
export const SRA_SCHEMA_VERSION_KEY = 'sra_schema_version';

// ── Core data keys ────────────────────────────────────────────────────────────
export const SRA_SESSION = 'sra_session';
export const SRA_SHOPPING_LISTS = 'sra_shopping_lists';

// ── New in v2 ─────────────────────────────────────────────────────────────────
/** Custom products added/edited by the shopkeeper (merged with catalog.json at runtime) */
export const SRA_CATALOG_OVERRIDES = 'sra_catalog_overrides';

/** User preferences: currency, style, role */
export const SRA_PREFERENCES = 'sra_preferences';

/** App role: 'customer' | 'shopkeeper' */
export const SRA_ROLE = 'sra_role';
